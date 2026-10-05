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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmationService } from '../../services';
import { DataSyncService } from '../../../data-sync/shared/service/data-sync.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { DataSyncLoginComponent } from './data-sync-login.component';

const ALREADY =
  'You are already logged in,please confirm to logout from other device and login again';
const NO_PRIV =
  "User doesn't have previlege to perform this activity. Please contact administrator.";
const ELSEWHERE =
  'Seems you are logged in from somewhere else, Logout from there & try back in.';

describe('DataSyncLoginComponent', () => {
  let fixture: ComponentFixture<DataSyncLoginComponent>;
  let component: DataSyncLoginComponent;
  let ds: any;
  let confirm: any;
  let session: any;
  let router: Router;
  let dialogRef: any;
  let dialogData: any;

  const mmuData = (extra: any = {}) => ({
    key: 'SERVER-KEY',
    userID: 5,
    previlegeObj: [
      { serviceName: 'MMU', providerServiceMapID: 42 },
      { serviceName: 'TM', providerServiceMapID: 1 },
    ],
    ...extra,
  });

  const create = (data: any = null) => {
    dialogData = data;
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(DataSyncLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const fillForm = () =>
    component.loginForm.setValue({
      userName: 'syncuser',
      password: 'Secret@1',
    });

  beforeEach(async () => {
    ds = autoSpy(DataSyncService);
    dialogRef = createDialogRefMock();
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DataSyncLoginComponent],
      providers: [
        ...commonTestProviders({ session: { userID: 5 } }),
        { provide: MatDialogRef, useValue: dialogRef },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DataSyncLoginComponent, {
        set: { providers: [{ provide: DataSyncService, useValue: ds }] },
      })
      .compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    sessionStorage.removeItem('serverKey');
    sessionStorage.removeItem('authorizeToViewTMcasesheet');
  });

  it('initialises language, dialog ref and data', () => {
    create({ masterDowloadFirstTime: true });
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.dialogRef).toBe(dialogRef);
    expect(component.data).toEqual({ masterDowloadFirstTime: true });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('show/hide password toggles the input type', () => {
    create();
    component.showPWD();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#password');
    expect(input.type).toBe('text');
    component.hidePWD();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });

  it('keySize and iterationCount accessors', () => {
    create();
    expect(component.keySize).toBe(256);
    expect(component.iterationCount).toBe(1989);
    component.keySize = 128;
    component.iterationCount = 10;
    expect(component.keySize).toBe(128);
    expect(component.iterationCount).toBe(10);
  });

  it('encrypt produces salt+iv+ciphertext that decrypts back to the plain text', () => {
    create();
    component.iterationCount = 10; // keep test fast
    const out = component.encrypt(component.Key_IV, 'hello');
    const salt = out.substring(0, 64);
    const iv = out.substring(64, 96);
    const cipher = out.substring(96);
    const key = component.generateKey(salt, component.Key_IV);
    const plain = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(cipher) } as any,
      key,
      { iv: CryptoJS.enc.Hex.parse(iv) }
    ).toString(CryptoJS.enc.Utf8);
    expect(plain).toBe('hello');
  });

  describe('dataSyncLogin', () => {
    beforeEach(() => {
      create();
      spyOn(component, 'encrypt').and.returnValue('ENC');
    });

    it('alerts when form is invalid', () => {
      component.dataSyncLogin();
      expect(ds.dataSyncLogin).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.usernamenPass
      );
      expect(component.showProgressBar).toBeFalse();
    });

    it('submitting the rendered form logs in with username and encrypted password', () => {
      fillForm();
      ds.dataSyncLogin.and.returnValue(
        of({ statusCode: 200, data: mmuData() })
      );
      fixture.debugElement
        .query(By.css('form'))
        .triggerEventHandler('submit', null);
      expect(component.encrypt).toHaveBeenCalledWith(
        'Piramal12Piramal',
        'Secret@1'
      );
      expect(ds.dataSyncLogin).toHaveBeenCalledWith('syncuser', 'ENC', false);
      expect(session.setItem).toHaveBeenCalledWith('serverKey', 'SERVER-KEY');
      expect(session.setItem).toHaveBeenCalledWith(
        'dataSyncProviderServiceMapID',
        42
      );
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'NotAuthorized'
      );
      expect(router.navigate).toHaveBeenCalledWith(['/datasync/workarea']);
      expect(component.showProgressBar).toBeFalse();
    });

    it('alerts when user has no MMU privilege', () => {
      fillForm();
      sessionStorage.setItem('serverKey', 'old');
      ds.dataSyncLogin.and.returnValue(
        of({ statusCode: 200, data: { previlegeObj: [{ serviceName: 'TM' }] } })
      );
      component.dataSyncLogin();
      expect(sessionStorage.getItem('serverKey')).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(NO_PRIV);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts when 200 has no data', () => {
      fillForm();
      ds.dataSyncLogin.and.returnValue(of({ statusCode: 200, data: null }));
      component.dataSyncLogin();
      expect(confirm.alert).toHaveBeenCalledWith(ELSEWHERE, 'error');
    });

    it('alerts other 5002 errors', () => {
      fillForm();
      ds.dataSyncLogin.and.returnValue(
        of({ statusCode: 5002, errorMessage: 'Locked' })
      );
      component.dataSyncLogin();
      expect(confirm.alert).toHaveBeenCalledWith('Locked', 'error');
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('alerts and marks not authorized on other status codes', () => {
      fillForm();
      ds.dataSyncLogin.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'Bad creds' })
      );
      component.dataSyncLogin();
      expect(confirm.alert).toHaveBeenCalledWith('Bad creds', 'error');
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'NotAuthorized'
      );
      expect(component.showProgressBar).toBeFalse();
    });

    it('alerts on request error', () => {
      fillForm();
      ds.dataSyncLogin.and.returnValue(throwingObs({ errorMessage: 'net' }));
      component.dataSyncLogin();
      expect(confirm.alert).toHaveBeenCalledWith('net', 'error');
      expect(component.showProgressBar).toBeFalse();
    });

    describe('already logged in elsewhere (5002)', () => {
      const mmuRole = (serviceID: number) => ({
        roles: [
          {
            serviceRoleScreenMappings: [
              { providerServiceMapping: { serviceID } },
            ],
          },
        ],
        serviceName: 'MMU',
        providerServiceMapID: 42,
      });

      beforeEach(() => {
        fillForm();
        ds.dataSyncLogin.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY }),
          of({
            statusCode: 200,
            data: { key: 'K2', userID: 5, previlegeObj: [mmuRole(2)] },
          })
        );
        ds.userlogoutPreviousSession.and.returnValue(of({ statusCode: 200 }));
      });

      it('logs out other session and logs in again when confirmed', () => {
        component.dataSyncLogin();
        expect(confirm.confirm).toHaveBeenCalledWith('info', ALREADY);
        expect(ds.userlogoutPreviousSession).toHaveBeenCalledWith('syncuser');
        expect(ds.dataSyncLogin.calls.mostRecent().args).toEqual([
          'syncuser',
          'ENC',
          true,
        ]);
        expect(session.setItem).toHaveBeenCalledWith('serverKey', 'K2');
        expect(router.navigate).toHaveBeenCalledWith(['/datasync/workarea']);
        expect(component.showProgressBar).toBeFalse();
      });

      it('stops when user declines', () => {
        confirm.confirm.and.returnValue(of(false));
        component.dataSyncLogin();
        expect(ds.userlogoutPreviousSession).not.toHaveBeenCalled();
        expect(component.showProgressBar).toBeFalse();
      });

      it('alerts when logout of previous session fails', () => {
        ds.userlogoutPreviousSession.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'logout failed' })
        );
        component.dataSyncLogin();
        expect(confirm.alert).toHaveBeenCalledWith('logout failed', 'error');
        expect(ds.dataSyncLogin).toHaveBeenCalledTimes(1);
      });

      it('alerts when relogin fails', () => {
        ds.dataSyncLogin.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY }),
          of({ statusCode: 5000, errorMessage: 'relogin failed' })
        );
        component.dataSyncLogin();
        expect(confirm.alert).toHaveBeenCalledWith('relogin failed', 'error');
        expect(component.showProgressBar).toBeFalse();
      });

      it('alerts when relogin has no data', () => {
        ds.dataSyncLogin.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY }),
          of({ statusCode: 200, data: null })
        );
        component.dataSyncLogin();
        expect(confirm.alert).toHaveBeenCalledWith(ELSEWHERE, 'error');
      });

      it('alerts no privilege when relogin role is not service 2', () => {
        sessionStorage.setItem('serverKey', 'old');
        ds.dataSyncLogin.and.returnValues(
          of({ statusCode: 5002, errorMessage: ALREADY }),
          of({
            statusCode: 200,
            data: { key: 'K', previlegeObj: [mmuRole(4)] },
          })
        );
        component.dataSyncLogin();
        expect(sessionStorage.getItem('serverKey')).toBeNull();
        expect(confirm.alert).toHaveBeenCalledWith(NO_PRIV);
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('getDataSyncMMU', () => {
    it('rejects a sync user different from the logged-in user', () => {
      create();
      sessionStorage.setItem('serverKey', 'x');
      component.getDataSyncMMU({ data: mmuData({ userID: 99 }) });
      expect(sessionStorage.getItem('serverKey')).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Sync user is not valid. Please login with the correct credentials.',
        'error'
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('closes dialog with true on first-time master download', () => {
      create({ masterDowloadFirstTime: true });
      component.getDataSyncMMU({ data: mmuData() });
      expect(dialogRef.close).toHaveBeenCalledWith(true);
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBeNull();
    });

    it('authorizes TM casesheet viewing and closes dialog', () => {
      create({ provideAuthorizationToViewTmCS: true });
      component.getDataSyncMMU({
        data: mmuData({ userID: undefined, previlegeObj: [] }),
      });
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'Authorized'
      );
      expect(session.setItem).not.toHaveBeenCalledWith(
        'dataSyncProviderServiceMapID',
        jasmine.anything()
      );
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('renders close icon only in dialog mode and closeDialog closes with false', () => {
      create({ provideAuthorizationToViewTmCS: true });
      const closeEl = fixture.nativeElement.querySelector('.close-button');
      expect(closeEl).not.toBeNull();
      closeEl.click();
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'NotAuthorized'
      );
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  it('hides the close icon outside dialog mode', () => {
    create();
    expect(fixture.nativeElement.querySelector('.close-button')).toBeNull();
  });

  it('ngDoCheck refreshes the language', () => {
    create();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(dialogData).toBeNull();
  });
});
