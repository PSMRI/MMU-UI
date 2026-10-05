import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WorkareaCanActivate } from './workarea-can-activate.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('WorkareaCanActivate (nurse-doctor)', () => {
  let guard: WorkareaCanActivate;
  let sessionStorageSpy: jasmine.SpyObj<SessionStorageService>;
  let routerSpy: jasmine.SpyObj<Router>;

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

  describe('when visitCategory is present', () => {
    const visitCategoryBranchKeys = [
      'visitCode',
      'beneficiaryGender',
      'benFlowID',
      'visitCategory',
      'beneficiaryRegID',
      'visitID',
      'beneficiaryID',
      'nurseFlag',
    ];

    it('should return true when all required keys are present', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        const store: Record<string, string> = {
          visitCode: 'VC001',
          beneficiaryGender: 'Male',
          benFlowID: '222',
          visitCategory: 'General OPD',
          beneficiaryRegID: '9876',
          visitID: '111',
          beneficiaryID: '333',
          nurseFlag: '2',
        };
        return store[key] || null;
      });

      expect(guard.canActivate(null as any, null as any)).toBeTrue();
    });

    visitCategoryBranchKeys.forEach(missingKey => {
      if (missingKey === 'visitCategory') return;
      it(`should return false when '${missingKey}' is missing`, () => {
        sessionStorageSpy.getItem.and.callFake((key: string) => {
          if (key === missingKey) return null;
          const store: Record<string, string> = {
            visitCode: 'VC001',
            beneficiaryGender: 'Male',
            benFlowID: '222',
            visitCategory: 'General OPD',
            beneficiaryRegID: '9876',
            visitID: '111',
            beneficiaryID: '333',
            nurseFlag: '2',
          };
          return store[key] || null;
        });

        expect(guard.canActivate(null as any, null as any)).toBeFalse();
      });
    });
  });

  describe('when visitCategory is absent (falsy)', () => {
    const noVisitCategoryKeys = [
      'beneficiaryGender',
      'beneficiaryRegID',
      'beneficiaryID',
      'benFlowID',
    ];

    it('should return true when all 4 required keys are present', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        const store: Record<string, string> = {
          beneficiaryGender: 'Female',
          beneficiaryRegID: '9876',
          beneficiaryID: '333',
          benFlowID: '222',
        };
        return store[key] || null;
      });

      expect(guard.canActivate(null as any, null as any)).toBeTrue();
    });

    noVisitCategoryKeys.forEach(missingKey => {
      it(`should return false when '${missingKey}' is missing`, () => {
        sessionStorageSpy.getItem.and.callFake((key: string) => {
          if (key === missingKey) return null;
          const store: Record<string, string> = {
            beneficiaryGender: 'Female',
            beneficiaryRegID: '9876',
            beneficiaryID: '333',
            benFlowID: '222',
          };
          return store[key] || null;
        });

        expect(guard.canActivate(null as any, null as any)).toBeFalse();
      });
    });

    it('should return false when all keys are missing', () => {
      sessionStorageSpy.getItem.and.returnValue(null);
      expect(guard.canActivate(null as any, null as any)).toBeFalse();
    });
  });
});
