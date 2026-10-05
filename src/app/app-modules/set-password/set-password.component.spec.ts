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
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  autoSpy,
  throwingObs,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';
import { SetPasswordComponent } from './set-password.component';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';

describe('SetPasswordComponent', () => {
  let component: SetPasswordComponent;
  let fixture: ComponentFixture<SetPasswordComponent>;
  let auth: any;
  let confirmation: any;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SetPasswordComponent],
      providers: [
        ...commonTestProviders({ session: { userName: 'nurse1' } }),
        {
          provide: AuthService,
          useValue: autoSpy(AuthService, { transactionId: 'tx1' }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    auth = TestBed.inject(AuthService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(SetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.iterationCount = 1;
  });

  afterEach(() => sessionStorage.clear());

  it('creates and reads the username from session storage', () => {
    expect(component).toBeTruthy();
    expect(component.uname).toBe('nurse1');
    expect(component._keySize).toBe(256);
    expect(component._ivSize).toBe(128);
  });

  it('toggles password visibility', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
  });

  it('keySize / iterationCount accessors', () => {
    component.keySize = 128;
    component.iterationCount = 3;
    expect(component.keySize).toBe(128);
    expect(component._iterationCount).toBe(3);
    expect(component.iterationCount).toBe(3);
  });

  it('encrypt produces hex salt+iv prefix and is deterministic for fixed salt/iv', () => {
    const out = component.encrypt(component.Key_IV, 'pwd');
    expect(/^[0-9a-f]{96}.+/.test(out)).toBeTrue();
    const a = component.encryptWithIvSalt(
      'aa'.repeat(32),
      'bb'.repeat(16),
      'k',
      'p'
    );
    expect(a).toBe(
      component.encryptWithIvSalt('aa'.repeat(32), 'bb'.repeat(16), 'k', 'p')
    );
    expect(component.generateKey('aa'.repeat(32), 'k').sigBytes).toBe(32);
  });

  describe('updatePassword', () => {
    it('alerts when passwords do not match', () => {
      component.confirmpwd = 'other';
      component.updatePassword('pwd');
      expect(auth.setNewPassword).not.toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Password does not match',
        'error'
      );
    });

    it('sets the new password and logs out on success', () => {
      spyOn(component, 'logout');
      component.confirmpwd = 'pwd';
      auth.setNewPassword.and.returnValue(of({ statusCode: 200 }));
      component.updatePassword('pwd');
      const args = auth.setNewPassword.calls.mostRecent().args;
      expect(args[0]).toBe('nurse1');
      expect(args[1]).toBe(component.password);
      expect(args[2]).toBe('tx1');
      expect(component.encryptedConfirmPwd).toBeTruthy();
      // the "complete" argument is an assignment, evaluated eagerly
      expect(auth.transactionId).toBeUndefined();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Password changed successfully',
        'success'
      );
      expect(component.logout).toHaveBeenCalled();
    });

    it('alerts and returns to reset-password on non-200', () => {
      component.confirmpwd = 'pwd';
      auth.setNewPassword.and.returnValue(
        of({ statusCode: 5002, errorMessage: 'expired' })
      );
      component.updatePassword('pwd');
      expect(confirmation.alert).toHaveBeenCalledWith('expired', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/reset-password']);
    });

    it('alerts and returns to reset-password on error', () => {
      component.confirmpwd = 'pwd';
      auth.setNewPassword.and.returnValue(throwingObs({ errorMessage: 'err' }));
      component.updatePassword('pwd');
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/reset-password']);
    });
  });

  describe('logout', () => {
    it('clears sessionStorage after navigating to login', fakeAsync(() => {
      sessionStorage.setItem('k', 'v');
      component.logout();
      flushMicrotasks();
      expect(auth.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(sessionStorage.getItem('k')).toBeNull();
    }));

    it('keeps sessionStorage if navigation is rejected', fakeAsync(() => {
      navigateSpy.and.resolveTo(false);
      sessionStorage.setItem('k', 'v');
      component.logout();
      flushMicrotasks();
      expect(sessionStorage.getItem('k')).toBe('v');
    }));
  });

  it('successCallback alerts success and logs out', () => {
    spyOn(component, 'logout');
    component.successCallback({});
    expect(confirmation.alert).toHaveBeenCalledWith(
      'Password changed successfully',
      'success'
    );
    expect(component.logout).toHaveBeenCalled();
  });

  it('errorCallback logs the response', () => {
    spyOn(console, 'log');
    component.errorCallback('bad');
    expect(console.log).toHaveBeenCalledWith('bad');
  });
});
