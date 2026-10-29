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
import { BehaviorSubject, of } from 'rxjs';

import { CancerPatientVitalsComponent } from './cancer-patient-vitals.component';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { NurseService } from '../../shared/services/nurse.service';
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
  'systolicBP_1stReading',
  'diastolicBP_1stReading',
  'systolicBP_2ndReading',
  'diastolicBP_2ndReading',
  'systolicBP_3rdReading',
  'diastolicBP_3rdReading',
  'hbA1C',
  'hemoglobin',
  'bloodGlucose_Fasting',
  'bloodGlucose_Random',
  'bloodGlucose_2HrPostPrandial',
  'sPO2',
  'rbsTestResult',
  'rbsTestRemarks',
  'temperature',
  'pulseRate',
];

function buildForm(required = false): FormGroup {
  const group: Record<string, FormControl> = {};
  CONTROLS.forEach(
    c => (group[c] = new FormControl(null, required ? Validators.required : []))
  );
  return new FormGroup(group);
}

describe('CancerPatientVitalsComponent', () => {
  let component: CancerPatientVitalsComponent;
  let fixture: ComponentFixture<CancerPatientVitalsComponent>;
  let form: FormGroup;
  let doctor: any;
  let nurse: any;
  let benService: any;
  let confirmation: any;
  let dialog: any;
  let tracking: any;
  let route: any;
  const lang = LANGUAGE_EN;
  const recheck = lang.alerts.info.recheckValue;

  function dialogReturns(result: any) {
    dialog.open.and.returnValue({ afterClosed: () => of(result) });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerPatientVitalsComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: '101', visitID: '7' },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            rbsSelectedInInvestigation$: new BehaviorSubject<any>(undefined),
            rbsTestResultFromDoctorFetch: null,
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: new BehaviorSubject<any>(null),
          }),
        },
        { provide: SetLanguageComponent, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { attendant: 'doctor' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CancerPatientVitalsComponent, '')
      .compileComponents();

    doctor = TestBed.inject(DoctorService);
    nurse = TestBed.inject(NurseService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
    route = TestBed.inject(ActivatedRoute);
    TestBed.inject(SessionStorageService);

    fixture = TestBed.createComponent(CancerPatientVitalsComponent);
    component = fixture.componentInstance;
    form = buildForm();
    component.patientVitalsForm = form;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('initialises language, update button and rbs subscription', () => {
      expect(component.currentLanguageSet).toEqual(lang);
      expect(component.rbsPopup).toBeFalse();
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        false
      );
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      nurse.rbsSelectedInInvestigation$.next(true);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      nurse.rbsSelectedInInvestigation$.next(undefined);
      expect(component.rbsSelectedInInvestigation).toBeFalse();
    });

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(lang);
    });
  });

  describe('getBeneficiaryDetails', () => {
    it('sets female, age and months', () => {
      benService.beneficiaryDetails$.next({
        ageVal: 30,
        age: '30 years - 4 months',
        genderName: 'Female',
      });
      expect(component.benAge).toBe(30);
      expect(component.totalMonths).toBe(364);
      expect(component.female).toBeTrue();
      expect(component.male).toBeFalse();
    });

    it('sets male flag', () => {
      benService.beneficiaryDetails$.next({
        ageVal: 40,
        age: '40 years - 0 months',
        genderName: 'Male',
      });
      expect(component.male).toBeTrue();
    });

    it('ignores beneficiary without age and gender', () => {
      benService.beneficiaryDetails$.next({ ageVal: 0, genderName: null });
      expect(component.benAge).toBe(0);
      expect(component.female).toBeFalse();
      expect(component.male).toBeFalse();
    });
  });

  describe('ngOnChanges', () => {
    it('resets doctor fetch and loads vitals in view mode', () => {
      spyOn(component, 'getCancerVitals');
      nurse.rbsTestResultFromDoctorFetch = 5;
      component.mode = 'view';
      component.ngOnChanges({});
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(component.getCancerVitals).toHaveBeenCalledWith('101', '7');
    });

    it('updates vitals in update mode', () => {
      spyOn(component, 'updateCancerVitals');
      component.mode = 'update';
      component.ngOnChanges({});
      expect(component.updateCancerVitals).toHaveBeenCalled();
    });

    it('fetches previous anthropometry for nurse only', () => {
      spyOn(component, 'getPreviousVisitAnthropometry');
      component.ngOnChanges({});
      expect(component.getPreviousVisitAnthropometry).not.toHaveBeenCalled();
      route.snapshot.params.attendant = 'nurse';
      component.ngOnChanges({});
      expect(component.attendant).toBe('nurse');
      expect(component.getPreviousVisitAnthropometry).toHaveBeenCalled();
    });
  });

  describe('getPreviousVisitAnthropometry', () => {
    it('rounds heights ending with .0', () => {
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: '150.0' } })
      );
      component.getPreviousVisitAnthropometry();
      expect(doctor.getPreviousVisitAnthropometry).toHaveBeenCalledWith({
        benRegID: '101',
      });
      expect(form.controls['height_cm'].value).toBe(150);
    });

    it('keeps fractional heights', () => {
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: 150.5 } })
      );
      component.getPreviousVisitAnthropometry();
      expect(form.controls['height_cm'].value).toBe(150.5);
    });

    ['Visit code is not found', 'No data found', null].forEach(resp => {
      it(`ignores response ${resp}`, () => {
        doctor.getPreviousVisitAnthropometry.and.returnValue(
          of({ data: { response: resp } })
        );
        component.getPreviousVisitAnthropometry();
        expect(form.controls['height_cm'].value).toBeNull();
      });
    });
  });

  describe('RBS', () => {
    it('checkDiasableRBS', () => {
      expect(component.checkDiasableRBS()).toBeFalse();
      nurse.rbsTestResultFromDoctorFetch = undefined;
      expect(component.checkDiasableRBS()).toBeFalse();
      nurse.rbsTestResultFromDoctorFetch = 90;
      expect(component.checkDiasableRBS()).toBeTrue();
      nurse.rbsTestResultFromDoctorFetch = null;
      component.rbsSelectedInInvestigation = true;
      expect(component.checkDiasableRBS()).toBeTrue();
    });

    it('rbsResultChange disables when fetched from doctor', () => {
      form.patchValue({ rbsTestResult: 99 });
      nurse.rbsTestResultFromDoctorFetch = 99;
      expect(component.rbsResultChange()).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(99);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
      expect(form.controls['rbsTestRemarks'].disabled).toBeTrue();
    });

    it('rbsResultChange enables otherwise', () => {
      form.controls['rbsTestRemarks'].disable();
      nurse.rbsTestResultFromDoctorFetch = undefined;
      expect(component.rbsResultChange()).toBeFalse();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(null);
      expect(form.controls['rbsTestRemarks'].enabled).toBeTrue();
    });

    it('checkForRange', () => {
      form.patchValue({ rbsTestResult: -5 });
      component.checkForRange();
      form.patchValue({ rbsTestResult: 2000 });
      component.checkForRange();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      component.rbsPopup = true;
      component.checkForRange();
      form.patchValue({ rbsTestResult: 100 });
      component.rbsPopup = false;
      component.checkForRange();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('vitalsRequiredCheck', () => {
    it('notifies height and weight when missing', () => {
      const req = buildForm(true);
      expect(component.vitalsRequiredCheck(req)).toBeFalse();
      expect(confirmation.notify).toHaveBeenCalledWith(
        lang.alerts.info.mandatoryFields,
        [
          lang.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC.height,
          lang.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC.weight,
        ]
      );
    });

    it('passes when valid', () => {
      expect(component.vitalsRequiredCheck(form)).toBeTrue();
      expect(confirmation.notify).not.toHaveBeenCalled();
    });
  });

  describe('updateCancerVitals', () => {
    it('skips when required check fails', () => {
      component.patientVitalsForm = buildForm(true);
      component.updateCancerVitals();
      expect(doctor.updateCancerVitalsDetails).not.toHaveBeenCalled();
    });

    it('alerts success and marks pristine', () => {
      form.patchValue({ height_cm: 160 });
      form.markAsDirty();
      doctor.updateCancerVitalsDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } })
      );
      component.updateCancerVitals();
      expect(doctor.updateCancerVitalsDetails).toHaveBeenCalledWith(
        form.value,
        form.getRawValue()
      );
      expect(confirmation.alert).toHaveBeenCalledWith('Updated', 'success');
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        false
      );
      expect(form.pristine).toBeTrue();
    });

    it('alerts error on non-200 and on http error', () => {
      doctor.updateCancerVitalsDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.updateCancerVitals();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      doctor.updateCancerVitalsDetails.and.returnValue(throwingObs('boom'));
      component.updateCancerVitals();
      expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes and resets doctor fetch', () => {
      const ben = jasmine.createSpyObj('s', ['unsubscribe']);
      const rbs = jasmine.createSpyObj('s', ['unsubscribe']);
      const prev = jasmine.createSpyObj('s', ['unsubscribe']);
      const cancer = jasmine.createSpyObj('s', ['unsubscribe']);
      component.beneficiaryDetailSubscription = ben;
      component.rbsSelectedInInvestigationSubscription = rbs;
      component.previousAnthropometryDataSubscription = prev;
      component.cancerVitalsSubscription = cancer;
      nurse.rbsTestResultFromDoctorFetch = 3;
      component.ngOnDestroy();
      // Current behaviour: the cancer vitals branch unsubscribes the
      // beneficiary subscription a second time instead of its own.
      expect(ben.unsubscribe).toHaveBeenCalledTimes(2);
      expect(cancer.unsubscribe).not.toHaveBeenCalled();
      expect(rbs.unsubscribe).toHaveBeenCalled();
      expect(prev.unsubscribe).toHaveBeenCalled();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    });

    it('tolerates missing subscriptions', () => {
      component.beneficiaryDetailSubscription = null;
      component.rbsSelectedInInvestigationSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('getCancerVitals', () => {
    it('patches form and evaluates derived flags', () => {
      spyOn(component, 'canShowBP3').and.callThrough();
      doctor.getCancerVitalsDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benVitalDetails: {
              height_cm: 160,
              weight_Kg: 60,
              waistCircumference_cm: 95,
              hbA1C: 6.5,
              bloodGlucose_Random: 200,
              bloodGlucose_2HrPostPrandial: 200,
              bloodGlucose_Fasting: 130,
              rbsTestResult: 180,
            },
          },
        })
      );
      component.getCancerVitals('101', '7');
      expect(doctor.getCancerVitalsDetails).toHaveBeenCalledWith('101', '7');
      expect(form.controls['height_cm'].value).toBe(160);
      expect(component.normalWaist).toBeFalse();
      expect(component.normalHbA1C).toBeFalse();
      expect(component.diabeticRangeRandom).toBeTrue();
      expect(component.diabeticRangePostPrandial).toBeTrue();
      expect(component.diabeticRangeFasting).toBeTrue();
      expect(component.BMI).toBe(23.4);
      expect(component.canShowBP3).toHaveBeenCalled();
      expect(nurse.rbsTestResultFromDoctorFetch).toBe(180);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
    });

    it('does not mark rbs fetched when result null', () => {
      doctor.getCancerVitalsDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { benVitalDetails: { rbsTestResult: null } },
        })
      );
      component.getCancerVitals('101', '7');
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(form.controls['rbsTestResult'].enabled).toBeTrue();
    });

    it('ignores missing details, failure and null response', () => {
      spyOn(component, 'calculateBMI');
      doctor.getCancerVitalsDetails.and.returnValue(
        of({ statusCode: 200, data: { benVitalDetails: null } })
      );
      component.getCancerVitals('1', '2');
      doctor.getCancerVitalsDetails.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      component.getCancerVitals('1', '2');
      doctor.getCancerVitalsDetails.and.returnValue(of(null));
      component.getCancerVitals('1', '2');
      expect(component.calculateBMI).not.toHaveBeenCalled();
    });
  });

  describe('BMI', () => {
    it('computes normal adult BMI', () => {
      form.patchValue({ height_cm: 170, weight_Kg: 65 });
      component.calculateBMI(170, 65);
      expect(component.BMI).toBe(22.5);
      expect(component.normalBMI).toBeTrue();
      expect(nurse.calculateBmiStatus).not.toHaveBeenCalled();
    });

    it('sets BMI null and abnormal when data missing', () => {
      spyOn(component, 'calculateBMIStatusBasedOnAge');
      component.calculateBMI(null, null);
      expect(component.BMI).toBeNull();
      expect(component.normalBMI).toBeFalse();
      expect(component.calculateBMIStatusBasedOnAge).not.toHaveBeenCalled();
    });

    it('uses bmi status service for minors', () => {
      component.benGenderAndAge = {
        age: '12 years - 0 months',
        genderName: 'Female',
      };
      component.BMI = 18;
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: 'NORMAL' } })
      );
      component.calculateBMIStatusBasedOnAge();
      expect(component.totalMonths).toBe(144);
      expect(nurse.calculateBmiStatus).toHaveBeenCalledWith({
        yearMonth: '12 years - 0 months',
        gender: 'Female',
        bmi: 18,
      });
      expect(component.bmiStatusMinor).toBe('normal');
      expect(component.normalBMI).toBeTrue();
    });

    it('minor abnormal / missing status / errors', () => {
      component.benGenderAndAge = {
        age: '12 years - 0 months',
        genderName: 'Male',
      };
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: 'Obese' } })
      );
      component.calculateBMIStatusBasedOnAge();
      expect(component.normalBMI).toBeFalse();

      component.normalBMI = true;
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.calculateBMIStatusBasedOnAge();
      expect(component.normalBMI).toBeTrue();

      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 500, errorMessage: 'e1' })
      );
      component.calculateBMIStatusBasedOnAge();
      expect(confirmation.alert).toHaveBeenCalledWith('e1', 'error');

      nurse.calculateBmiStatus.and.returnValue(throwingObs('e2'));
      component.calculateBMIStatusBasedOnAge();
      expect(confirmation.alert).toHaveBeenCalledWith('e2', 'error');
    });

    it('falls back to adult range for adults', () => {
      component.benGenderAndAge = {
        age: '30 years - 0 months',
        genderName: 'Male',
      };
      component.BMI = 30;
      component.calculateBMIStatusBasedOnAge();
      expect(component.normalBMI).toBeFalse();
      component.BMI = 20;
      component.calculateBMIStatusBasedOnAge();
      expect(component.normalBMI).toBeTrue();
    });

    it('checkHeight / checkWeight recalc BMI and alert out of range', () => {
      spyOn(component, 'calculateBMI');
      component.checkHeight(150);
      component.checkWeight(60);
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkHeight(5);
      component.checkWeight(200);
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(component.calculateBMI).toHaveBeenCalledTimes(4);
    });
  });

  describe('waist', () => {
    it('checkWaist alerts out of range', () => {
      component.checkWaist(100);
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkWaist(40);
      component.checkWaist(160);
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    });

    it('checkNormalWaist for non-pregnant female', () => {
      component.female = true;
      component.pregnancyStatus = 'No';
      component.checkNormalWaist(75);
      expect(component.normalWaist).toBeTrue();
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeFalse();
    });

    it('checkNormalWaist leaves pregnant female unchanged', () => {
      component.female = true;
      component.pregnancyStatus = 'Yes';
      component.normalWaist = true;
      component.checkNormalWaist(120);
      expect(component.normalWaist).toBeTrue();
    });

    it('checkNormalWaist for male', () => {
      component.female = false;
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeTrue();
      component.checkNormalWaist(95);
      expect(component.normalWaist).toBeFalse();
    });
  });

  describe('BP', () => {
    it('canShowBP3 on diastolic or systolic spread', () => {
      form.patchValue({
        diastolicBP_1stReading: 80,
        diastolicBP_2ndReading: 90,
      });
      component.canShowBP3();
      expect(component.showBP3).toBeTrue();
      form.patchValue({
        diastolicBP_1stReading: 80,
        diastolicBP_2ndReading: 82,
        systolicBP_1stReading: 120,
        systolicBP_2ndReading: 135,
      });
      component.canShowBP3();
      expect(component.showBP3).toBeTrue();
      form.patchValue({ systolicBP_2ndReading: 122 });
      component.canShowBP3();
      expect(component.showBP3).toBeFalse();
    });

    const systolic = [
      'checkSystolicBP1',
      'checkSystolicBP2',
      'checkSystolicBP3',
    ];
    const diastolic = [
      'checkDiastolicBP1',
      'checkDiastolicBP2',
      'checkDiastolicBP3',
    ];
    systolic.forEach(m => {
      it(`${m} alerts outside 90-170`, () => {
        (component as any)[m](120);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[m](80);
        (component as any)[m](180);
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
        expect(confirmation.alert).toHaveBeenCalledWith(recheck);
      });
    });
    diastolic.forEach(m => {
      it(`${m} alerts outside 50-110`, () => {
        (component as any)[m](80);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[m](40);
        (component as any)[m](120);
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
      });
    });

    it('BP1/BP2 checks re-evaluate BP3 visibility', () => {
      spyOn(component, 'canShowBP3');
      component.checkSystolicBP1(120);
      component.checkDiastolicBP1(80);
      component.checkSystolicBP2(120);
      component.checkDiastolicBP2(80);
      expect(component.canShowBP3).toHaveBeenCalledTimes(4);
    });

    [1, 2, 3].forEach(n => {
      const suffix = ['1st', '2nd', '3rd'][n - 1];
      it(`checkSystolicGreater${n} clears systolic ${suffix} reading`, () => {
        const ctrl = `systolicBP_${suffix}Reading`;
        form.patchValue({ [ctrl]: 70 });
        (component as any)[`checkSystolicGreater${n}`](120, 80);
        (component as any)[`checkSystolicGreater${n}`](null, 80);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[`checkSystolicGreater${n}`]('70', '80');
        expect(confirmation.alert).toHaveBeenCalledWith(lang.alerts.info.sysBp);
        expect(form.controls[ctrl].value).toBeNull();
      });

      it(`checkDiastolicLesser${n} clears diastolic ${suffix} reading`, () => {
        const ctrl = `diastolicBP_${suffix}Reading`;
        form.patchValue({ [ctrl]: 130 });
        (component as any)[`checkDiastolicLesser${n}`](120, 80);
        (component as any)[`checkDiastolicLesser${n}`](120, null);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[`checkDiastolicLesser${n}`]('120', '130');
        // Uses key `diabp`, which does not exist in the language file.
        expect(confirmation.alert).toHaveBeenCalledWith(lang.alerts.info.diabp);
        expect(form.controls[ctrl].value).toBeNull();
      });
    });
  });

  describe('lab value checks', () => {
    it('checkHbA1C / checkNormalHbA1c', () => {
      component.checkHbA1C(5);
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkHbA1C(3);
      component.checkHbA1C(7);
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      component.checkNormalHbA1c(5.7);
      expect(component.normalHbA1C).toBeTrue();
      component.checkNormalHbA1c(5.8);
      expect(component.normalHbA1C).toBeFalse();
    });

    it('checkHemoglobin', () => {
      component.checkHemoglobin(12);
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.checkHemoglobin(1);
      component.checkHemoglobin(20);
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    });

    it('checkSpo2', () => {
      form.patchValue({ sPO2: 98 });
      component.checkSpo2();
      expect(confirmation.alert).not.toHaveBeenCalled();
      form.patchValue({ sPO2: 0 });
      component.checkSpo2();
      form.patchValue({ sPO2: 101 });
      component.checkSpo2();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    });

    [
      'checkBloodSugarFasting',
      'checkBloodSugarRandom',
      'checkBloodSugar2HrPostPrandial',
    ].forEach(m => {
      it(`${m} alerts outside 50-700`, () => {
        (component as any)[m](100);
        expect(confirmation.alert).not.toHaveBeenCalled();
        (component as any)[m](40);
        (component as any)[m](800);
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
      });
    });

    it('diabetic range flags', () => {
      component.checkNormalBloodSugarFasting(100);
      expect(component.diabeticRangeFasting).toBeFalse();
      component.checkNormalBloodSugarFasting(101);
      expect(component.diabeticRangeFasting).toBeTrue();
      component.checkNormalBloodSugarRandom(140);
      expect(component.diabeticRangeRandom).toBeFalse();
      component.checkNormalBloodSugarRandom(141);
      expect(component.diabeticRangeRandom).toBeTrue();
      component.checkNormalBloodSugarPostPrandial(140);
      expect(component.diabeticRangePostPrandial).toBeFalse();
      component.checkNormalBloodSugarPostPrandial(141);
      expect(component.diabeticRangePostPrandial).toBeTrue();
    });
  });

  describe('getters', () => {
    it('expose form values', () => {
      form.patchValue({
        waistCircumference_cm: 1,
        systolicBP_3rdReading: 2,
        diastolicBP_3rdReading: 3,
        hbA1C: 4,
        hemoglobin: 5,
        bloodGlucose_Fasting: 6,
        bloodGlucose_Random: 7,
        bloodGlucose_2HrPostPrandial: 8,
      });
      expect(component.waistCircumference_cm).toBe(1);
      expect(component.systolicBP_3rdReading).toBe(2);
      expect(component.diastolicBP_3rdReading).toBe(3);
      expect(component.hbA1C).toBe(4);
      expect(component.hemoglobin).toBe(5);
      expect(component.bloodGlucose_Fasting).toBe(6);
      expect(component.bloodGlucose_Random).toBe(7);
      expect(component.bloodGlucose_2HrPostPrandial).toBe(8);
    });
  });

  describe('IoT dialogs', () => {
    const last = () => dialog.open.calls.mostRecent();

    it('rbs dialog patches result and notifies nurse', () => {
      dialogReturns({ result: 140 });
      component.openIOTRBSModel();
      expect(last().args[0]).toBe(IotcomponentComponent);
      expect(last().args[1].data.startAPI).toBe(environment.startRBSurl);
      expect(component.rbsPopup).toBeFalse();
      expect(form.controls['rbsTestResult'].value).toBe(140);
      expect(form.controls['rbsTestResult'].dirty).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(140);
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        true
      );
    });

    it('rbs dialog with empty result and null close', () => {
      dialogReturns({ result: null });
      component.openIOTRBSModel();
      expect(nurse.setRbsInCurrentVitals).not.toHaveBeenCalled();
      doctor.setValueToEnableVitalsUpdateButton.calls.reset();
      dialogReturns(null);
      component.openIOTRBSModel();
      expect(doctor.setValueToEnableVitalsUpdateButton).not.toHaveBeenCalled();
    });

    it('spo2 and post prandial dialogs, including null close', () => {
      dialogReturns({ spo2: 96, result: 150 });
      component.openIOTSPO2Model();
      component.openIOTBGPostPrandialModel();
      expect(form.controls['sPO2'].value).toBe(96);
      expect(form.controls['bloodGlucose_2HrPostPrandial'].value).toBe(150);
      dialogReturns(null);
      component.openIOTSPO2Model();
      component.openIOTBGPostPrandialModel();
      expect(form.controls['sPO2'].value).toBe(96);
      expect(form.controls['bloodGlucose_2HrPostPrandial'].value).toBe(150);
    });

    it('weight dialog patches weight and recalculates BMI', () => {
      spyOn(component, 'calculateBMI');
      dialogReturns({ result: 55 });
      component.openIOTWeightModel();
      expect(last().args[1].data.startAPI).toBe(environment.startWeighturl);
      expect(form.controls['weight_Kg'].value).toBe(55);
      expect(component.calculateBMI).toHaveBeenCalledWith(55, 55);
    });

    it('temperature and pulse dialogs', () => {
      dialogReturns({ temperature: 99, pulseRate: 70 });
      component.openIOTTempModel();
      component.openIOTPulseRateModel();
      expect(form.controls['temperature'].value).toBe(99);
      expect(form.controls['pulseRate'].value).toBe(70);
    });

    it('BP dialogs patch the matching readings', () => {
      dialogReturns({ sys: 130, dia: 85 });
      component.openIOTBP1Model();
      component.openIOTBP2Model();
      component.openIOTBP3Model();
      ['1st', '2nd', '3rd'].forEach(s => {
        expect(form.controls[`systolicBP_${s}Reading`].value).toBe(130);
        expect(form.controls[`diastolicBP_${s}Reading`].value).toBe(85);
      });
      expect(last().args[1].data.startAPI).toBe(environment.startBPurl);
    });

    it('hemoglobin and glucose dialogs', () => {
      dialogReturns({ result: 11 });
      component.openIOTHemoglobinModel();
      expect(last().args[1].data.startAPI).toBe(environment.startHemoglobinurl);
      component.openIOTBGFastingModel();
      component.openIOTBGRandomModel();
      expect(form.controls['hemoglobin'].value).toBe(11);
      expect(form.controls['bloodGlucose_Fasting'].value).toBe(11);
      expect(form.controls['bloodGlucose_Random'].value).toBe(11);
    });
  });

  it('trackFieldInteraction forwards to tracking service', () => {
    component.trackFieldInteraction('Weight');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Weight',
      'Cancer Patient Vitals'
    );
  });
});
