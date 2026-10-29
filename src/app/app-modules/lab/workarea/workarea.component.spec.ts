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
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { WorkareaComponent } from './workarea.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { MasterDataService, LabService } from '../shared/services';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('WorkareaComponent', () => {
  let component: WorkareaComponent;
  let fixture: ComponentFixture<WorkareaComponent>;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMasterDataService: jasmine.SpyObj<MasterDataService>;
  let mockBeneficiaryDetailsService: jasmine.SpyObj<BeneficiaryDetailsService>;
  let mockLabService: jasmine.SpyObj<LabService>;
  let mockHttpServiceService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;

  const sessionStorageData: Record<string, string> = {
    visitID: '100',
    visitCode: '200',
    beneficiaryRegID: '300',
  };

  beforeEach(waitForAsync(() => {
    confirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockMasterDataService = jasmine.createSpyObj('MasterDataService', [
      'getLabRequirements',
    ]);
    mockBeneficiaryDetailsService = jasmine.createSpyObj(
      'BeneficiaryDetailsService',
      ['getBeneficiaryDetails']
    );
    mockLabService = jasmine.createSpyObj('LabService', [
      'saveFile',
      'saveLabWork',
      'viewFileContent',
      'getEcgAbnormalities',
    ]);
    mockHttpServiceService = jasmine.createSpyObj(
      'HttpServiceService',
      ['getCurrentLanguage'],
      { currentLangugae$: of({}) }
    );
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);

    mockSessionStorageService.getItem.and.callFake((key: string) => {
      return (sessionStorageData as any)[key] || null;
    });

    mockMasterDataService.getLabRequirements.and.returnValue(of({}));
    mockLabService.getEcgAbnormalities.and.returnValue(of({}));

    TestBed.configureTestingModule({
      declarations: [WorkareaComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        FormBuilder,
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: MasterDataService, useValue: mockMasterDataService },
        {
          provide: BeneficiaryDetailsService,
          useValue: mockBeneficiaryDetailsService,
        },
        { provide: LabService, useValue: mockLabService },
        { provide: HttpServiceService, useValue: mockHttpServiceService },
        {
          provide: SessionStorageService,
          useValue: mockSessionStorageService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should read visitID, visitCode, and beneficiaryRegID from sessionStorage', () => {
      fixture.detectChanges();

      expect(mockSessionStorageService.getItem).toHaveBeenCalledWith('visitID');
      expect(mockSessionStorageService.getItem).toHaveBeenCalledWith(
        'visitCode'
      );
      expect(mockSessionStorageService.getItem).toHaveBeenCalledWith(
        'beneficiaryRegID'
      );
      expect(component.visitID).toBe('100');
      expect(component.visitCode).toBe('200');
      expect(component.beneficiaryRegID).toBe('300');
    });

    it('should set stepExpand to 0', () => {
      fixture.detectChanges();
      expect(component.stepExpand).toBe(0);
    });

    it('should set testName from environment.RBSTest', () => {
      fixture.detectChanges();
      expect(component.testName).toBe(environment.RBSTest);
    });

    it('should call getTestRequirements', () => {
      spyOn(component, 'getTestRequirements');
      component.ngOnInit();
      expect(component.getTestRequirements).toHaveBeenCalled();
    });

    it('should call getEcgAbnormalities', () => {
      spyOn(component, 'getEcgAbnormalities');
      component.ngOnInit();
      expect(component.getEcgAbnormalities).toHaveBeenCalled();
    });
  });

  describe('errorLoading', () => {
    it('should alert with the provided error message', () => {
      const errorMsg = 'Something went wrong';
      component.errorLoading(errorMsg);
      expect(confirmationService.alert).toHaveBeenCalledWith(errorMsg);
    });

    it('should navigate to /lab/worklist', () => {
      component.errorLoading('error');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/lab/worklist']);
    });
  });

  describe('checkExtension', () => {
    it('should return true for a valid pdf file', () => {
      const file = { name: 'report.pdf' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return true for a valid png file', () => {
      const file = { name: 'image.png' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return true for a valid jpeg file', () => {
      const file = { name: 'photo.jpeg' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return true for a valid doc file', () => {
      const file = { name: 'document.doc' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return true for a valid xlsx file', () => {
      const file = { name: 'spreadsheet.xlsx' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return true for a valid csv file', () => {
      const file = { name: 'data.csv' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return true for a valid txt file', () => {
      const file = { name: 'notes.txt' };
      expect(component.checkExtension(file)).toBe(true);
    });

    it('should return false for an invalid extension like exe', () => {
      const file = { name: 'virus.exe' };
      expect(component.checkExtension(file)).toBe(false);
    });

    it('should return false for an invalid extension like bat', () => {
      const file = { name: 'script.bat' };
      expect(component.checkExtension(file)).toBe(false);
    });

    it('should return false for a file with multiple dots (more than two parts)', () => {
      const file = { name: 'report.v2.pdf' };
      expect(component.checkExtension(file)).toBe(false);
    });

    it('should return true when file is null or undefined', () => {
      expect(component.checkExtension(null)).toBe(true);
      expect(component.checkExtension(undefined)).toBe(true);
    });

    it('should be case-insensitive for extensions', () => {
      const file = { name: 'report.PDF' };
      expect(component.checkExtension(file)).toBe(true);
    });
  });

  describe('canDeactivate', () => {
    beforeEach(() => {
      const fb = TestBed.inject(FormBuilder);
      component.technicianForm = fb.group({
        labForm: fb.array([]),
        radiologyForm: fb.array([]),
        externalForm: fb.array([]),
      });
      component.current_language_set = {
        alerts: {
          info: {
            navigateFurtherAlert:
              'You have unsaved data. Do you want to navigate?',
          },
        },
      };
    });

    it('should return of(true) when form is not dirty', done => {
      component.canDeactivate().subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should call confirmationService.confirm when form is dirty', () => {
      confirmationService.confirm.and.returnValue(of(true));
      component.technicianForm.markAsDirty();

      component.canDeactivate().subscribe();

      expect(confirmationService.confirm).toHaveBeenCalledWith(
        'info',
        'You have unsaved data. Do you want to navigate?',
        'Yes',
        'No'
      );
    });

    it('should return the result from confirmationService.confirm when form is dirty', done => {
      confirmationService.confirm.and.returnValue(of(false));
      component.technicianForm.markAsDirty();

      component.canDeactivate().subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('sideNavModeChange', () => {
    it('should set sidenav mode to "over" when device width is less than 700', () => {
      const sidenav = { mode: '', toggle: jasmine.createSpy('toggle') };
      spyOnProperty(window.screen, 'width', 'get').and.returnValue(500);

      component.sideNavModeChange(sidenav);

      expect(sidenav.mode).toBe('over');
      expect(sidenav.toggle).toHaveBeenCalled();
    });

    it('should set sidenav mode to "side" when device width is 700 or more', () => {
      const sidenav = { mode: '', toggle: jasmine.createSpy('toggle') };
      spyOnProperty(window.screen, 'width', 'get').and.returnValue(1024);

      component.sideNavModeChange(sidenav);

      expect(sidenav.mode).toBe('side');
      expect(sidenav.toggle).toHaveBeenCalled();
    });

    it('should set sidenav mode to "side" when device width is exactly 700', () => {
      const sidenav = { mode: '', toggle: jasmine.createSpy('toggle') };
      spyOnProperty(window.screen, 'width', 'get').and.returnValue(700);

      component.sideNavModeChange(sidenav);

      expect(sidenav.mode).toBe('side');
      expect(sidenav.toggle).toHaveBeenCalled();
    });
  });

  describe('filterProceduresLab', () => {
    beforeEach(() => {
      component.filteredLaboratoryData = [
        { procedureName: 'Blood Glucose Test' },
        { procedureName: 'Hemoglobin Count' },
        { procedureName: 'Blood Pressure' },
      ];
    });

    it('should reset laboratoryData to full list when searchTerm is empty', () => {
      component.filterProceduresLab('');
      expect(component.laboratoryData.data).toEqual(
        component.filteredLaboratoryData
      );
    });

    it('should reset laboratoryData to full list when searchTerm is undefined', () => {
      component.filterProceduresLab(undefined);
      expect(component.laboratoryData.data).toEqual(
        component.filteredLaboratoryData
      );
    });

    it('should filter laboratory data by procedureName matching search term', () => {
      component.filterProceduresLab('Blood');
      expect(component.laboratoryData.data.length).toBe(2);
      expect(component.laboratoryData.data).toContain(
        jasmine.objectContaining({ procedureName: 'Blood Glucose Test' })
      );
      expect(component.laboratoryData.data).toContain(
        jasmine.objectContaining({ procedureName: 'Blood Pressure' })
      );
    });

    it('should be case-insensitive when filtering', () => {
      component.filterProceduresLab('hemoglobin');
      expect(component.laboratoryData.data.length).toBe(1);
      expect(component.laboratoryData.data[0].procedureName).toBe(
        'Hemoglobin Count'
      );
    });

    it('should return empty data when no match found', () => {
      component.filterProceduresLab('XYZ');
      expect(component.laboratoryData.data.length).toBe(0);
    });
  });

  describe('filterProceduresRadiology', () => {
    beforeEach(() => {
      component.filteredRadiologyData = [
        { procedureName: 'X-Ray Chest' },
        { procedureName: 'CT Scan' },
        { procedureName: 'X-Ray Spine' },
      ];
    });

    it('should reset radiologyFile data to full list when searchTerm is empty', () => {
      component.filterProceduresRadiology('');
      expect(component.radiologyFile.data).toEqual(
        component.filteredRadiologyData
      );
    });

    it('should reset radiologyFile data to full list when searchTerm is undefined', () => {
      component.filterProceduresRadiology(undefined);
      expect(component.radiologyFile.data).toEqual(
        component.filteredRadiologyData
      );
    });

    it('should filter radiology data by procedureName matching search term', () => {
      component.filterProceduresRadiology('X-Ray');
      expect(component.radiologyFile.data.length).toBe(2);
      expect(component.radiologyFile.data).toContain(
        jasmine.objectContaining({ procedureName: 'X-Ray Chest' })
      );
      expect(component.radiologyFile.data).toContain(
        jasmine.objectContaining({ procedureName: 'X-Ray Spine' })
      );
    });

    it('should be case-insensitive when filtering', () => {
      component.filterProceduresRadiology('ct scan');
      expect(component.radiologyFile.data.length).toBe(1);
      expect(component.radiologyFile.data[0].procedureName).toBe('CT Scan');
    });

    it('should return empty data when no match found', () => {
      component.filterProceduresRadiology('MRI');
      expect(component.radiologyFile.data.length).toBe(0);
    });
  });

  describe('loadArchive', () => {
    it('should not modify archiveList when archive is null', () => {
      component.archiveList = [];
      component.loadArchive(null);
      expect(component.archiveList).toEqual([]);
    });

    it('should not modify archiveList when archive is undefined', () => {
      component.archiveList = [];
      component.loadArchive(undefined);
      expect(component.archiveList).toEqual([]);
    });

    it('should not modify archiveList when archive is empty array', () => {
      component.archiveList = [];
      component.loadArchive([]);
      expect(component.archiveList).toEqual([]);
    });

    it('should set archiveList and filteredArchiveList when archive has data', () => {
      const archive = [
        { procedureType: 'Radiology', procedureName: 'X-Ray' },
        { procedureType: 'Laboratory', procedureName: 'Blood Test' },
      ];

      component.loadArchive(archive);

      expect(component.archiveList).toBe(archive);
      expect(component.filteredArchiveList).toBe(archive);
    });

    it('should split archive into radiology and laboratory data sources', () => {
      const archive = [
        { procedureType: 'Radiology', procedureName: 'X-Ray' },
        { procedureType: 'Laboratory', procedureName: 'Blood Test' },
        { procedureType: 'Radiology', procedureName: 'CT Scan' },
      ];

      component.loadArchive(archive);

      expect(component.radiologyFile.data.length).toBe(2);
      expect(component.laboratoryData.data.length).toBe(1);
      expect(component.filteredRadiologyData.length).toBe(2);
      expect(component.filteredLaboratoryData.length).toBe(1);
    });
  });

  describe('checkForEcg', () => {
    beforeEach(() => {
      const fb = TestBed.inject(FormBuilder);
      component.technicianForm = fb.group({
        labForm: fb.array([
          fb.group({
            procedureName: 'ECG Test',
            compListDetails: fb.array([fb.group({ ecgAbnormalities: [] })]),
          }),
        ]),
        radiologyForm: fb.array([]),
        externalForm: fb.group({}),
      });
    });

    it('should set enableEcgAbnormal to true when value is "Abnormal" and procedure includes "ECG"', () => {
      component.checkForEcg('Abnormal', 'ECG Test', 0);
      expect(component.enableEcgAbnormal).toBe(true);
    });

    it('should set enableEcgAbnormal to false when value is not "Abnormal" and procedure includes "ECG"', () => {
      component.enableEcgAbnormal = true;
      component.checkForEcg('Normal', 'ECG Test', 0);
      expect(component.enableEcgAbnormal).toBe(false);
    });

    it('should not change enableEcgAbnormal when procedure name does not include "ECG"', () => {
      component.enableEcgAbnormal = false;
      component.checkForEcg('Abnormal', 'Blood Pressure', 0);
      expect(component.enableEcgAbnormal).toBe(false);
    });

    it('should clear ecgAbnormalities in compListDetails when value is not "Abnormal" for ECG procedure', () => {
      const labFormValue = component.technicianForm.controls['labForm'].value;
      component.checkForEcg('Normal', 'ECG Test', 0);

      expect(labFormValue[0].compListDetails[0].ecgAbnormalities).toEqual([]);
    });
  });

  describe('getEcgAbnormalities', () => {
    it('should set ecgAbnormalities when service returns status 200 with data', () => {
      const mockData = [{ id: 1, name: 'Sinus Tachycardia' }];
      mockLabService.getEcgAbnormalities.and.returnValue(
        of({ statusCode: 200, data: mockData })
      );

      component.getEcgAbnormalities();

      expect(component.ecgAbnormalities).toEqual(mockData);
    });

    it('should not set ecgAbnormalities when service returns data as null', () => {
      mockLabService.getEcgAbnormalities.and.returnValue(
        of({ statusCode: 200, data: null })
      );

      component.ecgAbnormalities = undefined;
      component.getEcgAbnormalities();

      expect(component.ecgAbnormalities).toBeUndefined();
    });

    it('should not set ecgAbnormalities when statusCode is not 200', () => {
      mockLabService.getEcgAbnormalities.and.returnValue(
        of({ statusCode: 500, errorMessage: 'Server Error' })
      );

      component.ecgAbnormalities = undefined;
      component.getEcgAbnormalities();

      expect(component.ecgAbnormalities).toBeUndefined();
    });
  });

  describe('confirmFormReset', () => {
    beforeEach(() => {
      const fb = TestBed.inject(FormBuilder);
      component.technicianForm = fb.group({
        labForm: fb.array([]),
        radiologyForm: fb.array([]),
        externalForm: fb.array([]),
      });
      component.current_language_set = {
        alerts: {
          info: {
            resetDetails: 'Are you sure you want to reset?',
          },
        },
      };
    });

    it('should not call confirmationService.confirm when form is not dirty', () => {
      component.confirmFormReset();
      expect(confirmationService.confirm).not.toHaveBeenCalled();
    });

    it('should call confirmationService.confirm when form is dirty', () => {
      confirmationService.confirm.and.returnValue(of(false));
      component.technicianForm.markAsDirty();

      component.confirmFormReset();

      expect(confirmationService.confirm).toHaveBeenCalledWith(
        'info',
        'Are you sure you want to reset?'
      );
    });

    it('should call formReCall when user confirms reset', () => {
      confirmationService.confirm.and.returnValue(of(true));
      component.technicianForm.markAsDirty();
      spyOn(component, 'formReCall');

      component.confirmFormReset();

      expect(component.formReCall).toHaveBeenCalled();
    });

    it('should not call formReCall when user cancels reset', () => {
      confirmationService.confirm.and.returnValue(of(false));
      component.technicianForm.markAsDirty();
      spyOn(component, 'formReCall');

      component.confirmFormReset();

      expect(component.formReCall).not.toHaveBeenCalled();
    });
  });

  describe('getTestRequirements', () => {
    it('should call masterdataService.getLabRequirements when visitID, beneficiaryRegID, and visitCode are set', () => {
      component.visitID = '100';
      component.beneficiaryRegID = '300';
      component.visitCode = '200';
      mockMasterDataService.getLabRequirements.and.returnValue(of({}));

      component.getTestRequirements();

      expect(mockMasterDataService.getLabRequirements).toHaveBeenCalledWith(
        '300',
        '100',
        '200'
      );
    });

    it('should call errorLoading when visitID is missing', () => {
      component.visitID = null;
      component.beneficiaryRegID = '300';
      component.visitCode = '200';
      spyOn(component, 'errorLoading');

      component.getTestRequirements();

      expect(component.errorLoading).toHaveBeenCalledWith(
        component.loadingErrorMessage
      );
    });

    it('should call errorLoading when beneficiaryRegID is missing', () => {
      component.visitID = '100';
      component.beneficiaryRegID = null;
      component.visitCode = '200';
      spyOn(component, 'errorLoading');

      component.getTestRequirements();

      expect(component.errorLoading).toHaveBeenCalledWith(
        component.loadingErrorMessage
      );
    });

    it('should call errorLoading when visitCode is missing', () => {
      component.visitID = '100';
      component.beneficiaryRegID = '300';
      component.visitCode = null;
      spyOn(component, 'errorLoading');

      component.getTestRequirements();

      expect(component.errorLoading).toHaveBeenCalledWith(
        component.loadingErrorMessage
      );
    });
  });

  describe('loadTests', () => {
    it('should call errorLoading when laboratoryList is missing', () => {
      spyOn(component, 'errorLoading');
      component.loadTests({ radiologyList: [] });

      expect(component.errorLoading).toHaveBeenCalledWith(
        component.loadingErrorMessage
      );
    });

    it('should call errorLoading when radiologyList is missing', () => {
      spyOn(component, 'errorLoading');
      component.loadTests({ laboratoryList: [] });

      expect(component.errorLoading).toHaveBeenCalledWith(
        component.loadingErrorMessage
      );
    });

    it('should call loadlabTests, loadRadiologyTests, loadExternalTests, loadArchive, and mergeForms when data is valid', () => {
      spyOn(component, 'loadlabTests');
      spyOn(component, 'loadRadiologyTests');
      spyOn(component, 'loadExternalTests');
      spyOn(component, 'loadArchive');
      spyOn(component, 'mergeForms');

      const tests = {
        laboratoryList: [{ procedureName: 'Lab1' }],
        radiologyList: [{ procedureName: 'Rad1' }],
        externalTests: { tests: [] },
        archive: [],
      };

      component.loadTests(tests);

      expect(component.loadlabTests).toHaveBeenCalled();
      expect(component.loadRadiologyTests).toHaveBeenCalled();
      expect(component.loadExternalTests).toHaveBeenCalled();
      expect(component.loadArchive).toHaveBeenCalled();
      expect(component.mergeForms).toHaveBeenCalled();
    });
  });

  describe('component properties', () => {
    it('should have valid_file_extensions containing expected types', () => {
      expect(component.valid_file_extensions).toContain('pdf');
      expect(component.valid_file_extensions).toContain('png');
      expect(component.valid_file_extensions).toContain('jpeg');
      expect(component.valid_file_extensions).toContain('jpg');
      expect(component.valid_file_extensions).toContain('doc');
      expect(component.valid_file_extensions).toContain('docx');
      expect(component.valid_file_extensions).toContain('xlsx');
      expect(component.valid_file_extensions).toContain('xls');
      expect(component.valid_file_extensions).toContain('csv');
      expect(component.valid_file_extensions).toContain('txt');
      expect(component.valid_file_extensions).toContain('msg');
    });

    it('should have maxFileSize set to 5', () => {
      expect(component.maxFileSize).toBe(5);
    });

    it('should have enableEcgAbnormal initialized to false', () => {
      expect(component.enableEcgAbnormal).toBe(false);
    });
  });

  describe('full form lifecycle', () => {
    const lang = {
      alerts: {
        info: {
          valueDetails: 'Value should be between',
          resetDetails: 'reset?',
          selectNewFile: 'select new file',
          successMsg: 'success',
          uploadSelectedFile: 'upload selected file',
          confirmSubmit: 'Do you want to',
          labObservation: 'lab observation',
          navigateFurtherAlert: 'navigate?',
        },
      },
      common: { submit: 'submit' },
      invalidFileExtensionSupportedFileFormats: 'bad ext',
      fileSizeShouldNotExceed: 'size exceeds',
      mb: 'MB',
      invalidFileName: 'bad name',
    };
    const labData = () => ({
      laboratoryList: [
        {
          procedureType: 'Laboratory',
          procedureName: 'ECG',
          procedureID: 1,
          prescriptionID: 11,
          compListDetails: [
            {
              inputType: 'TextBox',
              range_min: 10,
              range_max: 100,
              range_normal_min: 20,
              range_normal_max: 80,
              isDecimal: true,
              testComponentID: 101,
              testComponentName: 'ECG Rate',
              componentCode: 'C1',
            },
            {
              inputType: 'RadioButton',
              testComponentID: 102,
              testComponentName: 'ECG Result',
              componentCode: 'C2',
              compOpt: [{ name: 'Normal' }, { name: 'Abnormal' }],
              ecgAbnormalities: ['x'],
            },
          ],
        },
        {
          procedureType: 'Laboratory',
          procedureName: 'Sugar',
          procedureID: 2,
          compListDetails: [
            {
              inputType: 'TextBox',
              isDecimal: false,
              testComponentID: 201,
              testComponentName: 'RBS',
              componentCode: 'C3',
            },
            {
              inputType: 'DropDown',
              testComponentID: 202,
              testComponentName: 'Type',
              componentCode: 'C4',
              compOpt: [{ name: 'A' }],
            },
          ],
        },
      ],
      radiologyList: [
        {
          procedureType: 'Radiology',
          procedureName: 'XRay',
          procedureID: 'R1',
          prescriptionID: 33,
          compDetails: { inputType: 'File', testComponentID: 301 },
        },
        {
          procedureType: 'Radiology',
          procedureName: 'CT',
          procedureID: 'R2',
          compDetails: { inputType: 'File', testComponentID: 302 },
        },
      ],
      externalTests: { tests: ['ext1'] },
      archive: [
        { procedureType: 'Radiology', procedureName: 'XRay' },
        { procedureType: 'Laboratory', procedureName: 'CBC' },
      ],
    });

    let store: Record<string, any>;

    beforeEach(() => {
      store = {
        visitID: '100',
        visitCode: '200',
        beneficiaryRegID: '300',
        userID: '7',
        userName: 'tech',
        serviceLineDetails: JSON.stringify({ vanID: 5, parkingPlaceID: 6 }),
        specialist_flag: null,
      };
      mockSessionStorageService.getItem.and.callFake((k: string) =>
        k in store ? store[k] : null
      );
      spyOn(console, 'log');
      component.current_language_set = lang;
      component.loadTests(labData());
    });

    it('builds lab, radiology and external forms from the test data', () => {
      expect(component.labForm.length).toBe(2);
      expect(component.radiologyForm.length).toBe(2);
      expect(component.externalForm.value.tests).toEqual(['ext1']);
      const comp = (component.labForm.at(0) as FormGroup).controls[
        'compListDetails'
      ] as FormArray;
      expect(comp.at(0).value.allowText).toBe('decimal');
      expect(
        (
          (component.labForm.at(1) as FormGroup).controls[
            'compListDetails'
          ] as FormArray
        ).at(0).value.allowText
      ).toBe('number');
      expect((comp.at(1) as FormGroup).value.compOpt.length).toBe(2);
      expect(
        component.radiologyForm.at(0).value.compDetails.testComponentID
      ).toBe(301);
      expect(component.labTechnicianData().length).toBe(2);
      expect(component.radiologyFormData().length).toBe(2);
      expect(component.externalFormData()).toBeDefined();
      expect(component.filteredRadiologyData.length).toBe(1);
      expect(component.filteredLaboratoryData.length).toBe(1);
    });

    it('skips building lab/radiology forms for empty lists', () => {
      component.labForm = undefined as any;
      component.radiologyForm = undefined as any;
      component.loadlabTests([]);
      component.loadRadiologyTests([]);
      component.loadExternalTests(undefined);
      expect(component.labForm).toBeUndefined();
      expect(component.radiologyForm).toBeUndefined();
    });

    it('checkNormalRange flags abnormal and normal values', () => {
      const comp = (component.labForm.at(0) as FormGroup).controls[
        'compListDetails'
      ] as FormArray;
      comp.at(0).patchValue({ inputValue: 90 });
      component.checkNormalRange(0, 0);
      expect(comp.at(0).value.abnormal).toBe(true);
      comp.at(0).patchValue({ inputValue: 5 });
      component.checkNormalRange(0, 0);
      expect(comp.at(0).value.abnormal).toBe(true);
      comp.at(0).patchValue({ inputValue: 50 });
      component.checkNormalRange(0, 0);
      expect(comp.at(0).value.abnormal).toBe(false);
      comp.at(0).patchValue({ inputValue: null, abnormal: null });
      component.checkNormalRange(0, 0);
      expect(comp.at(0).value.abnormal).toBeNull();
    });

    it('checkRange clears out-of-range values with an alert', () => {
      const comp = (component.labForm.at(0) as FormGroup).controls[
        'compListDetails'
      ] as FormArray;
      comp.at(0).patchValue({ inputValue: 500 });
      component.checkRange(0, 0);
      expect(comp.at(0).value.inputValue).toBe('');
      expect(confirmationService.alert).toHaveBeenCalledWith(
        'Value should be between 10 to 100'
      );
      confirmationService.alert.calls.reset();
      comp.at(0).patchValue({ inputValue: 50 });
      component.checkRange(0, 0);
      expect(comp.at(0).value.inputValue).toBe(50);
      expect(confirmationService.alert).not.toHaveBeenCalled();
    });

    it('formReCall resets form and reloads requirements', () => {
      mockMasterDataService.getLabRequirements.and.returnValue(
        of({ statusCode: 200, data: labData() })
      );
      component.visitID = '1';
      component.visitCode = '2';
      component.beneficiaryRegID = '3';
      component.stripSelected = false;
      component.formReCall();
      expect(component.stripSelected).toBe(true);
      expect(mockMasterDataService.getLabRequirements).toHaveBeenCalledWith(
        '3',
        '1',
        '2'
      );
      expect(component.technicianForm).toBeDefined();
    });

    it('getTestRequirements does nothing on non-200 and alerts on error', () => {
      component.visitID = '1';
      component.visitCode = '2';
      component.beneficiaryRegID = '3';
      spyOn(component, 'loadTests');
      mockMasterDataService.getLabRequirements.and.returnValue(
        of({ statusCode: 500 })
      );
      component.getTestRequirements();
      expect(component.loadTests).not.toHaveBeenCalled();
      mockMasterDataService.getLabRequirements.and.returnValue(
        throwError(() => 'err')
      );
      component.getTestRequirements();
      expect(confirmationService.alert).toHaveBeenCalledWith(
        component.loadingErrorMessage
      );
    });

    it('ngDoCheck assigns current language', () => {
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual({});
    });

    describe('uploadFile', () => {
      const ev = (name: string, size = 1000) => ({
        target: { files: [{ name, size }] },
      });

      it('does nothing when no files are chosen', () => {
        component.uploadFile({ target: { files: [] } }, 1);
        expect(component.fileIndex).toBe(1);
        expect(confirmationService.alert).not.toHaveBeenCalled();
      });

      it('alerts for an invalid extension', () => {
        component.uploadFile(ev('a.exe'), 1);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'bad ext',
          'error'
        );
      });

      it('alerts when file is too large', () => {
        component.uploadFile(ev('a.pdf', 6 * 1000 * 1000), 1);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'size exceeds 5 MB',
          'error'
        );
      });

      it('alerts for an empty file name', () => {
        component.uploadFile(ev('.pdf'), 1);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'bad name',
          'error'
        );
      });

      it('reads a valid file via FileReader', () => {
        const readSpy = spyOn(FileReader.prototype, 'readAsDataURL').and.stub();
        component.uploadFile(ev('a.pdf'), 1);
        expect(readSpy).toHaveBeenCalled();
      });

      it('onLoadFileCallback assigns the file content', () => {
        component.file = { name: 'a.pdf' };
        component.fileIndex = 'R1';
        component.onLoadFileCallback({
          currentTarget: { result: 'data:x;base64,QUJD' },
        });
        expect(component.fileObj['R1'][0]).toEqual(
          jasmine.objectContaining({
            fileName: 'a.pdf',
            fileExtension: '.pdf',
            fileContent: 'QUJD',
            userID: '7',
            vanID: 5,
            isUploaded: false,
          })
        );
      });
    });

    describe('assignFileObject', () => {
      it('creates, appends and adds new indexes', () => {
        component.file = { name: 'a.pdf' };
        component.assignFileObject('R1', 'h,c1');
        component.assignFileObject('R1', 'h,c2');
        component.assignFileObject('R2', 'h,c3');
        expect(component.fileObj['R1'].length).toBe(2);
        expect(component.fileObj['R2'].length).toBe(1);
      });

      it('returns true when the stored entry has the same fileName', () => {
        component.file = { name: 'a.pdf' };
        component.fileObj = { R1: { fileName: 'a.pdf' } };
        expect(component.assignFileObject('R1', 'h,c')).toBe(true);
      });

      it('uses empty defaults when no file/content', () => {
        component.file = undefined;
        store['serviceLineDetails'] = null;
        const res: any = component.assignFileObject('R1', undefined);
        expect(res.fileName).toBe('');
        expect(res.fileExtension).toBe('');
        expect(res.fileContent).toBe('');
        expect(res.vanID).toBeUndefined();
      });
    });

    describe('openToViewFile', () => {
      it('updates fileObj and removes empty entries after close', () => {
        mockDialog.open.and.returnValue({
          afterClosed: () => of({ R1: [], R2: [{}] }),
        } as any);
        component.openToViewFile('R1');
        expect(component.fileObj).toEqual({ R2: [{}] });
      });

      it('keeps non-empty entries', () => {
        mockDialog.open.and.returnValue({
          afterClosed: () => of({ R1: [{}] }),
        } as any);
        component.openToViewFile('R1');
        expect(component.fileObj).toEqual({ R1: [{}] });
      });
    });

    describe('saveUploadDetails', () => {
      it('alerts when no fileObj', () => {
        component.fileObj = undefined;
        component.saveUploadDetails('R1');
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'select new file',
          'info'
        );
      });

      it('alerts when fileObj has no literal procedureID key', () => {
        component.fileObj = { R1: [{}] };
        component.saveUploadDetails('R1');
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'select new file',
          'info'
        );
      });

      it('saves when fileObj has literal procedureID key (current behaviour)', () => {
        spyOn(component, 'saveFileData');
        component.fileObj = { procedureID: [{ isUploaded: false }] };
        component.saveUploadDetails('procedureID');
        expect(component.saveFileData).toHaveBeenCalledWith('procedureID', [
          { isUploaded: false },
        ]);
      });

      it('saves only new files when saved data exists', () => {
        spyOn(component, 'saveFileData');
        component.fileObj = {
          procedureID: [{ isUploaded: true }, { isUploaded: false }],
        };
        component.savedFileData = { procedureID: [{ isUploaded: true }] };
        component.saveUploadDetails('procedureID');
        expect(component.saveFileData).toHaveBeenCalledWith('procedureID', [
          { isUploaded: false },
        ]);
      });

      it('alerts when no new files among more files', () => {
        component.fileObj = {
          procedureID: [{ isUploaded: true }, { isUploaded: true }],
        };
        component.savedFileData = { procedureID: [{ isUploaded: true }] };
        component.saveUploadDetails('procedureID');
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'select new file',
          'info'
        );
      });

      it('alerts when file count is not larger than saved', () => {
        component.fileObj = { procedureID: [{ isUploaded: true }] };
        component.savedFileData = { procedureID: [{ isUploaded: true }] };
        component.saveUploadDetails('procedureID');
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'select new file',
          'info'
        );
      });
    });

    describe('saveFileData', () => {
      it('stores saved files and marks uploaded on success', () => {
        mockLabService.saveFile.and.returnValue(
          of({
            statusCode: 200,
            data: [{ filePath: 'f1' }, { filePath: 'f2' }],
          })
        );
        component.fileObj = { R1: [{ isUploaded: false }] };
        component.saveFileData('R1', []);
        expect(component.savedFileData['R1'].length).toBe(2);
        expect(component.savedFileData['R1'][0].isUploaded).toBe(true);
        expect(component.fileObj['R1'][0].isUploaded).toBe(true);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'success',
          'success'
        );
        mockLabService.saveFile.and.returnValue(
          of({ statusCode: 200, data: [{ filePath: 'f3' }] })
        );
        component.saveFileData('R2', []);
        expect(component.savedFileData['R2'].length).toBe(1);
        component.saveFileData('R2', []);
        expect(component.savedFileData['R2'].length).toBe(2);
      });

      it('does nothing on non-200', () => {
        mockLabService.saveFile.and.returnValue(of({ statusCode: 500 }));
        component.saveFileData('R1', []);
        expect(component.savedFileData).toBeUndefined();
        expect(confirmationService.alert).not.toHaveBeenCalled();
      });

      it('alerts on error', () => {
        mockLabService.saveFile.and.returnValue(
          throwError(() => ({ errorMessage: 'boom' }))
        );
        component.saveFileData('R1', []);
        expect(confirmationService.alert).toHaveBeenCalledWith('boom', 'err');
      });
    });

    describe('validateSubmit', () => {
      beforeEach(() => spyOn(component, 'submitDetails'));

      it('submits directly when no files', () => {
        component.fileObj = undefined;
        component.validateSubmit(true);
        expect(component.submitDetails).toHaveBeenCalledWith(true);
      });

      it('alerts when files are not saved', () => {
        component.fileObj = { R1: [{}] };
        component.validateSubmit(true);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'upload selected file'
        );
      });

      it('alerts when key counts differ', () => {
        component.fileObj = { R1: [{}], R2: [{}] };
        component.savedFileData = { R1: [{}] };
        component.validateSubmit(true);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'upload selected file'
        );
      });

      it('alerts when a key is missing in saved data', () => {
        component.fileObj = { R1: [{}] };
        component.savedFileData = { R3: [{}] };
        component.validateSubmit(true);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'upload selected file'
        );
      });

      it('alerts when lengths differ', () => {
        component.fileObj = { R1: [{}, {}] };
        component.savedFileData = { R1: [{}] };
        component.validateSubmit(true);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'upload selected file'
        );
        expect(component.submitDetails).not.toHaveBeenCalled();
      });

      it('submits when everything is uploaded', () => {
        component.fileObj = { R1: [{}], R2: [{}] };
        component.savedFileData = { R1: [{}], R2: [{}] };
        component.validateSubmit(false);
        expect(component.submitDetails).toHaveBeenCalledWith(false);
      });
    });

    describe('submitDetails', () => {
      let removeSpy: jasmine.Spy;
      beforeEach(() => {
        removeSpy = spyOn(sessionStorage, 'removeItem');
      });

      it('does nothing when the user cancels', () => {
        confirmationService.confirm.and.returnValue(of(false));
        component.submitDetails(true);
        expect(confirmationService.confirm).toHaveBeenCalledWith(
          'info',
          'Do you want to submit lab observation'
        );
        expect(mockLabService.saveLabWork).not.toHaveBeenCalled();
      });

      it('saves lab work with radiology results and navigates on success', () => {
        confirmationService.confirm.and.returnValue(of(true));
        mockLabService.saveLabWork.and.returnValue(
          of({ statusCode: 200, data: { response: 'saved' } })
        );
        component.savedFileData = { R1: [{ filePath: 'p1' }] };
        component.submitDetails(false);
        expect(confirmationService.confirm).toHaveBeenCalledWith(
          'info',
          'Do you want to save lab observation'
        );
        const payload = mockLabService.saveLabWork.calls.mostRecent()
          .args[0] as any;
        expect(payload.labCompleted).toBe(false);
        expect(payload.createdBy).toBe('tech');
        expect(payload.vanID).toBe(5);
        expect(payload.parkingPlaceID).toBe(6);
        expect(payload.specialist_flag).toBeNull();
        expect(payload.radiologyTestResults).toEqual([
          jasmine.objectContaining({ procedureID: 'R1', fileIDs: ['p1'] }),
        ]);
        expect(confirmationService.alert).toHaveBeenCalledWith(
          'saved',
          'success'
        );
        expect(removeSpy).toHaveBeenCalledWith('visitCode');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/lab/worklist']);
      });

      it('passes specialist_flag and alerts on failure', () => {
        store['specialist_flag'] = '1';
        confirmationService.confirm.and.returnValue(of(true));
        mockLabService.saveLabWork.and.returnValue(
          of({ statusCode: 500, errorMessage: 'nope' })
        );
        component.submitDetails(true);
        const payload = mockLabService.saveLabWork.calls.mostRecent()
          .args[0] as any;
        expect(payload.specialist_flag).toBe('1');
        expect(confirmationService.alert).toHaveBeenCalledWith('nope', 'error');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
      });
    });

    describe('viewFileContent', () => {
      it('downloads the chosen file', () => {
        mockDialog.open.and.returnValue({
          afterClosed: () => of({ fileName: 'x.pdf' }),
        } as any);
        mockLabService.viewFileContent.and.returnValue(
          of(new Blob(['a'], { type: 'application/pdf' }))
        );
        spyOn(window.URL, 'createObjectURL').and.returnValue('blob:x');
        const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
        component.viewFileContent([1]);
        expect(mockLabService.viewFileContent).toHaveBeenCalledWith({
          fileName: 'x.pdf',
        });
        expect(clickSpy).toHaveBeenCalled();
      });

      it('does nothing when dialog closes empty', () => {
        mockDialog.open.and.returnValue({
          afterClosed: () => of(null),
        } as any);
        component.viewFileContent([1]);
        expect(mockLabService.viewFileContent).not.toHaveBeenCalled();
      });
    });

    describe('openIOTModal', () => {
      it('patches textbox and radio values from the device result', () => {
        const api = component.labForm.at(0) as FormGroup;
        mockDialog.open.and.returnValue({
          afterClosed: () => of(['55', 'Abnormal']),
        } as any);
        component.openIOTModal(api, 0);
        expect(component.stepExpand).toBe(0);
        const comp = api.controls['compListDetails'] as FormArray;
        expect(comp.at(0).value.inputValue).toBe('55');
        expect(comp.at(1).value.compOptSelected).toBe('Abnormal');
        expect(
          (mockDialog.open.calls.mostRecent().args[1] as any).data.output
        ).toEqual(['C1', 'C2']);
      });

      it('skips undefined device results', () => {
        const api = component.labForm.at(1) as FormGroup;
        mockDialog.open.and.returnValue({
          afterClosed: () => of([undefined, 'A']),
        } as any);
        component.openIOTModal(api, 1);
        const comp = api.controls['compListDetails'] as FormArray;
        expect(comp.at(0).value.inputValue).toBeNull();
        expect(comp.at(1).value.compOptSelected).toBe('A');
      });
    });

    it('onStripsCheckBox toggles stripSelected and clears value', () => {
      const comp = (component.labForm.at(0) as FormGroup).controls[
        'compListDetails'
      ] as FormArray;
      comp.at(0).patchValue({ inputValue: 3 });
      component.onStripsCheckBox({ checked: true }, 0, 0);
      expect(component.stripSelected).toBe(false);
      expect(comp.at(0).value.inputValue).toBe('');
      component.onStripsCheckBox({ checked: false }, 0, 0);
      expect(component.stripSelected).toBe(true);
    });

    it('getEcgAbnormalities logs on error', () => {
      mockLabService.getEcgAbnormalities.and.returnValue(throwError(() => 'e'));
      component.getEcgAbnormalities();
      expect(console.log).toHaveBeenCalledWith('e', 'error');
    });

    it('checkForEcg clears ecg abnormalities for matching procedure', () => {
      component.checkForEcg('Normal', 'ECG', 0);
      expect(component.enableEcgAbnormal).toBe(false);
      expect(
        component.technicianForm.controls['labForm'].value[0].compListDetails[0]
          .ecgAbnormalities
      ).toEqual([]);
    });
  });
});
