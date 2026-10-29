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
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { DoctorInvestigationsComponent } from './doctor-investigations.component';

describe('DoctorInvestigationsComponent', () => {
  let component: DoctorInvestigationsComponent;
  let fixture: ComponentFixture<DoctorInvestigationsComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let nurseMaster$: BehaviorSubject<any>;
  let doctorMaster$: BehaviorSubject<any>;
  let rbs$: BehaviorSubject<any>;
  let diabetes$: BehaviorSubject<any>;
  let hyper$: BehaviorSubject<any>;
  let confirmedDiab$: BehaviorSubject<any>;
  let systolic$: BehaviorSubject<any>;
  let diastolic$: BehaviorSubject<any>;

  const rbs = {
    procedureID: 1,
    procedureName: environment.RBSTest,
    procedureType: 'Laboratory',
  };
  const hb = {
    procedureID: 2,
    procedureName: environment.haemoglobinTest,
    procedureType: 'Laboratory',
  };
  const va = {
    procedureID: 3,
    procedureName: environment.visualAcuityTest,
    procedureType: 'Laboratory',
  };
  const xray = {
    procedureID: 4,
    procedureName: 'X-Ray',
    procedureType: 'Radiology',
  };
  const procedures = [rbs, hb, va, xray];

  beforeEach(async () => {
    nurseMaster$ = new BehaviorSubject<any>(null);
    doctorMaster$ = new BehaviorSubject<any>(null);
    rbs$ = new BehaviorSubject<any>(null);
    diabetes$ = new BehaviorSubject<any>(0);
    hyper$ = new BehaviorSubject<any>(0);
    confirmedDiab$ = new BehaviorSubject<any>(0);
    systolic$ = new BehaviorSubject<any>(null);
    diastolic$ = new BehaviorSubject<any>(null);
    master = autoSpy(MasterdataService, {
      nurseMasterData$: nurseMaster$,
      doctorMasterData$: doctorMaster$,
    });
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService, {
      rbsTestResultCurrent$: rbs$,
      rbsTestResultFromDoctorFetch: null,
    });
    idrs = autoSpy(IdrsscoreService, {
      diabetesSelectedFlag$: diabetes$,
      hypertensionSelectedFlag$: hyper$,
      confirmedDiabeticSelectedFlag$: confirmedDiab$,
      systolicBpValue$: systolic$,
      diastolicBpValue$: diastolic$,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorInvestigationsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitID: 'v1',
            beneficiaryRegID: 'b1',
            visitCategory: 'NCD screening',
          },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: IdrsscoreService, useValue: idrs },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(DoctorInvestigationsComponent, '');
    fixture = TestBed.createComponent(DoctorInvestigationsComponent);
    component = fixture.componentInstance;
    component.generalDoctorInvestigationForm = new FormGroup({
      labTest: new FormControl(null),
      radiologyTest: new FormControl(null),
      externalInvestigations: new FormControl(null),
    });
    spyOn(console, 'log');
  });

  afterEach(() => component.ngOnDestroy());

  describe('ngOnInit', () => {
    it('clears IDRS / nurse state and subscribes to flags', () => {
      component.ngOnInit();
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
      expect(idrs.clearSystolicBp).toHaveBeenCalled();
      expect(idrs.clearDiastolicBp).toHaveBeenCalled();
      expect(idrs.clearHypertensionSelected).toHaveBeenCalled();
      expect(idrs.clearConfirmedDiabeticSelected).toHaveBeenCalled();
      expect(nurse.clearRbsInVitals).toHaveBeenCalled();
      expect(nurse.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(component.diabetesSelected).toBe(0);
      expect(component.hypertensionSelected).toBe(0);
      expect(component.VisualAcuityMandatory).toBeFalse();
      expect(idrs.clearTMCSuggested).toHaveBeenCalled();
    });

    it('high systolic BP with no confirmed hypertension makes VA mandatory', () => {
      component.ngOnInit();
      systolic$.next(150);
      expect(component.systolicBpValue).toBe(150);
      expect(component.VisualAcuityMandatory).toBeTrue();
      expect(idrs.setVisualAcuityTestMandatoryFlag).toHaveBeenCalled();
      expect(idrs.setTMCSuggested).toHaveBeenCalled();
    });

    it('high diastolic BP makes VA mandatory', () => {
      component.ngOnInit();
      diastolic$.next(95);
      expect(component.VisualAcuityMandatory).toBeTrue();
      diastolic$.next(70);
      expect(component.VisualAcuityMandatory).toBeFalse();
    });

    it('confirmed hypertension (1) suppresses BP-based mandate', () => {
      component.ngOnInit();
      hyper$.next(1);
      systolic$.next(150);
      expect(component.VisualAcuityMandatory).toBeFalse();
      hyper$.next(0);
      expect(component.VisualAcuityMandatory).toBeTrue();
    });

    it('confirmed diabetes re-evaluates the mandate', () => {
      component.ngOnInit();
      component.RBSTestScore = 250;
      confirmedDiab$.next(1);
      expect(component.confirmedDiabeticValue).toBe(1);
      expect(component.VisualAcuityMandatory).toBeTrue();
      component.RBSTestScore = 100;
      confirmedDiab$.next(0);
      expect(component.VisualAcuityMandatory).toBeFalse();
    });

    it('RBS result from vitals is tracked and scored', () => {
      component.ngOnInit();
      rbs$.next(250);
      expect(component.RBSTestScoreInVitals).toBe(250);
      expect(component.RBSTestDoneInVitals).toBeTrue();
      expect(component.rbsTestResultCurrent).toBe(250);
      expect(component.VisualAcuityMandatory).toBeTrue();
      rbs$.next(null);
      expect(component.RBSTestDoneInVitals).toBeFalse();
      expect(component.rbsTestResultCurrent).toBeNull();
      expect(component.VisualAcuityMandatory).toBeFalse();
    });

    it('checkForDiabetesSuspected resets vitals RBS flag when suspected without score', () => {
      component.ngOnInit();
      component.diabetesSelected = 1;
      component.RBSTestScoreInVitals = null as any;
      component.RBSTestDoneInVitals = true;
      component.checkForDiabetesSuspected();
      expect(component.RBSTestDoneInVitals).toBeFalse();
    });

    it('logs doctor master data when present', () => {
      component.ngOnInit();
      doctorMaster$.next({ a: 1 });
      expect(console.log).toHaveBeenCalledWith('doctor master', { a: 1 });
    });
  });

  it('ngDoCheck refreshes language', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('nurse master data', () => {
    it('splits lab/radiology and flags RBS / VA / Hb presence', () => {
      component.ngOnInit();
      nurseMaster$.next({ procedures });
      expect(component.nonRadiologyMaster).toEqual([rbs, hb, va]);
      expect(component.radiologyMaster).toEqual([xray]);
      expect(component.rbsPresent).toBeTrue();
      expect(component.visualAcuityPresent).toBeTrue();
      expect(idrs.rBSPresentInMaster).toHaveBeenCalled();
      expect(idrs.visualAcuityPresentInMaster).toHaveBeenCalled();
      expect(idrs.haemoglobinPresentInMaster).toHaveBeenCalled();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('ignores master data without procedures', () => {
      component.ngOnInit();
      nurseMaster$.next({});
      expect(component.nonRadiologyMaster).toBeUndefined();
    });

    it('in view mode loads and patches investigations and RBS score', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            investigation: {
              laboratoryList: [
                { procedureID: 1, procedureName: environment.RBSTest },
                { procedureID: 2, procedureName: environment.haemoglobinTest },
                { procedureID: 3, procedureName: environment.visualAcuityTest },
                { procedureID: 4, procedureName: 'X-Ray' },
              ],
            },
            diagnosis: { externalInvestigation: 'CT scan' },
            LabReport: [
              {
                procedureName: environment.RBSTest,
                componentList: [{ testResultValue: 300 }],
              },
              { procedureName: 'Other', componentList: [] },
            ],
          },
        })
      );
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ procedures });
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'b1',
        'v1',
        'NCD screening'
      );
      const v = component.generalDoctorInvestigationForm.value;
      expect(v.labTest).toEqual([rbs, hb, va]);
      expect(v.radiologyTest).toEqual([xray]);
      expect(v.externalInvestigations).toBe('CT scan');
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(component.hemoglobbinSelected).toBeTrue();
      expect(component.VisualAcuityTestDone).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
      expect(component.RBSTestScore).toBe(300);
      expect(component.VisualAcuityMandatory).toBeTrue();
    });

    it('ignores view-mode responses without investigation', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getInvestigationDetails('b1', 'v1', 'x');
      doctor.getCaseRecordAndReferDetails.and.returnValue(of(null));
      component.getInvestigationDetails('b1', 'v1', 'x');
      expect(component.generalDoctorInvestigationForm.value.labTest).toBeNull();
    });
  });

  it('patchInvestigationDetails without lab list or diagnosis patches empties', () => {
    component.patchInvestigationDetails({}, null);
    expect(component.generalDoctorInvestigationForm.value).toEqual({
      labTest: [],
      radiologyTest: [],
      externalInvestigations: '',
    });
    expect(component.previousLabTestList).toBeUndefined();
  });

  describe('canDisable', () => {
    it('disables RBS when a current result exists', () => {
      component.rbsTestResultCurrent = 100;
      expect(component.canDisable({ ...rbs })).toBeTrue();
    });

    it('disables RBS when doctor-fetch result exists', () => {
      nurse.rbsTestResultFromDoctorFetch = 120;
      expect(component.canDisable({ ...rbs })).toBeTrue();
    });

    it('disables tests that were previously prescribed', () => {
      component.previousLabTestList = [{ procedureID: 2 }];
      const t1: any = { ...hb };
      const t2: any = { ...va };
      expect(component.canDisable(t1)).toBeTrue();
      expect(t1.disabled).toBeTrue();
      expect(component.canDisable(t2)).toBeFalse();
      expect(t2.disabled).toBeFalse();
    });

    it('returns false with no previous list', () => {
      expect(component.canDisable({ ...hb })).toBeFalse();
    });
  });

  describe('checkTestName', () => {
    it('flags RBS, Hb and VA when selected', () => {
      component.checkTestName({ value: [rbs, hb, va] });
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(component.hemoglobbinSelected).toBeTrue();
      expect(component.VisualAcuityTestDone).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation.calls.allArgs()).toEqual([
        [false],
        [true],
      ]);
    });

    it('clears flags when none selected', () => {
      component.VisualAcuityTestDone = true;
      component.checkTestName({ value: [xray] });
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      expect(component.hemoglobbinSelected).toBeFalse();
      expect(component.VisualAcuityTestDone).toBeFalse();
    });
  });

  it('changeOdDiastolicBp uses the passed value', () => {
    component.hypertensionSelected = 0;
    component.changeOdDiastolicBp(100);
    expect(component.VisualAcuityMandatory).toBeTrue();
    component.changeOdDiastolicBp(80);
    expect(component.VisualAcuityMandatory).toBeFalse();
    expect(idrs.clearVisualAcuityTestMandatoryFlag).toHaveBeenCalled();
  });

  it('changeOfConfirmedHypertension uses the passed value', () => {
    component.systolicBpValue = 150;
    component.changeOfConfirmedHypertension(0);
    expect(component.VisualAcuityMandatory).toBeTrue();
    component.changeOfConfirmedHypertension(1);
    expect(component.VisualAcuityMandatory).toBeFalse();
    component.diastolicBpValue = 95;
    component.changeOfConfirmedHypertension(0);
    expect(component.VisualAcuityMandatory).toBeTrue();
  });

  it('ngOnDestroy unsubscribes subscriptions', () => {
    component.ngOnInit();
    const names = [
      'nurseMasterDataSubscription',
      'doctorMasterDataSubscription',
      'investigationSubscription',
      'diabestesSuspectedSubscription',
      'hyperSuspectedSubscription',
      'systolicSubscription',
      'diastolicSubscription',
      'rbsTestResultSubscription',
    ];
    const spies = names.map(n => {
      const s = jasmine.createSpyObj(n, ['unsubscribe']);
      (component as any)[n] = s;
      return s;
    });
    component.ngOnDestroy();
    spies.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
  });
});
