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
import { MasterdataService, NurseService } from '../../../shared/services';
import { PersonalHistoryComponent } from './personal-history.component';

const CONTROLS = [
  'tobaccoUse',
  'startAge_year',
  'endAge_year',
  'typeOfTobaccoProductList',
  'quantityPerDay',
  'isFilteredCigaerette',
  'isCigaretteExposure',
  'isBetelNutChewing',
  'durationOfBetelQuid',
  'alcoholUse',
  'ssAlcoholUsed',
  'frequencyOfAlcoholUsed',
  'dietType',
  'intakeOfOutsidePreparedMeal',
  'fruitConsumptionDays',
  'fruitQuantityPerDay',
  'vegetableConsumptionDays',
  'vegetableQuantityPerDay',
  'typeOfOilConsumedList',
];

function buildForm(): FormGroup {
  const g: any = {};
  CONTROLS.forEach(c => (g[c] = new FormControl(null)));
  return new FormGroup(g);
}

describe('Cancer PersonalHistoryComponent', () => {
  let component: PersonalHistoryComponent;
  let fixture: ComponentFixture<PersonalHistoryComponent>;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  const master = {
    alcoholUseStatus: ['a'],
    dietTypes: ['d'],
    oilConsumed: [
      { habitValue: 'Mustard' },
      { habitValue: 'Don’t know.' },
      { habitValue: 'Sunflower' },
    ],
    physicalActivityType: ['p'],
    tobaccoUseStatus: ['t'],
    typeOfTobaccoProducts: ['Beedi', 'Cigarettes'],
    frequencyOfAlcoholIntake: ['f'],
  };

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PersonalHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: '77' } }),
        { provide: NurseService, useValue: nurse },
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
      .overrideTemplate(PersonalHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(PersonalHistoryComponent);
    component = fixture.componentInstance;
    form = buildForm();
    component.cancerPatientPerosnalHistoryForm = form;
    fixture.detectChanges();
  });

  it('creates and loads language on init/DoCheck', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('ignores null master data and beneficiary', () => {
    expect(component.templateNurseMasterData).toBeUndefined();
    expect(component.templateBeneficiaryDetails).toBeUndefined();
  });

  it('maps nurse master data', () => {
    master$.next(master);
    expect(component.templateNurseMasterData).toBe(master);
    expect(component.templateAlcoholUseStatus).toBe(master.alcoholUseStatus);
    expect(component.templateDietTypes).toBe(master.dietTypes);
    expect(component.templateOilConsumed).toBe(master.oilConsumed);
    expect(component.filteredOilConsumed).toBe(master.oilConsumed);
    expect(component.templatePhysicalActivityType).toBe(
      master.physicalActivityType
    );
    expect(component.templateTobaccoUseStatus).toBe(master.tobaccoUseStatus);
    expect(component.templateTobaccoProductUsed).toBe(
      master.typeOfTobaccoProducts
    );
    expect(component.templateFrequecyOfAlcohol).toBe(
      master.frequencyOfAlcoholIntake
    );
  });

  it('stores beneficiary details and age', () => {
    ben$.next({ ageVal: 40 });
    expect(component.templateBeneficiaryDetails).toEqual({ ageVal: 40 });
    expect(component.patientAge).toBe(40);
  });

  it('ngOnDestroy unsubscribes both subscriptions', () => {
    const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const b = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it('ngOnDestroy tolerates missing subscriptions', () => {
    component.nurseMasterDataSubscription = null;
    component.beneficiaryDetailSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('tobacco product selection (valueChanges)', () => {
    it('flags beedi and cigarettes', () => {
      form.patchValue({ typeOfTobaccoProductList: ['Beedi', 'Cigarettes'] });
      expect(component.doSmokeBeedi).toBeTrue();
      expect(component.doSmokeCigarettes).toBeTrue();
    });

    it('clears filtered cigarette when cigarettes not chosen', () => {
      form.patchValue({ isFilteredCigaerette: 'yes' });
      form.patchValue({ typeOfTobaccoProductList: ['Beedi'] });
      expect(component.doSmokeBeedi).toBeTrue();
      expect(component.doSmokeCigarettes).toBeFalse();
      expect(form.value.isFilteredCigaerette).toBeNull();
    });

    it('handles an empty list', () => {
      form.patchValue({ typeOfTobaccoProductList: null });
      expect(component.doSmokeBeedi).toBeFalse();
      expect(component.doSmokeCigarettes).toBeFalse();
    });
  });

  it('checkTobaccoUseStatus resets ages/products only when value given', () => {
    form.patchValue({
      startAge_year: 5,
      endAge_year: 6,
      typeOfTobaccoProductList: ['Beedi'],
    });
    component.checkTobaccoUseStatus(null);
    expect(form.value.startAge_year).toBe(5);
    component.checkTobaccoUseStatus('Current');
    expect(form.value.startAge_year).toBeNull();
    expect(form.value.endAge_year).toBeNull();
    expect(form.value.typeOfTobaccoProductList).toBeNull();
  });

  it('reset helpers clear their dependent fields', () => {
    form.patchValue({
      durationOfBetelQuid: 3,
      ssAlcoholUsed: 'x',
      frequencyOfAlcoholUsed: 'y',
      fruitQuantityPerDay: 2,
      vegetableQuantityPerDay: 2,
    });
    component.checkBetelQuid();
    expect(form.value.durationOfBetelQuid).toBeNull();
    component.checkUsageOfAlcohol();
    expect(form.value.ssAlcoholUsed).toBeNull();
    expect(form.value.frequencyOfAlcoholUsed).toBeNull();
    form.patchValue({ frequencyOfAlcoholUsed: 'z' });
    component.checkLastAlcoholUsage();
    expect(form.value.frequencyOfAlcoholUsed).toBeNull();
    component.checkFruitConsumption();
    expect(form.value.fruitQuantityPerDay).toBeNull();
    component.checkVegetableConsumption();
    expect(form.value.vegetableQuantityPerDay).toBeNull();
  });

  it('getters return control values', () => {
    form.patchValue({
      tobaccoUse: 'T',
      isBetelNutChewing: true,
      ssAlcoholUsed: 'S',
      alcoholUse: 'A',
      dietType: 'D',
      fruitConsumptionDays: 3,
      vegetableConsumptionDays: 4,
      typeOfOilConsumedList: ['O'],
    });
    expect(component.tobaccoUse).toBe('T');
    expect(component.isBetelNutChewing).toBeTrue();
    expect(component.ssAlcoholUsed).toBe('S');
    expect(component.alcoholUse).toBe('A');
    expect(component.dietType).toBe('D');
    expect(component.fruitConsumptionDays).toBe(3);
    expect(component.vegetableConsumptionDays).toBe(4);
    expect(component.typeOfOilConsumedList).toEqual(['O']);
  });

  describe('oilSelected', () => {
    beforeEach(() => master$.next(master));

    it("keeps only Don't know when it is selected", () => {
      form.patchValue({ typeOfOilConsumedList: ['Don’t know.'] });
      component.oilSelected();
      expect(component.templateOilConsumed).toEqual([
        { habitValue: 'Don’t know.' },
      ]);
    });

    it("removes Don't know when other oils selected", () => {
      form.patchValue({ typeOfOilConsumedList: ['Mustard'] });
      component.oilSelected();
      expect(component.templateOilConsumed.length).toBe(2);
    });

    it('restores full list when nothing selected', () => {
      form.patchValue({ typeOfOilConsumedList: ['Mustard'] });
      component.oilSelected();
      form.patchValue({ typeOfOilConsumedList: [] });
      component.oilSelected();
      expect(component.templateOilConsumed).toBe(master.oilConsumed);
    });
  });

  describe('prevent consumption keys', () => {
    ['preventFruitConsumption', 'preventVegetableConsumption'].forEach(m => {
      it(`${m} blocks keys > 7`, () => {
        const ev = { key: '8', preventDefault: jasmine.createSpy('pd') };
        (component as any)[m](ev);
        expect(ev.preventDefault).toHaveBeenCalled();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.daysInWeek
        );
      });

      it(`${m} allows keys <= 7`, () => {
        const ev = { key: '5', preventDefault: jasmine.createSpy('pd') };
        (component as any)[m](ev);
        expect(ev.preventDefault).not.toHaveBeenCalled();
        expect(confirm.alert).not.toHaveBeenCalled();
      });
    });
  });

  describe('age checks', () => {
    beforeEach(() => ben$.next({ ageVal: 30 }));
    const ev = (v: any) => ({ target: { value: v } });

    it('checkStartAge rejects age above patient age', () => {
      form.patchValue({ startAge_year: 40 });
      component.checkStartAge(ev('40'));
      expect(component.startAgeYear).toBe(40);
      expect(form.value.startAge_year).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.startAge
      );
    });

    it('checkStartAge rejects zero', () => {
      form.patchValue({ startAge_year: 0 });
      component.checkStartAge(ev('0'));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.invalidLessThan
      );
    });

    it('checkStartAge accepts a valid age', () => {
      form.patchValue({ startAge_year: 10 });
      component.checkStartAge(ev('10'));
      expect(form.value.startAge_year).toBe(10);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('checkStopAge rejects age above patient age', () => {
      form.patchValue({ endAge_year: 50 });
      component.checkStopAge(ev('50'));
      expect(form.value.endAge_year).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.stopAge
      );
    });

    it('checkStopAge rejects age lower than start age', () => {
      component.startAgeYear = 20;
      component.checkStopAge(ev('10'));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.ageLess
      );
    });

    it('checkStopAge rejects zero', () => {
      component.checkStopAge(ev('0'));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.invalidLessThan
      );
    });

    it('checkStopAge accepts a valid age', () => {
      component.startAgeYear = 5;
      form.patchValue({ endAge_year: 10 });
      component.checkStopAge(ev('10'));
      expect(form.value.endAge_year).toBe(10);
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  it('fruit/vegetable per-day checks reject zero only', () => {
    form.patchValue({ fruitQuantityPerDay: 2, vegetableQuantityPerDay: 2 });
    component.fruitConsumptionPerDayCheck({ target: { value: '2' } });
    component.vegetableConsumptionPerDayCheck({ target: { value: '2' } });
    expect(confirm.alert).not.toHaveBeenCalled();
    component.fruitConsumptionPerDayCheck({ target: { value: '0' } });
    expect(form.value.fruitQuantityPerDay).toBeNull();
    component.vegetableConsumptionPerDayCheck({ target: { value: '0' } });
    expect(form.value.vegetableQuantityPerDay).toBeNull();
    expect(confirm.alert).toHaveBeenCalledTimes(2);
  });

  it('minimumvaluenonZeroBetelQuid clears only on numeric zero', () => {
    form.patchValue({ durationOfBetelQuid: 4 });
    component.minimumvaluenonZeroBetelQuid({ target: { value: 3 } });
    expect(form.value.durationOfBetelQuid).toBe(4);
    component.minimumvaluenonZeroBetelQuid({ target: { value: 0 } });
    expect(form.value.durationOfBetelQuid).toBeNull();
  });

  [
    'getPreviousCancerPersonalHabitHistory',
    'getPreviousCancerPersonalDietHistory',
  ].forEach(method => {
    describe(method, () => {
      it('opens previous-details dialog when data exists', () => {
        const payload = { data: [{ a: 1 }] };
        nurse[method].and.returnValue(of({ data: payload }));
        (component as any)[method]();
        expect(nurse[method]).toHaveBeenCalledWith('77');
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title:
              LANGUAGE_EN.historyData.personalhistory.previouspersonalhistory,
          },
        });
      });

      it('alerts when history is empty', () => {
        nurse[method].and.returnValue(of({ data: { data: [] } }));
        (component as any)[method]();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.previousHistoryDetailsAlert.prevHabitDiet
        );
        expect(dialog.open).not.toHaveBeenCalled();
      });

      it('alerts error when data is null', () => {
        nurse[method].and.returnValue(of({ data: null, errorMessage: 'bad' }));
        (component as any)[method]();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      });

      it('alerts on request failure', () => {
        nurse[method].and.returnValue(throwingObs('boom'));
        (component as any)[method]();
        expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
      });
    });
  });
});
