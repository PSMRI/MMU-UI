import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { Observable, of, Subject, EMPTY } from 'rxjs';
import { Router } from '@angular/router';
import { throwError } from 'rxjs/internal/observable/throwError';
import { SpinnerService } from './spinner.service';
import { ConfirmationService } from './confirmation.service';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class HttpInterceptorService implements HttpInterceptor {
  private sessionTimeoutRef: any;
  private pendingRequests = 0;
  private isHandlingSessionExpiry = false;
  private logoutMessageShown = false;

  currentLanguageSet: any;
  donotShowSpinnerUrl = [
    environment.syncDownloadProgressUrl,
    environment.ioturl,
  ];

  constructor(
    private spinnerService: SpinnerService,
    private router: Router,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private http: HttpClient,
    private cookieService: CookieService
  ) {
    // Reset state when navigating to login
    this.router.events.subscribe((event: any) => {
      if (event.url === '/login') {
        this.resetSessionState();
      }
    });
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const isLoginRequest =
      req.url && req.url.toLowerCase().includes('user/userAuthenticate');

    this.pendingRequests++;
    const key: any = sessionStorage.getItem('key');
    const serverKey = this.sessionstorage.getItem('serverKey');
    let modifiedReq = req;
    const isPlatformFeedback =
      req.url && req.url.toLowerCase().includes('/platform-feedback');

    if (isPlatformFeedback) {
      const headers = req.headers
        .delete('Authorization')
        .set('Content-Type', 'application/json');
      modifiedReq = req.clone({ headers });
    } else {
      if (req.body instanceof FormData) {
        modifiedReq = req.clone({
          headers: req.headers.set('Authorization', key || ''),
        });
      } else {
        modifiedReq = req.clone({
          headers: req.headers
            .set('Authorization', key || '')
            .set('Content-Type', 'application/json')
            .set('ServerAuthorization', serverKey || ''),
        });
      }
    }

    return next.handle(modifiedReq).pipe(
      tap((event: HttpEvent<any>) => {
        if (req.url !== undefined && !req.url.includes('cti/getAgentState')) {
          this.spinnerService.setLoading(true);
        }
        if (event instanceof HttpResponse) {
          // Reset session expiry state on successful login
          if (isLoginRequest && event.status === 200) {
            this.resetSessionState();
          }
          this.onSuccess(req.url, event.body);
          return event.body;
        }
      }),

      catchError((error: HttpErrorResponse) => {
        // Set flag IMMEDIATELY before any async operations
        let sessionExpired = false;

        if (!this.isHandlingSessionExpiry) {
          if (error.status === 401) {
            this.isHandlingSessionExpiry = true;
            sessionExpired = true;
            this.handleSessionExpiry('Unauthorized: Session has expired.');
          } else if (error.status === 200 && error.error?.statusCode === 5002) {
            this.isHandlingSessionExpiry = true;
            sessionExpired = true;
            // Extract error message properly, ensuring it's a string
            const rawErrorMsg =
              error.error?.errorMessage ||
              'Session has expired. Please login again.';
            const errorMsg = this.getErrorMessage(rawErrorMsg);
            this.handleSessionExpiry(errorMsg);
          }
        }

        // If session is expired, don't propagate the error to components
        // If not session expiry, let components handle the error
        this.spinnerService.setLoading(false);

        if (sessionExpired) {
          // Return empty observable to prevent error from reaching components
          return EMPTY;
        }

        return throwError(error);
      }),

      finalize(() => {
        this.pendingRequests--;
        if (this.pendingRequests === 0) {
          this.spinnerService.setLoading(false);
        }
      })
    );
  }

  /**
   * Public method to check if session expiry is being handled
   * Components should check this before showing error dialogs
   */
  public isSessionExpiryInProgress(): boolean {
    return this.isHandlingSessionExpiry;
  }

  /**
   * Convert error to string message, handling object errors
   */
  private getErrorMessage(error: any): string {
    try {
      // If already a string, return it
      if (typeof error === 'string') {
        return error && error.trim().length > 0
          ? error
          : 'Your session has expired. Please login again.';
      }

      // If it's an object with a message property
      if (error && typeof error === 'object') {
        if (error.message && typeof error.message === 'string') {
          return error.message;
        }
        if (error.errorMessage && typeof error.errorMessage === 'string') {
          return error.errorMessage;
        }
        if (error.error && typeof error.error === 'string') {
          return error.error;
        }
      }

      // Default message
      return 'Your session has expired. Please login again.';
    } catch (err) {
      console.error('Error extracting message:', err);
      return 'Your session has expired. Please login again.';
    }
  }

  /**
   * Handle session expiry with atomic lock to prevent race conditions
   */
  private handleSessionExpiry(errorMessage: string): void {
    // Atomic check and set to prevent race conditions
    if (this.isHandlingSessionExpiry) {
      this.confirmationService.dialog.closeAll();
      this.confirmationService.alert(
        'Session has expired. Please login again.',
        'error'
      );
      this.router.navigate(['/login']);
      return;
    }

    this.isHandlingSessionExpiry = true;
    this.clearSessionTimeoutTimer();

    // Clear all storage immediately
    sessionStorage.clear();
    this.sessionstorage.clear();

    // Ensure error message is a string
    const displayMessage = this.getErrorMessage(errorMessage);

    // Navigate to login immediately with error handling
    try {
      this.router
        .navigate(['/login'])
        .then((navigated: boolean) => {
          if (!navigated) {
            console.error('Navigation to login failed');
          }

          // Show error dialog after navigation is complete
          if (!this.logoutMessageShown) {
            this.logoutMessageShown = true;
            setTimeout(() => {
              try {
                this.confirmationService
                  .alert(displayMessage, 'error')
                  .afterClosed()
                  .subscribe(
                    () => {
                      // Dialog closed
                      console.log('Session expiry dialog closed');
                    },
                    (dialogError: any) => {
                      console.error('Error in dialog:', dialogError);
                    }
                  );
              } catch (dialogErr) {
                console.error(
                  'Failed to show session expiry dialog:',
                  dialogErr
                );
              }
            }, 300);
          }
        })
        .catch((navError: any) => {
          console.error('Navigation error:', navError);
        });
    } catch (err) {
      console.error('Error during session expiry handling:', err);
    }
  }

  /**
   * Reset session state when user successfully logs in or navigates to login
   */
  private resetSessionState(): void {
    this.isHandlingSessionExpiry = false;
    this.logoutMessageShown = false;
    this.clearSessionTimeoutTimer();
  }

  /**
   * Handle successful responses and manage session timeout timer
   */
  private onSuccess(url: string, response: any): void {
    // Restart session timeout timer only for successful authenticated requests
    if (this.isValidAuthenticatedResponse(response, url)) {
      this.resetSessionTimeoutTimer();
    }
  }

  /**
   * Validate if response is from an authenticated request
   */
  private isValidAuthenticatedResponse(response: any, url: string): boolean {
    // Don't restart timer for login/authentication endpoints
    if (url && url.indexOf('user/userAuthenticate') >= 0) {
      return false;
    }

    // Exclude platform-feedback and other public endpoints
    if (url && url.toLowerCase().includes('/platform-feedback')) {
      return false;
    }

    return sessionStorage.getItem('authenticationToken') ? true : false;
  }

  /**
   * Reset the session timeout timer
   * Clears existing timer and starts a new one
   */
  private resetSessionTimeoutTimer(): void {
    this.clearSessionTimeoutTimer();
    this.startSessionTimeoutTimer();
  }

  /**
   * Clear the session timeout timer
   */
  private clearSessionTimeoutTimer(): void {
    if (this.sessionTimeoutRef) {
      clearTimeout(this.sessionTimeoutRef);
      this.sessionTimeoutRef = null;
    }
  }

  /**
   * Start the session timeout timer (27 minutes)
   * Shows a warning dialog when session is about to expire
   */
  private startSessionTimeoutTimer(): void {
    this.sessionTimeoutRef = setTimeout(
      () => {
        this.showSessionExpiryWarning();
      },
      27 * 60 * 1000
    ); // 27 minutes
  }

  /**
   * Show session expiry warning dialog
   * Allows user to extend session or logout
   */
  private showSessionExpiryWarning(): void {
    if (
      !sessionStorage.getItem('authenticationToken') ||
      !sessionStorage.getItem('isAuthenticated') ||
      this.isHandlingSessionExpiry
    ) {
      return;
    }

    this.confirmationService
      .alert(
        this.currentLanguageSet?.sessionTimeoutWarning ||
          'Your session is about to expire. Do you need more time?',
        'sessionTimeOut'
      )
      .afterClosed()
      .subscribe((result: any) => {
        if (result?.action === 'continue') {
          // Extend session
          this.extendSession();
        } else if (
          result?.action === 'timeout' ||
          result?.action === 'cancel'
        ) {
          // Handle logout
          this.handleSessionExpiry(
            this.currentLanguageSet?.sessionExpired ||
              'Your session has expired. Please login again.'
          );
        }
      });
  }

  /**
   * Extend the current session
   */
  private extendSession(): void {
    this.http
      .post(environment.extendSessionUrl, {})
      .pipe(
        catchError((error: any) => {
          console.error('Failed to extend session:', error);
          // On extension failure, let timeout happen naturally
          return of(null);
        })
      )
      .subscribe(() => {
        // Reset timer for another 27 minutes
        this.resetSessionTimeoutTimer();
      });
  }
}
