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
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { SearchComponent } from './search.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RegistrarService } from '../shared/services/registrar.service';
import { CameraService } from '../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('SearchComponent (Registrar)', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockRegistrarService: jasmine.SpyObj<RegistrarService>;
  let mockCameraService: jasmine.SpyObj<CameraService>;
  let mockBeneficiaryDetailsService: jasmine.SpyObj<BeneficiaryDetailsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;

  beforeEach(waitForAsync(() => {
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockRegistrarService = jasmine.createSpyObj('RegistrarService', [
      'identityQuickSearch',
      'advanceSearchIdentity',
      'identityPatientRevisit',
      'saveBeneficiaryEditDataASobservable',
    ]);
    mockCameraService = jasmine.createSpyObj('CameraService', ['viewImage']);
    mockBeneficiaryDetailsService = jasmine.createSpyObj(
      'BeneficiaryDetailsService',
      ['getBeneficiaryImage', 'reset']
    );
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    Object.defineProperty(mockRouter, 'routerState', {
      get: () => ({ snapshot: { url: '/registrar/search' } }),
    });
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockHttpService = jasmine.createSpyObj('HttpServiceService', [
      'setLanguage',
    ]);
    (mockHttpService as any).currentLangugae$ = of({});
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockSessionStorage.getItem.and.callFake((key: string) => {
      if (key === 'serviceLineDetails')
        return JSON.stringify({ vanID: 100, parkingPlaceID: 10 });
      if (key === 'providerServiceID') return '123';
      return null;
    });

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule],
      declarations: [SearchComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: RegistrarService, useValue: mockRegistrarService },
        { provide: CameraService, useValue: mockCameraService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
        { provide: ChangeDetectorRef, useValue: { detectChanges: () => {} } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set searchPattern on init', () => {
    expect(component.searchPattern).toBeDefined();
    expect(component.searchPattern).toContain('a-zA-Z0-9');
  });

  describe('identityQuickSearch', () => {
    beforeEach(() => {
      component.currentLanguageSet = {
        alerts: {
          info: {
            pleaseenterBeneficiaryID: 'Please enter ID',
            beneficiarynotfound: 'Not found',
            phoneDetails: 'Enter 10 or 12 digit number',
          },
        },
      };
    });

    it('should alert when searchTerm is undefined', () => {
      component.identityQuickSearch(undefined);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Please enter ID',
        'info'
      );
    });

    it('should alert when searchTerm is empty string', () => {
      component.identityQuickSearch('');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Please enter ID',
        'info'
      );
    });

    it('should alert when searchTerm is whitespace', () => {
      component.identityQuickSearch('   ');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Please enter ID',
        'info'
      );
    });

    it('should alert phoneDetails when searchTerm length is not 10 or 12', () => {
      component.identityQuickSearch('12345');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Enter 10 or 12 digit number',
        'info'
      );
    });

    it('should search by phoneNo when searchTerm length is 10', () => {
      mockRegistrarService.identityQuickSearch.and.returnValue(of([]));
      component.identityQuickSearch('1234567890');
      expect(mockRegistrarService.identityQuickSearch).toHaveBeenCalledWith(
        jasmine.objectContaining({ phoneNo: '1234567890' })
      );
    });

    it('should search by beneficiaryID when searchTerm length is 12', () => {
      mockRegistrarService.identityQuickSearch.and.returnValue(of([]));
      component.identityQuickSearch('123456789012');
      expect(mockRegistrarService.identityQuickSearch).toHaveBeenCalledWith(
        jasmine.objectContaining({ beneficiaryID: '123456789012' })
      );
    });

    it('should alert when no beneficiaries are found', () => {
      mockRegistrarService.identityQuickSearch.and.returnValue(of([]));
      component.identityQuickSearch('1234567890');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Not found',
        'info'
      );
    });

    it('should alert when null is returned', () => {
      mockRegistrarService.identityQuickSearch.and.returnValue(of(null as any));
      component.identityQuickSearch('1234567890');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Not found',
        'info'
      );
    });

    it('should populate beneficiaryList on successful search', () => {
      const mockData = {
        data: [
          {
            beneficiaryID: 'BEN001',
            beneficiaryRegID: 100,
            firstName: 'John',
            lastName: 'Doe',
            m_gender: { genderName: 'Male' },
            fatherName: 'Father',
            i_bendemographics: {
              districtName: 'District1',
              districtBranchName: 'Village1',
            },
            benPhoneMaps: [{ phoneNo: '1234567890' }],
            dOB: '1990-01-01',
            createdDate: '2023-01-01',
          },
        ],
      };
      mockRegistrarService.identityQuickSearch.and.returnValue(of(mockData));
      component.identityQuickSearch('1234567890');
      expect(component.beneficiaryList).toBeDefined();
      expect(component.beneficiaryList.length).toBe(1);
      expect(component.beneficiaryList[0].beneficiaryID).toBe('BEN001');
    });

    it('should alert on service error', () => {
      mockRegistrarService.identityQuickSearch.and.returnValue(
        throwError('Network error')
      );
      component.identityQuickSearch('1234567890');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });

  describe('searchRestruct', () => {
    it('should restructure beneficiary data for table display', () => {
      const benList = {
        data: [
          {
            beneficiaryID: 'BEN001',
            beneficiaryRegID: 100,
            firstName: 'John',
            lastName: 'Doe',
            m_gender: { genderName: 'Male' },
            fatherName: 'Father',
            i_bendemographics: {
              districtName: 'District1',
              districtBranchName: 'Village1',
            },
            benPhoneMaps: [{ phoneNo: '9876543210' }],
            dOB: '1990-01-01',
            createdDate: '2023-06-15',
          },
        ],
      };
      const result = component.searchRestruct(benList, {});
      expect(result.length).toBe(1);
      expect(result[0].benName).toBe('John Doe');
      expect(result[0].genderName).toBe('Male');
      expect(result[0].fatherName).toBe('Father');
      expect(result[0].districtName).toBe('District1');
      expect(result[0].villageName).toBe('Village1');
      expect(result[0].phoneNo).toBe('9876543210');
    });

    it('should show Not Available for missing gender', () => {
      const benList = {
        data: [
          {
            beneficiaryID: 'BEN001',
            beneficiaryRegID: 100,
            firstName: 'John',
            lastName: '',
            m_gender: { genderName: '' },
            fatherName: '',
            i_bendemographics: {
              districtName: '',
              districtBranchName: '',
            },
            benPhoneMaps: [],
            dOB: '1990-01-01',
            createdDate: '2023-01-01',
          },
        ],
      };
      const result = component.searchRestruct(benList, {});
      expect(result[0].phoneNo).toBe('Not Available');
    });
  });

  describe('getCorrectPhoneNo', () => {
    it('should return Not Available when phoneMaps is empty', () => {
      expect(component.getCorrectPhoneNo([], {})).toBe('Not Available');
    });

    it('should return first phoneNo when benObject has no phoneNo', () => {
      const phoneMaps = [{ phoneNo: '111' }, { phoneNo: '222' }];
      expect(component.getCorrectPhoneNo(phoneMaps, {})).toBe('111');
    });

    it('should return matching phoneNo when benObject has phoneNo', () => {
      const phoneMaps = [{ phoneNo: '111' }, { phoneNo: '222' }];
      expect(component.getCorrectPhoneNo(phoneMaps, { phoneNo: '222' })).toBe(
        '222'
      );
    });

    it('should return first phoneNo if no match found', () => {
      const phoneMaps = [{ phoneNo: '111' }, { phoneNo: '222' }];
      expect(component.getCorrectPhoneNo(phoneMaps, { phoneNo: '333' })).toBe(
        '111'
      );
    });
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        {
          beneficiaryID: 'BEN001',
          benName: 'John Doe',
          genderName: 'Male',
          benObject: {},
        },
        {
          beneficiaryID: 'BEN002',
          benName: 'Jane Smith',
          genderName: 'Female',
          benObject: {},
        },
      ];
    });

    it('should reset to full list when searchTerm is empty', () => {
      component.filteredBeneficiaryList = [];
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
    });

    it('should filter by matching name', () => {
      component.filterBeneficiaryList('John');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].benName).toBe('John Doe');
    });

    it('should return empty list when no match found', () => {
      component.filterBeneficiaryList('ZZZZZ');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });

    it('should not filter by benObject key', () => {
      component.filterBeneficiaryList('object');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });

    it('should filter case-insensitively', () => {
      component.filterBeneficiaryList('john');
      expect(component.filteredBeneficiaryList.length).toBe(1);
    });
  });

  describe('patientRevisited', () => {
    beforeEach(() => {
      component.currentLanguageSet = {
        alerts: {
          info: {
            confirmSubmitBeneficiary: 'Confirm submit',
            genderAndAgeDetails: 'No gender and age',
            noGenderDetails: 'No gender',
            noAgeDetailsAvail: 'No age',
          },
        },
      };
    });

    it('should confirm and call sendToNurseWindow when benObject is valid', () => {
      const benObject = {
        m_gender: { genderName: 'Male' },
        dOB: '1990-01-01',
      };
      mockConfirmationService.confirm.and.returnValue(of(true));
      spyOn(component, 'sendToNurseWindow');
      component.patientRevisited(benObject);
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
      expect(component.sendToNurseWindow).toHaveBeenCalledWith(true, benObject);
    });

    it('should not call sendToNurseWindow when user declines', () => {
      const benObject = {
        m_gender: { genderName: 'Male' },
        dOB: '1990-01-01',
      };
      mockConfirmationService.confirm.and.returnValue(of(false));
      spyOn(component, 'sendToNurseWindow');
      component.patientRevisited(benObject);
      expect(component.sendToNurseWindow).not.toHaveBeenCalled();
    });

    it('should alert when both gender and dOB are missing', () => {
      const benObject = { m_gender: { genderName: '' }, dOB: '' };
      component.patientRevisited(benObject);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No gender and age',
        'info'
      );
    });

    it('should alert when only gender is missing', () => {
      const benObject = {
        m_gender: { genderName: '' },
        dOB: '1990-01-01',
      };
      component.patientRevisited(benObject);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No gender',
        'info'
      );
    });

    it('should alert when only dOB is missing', () => {
      const benObject = { m_gender: { genderName: 'Male' }, dOB: '' };
      component.patientRevisited(benObject);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No age',
        'info'
      );
    });
  });

  describe('editPatientInfo', () => {
    beforeEach(() => {
      component.currentLanguageSet = {
        alerts: { info: { editDetails: 'Edit details?' } },
      };
    });

    it('should navigate on confirmation', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      const beneficiary = {
        beneficiaryID: 'BEN001',
        benObject: { name: 'John' },
      };
      component.editPatientInfo(beneficiary);
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/registrar/search/BEN001',
      ]);
      expect(
        mockRegistrarService.saveBeneficiaryEditDataASobservable
      ).toHaveBeenCalledWith(beneficiary.benObject);
    });

    it('should not navigate when user declines', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      const beneficiary = {
        beneficiaryID: 'BEN001',
        benObject: { name: 'John' },
      };
      component.editPatientInfo(beneficiary);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('sendToNurseWindow', () => {
    it('should call identityPatientRevisit when userResponse is true', () => {
      const benObject = { beneficiaryRegID: 100 };
      mockRegistrarService.identityPatientRevisit.and.returnValue(
        of({ data: { response: 'Success' } })
      );
      component.sendToNurseWindow(true, benObject);
      expect(mockRegistrarService.identityPatientRevisit).toHaveBeenCalledWith(
        benObject
      );
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Success',
        'success'
      );
    });

    it('should alert with status when data is missing', () => {
      const benObject = { beneficiaryRegID: 100 };
      mockRegistrarService.identityPatientRevisit.and.returnValue(
        of({ status: 'Warning' })
      );
      component.sendToNurseWindow(true, benObject);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Warning',
        'warn'
      );
    });

    it('should not call identityPatientRevisit when userResponse is false', () => {
      component.sendToNurseWindow(false, {});
      expect(
        mockRegistrarService.identityPatientRevisit
      ).not.toHaveBeenCalled();
    });

    it('should alert on error', () => {
      const benObject = { beneficiaryRegID: 100 };
      mockRegistrarService.identityPatientRevisit.and.returnValue(
        throwError('Network error')
      );
      component.sendToNurseWindow(true, benObject);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });

  describe('patientImageView', () => {
    beforeEach(() => {
      component.currentLanguageSet = {
        alerts: { info: { imageNotFound: 'No image' } },
      };
    });

    it('should call getBeneficiaryImage and view image when found', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(
        of({ benImage: 'imageData' })
      );
      component.patientImageView(123);
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).toHaveBeenCalledWith(123 as any);
      expect(mockCameraService.viewImage).toHaveBeenCalledWith('imageData');
    });

    it('should alert when image is not found', () => {
      mockBeneficiaryDetailsService.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(123);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith('No image');
    });

    it('should not call service when benregID is empty', () => {
      component.patientImageView('');
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });

    it('should not call service when benregID is null', () => {
      component.patientImageView(null);
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });

    it('should not call service when benregID is undefined', () => {
      component.patientImageView(undefined);
      expect(
        mockBeneficiaryDetailsService.getBeneficiaryImage
      ).not.toHaveBeenCalled();
    });
  });

  describe('openSearchDialog', () => {
    it('should open SearchDialogComponent dialog', () => {
      const mockDialogRef = {
        afterClosed: () => of(null),
      } as any;
      mockDialog.open.and.returnValue(mockDialogRef);
      component.openSearchDialog();
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should call advanceSearchIdentity when dialog returns data', () => {
      const dialogResult = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 1,
        stateID: 10,
        districtID: 20,
      };
      const mockDialogRef = {
        afterClosed: () => of(dialogResult),
      } as any;
      mockDialog.open.and.returnValue(mockDialogRef);

      const searchResult = {
        data: [
          {
            beneficiaryID: 'BEN001',
            beneficiaryRegID: 100,
            firstName: 'John',
            lastName: 'Doe',
            m_gender: { genderName: 'Male' },
            fatherName: 'Father',
            i_bendemographics: {
              districtName: 'District1',
              districtBranchName: 'Village1',
            },
            benPhoneMaps: [{ phoneNo: '1234567890' }],
            dOB: '1990-01-01',
            createdDate: '2023-01-01',
          },
        ],
      };
      mockRegistrarService.advanceSearchIdentity.and.returnValue(
        of(searchResult)
      );
      component.openSearchDialog();
      expect(mockRegistrarService.advanceSearchIdentity).toHaveBeenCalledWith(
        dialogResult
      );
      expect(component.beneficiaryList.length).toBe(1);
    });

    it('should alert when advance search returns no results', () => {
      component.currentLanguageSet = {
        alerts: { info: { beneficiarynotfound: 'Not found' } },
      };
      const mockDialogRef = {
        afterClosed: () => of({ firstName: 'ZZZ' }),
      } as any;
      mockDialog.open.and.returnValue(mockDialogRef);
      mockRegistrarService.advanceSearchIdentity.and.returnValue(
        of({ data: [] })
      );
      component.openSearchDialog();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Not found',
        'info'
      );
    });

    it('should not call service when dialog is dismissed', () => {
      const mockDialogRef = {
        afterClosed: () => of(null),
      } as any;
      mockDialog.open.and.returnValue(mockDialogRef);
      component.openSearchDialog();
      expect(mockRegistrarService.advanceSearchIdentity).not.toHaveBeenCalled();
    });
  });

  describe('navigateTORegistrar', () => {
    it('should navigate directly when beneficiaryList is undefined', () => {
      component.beneficiaryList = undefined;
      component.navigateTORegistrar();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/registrar/registration',
      ]);
    });

    it('should navigate directly when beneficiaryList is empty', () => {
      component.beneficiaryList = [];
      component.navigateTORegistrar();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/registrar/registration',
      ]);
    });

    it('should confirm before navigating when beneficiaryList has data', () => {
      component.beneficiaryList = [{ benName: 'John' }];
      mockConfirmationService.confirm.and.returnValue(of(true));
      component.navigateTORegistrar();
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/registrar/registration',
      ]);
    });

    it('should not navigate when user declines confirmation', () => {
      component.beneficiaryList = [{ benName: 'John' }];
      mockConfirmationService.confirm.and.returnValue(of(false));
      component.navigateTORegistrar();
      expect(mockConfirmationService.confirm).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('pageChanged', () => {
    it('should set pagedList from filteredBeneficiaryList', () => {
      component.filteredBeneficiaryList = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ];
      component.pageChanged({ page: 1, itemsPerPage: 2 });
      expect(component.pagedList.length).toBe(2);
    });

    it('should handle second page correctly', () => {
      component.filteredBeneficiaryList = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ];
      component.pageChanged({ page: 2, itemsPerPage: 2 });
      expect(component.pagedList.length).toBe(2);
    });
  });

  describe('fetchLanguageResponse', () => {
    it('should set currentLanguageSet', () => {
      component.fetchLanguageResponse();
      expect(component.languageComponent).toBeDefined();
    });
  });
});
