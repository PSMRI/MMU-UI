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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ComorbidityConcurrentConditionsComponent } from './comorbidity-concurrent-conditions.component';

describe('ComorbidityConcurrentConditionsComponent', () => {
  let component: ComorbidityConcurrentConditionsComponent;
  let fixture: ComponentFixture<ComorbidityConcurrentConditionsComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;

  const master = () => [
    { comorbidCondition: 'Asthma' },
    { comorbidCondition: 'Diabetes' },
    { comorbidCondition: 'Nil' },
    { comorbidCondition: 'None' },
    { comorbidCondition: 'Other' },
  ];

  const makeForm = () =>
    new FormGroup({ comorbidityConcurrentConditionsList: new FormArray([]) });

  const list = () =>
    component.comorbidityConcurrentConditionsForm.controls[
      'comorbidityConcurrentConditionsList'
    ] as FormArray;

  async function setup(session0: Record<string, any> = {}) {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ age: '30 Years' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ComorbidityConcurrentConditionsComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1', ...session0 },
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
    fixture = TestBed.createComponent(ComorbidityConcurrentConditionsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    component.comorbidityConcurrentConditionsForm = makeForm();
  }

  describe('default', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    afterEach(() => component.ngOnDestroy());

    it('initialises language, beneficiary and filter status', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiary).toEqual({ age: '30 Years' });
      expect(component.ComorbidStatus).toBe('false');
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('does nothing while master data is not loaded', () => {
      expect(list().length).toBe(0);
      expect(component.comorbidityMasterData).toBeUndefined();
    });

    it('adds first row with filtered master list once master data arrives', () => {
      master$.next({ comorbidConditions: master() });
      fixture.detectChanges();
      expect(list().length).toBe(1);
      expect(component.comorbiditySelectList.length).toBe(1);
      expect(component.comorbiditySelectList[0].length).toBe(5);
      expect(list().at(0).get('timePeriodAgo')?.disabled).toBeTrue();
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      const rows = fixture.nativeElement.querySelectorAll('.multi_row_select');
      expect(rows.length).toBe(1);
    });

    it('getcomorbidityConcurrentConditions returns controls or null', () => {
      master$.next({ comorbidConditions: master() });
      expect(component.getcomorbidityConcurrentConditions()?.length).toBe(1);
      component.comorbidityConcurrentConditionsForm = new FormGroup({});
      expect(component.getcomorbidityConcurrentConditions()).toBeNull();
    });

    it('addComorbidityConcurrentConditions excludes already selected and None/Nil', () => {
      master$.next({ comorbidConditions: master() });
      const m = component.comorbidityMasterData;
      list().at(0).patchValue({ comorbidConditions: m[0] });
      component.addComorbidityConcurrentConditions();
      const names = component.comorbiditySelectList[1].map(
        (x: any) => x.comorbidCondition
      );
      expect(names).toEqual(['Diabetes', 'Other']);
      // "Other" selections are not excluded
      list().at(1).patchValue({ comorbidConditions: m[4] });
      component.addComorbidityConcurrentConditions();
      expect(
        component.comorbiditySelectList[2].map((x: any) => x.comorbidCondition)
      ).toEqual(['Diabetes', 'Other']);
    });

    it('addComorbidityConcurrentConditions without master data only pushes a row', () => {
      component.comorbidityFilteredMasterData = undefined;
      component.addComorbidityConcurrentConditions();
      expect(list().length).toBe(1);
      expect(component.comorbiditySelectList.length).toBe(0);
    });

    it('filter selection enables fields and removes item from other lists', () => {
      master$.next({ comorbidConditions: master() });
      component.addComorbidityConcurrentConditions();
      const m = component.comorbidityMasterData;
      const row0 = list().at(0);
      row0.patchValue({ otherComorbidCondition: 'x' });
      expect(component.comorbiditySelectList[1]).toContain(m[0]);
      component.filterComorbidityConcurrentConditionsType(m[0], 0, row0);
      expect(row0.value.otherComorbidCondition).toBeNull();
      expect(row0.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(row0.get('isForHistory')?.enabled).toBeTrue();
      expect(component.previousSelectedComorbidity[0]).toBe(m[0]);
      expect(component.comorbiditySelectList[1]).not.toContain(m[0]);

      // change selection: previous value returned to other lists, sorted
      component.filterComorbidityConcurrentConditionsType(m[1], 0, row0);
      expect(component.comorbiditySelectList[1][0]).toBe(m[0]);
      expect(component.previousSelectedComorbidity[0]).toBe(m[1]);
    });

    it('filter selection of Other keeps other-text and is not removed elsewhere', () => {
      master$.next({ comorbidConditions: master() });
      component.addComorbidityConcurrentConditions();
      const m = component.comorbidityMasterData;
      const row0 = list().at(0);
      row0.patchValue({ otherComorbidCondition: 'custom' });
      component.filterComorbidityConcurrentConditionsType(m[4], 0, row0);
      expect(row0.value.otherComorbidCondition).toBe('custom');
      expect(component.comorbiditySelectList[1]).toContain(m[4]);
      // switching away from previous Other does not push it back
      const lenBefore = component.comorbiditySelectList[1].length;
      component.filterComorbidityConcurrentConditionsType(m[1], 0, row0);
      expect(component.comorbiditySelectList[1].length).toBe(lenBefore - 1);
    });

    it('selecting None/Nil removes other rows and disables duration fields', () => {
      master$.next({ comorbidConditions: master() });
      const m = component.comorbidityMasterData;
      component.addComorbidityConcurrentConditions();
      component.addComorbidityConcurrentConditions();
      component.previousSelectedComorbidity = [undefined, m[1], undefined];
      const row0 = list().at(0);
      row0.get('timePeriodAgo')?.enable();
      component.filterComorbidityConcurrentConditionsType(m[3], 0, row0);
      expect(list().length).toBe(1);
      expect(component.comorbiditySelectList.length).toBe(1);
      expect(row0.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row0.get('timePeriodUnit')?.disabled).toBeTrue();
      expect(row0.get('isForHistory')?.disabled).toBeTrue();
      component.filterComorbidityConcurrentConditionsType(m[2], 0);
      expect(component.previousSelectedComorbidity[0]).toBe(m[2]);
    });

    it('remove row: cancel keeps row', () => {
      master$.next({ comorbidConditions: master() });
      confirm.confirm.and.returnValue(of(false));
      component.removeComorbidityConcurrentConditions(0, list().at(0));
      expect(list().length).toBe(1);
      expect(component.comorbidityConcurrentConditionsForm.dirty).toBeFalse();
    });

    it('remove last remaining row resets its values', () => {
      master$.next({ comorbidConditions: master() });
      const row0 = list().at(0);
      row0.patchValue({
        comorbidConditions: master()[0],
        otherComorbidCondition: 'a',
      });
      row0.get('timePeriodAgo')?.enable();
      row0.get('timePeriodUnit')?.enable();
      component.removeComorbidityConcurrentConditions(0, row0);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(list().length).toBe(1);
      expect(row0.value.comorbidConditions).toBeNull();
      expect(row0.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row0.get('timePeriodUnit')?.disabled).toBeTrue();
      expect(component.comorbidityConcurrentConditionsForm.dirty).toBeTrue();
    });

    it('remove a row among many returns its value to other lists', () => {
      master$.next({ comorbidConditions: master() });
      const m = component.comorbidityMasterData;
      component.addComorbidityConcurrentConditions();
      component.previousSelectedComorbidity = [m[0], m[1]];
      component.comorbiditySelectList = [[m[0]], [m[1]]];
      component.removeComorbidityConcurrentConditions(1, list().at(1));
      expect(list().length).toBe(1);
      expect(component.comorbiditySelectList).toEqual([[m[0], m[1]]]);
      expect(component.previousSelectedComorbidity).toEqual([m[0]]);
    });

    it('remove a row whose value was Other does not return it', () => {
      master$.next({ comorbidConditions: master() });
      const m = component.comorbidityMasterData;
      component.addComorbidityConcurrentConditions();
      component.previousSelectedComorbidity = [m[0], m[4]];
      component.comorbiditySelectList = [[m[0]], [m[4]]];
      component.removeComorbidityConcurrentConditions(1);
      expect(component.comorbiditySelectList).toEqual([[m[0]]]);
    });

    it('validateDuration alerts and clears when duration exceeds age', () => {
      const g: any = component.initComorbidityConcurrentConditions();
      g.get('timePeriodAgo')?.enable();
      g.get('timePeriodUnit')?.enable();
      g.patchValue({ timePeriodAgo: 40, timePeriodUnit: 'Years' });
      component.validateDuration(g);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge
      );
      expect(g.get('timePeriodAgo')?.value).toBeNull();
      expect(g.get('timePeriodUnit')?.value).toBeNull();
    });

    it('validateDuration valid duration keeps value', () => {
      const g: any = component.initComorbidityConcurrentConditions();
      g.get('timePeriodAgo')?.enable();
      g.get('timePeriodUnit')?.enable();
      g.patchValue({ timePeriodAgo: 2, timePeriodUnit: 'Years' });
      component.validateDuration(g);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(g.get('timePeriodAgo')?.value).toBe(2);
      expect(g.get('timePeriodUnit')?.value).toBe('Years');
    });

    it('validateDuration enables unit when only duration is given', () => {
      const g: any = component.initComorbidityConcurrentConditions();
      g.get('timePeriodAgo')?.enable();
      g.patchValue({ timePeriodAgo: 3 });
      component.validateDuration(g);
      expect(g.get('timePeriodUnit')?.enabled).toBeTrue();
      expect(g.get('timePeriodUnit')?.value).toBeNull();
    });

    it('sortComorbidityList sorts alphabetically', () => {
      const arr = [
        { comorbidCondition: 'b' },
        { comorbidCondition: 'a' },
        { comorbidCondition: 'b' },
      ];
      component.sortComorbidityList(arr);
      expect(arr.map(a => a.comorbidCondition)).toEqual(['a', 'b', 'b']);
    });

    it('checkValidity is false only when all three fields are set', () => {
      const g: any = component.initComorbidityConcurrentConditions();
      expect(component.checkValidity(g)).toBeTrue();
      g.get('timePeriodAgo')?.enable();
      g.get('timePeriodUnit')?.enable();
      g.patchValue({
        comorbidConditions: { comorbidCondition: 'Asthma' },
        timePeriodAgo: 1,
        timePeriodUnit: 'Days',
      });
      expect(component.checkValidity(g)).toBeFalse();
    });

    it('getPreviousComorbidityHistory opens dialog with data', () => {
      component.visitCategory = 'General OPD';
      const data = { data: [{ a: 1 }], columns: [] };
      nurse.getPreviousComorbidityHistory.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.getPreviousComorbidityHistory();
      expect(nurse.getPreviousComorbidityHistory).toHaveBeenCalledWith(
        'b1',
        'General OPD'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.comorbiditycondition
              .previouscomorbidityhistory,
        },
      });
    });

    it('getPreviousComorbidityHistory alerts when empty, failed or errored', () => {
      nurse.getPreviousComorbidityHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } })
      );
      component.getPreviousComorbidityHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
          .pastHistoryalert
      );
      nurse.getPreviousComorbidityHistory.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      component.getPreviousComorbidityHistory();
      nurse.getPreviousComorbidityHistory.and.returnValue(throwingObs());
      component.getPreviousComorbidityHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error'
      );
      expect(confirm.alert).toHaveBeenCalledTimes(3);
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('onComorbidFilterClick sets status for COVID screening', () => {
      session.setItem('visiCategoryANC', 'COVID-19 Screening');
      component.onComorbidFilterClick();
      expect(component.ComorbidStatus).toBe('true');
      session.setItem('visiCategoryANC', 'ANC');
      component.onComorbidFilterClick();
      expect(component.ComorbidStatus).toBe('false');
    });

    it('ngOnDestroy unsubscribes all subscriptions', () => {
      component.getGeneralHistory('b1', 'v1');
      const subs = [
        component.nurseMasterDataSubscription,
        component.generalHistorySubscription,
        component.beneficiaryDetailSubscription,
      ];
      subs.forEach(s => spyOn(s, 'unsubscribe').and.callThrough());
      component.ngOnDestroy();
      subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      component.nurseMasterDataSubscription = undefined;
      component.generalHistorySubscription = undefined;
      component.beneficiaryDetailSubscription = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('view mode', () => {
    beforeEach(async () => {
      await setup();
    });

    afterEach(() => component.ngOnDestroy());

    it('loads and patches saved comorbidity history', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            ComorbidityConditions: {
              comorbidityConcurrentConditionsList: [
                {
                  comorbidCondition: 'Asthma',
                  timePeriodAgo: 2,
                  timePeriodUnit: 'Years',
                  isForHistory: true,
                },
                {
                  comorbidCondition: 'Unknown',
                  timePeriodAgo: null,
                  timePeriodUnit: null,
                },
                { comorbidCondition: null },
              ],
            },
          },
        })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next({ comorbidConditions: master() });
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(list().length).toBe(3);
      const row0 = list().at(0);
      expect(row0.value.comorbidConditions.comorbidCondition).toBe('Asthma');
      expect(row0.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(row0.get('timePeriodUnit')?.enabled).toBeTrue();
      expect(row0.dirty).toBeTrue();
      expect(list().at(1).get('timePeriodUnit')?.disabled).toBeTrue();
      expect(list().at(2).dirty).toBeFalse();
    });

    it('ignores empty or failed history responses', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next({ comorbidConditions: master() });
      expect(component.comorbidtyData).toBeUndefined();
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('b1', 'v1');
      expect(component.comorbidtyData).toBeUndefined();
      expect(list().length).toBe(1);
    });
  });

  describe('COVID screening', () => {
    beforeEach(async () => {
      await setup({ visiCategoryANC: 'COVID-19 Screening' });
      fixture.detectChanges();
    });

    afterEach(() => component.ngOnDestroy());

    it('marks comorbid condition as required', () => {
      expect(component.ComorbidStatus).toBe('true');
    });
  });
});
