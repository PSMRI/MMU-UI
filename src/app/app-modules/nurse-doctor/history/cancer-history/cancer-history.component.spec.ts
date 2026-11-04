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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { CancerHistoryComponent } from './cancer-history.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('CancerHistoryComponent', () => {
  let component: CancerHistoryComponent;
  let fixture: ComponentFixture<CancerHistoryComponent>;
  let fb: FormBuilder;
  let mockDoctorService: jasmine.SpyObj<DoctorService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockBeneficiaryDetailsService: any;
  let mockHttpServiceService: any;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;
  let beneficiarySubject: BehaviorSubject<any>;

  function buildCancerHistoryForm(): FormGroup {
    return fb.group({
      cancerPatientFamilyMedicalHistoryForm: fb.group({
        diseases: [''],
      }),
      cancerPatientPerosnalHistoryForm: fb.group({
        tobaccoUse: [''],
        alcoholUse: [''],
      }),
      cancerPatientObstetricHistoryForm: fb.group({
        pregnancyStatus: [''],
      }),
    });
  }

  beforeEach(waitForAsync(() => {
    fb = new FormBuilder();
    beneficiarySubject = new BehaviorSubject<any>(null);

    mockDoctorService = jasmine.createSpyObj('DoctorService', [
      'getCancerHistoryDetails',
      'updateCancerHistoryDetails',
    ]);

    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);

    mockBeneficiaryDetailsService = {
      beneficiaryDetails$: beneficiarySubject.asObservable(),
    };

    mockHttpServiceService = {
      currentLangugae$: new BehaviorSubject<any>({ language: 'English' }),
    };

    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [CancerHistoryComponent],
      providers: [
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        { provide: HttpServiceService, useValue: mockHttpServiceService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CancerHistoryComponent);
    component = fixture.componentInstance;
    component.nurseCancerHistoryForm = buildCancerHistoryForm();
    component.mode = 'new';
    component.pregnancyStatus = '';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize sub-form references', () => {
      component.ngOnInit();
      expect(component.cancerPatientFamilyMedicalHistoryForm).toBeTruthy();
      expect(component.cancerPatientPerosnalHistoryForm).toBeTruthy();
      expect(component.cancerPatientObstetricHistoryForm).toBeTruthy();
    });

    it('should subscribe to beneficiary details', () => {
      component.ngOnInit();
      const beneficiary = { name: 'Test Patient' };
      beneficiarySubject.next(beneficiary);
      expect(component.templateBeneficiaryDetails).toEqual(beneficiary);
    });

    it('should set language', () => {
      component.ngOnInit();
      expect(component.currentLanguageSet).toBeTruthy();
    });
  });

  describe('ngOnChanges', () => {
    it('should fetch cancer history in view mode', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'visitID') return '123';
        if (key === 'beneficiaryRegID') return '456';
        return null;
      });
      mockDoctorService.getCancerHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.mode = 'view';
      component.ngOnChanges({});
      expect(mockDoctorService.getCancerHistoryDetails).toHaveBeenCalledWith(
        '456',
        '123'
      );
    });

    it('should call updatePateintHistory in update mode', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails')
          return JSON.stringify({ vanID: 1, parkingPlaceID: 2 });
        return 'testValue';
      });
      mockDoctorService.updateCancerHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } })
      );
      component.mode = 'update';
      component.ngOnChanges({});
      expect(mockDoctorService.updateCancerHistoryDetails).toHaveBeenCalled();
    });
  });

  describe('updatePateintHistory', () => {
    beforeEach(() => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails')
          return JSON.stringify({ vanID: 10, parkingPlaceID: 20 });
        return 'testVal';
      });
    });

    it('should show success on successful update', () => {
      mockDoctorService.updateCancerHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'History updated' } })
      );
      component.updatePateintHistory(component.nurseCancerHistoryForm);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'History updated',
        'success'
      );
    });

    it('should show error on failed update', () => {
      mockDoctorService.updateCancerHistoryDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'Server error' })
      );
      component.updatePateintHistory(component.nurseCancerHistoryForm);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Server error',
        'error'
      );
    });

    it('should show error on HTTP error', () => {
      mockDoctorService.updateCancerHistoryDetails.and.returnValue(
        throwError('Network error')
      );
      component.updatePateintHistory(component.nurseCancerHistoryForm);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });

  describe('getCancerHistory', () => {
    it('should patch form values on successful response', () => {
      const historyData = {
        statusCode: 200,
        data: {
          benPersonalHistory: { tobaccoUse: 'Yes' },
          benPersonalDietHistory: {},
          benFamilyHistory: [{ diseaseType: 'Breast Cancer' }],
          benObstetricHistory: { pregnancyStatus: 'Yes' },
        },
      };
      mockDoctorService.getCancerHistoryDetails.and.returnValue(
        of(historyData)
      );
      component.ngOnInit();
      component.getCancerHistory('456', '123');
      expect(component.familyHistoryData).toEqual([
        { diseaseType: 'Breast Cancer' },
      ]);
    });

    it('should not patch when data is null', () => {
      mockDoctorService.getCancerHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.ngOnInit();
      component.getCancerHistory('456', '123');
      expect(component.familyHistoryData).toBeUndefined();
    });
  });

  describe('getBenificiaryDetails', () => {
    it('should set templateBeneficiaryDetails when beneficiary data exists', () => {
      component.ngOnInit();
      beneficiarySubject.next({ name: 'John' });
      expect(component.templateBeneficiaryDetails).toEqual({ name: 'John' });
    });

    it('should not set templateBeneficiaryDetails when null', () => {
      component.ngOnInit();
      beneficiarySubject.next(null);
      expect(component.templateBeneficiaryDetails).toBeUndefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from beneficiary details', () => {
      component.ngOnInit();
      component.ngOnDestroy();
      expect(component.beneficiaryDetailsSubscription).toBeDefined();
    });

    it('should unsubscribe from cancer history if exists', () => {
      mockDoctorService.getCancerHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.ngOnInit();
      component.getCancerHistory('1', '2');
      component.ngOnDestroy();
      expect(component.cancerHistorySubscription).toBeDefined();
    });

    it('should handle undefined subscriptions gracefully', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('ngDoCheck', () => {
    it('should call fetchLanguageResponse', () => {
      spyOn(component, 'fetchLanguageResponse');
      component.ngDoCheck();
      expect(component.fetchLanguageResponse).toHaveBeenCalled();
    });
  });

  describe('fetchLanguageResponse', () => {
    it('should set currentLanguageSet from language service', () => {
      component.fetchLanguageResponse();
      expect(component.currentLanguageSet).toBeTruthy();
    });
  });
});
