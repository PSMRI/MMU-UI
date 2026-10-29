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
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { DoctorWorklistComponent } from './doctor-worklist.component';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { DoctorService } from '../shared/services/doctor.service';
import { MasterdataService } from '../shared/services/masterdata.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('DoctorWorklistComponent', () => {
  let component: DoctorWorklistComponent;
  let fixture: ComponentFixture<DoctorWorklistComponent>;

  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockCameraService: jasmine.SpyObj<CameraService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMasterdataService: jasmine.SpyObj<MasterdataService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockHttpServiceService: jasmine.SpyObj<HttpServiceService>;
  let mockBeneficiaryDetailsService: jasmine.SpyObj<BeneficiaryDetailsService>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;
  let mockDoctorService: jasmine.SpyObj<DoctorService>;

  const mockLanguageSet = {
    alerts: {
      info: {
        imageNotFound: 'Image not found',
        consulation: 'Consultation info',
        confirmtoProceedFurther: 'Confirm to proceed further',
        pending: 'Pending',
        pendingConsult: 'Pending Consultation',
        labtestDone: 'Lab test done',
      },
    },
    common: {
      tmReferred: 'TM Referred',
    },
  };

  beforeEach(waitForAsync(() => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockCameraService = jasmine.createSpyObj('CameraService', ['viewImage']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockMasterdataService = jasmine.createSpyObj('MasterdataService', [
      'reset',
    ]);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockHttpServiceService = jasmine.createSpyObj('HttpServiceService', [], {
      currentLangugae$: of(mockLanguageSet),
    });
    mockBeneficiaryDetailsService = jasmine.createSpyObj(
      'BeneficiaryDetailsService',
      ['reset', 'getBeneficiaryImage']
    );
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockDoctorService = jasmine.createSpyObj('DoctorService', [
      'getDoctorWorklist',
    ]);

    mockDoctorService.getDoctorWorklist.and.returnValue(
      of({ statusCode: 200, data: [] })
    );

    TestBed.configureTestingModule({
      declarations: [DoctorWorklistComponent],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: CameraService, useValue: mockCameraService },
        { provide: Router, useValue: mockRouter },
        { provide: MasterdataService, useValue: mockMasterdataService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: HttpServiceService, useValue: mockHttpServiceService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        {
          provide: SessionStorageService,
          useValue: mockSessionStorageService,
        },
        { provide: DoctorService, useValue: mockDoctorService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorWorklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set currentRole to Doctor in session storage', () => {
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'currentRole',
        'Doctor'
      );
    });

    it('should call loadWorklist on init', () => {
      expect(mockDoctorService.getDoctorWorklist).toHaveBeenCalled();
    });

    it('should reset beneficiaryDetailsService and masterdataService', () => {
      expect(mockBeneficiaryDetailsService.reset).toHaveBeenCalled();
      expect(mockMasterdataService.reset).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should remove currentRole from sessionStorage', () => {
      spyOn(sessionStorage, 'removeItem');
      component.ngOnDestroy();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentRole');
    });
  });

  describe('removeBeneficiaryDataForDoctorVisit', () => {
    it('should remove multiple items from sessionStorage', () => {
      spyOn(sessionStorage, 'removeItem');
      component.removeBeneficiaryDataForDoctorVisit();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('visitCode');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        'beneficiaryGender'
      );
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('benFlowID');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('visitCategory');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        'beneficiaryRegID'
      );
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('visitID');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('beneficiaryID');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('doctorFlag');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('nurseFlag');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('pharmacist_flag');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('caseSheetTMFlag');
    });
  });

  describe('pageChanged', () => {
    it('should slice filteredBeneficiaryList based on page event', () => {
      component.filteredBeneficiaryList = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
      ];
      component.pageChanged({ page: 2, itemsPerPage: 3 });
      expect(component.pagedList.length).toBe(3);
      expect(component.pagedList as any[]).toEqual([
        { id: 4 },
        { id: 5 },
        { id: 6 },
      ]);
    });

    it('should return empty if page exceeds data length', () => {
      component.filteredBeneficiaryList = [{ id: 1 }, { id: 2 }];
      component.pageChanged({ page: 3, itemsPerPage: 5 });
      expect(component.pagedList.length).toBe(0);
    });
  });

  describe('loadWorklist', () => {
    it('should process worklist data when statusCode is 200', () => {
      const mockData = {
        statusCode: 200,
        data: [
          {
            beneficiaryID: '123',
            doctorFlag: 1,
            nurseFlag: 0,
            specialist_flag: 0,
            visitDate: '01-01-2023 10:00 AM',
            benVisitDate: '2023-01-01T10:00:00',
          },
        ],
      };
      mockDoctorService.getDoctorWorklist.and.returnValue(of(mockData));
      component.loadWorklist();
      expect(component.beneficiaryList).toBeDefined();
      expect(component.filteredBeneficiaryList).toBeDefined();
      expect(component.filterTerm).toBeNull();
    });

    it('should call confirmationService.alert on error response', () => {
      const mockData = {
        statusCode: 500,
        errorMessage: 'Server error',
      };
      mockDoctorService.getDoctorWorklist.and.returnValue(of(mockData));
      component.loadWorklist();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Server error',
        'error'
      );
    });

    it('should call confirmationService.alert on http error', () => {
      mockDoctorService.getDoctorWorklist.and.returnValue(
        throwError('Network error')
      );
      component.loadWorklist();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });

    it('should not call confirmationService.alert when error is handled', () => {
      mockConfirmationService.alert.calls.reset();
      mockDoctorService.getDoctorWorklist.and.returnValue(
        throwError({ handled: true })
      );
      component.loadWorklist();
      expect(mockConfirmationService.alert).not.toHaveBeenCalled();
    });
  });

  describe('loadDataToBenList', () => {
    it('should set default values for missing fields', () => {
      const data = [
        {
          visitDate: '01-01-2023 10:00 AM',
          benVisitDate: '2023-01-01T10:00:00',
        },
      ];
      const result = component.loadDataToBenList(data);
      expect(result[0].genderName).toBe('Not Available');
      expect(result[0].age).toBe('Not Available');
      expect(result[0].statusMessage).toBe('Not Available');
      expect(result[0].VisitCategory).toBe('Not Available');
      expect(result[0].benVisitNo).toBe('Not Available');
      expect(result[0].districtName).toBe('Not Available');
      expect(result[0].villageName).toBe('Not Available');
      expect(result[0].preferredPhoneNum).toBe('Not Available');
      expect(result[0].arrival).toBe(false);
    });

    it('should keep existing values if present', () => {
      const data = [
        {
          genderName: 'Male',
          age: '30',
          statusMessage: 'Pending',
          VisitCategory: 'ANC',
          benVisitNo: '1',
          districtName: 'District1',
          villageName: 'Village1',
          preferredPhoneNum: '1234567890',
          visitDate: '01-01-2023 10:00 AM',
          benVisitDate: '2023-01-01T10:00:00',
        },
      ];
      const result = component.loadDataToBenList(data);
      expect(result[0].genderName).toBe('Male');
      expect(result[0].age).toBe('30');
    });
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        { beneficiaryID: 'BEN001', benName: 'John', genderName: 'Male' },
        { beneficiaryID: 'BEN002', benName: 'Jane', genderName: 'Female' },
      ];
    });

    it('should reset filteredBeneficiaryList when searchTerm is empty', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toEqual(
        component.beneficiaryList
      );
    });

    it('should filter by beneficiaryID', () => {
      component.filterBeneficiaryList('BEN001');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].beneficiaryID).toBe('BEN001');
    });

    it('should filter case-insensitively', () => {
      component.filterBeneficiaryList('john');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].benName).toBe('John');
    });

    it('should return empty for no match', () => {
      component.filterBeneficiaryList('ZZZZZ');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });
  });

  describe('patientImageView', () => {
    it('should call viewImage when benImage is present', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: 'base64imagedata' })
      );
      component.patientImageView('REG001');
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).toHaveBeenCalledWith('REG001');
      expect(mockCameraService.viewImage).toHaveBeenCalledWith(
        'base64imagedata'
      );
    });

    it('should call confirmationService.alert when benImage is not present', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(of({}));
      component.currentLanguageSet = mockLanguageSet;
      component.patientImageView('REG001');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Image not found'
      );
    });
  });

  describe('loadDoctorExaminationPage', () => {
    const baseBeneficiary = {
      visitCode: 'VC001',
      beneficiaryRegID: 'REG001',
      beneficiaryID: 'BEN001',
      benFlowID: 'BF001',
      VisitCategory: 'General OPD',
      genderName: 'Male',
      benVisitID: 'VIS001',
      doctorFlag: 1,
      nurseFlag: 0,
      pharmacist_flag: 0,
      preferredPhoneNum: '1234567890',
      statusMessage: 'Pending Consultation',
    };

    it('should set visitCode in session storage', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage({
        ...baseBeneficiary,
        statusCode: 1,
      });
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'visitCode',
        'VC001'
      );
    });

    it('should route to work area for statusCode 1', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.loadDoctorExaminationPage({
        ...baseBeneficiary,
        statusCode: 1,
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should show alert for statusCode 2', () => {
      component.loadDoctorExaminationPage({
        ...baseBeneficiary,
        statusCode: 2,
        statusMessage: 'Pending',
      });
      expect(mockConfirmationService.alert).toHaveBeenCalledWith('Pending');
    });

    it('should route to work area for statusCode 3', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.loadDoctorExaminationPage({
        ...baseBeneficiary,
        statusCode: 3,
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should call viewAndPrintCaseSheet for statusCode 9', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage({
        ...baseBeneficiary,
        statusCode: 9,
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should call viewAndPrintCaseSheet for statusCode 10', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage({
        ...baseBeneficiary,
        statusCode: 10,
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });
  });

  describe('viewAndPrintCaseSheet', () => {
    it('should call routeToCaseSheet when user confirms', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      const beneficiary = {
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        beneficiaryRegID: 'REG001',
        benVisitID: 'VIS001',
      };
      component.viewAndPrintCaseSheet(beneficiary);
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'caseSheetBenFlowID',
        'BF001'
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/MMU/current',
      ]);
    });

    it('should not route when user cancels', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      mockRouter.navigate.calls.reset();
      const beneficiary = {
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        beneficiaryRegID: 'REG001',
        benVisitID: 'VIS001',
      };
      component.viewAndPrintCaseSheet(beneficiary);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('routeToCaseSheet', () => {
    it('should set session items and navigate', () => {
      const beneficiary = {
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        beneficiaryRegID: 'REG001',
        benVisitID: 'VIS001',
      };
      component.routeToCaseSheet(beneficiary);
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'caseSheetBenFlowID',
        'BF001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'General OPD'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'caseSheetBeneficiaryRegID',
        'REG001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'caseSheetVisitID',
        'VIS001'
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/MMU/current',
      ]);
    });
  });

  describe('routeToWorkArea', () => {
    it('should call updateWorkArea when user confirms', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      const beneficiary = {
        beneficiaryRegID: 'REG001',
        genderName: 'Male',
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        benVisitID: 'VIS001',
        beneficiaryID: 'BEN001',
        doctorFlag: 1,
        nurseFlag: 0,
        pharmacist_flag: 0,
        preferredPhoneNum: '1234567890',
      };
      component.routeToWorkArea(beneficiary);
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/attendant/doctor/patient/',
        'REG001',
      ]);
    });

    it('should not navigate when user cancels', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      mockRouter.navigate.calls.reset();
      component.routeToWorkArea({ beneficiaryRegID: 'REG001' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('updateWorkArea', () => {
    it('should navigate to doctor patient page', () => {
      const beneficiary = {
        beneficiaryRegID: 'REG001',
        genderName: 'Male',
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        benVisitID: 'VIS001',
        beneficiaryID: 'BEN001',
        doctorFlag: 1,
        nurseFlag: 0,
        pharmacist_flag: 0,
        preferredPhoneNum: '1234567890',
      };
      component.updateWorkArea(beneficiary);
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/attendant/doctor/patient/',
        'REG001',
      ]);
    });
  });

  describe('setDataForWorkArea', () => {
    it('should set all session items and return true', () => {
      const beneficiary = {
        genderName: 'Male',
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        beneficiaryRegID: 'REG001',
        benVisitID: 'VIS001',
        beneficiaryID: 'BEN001',
        doctorFlag: 1,
        nurseFlag: 0,
        pharmacist_flag: 0,
        preferredPhoneNum: '1234567890',
      };
      const result = component.setDataForWorkArea(beneficiary);
      expect(result).toBe(true);
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'beneficiaryGender',
        'Male'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'benFlowID',
        'BF001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'General OPD'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'beneficiaryRegID',
        'REG001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'visitID',
        'VIS001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'beneficiaryID',
        'BEN001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'doctorFlag',
        1
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'nurseFlag',
        0
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'pharmacist_flag',
        0
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'phnum',
        '1234567890'
      );
    });
  });

  describe('checkDoctorStatusAtTcCancelled', () => {
    it('should alert when doctorFlag is 2', () => {
      component.checkDoctorStatusAtTcCancelled({
        doctorFlag: 2,
        nurseFlag: 0,
        statusMessage: 'Pending',
      });
      expect(mockConfirmationService.alert).toHaveBeenCalledWith('Pending');
    });

    it('should alert when nurseFlag is 2', () => {
      component.checkDoctorStatusAtTcCancelled({
        doctorFlag: 0,
        nurseFlag: 2,
        statusMessage: 'Pending',
      });
      expect(mockConfirmationService.alert).toHaveBeenCalledWith('Pending');
    });

    it('should route to work area when doctorFlag is 1', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.checkDoctorStatusAtTcCancelled({
        doctorFlag: 1,
        nurseFlag: 0,
        beneficiaryRegID: 'REG001',
        genderName: 'Male',
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        benVisitID: 'VIS001',
        beneficiaryID: 'BEN001',
        pharmacist_flag: 0,
        preferredPhoneNum: '1234567890',
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should route to work area when doctorFlag is 3', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.checkDoctorStatusAtTcCancelled({
        doctorFlag: 3,
        nurseFlag: 0,
        beneficiaryRegID: 'REG001',
        genderName: 'Male',
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        benVisitID: 'VIS001',
        beneficiaryID: 'BEN001',
        pharmacist_flag: 0,
        preferredPhoneNum: '1234567890',
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });

    it('should call viewAndPrintCaseSheet when doctorFlag is 9', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.checkDoctorStatusAtTcCancelled({
        doctorFlag: 9,
        nurseFlag: 0,
        benFlowID: 'BF001',
        VisitCategory: 'General OPD',
        beneficiaryRegID: 'REG001',
        benVisitID: 'VIS001',
      });
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });
  });

  describe('getVisitStatus', () => {
    beforeEach(() => {
      component.currentLanguageSet = mockLanguageSet;
    });

    it('should return statusCode 2 when doctorFlag is 2', () => {
      const result = component.getVisitStatus({
        doctorFlag: 2,
        nurseFlag: 0,
        specialist_flag: 0,
      });
      expect(result.statusCode).toBe(2);
      expect(result.statusMessage).toBe('Pending');
    });

    it('should return statusCode 2 when nurseFlag is 2', () => {
      const result = component.getVisitStatus({
        doctorFlag: 0,
        nurseFlag: 2,
        specialist_flag: 0,
      });
      expect(result.statusCode).toBe(2);
      expect(result.statusMessage).toBe('Pending');
    });

    it('should return statusCode 1 when doctorFlag is 1', () => {
      const result = component.getVisitStatus({
        doctorFlag: 1,
        nurseFlag: 0,
        specialist_flag: 0,
      });
      expect(result.statusCode).toBe(1);
      expect(result.statusMessage).toBe('Pending Consultation');
    });

    it('should return statusCode 3 when doctorFlag is 3', () => {
      const result = component.getVisitStatus({
        doctorFlag: 3,
        nurseFlag: 0,
        specialist_flag: 0,
      });
      expect(result.statusCode).toBe(3);
      expect(result.statusMessage).toBe('Lab test done');
    });

    it('should return statusCode 10 when specialist_flag is 100', () => {
      const result = component.getVisitStatus({
        doctorFlag: 0,
        nurseFlag: 0,
        specialist_flag: 100,
      });
      expect(result.statusCode).toBe(10);
      expect(result.statusMessage).toBe('TM Referred');
    });

    it('should return statusCode 9 when doctorFlag is 9', () => {
      const result = component.getVisitStatus({
        doctorFlag: 9,
        nurseFlag: 0,
        specialist_flag: 0,
      });
      expect(result.statusCode).toBe(9);
      expect(result.statusMessage).toBe('Consultation Done');
    });

    it('should return statusCode 0 when no flags match', () => {
      const result = component.getVisitStatus({
        doctorFlag: 0,
        nurseFlag: 0,
        specialist_flag: 0,
      });
      expect(result.statusCode).toBe(0);
      expect(result.statusMessage).toBe('');
    });
  });

  describe('fetchLanguageResponse', () => {
    it('should set currentLanguageSet', () => {
      component.fetchLanguageResponse();
      expect(component.currentLanguageSet).toBeDefined();
    });
  });

  describe('ngDoCheck', () => {
    it('should call fetchLanguageResponse', () => {
      spyOn(component, 'fetchLanguageResponse');
      component.ngDoCheck();
      expect(component.fetchLanguageResponse).toHaveBeenCalled();
    });

    it('should update beneficiaryMetaData statuses when data exists', () => {
      component.currentLanguageSet = mockLanguageSet;
      component.beneficiaryMetaData = [
        { doctorFlag: 1, nurseFlag: 0, specialist_flag: 0 },
      ];
      component.ngDoCheck();
      expect(component.beneficiaryMetaData[0].statusCode).toBe(1);
      expect(component.beneficiaryMetaData[0].statusMessage).toBe(
        'Pending Consultation'
      );
    });
  });
});
