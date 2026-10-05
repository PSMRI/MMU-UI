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
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { of, throwError } from 'rxjs';

import { WorklistComponent } from './worklist.component';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { LabService, MasterDataService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('WorklistComponent', () => {
  let component: WorklistComponent;
  let fixture: ComponentFixture<WorklistComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockCameraService: jasmine.SpyObj<CameraService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMasterDataService: jasmine.SpyObj<MasterDataService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockBeneficiaryDetailsService: jasmine.SpyObj<BeneficiaryDetailsService>;
  let mockLabService: jasmine.SpyObj<LabService>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;
  let mockHttpServiceService: jasmine.SpyObj<HttpServiceService>;

  const mockWorklistResponse = {
    statusCode: 200,
    data: [
      {
        beneficiaryID: 'BEN001',
        beneficiaryRegID: 'REG001',
        benName: 'John Doe',
        genderName: 'Male',
        age: '30',
        VisitCategory: 'General OPD',
        benVisitNo: '1',
        districtName: 'District A',
        villageName: 'Village A',
        preferredPhoneNum: '9876543210',
        benFlowID: 'FLOW001',
        benVisitID: 'VISIT001',
        visitDate: '2024-01-15T10:30:00',
        benVisitDate: '2024-01-15T10:30:00',
        doctorFlag: '1',
        nurseFlag: '9',
        specialist_flag: 0,
        visitCode: 'VC001',
      },
      {
        beneficiaryID: 'BEN002',
        beneficiaryRegID: 'REG002',
        benName: 'Jane Smith',
        genderName: 'Female',
        age: '25',
        VisitCategory: 'ANC',
        benVisitNo: '2',
        districtName: 'District B',
        villageName: 'Village B',
        preferredPhoneNum: '9876543211',
        benFlowID: 'FLOW002',
        benVisitID: 'VISIT002',
        visitDate: '2024-01-16T11:00:00',
        benVisitDate: '2024-01-16T11:00:00',
        doctorFlag: '2',
        nurseFlag: '9',
        specialist_flag: 1,
        visitCode: 'VC002',
      },
    ],
  };

  beforeEach(waitForAsync(() => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockCameraService = jasmine.createSpyObj('CameraService', ['viewImage']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockMasterDataService = jasmine.createSpyObj('MasterDataService', [
      'getMasterData',
    ]);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockBeneficiaryDetailsService = jasmine.createSpyObj(
      'BeneficiaryDetailsService',
      ['reset', 'getBeneficiaryImage']
    );
    mockLabService = jasmine.createSpyObj('LabService', ['getLabWorklist']);
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockHttpServiceService = jasmine.createSpyObj('HttpServiceService', [
      'setLanguage',
      'currentLangugae$',
    ]);

    mockLabService.getLabWorklist.and.returnValue(of(mockWorklistResponse));
    mockHttpServiceService.currentLangugae$ = of({ languageID: 1 });

    TestBed.configureTestingModule({
      declarations: [WorklistComponent],
      imports: [NoopAnimationsModule, MatPaginatorModule, MatTableModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: CameraService, useValue: mockCameraService },
        { provide: Router, useValue: mockRouter },
        { provide: MasterDataService, useValue: mockMasterDataService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        { provide: LabService, useValue: mockLabService },
        { provide: SessionStorageService, useValue: mockSessionStorageService },
        { provide: HttpServiceService, useValue: mockHttpServiceService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set currentRole to Lab Technician', () => {
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'currentRole',
        'Lab Technician'
      );
    });

    it('should call loadWorklist', () => {
      expect(mockLabService.getLabWorklist).toHaveBeenCalled();
    });

    it('should call beneficiaryDetailsService.reset', () => {
      expect(mockBeneficiaryDetailsService.reset).toHaveBeenCalled();
    });
  });

  describe('removeBeneficiaryDataForVisit', () => {
    it('should remove all expected sessionStorage items', () => {
      spyOn(sessionStorage, 'removeItem');
      component.removeBeneficiaryDataForVisit();

      const expectedKeys = [
        'visitCode',
        'beneficiaryGender',
        'benFlowID',
        'visitCategory',
        'beneficiaryRegID',
        'visitID',
        'beneficiaryID',
        'doctorFlag',
        'nurseFlag',
        'pharmacist_flag',
        'caseSheetTMFlag',
      ];

      expectedKeys.forEach(key => {
        expect(sessionStorage.removeItem).toHaveBeenCalledWith(key);
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should remove currentRole from sessionStorage', () => {
      spyOn(sessionStorage, 'removeItem');
      component.ngOnDestroy();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('currentRole');
    });
  });

  describe('loadWorklist', () => {
    it('should populate beneficiaryList on successful response', () => {
      component.loadWorklist();
      expect(component.beneficiaryList).toBeDefined();
      expect(component.beneficiaryList.length).toBe(2);
    });

    it('should populate filteredBeneficiaryList on successful response', () => {
      component.loadWorklist();
      expect(component.filteredBeneficiaryList).toBeDefined();
      expect(component.filteredBeneficiaryList.length).toBe(2);
    });

    it('should set filterTerm to null on success', () => {
      component.filterTerm = 'test';
      component.loadWorklist();
      expect(component.filterTerm).toBeNull();
    });

    it('should assign sno to each item in dataSource', () => {
      component.loadWorklist();
      expect(component.dataSource.data[0].sno).toBe(1);
      expect(component.dataSource.data[1].sno).toBe(2);
    });

    it('should show error alert when statusCode is not 200', () => {
      const errorResponse = {
        statusCode: 500,
        errorMessage: 'Server Error',
      };
      mockLabService.getLabWorklist.and.returnValue(of(errorResponse));
      component.loadWorklist();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Server Error',
        'error'
      );
    });

    it('should clear dataSource data when statusCode is not 200', () => {
      const errorResponse = {
        statusCode: 500,
        errorMessage: 'Server Error',
      };
      mockLabService.getLabWorklist.and.returnValue(of(errorResponse));
      component.loadWorklist();
      expect(component.dataSource.data).toEqual([]);
    });

    it('should show error alert on HTTP error', () => {
      mockLabService.getLabWorklist.and.returnValue(
        throwError('Network error')
      );
      component.loadWorklist();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });

  describe('loadDataToBenList', () => {
    it('should map raw data to structured beneficiary list', () => {
      const rawData = [
        {
          beneficiaryID: 'BEN001',
          beneficiaryRegID: 'REG001',
          benName: 'John Doe',
          genderName: 'Male',
          age: '30',
          VisitCategory: 'General OPD',
          benVisitNo: '1',
          districtName: 'District A',
          villageName: 'Village A',
          preferredPhoneNum: '9876543210',
          benFlowID: 'FLOW001',
          benVisitID: 'VISIT001',
          visitDate: '2024-01-15T10:30:00',
          benVisitDate: '2024-01-15T10:30:00',
        },
      ];

      const result = component.loadDataToBenList(rawData);

      expect(result.length).toBe(1);
      expect(result[0].beneficiaryID).toBe('BEN001');
      expect(result[0].beneficiaryRegID).toBe('REG001');
      expect(result[0].benName).toBe('John Doe');
      expect(result[0].genderName).toBe('Male');
      expect(result[0].age).toBe('30');
      expect(result[0].VisitCategory).toBe('General OPD');
      expect(result[0].districtName).toBe('District A');
      expect(result[0].preferredPhoneNum).toBe('9876543210');
      expect(result[0].benFlowID).toBe('FLOW001');
      expect(result[0].benVisitID).toBe('VISIT001');
    });

    it('should default missing fields to Not Available', () => {
      const rawData = [
        {
          beneficiaryID: 'BEN001',
          beneficiaryRegID: 'REG001',
          benName: 'Test',
          benFlowID: 'FLOW001',
          benVisitID: 'VISIT001',
          visitDate: '2024-01-15T10:30:00',
          benVisitDate: '2024-01-15T10:30:00',
        },
      ];

      const result = component.loadDataToBenList(rawData);

      expect(result[0].genderName).toBe('Not Available');
      expect(result[0].age).toBe('Not Available');
      expect(result[0].VisitCategory).toBe('Not Available');
      expect(result[0].districtName).toBe('Not Available');
      expect(result[0].villageName).toBe('Not Available');
      expect(result[0].preferredPhoneNum).toBe('Not Available');
    });

    it('should include labObject reference to original element', () => {
      const rawData = [
        {
          beneficiaryID: 'BEN001',
          beneficiaryRegID: 'REG001',
          benName: 'Test',
          benFlowID: 'FLOW001',
          benVisitID: 'VISIT001',
          visitDate: '2024-01-15T10:30:00',
          benVisitDate: '2024-01-15T10:30:00',
          doctorFlag: '1',
          nurseFlag: '9',
        },
      ];

      const result = component.loadDataToBenList(rawData);

      expect(result[0].labObject).toBe(rawData[0]);
    });

    it('should return empty array for empty input', () => {
      const result = component.loadDataToBenList([]);
      expect(result).toEqual([]);
    });
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        {
          beneficiaryID: 'BEN001',
          benName: 'John Doe',
          genderName: 'Male',
          age: '30',
          VisitCategory: 'General OPD',
          benVisitNo: '1',
          districtName: 'District A',
          preferredPhoneNum: '9876543210',
          villageName: 'Village A',
          beneficiaryRegID: 'REG001',
          visitDate: '15-01-2024 10:30 AM',
        },
        {
          beneficiaryID: 'BEN002',
          benName: 'Jane Smith',
          genderName: 'Female',
          age: '25',
          VisitCategory: 'ANC',
          benVisitNo: '2',
          districtName: 'District B',
          preferredPhoneNum: '9876543211',
          villageName: 'Village B',
          beneficiaryRegID: 'REG002',
          visitDate: '16-01-2024 11:00 AM',
        },
      ];
    });

    it('should reset filteredBeneficiaryList when searchTerm is empty', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
    });

    it('should filter by beneficiaryID', () => {
      component.filterBeneficiaryList('BEN001');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].beneficiaryID).toBe('BEN001');
    });

    it('should filter by benName', () => {
      component.filterBeneficiaryList('Jane');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].benName).toBe('Jane Smith');
    });

    it('should filter case-insensitively', () => {
      component.filterBeneficiaryList('john');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].benName).toBe('John Doe');
    });

    it('should filter by districtName', () => {
      component.filterBeneficiaryList('District B');
      expect(component.filteredBeneficiaryList.length).toBe(1);
    });

    it('should filter by preferredPhoneNum', () => {
      component.filterBeneficiaryList('9876543211');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].beneficiaryID).toBe('BEN002');
    });

    it('should return empty when no match', () => {
      component.filterBeneficiaryList('NONEXISTENT');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });

    it('should assign sno to filtered results', () => {
      component.filterBeneficiaryList('BEN');
      expect(component.dataSource.data.length).toBe(2);
    });
  });

  describe('patientImageView', () => {
    it('should call getBeneficiaryImage when benregID is valid', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: 'base64imagedata' })
      );
      component.patientImageView('REG001');
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).toHaveBeenCalledWith('REG001');
    });

    it('should call cameraService.viewImage when image is found', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: 'base64imagedata' })
      );
      component.patientImageView('REG001');
      expect(mockCameraService.viewImage).toHaveBeenCalledWith(
        'base64imagedata'
      );
    });

    it('should show alert when image is not found', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: null })
      );
      component.current_language_set = {
        alerts: { info: { imageNotFound: 'Image not found' } },
      };
      component.patientImageView('REG001');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Image not found'
      );
    });

    it('should not call getBeneficiaryImage when benregID is null', () => {
      component.patientImageView(null);
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });

    it('should not call getBeneficiaryImage when benregID is empty string', () => {
      component.patientImageView('');
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });

    it('should not call getBeneficiaryImage when benregID is undefined', () => {
      component.patientImageView(undefined);
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });
  });

  describe('loadLabExaminationPage', () => {
    const mockBeneficiary = {
      beneficiaryID: 'BEN001',
      beneficiaryRegID: 'REG001',
      benVisitID: 'VISIT001',
      VisitCategory: 'General OPD',
      benFlowID: 'FLOW001',
      labObject: {
        doctorFlag: '1',
        nurseFlag: '9',
        visitCode: 'VC001',
        specialist_flag: 0,
      },
    };

    it('should call confirmationService.confirm', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.current_language_set = {
        alerts: { info: { confirmtoProceedFurther: 'Confirm to proceed' } },
      };
      component.loadLabExaminationPage(mockBeneficiary);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        'info',
        'Confirm to proceed'
      );
    });

    it('should set sessionStorage items and navigate on confirm', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.current_language_set = {
        alerts: { info: { confirmtoProceedFurther: 'Confirm to proceed' } },
      };
      component.loadLabExaminationPage(mockBeneficiary);

      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'doctorFlag',
        '1'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'nurseFlag',
        '9'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'visitID',
        'VISIT001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'beneficiaryRegID',
        'REG001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'beneficiaryID',
        'BEN001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'General OPD'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'benFlowID',
        'FLOW001'
      );
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'visitCode',
        'VC001'
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/lab/patient/',
        'REG001',
      ]);
    });

    it('should set specialist_flag when present and > 0', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.current_language_set = {
        alerts: { info: { confirmtoProceedFurther: 'Confirm' } },
      };
      component.loadLabExaminationPage({
        ...mockBeneficiary,
        labObject: { ...mockBeneficiary.labObject, specialist_flag: 2 },
      });
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'specialist_flag',
        2
      );
    });

    it('should NOT store specialist_flag 0 (falsy check, current behaviour)', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      mockSessionStorageService.getItem.and.returnValue('1');
      component.current_language_set = {
        alerts: { info: { confirmtoProceedFurther: 'Confirm' } },
      };
      component.loadLabExaminationPage(mockBeneficiary);
      expect(mockSessionStorageService.setItem).not.toHaveBeenCalledWith(
        'specialist_flag',
        jasmine.anything()
      );
      expect(mockSessionStorageService.getItem).toHaveBeenCalledWith(
        'specialist_flag'
      );
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should not navigate when user declines confirmation', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.current_language_set = {
        alerts: { info: { confirmtoProceedFurther: 'Confirm' } },
      };
      component.loadLabExaminationPage(mockBeneficiary);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('pageChanged', () => {
    it('should slice filteredBeneficiaryList based on event', () => {
      component.filteredBeneficiaryList = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ];
      const event = { page: 1, itemsPerPage: 2 };
      component.pageChanged(event);
      expect(component.pagedList.length).toBe(2);
      expect(component.pagedList as any[]).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should return correct page for second page', () => {
      component.filteredBeneficiaryList = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ];
      const event = { page: 2, itemsPerPage: 2 };
      component.pageChanged(event);
      expect(component.pagedList as any[]).toEqual([{ id: 3 }, { id: 4 }]);
    });

    it('should return remaining items on last page', () => {
      component.filteredBeneficiaryList = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const event = { page: 2, itemsPerPage: 2 };
      component.pageChanged(event);
      expect(component.pagedList as any[]).toEqual([{ id: 3 }]);
    });
  });
});
