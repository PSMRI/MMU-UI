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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { environment } from 'src/environments/environment';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { NcdScreeningComponent } from './ncd-screening.component';

describe('NcdScreeningComponent', () => {
  let component: NcdScreeningComponent;
  let fixture: ComponentFixture<NcdScreeningComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let router: Router;
  let ben$: BehaviorSubject<any>;
  let master$: BehaviorSubject<any>;
  const info = LANGUAGE_EN.alerts.info;

  const masterData = () => ({
    bloodPressureStatus: [{ bpAndDiabeticStatusID: 1, name: 'Normal' }],
    diabeticStatus: [{ bpAndDiabeticStatusID: 2, name: 'Diabetic' }],
    ncdScreeningConditions: [
      { ncdScreeningConditionID: 10, name: 'HTN' },
      { ncdScreeningConditionID: 11, name: 'DM' },
    ],
    ncdScreeningReasons: [
      { ncdScreeningReasonID: 1, name: 'Age > 30' },
      { ncdScreeningReasonID: 2, name: 'Symptoms' },
    ],
  });

  async function setup(mode = '') {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    ben$ = new BehaviorSubject<any>(null);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdScreeningComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 3, parkingPlaceID: 4 }),
            visitID: 'v1',
            beneficiaryRegID: 'b1',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: master$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NcdScreeningComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'log');
    component.NCDScreeningForm = component.utils.createNCDScreeningForm();
    component.patientMedicalForm = new FormBuilder().group({
      patientVisitForm: new FormBuilder().group({ visitReason: 'r' }),
    });
    component.ncdScreeningMode = mode;
    component.ngOnInit();
  }

  const form = () => component.NCDScreeningForm;

  afterEach(() => component?.ngOnDestroy());

  describe('init', () => {
    beforeEach(async () => setup());

    it('sets language, dates and visit form', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.patientVisitForm.value).toEqual({ visitReason: 'r' });
      expect(component.nextScreeningDate.getDate()).toBe(
        new Date(new Date().setDate(new Date().getDate() + 1)).getDate()
      );
      expect(form().value.vanID).toBe(3);
      expect(component.startBPTest).toBe(environment.startBPurl);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('loads master data and filters screening reasons for under-30s', () => {
      component.age = 25;
      master$.next(masterData());
      expect(component.bloodPressureStatus.length).toBe(1);
      expect(
        component.ncdScreeningReasons.map((r: any) => r.ncdScreeningReasonID)
      ).toEqual([2]);
      expect(doctor.getNcdScreeningDetails).not.toHaveBeenCalled();
      component.age = 40;
      expect(
        component.filterNCDScreeningReasons(masterData().ncdScreeningReasons)
          .length
      ).toBe(2);
    });

    it('beneficiary details set age/gender and patch visit count', () => {
      nurse.getNcdScreeningVisitCount.and.returnValue(
        of({ statusCode: 200, data: { ncdScreeningVisitCount: 4 } })
      );
      ben$.next({ ageVal: 45, genderName: 'Female', beneficiaryRegID: 9 });
      expect(nurse.getNcdScreeningVisitCount).toHaveBeenCalledWith(9);
      expect(component.age).toBe(45);
      expect(component.female).toBeTrue();
      expect(component.ncdScreeningVisitCount).toBe(4);
      expect(form().value.ncdScreeningVisitNo).toBe(4);
    });

    it('beneficiary without age / male / failed count', () => {
      nurse.getNcdScreeningVisitCount.and.returnValue(of({ statusCode: 500 }));
      ben$.next({ genderName: 'Male', beneficiaryRegID: 9 });
      expect(component.age).toBe(0);
      expect(component.female).toBeFalse();
      expect(form().value.ncdScreeningVisitNo).toBeNull();
    });
  });

  it('view mode fetches details and patches mapped values', async () => {
    await setup('view');
    nurse.getNcdScreeningVisitCount.and.returnValue(
      of({ statusCode: 200, data: { ncdScreeningVisitCount: 4 } })
    );
    ben$.next({ ageVal: 45, beneficiaryRegID: 9 });
    expect(form().value.ncdScreeningVisitNo).toBeNull();

    doctor.getNcdScreeningDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          anthropometryDetails: { height_cm: 170, weight_Kg: 70 },
          ncdScreeningDetails: {
            nextScreeningDate: '2024-05-01',
            ncdScreeningReasonID: 2,
            bloodPressureStatusID: 1,
            diabeticStatusID: 2,
            isBPPrescribed: true,
            isBloodGlucosePrescribed: true,
            ncdScreeningConditionList: [{ ncdScreeningConditionID: 11 }],
          },
          vitalDetails: {
            systolicBP_1stReading: 120,
            systolicBP_2ndReading: 130,
            systolicBP_3rdReading: 125,
            diastolicBP_1stReading: 80,
            diastolicBP_2ndReading: 82,
            diastolicBP_3rdReading: 84,
          },
        },
      })
    );
    master$.next(masterData());
    expect(doctor.getNcdScreeningDetails).toHaveBeenCalledWith('b1', 'v1');
    const v = form().value;
    expect(v.reasonForScreening.ncdScreeningReasonID).toBe(2);
    expect(v.bloodPressureStatus.name).toBe('Normal');
    expect(v.diabeticStatus.name).toBe('Diabetic');
    expect(v.ncdScreeningConditionList).toEqual([
      { ncdScreeningConditionID: 11, name: 'DM' },
    ]);
    expect(v.labTestOrders.map((l: any) => l.procedureName)).toEqual([
      'BP Measurement',
      'Blood Glucose Measurement',
    ]);
    expect(v.nextScreeningDate instanceof Date).toBeTrue();
    expect(v.bMI).toBe(24.2);
    expect(component.normalBMI).toBeTrue();
    expect(component.checkBloodPressure).toBeTrue();
    expect(component.checkBloodGlucose).toBeTrue();
    expect(v.averageSystolicBP_Reading).toBe('125');
    expect(v.averageDiastolicBP_Reading).toBe('82');
  });

  it('view mode without prescriptions clears BP / glucose fields', async () => {
    await setup('view');
    doctor.getNcdScreeningDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          ncdScreeningDetails: {
            bloodGlucose_Fasting: 99,
            systolicBP_1stReading: 120,
          },
        },
      })
    );
    const md: any = masterData();
    md.ncdScreeningConditions = null;
    master$.next(md);
    const v = form().value;
    expect(v.labTestOrders).toEqual([]);
    expect(v.ncdScreeningConditionList).toEqual([]);
    expect(v.bloodGlucose_Fasting).toBeNull();
    expect(v.systolicBP_1stReading).toBeNull();
    expect(component.checkBloodPressure).toBeFalse();
    expect(component.checkBloodGlucose).toBeFalse();
    expect(v.bMI).toBeNull();
    expect(component.normalBMI).toBeFalse();
  });

  it('getNCDScreeingDetails ignores non-200', async () => {
    await setup();
    doctor.getNcdScreeningDetails.and.returnValue(
      of({ statusCode: 500, data: null })
    );
    component.getNCDScreeingDetails(1, 2);
    expect(component.ncdScreeningDetails).toBeUndefined();
  });

  describe('update', () => {
    beforeEach(async () => setup('update'));

    it('notifies mandatory fields when invalid', () => {
      ['height_cm', 'weight_Kg', 'isScreeningComplete'].forEach(c => {
        form().controls[c].setValidators(Validators.required);
        form().controls[c].updateValueAndValidity();
      });
      component.ngOnChanges();
      expect(confirm.notify).toHaveBeenCalledWith(info.mandatoryFields, [
        LANGUAGE_EN.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC.height,
        LANGUAGE_EN.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC.weight,
        LANGUAGE_EN.screeningComplete,
      ]);
      expect(doctor.updateNCDScreeningDetails).not.toHaveBeenCalled();
    });

    it('updates, alerts success and navigates to worklist', () => {
      form().markAsDirty();
      doctor.updateNCDScreeningDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } })
      );
      component.ngOnChanges();
      expect(doctor.updateNCDScreeningDetails).toHaveBeenCalledWith(
        form().value,
        { visitReason: 'r' }
      );
      expect(form().pristine).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
      expect(router.navigate).toHaveBeenCalledWith(['/common/nurse-worklist']);
    });

    it('alerts error on failure response and on error', () => {
      doctor.updateNCDScreeningDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.updateNCDScreeningDetails();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      doctor.updateNCDScreeningDetails.and.returnValue(throwingObs('e'));
      component.updateNCDScreeningDetails();
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('measurements', () => {
    beforeEach(async () => setup());

    it('calculateBMI flags abnormal BMI', () => {
      form().patchValue({ height_cm: 150, weight_Kg: 80 });
      component.calculateBMI();
      expect(component.BMI).toBe(35.6);
      expect(form().value.bMI).toBe(35.6);
      expect(component.bMI).toBe(35.6);
      expect(component.normalBMI).toBeFalse();
    });

    const rangeChecks: [string, string, number, number, number][] = [
      ['checkHeight', 'height_cm', 150, 110, 210],
      ['checkWeight', 'weight_Kg', 60, 20, 160],
      ['checkSystolicBP1', 'systolicBP_1stReading', 120, 80, 180],
      ['checkSystolicBP2', 'systolicBP_2ndReading', 120, 80, 180],
      ['checkSystolicBP3', 'systolicBP_3rdReading', 120, 80, 180],
      ['checkDiastolicBP1', 'diastolicBP_1stReading', 80, 40, 120],
      ['checkDiastolicBP2', 'diastolicBP_2ndReading', 80, 40, 120],
      ['checkDiastolicBP3', 'diastolicBP_3rdReading', 80, 40, 120],
      ['checkBloodSugarFasting', 'bloodGlucose_Fasting', 100, 40, 800],
      ['checkBloodSugarRandom', 'bloodGlucose_Random', 100, 40, 800],
      ['checkBloodSugar2HrPostPrandial', 'bloodGlucose_2hr_PP', 100, 40, 800],
      [
        'checkBloodSugarNotSpecified',
        'bloodGlucose_NotSpecified',
        100,
        40,
        800,
      ],
    ];
    rangeChecks.forEach(([fn, ctrl, ok, low, high]) =>
      it(`${fn} alerts only outside the range`, () => {
        form().patchValue({ [ctrl]: ok });
        (component as any)[fn]();
        expect(confirm.alert).not.toHaveBeenCalled();
        form().patchValue({ [ctrl]: low });
        (component as any)[fn]();
        form().patchValue({ [ctrl]: high });
        (component as any)[fn]();
        expect(confirm.alert.calls.allArgs()).toEqual([
          [info.recheckValue],
          [info.recheckValue],
        ]);
      })
    );

    it('hipWaistRatio uses gender specific thresholds', () => {
      component.hipWaistRatio();
      expect(component.patientWaistHipRatio).toBeUndefined();
      form().patchValue({
        hipCircumference_cm: 100,
        waistCircumference_cm: 85,
      });
      component.hipWaistRatio();
      expect(form().value.waistHipRatio).toBe('0.85');
      expect(component.waistHipRatio).toBe('0.85');
      expect(component.normalWaistHipRatio).toBeTrue();
      component.female = true;
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeFalse();
      form().patchValue({ waistCircumference_cm: 70 });
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeTrue();
      component.female = false;
      form().patchValue({ waistCircumference_cm: 95 });
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeFalse();
    });

    it('checkHip and checkWaist ranges', () => {
      form().patchValue({ hipCircumference_cm: 95 });
      component.checkHip();
      expect(component.normalHip).toBeTrue();
      component.female = true;
      component.checkHip();
      expect(component.normalHip).toBeFalse();
      form().patchValue({ hipCircumference_cm: 100 });
      component.checkHip();
      expect(component.normalHip).toBeTrue();
      component.female = false;
      form().patchValue({ hipCircumference_cm: 110 });
      component.checkHip();
      expect(component.normalHip).toBeFalse();

      form().patchValue({ waistCircumference_cm: 80 });
      component.checkWaist();
      expect(component.normalWaist).toBeTrue();
      form().patchValue({ waistCircumference_cm: 40 });
      component.checkWaist();
      expect(component.normalWaist).toBeFalse();
    });

    it('average BP requires all three readings', () => {
      form().patchValue({
        systolicBP_1stReading: 120,
        systolicBP_2ndReading: 130,
      });
      component.calculateAverageSystolicBP();
      expect(form().value.averageSystolicBP_Reading).toBeNull();
      form().patchValue({ diastolicBP_1stReading: 80 });
      component.calculateAverageDiastolicBP();
      expect(form().value.averageDiastolicBP_Reading).toBeNull();
      form().patchValue({
        diastolicBP_2ndReading: 90,
        diastolicBP_3rdReading: 91,
      });
      component.calculateAverageDiastolicBP();
      expect(form().value.averageDiastolicBP_Reading).toBe('87');
      expect(component.averageDiastolicBP_Reading).toBe('87');
      expect(component.averageSystolicBP_Reading).toBe('87');
    });

    [1, 2, 3].forEach(n => {
      const suffix = n === 1 ? '1st' : n === 2 ? '2nd' : '3rd';
      it(`checkSystolicGreater${n} clears systolic ${suffix} reading when <= diastolic`, () => {
        const sys = `systolicBP_${suffix}Reading`;
        form().patchValue({ [sys]: 80 });
        (component as any)[`checkSystolicGreater${n}`](80, 90);
        expect(confirm.alert).toHaveBeenCalledWith(info.sysBp);
        expect(form().value[sys]).toBeNull();
        confirm.alert.calls.reset();
        form().patchValue({ [sys]: 120 });
        (component as any)[`checkSystolicGreater${n}`](120, 80);
        (component as any)[`checkSystolicGreater${n}`](null, 80);
        expect(confirm.alert).not.toHaveBeenCalled();
        expect(form().value[sys]).toBe(120);
      });

      it(`checkDiastolicLesser${n} clears diastolic ${suffix} reading when >= systolic`, () => {
        const dia = `diastolicBP_${suffix}Reading`;
        form().patchValue({ [dia]: 100 });
        (component as any)[`checkDiastolicLesser${n}`](90, 100);
        expect(confirm.alert).toHaveBeenCalledWith(info.DiaBp);
        expect(form().value[dia]).toBeNull();
        confirm.alert.calls.reset();
        form().patchValue({ [dia]: 70 });
        (component as any)[`checkDiastolicLesser${n}`](120, 70);
        (component as any)[`checkDiastolicLesser${n}`](120, null);
        expect(confirm.alert).not.toHaveBeenCalled();
        expect(form().value[dia]).toBe(70);
      });
    });
  });

  describe('IOT dialogs', () => {
    beforeEach(async () => setup());

    const openWith = (result: any) =>
      dialog.open.and.returnValue(createDialogRefMock(result));

    it('weight dialog patches weight and recalculates BMI', () => {
      form().patchValue({ height_cm: 100 });
      openWith({ result: 20 });
      component.openIOTWeightModel();
      expect(dialog.open).toHaveBeenCalledWith(IotcomponentComponent, {
        width: '600px',
        height: '180px',
        disableClose: true,
        data: { startAPI: environment.startWeighturl },
      });
      expect(form().value.weight_Kg).toBe(20);
      expect(form().value.bMI).toBe(20);
    });

    const bg: [string, string][] = [
      ['openIOTBGFastingModel', 'bloodGlucose_Fasting'],
      ['openIOTBGRandomModel', 'bloodGlucose_Random'],
      ['openIOTBGPostPrandialModel', 'bloodGlucose_2hr_PP'],
      ['openIOTBGNotSpecifiedModel', 'bloodGlucose_NotSpecified'],
    ];
    bg.forEach(([fn, ctrl]) =>
      it(`${fn} patches ${ctrl}`, () => {
        openWith({ result: 140 });
        (component as any)[fn]();
        expect(dialog.open.calls.mostRecent().args[1].data).toEqual({
          startAPI: environment.startBloodGlucoseurl,
        });
        expect(form().value[ctrl]).toBe(140);
      })
    );

    ['1st', '2nd', '3rd'].forEach((s, i) =>
      it(`openIOTBP${i + 1}Model patches ${s} readings`, () => {
        openWith({ sys: 121, dia: 81 });
        (component as any)[`openIOTBP${i + 1}Model`]();
        expect(dialog.open.calls.mostRecent().args[1].data).toEqual({
          startAPI: environment.startBPurl,
        });
        expect(form().value[`systolicBP_${s}Reading`]).toBe(121);
        expect(form().value[`diastolicBP_${s}Reading`]).toBe(81);
      })
    );
  });

  it('ngOnDestroy unsubscribes', async () => {
    await setup();
    const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const b = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});
