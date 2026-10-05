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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  autoSpy,
  createDialogRefMock,
  throwingObs,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';
import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { DataSyncLoginComponent } from '../core/components/data-sync-login/data-sync-login.component';
import { MasterDownloadComponent } from '../data-sync/master-download/master-download.component';
import { CampHubQrCodeComponent } from '../data-sync/camp-hub-qr-code/camp-hub-qr-code.component';

const ALREADY_LOGGED_IN =
  'You are already logged in,please confirm to logout from other device and login again';

function loginData(overrides: any = {}) {
  return {
    key: 'k1',
    isAuthenticated: 'true',
    userID: 7,
    userName: 'nurse1',
    fullName: 'Nurse One',
    Status: 'Active',
    previlegeObj: [
      {
        providerServiceMapID: 11,
        serviceID: 101,
        serviceName: 'MMU',
        apimanClientKey: 'api-key',
        roles: [
          {
            serviceRoleScreenMappings: [
              {
                providerServiceMapping: {
                  serviceID: 2,
                  serviceProviderID: 5,
                },
              },
            ],
          },
        ],
      },
      {
        providerServiceMapID: 12,
        serviceID: 102,
        serviceName: 'TM',
        apimanClientKey: 'api-key-2',
        roles: [
          {
            serviceRoleScreenMappings: [
              {
                providerServiceMapping: {
                  serviceID: 4,
                  serviceProviderID: 5,
                },
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: any;
  let confirmation: any;
  let session: any;
  let tracking: any;
  let dialog: any;
  let router: Router;

  function create() {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [LoginComponent],
      providers: [
        ...commonTestProviders(),
        { provide: AuthService, useValue: autoSpy(AuthService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    auth = TestBed.inject(AuthService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
    dialog = TestBed.inject(MatDialog) as any;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('init', () => {
    it('creates, sets crypto params and focuses the username field', () => {
      create();
      expect(component).toBeTruthy();
      expect(component._keySize).toBe(256);
      expect(component._ivSize).toBe(128);
      expect(component._iterationCount).toBe(1989);
      const input = fixture.nativeElement.querySelector('#userID');
      const focusSpy = spyOn(input, 'focus');
      component.ngAfterViewInit();
      expect(focusSpy).toHaveBeenCalled();
      expect(component.loginForm.valid).toBeFalse();
    });

    it('clears session storage when not authenticated', () => {
      sessionStorage.setItem('other', 'x');
      create();
      expect(sessionStorage.getItem('other')).toBeNull();
      expect(auth.validateSessionKey).not.toHaveBeenCalled();
    });

    it('validates existing session and navigates to /service on success', () => {
      sessionStorage.setItem('isAuthenticated', 'true');
      auth.validateSessionKey.and.returnValue(
        of({ statusCode: 200, data: { ok: 1 } })
      );
      create();
      expect(auth.validateSessionKey).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('does not navigate when session validation fails', () => {
      sessionStorage.setItem('isAuthenticated', 'true');
      auth.validateSessionKey.and.returnValue(of({ statusCode: 5002 }));
      create();
      expect(router.navigate).not.toHaveBeenCalled();
      auth.validateSessionKey.and.returnValue(of(null));
      component.ngOnInit();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('helpers', () => {
    beforeEach(() => create());

    it('toggles password visibility', () => {
      component.showPWD();
      expect(component.dynamictype).toBe('text');
      component.hidePWD();
      expect(component.dynamictype).toBe('password');
    });

    it('exposes keySize and iterationCount getters/setters', () => {
      component.keySize = 128;
      component.iterationCount = 10;
      expect(component.keySize).toBe(128);
      expect(component.iterationCount).toBe(10);
      expect(component._keySize).toBe(128);
    });

    it('encrypt returns salt(64 hex) + iv(32 hex) + base64 ciphertext', () => {
      component.iterationCount = 2;
      const out = component.encrypt(component.Key_IV, 'secret');
      expect(out.length).toBeGreaterThan(96);
      expect(/^[0-9a-f]{96}/.test(out)).toBeTrue();
      const a = component.encryptWithIvSalt(
        'aa'.repeat(32),
        'bb'.repeat(16),
        'p',
        'x'
      );
      const b = component.encryptWithIvSalt(
        'aa'.repeat(32),
        'bb'.repeat(16),
        'p',
        'x'
      );
      expect(a).toBe(b);
    });

    it('generateKey uses keySize/32 words', () => {
      component.iterationCount = 1;
      const key = component.generateKey('aa'.repeat(32), 'p');
      expect(key.sigBytes).toBe(32);
    });

    it('stores captcha token', () => {
      component.onCaptchaResolved('tok');
      expect(component.captchaToken).toBe('tok');
    });

    it('resetCaptcha resets only when enabled and component present', () => {
      const reset = jasmine.createSpy('reset');
      component.captchaToken = 'tok';
      component.enableCaptcha = false;
      component.captchaCmp = { reset } as any;
      component.resetCaptcha();
      expect(reset).not.toHaveBeenCalled();

      component.enableCaptcha = true;
      component.captchaCmp = undefined;
      component.resetCaptcha();
      expect(component.captchaToken).toBe('tok');

      component.captchaCmp = { reset } as any;
      component.resetCaptcha();
      expect(reset).toHaveBeenCalled();
      expect(component.captchaToken).toBe('');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      create();
      component.iterationCount = 1;
      component.enableCaptcha = false;
    });

    function fill(user = ' nurse1 ', pwd = 'pwd') {
      component.loginForm.setValue({ userName: user, password: pwd });
    }

    it('does nothing when the form is invalid', () => {
      component.login();
      expect(auth.login).not.toHaveBeenCalled();
    });

    it('logs in with trimmed username and stores data on success', () => {
      fill();
      auth.login.and.returnValue(of({ statusCode: 200, data: loginData() }));
      component.login();
      const args = auth.login.calls.mostRecent().args;
      expect(args[0]).toBe('nurse1');
      expect(args[2]).toBeFalse();
      expect(args[3]).toBeUndefined();
      expect(session.setItem).toHaveBeenCalledWith(
        'loginDataResponse',
        jasmine.any(String)
      );
      expect(sessionStorage.getItem('key')).toBe('k1');
      expect(sessionStorage.getItem('isAuthenticated')).toBe('true');
      expect(tracking.setUserId).toHaveBeenCalledWith(7);
      expect(session.setItem).toHaveBeenCalledWith('providerServiceMapID', 11);
      expect(session.setItem).toHaveBeenCalledWith('currentServiceID', 2);
      const services = JSON.parse(session.store.get('services'));
      expect(services.length).toBe(1);
      expect(services[0]).toEqual({
        providerServiceID: 101,
        serviceName: 'MMU',
        apimanClientKey: 'api-key',
        serviceID: 2,
        serviceProviderID: 5,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('passes captcha token when captcha is enabled', () => {
      component.enableCaptcha = true;
      component.captchaToken = 'cap';
      fill();
      auth.login.and.returnValue(of({ statusCode: 200, data: loginData() }));
      component.login();
      expect(auth.login.calls.mostRecent().args[3]).toBe('cap');
    });

    it('routes new users to security questions', () => {
      fill();
      auth.login.and.returnValue(
        of({ statusCode: 200, data: loginData({ Status: 'New' }) })
      );
      component.login();
      expect(router.navigate).toHaveBeenCalledWith(['/set-security-questions']);
    });

    it('alerts when user has no MMU service privilege', () => {
      const data = loginData();
      data.previlegeObj = [data.previlegeObj[1]];
      fill();
      auth.login.and.returnValue(of({ statusCode: 200, data }));
      component.login();
      expect(confirmation.alert).toHaveBeenCalledWith(
        "User doesn't have previlege to access the application"
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts when 200 has no privileges', () => {
      fill();
      auth.login.and.returnValue(
        of({ statusCode: 200, data: loginData({ previlegeObj: [] }) })
      );
      component.login();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Seems you are logged in from somewhere else, Logout from there & try back in.',
        'error'
      );
    });

    it('alerts error message for other 5002 errors', () => {
      fill();
      auth.login.and.returnValue(
        of({ statusCode: 5002, errorMessage: 'Bad credentials' })
      );
      spyOn(component, 'resetCaptcha').and.callThrough();
      component.login();
      expect(component.resetCaptcha).toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Bad credentials',
        'error'
      );
    });

    it('ignores non-200/non-5002 responses', () => {
      fill();
      auth.login.and.returnValue(of({ statusCode: 500 }));
      component.login();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    describe('already logged in elsewhere', () => {
      beforeEach(() => {
        fill('nurse1');
        auth.login.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY_LOGGED_IN }),
          of({ statusCode: 200, data: loginData() })
        );
      });

      it('logs out previous session and logs in again on confirm', () => {
        auth.userlogoutPreviousSession.and.returnValue(of({ statusCode: 200 }));
        component.login();
        expect(confirmation.confirm).toHaveBeenCalledWith(
          'info',
          ALREADY_LOGGED_IN
        );
        expect(auth.userlogoutPreviousSession).toHaveBeenCalledWith('nurse1');
        expect(auth.login).toHaveBeenCalledTimes(2);
        expect(auth.login.calls.mostRecent().args[2]).toBeTrue();
        expect(tracking.setUserId).toHaveBeenCalledWith(7);
        expect(router.navigate).toHaveBeenCalledWith(['/service']);
      });

      it('alerts when relogin returns no privileges', () => {
        auth.login.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY_LOGGED_IN }),
          of({ statusCode: 200, data: loginData({ previlegeObj: [] }) })
        );
        component.login();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'Seems you are logged in from somewhere else, Logout from there & try back in.',
          'error'
        );
      });

      it('alerts relogin error message when relogin fails', () => {
        auth.login.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY_LOGGED_IN }),
          of({ statusCode: 500, errorMessage: 'relogin failed' })
        );
        component.login();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'relogin failed',
          'error'
        );
      });

      it('alerts when logging out previous session fails', () => {
        auth.userlogoutPreviousSession.and.returnValue(
          of({ statusCode: 500, errorMessage: 'logout failed' })
        );
        component.login();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'logout failed',
          'error'
        );
        expect(auth.login).toHaveBeenCalledTimes(1);
      });

      it('clears session and goes to /login when user declines', () => {
        confirmation.confirm.and.returnValue(of(false));
        sessionStorage.setItem('x', '1');
        component.login();
        expect(auth.userlogoutPreviousSession).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('x')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });
    });

    it('alerts server error message on http error', () => {
      fill();
      auth.login.and.returnValue(
        throwingObs({ error: { errorMessage: 'server says no' } })
      );
      component.login();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'server says no',
        'error'
      );
    });

    it('falls back to err.message, then default message', () => {
      fill();
      auth.login.and.returnValue(throwingObs({ message: 'net down' }));
      component.login();
      expect(confirmation.alert).toHaveBeenCalledWith('net down', 'error');
      auth.login.and.returnValue(throwingObs(null));
      component.login();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Login request failed. Please try again.',
        'error'
      );
    });
  });

  describe('dialogs', () => {
    beforeEach(() => create());

    it('opens the camp hub QR dialog', () => {
      component.openQrDialog();
      expect(dialog.open).toHaveBeenCalledWith(CampHubQrCodeComponent, {
        width: '500px',
        disableClose: false,
      });
    });

    it('opens master download after successful data-sync login', () => {
      const first = createDialogRefMock(true);
      const second = createDialogRefMock(undefined);
      dialog.open.and.returnValues(first, second);
      sessionStorage.setItem('x', '1');
      component.openDialog();
      expect(dialog.open.calls.argsFor(0)[0]).toBe(DataSyncLoginComponent);
      expect(dialog.open.calls.argsFor(0)[1].data).toEqual({
        masterDowloadFirstTime: true,
      });
      expect(dialog.open.calls.argsFor(1)[0]).toBe(MasterDownloadComponent);
      expect(sessionStorage.getItem('x')).toBeNull();
    });

    it('does not open master download when data-sync login is cancelled', () => {
      const closed = new Subject<any>();
      const ref = createDialogRefMock();
      ref.afterClosed.and.returnValue(closed.asObservable());
      dialog.open.and.returnValue(ref);
      component.openDialog();
      closed.next(false);
      expect(dialog.open).toHaveBeenCalledTimes(1);
    });
  });
});
