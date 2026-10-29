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

/// <reference types="node" />
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { ReportsComponent } from './reports.component';
import { MasterdataService } from '../shared/services';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let mockMasterdataService: jasmine.SpyObj<MasterdataService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;
  let mockTrackingService: jasmine.SpyObj<AmritTrackingService>;

  const mockLanguageObject = {
    noReportsWereMappedforthisService: 'No reports mapped',
    noVansWereMappedforthisprovider: 'No vans mapped',
    noDataAvailabletoGenerateReport: 'No data available',
  };

  beforeEach(waitForAsync(() => {
    mockMasterdataService = jasmine.createSpyObj('MasterdataService', [
      'getReportsMaster',
      'getVanMaster',
      'getReportData',
    ]);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);
    mockHttpService = jasmine.createSpyObj(
      'HttpServiceService',
      ['fetchLanguageSet'],
      {
        currentLangugae$: new BehaviorSubject(
          mockLanguageObject
        ).asObservable(),
      }
    );
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockTrackingService = jasmine.createSpyObj('AmritTrackingService', [
      'trackFieldInteraction',
    ]);

    mockMasterdataService.getReportsMaster.and.returnValue(
      of({ statusCode: 200, data: [{ reportID: 1, reportName: 'TestReport' }] })
    );
    mockMasterdataService.getVanMaster.and.returnValue(
      of({ statusCode: 200, data: [{ vanID: 1, vehicalNo: 'VAN001' }] })
    );
    mockSessionStorage.getItem.and.returnValue('testProviderServiceID');

    TestBed.configureTestingModule({
      declarations: [ReportsComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MasterdataService, useValue: mockMasterdataService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
        { provide: AmritTrackingService, useValue: mockTrackingService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ReportsComponent, '')
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set today to a Date', () => {
      expect(component.today).toBeInstanceOf(Date);
    });

    it('should create the reportForm', () => {
      expect(component.reportForm).toBeDefined();
      expect(component.reportForm.controls['report']).toBeDefined();
      expect(component.reportForm.controls['fromDate']).toBeDefined();
      expect(component.reportForm.controls['toDate']).toBeDefined();
      expect(component.reportForm.controls['van']).toBeDefined();
    });

    it('should call getReportsMaster', () => {
      expect(mockMasterdataService.getReportsMaster).toHaveBeenCalled();
    });

    it('should call getVanMaster', () => {
      expect(mockMasterdataService.getVanMaster).toHaveBeenCalled();
    });

    it('should call assignSelectedLanguage', () => {
      expect(component.currentLanguageSet).toEqual(mockLanguageObject);
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
    it('should set currentLanguageSet', () => {
      component.assignSelectedLanguage();
      expect(component.currentLanguageSet).toEqual(mockLanguageObject);
    });
  });

  describe('createReportForm', () => {
    it('should return a FormGroup with report, fromDate, toDate, van controls', () => {
      const form = component.createReportForm();
      expect(form.controls['report']).toBeDefined();
      expect(form.controls['fromDate']).toBeDefined();
      expect(form.controls['toDate']).toBeDefined();
      expect(form.controls['van']).toBeDefined();
    });

    it('should have null initial values', () => {
      const form = component.createReportForm();
      expect(form.controls['report'].value).toBeNull();
      expect(form.controls['fromDate'].value).toBeNull();
      expect(form.controls['toDate'].value).toBeNull();
      expect(form.controls['van'].value).toBeNull();
    });
  });

  describe('getReportsMaster', () => {
    it('should populate reportMaster on success with data', () => {
      mockMasterdataService.getReportsMaster.and.returnValue(
        of({ statusCode: 200, data: [{ reportID: 2, reportName: 'Report2' }] })
      );
      component.getReportsMaster();
      expect(component.reportMaster).toEqual([
        { reportID: 2, reportName: 'Report2' },
      ]);
    });

    it('should alert when no reports data', () => {
      mockMasterdataService.getReportsMaster.and.returnValue(
        of({ statusCode: 200, data: [] })
      );
      component.getReportsMaster();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        mockLanguageObject.noReportsWereMappedforthisService
      );
    });

    it('should alert error when statusCode is not 200', () => {
      mockMasterdataService.getReportsMaster.and.returnValue(
        of({ statusCode: 500, errorMessage: 'Server error' })
      );
      component.getReportsMaster();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Server error',
        'error'
      );
    });

    it('should alert error on HTTP failure', () => {
      mockMasterdataService.getReportsMaster.and.returnValue(
        throwError(() => 'Network error')
      );
      component.getReportsMaster();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Network error',
        'error'
      );
    });
  });

  describe('checkReport', () => {
    it('should reset fromDate, toDate, and van to null', () => {
      component.reportForm.patchValue({
        report: { reportID: 1, reportName: 'Test' },
        fromDate: new Date(),
        toDate: new Date(),
        van: { vanID: 1 },
      });
      component.checkReport();
      expect(component.fromDate).toBeNull();
      expect(component.toDate).toBeNull();
      expect(component.van).toBeNull();
    });
  });

  describe('checkFromDate', () => {
    it('should reset toDate and van to null', () => {
      const fromDate = new Date(2023, 0, 1);
      component.reportForm.patchValue({
        fromDate: fromDate,
        toDate: new Date(),
        van: { vanID: 1 },
      });
      component.checkFromDate();
      expect(component.toDate).toBeNull();
      expect(component.van).toBeNull();
    });

    it('should set maxToDate to today when fromDate + 1 month > today', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);
      component.today = new Date();
      component.reportForm.patchValue({ fromDate: recentDate });
      component.checkFromDate();
      expect(component.maxToDate.getTime()).toBeLessThanOrEqual(
        new Date().getTime()
      );
    });

    it('should set maxToDate to fromDate + 1 month when that is before today', () => {
      const oldDate = new Date(2020, 0, 1);
      component.today = new Date();
      component.reportForm.patchValue({ fromDate: oldDate });
      component.checkFromDate();
      const expectedMax = new Date(oldDate);
      expectedMax.setMonth(oldDate.getMonth() + 1);
      expect(component.maxToDate.getTime()).toBe(expectedMax.getTime());
    });
  });

  describe('checkToDate', () => {
    it('should reset van to null', () => {
      component.reportForm.patchValue({ van: { vanID: 1 } });
      component.checkToDate();
      expect(component.van).toBeNull();
    });
  });

  describe('getVanMaster', () => {
    it('should populate vanMaster on success with data', () => {
      mockMasterdataService.getVanMaster.and.returnValue(
        of({ statusCode: 200, data: [{ vanID: 2, vehicalNo: 'VAN002' }] })
      );
      component.getVanMaster();
      expect(component.vanMaster).toEqual([{ vanID: 2, vehicalNo: 'VAN002' }]);
    });

    it('should alert when no vans data', () => {
      mockMasterdataService.getVanMaster.and.returnValue(
        of({ statusCode: 200, data: [] })
      );
      component.getVanMaster();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        mockLanguageObject.noVansWereMappedforthisprovider
      );
    });

    it('should alert error when statusCode is not 200', () => {
      mockMasterdataService.getVanMaster.and.returnValue(
        of({ statusCode: 500, errorMessage: 'Van error' })
      );
      component.getVanMaster();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Van error',
        'error'
      );
    });

    it('should alert error on HTTP failure', () => {
      mockMasterdataService.getVanMaster.and.returnValue(
        throwError(() => 'Van network error')
      );
      component.getVanMaster();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Van network error',
        'error'
      );
    });
  });

  describe('form control getters', () => {
    it('should return report value', () => {
      component.reportForm.patchValue({ report: { reportID: 1 } });
      expect(component.report).toEqual({ reportID: 1 });
    });

    it('should return fromDate value', () => {
      const date = new Date(2023, 5, 1);
      component.reportForm.patchValue({ fromDate: date });
      expect(component.fromDate).toEqual(date);
    });

    it('should return toDate value', () => {
      const date = new Date(2023, 5, 30);
      component.reportForm.patchValue({ toDate: date });
      expect(component.toDate).toEqual(date);
    });

    it('should return van value', () => {
      component.reportForm.patchValue({ van: { vanID: 1 } });
      expect(component.van).toEqual({ vanID: 1 });
    });
  });

  describe('getReportData', () => {
    beforeEach(() => {
      component.reportForm.patchValue({
        report: { reportID: 1, reportName: 'TestReport' },
        fromDate: new Date(2023, 0, 1),
        toDate: new Date(2023, 0, 31),
        van: { vanID: 1, vehicalNo: 'VAN001' },
      });
      mockSessionStorage.getItem.and.returnValue('ps1');
    });

    it('should call masterdataService.getReportData with correct request', () => {
      mockMasterdataService.getReportData.and.returnValue(
        of({ statusCode: 200, data: [{ col1: 'val1' }] })
      );
      spyOn(component, 'createCriteria');
      component.getReportData();

      expect(mockMasterdataService.getReportData).toHaveBeenCalledWith(
        jasmine.objectContaining({
          reportID: 1,
          vanID: 1,
          providerServiceMapID: 'ps1',
        })
      );
    });

    it('should set reportData and call createCriteria on success', () => {
      const data = [{ col1: 'val1' }];
      mockMasterdataService.getReportData.and.returnValue(
        of({ statusCode: 200, data })
      );
      spyOn(component, 'createCriteria');
      component.getReportData();

      expect(component.reportData).toEqual(data as any);
      expect(component.createCriteria).toHaveBeenCalled();
    });

    it('should alert when no data available', () => {
      mockMasterdataService.getReportData.and.returnValue(
        of({ statusCode: 200, data: [] })
      );
      component.getReportData();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        mockLanguageObject.noDataAvailabletoGenerateReport
      );
    });

    it('should alert error when statusCode is not 200', () => {
      mockMasterdataService.getReportData.and.returnValue(
        of({ statusCode: 500, errorMessage: 'Report error' })
      );
      component.getReportData();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Report error',
        'error'
      );
    });

    it('should alert error on HTTP failure', () => {
      mockMasterdataService.getReportData.and.returnValue(
        throwError(() => 'Report network error')
      );
      component.getReportData();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Report network error',
        'error'
      );
    });
  });

  describe('createCriteria', () => {
    it('should call exportExcel with criteria array', () => {
      component.reportForm.patchValue({
        report: { reportID: 1, reportName: 'TestReport' },
        fromDate: new Date(2023, 0, 1),
        toDate: new Date(2023, 0, 31),
        van: { vanID: 1, vehicalNo: 'VAN001' },
      });
      spyOn(component, 'exportExcel');
      component.createCriteria();

      expect(component.exportExcel).toHaveBeenCalled();
      const criteria = (component.exportExcel as jasmine.Spy).calls.mostRecent()
        .args[0];
      expect(criteria.length).toBe(4);
      expect(criteria[0].Filter_Name).toBe('Start_Date');
      expect(criteria[1].Filter_Name).toBe('End_Date');
      expect(criteria[2].Filter_Name).toBe('Vehicle');
      expect(criteria[2].value).toBe('VAN001');
      expect(criteria[3].Filter_Name).toBe('Report');
      expect(criteria[3].value).toBe('TestReport');
    });
  });

  describe('exportExcel', () => {
    it('should reset reportForm after execution', () => {
      component.reportData = [];
      const criteria = [{ Filter_Name: 'Start_Date', value: new Date() }];
      component.exportExcel(criteria);
      expect(component.reportForm.controls['report'].value).toBeNull();
    });

    it('should set criteriaHead from criteria array', () => {
      component.reportData = [];
      const criteria = [{ Filter_Name: 'Start_Date', value: '2023-01-01' }];
      component.exportExcel(criteria);
      expect(component.criteriaHead).toEqual(['Filter_Name', 'value']);
    });

    it('should alert No Record Found when reportData array is filtered to empty', () => {
      component.reportData = [] as any;
      component.reportForm.patchValue({
        report: { reportID: 1, reportName: 'TestReport' },
      });
      const criteria = [{ Filter_Name: 'Start_Date', value: '2023-01-01' }];
      component.exportExcel(criteria);
      // reportData.length is 0, so the "if (this.reportData.length > 0)" branch is not entered
      // and the form is reset
      expect(component.reportForm.controls['report'].value).toBeNull();
    });

    it('should handle empty criteria array', () => {
      component.reportData = [];
      component.exportExcel([]);
      expect(component.reportForm.controls['report'].value).toBeNull();
    });

    it('should replace null values in criteria with empty string', () => {
      component.reportData = [];
      const criteria: any[] = [{ Filter_Name: 'Start_Date', value: null }];
      component.exportExcel(criteria);
      expect(criteria[0].value).toBe('');
    });
  });

  describe('exportExcel with report data', () => {
    let anchorDispatch: jasmine.Spy;
    beforeEach(() => {
      spyOn(console, 'log');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
      spyOn(URL, 'revokeObjectURL');
      anchorDispatch = spyOn(
        HTMLAnchorElement.prototype,
        'dispatchEvent'
      ).and.returnValue(true);
      component.reportForm.patchValue({
        report: { reportID: 1, reportName: 'My Report' },
      });
      (component as any).reportData = [
        { name: 'A', age: null },
        { name: 'B', age: 4 },
      ];
    });

    afterEach(() => {
      delete (navigator as any).msSaveBlob;
    });

    it('builds the workbook, downloads it via a hidden link and alerts success', async () => {
      let done!: () => void;
      const clicked = new Promise<void>(r => (done = r));
      const click = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(
        function (this: HTMLAnchorElement) {
          expect(this.download).toBe('My_Report.xlsx');
          done();
        }
      );
      const criteria: any[] = [{ Filter_Name: 'Van', value: null }];
      component.exportExcel(criteria);
      expect((component as any).reportData[0].age).toBe('');
      expect(component.criteriaHead).toEqual(['Filter_Name', 'value']);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Report Downloaded',
        'success'
      );
      expect(component.reportForm.controls['report'].value).toBeNull();
      await clicked;
      await new Promise(r => setTimeout(r, 10));
      expect(click).toHaveBeenCalledTimes(1);
      expect(URL.createObjectURL).toHaveBeenCalled();
      // file-saver dispatches its own synthetic click on a separate anchor
      expect(anchorDispatch).toHaveBeenCalled();
    });

    it('uses navigator.msSaveBlob when available', async () => {
      let done!: () => void;
      const saved = new Promise<void>(r => (done = r));
      const msSaveBlob = jasmine
        .createSpy('msSaveBlob')
        .and.callFake(() => done());
      (navigator as any).msSaveBlob = msSaveBlob;
      const click = spyOn(HTMLAnchorElement.prototype, 'click');
      component.exportExcel([]);
      await saved;
      await new Promise(r => setTimeout(r, 10));
      expect(msSaveBlob).toHaveBeenCalledWith(jasmine.any(Blob), 'My Report');
      expect(click).not.toHaveBeenCalled();
    });
  });

  describe('manipulateNullReportData', () => {
    it('should replace null values with empty string', () => {
      const data = [
        { name: 'Test', age: null, city: 'Delhi' },
        { name: null, age: 25, city: null },
      ];
      const result = component.manipulateNullReportData(data);
      expect(result[0].age).toBe('');
      expect(result[1].name).toBe('');
      expect(result[1].city).toBe('');
    });

    it('should not modify non-null values', () => {
      const data = [{ name: 'Test', age: 30 }];
      const result = component.manipulateNullReportData(data);
      expect(result[0].name).toBe('Test');
      expect(result[0].age).toBe(30);
    });

    it('should return empty array for empty input', () => {
      const result = component.manipulateNullReportData([]);
      expect(result).toEqual([]);
    });
  });

  describe('modifyHeader', () => {
    it('should convert camelCase to Title Case', () => {
      const headers = ['firstName'];
      const result = component.modifyHeader(headers, 65);
      expect(result).toBe('First Name');
    });

    it('should replace I D with ID', () => {
      const headers = ['beneficiaryID'];
      const result = component.modifyHeader(headers, 65);
      expect(result).toBe('Beneficiary ID');
    });

    it('should handle already proper case', () => {
      const headers = ['Name'];
      const result = component.modifyHeader(headers, 65);
      expect(result).toBe('Name');
    });

    it('should handle multiple uppercase letters', () => {
      const headers = ['providerServiceMapID'];
      const result = component.modifyHeader(headers, 65);
      expect(result).toContain('ID');
    });
  });

  describe('manipulateSheetCellsAndColumns', () => {
    it('should modify worksheet header cells', () => {
      const head = ['firstName', 'lastName'];
      const mockWorksheet: any = {
        A1: { v: 'firstName', w: 'firstName' },
        B1: { v: 'lastName', w: 'lastName' },
      };
      const result = component.manipulateSheetCellsAndColumns(
        head,
        mockWorksheet
      );
      expect(result['A1'].v).toBe('First Name');
      expect(result['A1'].w).toBeUndefined();
      expect(result['B1'].v).toBe('Last Name');
    });
  });

  describe('trackFieldInteraction', () => {
    it('should call trackingService.trackFieldInteraction with field name and form context', () => {
      component.trackFieldInteraction('reportType');
      expect(mockTrackingService.trackFieldInteraction).toHaveBeenCalledWith(
        'reportType',
        'Reports'
      );
    });
  });
});
