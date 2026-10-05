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
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { AncComponent } from './anc.component';
import { DoctorService } from '../shared/services';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('AncComponent', () => {
  let component: AncComponent;
  let fixture: ComponentFixture<AncComponent>;
  let mockDoctorService: jasmine.SpyObj<DoctorService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockBeneficiaryDetailsService: jasmine.SpyObj<BeneficiaryDetailsService>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;

  function buildANCForm(): FormGroup {
    return new FormGroup({
      patientANCDetailsForm: new FormGroup({
        primiGravida: new FormControl(false),
        lmpDate: new FormControl(null),
        expDelDt: new FormControl(null),
      }),
      obstetricFormulaForm: new FormGroup({
        bloodGroup: new FormControl(''),
      }),
      patientANCImmunizationForm: new FormGroup({
        dateReceivedForTT_1: new FormControl(null),
        dateReceivedForTT_2: new FormControl(null),
        dateReceivedForTT_3: new FormControl(null),
      }),
    });
  }

  beforeEach(waitForAsync(() => {
    mockDoctorService = jasmine.createSpyObj('DoctorService', [
      'getAncCareDetails',
      'updateANCDetails',
      'getHRPDetails',
    ]);
    mockDoctorService.getAncCareDetails.and.returnValue(of({}));
    mockDoctorService.updateANCDetails.and.returnValue(of({}));
    mockDoctorService.getHRPDetails.and.returnValue(of({}));

    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);

    mockBeneficiaryDetailsService = jasmine.createSpyObj(
      'BeneficiaryDetailsService',
      ['setHRPPositive', 'resetHRPPositive']
    );

    mockHttpService = jasmine.createSpyObj('HttpServiceService', [], {
      currentLangugae$: new BehaviorSubject<any>({ test: 'language' }),
    });

    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockSessionStorage.getItem.and.callFake((key: string) => {
      const store: Record<string, string> = {
        visitID: '100',
        beneficiaryRegID: '200',
        beneficiaryID: '300',
        sessionID: 'sess-1',
        userName: 'testUser',
        providerServiceID: 'prov-1',
        benFlowID: 'flow-1',
        visitCode: 'vc-1',
        serviceLineDetails: JSON.stringify({
          vanID: 10,
          parkingPlaceID: 20,
        }),
      };
      return store[key] ?? null;
    });

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [AncComponent],
      providers: [
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AncComponent);
    component = fixture.componentInstance;
    component.patientANCDataForm = buildANCForm();
    component.mode = '';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should extract patientANCDetailsForm from parent form', () => {
      expect(component.patientANCDetailsForm).toBeTruthy();
      expect(component.patientANCDetailsForm.get('primiGravida')).toBeTruthy();
    });

    it('should extract obstetricFormulaForm from parent form', () => {
      expect(component.obstetricFormulaForm).toBeTruthy();
      expect(component.obstetricFormulaForm.get('bloodGroup')).toBeTruthy();
    });

    it('should extract patientANCImmunizationForm from parent form', () => {
      expect(component.patientANCImmunizationForm).toBeTruthy();
      expect(
        component.patientANCImmunizationForm.get('dateReceivedForTT_1')
      ).toBeTruthy();
    });

    it('should subscribe to primiGravida valueChanges and update gravidaStatus', () => {
      const primiControl = (
        component.patientANCDataForm.get('patientANCDetailsForm') as FormGroup
      ).controls['primiGravida'];

      primiControl.setValue(true);
      expect(component.gravidaStatus).toBeTrue();

      primiControl.setValue(false);
      expect(component.gravidaStatus).toBeFalse();
    });
  });

  describe('ngDoCheck', () => {
    it('should call assignSelectedLanguage', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngDoCheck();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });
  });

  describe('assignSelectedLanguage', () => {
    it('should set current_language_set from the language service', () => {
      component.assignSelectedLanguage();
      expect(component.current_language_set).toEqual({ test: 'language' });
    });
  });

  describe('ngOnChanges', () => {
    it('should call patchDataToFields when mode is view', () => {
      spyOn(component, 'patchDataToFields' as any);
      component.mode = 'view';
      component.ngOnChanges();
      expect((component as any).patchDataToFields).toHaveBeenCalledWith(
        '200',
        '100'
      );
    });

    it('should call updatePatientANC when mode is update', () => {
      spyOn(component, 'updatePatientANC' as any);
      component.mode = 'update';
      component.ngOnChanges();
      expect((component as any).updatePatientANC).toHaveBeenCalledWith(
        component.patientANCDataForm
      );
    });

    it('should not call patchDataToFields or updatePatientANC when mode is empty', () => {
      spyOn(component, 'patchDataToFields' as any);
      spyOn(component, 'updatePatientANC' as any);
      component.mode = '';
      component.ngOnChanges();
      expect((component as any).patchDataToFields).not.toHaveBeenCalled();
      expect((component as any).updatePatientANC).not.toHaveBeenCalled();
    });

    it('should not call patchDataToFields or updatePatientANC when mode is null', () => {
      spyOn(component, 'patchDataToFields' as any);
      spyOn(component, 'updatePatientANC' as any);
      component.mode = null as any;
      component.ngOnChanges();
      expect((component as any).patchDataToFields).not.toHaveBeenCalled();
      expect((component as any).updatePatientANC).not.toHaveBeenCalled();
    });

    it('should not call patchDataToFields or updatePatientANC when mode is undefined', () => {
      spyOn(component, 'patchDataToFields' as any);
      spyOn(component, 'updatePatientANC' as any);
      component.mode = undefined as any;
      component.ngOnChanges();
      expect((component as any).patchDataToFields).not.toHaveBeenCalled();
      expect((component as any).updatePatientANC).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe ancCareDetails if it exists', () => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component.ancCareDetails = mockSub;
      component.ngOnDestroy();
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe updateANCDetailsSubs if it exists', () => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component.updateANCDetailsSubs = mockSub;
      component.ngOnDestroy();
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw when subscriptions are undefined', () => {
      component.ancCareDetails = undefined;
      component.updateANCDetailsSubs = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('updatePatientANC', () => {
    it('should call doctorService.updateANCDetails with form and temp object', () => {
      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } })
      );
      component.updatePatientANC(component.patientANCDataForm);
      expect(mockDoctorService.updateANCDetails).toHaveBeenCalled();
      const args = mockDoctorService.updateANCDetails.calls.mostRecent().args;
      expect(args[1].beneficiaryRegID).toBe('200');
      expect(args[1].vanID).toBe(10);
      expect(args[1].parkingPlaceID).toBe(20);
    });

    it('should call getHRPDetails and alert on success', () => {
      spyOn(component, 'getHRPDetails');
      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } })
      );
      component.updatePatientANC(component.patientANCDataForm);
      expect(component.getHRPDetails).toHaveBeenCalled();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Updated',
        'success'
      );
    });

    it('should mark form as pristine on success', () => {
      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } })
      );
      spyOn(component.patientANCDataForm, 'markAsPristine');
      component.updatePatientANC(component.patientANCDataForm);
      expect(component.patientANCDataForm.markAsPristine).toHaveBeenCalled();
    });

    it('should alert error when statusCode is not 200', () => {
      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'Server Error' })
      );
      component.updatePatientANC(component.patientANCDataForm);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Server Error',
        'error'
      );
    });

    it('should alert error when data is null', () => {
      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 200, data: null, errorMessage: 'No data' })
      );
      component.updatePatientANC(component.patientANCDataForm);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No data',
        'error'
      );
    });

    it('should alert error on HTTP error', () => {
      mockDoctorService.updateANCDetails.and.returnValue(
        throwError('Network error')
      );
      component.updatePatientANC(component.patientANCDataForm);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });

    it('should normalize TT date fields when they have values', () => {
      const immunizationForm = component.patientANCDataForm.get(
        'patientANCImmunizationForm'
      ) as FormGroup;
      immunizationForm.patchValue({
        dateReceivedForTT_1: new Date('2023-06-15'),
        dateReceivedForTT_2: new Date('2023-07-15'),
        dateReceivedForTT_3: null,
      });

      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'OK' } })
      );
      spyOn(component, 'getHRPDetails');
      component.updatePatientANC(component.patientANCDataForm);

      const tt1Value = immunizationForm.get('dateReceivedForTT_1')?.value;
      const tt2Value = immunizationForm.get('dateReceivedForTT_2')?.value;
      expect(typeof tt1Value).toBe('string');
      expect(typeof tt2Value).toBe('string');
      expect(tt1Value).toContain('T00:00:00.000Z');
      expect(tt2Value).toContain('T00:00:00.000Z');
    });

    it('should normalize lmpDate and expDelDt when they have values', () => {
      const ancDetailsForm = component.patientANCDataForm.get(
        'patientANCDetailsForm'
      ) as FormGroup;
      ancDetailsForm.patchValue({
        lmpDate: new Date('2023-01-10'),
        expDelDt: new Date('2023-10-17'),
      });

      mockDoctorService.updateANCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'OK' } })
      );
      spyOn(component, 'getHRPDetails');
      component.updatePatientANC(component.patientANCDataForm);

      const lmpValue = ancDetailsForm.get('lmpDate')?.value;
      const expValue = ancDetailsForm.get('expDelDt')?.value;
      expect(typeof lmpValue).toBe('string');
      expect(typeof expValue).toBe('string');
      expect(lmpValue).toContain('T00:00:00.000Z');
      expect(expValue).toContain('T00:00:00.000Z');
    });
  });

  describe('patchDataToFields', () => {
    it('should call doctorService.getAncCareDetails with correct params', () => {
      mockDoctorService.getAncCareDetails.and.returnValue(of({}));
      component.patchDataToFields('200', '100');
      expect(mockDoctorService.getAncCareDetails).toHaveBeenCalledWith(
        '200',
        '100'
      );
    });

    it('should patch ANC details form on success', () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          ANCCareDetail: {
            primiGravida: true,
            lmpDate: '2023-01-10T00:00:00Z',
            expDelDt: '2023-10-17T00:00:00Z',
            bloodGroup: 'A+',
          },
          ANCWomenVaccineDetails: {
            dateReceivedForTT_1: '2023-02-01T00:00:00Z',
            dateReceivedForTT_2: '2023-03-01T00:00:00Z',
            dateReceivedForTT_3: '2023-04-01T00:00:00Z',
          },
        },
      };
      mockDoctorService.getAncCareDetails.and.returnValue(of(mockResponse));
      component.patchDataToFields('200', '100');

      expect(component.gravidaStatus).toBeTrue();
    });

    it('should disable bloodGroup when it is present and not "Don\'t Know"', () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          ANCCareDetail: {
            primiGravida: false,
            lmpDate: '2023-01-10T00:00:00Z',
            expDelDt: '2023-10-17T00:00:00Z',
            bloodGroup: 'B+',
          },
          ANCWomenVaccineDetails: null,
        },
      };
      mockDoctorService.getAncCareDetails.and.returnValue(of(mockResponse));
      component.patchDataToFields('200', '100');

      const bloodGroupControl = (
        component.patientANCDataForm.get('obstetricFormulaForm') as FormGroup
      ).controls['bloodGroup'];
      expect(bloodGroupControl.disabled).toBeTrue();
    });

    it('should not disable bloodGroup when it is "Don\'t Know"', () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          ANCCareDetail: {
            primiGravida: false,
            lmpDate: '2023-01-10T00:00:00Z',
            expDelDt: '2023-10-17T00:00:00Z',
            bloodGroup: "Don't Know",
          },
          ANCWomenVaccineDetails: null,
        },
      };
      mockDoctorService.getAncCareDetails.and.returnValue(of(mockResponse));
      component.patchDataToFields('200', '100');

      const bloodGroupControl = (
        component.patientANCDataForm.get('obstetricFormulaForm') as FormGroup
      ).controls['bloodGroup'];
      expect(bloodGroupControl.disabled).toBeFalse();
    });

    it('should alert error when statusCode is not 200', () => {
      const mockResponse = {
        statusCode: 500,
        errorMessage: 'Failed to load',
        data: null,
      };
      mockDoctorService.getAncCareDetails.and.returnValue(of(mockResponse));
      component.patchDataToFields('200', '100');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Failed to load',
        'error'
      );
    });

    it('should alert error on HTTP failure', () => {
      mockDoctorService.getAncCareDetails.and.returnValue(
        throwError('Network error')
      );
      component.patchDataToFields('200', '100');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });

    it('should handle null ANCCareDetail gracefully', () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          ANCCareDetail: null,
          ANCWomenVaccineDetails: null,
        },
      };
      mockDoctorService.getAncCareDetails.and.returnValue(of(mockResponse));
      expect(() => component.patchDataToFields('200', '100')).not.toThrow();
    });
  });

  describe('getHRPDetails', () => {
    it('should call doctorService.getHRPDetails with session data', () => {
      mockDoctorService.getHRPDetails.and.returnValue(of({}));
      component.getHRPDetails();
      expect(mockDoctorService.getHRPDetails).toHaveBeenCalledWith(
        '200',
        'vc-1'
      );
    });

    it('should call setHRPPositive when isHRP is true', () => {
      mockDoctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } })
      );
      component.getHRPDetails();
      expect(mockBeneficiaryDetailsService.setHRPPositive).toHaveBeenCalled();
    });

    it('should call resetHRPPositive when isHRP is false', () => {
      mockDoctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } })
      );
      component.getHRPDetails();
      expect(mockBeneficiaryDetailsService.resetHRPPositive).toHaveBeenCalled();
    });

    it('should not call setHRPPositive or resetHRPPositive when statusCode is not 200', () => {
      mockDoctorService.getHRPDetails.and.returnValue(of({ statusCode: 500 }));
      component.getHRPDetails();
      expect(
        mockBeneficiaryDetailsService.setHRPPositive
      ).not.toHaveBeenCalled();
      expect(
        mockBeneficiaryDetailsService.resetHRPPositive
      ).not.toHaveBeenCalled();
    });

    it('should not call setHRPPositive or resetHRPPositive when data is null', () => {
      mockDoctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.getHRPDetails();
      expect(
        mockBeneficiaryDetailsService.setHRPPositive
      ).not.toHaveBeenCalled();
      expect(
        mockBeneficiaryDetailsService.resetHRPPositive
      ).not.toHaveBeenCalled();
    });
  });

  describe('normalizeToUTCMidnight (private)', () => {
    it('should return null for null input', () => {
      const result = (component as any).normalizeToUTCMidnight(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = (component as any).normalizeToUTCMidnight(undefined);
      expect(result).toBeNull();
    });

    it('should return a UTC midnight ISO string for a valid date', () => {
      const result = (component as any).normalizeToUTCMidnight(
        new Date('2023-06-15T14:30:00Z')
      );
      expect(result).toBe('2023-06-15T00:00:00.000Z');
    });

    it('should normalize different times on the same day to the same midnight', () => {
      const result1 = (component as any).normalizeToUTCMidnight(
        new Date(2023, 5, 15, 10, 30)
      );
      const result2 = (component as any).normalizeToUTCMidnight(
        new Date(2023, 5, 15, 22, 0)
      );
      expect(result1).toBe(result2);
    });
  });
});
