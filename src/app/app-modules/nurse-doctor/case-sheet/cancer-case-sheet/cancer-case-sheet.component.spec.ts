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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { PrintPageSelectComponent } from '../../print-page-select/print-page-select.component';
import { CancerCaseSheetComponent } from './cancer-case-sheet.component';

describe('CancerCaseSheetComponent', () => {
  let component: CancerCaseSheetComponent;
  let fixture: ComponentFixture<CancerCaseSheetComponent>;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let location: any;

  const setup = async (session: Record<string, any> = {}, params: any = {}) => {
    doctor = autoSpy(DoctorService);
    location = { back: jasmine.createSpy('back') };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: doctor },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CancerCaseSheetComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    spyOn(console, 'log');
  };

  describe('ngOnInit', () => {
    it('current page: builds request, visit ids, oncologist role and loads TM data', async () => {
      await setup(
        {
          caseSheetVisitCategory: 'Cancer Screening',
          caseSheetBenFlowID: 'f',
          caseSheetVisitID: 'v',
          caseSheetBeneficiaryRegID: 'r',
          visitCode: 'vc',
          currentRole: 'Oncologist',
        },
        { printablePage: 'current' }
      );
      component.serviceType = 'TM';
      doctor.getTMCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { x: 1 } })
      );
      component.ngOnInit();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(doctor.getTMCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'Cancer Screening',
        benFlowID: 'f',
        benVisitID: 'v',
        beneficiaryRegID: 'r',
        visitCode: 'vc',
      });
      expect(component.getCaseSheetDataVisit).toEqual({
        benVisitID: 'v',
        benRegID: 'r',
        benFlowID: 'f',
      });
      expect(component.visitCategory).toBe('Cancer Screening');
      expect(component.oncologistRemarks).toBeTrue();
      expect(component.hideBack).toBeFalse();
      expect(component.caseSheetData).toEqual({ x: 1 });
    });

    it('previous page (default): loads MMU data and hides back', async () => {
      await setup({
        previousCaseSheetVisitCategory: 'Cancer Screening',
        previousCaseSheetBenFlowID: 'pf',
        previousCaseSheetVisitID: 'pv',
        previousCaseSheetBeneficiaryRegID: 'pr',
        previousCaseSheetVisitCode: 'pc',
        currentRole: 'Doctor',
      });
      component.serviceType = 'MMU';
      doctor.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { y: 2 } })
      );
      component.ngOnInit();
      expect(component.hideBack).toBeTrue();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'Cancer Screening',
        benFlowID: 'pf',
        beneficiaryRegID: 'pr',
        visitCode: 'pc',
      });
      expect(component.getCaseSheetDataVisit).toEqual({
        benVisitID: 'pv',
        benRegID: 'pr',
        benFlowID: 'pf',
      });
      expect(component.oncologistRemarks).toBeUndefined();
      expect(component.caseSheetData).toEqual({ y: 2 });
    });

    it('ignores failed casesheet responses and unknown service types', async () => {
      await setup({}, { printablePage: 'nope' });
      component.ngOnInit();
      component.serviceType = 'TM';
      doctor.getTMCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.getCaseSheetData({});
      component.serviceType = 'MMU';
      doctor.getMMUCasesheetData.and.returnValue(of(null));
      component.getCaseSheetData({});
      expect(component.caseSheetData).toBeUndefined();
    });
  });

  describe('oncologist remarks', () => {
    beforeEach(async () => {
      await setup();
      component.fetchLanguageResponse();
      component.getCaseSheetDataVisit = { benVisitID: 'v', benRegID: 'r' };
    });

    it('edits existing remarks, trims after last dot and saves', () => {
      component.caseSheetDiagnosisData = {
        provisionalDiagnosisOncologist: 'old',
      };
      confirm.editRemarks.and.returnValue(of('new remark.xyz'));
      doctor.postOncologistRemarksforCancerCaseSheet.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } })
      );
      component.caseSheetData = { doctorData: { diagnosis: { a: 1 } } };
      component.getOncologistRemarks();
      expect(confirm.editRemarks).toHaveBeenCalledWith(
        'Oncologist Observation',
        'old'
      );
      expect(
        component.caseSheetDiagnosisData.provisionalDiagnosisOncologist
      ).toBe('new remark');
      expect(
        doctor.postOncologistRemarksforCancerCaseSheet
      ).toHaveBeenCalledWith('new remark', 'v', 'r');
      expect(component.caseSheetData.doctorData.diagnosis).toEqual({
        a: 1,
        provisionalDiagnosisOncologist: 'new remark',
      });
      expect(confirm.alert).toHaveBeenCalledWith('saved', 'success');
    });

    it('creates diagnosis data when absent; success without doctorData', () => {
      confirm.editRemarks.and.returnValue(of('r1.'));
      doctor.postOncologistRemarksforCancerCaseSheet.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } })
      );
      component.getOncologistRemarks();
      expect(confirm.editRemarks).toHaveBeenCalledWith(
        'Oncologist Observation',
        undefined
      );
      expect(component.caseSheetDiagnosisData).toEqual({
        provisionalDiagnosisOncologist: 'r1',
      });
      expect(component.caseSheetData).toBeUndefined();
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
    });

    it('does nothing when edit is cancelled', () => {
      confirm.editRemarks.and.returnValue(of(null));
      component.getOncologistRemarks();
      expect(
        doctor.postOncologistRemarksforCancerCaseSheet
      ).not.toHaveBeenCalled();
    });

    it('alerts error on 500/5000 and nothing on other codes', () => {
      doctor.postOncologistRemarksforCancerCaseSheet.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'fail' })
      );
      component.saveOncologistRemarks('x');
      expect(confirm.alert).toHaveBeenCalledWith('fail', 'error');
      doctor.postOncologistRemarksforCancerCaseSheet.and.returnValue(
        of({ statusCode: 500, errorMessage: 'fail2' })
      );
      component.saveOncologistRemarks('x');
      expect(confirm.alert).toHaveBeenCalledWith('fail2', 'error');
      confirm.alert.calls.reset();
      doctor.postOncologistRemarksforCancerCaseSheet.and.returnValue(
        of({ statusCode: 400 })
      );
      component.saveOncologistRemarks('x');
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('print page selection and helpers', () => {
    beforeEach(async () => setup());

    it('applies dialog selection', () => {
      dialog.open.and.returnValue(
        createDialogRefMock({
          caseSheetExamination: false,
          caseSheetHistory: false,
          caseSheetCovidVaccinationDetails: false,
        })
      );
      component.visitCategory = 'Cancer Screening';
      component.selectPrintPage();
      expect(dialog.open).toHaveBeenCalledWith(PrintPageSelectComponent, {
        width: '420px',
        disableClose: false,
        data: {
          printPagePreviewSelect: component.printPagePreviewSelect,
          visitCategory: 'Cancer Screening',
        },
      });
      expect(component.printPagePreviewSelect).toEqual({
        caseSheetHistory: false,
        caseSheetExamination: false,
        caseSheetCovidVaccinationDetails: false,
      });
    });

    it('keeps selection when dismissed', () => {
      component.selectPrintPage();
      expect(component.printPagePreviewSelect.caseSheetHistory).toBeTrue();
    });

    it('printPage, goToTop, goBack use browser APIs', () => {
      const print = spyOn(window, 'print');
      const scroll = spyOn(window, 'scrollTo');
      component.printPage();
      component.goToTop();
      component.goBack();
      expect(print).toHaveBeenCalled();
      expect(scroll).toHaveBeenCalledWith(0, 0);
      expect(location.back).toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes when subscribed', () => {
      const sub = { unsubscribe: jasmine.createSpy('u') };
      component.caseSheetSubs = sub;
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
      component.caseSheetSubs = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('language helpers set current language', () => {
      component.assignSelectedLanguage();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });
});
