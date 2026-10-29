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
import { Router } from '@angular/router';
import { WorkareaCanActivate } from './workarea.canactivate.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('WorkareaCanActivate (lab)', () => {
  let guard: WorkareaCanActivate;
  let sessionStorageSpy: jasmine.SpyObj<SessionStorageService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const requiredKeys = [
    'visitCode',
    'benFlowID',
    'visitCategory',
    'beneficiaryRegID',
    'visitID',
    'beneficiaryID',
    'doctorFlag',
    'nurseFlag',
  ];

  beforeEach(() => {
    sessionStorageSpy = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        WorkareaCanActivate,
        { provide: Router, useValue: routerSpy },
        { provide: SessionStorageService, useValue: sessionStorageSpy },
      ],
    });
    guard = TestBed.inject(WorkareaCanActivate);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true when all required session keys are present', () => {
    sessionStorageSpy.getItem.and.callFake((key: string) => {
      const store: Record<string, string> = {
        visitCode: 'VC001',
        benFlowID: '222',
        visitCategory: 'General OPD',
        beneficiaryRegID: '9876',
        visitID: '111',
        beneficiaryID: '333',
        doctorFlag: '1',
        nurseFlag: '2',
      };
      return store[key] || null;
    });

    const result = guard.canActivate(null as any, null as any);
    expect(result).toBeTrue();
  });

  requiredKeys.forEach(missingKey => {
    it(`should return false when '${missingKey}' is missing`, () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === missingKey) return null;
        const store: Record<string, string> = {
          visitCode: 'VC001',
          benFlowID: '222',
          visitCategory: 'General OPD',
          beneficiaryRegID: '9876',
          visitID: '111',
          beneficiaryID: '333',
          doctorFlag: '1',
          nurseFlag: '2',
        };
        return store[key] || null;
      });

      const result = guard.canActivate(null as any, null as any);
      expect(result).toBeFalse();
    });
  });

  it('should return false when all session keys are missing', () => {
    sessionStorageSpy.getItem.and.returnValue(null);
    const result = guard.canActivate(null as any, null as any);
    expect(result).toBeFalse();
  });
});
