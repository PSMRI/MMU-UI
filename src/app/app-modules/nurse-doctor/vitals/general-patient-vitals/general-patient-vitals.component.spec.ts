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
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { GeneralPatientVitalsComponent } from './general-patient-vitals.component';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { NurseService } from '../../shared/services/nurse.service';
import { TestInVitalsService } from '../../shared/services/test-in-vitals.service';
import { AudioRecordingService } from '../../shared/services/audio-recording.service';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const CONTROLS = [
  'height_cm',
  'weight_Kg',
  'waistCircumference_cm',
  'hipCircumference_cm',
  'midUpperArmCircumference_MUAC_cm',
  'headCircumference_cm',
  'temperature',
  'pulseRate',
  'systolicBP_1stReading',
  'diastolicBP_1stReading',
  'respiratoryRate',
  'bMI',
  'bloodGlucose_Fasting',
  'bloodGlucose_Random',
  'bloodGlucose_2hr_PP',
  'sPO2',
  'rbsTestResult',
  'rbsTestRemarks',
  'rbsCheckBox',
  'waistHipRatio',
];

function buildForm(required = false): FormGroup {
  const group: Record<string, FormControl> = {};
  CONTROLS.forEach(
    c => (group[c] = new FormControl(null, required ? Validators.required : []))
  );
  return new FormGroup(group);
}

describe('GeneralPatientVitalsComponent', () => {
  let component: GeneralPatientVitalsComponent;
  let fixture: ComponentFixture<GeneralPatientVitalsComponent>;
  let form: FormGroup;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let benService: any;
  let audio: any;
  let testInVitals: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let tracking: any;
  let route: any;
  let recordingFailed$: Subject<any>;
  let recordedTime$: Subject<any>;
  let recordedBlob$: Subject<any>;
  const lang = LANGUAGE_EN;

  function dialogReturns(result: any) {
    dialog.open.and.returnValue({ afterClosed: () => of(result) });
  }

  beforeEach(async () => {
    recordingFailed$ = new Subject();
    recordedTime$ = new Subject();
    recordedBlob$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralPatientVitalsComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: '101', visitID: '7', visitCode: 'VC1' },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService),
        },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            ncdTemp$: new BehaviorSubject<any>(undefined),
            rbsSelectedInInvestigation$: new BehaviorSubject<any>(undefined),
            enableLAssessment$: new BehaviorSubject<any>(false),
            isAssessmentDone: false,
            rbsTestResultFromDoctorFetch: null,
          }),
        },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(IdrsscoreService, {
            diabetesSelectedFlag$: new BehaviorSubject<any>(0),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: new BehaviorSubject<any>(null),
          }),
        },
        {
          provide: AudioRecordingService,
          useValue: autoSpy(AudioRecordingService, {
            recordingFailed: () => recordingFailed$.asObservable(),
            getRecordedTime: () => recordedTime$.asObservable(),
            getRecordedBlob: () => recordedBlob$.asObservable(),
          }),
        },
        {
          provide: TestInVitalsService,
          useValue: autoSpy(TestInVitalsService),
        },
        { provide: SetLanguageComponent, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { attendant: 'doctor' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GeneralPatientVitalsComponent, '')
      .compileComponents();

    doctor = TestBed.inject(DoctorService);
    nurse = TestBed.inject(NurseService);
    idrs = TestBed.inject(IdrsscoreService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    audio = TestBed.inject(AudioRecordingService);
    testInVitals = TestBed.inject(TestInVitalsService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
    route = TestBed.inject(ActivatedRoute);

    fixture = TestBed.createComponent(GeneralPatientVitalsComponent);
    component = fixture.componentInstance;
    form = buildForm();
    component.patientVitalsForm = form;
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
  });

  afterEach(() => {
    (environment as any).isMMUOfflineSync = false;
  });

  describe('constructor subscriptions (audio)', () => {
    it('resets isRecording when recording fails', () => {
      component.isRecording = true;
      recordingFailed$.next(true);
      expect(component.isRecording).toBeFalse();
    });

    it('stores recorded time and auto-stops at 00:16', () => {
      component.isRecording = true;
      recordedTime$.next('00:05');
      expect(component.recordedTime).toBe('00:05');
      expect(audio.stopRecording).not.toHaveBeenCalled();
      recordedTime$.next('00:16');
      expect(audio.stopRecording).toHaveBeenCalled();
      expect(component.isRecording).toBeFalse();
    });

    it('stores recorded blob and builds a blob url', () => {
      const blob = new Blob(['abc']);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      recordedBlob$.next({ blob, title: 't' });
      expect(component.coughBlobFile).toBe(blob);
      expect(component.blobUrl).toBe('blob:url');
      expect(component.teste.title).toBe('t');
    });
  });

  describe('ngOnInit', () => {
    it('initialises state and clears service flags', () => {
      expect(component.currentLanguageSet).toEqual(lang);
      expect(nurse.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        false
      );
      expect(nurse.clearMessage).toHaveBeenCalled();
      expect(nurse.clearEnableLAssessment).toHaveBeenCalled();
      expect(idrs.clearMessage).toHaveBeenCalled();
      expect(component.ncdTemperature).toBeFalse();
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      expect(component.diabetesSelected).toBe(0);
      expect(component.hideLungAssessment).toBeFalse();
      expect(component.enableLungAssessment).toBeFalse();
    });

    it('reacts to service stream emissions', () => {
      nurse.ncdTemp$.next(true);
      expect(component.ncdTemperature).toBeTrue();
      nurse.ncdTemp$.next(undefined);
      expect(component.ncdTemperature).toBeFalse();
      nurse.rbsSelectedInInvestigation$.next(true);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      nurse.rbsSelectedInInvestigation$.next(undefined);
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      idrs.diabetesSelectedFlag$.next(1);
      expect(component.diabetesSelected).toBe(1);
      nurse.enableLAssessment$.next(true);
      expect(component.enableLungAssessment).toBeTrue();
      nurse.enableLAssessment$.next(false);
      expect(component.enableLungAssessment).toBeFalse();
    });

    it('hides lung assessment in offline-sync mode', () => {
      (environment as any).isMMUOfflineSync = true;
      component.ngOnInit();
      expect(component.hideLungAssessment).toBeTrue();
    });

    it('disables lung assessment for minors and enables for adults', () => {
      benService.beneficiaryDetails$.next({
        ageVal: 10,
        age: '10 years - 2 months',
        genderName: 'Male',
      });
      component.ngOnInit();
      expect(component.disabledLungAssesment).toBeTrue();
      benService.beneficiaryDetails$.next({
        ageVal: 30,
        age: '30 years - 0 months',
        genderName: 'Male',
      });
      component.ngOnInit();
      expect(component.disabledLungAssesment).toBeFalse();
    });
  });

  describe('getBeneficiaryDetails', () => {
    it('sets age, months and female flag', () => {
      benService.beneficiaryDetails$.next({
        ageVal: 25,
        age: '25 years - 3 months',
        genderName: 'Female',
      });
      expect(component.benAge).toBe(25);
      expect(component.totalMonths).toBe(303);
      expect(component.female).toBeTrue();
      expect(component.male).toBeFalse();
      expect(component.disabledLungAssesment).toBeFalse();
    });

    it('sets male flag and marks minors', () => {
      benService.beneficiaryDetails$.next({
        ageVal: 5,
        age: '5 years - 1 months',
        genderName: 'MALE',
      });
      expect(component.male).toBeTrue();
      expect(component.disabledLungAssesment).toBeTrue();
      expect(component.totalMonths).toBe(61);
    });

    it('ignores beneficiary without age or gender', () => {
      benService.beneficiaryDetails$.next({ ageVal: null, genderName: null });
      expect(component.benAge).toBeUndefined();
      expect(component.female).toBeUndefined();
      expect(component.male).toBeFalse();
    });
  });

  describe('getGender', () => {
    [
      ['Female', 1],
      ['Male', 0],
      ['Transgender', 2],
    ].forEach(([g, v]) => {
      it(`maps ${g} to ${v}`, () => {
        session.store.set('beneficiaryGender', g);
        component.getGender();
        expect(component.benGenderType).toBe(v);
      });
    });

    it('leaves gender type unset for unknown gender', () => {
      component.benGenderType = undefined;
      session.store.set('beneficiaryGender', 'Other');
      component.getGender();
      expect(component.benGenderType).toBeUndefined();
    });
  });

  describe('ngOnChanges', () => {
    it('flags ANC category', () => {
      component.visitCategory = 'ANC';
      component.ngOnChanges();
      expect(component.hideForANCAndQC).toBeFalse();
      expect(component.showGlucoseQC).toBeFalse();
      expect(component.doctorScreen).toBeFalse();
    });

    it('flags General OPD (QC) category', () => {
      component.visitCategory = 'General OPD (QC)';
      component.ngOnChanges();
      expect(component.hideForANCAndQC).toBeFalse();
      expect(component.showGlucoseQC).toBeTrue();
    });

    it('defaults for other categories', () => {
      component.visitCategory = 'NCD screening';
      component.ngOnChanges();
      expect(component.hideForANCAndQC).toBeTrue();
      expect(component.showGlucoseQC).toBeFalse();
    });

    it('loads vitals and assessment in view mode', () => {
      spyOn(component, 'getAssessmentID');
      spyOn(component, 'getGeneralVitalsData');
      component.mode = 'view';
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(component.getAssessmentID).toHaveBeenCalled();
      expect(component.getGeneralVitalsData).toHaveBeenCalled();
    });

    it('updates vitals in update mode', () => {
      spyOn(component, 'updateGeneralVitals');
      component.mode = 'update';
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(component.updateGeneralVitals).toHaveBeenCalledWith(form);
    });

    it('fetches previous anthropometry for nurse attendant', () => {
      spyOn(component, 'getPreviousVisitAnthropometry');
      route.snapshot.params.attendant = 'nurse';
      component.ngOnChanges();
      expect(component.attendant).toBe('nurse');
      expect(component.getPreviousVisitAnthropometry).toHaveBeenCalled();
    });

    it('does not fetch previous anthropometry for doctor', () => {
      spyOn(component, 'getPreviousVisitAnthropometry');
      component.ngOnChanges();
      expect(component.getPreviousVisitAnthropometry).not.toHaveBeenCalled();
    });
  });

  describe('getPreviousVisitAnthropometry', () => {
    it('rounds heights ending in .0', () => {
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: '160.0' } })
      );
      component.getPreviousVisitAnthropometry();
      expect(doctor.getPreviousVisitAnthropometry).toHaveBeenCalledWith({
        benRegID: '101',
      });
      expect(form.controls['height_cm'].value).toBe(160);
    });

    it('keeps fractional heights', () => {
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: 155.5 } })
      );
      component.getPreviousVisitAnthropometry();
      expect(form.controls['height_cm'].value).toBe(155.5);
    });

    ['Visit code is not found', 'No data found'].forEach(msg => {
      it(`ignores "${msg}"`, () => {
        doctor.getPreviousVisitAnthropometry.and.returnValue(
          of({ data: { response: msg } })
        );
        component.getPreviousVisitAnthropometry();
        expect(form.controls['height_cm'].value).toBeNull();
      });
    });

    it('ignores empty response', () => {
      doctor.getPreviousVisitAnthropometry.and.returnValue(of(null));
      component.getPreviousVisitAnthropometry();
      expect(form.controls['height_cm'].value).toBeNull();
    });
  });

  describe('checkNurseRequirements', () => {
    beforeEach(() => {
      form = buildForm(true);
      component.patientVitalsForm = form;
    });

    it('lists all NCD screening fields', () => {
      component.visitCategory = 'NCD screening';
      expect(component.checkNurseRequirements(form)).toBe(0);
      const d = lang.vitalsDetails;
      expect(confirmation.notify).toHaveBeenCalledWith(
        lang.alerts.info.mandatoryFields,
        [
          d.AnthropometryDataANC_OPD_NCD_PNC.height,
          d.AnthropometryDataANC_OPD_NCD_PNC.weight,
          d.vitalsCancerscreening_QC.waistCircumference,
          d.vitalsDataANC_OPD_NCD_PNC.temperature,
          d.vitalsDataANC_OPD_NCD_PNC.pulseRate,
          d.vitalsDataANC_OPD_NCD_PNC.systolicBP,
          d.vitalsDataANC_OPD_NCD_PNC.diastolicBP,
          lang.rbsTestResult,
        ]
      );
    });

    it('lists ANC fields including BP', () => {
      component.visitCategory = 'ANC';
      expect(component.checkNurseRequirements(form)).toBe(0);
      const args = confirmation.notify.calls.mostRecent().args[1];
      expect(args.length).toBe(6);
      expect(args[0]).toBe(
        lang.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.systolicBP
      );
    });

    it('lists general fields for other categories', () => {
      component.visitCategory = 'General OPD';
      expect(component.checkNurseRequirements(form)).toBe(0);
      expect(confirmation.notify.calls.mostRecent().args[1].length).toBe(4);
    });

    it('requires lung assessment when enabled for adults', () => {
      component.patientVitalsForm = buildForm();
      component.hideLungAssessment = true;
      component.enableLungAssessment = true;
      component.benAge = 20;
      nurse.isAssessmentDone = false;
      expect(component.checkNurseRequirements(null)).toBe(0);
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        'Please perform Lung Assessment',
      ]);
    });

    it('returns 1 when nothing missing', () => {
      component.patientVitalsForm = buildForm();
      component.visitCategory = 'NCD screening';
      expect(component.checkNurseRequirements(null)).toBe(1);
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('returns 1 when nothing missing for ANC', () => {
      component.patientVitalsForm = buildForm();
      component.visitCategory = 'ANC';
      expect(component.checkNurseRequirements(null)).toBe(1);
    });
  });

  describe('updateGeneralVitals', () => {
    it('does nothing when requirements fail', () => {
      spyOn(component, 'checkNurseRequirements').and.returnValue(0);
      component.updateGeneralVitals(form);
      expect(doctor.updateGeneralVitals).not.toHaveBeenCalled();
    });

    it('alerts success, fetches HRP for ANC and reports RBS', () => {
      component.visitCategory = 'ANC';
      spyOn(component, 'getHRPDetails');
      spyOn(component, 'setRBSResultInReport');
      doctor.updateGeneralVitals.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } })
      );
      form.markAsDirty();
      component.updateGeneralVitals(form);
      expect(doctor.updateGeneralVitals).toHaveBeenCalledWith(form, 'ANC');
      expect(component.getHRPDetails).toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        false
      );
      expect(component.setRBSResultInReport).toHaveBeenCalledWith(form);
      expect(form.pristine).toBeTrue();
    });

    it('does not fetch HRP for non-ANC', () => {
      spyOn(component, 'getHRPDetails');
      doctor.updateGeneralVitals.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } })
      );
      component.updateGeneralVitals(form);
      expect(component.getHRPDetails).not.toHaveBeenCalled();
    });

    it('alerts error message on non-200', () => {
      doctor.updateGeneralVitals.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' })
      );
      component.updateGeneralVitals(form);
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on http error', () => {
      doctor.updateGeneralVitals.and.returnValue(throwingObs('oops'));
      component.updateGeneralVitals(form);
      expect(confirmation.alert).toHaveBeenCalledWith('oops', 'error');
    });
  });

  describe('setRBSResultInReport', () => {
    it('sends raw value when rbs result is dirty', () => {
      form.patchValue({ rbsTestResult: 120 });
      form.controls['rbsTestResult'].markAsDirty();
      component.setRBSResultInReport(form);
      const arg =
        testInVitals.setVitalsRBSValueInReportsInUpdate.calls.mostRecent()
          .args[0];
      expect(arg.rbsTestResult).toBe(120);
      expect(arg.createdDate instanceof Date).toBeTrue();
    });

    it('sends when remarks dirty', () => {
      form.controls['rbsTestRemarks'].markAsDirty();
      component.setRBSResultInReport(form);
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate
      ).toHaveBeenCalled();
    });

    it('skips when rbs is disabled or pristine', () => {
      component.setRBSResultInReport(form);
      form.controls['rbsTestResult'].markAsDirty();
      form.controls['rbsTestResult'].disable();
      component.setRBSResultInReport(form);
      component.setRBSResultInReport({ value: null });
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate
      ).not.toHaveBeenCalled();
    });
  });

  describe('getGeneralVitalsData', () => {
    it('patches form and triggers dependent calculations', () => {
      component.male = true;
      doctor.getGenericVitals.and.returnValue(
        of({
          data: {
            benAnthropometryDetail: {
              height_cm: 170,
              weight_Kg: 70,
              waistCircumference_cm: 95,
              hipCircumference_cm: 100,
              waistHipRatio: 0.95,
            },
            benPhysicalVitalDetail: {
              systolicBP_1stReading: 120,
              diastolicBP_1stReading: 80,
              rbsTestResult: 110,
            },
          },
          benPhysicalVitalDetail: { rbsTestResult: 110 },
        })
      );
      spyOn(component, 'checkHip').and.callThrough();
      spyOn(component, 'hipWaistRatio').and.callThrough();
      component.getGeneralVitalsData();
      expect(doctor.getGenericVitals).toHaveBeenCalledWith({
        benRegID: '101',
        benVisitID: '7',
      });
      expect(idrs.setSystolicBp).toHaveBeenCalledWith(120);
      expect(idrs.setDiastolicBp).toHaveBeenCalledWith(80);
      expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(10);
      expect(nurse.rbsTestResultFromDoctorFetch).toBe(110);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
      expect(component.checkHip).toHaveBeenCalledWith(100);
      expect(component.hipWaistRatio).toHaveBeenCalled();
      expect(form.controls['bMI'].value).toBe(24.2);
      expect(testInVitals.setVitalsRBSValueInReports).toHaveBeenCalledWith({
        rbsTestResult: 110,
      });
    });

    it('handles null readings without side effects', () => {
      component.visitCategory = 'ANC';
      doctor.getGenericVitals.and.returnValue(
        of({
          data: {
            benAnthropometryDetail: { waistCircumference_cm: null },
            benPhysicalVitalDetail: {
              systolicBP_1stReading: null,
              diastolicBP_1stReading: null,
              rbsTestResult: null,
            },
          },
        })
      );
      component.getGeneralVitalsData();
      expect(idrs.setSystolicBp).not.toHaveBeenCalled();
      expect(idrs.setDiastolicBp).not.toHaveBeenCalled();
      expect(idrs.setIDRSScoreWaist).not.toHaveBeenCalled();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(testInVitals.setVitalsRBSValueInReports).not.toHaveBeenCalled();
    });

    it('ignores empty response', () => {
      doctor.getGenericVitals.and.returnValue(of(null));
      component.getGeneralVitalsData();
      expect(form.controls['bMI'].value).toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes and resets nurse flags', () => {
      const subs = ['a', 'b', 'c', 'd'].map(() =>
        jasmine.createSpyObj('sub', ['unsubscribe'])
      );
      component.beneficiaryDetailSubscription = subs[0];
      component.generalVitalsDataSubscription = subs[1];
      component.rbsSelectedInInvestigationSubscription = subs[2];
      component.previousAnthropometryDataSubscription = subs[3];
      nurse.rbsTestResultFromDoctorFetch = 5;
      nurse.isAssessmentDone = true;
      component.ngOnDestroy();
      subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(nurse.isAssessmentDone).toBeFalse();
    });

    it('tolerates missing subscriptions', () => {
      component.beneficiaryDetailSubscription = null;
      component.rbsSelectedInInvestigationSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('RBS enable/disable', () => {
    it('checkDiasableRBS reflects investigation and doctor fetch', () => {
      component.rbsSelectedInInvestigation = false;
      nurse.rbsTestResultFromDoctorFetch = null;
      expect(component.checkDiasableRBS()).toBeFalse();
      nurse.rbsTestResultFromDoctorFetch = undefined;
      expect(component.checkDiasableRBS()).toBeFalse();
      nurse.rbsTestResultFromDoctorFetch = 100;
      expect(component.checkDiasableRBS()).toBeTrue();
      nurse.rbsTestResultFromDoctorFetch = null;
      component.rbsSelectedInInvestigation = true;
      expect(component.checkDiasableRBS()).toBeTrue();
    });

    it('rbsResultChange disables controls when rbs selected', () => {
      form.patchValue({ rbsTestResult: 150 });
      component.rbsSelectedInInvestigation = true;
      expect(component.rbsResultChange()).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(150);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
      expect(form.controls['rbsTestRemarks'].disabled).toBeTrue();
      expect(form.controls['rbsCheckBox'].disabled).toBeTrue();
    });

    it('rbsResultChange enables controls otherwise', () => {
      form.controls['rbsTestResult'].disable();
      nurse.rbsTestResultFromDoctorFetch = undefined;
      expect(component.rbsResultChange()).toBeFalse();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(null);
      expect(form.controls['rbsTestResult'].enabled).toBeTrue();
    });

    it('onRbsCheckBox toggles flag', () => {
      component.onRbsCheckBox({ checked: false });
      expect(component.rbsCheckBox).toBeFalse();
      component.onRbsCheckBox({ checked: true });
      expect(component.rbsCheckBox).toBeTrue();
    });

    it('checkForRange alerts outside range unless popup open', () => {
      form.patchValue({ rbsTestResult: -1 });
      component.checkForRange();
      form.patchValue({ rbsTestResult: 1001 });
      component.checkForRange();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      component.rbsPopup = true;
      component.checkForRange();
      form.patchValue({ rbsTestResult: 200 });
      component.rbsPopup = false;
      component.checkForRange();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateBMI', () => {
    it('computes adult BMI and flags normal', () => {
      form.patchValue({ height_cm: 170, weight_Kg: 65 });
      component.calculateBMI();
      expect(component.BMI).toBe(22.5);
      expect(form.controls['bMI'].value).toBe(22.5);
      expect(component.normalBMI).toBeTrue();
      expect(nurse.calculateBmiStatus).not.toHaveBeenCalled();
    });

    it('clears BMI when height or weight missing', () => {
      form.patchValue({ height_cm: 170, bMI: 20 });
      component.BMI = undefined;
      component.calculateBMI();
      expect(form.controls['bMI'].value).toBeNull();
      expect(component.normalBMI).toBeFalse();
    });

    it('uses bmi status service for minors', () => {
      component.benGenderAndAge = {
        age: '10 years - 2 months',
        genderName: 'Male',
      };
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: 'Normal' } })
      );
      form.patchValue({ height_cm: 140, weight_Kg: 20 });
      component.calculateBMI();
      expect(component.totalMonths).toBe(122);
      expect(nurse.calculateBmiStatus).toHaveBeenCalledWith({
        yearMonth: '10 years - 2 months',
        gender: 'Male',
        bmi: 10.2,
      });
      expect(component.bmiStatusMinor).toBe('normal');
      expect(component.normalBMI).toBeTrue();
    });

    it('flags abnormal minor bmi status', () => {
      component.benGenderAndAge = {
        age: '10 years - 2 months',
        genderName: 'Female',
      };
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: 'Underweight' } })
      );
      component.calculateBMI();
      expect(component.normalBMI).toBeFalse();
    });

    it('ignores missing bmi status', () => {
      component.benGenderAndAge = {
        age: '10 years - 2 months',
        genderName: 'Male',
      };
      component.normalBMI = true;
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: null } })
      );
      component.calculateBMI();
      expect(component.normalBMI).toBeTrue();
    });

    it('alerts on non-200 and on error', () => {
      component.benGenderAndAge = {
        age: '10 years - 2 months',
        genderName: 'Male',
      };
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 500, errorMessage: 'fail' })
      );
      component.calculateBMI();
      expect(confirmation.alert).toHaveBeenCalledWith('fail', 'error');
      nurse.calculateBmiStatus.and.returnValue(throwingObs('err'));
      component.calculateBMI();
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
    });
  });

  describe('range checks', () => {
    const recheck = () => lang.alerts.info.recheckValue;

    const cases: Array<[string, string, any, any]> = [
      ['checkHeight', 'height_cm', 5, 150],
      ['checkWeight', 'weight_Kg', 200, 60],
      ['checkHeadCircumference', 'headCircumference_cm', 20, 40],
      [
        'checkMidUpperArmCircumference',
        'midUpperArmCircumference_MUAC_cm',
        5,
        20,
      ],
      ['checkTemperature', 'temperature', 120, 98],
      ['checkPulseRate', 'pulseRate', 40, 80],
      ['checkSpo2', 'sPO2', 101, 98],
      ['checkRespiratoryRate', 'respiratoryRate', 5, 20],
    ];
    cases.forEach(([method, ctrl, bad, good]) => {
      it(`${method} alerts only for out-of-range values`, () => {
        form.patchValue({ [ctrl]: good });
        (component as any)[method](good);
        expect(confirmation.alert).not.toHaveBeenCalled();
        form.patchValue({ [ctrl]: bad });
        (component as any)[method](bad);
        expect(confirmation.alert).toHaveBeenCalledWith(recheck());
      });
    });

    [
      'checkBloodSugarFasting',
      'checkBloodSugarRandom',
      'checkBloodSugar2HrPostPrandial',
    ].forEach(method => {
      it(`${method} alerts only for out-of-range values`, () => {
        (component as any)[method](100);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[method](40);
        (component as any)[method](800);
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
      });
    });

    it('checkSystolic alerts and updates idrs', () => {
      component.checkSystolic(120);
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(idrs.setSystolicBp).toHaveBeenCalledWith(120);
      component.checkSystolic(30);
      expect(confirmation.alert).toHaveBeenCalledWith(recheck());
      component.checkSystolic(null);
      expect(idrs.setSystolicBp).toHaveBeenCalledWith(0);
    });

    it('checkDiastolic alerts and updates idrs', () => {
      component.checkDiastolic(80);
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(idrs.setDiastolicBp).toHaveBeenCalledWith(80);
      component.checkDiastolic(200);
      expect(confirmation.alert).toHaveBeenCalledWith(recheck());
      component.checkDiastolic(null);
      expect(idrs.setDiastolicBp).toHaveBeenCalledWith(0);
    });

    it('checkSystolicGreater clears systolic when not greater', () => {
      form.patchValue({ systolicBP_1stReading: 80 });
      component.checkSystolicGreater(120, 80);
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkSystolicGreater('80', '90');
      expect(confirmation.alert).toHaveBeenCalledWith(lang.alerts.info.sysBp);
      expect(form.controls['systolicBP_1stReading'].value).toBeNull();
    });

    it('checkDiastolicLower clears diastolic when not lower', () => {
      form.patchValue({ diastolicBP_1stReading: 130 });
      component.checkDiastolicLower(120, 80);
      component.checkDiastolicLower(null, 80);
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkDiastolicLower('120', '130');
      expect(confirmation.alert).toHaveBeenCalledWith(lang.alerts.info.diaBp);
      expect(form.controls['diastolicBP_1stReading'].value).toBeNull();
    });
  });

  describe('waist / hip', () => {
    it('hipWaistRatio computes ratio with gender thresholds', () => {
      form.patchValue({ waistCircumference_cm: 80, hipCircumference_cm: 100 });
      component.female = true;
      component.hipWaistRatio();
      expect(component.waistHipRatio).toBe('0.80');
      expect(component.normalWaistHipRatio).toBeTrue();
      component.female = false;
      form.patchValue({ waistCircumference_cm: 95 });
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeFalse();
    });

    it('hipWaistRatio clears ratio when data missing', () => {
      form.patchValue({ waistHipRatio: 1 });
      component.hipWaistRatio();
      expect(component.waistHipRatio).toBeNull();
    });

    it('checkHip uses gender ranges', () => {
      form.patchValue({ hipCircumference_cm: 100 });
      component.female = true;
      component.checkHip(100);
      expect(component.normalHip).toBeTrue();
      form.patchValue({ hipCircumference_cm: 110 });
      component.checkHip(110);
      expect(component.normalHip).toBeFalse();
      component.female = false;
      form.patchValue({ hipCircumference_cm: 100 });
      component.checkHip(100);
      expect(component.normalHip).toBeTrue();
      form.patchValue({ hipCircumference_cm: 90 });
      component.checkHip(90);
      expect(component.normalHip).toBeFalse();
    });

    const waistCases: Array<[string, number, number]> = [
      ['male', 85, 0],
      ['male', 95, 10],
      ['male', 105, 20],
      ['female', 75, 0],
      ['female', 85, 10],
      ['female', 95, 20],
    ];
    waistCases.forEach(([g, waist, score]) => {
      it(`checkIDRSForWaist ${g} ${waist} -> ${score}`, () => {
        component.male = g === 'male';
        component.female = g === 'female';
        component.checkIDRSForWaist(waist);
        expect(component.IDRSWaistScore).toBe(score);
        expect(session.setItem).toHaveBeenCalledWith('waistIDRSScore', score);
        expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(score);
        expect(idrs.setIDRSScoreFlag).toHaveBeenCalled();
      });

      it(`patchIDRSForWaist ${g} ${waist} -> ${score}`, () => {
        component.male = g === 'male';
        component.female = g === 'female';
        component.patchIDRSForWaist(waist);
        expect(component.IDRSWaistScore).toBe(score);
        expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(score);
        expect(idrs.setIDRSScoreFlag).not.toHaveBeenCalled();
      });
    });

    it('waist score untouched when gender unknown', () => {
      component.male = false;
      component.female = false;
      component.checkIDRSForWaist(100);
      component.patchIDRSForWaist(100);
      expect(component.IDRSWaistScore).toBeUndefined();
    });
  });

  describe('getters', () => {
    it('expose form values', () => {
      form.patchValue({
        systolicBP_1stReading: 1,
        diastolicBP_1stReading: 2,
        bMI: 3,
        bloodGlucose_Fasting: 4,
        bloodGlucose_Random: 5,
        bloodGlucose_2hr_PP: 6,
        rbsTestResult: 7,
      });
      expect(component.systolicBP_1stReading).toBe(1);
      expect(component.diastolicBP_1stReading).toBe(2);
      expect(component.bMI).toBe(3);
      expect(component.bloodGlucose_Fasting).toBe(4);
      expect(component.bloodGlucose_Random).toBe(5);
      expect(component.bloodGlucose_2hr_PP).toBe(6);
      expect(component.rbsTestResult).toBe(7);
    });
  });

  describe('IoT dialogs', () => {
    function lastDialogConfig() {
      return dialog.open.calls.mostRecent();
    }

    it('weight dialog patches weight and recalculates BMI', () => {
      spyOn(component, 'calculateBMI');
      dialogReturns({ result: 70 });
      component.openIOTWeightModel();
      expect(lastDialogConfig().args[0]).toBe(IotcomponentComponent);
      expect(lastDialogConfig().args[1].data.startAPI).toBe(
        environment.startWeighturl
      );
      expect(form.controls['weight_Kg'].value).toBe(70);
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        true
      );
      expect(component.calculateBMI).toHaveBeenCalled();
    });

    it('rbs dialog patches result and notifies nurse service', () => {
      dialogReturns({ result: 130 });
      component.openIOTRBSModel();
      expect(component.rbsPopup).toBeFalse();
      expect(form.controls['rbsTestResult'].value).toBe(130);
      expect(form.controls['rbsTestResult'].dirty).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(130);
    });

    it('rbs dialog with empty result skips nurse service', () => {
      dialogReturns({ result: null });
      component.openIOTRBSModel();
      expect(nurse.setRbsInCurrentVitals).not.toHaveBeenCalled();
    });

    it('rbs dialog closed with null does nothing', () => {
      dialogReturns(null);
      component.openIOTRBSModel();
      expect(component.rbsPopup).toBeFalse();
      expect(
        doctor.setValueToEnableVitalsUpdateButton
      ).not.toHaveBeenCalledWith(true);
    });

    it('spo2 dialog patches sPO2, null ignored', () => {
      dialogReturns({ spo2: 97 });
      component.openIOTSPO2Model();
      expect(form.controls['sPO2'].value).toBe(97);
      dialogReturns(null);
      component.openIOTSPO2Model();
      expect(form.controls['sPO2'].value).toBe(97);
    });

    it('temperature dialog patches temperature', () => {
      dialogReturns({ temperature: 98.6 });
      component.openIOTTempModel();
      expect(form.controls['temperature'].value).toBe(98.6);
    });

    it('pulse dialog patches pulse rate', () => {
      dialogReturns({ pulseRate: 72 });
      component.openIOTPulseRateModel();
      expect(form.controls['pulseRate'].value).toBe(72);
    });

    it('bp dialog patches both readings', () => {
      dialogReturns({ sys: 120, dia: 80 });
      component.openIOTBPModel();
      expect(form.controls['systolicBP_1stReading'].value).toBe(120);
      expect(form.controls['diastolicBP_1stReading'].value).toBe(80);
    });

    it('blood glucose dialogs patch their controls', () => {
      dialogReturns({ result: 90 });
      component.openIOTBGFastingModel();
      component.openIOTBGRandomModel();
      component.openIOTBGPostPrandialModel();
      expect(form.controls['bloodGlucose_Fasting'].value).toBe(90);
      expect(form.controls['bloodGlucose_Random'].value).toBe(90);
      expect(form.controls['bloodGlucose_2hr_PP'].value).toBe(90);
      expect(lastDialogConfig().args[1].data.startAPI).toBe(
        environment.startBloodGlucoseurl
      );
    });
  });

  describe('getHRPDetails', () => {
    it('sets HRP positive', () => {
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } })
      );
      component.getHRPDetails();
      expect(doctor.getHRPDetails).toHaveBeenCalledWith('101', 'VC1');
      expect(benService.setHRPPositive).toHaveBeenCalled();
    });

    it('resets HRP when negative', () => {
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } })
      );
      component.getHRPDetails();
      expect(benService.resetHRPPositive).toHaveBeenCalled();
    });

    it('ignores empty response', () => {
      doctor.getHRPDetails.and.returnValue(of(null));
      component.getHRPDetails();
      expect(benService.setHRPPositive).not.toHaveBeenCalled();
      expect(benService.resetHRPPositive).not.toHaveBeenCalled();
    });
  });

  describe('language', () => {
    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(lang);
    });
  });

  describe('audio recording', () => {
    it('start/stop/abort only act on correct state', () => {
      component.stopRecording();
      component.abortRecording();
      expect(audio.stopRecording).not.toHaveBeenCalled();
      expect(audio.abortRecording).not.toHaveBeenCalled();

      component.startRecording();
      component.startRecording();
      expect(audio.startRecording).toHaveBeenCalledTimes(1);
      expect(component.isRecording).toBeTrue();
      component.abortRecording();
      expect(audio.abortRecording).toHaveBeenCalled();
      expect(component.isRecording).toBeFalse();

      component.startRecording();
      component.stopRecording();
      expect(audio.stopRecording).toHaveBeenCalled();
      expect(component.isRecording).toBeFalse();
    });

    it('clearRecordedData resets state on confirm', () => {
      component.blobUrl = 'x';
      component.frequentCough = true;
      component.enableResult = true;
      nurse.isAssessmentDone = true;
      component.clearRecordedData();
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        'Do you really want to clear the recording?'
      );
      expect(component.blobUrl).toBeNull();
      expect(component.frequentCough).toBeFalse();
      expect(component.enableResult).toBeFalse();
      expect(nurse.isAssessmentDone).toBeFalse();
      expect(component.coughBlobFile.size).toBe(0);
    });

    it('clearRecordedData keeps state on cancel', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.blobUrl = 'x';
      component.clearRecordedData();
      expect(component.blobUrl).toBe('x');
    });

    it('onCheckboxChange does not mutate component symptom flags', () => {
      component.onCheckboxChange(component.sputum, { checked: true });
      expect(component.sputum).toBeFalse();
    });
  });

  describe('startAssessment', () => {
    beforeEach(() => {
      session.store.set('providerServiceID', '5');
      session.store.set('userName', 'nurse1');
      component.benGenderType = 1;
      component.benAge = 30;
      component.frequentCough = true;
      component.wheezing = true;
    });

    it('posts form data and stores result', () => {
      audio.getResultStatus.and.returnValue(
        of({
          statusCode: 200,
          data: {
            severity: 'mild',
            cough_pattern: 'dry',
            cough_severity_score: 2,
            record_duration: 10,
          },
        })
      );
      component.startAssessment();
      const fd: FormData = audio.getResultStatus.calls.mostRecent().args[0];
      const req = JSON.parse(fd.get('request') as string);
      expect(req.gender).toBe(1);
      expect(req.age).toBe(30);
      expect(req.patientId).toBe('101');
      expect(req.providerServiceMapID).toBe('5');
      expect(req.createdBy).toBe('nurse1');
      expect(req.symptoms).toEqual({
        frequent_cough: 1,
        sputum: 0,
        cough_at_night: 0,
        wheezing: 1,
        pain_in_chest: 0,
        shortness_of_breath: 0,
      });
      expect((fd.get('file') as File).name).toBe('coughSound.wav');
      expect(component.severity).toBe('mild');
      expect(component.cough_pattern).toBe('dry');
      expect(component.cough_severity_score).toBe(2);
      expect(component.record_duration).toBe(10);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(component.enableResult).toBeTrue();
      expect(nurse.isAssessmentDone).toBeTrue();
    });

    it('alerts on non-200 and http error', () => {
      audio.getResultStatus.and.returnValue(
        of({ statusCode: 500, errorMessage: 'no' })
      );
      component.startAssessment();
      expect(confirmation.alert).toHaveBeenCalledWith('no', 'error');
      audio.getResultStatus.and.returnValue(throwingObs('x'));
      component.startAssessment();
      expect(confirmation.alert).toHaveBeenCalledWith('x', 'error');
      expect(component.enableResult).toBeFalse();
    });
  });

  describe('assessment lookup', () => {
    it('getAssessmentID fetches details of the latest assessment', () => {
      spyOn(component, 'getAssessmentDetails');
      doctor.getAssessment.and.returnValue(
        of({
          statusCode: 200,
          data: [{ assessmentId: 1 }, { assessmentId: 9 }],
        })
      );
      component.getAssessmentID();
      expect(doctor.getAssessment).toHaveBeenCalledWith('101');
      expect(component.getAssessmentDetails).toHaveBeenCalledWith(9);
    });

    it('getAssessmentID skips when no id or no data', () => {
      spyOn(component, 'getAssessmentDetails');
      doctor.getAssessment.and.returnValue(
        of({ statusCode: 200, data: [{ assessmentId: null }] })
      );
      component.getAssessmentID();
      doctor.getAssessment.and.returnValue(of({ statusCode: 200, data: [] }));
      component.getAssessmentID();
      expect(component.getAssessmentDetails).not.toHaveBeenCalled();
    });

    it('getAssessmentDetails stores result', () => {
      doctor.getAssessmentDet.and.returnValue(
        of({
          statusCode: 200,
          data: {
            severity: 'high',
            cough_pattern: 'wet',
            cough_severity_score: 8,
            record_duration: 12,
          },
        })
      );
      component.getAssessmentDetails(9);
      expect(doctor.getAssessmentDet).toHaveBeenCalledWith(9);
      expect(component.severity).toBe('high');
      expect(component.record_duration).toBe(12);
      expect(component.enableResult).toBeTrue();
      expect(nurse.isAssessmentDone).toBeTrue();
    });

    it('getAssessmentDetails ignores failure', () => {
      doctor.getAssessmentDet.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      component.getAssessmentDetails(9);
      expect(component.enableResult).toBeFalse();
    });
  });

  it('trackFieldInteraction forwards to tracking service', () => {
    component.trackFieldInteraction('Height');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Height',
      'Vitals'
    );
  });
});
