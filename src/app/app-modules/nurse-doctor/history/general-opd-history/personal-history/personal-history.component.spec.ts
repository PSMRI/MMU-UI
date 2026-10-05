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
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
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
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { AllergenSearchComponent } from 'src/app/app-modules/core/components/allergen-search/allergen-search.component';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { GeneralPersonalHistoryComponent } from './personal-history.component';

describe('GeneralPersonalHistoryComponent', () => {
  let component: GeneralPersonalHistoryComponent;
  let fixture: ComponentFixture<GeneralPersonalHistoryComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let populate$: BehaviorSubject<any>;

  const masterData = () => ({
    typeOfTobaccoProducts: [
      { personalHabitTypeID: 1, habitValue: 'Beedi' },
      { personalHabitTypeID: 2, habitValue: 'Cigarette' },
      { personalHabitTypeID: 3, habitValue: 'Gutka' },
    ],
    typeOfAlcoholProducts: [{ habitValue: 'Beer' }, { habitValue: 'Whisky' }],
    quantityOfAlcoholIntake: [{ habitValue: '1-2' }],
    frequencyOfAlcoholIntake: [{ habitValue: 'Daily' }],
    AllergicReactionTypes: [
      { name: 'Rash', allergicReactionTypeID: 1 },
      { name: 'Other', allergicReactionTypeID: 11 },
    ],
  });

  const history = () => ({
    statusCode: 200,
    data: {
      PersonalHistory: {
        dietaryType: 'Veg',
        riskySexualPracticesStatus: '1',
        tobaccoUseStatus: 'Yes',
        alcoholIntakeStatus: 'Yes',
        allergyStatus: 'Yes',
        tobaccoList: [
          {
            tobaccoUseType: 'Beedi',
            numberperDay: 5,
            duration: 2,
            durationUnit: 'Years',
          },
          {
            tobaccoUseType: { personalHabitTypeID: 2 },
            numberperWeek: 3,
            duration: 1,
            durationUnit: 'Years',
          },
          { tobaccoUseType: 'Unknown' },
        ],
        alcoholList: [
          {
            alcoholType: 'Beer',
            alcoholIntakeFrequency: 'Daily',
            avgAlcoholConsumption: '1-2',
            duration: 1,
            durationUnit: 'Years',
          },
          { alcoholType: null, avgAlcoholConsumption: null },
        ],
        allergicList: [
          {
            allergyType: 'Drugs',
            typeOfAllergicReactions: [{ name: 'Rash' }],
            otherAllergicReaction: 'x',
            snomedTerm: 'Penicillin',
            snomedCode: '123',
          },
          { allergyType: 'Food', typeOfAllergicReactions: [] },
        ],
      },
    },
  });

  const makeForm = () =>
    new FormGroup({
      dietaryType: new FormControl<any>(null),
      physicalActivityType: new FormControl<any>(null),
      riskySexualPracticesStatus: new FormControl<any>(null),
      tobaccoUseStatus: new FormControl<any>(null),
      alcoholIntakeStatus: new FormControl<any>(null),
      allergyStatus: new FormControl<any>(null),
      vanID: new FormControl<any>(7),
      parkingPlaceID: new FormControl<any>(8),
      tobaccoList: new FormArray<any>([]),
      alcoholList: new FormArray<any>([]),
      allergicList: new FormArray<any>([]),
    });

  const arr = (name: string) =>
    component.generalPersonalHistoryForm.controls[name] as FormArray;

  beforeEach(async () => {
    populate$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      populateHistoryResponse$: populate$.asObservable(),
    });
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ age: '30 Years', ageVal: 30 });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GeneralPersonalHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        FormBuilder,
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
    fixture = TestBed.createComponent(GeneralPersonalHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    component.generalPersonalHistoryForm = makeForm();
    spyOn(console, 'log');
  });

  describe('new entry mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('initialises language and beneficiary; waits for master data', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiary.ageVal).toBe(30);
      expect(arr('tobaccoList').length).toBe(0);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('adds one row of each list when master data arrives (only once)', () => {
      master$.next(masterData());
      expect(arr('tobaccoList').length).toBe(1);
      expect(arr('alcoholList').length).toBe(1);
      expect(arr('allergicList').length).toBe(1);
      expect(component.tobaccoSelectList[0].length).toBe(3);
      expect(component.alcoholSelectList[0].length).toBe(2);
      expect(component.allerySelectList[0].length).toBe(3);
      master$.next(masterData());
      expect(arr('tobaccoList').length).toBe(1);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });

    it('renders list sections when statuses are Yes', () => {
      master$.next(masterData());
      component.generalPersonalHistoryForm.patchValue({
        tobaccoUseStatus: 'Yes',
        alcoholIntakeStatus: 'Yes',
        allergyStatus: 'Yes',
      });
      fixture.detectChanges();
      expect(component.tobaccoUseStatus).toBe('Yes');
      expect(component.alcoholIntakeStatus).toBe('Yes');
      expect(component.allergyStatus).toBe('Yes');
      expect(component.tobaccoList.length).toBe(1);
      expect(
        fixture.nativeElement.querySelectorAll('mat-select').length
      ).toBeGreaterThan(2);
    });

    it('list getters return null when not arrays', () => {
      master$.next(masterData());
      expect(component.getTobaccoList()?.length).toBe(1);
      expect(component.getAlcoholList()?.length).toBe(1);
      expect(component.getAllergyList()?.length).toBe(1);
      const saved = component.generalPersonalHistoryForm;
      component.generalPersonalHistoryForm = new FormGroup({});
      expect(component.getTobaccoList()).toBeNull();
      expect(component.getAlcoholList()).toBeNull();
      expect(component.getAllergyList()).toBeNull();
      component.generalPersonalHistoryForm = saved;
    });

    it('populateHistoryResponse without PersonalHistory is ignored', () => {
      populate$.next({ statusCode: 200, data: {} });
      populate$.next({ statusCode: 500, data: null });
      expect(component.personalHistoryData).toBeUndefined();
    });
  });

  describe('update mode with populated history', () => {
    it('patches tobacco, alcohol and allergy rows from history', () => {
      component.mode = 'update';
      fixture.detectChanges();
      expect(arr('tobaccoList').length).toBe(0);
      master$.next(masterData());
      populate$.next(history());
      expect(component.personalHistoryData.dietaryType).toBe('Veg');
      const t = arr('tobaccoList');
      expect(t.length).toBe(3);
      expect(t.at(0).value.tobaccoUseType.habitValue).toBe('Beedi');
      expect(t.at(0).value.number).toBe(5);
      expect(t.at(0).value.perDay).toBeTrue();
      expect(t.at(0).get('number')?.enabled).toBeTrue();
      expect(t.at(1).value.tobaccoUseType.habitValue).toBe('Cigarette');
      expect(t.at(1).value.number).toBe(3);
      expect(t.at(1).value.perDay).toBeFalse();
      expect(t.at(2).get('number')?.disabled).toBeTrue();
      const a = arr('alcoholList');
      expect(a.length).toBe(2);
      expect(a.at(0).value.typeOfAlcohol).toEqual({ habitValue: 'Beer' });
      expect(a.at(0).get('duration')?.enabled).toBeTrue();
      expect(a.at(1).dirty).toBeFalse();
      const al = arr('allergicList');
      expect(al.length).toBe(2);
      expect(al.at(0).value.allergyType.allergyType).toBe('Drugs');
      expect(al.at(0).value.enableOtherAllergy).toBeTrue();
      expect(al.at(0).value.typeOfAllergicReactions).toEqual([
        { name: 'Rash', allergicReactionTypeID: 1 },
      ]);
      // row 0 is computed before row 1's type is resolved, so nothing is excluded
      expect(component.allerySelectList[0].length).toBe(3);
      expect(
        component.allerySelectList[1].map((x: any) => x.allergyType)
      ).toEqual(['Food', 'Environmental']);
      expect(component.previousSelectedAlleryList.length).toBe(2);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });

    it('handles history with missing lists and pre-sized arrays', () => {
      component.mode = 'update';
      fixture.detectChanges();
      master$.next(masterData());
      const h: any = history();
      h.data.PersonalHistory.tobaccoList = [
        { tobaccoUseType: 'Gutka', number: 1 },
      ];
      h.data.PersonalHistory.alcoholList = [];
      delete h.data.PersonalHistory.allergicList;
      component.generalPersonalHistoryForm.setControl(
        'alcoholList',
        new FormArray<any>([
          component.initAlcoholList(),
          component.initAlcoholList(),
        ])
      );
      component.generalPersonalHistoryForm.setControl(
        'tobaccoList',
        new FormArray<any>([
          component.initTobaccoList(),
          component.initTobaccoList(),
        ])
      );
      populate$.next(h);
      expect(arr('tobaccoList').length).toBe(1);
      expect(arr('tobaccoList').at(0).get('perDay')?.value).toBeNull();
      expect(arr('tobaccoList').at(0).get('perDay')?.disabled).toBeTrue();
      expect(arr('alcoholList').length).toBe(0);
      expect(arr('allergicList').length).toBe(1);
      component.personalHistoryData = null;
      component.handlePersonalTobaccoHistoryData();
      component.handlePersonalAlcoholHistoryData();
      component.handlePersonalAllergyHistoryData();
      expect(arr('tobaccoList').length).toBe(1);
    });
  });

  describe('view mode', () => {
    it('fetches saved history after master data and converts risky status', () => {
      doctor.getGeneralHistoryDetails.and.callFake(() => of(history()));
      component.mode = 'view';
      fixture.detectChanges();
      master$.next(masterData());
      populate$.next(history());
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(
        component.generalPersonalHistoryForm.value.riskySexualPracticesStatus
      ).toBeTrue();
      expect(arr('tobaccoList').length).toBe(3);
      expect(arr('allergicList').length).toBe(2);
    });

    it('converts non-1 risky status to false and ignores empty history', () => {
      const h: any = history();
      h.data.PersonalHistory.riskySexualPracticesStatus = '0';
      doctor.getGeneralHistoryDetails.and.returnValue(of(h));
      fixture.detectChanges();
      master$.next(masterData());
      component.getGeneralHistory('b1', 'v1');
      expect(component.personalHistoryData.riskySexualPracticesStatus).toBe(
        false
      );
      const h2: any = history();
      h2.data.PersonalHistory.riskySexualPracticesStatus = null;
      doctor.getGeneralHistoryDetails.and.returnValue(of(h2));
      component.getGeneralHistory('b1', 'v1');
      expect(component.personalHistoryData.riskySexualPracticesStatus).toBe(
        null
      );
      component.personalHistoryData = undefined;
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('b1', 'v1');
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getGeneralHistory('b1', 'v1');
      expect(component.personalHistoryData).toBeUndefined();
    });
  });

  describe('tobacco', () => {
    let m: any[];
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
      m = component.tobaccoMasterData;
    });

    it('addTobacco excludes selected types and honours avoidNullValue', () => {
      arr('tobaccoList').at(0).patchValue({ tobaccoUseType: m[0] });
      component.addTobacco();
      expect(
        component.tobaccoSelectList[1].map((x: any) => x.habitValue)
      ).toEqual(['Cigarette', 'Gutka']);
      expect(arr('tobaccoList').length).toBe(2);
      component.addTobacco(true);
      expect(arr('tobaccoList').length).toBe(2);
      expect(component.tobaccoSelectList.length).toBe(3);
      component.tobaccoMasterData = null;
      component.addTobacco();
      expect(component.tobaccoSelectList.length).toBe(3);
      expect(arr('tobaccoList').length).toBe(3);
    });

    it('filterTobaccoList moves selection between lists and enables number', () => {
      component.addTobacco();
      const row = arr('tobaccoList').at(0);
      row.patchValue({ tobaccoUseType: m[0], otherTobaccoUseType: 'x' });
      component.filterTobaccoList({ value: m[0] }, 0, row);
      expect(row.value.otherTobaccoUseType).toBeNull();
      expect(row.get('number')?.enabled).toBeTrue();
      expect(component.tobaccoSelectList[1]).not.toContain(m[0]);
      component.filterTobaccoList({ value: m[1] }, 0, row);
      expect(component.tobaccoSelectList[1][0]).toBe(m[0]);
      expect(component.previousSelectedTobaccoList[0]).toBe(m[1]);
      component.filterTobaccoList({ value: m[2] }, 0);
      expect(component.previousSelectedTobaccoList[0]).toBe(m[2]);
    });

    it('filterTobaccoList without selected value disables dependent fields', () => {
      const row = arr('tobaccoList').at(0);
      row.get('number')?.enable();
      row.get('perDay')?.enable();
      component.filterTobaccoList({ value: m[0] }, 0, row);
      expect(row.get('number')?.disabled).toBeTrue();
      expect(row.get('perDay')?.disabled).toBeTrue();
      expect(row.get('durationUnit')?.disabled).toBeTrue();
    });

    it('removeTobacco: cancel keeps row but marks form dirty', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeTobacco(0, arr('tobaccoList').at(0));
      expect(arr('tobaccoList').length).toBe(1);
      expect(component.generalPersonalHistoryForm.dirty).toBeTrue();
    });

    it('removeTobacco single row resets it', () => {
      const row = arr('tobaccoList').at(0);
      row.patchValue({ tobaccoUseType: m[0] });
      row.get('number')?.enable();
      row.markAsTouched();
      component.removeTobacco(0, row);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(row.value.tobaccoUseType).toBeNull();
      expect(row.get('number')?.disabled).toBeTrue();
      expect(row.touched).toBeFalse();
    });

    it('removeTobacco from many returns value to other lists', () => {
      component.addTobacco();
      component.previousSelectedTobaccoList = [m[1], m[0]];
      component.tobaccoSelectList = [[m[2]], [m[0]]];
      component.removeTobacco(1, arr('tobaccoList').at(1));
      expect(arr('tobaccoList').length).toBe(1);
      expect(component.tobaccoSelectList).toEqual([[m[0], m[2]]]);
      component.addTobacco();
      component.previousSelectedTobaccoList = [];
      component.removeTobacco(1);
      expect(arr('tobaccoList').length).toBe(1);
    });

    it('enableFields toggles perDay/duration by number', () => {
      const row = arr('tobaccoList').at(0);
      row.get('number')?.enable();
      row.patchValue({ number: 4 });
      component.enableFields(row);
      expect(row.get('perDay')?.enabled).toBeTrue();
      expect(row.get('duration')?.enabled).toBeTrue();
      row.patchValue({ number: null });
      component.enableFields(row);
      expect(row.get('perDay')?.disabled).toBeTrue();
      expect(row.get('durationUnit')?.disabled).toBeTrue();
    });

    it('perDayChange copies number into per-day or per-week field', () => {
      component.addTobacco();
      component.addTobacco();
      const t = arr('tobaccoList');
      [0, 1].forEach(i => {
        t.at(i).get('number')?.enable();
        t.at(i).get('perDay')?.enable();
      });
      t.at(0).patchValue({ number: 5, perDay: true, numberperWeek: 9 });
      t.at(1).patchValue({ number: 7, perDay: false, numberperDay: 9 });
      component.perDayChange();
      expect(t.at(0).value.numberperDay).toBe(5);
      expect(t.at(0).value.numberperWeek).toBeNull();
      expect(t.at(1).value.numberperWeek).toBe(7);
      expect(t.at(1).value.numberperDay).toBeNull();
      expect(t.at(2).value.numberperDay).toBeNull();
    });

    it('checkTobaccoValidity', () => {
      const g: any = component.initTobaccoList();
      expect(component.checkTobaccoValidity(g)).toBeTrue();
      g.enable();
      g.patchValue({
        tobaccoUseType: m[0],
        number: 1,
        duration: 1,
        durationUnit: 'Years',
      });
      expect(component.checkTobaccoValidity(g)).toBeFalse();
    });

    it('checkTobaccoStatus resets rows only when present', () => {
      arr('tobaccoList').at(0).patchValue({ tobaccoUseType: m[0] });
      component.checkTobaccoStatus();
      expect(arr('tobaccoList').at(0).value.tobaccoUseType).toBeNull();
      arr('tobaccoList').clear();
      component.checkTobaccoStatus();
      expect(arr('tobaccoList').length).toBe(0);
    });
  });

  describe('alcohol', () => {
    let m: any[];
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
      m = component.alcoholMasterData;
    });

    it('addAlcohol excludes selected types and honours avoidNullValue', () => {
      arr('alcoholList').at(0).patchValue({ typeOfAlcohol: m[0] });
      component.addAlcohol();
      expect(component.alcoholSelectList[1]).toEqual([m[1]]);
      component.addAlcohol(true);
      expect(arr('alcoholList').length).toBe(2);
      component.alcoholMasterData = null;
      component.addAlcohol();
      expect(component.alcoholSelectList.length).toBe(3);
      expect(arr('alcoholList').length).toBe(3);
    });

    it('filterAlcoholList moves selection and enables frequency', () => {
      component.addAlcohol();
      const row = arr('alcoholList').at(0);
      row.patchValue({ typeOfAlcohol: m[0], otherAlcoholType: 'x' });
      component.filterAlcoholList({ value: m[0] }, 0, row);
      expect(row.value.otherAlcoholType).toBeNull();
      expect(row.get('alcoholIntakeFrequency')?.enabled).toBeTrue();
      expect(component.alcoholSelectList[1]).not.toContain(m[0]);
      component.filterAlcoholList({ value: m[1] }, 0, row);
      expect(component.alcoholSelectList[1]).toContain(m[0]);
      expect(component.previousSelectedAlcoholList[0]).toBe(m[1]);
    });

    it('filterAlcoholList without selected value disables dependent fields', () => {
      const row = arr('alcoholList').at(0);
      row.get('alcoholIntakeFrequency')?.enable();
      component.filterAlcoholList({ value: m[0] }, 0, row);
      expect(row.get('alcoholIntakeFrequency')?.disabled).toBeTrue();
      expect(row.get('durationUnit')?.disabled).toBeTrue();
      component.filterAlcoholList({ value: m[1] }, 0);
      expect(component.previousSelectedAlcoholList[0]).toBe(m[1]);
    });

    it('removeAlcohol cancel / single / many', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeAlcohol(0, arr('alcoholList').at(0));
      expect(arr('alcoholList').length).toBe(1);
      confirm.confirm.and.returnValue(of(true));
      const row = arr('alcoholList').at(0);
      row.patchValue({ typeOfAlcohol: m[0] });
      row.get('duration')?.enable();
      component.removeAlcohol(0, row);
      expect(row.value.typeOfAlcohol).toBeNull();
      expect(row.get('duration')?.disabled).toBeTrue();
      // reset/disable of the child recomputes pristine, undoing markAsDirty
      expect(component.generalPersonalHistoryForm.dirty).toBeFalse();

      component.addAlcohol();
      component.previousSelectedAlcoholList = [m[0], m[1]];
      component.alcoholSelectList = [[m[0]], [m[1]]];
      component.removeAlcohol(1, arr('alcoholList').at(1));
      expect(arr('alcoholList').length).toBe(1);
      expect(component.alcoholSelectList).toEqual([[m[0], m[1]]]);
      component.addAlcohol();
      component.previousSelectedAlcoholList = [];
      component.removeAlcohol(1);
      expect(arr('alcoholList').length).toBe(1);
    });

    it('onChangeAlcIntakFreq and onChangeAvgAlcoholConsumption', () => {
      const row = arr('alcoholList').at(0);
      row.get('alcoholIntakeFrequency')?.enable();
      row.patchValue({ alcoholIntakeFrequency: 'Daily' });
      component.onChangeAlcIntakFreq(row);
      expect(row.get('avgAlcoholConsumption')?.enabled).toBeTrue();
      row.patchValue({ avgAlcoholConsumption: '1-2' });
      component.onChangeAvgAlcoholConsumption(row);
      expect(row.get('duration')?.enabled).toBeTrue();
      row.patchValue({ avgAlcoholConsumption: null });
      component.onChangeAvgAlcoholConsumption(row);
      expect(row.get('duration')?.disabled).toBeTrue();
      row.patchValue({ alcoholIntakeFrequency: null });
      component.onChangeAlcIntakFreq(row);
      expect(row.get('avgAlcoholConsumption')?.disabled).toBeTrue();
      expect(row.get('durationUnit')?.disabled).toBeTrue();
    });

    it('checkAlcoholValidity', () => {
      const g: any = component.initAlcoholList();
      expect(component.checkAlcoholValidity(g)).toBeTrue();
      g.enable();
      g.patchValue({
        typeOfAlcohol: m[0],
        alcoholIntakeFrequency: 'Daily',
        avgAlcoholConsumption: '1-2',
        duration: 1,
        durationUnit: 'Years',
      });
      expect(component.checkAlcoholValidity(g)).toBeFalse();
    });

    it('checkAlcoholStatus resets rows only when present', () => {
      arr('alcoholList').at(0).patchValue({ typeOfAlcohol: m[0] });
      component.checkAlcoholStatus();
      expect(arr('alcoholList').at(0).value.typeOfAlcohol).toBeNull();
      arr('alcoholList').clear();
      component.checkAlcoholStatus();
      expect(arr('alcoholList').length).toBe(0);
    });
  });

  describe('allergy', () => {
    let m: any[];
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
      m = component.allergyMasterData;
    });

    it('addAllergy adds until all types used', () => {
      component.selectedSnomedTerm = 'x';
      arr('allergicList').at(0).patchValue({ allergyType: m[0] });
      component.addAllergy();
      expect(component.selectedSnomedTerm).toBeNull();
      expect(component.allerySelectList[1]).toEqual([m[1], m[2]]);
      component.addAllergy(true);
      expect(arr('allergicList').length).toBe(2);
      component.addAllergy();
      expect(arr('allergicList').length).toBe(3);
      component.addAllergy();
      expect(arr('allergicList').length).toBe(3);
    });

    it('filterAlleryList moves selection and toggles fields', () => {
      component.addAllergy();
      const row = arr('allergicList').at(0);
      row.patchValue({ allergyType: m[0] });
      component.filterAlleryList({ value: m[0] }, 0, row);
      expect(row.get('snomedTerm')?.enabled).toBeTrue();
      expect(row.get('typeOfAllergicReactions')?.enabled).toBeTrue();
      expect(component.allerySelectList[1]).not.toContain(m[0]);
      row.patchValue({ allergyType: null });
      component.filterAlleryList({ value: m[1] }, 0, row);
      expect(component.allerySelectList[1]).toContain(m[0]);
      expect(row.get('snomedTerm')?.disabled).toBeTrue();
      expect(row.get('typeOfAllergicReactions')?.enabled).toBeTrue();
    });

    it('removeAllergy cancel / single / many', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeAllergy(0, arr('allergicList').at(0));
      expect(component.generalPersonalHistoryForm.dirty).toBeFalse();
      confirm.confirm.and.returnValue(of(true));
      component.selectedSnomedTerm = 'x';
      const row = arr('allergicList').at(0);
      row.patchValue({ allergyType: m[0] });
      component.removeAllergy(0, row);
      expect(row.value.allergyType).toBeNull();
      expect(component.selectedSnomedTerm).toBeNull();

      component.addAllergy();
      component.previousSelectedAlleryList = [m[0], m[1]];
      component.allerySelectList = [[m[0]], [m[1]]];
      component.selectedSnomedTerm = 'y';
      component.removeAllergy(1, arr('allergicList').at(1));
      expect(arr('allergicList').length).toBe(1);
      expect(component.allerySelectList).toEqual([[m[0], m[1]]]);
      expect(component.selectedSnomedTerm).toBeNull();
      component.addAllergy();
      component.previousSelectedAlleryList = [];
      component.removeAllergy(1);
      expect(arr('allergicList').length).toBe(1);
    });

    it('canEnableOtherAllergy depends on reaction type 11', () => {
      const row = arr('allergicList').at(0);
      row.get('typeOfAllergicReactions')?.enable();
      row.patchValue({
        typeOfAllergicReactions: [{ allergicReactionTypeID: 11 }],
      });
      component.canEnableOtherAllergy(row);
      expect(row.value.enableOtherAllergy).toBeTrue();
      row.patchValue({
        typeOfAllergicReactions: [{ allergicReactionTypeID: 1 }],
      });
      component.canEnableOtherAllergy(row);
      expect(row.value.enableOtherAllergy).toBeFalse();
    });

    it('checkAllergyValidity', () => {
      const g: any = component.initAllergyList();
      expect(component.checkAllergyValidity(g)).toBeTrue();
      g.enable();
      g.patchValue({
        allergyType: m[0],
        snomedTerm: 'Pen',
        snomedCode: '1',
        typeOfAllergicReactions: [{}],
      });
      expect(component.checkAllergyValidity(g)).toBeFalse();
    });

    it('checkAllergicStatus resets rows only when present', () => {
      arr('allergicList').at(0).patchValue({ allergyType: m[0] });
      component.checkAllergicStatus();
      expect(arr('allergicList').at(0).value.allergyType).toBeNull();
      arr('allergicList').clear();
      component.checkAllergicStatus();
      expect(arr('allergicList').length).toBe(0);
    });

    it('searchComponents opens allergen search for 3+ chars and patches result', () => {
      const row = arr('allergicList').at(0);
      row.get('snomedTerm')?.enable();
      row.patchValue({ snomedTerm: 'Pe' });
      component.searchComponents('Pe', 0, row);
      expect(dialog.open).not.toHaveBeenCalled();

      dialog.open.and.returnValue({
        afterClosed: () => of({ component: 'Peanut', componentNo: '999' }),
      });
      row.patchValue({ snomedTerm: 'Pea' });
      component.searchComponents('Pea', 0, row);
      expect(dialog.open).toHaveBeenCalledWith(AllergenSearchComponent, {
        data: { searchTerm: 'Pea' },
      });
      expect(row.value.snomedTerm).toBe('Peanut');
      expect(row.value.snomedCode).toBe('999');
      expect(row.value.allergyName).toBe('Peanut');
      expect(component.selectedSnomedTerm).toBe('Peanut');
      expect(component.countForSearch).toBe(0);
      expect(component.componentFlag).toBeTrue();
      expect(component.enableAlert).toBeFalse();

      dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
      component.searchComponents('Pea', 0, row);
      expect(component.enableAlert).toBeTrue();
      expect(component.snomedTerm).toBeNull();
      expect(component.snomedCode).toBeNull();
    });

    it('searchComponents ignores missing term', () => {
      component.searchComponents(null, 5, arr('allergicList').at(0));
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('removeSnomedCode clears edited snomed term', () => {
      const row = arr('allergicList').at(0);
      row.get('snomedTerm')?.enable();
      row.patchValue({
        snomedTerm: 'Peanut butter',
        snomedCode: '1',
        allergyName: 'Peanut',
      });
      component.selectedSnomedTerm = undefined;
      component.removeSnomedCode(row, 0);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.personalHistoryANC_OPD_NCD_PNC
          .snomedTermRemoved
      );
      expect(row.value.snomedCode).toBeNull();
      expect(row.value.allergyName).toBeNull();
      expect(component.selectedSnomedTerm).toBeNull();
      expect(component.countForSearch).toBe(0);
    });

    it('removeSnomedCode clears when term emptied; keeps unchanged term', () => {
      const row = arr('allergicList').at(0);
      row.get('snomedTerm')?.enable();
      component.selectedSnomedTerm = 'Peanut';
      component.countForSearch = 0;
      row.patchValue({ snomedTerm: null, snomedCode: '1' });
      component.removeSnomedCode(row, 0);
      expect(row.value.snomedCode).toBeNull();
      expect(confirm.alert).toHaveBeenCalledTimes(1);

      component.selectedSnomedTerm = 'Peanut';
      row.patchValue({ snomedTerm: ' Peanut ', snomedCode: '2' });
      component.removeSnomedCode(row, 0);
      expect(row.value.snomedCode).toBe('2');

      // later row than last searched: selection forgotten, nothing cleared
      component.countForSearch = 0;
      component.removeSnomedCode(row, 1);
      expect(component.selectedSnomedTerm).toBeNull();
      expect(row.value.snomedCode).toBe('2');
      expect(confirm.alert).toHaveBeenCalledTimes(1);
    });

    it('sortAllergyList sorts by allergyType', () => {
      const list = [
        { allergyType: 'b' },
        { allergyType: 'a' },
        { allergyType: 'a' },
      ];
      component.sortAllergyList(list);
      expect(list.map(x => x.allergyType)).toEqual(['a', 'a', 'b']);
    });
  });

  describe('misc', () => {
    beforeEach(() => fixture.detectChanges());

    it('sort tobacco / alcohol by habitValue', () => {
      const t = [{ habitValue: 'b' }, { habitValue: 'a' }, { habitValue: 'a' }];
      component.sortTobaccoList(t);
      expect(t.map(x => x.habitValue)).toEqual(['a', 'a', 'b']);
      const a = [{ habitValue: 'z' }, { habitValue: 'y' }, { habitValue: 'z' }];
      component.sortAlcoholList(a);
      expect(a.map(x => x.habitValue)).toEqual(['y', 'z', 'z']);
    });

    it('validateDuration alerts on duration beyond age', () => {
      const g: any = component.initTobaccoList();
      g.enable();
      g.patchValue({ duration: 40, durationUnit: 'Years' });
      component.validateDuration(g);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge
      );
      expect(g.value.duration).toBeNull();
    });

    it('validateDuration toggles unit field', () => {
      const g: any = component.initTobaccoList();
      g.get('duration').enable();
      g.patchValue({ duration: 2 });
      component.validateDuration(g);
      expect(g.get('durationUnit').enabled).toBeTrue();
      g.patchValue({ durationUnit: 'Years' });
      component.validateDuration(g);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(g.value.durationUnit).toBe('Years');
      g.patchValue({ duration: null });
      component.validateDuration(g);
      expect(g.get('durationUnit').disabled).toBeTrue();
    });

    const previousCases: [string, string, () => any][] = [
      [
        'getPreviousTobaccoHistory',
        'getPreviousTobaccoHistory',
        () => LANGUAGE_EN.previousTobaccohistoryDet,
      ],
      [
        'getPreviousAlcoholHistory',
        'getPreviousAlcoholHistory',
        () =>
          LANGUAGE_EN.historyData.Alcoholhistory.previousalcoholhistorydetails,
      ],
      [
        'getPreviousAllergyHistory',
        'getPreviousAllergyHistory',
        () => LANGUAGE_EN.previousAllergyhistoryDet,
      ],
    ];

    previousCases.forEach(([method, svc, title]) => {
      it(`${method} opens dialog with data`, () => {
        component.visitCategory = 'General OPD';
        const data = { data: [{}] };
        nurse[svc].and.returnValue(of({ statusCode: 200, data }));
        (component as any)[method]();
        expect(nurse[svc]).toHaveBeenCalledWith('b1', 'General OPD');
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: { dataList: data, title: title() },
        });
      });

      it(`${method} alerts on empty, failure and error`, () => {
        nurse[svc].and.returnValue(of({ statusCode: 200, data: { data: [] } }));
        (component as any)[method]();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
            .pastHistoryalert
        );
        nurse[svc].and.returnValue(of({ statusCode: 500, data: null }));
        (component as any)[method]();
        nurse[svc].and.returnValue(throwingObs());
        (component as any)[method]();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.errorFetchingHistory,
          'error'
        );
        expect(confirm.alert).toHaveBeenCalledTimes(3);
      });
    });

    it('ngOnDestroy unsubscribes and resets the form', () => {
      master$.next(masterData());
      component.generalPersonalHistoryForm.patchValue({ dietaryType: 'Veg' });
      const subs = [
        component.nurseMasterDataSubscription,
        component.beneficiaryDetailSubscription,
      ];
      subs.forEach(s => spyOn(s, 'unsubscribe').and.callThrough());
      component.ngOnDestroy();
      subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
      expect(component.generalPersonalHistoryForm.value.dietaryType).toBeNull();
      component.nurseMasterDataSubscription = null;
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
