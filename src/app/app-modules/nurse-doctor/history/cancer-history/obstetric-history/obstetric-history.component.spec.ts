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
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ObstetricHistoryComponent } from './obstetric-history.component';

const CONTROLS = [
  'pregnancyStatus',
  'isUrinePregTest',
  'pregnant_No',
  'noOfLivingChild',
  'isAbortion',
  'menstrualCycleLength',
  'menstrualFlowDuration',
  'menarche_Age',
  'menopauseAge',
  'isPostMenopauseBleeding',
];

describe('Cancer ObstetricHistoryComponent', () => {
  let component: ObstetricHistoryComponent;
  let fixture: ComponentFixture<ObstetricHistoryComponent>;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;
  const info = LANGUAGE_EN.alerts.info;
  const ev = (v: any) => ({ target: { value: v } });

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>({ m: 1 });
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ObstetricHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: '9' } }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ObstetricHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(ObstetricHistoryComponent);
    component = fixture.componentInstance;
    const g: any = {};
    CONTROLS.forEach(c => (g[c] = new FormControl(null)));
    form = new FormGroup(g);
    component.cancerPatientObstetricHistoryForm = form;
    fixture.detectChanges();
  });

  it('loads master data, language and beneficiary on init', () => {
    expect(component.templateNurseMasterData).toEqual({ m: 1 });
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.templateBeneficiaryDetails).toBeUndefined();
    ben$.next({ ageVal: 45 });
    expect(component.patientAge).toBe(45);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('ngOnChanges sets pregnancy status only when provided', () => {
    component.ispregnant = '';
    component.ngOnChanges();
    expect(form.value.pregnancyStatus).toBeNull();
    component.ispregnant = 'Yes';
    component.ngOnChanges();
    expect(form.value.pregnancyStatus).toBe('Yes');
    expect(component.pregnancyStatus).toBe('Yes');
  });

  it('ngOnDestroy unsubscribes master data', () => {
    const s = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s).toHaveBeenCalled();
    component.nurseMasterDataSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('reset helpers clear dependent fields', () => {
    form.patchValue({
      isUrinePregTest: 'Y',
      noOfLivingChild: 2,
      isAbortion: 'N',
    });
    component.checkWithPregnancy();
    expect(form.value.isUrinePregTest).toBeNull();
    component.checkWithPregnantTimes();
    expect(form.value.noOfLivingChild).toBeNull();
    expect(form.value.isAbortion).toBeNull();
  });

  describe('checkNoOfChildren', () => {
    it('keeps valid value', () => {
      form.patchValue({ noOfLivingChild: 3 });
      component.checkNoOfChildren(3);
      expect(form.value.noOfLivingChild).toBe(3);
      expect(confirm.alert).not.toHaveBeenCalled();
    });
    it('rejects more than 15', () => {
      form.patchValue({ noOfLivingChild: 16 });
      component.checkNoOfChildren(16);
      expect(form.value.noOfLivingChild).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(info.childObstericHistory);
    });
    it('clears zero', () => {
      form.patchValue({ noOfLivingChild: 0 });
      component.checkNoOfChildren(0);
      expect(form.value.noOfLivingChild).toBeNull();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('checkLengthMenstrualCycle', () => {
    it('accepts 25-40 silently', () => {
      component.checkLengthMenstrualCycle(ev(30));
      expect(confirm.alert).not.toHaveBeenCalled();
    });
    it('warns for out-of-range', () => {
      component.checkLengthMenstrualCycle(ev(20));
      component.checkLengthMenstrualCycle(ev(45));
      expect(confirm.alert).toHaveBeenCalledWith(info.recheckValue);
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });
    it('rejects non-positive and clears', () => {
      form.patchValue({ menstrualCycleLength: 0 });
      component.checkLengthMenstrualCycle(ev(0));
      expect(confirm.alert).toHaveBeenCalledWith(info.invalidLength);
      expect(form.value.menstrualCycleLength).toBeNull();
    });
    it('handles missing target', () => {
      component.checkLengthMenstrualCycle({});
      expect(confirm.alert).toHaveBeenCalledWith(info.invalidLength);
    });
  });

  describe('checkMenstrualFlowDuration', () => {
    it('accepts <= 12 silently', () => {
      component.checkMenstrualFlowDuration(ev(5));
      expect(confirm.alert).not.toHaveBeenCalled();
    });
    it('warns above 12', () => {
      component.checkMenstrualFlowDuration(ev(13));
      expect(confirm.alert).toHaveBeenCalledWith(info.recheckValue);
    });
    it('rejects non-positive and clears', () => {
      form.patchValue({ menstrualFlowDuration: 0 });
      component.checkMenstrualFlowDuration(ev(0));
      expect(confirm.alert).toHaveBeenCalledWith(info.invalidLength);
      expect(form.value.menstrualFlowDuration).toBeNull();
    });
  });

  describe('checkMenarcheAge', () => {
    beforeEach(() => ben$.next({ ageVal: 30 }));
    it('accepts 8-20 silently', () => {
      component.checkMenarcheAge(ev(12));
      expect(confirm.alert).not.toHaveBeenCalled();
    });
    it('warns when outside 8-20 but <= age', () => {
      component.checkMenarcheAge(ev(25));
      expect(confirm.alert).toHaveBeenCalledWith(info.recheckValue);
    });
    it('rejects age above patient age', () => {
      form.patchValue({ menarche_Age: 40 });
      component.checkMenarcheAge(ev(40));
      expect(form.value.menarche_Age).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(info.menarchAge);
    });
    it('rejects zero', () => {
      form.patchValue({ menarche_Age: 0 });
      component.checkMenarcheAge(ev(0));
      expect(form.value.menarche_Age).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(info.invalidLength);
    });
  });

  describe('checkMenopauseAge', () => {
    beforeEach(() => ben$.next({ ageVal: 70 }));
    it('accepts 50-60 silently', () => {
      form.patchValue({ isPostMenopauseBleeding: 'Y' });
      component.checkMenopauseAge(ev(55));
      expect(form.value.isPostMenopauseBleeding).toBe('Y');
      expect(confirm.alert).not.toHaveBeenCalled();
    });
    it('warns outside 50-60 and clears bleeding', () => {
      form.patchValue({ isPostMenopauseBleeding: 'Y' });
      component.checkMenopauseAge(ev(45));
      expect(form.value.isPostMenopauseBleeding).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(info.recheckValue);
    });
    it('rejects above patient age', () => {
      form.patchValue({ menopauseAge: 80, isPostMenopauseBleeding: 'Y' });
      component.checkMenopauseAge(ev(80));
      expect(form.value.menopauseAge).toBeNull();
      expect(form.value.isPostMenopauseBleeding).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(info.menopauseAge);
    });
    it('rejects zero', () => {
      form.patchValue({ menopauseAge: 0, isPostMenopauseBleeding: 'Y' });
      component.checkMenopauseAge(ev(0));
      expect(component.menopauseAge).toBeNull();
      expect(form.value.isPostMenopauseBleeding).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(info.invalidLength);
    });
  });

  it('pregnant_No getter reads control', () => {
    form.patchValue({ pregnant_No: '2' });
    expect(component.pregnant_No).toBe('2');
  });

  describe('getPreviousCancerPastObstetricHistory', () => {
    it('opens dialog when data exists', () => {
      const payload = { data: [{ x: 1 }] };
      nurse.getPreviousCancerPastObstetricHistory.and.returnValue(
        of({ data: payload })
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(nurse.getPreviousCancerPastObstetricHistory).toHaveBeenCalledWith(
        '9'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: { dataList: payload, title: LANGUAGE_EN.common.prevObsteric },
      });
    });
    it('alerts when empty', () => {
      nurse.getPreviousCancerPastObstetricHistory.and.returnValue(
        of({ data: { data: [] } })
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.previousHistoryDetailsAlert.prevHabitDiet
      );
    });
    it('alerts error message when data null', () => {
      nurse.getPreviousCancerPastObstetricHistory.and.returnValue(
        of({ data: null, errorMessage: 'e' })
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
    it('alerts on failure', () => {
      nurse.getPreviousCancerPastObstetricHistory.and.returnValue(
        throwingObs('x')
      );
      component.getPreviousCancerPastObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
  });
});
