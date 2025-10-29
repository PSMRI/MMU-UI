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
import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
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
  timerRef: any;
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
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const key: any = sessionStorage.getItem('key');
    const serverKey = this.sessionstorage.getItem('serverKey');
    let modifiedReq = req;
    const isPlatformFeedback =
      req.url && req.url.toLowerCase().includes('/platform-feedback');

    if (isPlatformFeedback) {
      // For platform-feedback: remove Authorization and force JSON content-type
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
        if (req.url !== undefined && !req.url.includes('cti/getAgentState'))
          this.spinnerService.setLoading(true);
        if (event instanceof HttpResponse) {
          console.log(event.body);
          this.onSuccess(req.url, event.body);
          this.spinnerService.setLoading(false);
          return event.body;
        }
      }),

      catchError((error: HttpErrorResponse) => {
        console.error(error);
        this.spinnerService.setLoading(false);
        let message = '';
        if (error.status === 401) {
          if (error.error) {
            if (typeof error.error === 'string') {
              message = error.error;
            } else if (error.error.message) {
              message = error.error.message;
            }
          }

          if (!message) {
            message = 'Invalid token. Please login again.';
          }

          this.confirmationService.alert(message, 'error');
          sessionStorage.clear();
          setTimeout(() => this.router.navigate(['/login']), 0);
        }

        return throwError(error);
      })
    );
  }

  private onSuccess(url: string, response: any): void {
    if (this.timerRef) clearTimeout(this.timerRef);

    if (
      response.statusCode === 5002 &&
      url.indexOf('user/userAuthenticate') < 0
    ) {
      sessionStorage.clear();
      // this.sessionstorage.clear();
      setTimeout(() => this.router.navigate(['/login']), 0);
      this.confirmationService.alert(response.errorMessage, 'error');
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.timerRef = setTimeout(
      () => {
        console.log('there', Date());

        if (
          sessionStorage.getItem('authenticationToken') &&
          sessionStorage.getItem('isAuthenticated')
        ) {
          this.confirmationService
            .alert(
              'Your session is about to Expire. Do you need more time ? ',
              'sessionTimeOut'
            )
            .afterClosed()
            .subscribe((result: any) => {
              if (result.action === 'continue') {
                this.http.post(environment.extendSessionUrl, {}).subscribe(
                  (res: any) => {},
                  (err: any) => {}
                );
              } else if (result.action === 'timeout') {
                clearTimeout(this.timerRef);
                sessionStorage.clear();
                // this.sessionstorage.clear();
                this.confirmationService.alert(
                  this.currentLanguageSet.sessionExpired,
                  'error'
                );
                this.router.navigate(['/login']);
              } else if (result.action === 'cancel') {
                setTimeout(() => {
                  clearTimeout(this.timerRef);
                  sessionStorage.clear();
                  // this.sessionstorage.clear();
                  this.confirmationService.alert(
                    this.currentLanguageSet.sessionExpired,
                    'error'
                  );
                  this.router.navigate(['/login']);
                }, result.remainingTime * 1000);
              }
            });
        }
      },
      27 * 60 * 1000
    );
  }
}
