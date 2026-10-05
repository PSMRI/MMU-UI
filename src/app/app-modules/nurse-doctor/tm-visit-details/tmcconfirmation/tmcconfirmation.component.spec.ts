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
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DataSyncLoginComponent } from 'src/app/app-modules/core/components/data-sync-login/data-sync-login.component';
import { DoctorService, NurseService } from '../../shared/services';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { TmcconfirmationComponent } from './tmcconfirmation.component';

describe('TmcconfirmationComponent', () => {
  let component: TmcconfirmationComponent;
  let fixture: ComponentFixture<TmcconfirmationComponent>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let router: Router;
  let visitMaster$: BehaviorSubject<any>;

  const centers = [
    { institutionID: 1, institutionName: 'AIIMS' },
    { institutionID: 2, institutionName: 'KEM' },
  ];

  const makeTmcForm = (tmcConfirmed = false) =>
    new FormGroup({
      tmcConfirmed: new FormControl(tmcConfirmed),
      refrredToAdditionalServiceList: new FormControl(null),
      isHypertensionConfirmed: new FormControl(null),
      isDiabetic: new FormControl(null),
    });

  async function setup(
    opts: {
      tmcConfirmed?: boolean;
      hyper?: boolean;
      diab?: boolean;
      drugs?: any;
      seed?: Record<string, any>;
      category?: string | null;
      visitMaster?: any;
    } = {}
  ) {
    doctor = autoSpy(DoctorService, { prescribedDrugData: opts.drugs });
    nurse = autoSpy(NurseService);
    visitMaster$ = new BehaviorSubject<any>(opts.visitMaster ?? null);
    master = autoSpy(MasterdataService, {
      visitDetailMasterData$: visitMaster$.asObservable(),
    });
    master.getVisitDetailMasterData.and.returnValue(undefined);
    idrs = autoSpy(IdrsscoreService, {
      isHypertensionConfirmed: !!opts.hyper,
      isDiabeticsConfirmed: !!opts.diab,
    });
    idrs.setTMCSubmit.and.returnValue(undefined);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TmcconfirmationComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'b1',
            visitID: 'v1',
            providerServiceID: 'p1',
            ...(opts.seed || {}),
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: MasterdataService, useValue: master },
        { provide: IdrsscoreService, useValue: idrs },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TmcconfirmationComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'log');
    component.tmcConfirmationFormsGroup = makeTmcForm(opts.tmcConfirmed);
    component.patientVisitDetailsForm = new FormGroup({
      visitCategory: new FormControl(
        opts.category === undefined ? 'NCD screening' : opts.category
      ),
    });
    component.ngOnInit();
  }

  afterEach(() => {
    component?.ngOnDestroy();
    sessionStorage.removeItem('tmCaseSheet');
    sessionStorage.removeItem('authorizeToViewTMcasesheet');
  });

  describe('ngOnInit', () => {
    it('defaults when TMC not confirmed', async () => {
      await setup();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('NCD screening');
      expect(master.getVisitDetailMasterData).toHaveBeenCalled();
      expect(component.showRadio).toBeFalse();
      expect(component.disableNoOnSuccessOfYes).toBeFalse();
      expect(component.prescribedDrugDataFromCaseSheet).toBeUndefined();
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('patches confirmed flags from IDRS service when TMC confirmed', async () => {
      await setup({
        tmcConfirmed: true,
        hyper: true,
        diab: true,
        drugs: ['d'],
        seed: { disableNoOnSuccessOfYes: 'true' },
      });
      expect(component.showRadio).toBeTrue();
      expect(
        component.tmcConfirmationFormsGroup.value.isHypertensionConfirmed
      ).toBeTrue();
      expect(component.tmcConfirmationFormsGroup.value.isDiabetic).toBeTrue();
      expect(component.prescribedDrugDataFromCaseSheet).toEqual(['d']);
      expect(component.disableNoOnSuccessOfYes).toBeTrue();
    });

    it('patches false flags when TMC confirmed but nothing confirmed', async () => {
      await setup({ tmcConfirmed: true });
      expect(
        component.tmcConfirmationFormsGroup.value.isHypertensionConfirmed
      ).toBeFalse();
      expect(component.tmcConfirmationFormsGroup.value.isDiabetic).toBeFalse();
    });
  });

  describe('master data and refer details', () => {
    const visitMaster = {
      visitCategories: [
        { visitCategory: 'NCD screening', visitCategoryID: 7 },
        { visitCategory: 'ANC', visitCategoryID: 4 },
      ],
    };

    it('loads doctor master data and patches the referred centre', async () => {
      await setup();
      master.getDoctorMasterDataForNurse.and.returnValue(
        of({ statusCode: 200, data: { higherHealthCare: centers } })
      );
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { Refer: { referredToInstituteID: 2 } } })
      );
      visitMaster$.next(visitMaster);
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategoryID',
        7
      );
      expect(master.getDoctorMasterDataForNurse).toHaveBeenCalledWith(7, 'p1');
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'b1',
        'v1',
        'NCD screening'
      );
      expect(component.defaultCentre).toBe('KEM');
      expect(
        component.tmcConfirmationFormsGroup.value.refrredToAdditionalServiceList
      ).toEqual(centers[1]);
    });

    it('does not patch when referred centre is unknown or refer missing', async () => {
      await setup();
      component.higherHealthcareCenter = centers;
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { Refer: { referredToInstituteID: 9 } } })
      );
      component.getReferDetails();
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getReferDetails();
      expect(component.defaultCentre).toBeUndefined();
    });

    it('skips doctor master data on non-200', async () => {
      await setup();
      master.getDoctorMasterDataForNurse.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      visitMaster$.next(visitMaster);
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('does nothing without a category or unknown category', async () => {
      await setup({ category: null, visitMaster });
      expect(component.visitCategoryList).toEqual(visitMaster.visitCategories);
      expect(master.getDoctorMasterDataForNurse).not.toHaveBeenCalled();
      expect(component.getVisitCategoryID('Unknown')).toBeNull();
      component.visitCategory = 'Unknown';
      component.getDoctorMasterData('Unknown');
      expect(master.getDoctorMasterDataForNurse).not.toHaveBeenCalled();
      expect(component.getVisitCategoryID('ANC')).toBe(4);
    });
  });

  it('checkDiabetes patches isDiabetic on success only', async () => {
    await setup();
    nurse.getPreviousVisitData.and.returnValue(
      of({ statusCode: 200, data: { isDiabetic: true } })
    );
    component.checkDiabetes();
    expect(nurse.getPreviousVisitData).toHaveBeenCalledWith({ benRegID: 'b1' });
    expect(component.tmcConfirmationFormsGroup.value.isDiabetic).toBeTrue();
    nurse.getPreviousVisitData.and.returnValue(
      of({ statusCode: 500, data: { isDiabetic: false } })
    );
    component.checkDiabetes();
    expect(component.tmcConfirmationFormsGroup.value.isDiabetic).toBeTrue();
  });

  it('resetAdditionalServiceList toggles radio, validator and TMC submit', async () => {
    await setup();
    const ctrl =
      component.tmcConfirmationFormsGroup.controls[
        'refrredToAdditionalServiceList'
      ];
    component.resetAdditionalServiceList({ value: false });
    expect(idrs.setTMCSubmit).toHaveBeenCalledWith(false);
    expect(component.showRadio).toBeFalse();
    ctrl.updateValueAndValidity();
    expect(ctrl.valid).toBeFalse();
    component.resetAdditionalServiceList({ value: true });
    expect(idrs.setTMCSubmit).toHaveBeenCalledWith(true);
    expect(component.showRadio).toBeTrue();
    expect(ctrl.errors).toBeNull();
  });

  it('higherhealthcarecenter flags selection', async () => {
    await setup();
    component.higherhealthcarecenter(null);
    expect(component.selectValueService).toBeUndefined();
    component.higherhealthcarecenter({ institutionName: 'A' });
    expect(component.selectValueService).toBeTrue();
  });

  describe('view TM casesheet', () => {
    const ben = {
      benFlowID: 11,
      VisitCategory: 'NCD screening',
      beneficiaryRegID: 22,
      benVisitID: 33,
      visitCode: 44,
    };
    const okRes = (disease: any) => ({
      statusCode: 200,
      data: {
        nurseData: { idrs: { IDRSDetail: { confirmedDisease: disease } } },
      },
    });

    beforeEach(async () =>
      setup({ seed: { beneficiaryData: JSON.stringify(ben) } })
    );

    it('stores casesheet keys, fetches casesheet and routes on confirm', () => {
      nurse.getTMReferredCasesheetData.and.returnValue(
        of(okRes(['Hypertension', 'Diabetes']))
      );
      component.viewAndPrintCaseSheet();
      expect(session.setItem).toHaveBeenCalledWith('caseSheetTMFlag', 'true');
      expect(nurse.getTMReferredCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'NCD screening',
        benFlowID: 11,
        benVisitID: 33,
        beneficiaryRegID: 22,
        visitCode: 44,
      });
      expect(idrs.setTMCSubmit).toHaveBeenCalledWith(false);
      expect(sessionStorage.getItem('tmCaseSheet')).toBe('true');
      expect(component.disableNoOnSuccessOfYes).toBe('true');
      expect(idrs.isHypertensionConfirmed).toBeTrue();
      expect(idrs.isDiabeticsConfirmed).toBeTrue();
      expect(component.tmcConfirmationFormsGroup.value.isDiabetic).toBeTrue();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.consulation
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/MMU/current',
      ]);
      expect(component.caseSheetData).toBeDefined();
    });

    it('does not route when confirm declined; handles no confirmed disease', () => {
      confirm.confirm.and.returnValue(of(false));
      nurse.getTMReferredCasesheetData.and.returnValue(of(okRes(null)));
      component.getTMReferredCasesheetData({});
      expect(router.navigate).not.toHaveBeenCalled();
      expect(idrs.isHypertensionConfirmed).toBeFalse();
      expect(idrs.isDiabeticsConfirmed).toBeFalse();
      expect(
        component.tmcConfirmationFormsGroup.value.isHypertensionConfirmed
      ).toBeFalse();
    });

    it('opens login dialog on 5003 and re-authorizes', () => {
      nurse.getTMReferredCasesheetData.and.returnValues(
        of({ statusCode: 5003 }),
        of({ statusCode: 500, errorMessage: 'x' })
      );
      dialog.open.and.returnValue(createDialogRefMock(true));
      sessionStorage.setItem('authorizeToViewTMcasesheet', 'Authorized');
      component.getTMReferredCasesheetData({});
      expect(dialog.open).toHaveBeenCalledWith(
        DataSyncLoginComponent,
        jasmine.objectContaining({
          disableClose: true,
          data: { provideAuthorizationToViewTmCS: true },
        })
      );
      expect(nurse.getTMReferredCasesheetData).toHaveBeenCalledTimes(2);
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });

    it('does not re-authorize when dialog closed without authorization', () => {
      nurse.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 5003 })
      );
      dialog.open.and.returnValue(createDialogRefMock(true));
      component.getTMReferredCasesheetData({});
      expect(nurse.getTMReferredCasesheetData).toHaveBeenCalledTimes(1);
    });

    it('alerts and re-enables submit on error', () => {
      nurse.getTMReferredCasesheetData.and.returnValue(throwingObs());
      component.getTMReferredCasesheetData({});
      expect(idrs.setTMCSubmit).toHaveBeenCalledWith(true);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.errorInfetchingTMCasesheet,
        'error'
      );
    });

    it('skips fetching when not TM flagged and not specialist', () => {
      spyOn(component, 'setCasesheetData');
      component.onceAuthorizeViewTMCS();
      expect(nurse.getTMReferredCasesheetData).not.toHaveBeenCalled();
      session.store.set('specialistFlag', '200');
      nurse.getTMReferredCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.onceAuthorizeViewTMCS();
      expect(nurse.getTMReferredCasesheetData).toHaveBeenCalled();
    });
  });

  it('ngOnDestroy unsubscribes master data', async () => {
    await setup();
    const u = spyOn(component.visitDetailMasterDataSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(u).toHaveBeenCalled();
  });
});
