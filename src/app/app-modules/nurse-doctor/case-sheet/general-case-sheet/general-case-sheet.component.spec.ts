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
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { DoctorService } from '../../shared/services/doctor.service';
import { NurseService } from '../../shared/services';
import { PrintPageSelectComponent } from '../../print-page-select/print-page-select.component';
import { PrescribeTmMedicineComponent } from '../prescribe-tm-medicine/prescribe-tm-medicine.component';
import { GeneralCaseSheetComponent } from './general-case-sheet.component';

describe('GeneralCaseSheetComponent', () => {
  let component: GeneralCaseSheetComponent;
  let fixture: ComponentFixture<GeneralCaseSheetComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let location: any;

  const setup = async (session: Record<string, any> = {}, params: any = {}) => {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    location = { back: jasmine.createSpy('back') };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GeneralCaseSheetComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    confirm.alert.and.callFake(() => createDialogRefMock());
    dialog = TestBed.inject(MatDialog);
    spyOn(console, 'log');
  };

  const current = {
    caseSheetVisitCategory: 'ANC',
    caseSheetBenFlowID: 'f',
    caseSheetVisitID: 'v',
    caseSheetBeneficiaryRegID: 'r',
    caseSheetVisitCode: 'cv',
    visitCode: 'vc',
  };

  describe('ngOnInit', () => {
    it('defaults to previous case sheet and requests TM data', async () => {
      await setup({
        previousCaseSheetVisitCategory: 'PNC',
        previousCaseSheetBenFlowID: 'pf',
        previousCaseSheetBeneficiaryRegID: 'pr',
        previousCaseSheetVisitCode: 'pv',
      });
      component.serviceType = 'TM';
      doctor.getTMCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { a: 1 } })
      );
      component.ngOnInit();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.dataStore).toBe('previous');
      expect(component.hideBack).toBeTrue();
      expect(component.visitCategory).toBe('PNC');
      expect(doctor.getTMCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'PNC',
        benFlowID: 'pf',
        beneficiaryRegID: 'pr',
        visitCode: 'pv',
      });
      expect(component.caseSheetData).toEqual({ a: 1 });
    });

    it('current page with MMU service fetches MMU casesheet', async () => {
      await setup(current, { printablePage: 'current' });
      component.serviceType = 'MMU';
      doctor.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { b: 2 } })
      );
      component.ngOnInit();
      expect(component.hideBack).toBeFalse();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'ANC',
        benFlowID: 'f',
        benVisitID: 'v',
        beneficiaryRegID: 'r',
        visitCode: 'vc',
      });
      expect(component.caseSheetData).toEqual({ b: 2 });
      expect(component.hideSelectQC).toBeFalse();
    });

    it('TM flag (boolean true) enables prescription and loads TM referred data', async () => {
      await setup({ ...current, caseSheetTMFlag: true });
      nurse.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { c: 3 } })
      );
      component.ngOnInit();
      expect(component.enablePrescriptionButton).toBeTrue();
      expect(nurse.getTMReferredCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'ANC',
        benFlowID: 'f',
        benVisitID: 'v',
        beneficiaryRegID: 'r',
        visitCode: 'cv',
      });
      expect(component.caseSheetData).toEqual({ c: 3 });
    });

    it('specialistFlag 200 loads TM referred data without prescription button', async () => {
      await setup({ ...current, specialistFlag: '200' });
      nurse.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.ngOnInit();
      expect(component.enablePrescriptionButton).toBeFalse();
      expect(nurse.getTMReferredCasesheetData).toHaveBeenCalled();
    });

    it('unknown page does nothing', async () => {
      await setup({}, { printablePage: 'other' });
      component.ngOnInit();
      expect(doctor.getTMCasesheetData).not.toHaveBeenCalled();
      expect(doctor.getMMUCasesheetData).not.toHaveBeenCalled();
    });
  });

  describe('getTMReferredCasesheetData', () => {
    beforeEach(async () => setup());

    it('alerts and goes back on failure response', () => {
      nurse.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.getTMReferredCasesheetData({});
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(location.back).toHaveBeenCalled();
    });

    it('alerts and goes back on error', () => {
      nurse.getTMReferredCasesheetData.and.returnValue(throwingObs());
      component.getTMReferredCasesheetData({});
      expect(confirm.alert).toHaveBeenCalledWith(
        'Error in fetching TM Casesheet',
        'error'
      );
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('getCasesheetData', () => {
    beforeEach(async () => setup());

    it('hides QC select for QC visits or previous view; ignores failures', () => {
      component.visitCategory = 'General OPD (QC)';
      component.serviceType = 'TM';
      doctor.getTMCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.getCasesheetData({});
      expect(component.hideSelectQC).toBeTrue();
      expect(component.caseSheetData).toBeUndefined();

      component.hideSelectQC = false;
      component.visitCategory = 'ANC';
      component.previous = true;
      component.serviceType = 'MMU';
      doctor.getMMUCasesheetData.and.returnValue(of(null));
      component.getCasesheetData({});
      expect(component.hideSelectQC).toBeTrue();
      expect(component.caseSheetData).toBeUndefined();
    });
  });

  describe('selectPrintPage', () => {
    beforeEach(async () => setup());

    it('opens dialog and applies returned selection', () => {
      const result = {
        caseSheetANC: false,
        caseSheetPNC: false,
        caseSheetExamination: true,
        caseSheetHistory: false,
        caseSheetCovidVaccinationDetails: false,
      };
      dialog.open.and.returnValue(createDialogRefMock(result));
      component.visitCategory = 'ANC';
      component.selectPrintPage();
      expect(dialog.open).toHaveBeenCalledWith(PrintPageSelectComponent, {
        width: '420px',
        disableClose: false,
        data: {
          printPagePreviewSelect: component.printPagePreviewSelect,
          visitCategory: 'ANC',
        },
      });
      expect(component.printPagePreviewSelect).toEqual(result);
    });

    it('keeps selection when dialog dismissed', () => {
      component.selectPrintPage();
      expect(component.printPagePreviewSelect.caseSheetANC).toBeTrue();
    });
  });

  describe('prescribeTMMedicine', () => {
    beforeEach(async () => setup());

    it('opens prescribe dialog and stores result drugs', () => {
      dialog.open.and.returnValue(
        createDialogRefMock({ prescribedDrugs: [{ id: 1 }] })
      );
      component.caseSheetData = { doctorData: { prescription: [{ id: 9 }] } };
      component.prescribeTMMedicine();
      expect(dialog.open).toHaveBeenCalledWith(PrescribeTmMedicineComponent, {
        data: {
          height: '560px',
          weight: '680px',
          disableClose: true,
          tmPrescribedDrugs: [{ id: 9 }],
        },
      });
      expect(doctor.prescribedDrugData).toEqual([{ id: 1 }]);
    });

    it('logs when dialog closed without result', () => {
      component.caseSheetData = { doctorData: { prescription: [{ id: 9 }] } };
      component.prescribeTMMedicine();
      expect(console.log).toHaveBeenCalledWith('No prescribed drugs');
    });

    it('alerts when there are no prescriptions', () => {
      component.caseSheetData = { doctorData: { prescription: [] } };
      component.prescribeTMMedicine();
      component.caseSheetData = null;
      component.prescribeTMMedicine();
      expect(dialog.open).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        'There is no prescribed drugs from TM specialist'
      );
    });
  });

  describe('navigation and browser helpers', () => {
    beforeEach(async () => setup());

    it('downloadCasesheet prints', () => {
      const print = spyOn(window, 'print');
      component.downloadCasesheet();
      expect(print).toHaveBeenCalled();
    });

    it('goToTop scrolls to top', () => {
      const scroll = spyOn(window, 'scrollTo');
      component.goToTop();
      expect(scroll).toHaveBeenCalledWith(0, 0);
    });

    it('goBackVisitDet alerts and goes back', () => {
      component.goBackVisitDet();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Error in fetching TM Casesheet',
        'error'
      );
      expect(location.back).toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes', () => {
      const sub = { unsubscribe: jasmine.createSpy('u') };
      component.casesheetSubs = sub;
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
      component.casesheetSubs = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('ngDoCheck refreshes language', () => {
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });
});
