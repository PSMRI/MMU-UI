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
import { of, throwError } from 'rxjs';
import { WorklistComponent } from './worklist.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { PharmacistService } from '../shared/services/pharmacist.service';
import { CameraService } from '../../core/services/camera.service';
import { InventoryService } from '../../core/services/inventory.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('WorklistComponent', () => {
  let component: WorklistComponent;
  let fixture: ComponentFixture<WorklistComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockBeneficiaryDetailsService: jasmine.SpyObj<BeneficiaryDetailsService>;
  let mockPharmacistService: jasmine.SpyObj<PharmacistService>;
  let mockCameraService: jasmine.SpyObj<CameraService>;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockHttpServiceService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;

  const mockWorklistResponse = {
    statusCode: 200,
    data: [
      {
        beneficiaryID: 'BEN001',
        benName: 'John Doe',
        genderName: 'Male',
        age: '30',
        statusMessage: 'Active',
        VisitCategory: 'General OPD',
        benVisitNo: '1',
        districtName: 'District1',
        villageName: 'Village1',
        preferredPhoneNum: '9876543210',
        visitDate: '2024-01-15T10:30:00',
        benVisitDate: '2024-01-15T10:30:00',
        beneficiaryRegID: 'REG001',
        visitCode: 'VC001',
        benFlowID: 'FL001',
      },
    ],
  };

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockBeneficiaryDetailsService = jasmine.createSpyObj(
      'BeneficiaryDetailsService',
      ['reset', 'getBeneficiaryImage']
    );
    mockPharmacistService = jasmine.createSpyObj('PharmacistService', [
      'getPharmacistWorklist',
    ]);
    mockCameraService = jasmine.createSpyObj('CameraService', ['viewImage']);
    mockInventoryService = jasmine.createSpyObj('InventoryService', [
      'moveToInventory',
    ]);
    mockHttpServiceService = jasmine.createSpyObj('HttpServiceService', [
      'currentLangugae$',
    ]);
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    (mockHttpServiceService as any).currentLangugae$ = of({
      alerts: { info: { confirmtoProceedFurther: 'Proceed?' } },
    });

    mockPharmacistService.getPharmacistWorklist.and.returnValue(
      of(mockWorklistResponse)
    );

    TestBed.configureTestingModule({
      declarations: [WorklistComponent],
      imports: [NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        { provide: PharmacistService, useValue: mockPharmacistService },
        { provide: CameraService, useValue: mockCameraService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: HttpServiceService, useValue: mockHttpServiceService },
        { provide: SessionStorageService, useValue: mockSessionStorageService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set currentRole to Pharmacist in session storage', () => {
      expect(mockSessionStorageService.setItem).toHaveBeenCalledWith(
        'currentRole',
        'Pharmacist'
      );
    });

    it('should call removeBeneficiaryDataForVisit', () => {
      spyOn(component, 'removeBeneficiaryDataForVisit');
      component.ngOnInit();
      expect(component.removeBeneficiaryDataForVisit).toHaveBeenCalled();
    });

    it('should call loadPharmaWorklist', () => {
      expect(mockPharmacistService.getPharmacistWorklist).toHaveBeenCalled();
    });

    it('should call beneficiaryDetailsService.reset', () => {
      expect(mockBeneficiaryDetailsService.reset).toHaveBeenCalled();
    });
  });

  describe('removeBeneficiaryDataForVisit', () => {
    it('should remove all expected sessionStorage items', () => {
      const removeItemSpy = spyOn(sessionStorage, 'removeItem');
      component.removeBeneficiaryDataForVisit();

      expect(removeItemSpy).toHaveBeenCalledWith('visitCode');
      expect(removeItemSpy).toHaveBeenCalledWith('beneficiaryGender');
      expect(removeItemSpy).toHaveBeenCalledWith('benFlowID');
      expect(removeItemSpy).toHaveBeenCalledWith('visitCategory');
      expect(removeItemSpy).toHaveBeenCalledWith('beneficiaryRegID');
      expect(removeItemSpy).toHaveBeenCalledWith('visitID');
      expect(removeItemSpy).toHaveBeenCalledWith('beneficiaryID');
      expect(removeItemSpy).toHaveBeenCalledWith('doctorFlag');
      expect(removeItemSpy).toHaveBeenCalledWith('nurseFlag');
      expect(removeItemSpy).toHaveBeenCalledWith('pharmacist_flag');
      expect(removeItemSpy).toHaveBeenCalledWith('caseSheetTMFlag');
    });
  });

  describe('ngOnDestroy', () => {
    it('should remove currentRole from sessionStorage', () => {
      const removeItemSpy = spyOn(sessionStorage, 'removeItem');
      component.ngOnDestroy();
      expect(removeItemSpy).toHaveBeenCalledWith('currentRole');
    });
  });

  describe('loadPharmaWorklist', () => {
    it('should populate beneficiaryList on successful response', () => {
      component.loadPharmaWorklist();
      expect(component.beneficiaryList).toBeDefined();
      expect(component.beneficiaryList.length).toBe(1);
    });

    it('should populate filteredBeneficiaryList on successful response', () => {
      component.loadPharmaWorklist();
      expect(component.filteredBeneficiaryList).toBeDefined();
      expect(component.filteredBeneficiaryList.length).toBe(1);
    });

    it('should reset filterTerm to null on successful response', () => {
      component.filterTerm = 'some search';
      component.loadPharmaWorklist();
      expect(component.filterTerm).toBeNull();
    });

    it('should populate dataSource.data on successful response', () => {
      component.loadPharmaWorklist();
      expect(component.dataSource.data.length).toBe(1);
    });

    it('should assign sno to each item in dataSource', () => {
      component.loadPharmaWorklist();
      expect(component.dataSource.data[0].sno).toBe(1);
    });

    it('should alert on error response (non-200 statusCode)', () => {
      const errorResponse = {
        statusCode: 500,
        errorMessage: 'Server Error',
        data: null,
      };
      mockPharmacistService.getPharmacistWorklist.and.returnValue(
        of(errorResponse)
      );
      component.loadPharmaWorklist();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Server Error',
        'error'
      );
    });

    it('should clear dataSource.data on error response', () => {
      const errorResponse = {
        statusCode: 500,
        errorMessage: 'Server Error',
        data: null,
      };
      mockPharmacistService.getPharmacistWorklist.and.returnValue(
        of(errorResponse)
      );
      component.loadPharmaWorklist();
      expect(component.dataSource.data).toEqual([]);
    });

    it('should alert on subscription error', () => {
      mockPharmacistService.getPharmacistWorklist.and.returnValue(
        throwError('Network error')
      );
      component.loadPharmaWorklist();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });

  describe('loadDataToBenList', () => {
    it('should fill default "Not Available" for missing genderName', () => {
      const data = [{ visitDate: '2024-01-01', benVisitDate: '2024-01-01' }];
      const result = component.loadDataToBenList(data);
      expect(result[0].genderName).toBe('Not Available');
    });

    it('should fill default "Not Available" for missing age', () => {
      const data = [{ visitDate: '2024-01-01', benVisitDate: '2024-01-01' }];
      const result = component.loadDataToBenList(data);
      expect(result[0].age).toBe('Not Available');
    });

    it('should fill default "Not Available" for missing statusMessage', () => {
      const data = [{ visitDate: '2024-01-01', benVisitDate: '2024-01-01' }];
      const result = component.loadDataToBenList(data);
      expect(result[0].statusMessage).toBe('Not Available');
    });

    it('should fill default "Not Available" for missing VisitCategory', () => {
      const data = [{ visitDate: '2024-01-01', benVisitDate: '2024-01-01' }];
      const result = component.loadDataToBenList(data);
      expect(result[0].VisitCategory).toBe('Not Available');
    });

    it('should fill default "Not Available" for missing districtName', () => {
      const data = [{ visitDate: '2024-01-01', benVisitDate: '2024-01-01' }];
      const result = component.loadDataToBenList(data);
      expect(result[0].districtName).toBe('Not Available');
    });

    it('should fill default "Not Available" for missing preferredPhoneNum', () => {
      const data = [{ visitDate: '2024-01-01', benVisitDate: '2024-01-01' }];
      const result = component.loadDataToBenList(data);
      expect(result[0].preferredPhoneNum).toBe('Not Available');
    });

    it('should preserve existing values when present', () => {
      const data = [
        {
          genderName: 'Female',
          age: '25',
          statusMessage: 'Done',
          VisitCategory: 'NCD',
          benVisitNo: '2',
          districtName: 'TestDistrict',
          villageName: 'TestVillage',
          preferredPhoneNum: '1234567890',
          visitDate: '2024-01-15T10:30:00',
          benVisitDate: '2024-01-15T10:30:00',
        },
      ];
      const result = component.loadDataToBenList(data);
      expect(result[0].genderName).toBe('Female');
      expect(result[0].age).toBe('25');
      expect(result[0].districtName).toBe('TestDistrict');
    });

    it('should format visitDate with moment', () => {
      const data = [
        {
          visitDate: '2024-01-15T10:30:00',
          benVisitDate: '2024-01-15T10:30:00',
        },
      ];
      const result = component.loadDataToBenList(data);
      expect(result[0].visitDate).toContain('15-01-2024');
    });

    it('should format benVisitDate with moment', () => {
      const data = [
        {
          visitDate: '2024-01-15T10:30:00',
          benVisitDate: '2024-01-15T10:30:00',
        },
      ];
      const result = component.loadDataToBenList(data);
      expect(result[0].benVisitDate).toContain('15-01-2024');
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
          districtName: 'District1',
          preferredPhoneNum: '9876543210',
          villageName: 'Village1',
          beneficiaryRegID: 'REG001',
          visitDate: '15-01-2024 10:30 AM',
        },
        {
          beneficiaryID: 'BEN002',
          benName: 'Jane Smith',
          genderName: 'Female',
          age: '25',
          VisitCategory: 'NCD',
          benVisitNo: '2',
          districtName: 'District2',
          preferredPhoneNum: '1234567890',
          villageName: 'Village2',
          beneficiaryRegID: 'REG002',
          visitDate: '16-01-2024 11:00 AM',
        },
      ];
      component.filteredBeneficiaryList = [...component.beneficiaryList];
    });

    it('should reset to full list when searchTerm is empty', () => {
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

    it('should filter by genderName', () => {
      component.filterBeneficiaryList('Female');
      expect(component.filteredBeneficiaryList.length).toBe(1);
    });

    it('should filter by districtName', () => {
      component.filterBeneficiaryList('District2');
      expect(component.filteredBeneficiaryList.length).toBe(1);
    });

    it('should return empty list when no match is found', () => {
      component.filterBeneficiaryList('ZZZZZ');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });

    it('should update dataSource.data with filtered results', () => {
      component.filterBeneficiaryList('BEN001');
      expect(component.dataSource.data.length).toBe(1);
    });
  });

  describe('patientImageView', () => {
    it('should call getBeneficiaryImage when benregID is provided', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: 'base64imagedata' })
      );
      component.patientImageView('REG001');
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).toHaveBeenCalledWith('REG001');
    });

    it('should call cameraService.viewImage when image data exists', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: 'base64imagedata' })
      );
      component.patientImageView('REG001');
      expect(mockCameraService.viewImage).toHaveBeenCalledWith(
        'base64imagedata'
      );
    });

    it('should alert when image data is not found', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: null })
      );
      component.currentLanguageSet = {
        alerts: { info: { imageNotFound: 'Image not found' } },
      };
      component.patientImageView('REG001');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Image not found'
      );
    });

    it('should not call getBeneficiaryImage when benregID is falsy', () => {
      component.patientImageView(null);
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });
  });

  describe('loadPharmaPage', () => {
    const mockBeneficiary = {
      beneficiaryID: 'BEN001',
      visitCode: 'VC001',
      benFlowID: 'FL001',
      beneficiaryRegID: 'REG001',
    };

    it('should call confirmationService.confirm', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.currentLanguageSet = {
        alerts: { info: { confirmtoProceedFurther: 'Proceed?' } },
      };
      component.loadPharmaPage(mockBeneficiary);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        'info',
        'Proceed?'
      );
    });

    it('should call inventoryService.moveToInventory when confirmed', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.currentLanguageSet = {
        alerts: { info: { confirmtoProceedFurther: 'Proceed?' } },
      };
      sessionStorage.setItem('setLanguage', 'Hindi');
      component.loadPharmaPage(mockBeneficiary);
      expect(mockInventoryService.moveToInventory).toHaveBeenCalledWith(
        'BEN001',
        'VC001',
        'FL001',
        'Hindi',
        'REG001'
      );
    });

    it('passes null language when setLanguage is absent (null !== undefined, current behaviour)', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.currentLanguageSet = {
        alerts: { info: { confirmtoProceedFurther: 'Proceed?' } },
      };
      sessionStorage.removeItem('setLanguage');
      component.loadPharmaPage(mockBeneficiary);
      expect(mockInventoryService.moveToInventory).toHaveBeenCalledWith(
        'BEN001',
        'VC001',
        'FL001',
        null as any,
        'REG001'
      );
    });

    it('should not call inventoryService.moveToInventory when not confirmed', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.currentLanguageSet = {
        alerts: { info: { confirmtoProceedFurther: 'Proceed?' } },
      };
      component.loadPharmaPage(mockBeneficiary);
      expect(mockInventoryService.moveToInventory).not.toHaveBeenCalled();
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
      component.pageChanged({ page: 1, itemsPerPage: 2 });
      expect(component.pagedList.length).toBe(2);
      expect((component.pagedList[0] as any).id).toBe(1);
      expect((component.pagedList[1] as any).id).toBe(2);
    });

    it('should return correct slice for page 2', () => {
      component.filteredBeneficiaryList = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ];
      component.pageChanged({ page: 2, itemsPerPage: 2 });
      expect(component.pagedList.length).toBe(2);
      expect((component.pagedList[0] as any).id).toBe(3);
      expect((component.pagedList[1] as any).id).toBe(4);
    });
  });

  describe('fetchLanguageResponse', () => {
    it('should set currentLanguageSet', () => {
      component.currentLanguageSet = undefined;
      component.fetchLanguageResponse();
      expect(component.currentLanguageSet).toEqual({
        alerts: { info: { confirmtoProceedFurther: 'Proceed?' } },
      });
    });
  });
});
