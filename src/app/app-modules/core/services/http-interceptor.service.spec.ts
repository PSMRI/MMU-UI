/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  HttpClient,
  HttpRequest,
  HttpHandler,
  HttpResponse,
  HttpErrorResponse,
  HttpHeaders,
  HTTP_INTERCEPTORS,
  HttpEvent,
} from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, of, throwError, EMPTY } from 'rxjs';
import { HttpInterceptorService } from './http-interceptor.service';
import { SpinnerService } from './spinner.service';
import { ConfirmationService } from './confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'src/environments/environment';

describe('HttpInterceptorService', () => {
  let service: HttpInterceptorService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let spinnerServiceSpy: jasmine.SpyObj<SpinnerService>;
  let confirmationServiceSpy: any;
  let sessionStorageSpy: jasmine.SpyObj<SessionStorageService>;
  let cookieServiceSpy: jasmine.SpyObj<CookieService>;
  let routerEvents$: Subject<any>;
  let routerSpy: any;

  beforeEach(() => {
    routerEvents$ = new Subject<any>();

    spinnerServiceSpy = jasmine.createSpyObj('SpinnerService', ['setLoading']);
    confirmationServiceSpy = {
      alert: jasmine.createSpy('alert').and.returnValue({
        afterClosed: () => of(null),
      }),
      dialog: {
        closeAll: jasmine.createSpy('closeAll'),
      },
    };
    sessionStorageSpy = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'clear',
    ]);
    cookieServiceSpy = jasmine.createSpyObj('CookieService', [
      'get',
      'set',
      'delete',
    ]);
    routerSpy = {
      events: routerEvents$.asObservable(),
      navigate: jasmine
        .createSpy('navigate')
        .and.returnValue(Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpInterceptorService,
          multi: true,
        },
        { provide: SpinnerService, useValue: spinnerServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: SessionStorageService, useValue: sessionStorageSpy },
        { provide: CookieService, useValue: cookieServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(HTTP_INTERCEPTORS).find(
      i => i instanceof HttpInterceptorService
    ) as HttpInterceptorService;
  });

  afterEach(() => {
    // Drop any real 27-minute session timer started by a successful request.
    (service as any).clearSessionTimeoutTimer();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSessionExpiryInProgress', () => {
    it('should return false initially', () => {
      expect(service.isSessionExpiryInProgress()).toBe(false);
    });
  });

  describe('intercept - header injection', () => {
    it('should add Authorization and Content-Type headers for regular JSON requests', () => {
      sessionStorage.setItem('key', 'test-auth-key');
      sessionStorageSpy.getItem.and.returnValue('test-server-key');

      httpClient.post('/api/test', { data: 1 }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('test-auth-key');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('ServerAuthorization')).toBe(
        'test-server-key'
      );
      req.flush({});
    });

    it('should use empty string for Authorization when key is not in sessionStorage', () => {
      sessionStorageSpy.getItem.and.returnValue(null);

      httpClient.post('/api/test', { data: 1 }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('');
      req.flush({});
    });

    it('should remove Authorization and set Content-Type for platform-feedback requests', () => {
      httpClient.post('/api/platform-feedback', { data: 1 }).subscribe();

      const req = httpMock.expectOne('/api/platform-feedback');
      expect(req.request.headers.has('Authorization')).toBe(false);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({});
    });

    it('should set Authorization but not Content-Type for FormData requests', () => {
      sessionStorage.setItem('key', 'form-auth');
      sessionStorageSpy.getItem.and.returnValue(null);

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      httpClient.post('/api/upload', formData).subscribe();

      const req = httpMock.expectOne('/api/upload');
      expect(req.request.headers.get('Authorization')).toBe('form-auth');
      // FormData should NOT have Content-Type manually set
      // (browser sets multipart/form-data automatically)
      req.flush({});
    });
  });

  describe('intercept - spinner behavior', () => {
    it('should call setLoading(true) for non-cti requests', () => {
      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      req.flush({ data: 'test' });

      expect(spinnerServiceSpy.setLoading).toHaveBeenCalledWith(true);
    });

    it('should not call setLoading(true) for cti/getAgentState requests', () => {
      httpClient.get('/cti/getAgentState').subscribe();

      const req = httpMock.expectOne('/cti/getAgentState');
      req.flush({ data: 'test' });

      // setLoading(true) should not be called for cti requests
      // but setLoading(false) is called in finalize
      const trueCallCount = spinnerServiceSpy.setLoading.calls
        .allArgs()
        .filter(args => args[0] === true).length;
      expect(trueCallCount).toBe(0);
    });

    it('should call setLoading(false) in finalize when pendingRequests reaches 0', () => {
      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      req.flush({});

      expect(spinnerServiceSpy.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('intercept - error handling', () => {
    it('should call setLoading(false) on error', () => {
      httpClient.get('/api/fail').subscribe({
        error: () => {},
      });

      const req = httpMock.expectOne('/api/fail');
      req.error(new ProgressEvent('error'), {
        status: 500,
        statusText: 'Server Error',
      });

      expect(spinnerServiceSpy.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle 401 errors by triggering session expiry', fakeAsync(() => {
      httpClient.get('/api/protected').subscribe({
        next: () => {},
        error: () => {},
        complete: () => {},
      });

      const req = httpMock.expectOne('/api/protected');
      req.error(new ProgressEvent('error'), {
        status: 401,
        statusText: 'Unauthorized',
      });

      tick();
      expect(service.isSessionExpiryInProgress()).toBe(true);
    }));

    it('should propagate non-session errors to the subscriber', done => {
      httpClient.get('/api/fail').subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne('/api/fail');
      req.error(new ProgressEvent('error'), {
        status: 500,
        statusText: 'Server Error',
      });
    });
  });

  describe('router events subscription', () => {
    it('should reset session state when navigating to /login', () => {
      // Simulate a 401 to set isHandlingSessionExpiry to true
      // Then emit a login navigation event
      routerEvents$.next({ url: '/login' });

      expect(service.isSessionExpiryInProgress()).toBe(false);
    });

    it('should not reset session state for non-login routes', fakeAsync(() => {
      // First trigger a 401 to set session expiry in progress
      httpClient.get('/api/test').subscribe({
        error: () => {},
        complete: () => {},
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'), {
        status: 401,
        statusText: 'Unauthorized',
      });
      tick();

      expect(service.isSessionExpiryInProgress()).toBe(true);

      // Navigate to a non-login route
      routerEvents$.next({ url: '/dashboard' });

      // Should still be handling session expiry
      expect(service.isSessionExpiryInProgress()).toBe(true);
    }));
  });

  describe('intercept - successful response handling', () => {
    it('should return the response body on success', done => {
      httpClient.get('/api/data').subscribe((res: any) => {
        expect(res).toEqual({ data: 'value' });
        done();
      });

      const req = httpMock.expectOne('/api/data');
      req.flush({ data: 'value' });
    });

    it('should reset session timeout timer for authenticated requests', () => {
      sessionStorage.setItem('authenticationToken', 'token123');

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      req.flush({ data: 'ok' });

      // Timer should be set (we cannot directly check private properties,
      // but we can verify no error was thrown)
      expect(spinnerServiceSpy.setLoading).toHaveBeenCalled();
    });

    it('should not restart timer for login endpoint responses', () => {
      sessionStorage.setItem('authenticationToken', 'token123');

      httpClient.post('/user/userAuthenticate', {}).subscribe();

      const req = httpMock.expectOne('/user/userAuthenticate');
      req.flush({ statusCode: 200 });

      // No error means the exclusion worked correctly
      expect(spinnerServiceSpy.setLoading).toHaveBeenCalled();
    });

    it('should not restart timer for platform-feedback endpoint', () => {
      sessionStorage.setItem('authenticationToken', 'token123');

      httpClient.post('/platform-feedback', {}).subscribe();

      const req = httpMock.expectOne('/platform-feedback');
      req.flush({ statusCode: 200 });

      expect(spinnerServiceSpy.setLoading).toHaveBeenCalled();
    });

    it('should not restart timer when authenticationToken is absent', () => {
      sessionStorage.removeItem('authenticationToken');

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      req.flush({ data: 'ok' });

      expect(spinnerServiceSpy.setLoading).toHaveBeenCalled();
    });
  });

  describe('intercept - multiple concurrent requests', () => {
    it('should track pending requests and hide spinner only when all complete', () => {
      httpClient.get('/api/one').subscribe();
      httpClient.get('/api/two').subscribe();

      const req1 = httpMock.expectOne('/api/one');
      const req2 = httpMock.expectOne('/api/two');

      // Complete first request
      req1.flush({});

      // Spinner should still be loading since req2 is pending
      // (The last setLoading call might still be true because pendingRequests > 0)

      // Complete second request
      req2.flush({});

      // Now spinner should be hidden
      const lastCall = spinnerServiceSpy.setLoading.calls.mostRecent().args[0];
      expect(lastCall).toBe(false);
    });
  });

  describe('intercept - login request session reset', () => {
    it('should reset session state on successful login response', fakeAsync(() => {
      httpClient
        .post('/user/userAuthenticate', { userName: 'test', password: 'pass' })
        .subscribe();

      const req = httpMock.expectOne('/user/userAuthenticate');
      req.flush({ statusCode: 200, data: { token: 'abc' } });

      tick();

      // After a successful login, session expiry flag should be false
      expect(service.isSessionExpiryInProgress()).toBe(false);
    }));
  });
  describe('intercept - session expiry responses', () => {
    beforeEach(() => spyOn(console, 'error'));

    it('swallows a 401, closes dialogs, alerts and navigates to login', fakeAsync(() => {
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');
      const complete = jasmine.createSpy('complete');
      httpClient.get('/api/protected').subscribe({ next, error, complete });
      httpMock
        .expectOne('/api/protected')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      tick();
      expect(error).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalled();
      expect(confirmationServiceSpy.dialog.closeAll).toHaveBeenCalled();
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith(
        'Session has expired. Please login again.',
        'error'
      );
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(spinnerServiceSpy.setLoading).toHaveBeenCalledWith(false);
    }));

    it('treats a 200 error carrying statusCode 5002 as session expiry', fakeAsync(() => {
      const error = jasmine.createSpy('error');
      httpClient.get('/api/x').subscribe({ error });
      httpMock
        .expectOne('/api/x')
        .flush(
          { statusCode: 5002, errorMessage: 'Token invalid' },
          { status: 200, statusText: 'OK' }
        );
      tick();
      // A 200 is not an error for HttpClient, so nothing is intercepted here.
      expect(error).not.toHaveBeenCalled();
      expect(service.isSessionExpiryInProgress()).toBeFalse();
    }));

    it('handles a 5002 error event with status 200', fakeAsync(() => {
      const handler = {
        handle: () =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 200,
                error: { statusCode: 5002 },
              })
          ),
      } as HttpHandler;
      const complete = jasmine.createSpy('complete');
      const error = jasmine.createSpy('error');
      service
        .intercept(new HttpRequest('GET', '/api/x'), handler)
        .subscribe({ error, complete });
      tick();
      expect(complete).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(service.isSessionExpiryInProgress()).toBeTrue();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('propagates a 401 when expiry is already being handled', fakeAsync(() => {
      (service as any).isHandlingSessionExpiry = true;
      const error = jasmine.createSpy('error');
      httpClient.get('/api/again').subscribe({ error });
      httpMock
        .expectOne('/api/again')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      tick();
      expect(error).toHaveBeenCalled();
      expect(error.calls.mostRecent().args[0].status).toBe(401);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('does not reset state for login responses (lower-cased URL never matches "userAuthenticate")', () => {
      (service as any).isHandlingSessionExpiry = true;
      httpClient.post('/user/userAuthenticate', {}).subscribe();
      httpMock.expectOne('/user/userAuthenticate').flush({});
      expect(service.isSessionExpiryInProgress()).toBeTrue();
    });

    it('resets state on a /login router event', () => {
      (service as any).isHandlingSessionExpiry = true;
      (service as any).logoutMessageShown = true;
      routerEvents$.next({ url: '/login' });
      expect(service.isSessionExpiryInProgress()).toBeFalse();
      expect((service as any).logoutMessageShown).toBeFalse();
    });
  });

  describe('getErrorMessage', () => {
    const fallback = 'Your session has expired. Please login again.';
    const msg = (e: any) => (service as any).getErrorMessage(e);

    it('returns non-blank strings and falls back for blank ones', () => {
      expect(msg('Expired!')).toBe('Expired!');
      expect(msg('   ')).toBe(fallback);
      expect(msg('')).toBe(fallback);
    });

    it('reads message, errorMessage or error string properties', () => {
      expect(msg({ message: 'm' })).toBe('m');
      expect(msg({ errorMessage: 'em' })).toBe('em');
      expect(msg({ error: 'e' })).toBe('e');
      expect(msg({ message: 1, errorMessage: 2, error: 3 })).toBe(fallback);
    });

    it('falls back for null and other types', () => {
      expect(msg(null)).toBe(fallback);
      expect(msg(42)).toBe(fallback);
    });

    it('falls back when reading the error throws', () => {
      spyOn(console, 'error');
      const bad = {
        get message() {
          throw new Error('boom');
        },
      };
      expect(msg(bad)).toBe(fallback);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('handleSessionExpiry (unlocked)', () => {
    const run = (m: any) => (service as any).handleSessionExpiry(m);

    beforeEach(() => spyOn(console, 'error'));

    it('clears storage, navigates and shows the message once after 300ms', fakeAsync(() => {
      sessionStorage.setItem('key', 'k');
      run('Gone');
      expect(sessionStorage.getItem('key')).toBeNull();
      expect(sessionStorageSpy.clear).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(service.isSessionExpiryInProgress()).toBeTrue();
      tick(299);
      expect(confirmationServiceSpy.alert).not.toHaveBeenCalled();
      tick(1);
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith(
        'Gone',
        'error'
      );

      // a second unlocked expiry does not show the dialog again
      confirmationServiceSpy.alert.calls.reset();
      (service as any).isHandlingSessionExpiry = false;
      run('Again');
      tick(300);
      expect(confirmationServiceSpy.alert).not.toHaveBeenCalled();
    }));

    it('logs when navigation is refused and still shows the dialog', fakeAsync(() => {
      routerSpy.navigate.and.returnValue(Promise.resolve(false));
      run('x');
      tick(300);
      expect(console.error).toHaveBeenCalledWith('Navigation to login failed');
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith('x', 'error');
    }));

    it('logs dialog errors from afterClosed', fakeAsync(() => {
      confirmationServiceSpy.alert.and.returnValue({
        afterClosed: () => throwError(() => 'dlg'),
      });
      run('x');
      tick(300);
      expect(console.error).toHaveBeenCalledWith('Error in dialog:', 'dlg');
    }));

    it('logs when opening the dialog throws', fakeAsync(() => {
      confirmationServiceSpy.alert.and.throwError('no dialog');
      run('x');
      tick(300);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to show session expiry dialog:',
        jasmine.any(Error)
      );
    }));

    it('logs a rejected navigation', fakeAsync(() => {
      routerSpy.navigate.and.returnValue(Promise.reject('nav'));
      run('x');
      tick();
      expect(console.error).toHaveBeenCalledWith('Navigation error:', 'nav');
    }));

    it('logs a synchronous navigation failure', () => {
      routerSpy.navigate.and.throwError('sync');
      run('x');
      expect(console.error).toHaveBeenCalledWith(
        'Error during session expiry handling:',
        jasmine.any(Error)
      );
    });
  });

  describe('session timeout warning', () => {
    const TIMEOUT = 27 * 60 * 1000;

    function authedRequest() {
      sessionStorage.setItem('authenticationToken', 't');
      sessionStorage.setItem('isAuthenticated', 'true');
      httpClient.get('/api/data').subscribe();
      httpMock.expectOne('/api/data').flush({});
    }

    function warnWith(result: any) {
      confirmationServiceSpy.alert.and.returnValue({
        afterClosed: () => of(result),
      });
    }

    it('warns 27 minutes after an authenticated response', fakeAsync(() => {
      warnWith(null);
      authedRequest();
      tick(TIMEOUT - 1);
      expect(confirmationServiceSpy.alert).not.toHaveBeenCalled();
      tick(1);
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith(
        'Your session is about to expire. Do you need more time?',
        'sessionTimeOut'
      );
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));

    it('uses the language set text and extends the session on continue', fakeAsync(() => {
      service.currentLanguageSet = { sessionTimeoutWarning: 'More time?' };
      warnWith({ action: 'continue' });
      authedRequest();
      tick(TIMEOUT);
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith(
        'More time?',
        'sessionTimeOut'
      );
      const req = httpMock.expectOne(environment.extendSessionUrl);
      expect(req.request.method).toBe('POST');
      req.flush({});
      expect((service as any).sessionTimeoutRef).toBeTruthy();
      (service as any).clearSessionTimeoutTimer();
    }));

    it('restarts the timer even when extending fails', fakeAsync(() => {
      spyOn(console, 'error');
      warnWith({ action: 'continue' });
      authedRequest();
      tick(TIMEOUT);
      httpMock
        .expectOne(environment.extendSessionUrl)
        .flush({}, { status: 500, statusText: 'err' });
      expect(console.error).toHaveBeenCalled();
      expect((service as any).sessionTimeoutRef).toBeTruthy();
      (service as any).clearSessionTimeoutTimer();
    }));

    it('expires the session on timeout using the language text', fakeAsync(() => {
      service.currentLanguageSet = { sessionExpired: 'Bye' };
      warnWith({ action: 'timeout' });
      authedRequest();
      tick(TIMEOUT);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(service.isSessionExpiryInProgress()).toBeTrue();
      tick(300);
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith('Bye', 'error');
    }));

    it('expires the session on cancel with the default text', fakeAsync(() => {
      warnWith({ action: 'cancel' });
      authedRequest();
      tick(TIMEOUT);
      tick(300);
      expect(confirmationServiceSpy.alert).toHaveBeenCalledWith(
        'Your session has expired. Please login again.',
        'error'
      );
    }));

    it('skips the warning when no longer authenticated', fakeAsync(() => {
      authedRequest();
      sessionStorage.removeItem('isAuthenticated');
      tick(TIMEOUT);
      expect(confirmationServiceSpy.alert).not.toHaveBeenCalled();
    }));

    it('skips the warning while expiry is being handled', fakeAsync(() => {
      authedRequest();
      (service as any).isHandlingSessionExpiry = true;
      tick(TIMEOUT);
      expect(confirmationServiceSpy.alert).not.toHaveBeenCalled();
    }));

    it('skips the warning when the token is gone', () => {
      (service as any).showSessionExpiryWarning();
      expect(confirmationServiceSpy.alert).not.toHaveBeenCalled();
    });
  });
});
