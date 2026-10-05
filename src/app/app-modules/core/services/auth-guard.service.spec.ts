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

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let mockUrlTree: UrlTree;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'validateSessionKey',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockUrlTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(mockUrlTree);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    const mockRoute = {} as any;
    const mockState = {} as any;

    it('should return true when session is valid (statusCode 200 and data is truthy)', done => {
      authServiceSpy.validateSessionKey.and.returnValue(
        of({ statusCode: 200, data: { userId: 1 } })
      );

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should redirect to /login when statusCode is not 200', done => {
      authServiceSpy.validateSessionKey.and.returnValue(
        of({ statusCode: 401, data: null })
      );

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should redirect to /login when data is falsy', done => {
      authServiceSpy.validateSessionKey.and.returnValue(
        of({ statusCode: 200, data: null })
      );

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should redirect to /login when response is null', done => {
      authServiceSpy.validateSessionKey.and.returnValue(of(null as any));

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should redirect to /login when response is undefined', done => {
      authServiceSpy.validateSessionKey.and.returnValue(of(undefined as any));

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should redirect to /login on HTTP error', done => {
      authServiceSpy.validateSessionKey.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should redirect to /login when statusCode is 200 but data is empty string', done => {
      authServiceSpy.validateSessionKey.and.returnValue(
        of({ statusCode: 200, data: '' })
      );

      guard.canActivate(mockRoute, mockState).subscribe((result: any) => {
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        done();
      });
    });
  });
});
