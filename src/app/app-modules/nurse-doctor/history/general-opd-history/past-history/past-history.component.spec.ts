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
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { PastHistoryComponent } from './past-history.component';

describe('PastHistoryComponent', () => {
  let component: PastHistoryComponent;
  let fixture: ComponentFixture<PastHistoryComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;

  const illnesses = () => [
    { illnessType: 'Asthma' },
    { illnessType: 'Diabetes' },
    { illnessType: 'Nil' },
    { illnessType: 'None' },
    { illnessType: 'Other' },
  ];
  const surgeries = () => [
    { surgeryType: 'Appendectomy' },
    { surgeryType: 'Cesarean Section' },
    { surgeryType: 'Nil' },
    { surgeryType: 'None' },
    { surgeryType: 'Other' },
  ];
  const masterData = () => ({
    illnessTypes: illnesses(),
    surgeryTypes: surgeries(),
  });

  const illnessArr = () =>
    component.pastHistoryForm.controls['pastIllness'] as FormArray;
  const surgeryArr = () =>
    component.pastHistoryForm.controls['pastSurgery'] as FormArray;

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({
      age: '30 Years',
      genderName: 'Female',
      ageVal: 30,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [PastHistoryComponent],
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
    fixture = TestBed.createComponent(PastHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
    component.pastHistoryForm = new FormGroup({
      pastIllness: new FormArray([]),
      pastSurgery: new FormArray([]),
    });
    spyOn(console, 'log');
  });

  afterEach(() => component.ngOnDestroy());

  describe('initialisation', () => {
    it('sets language and beneficiary, ignores null beneficiary', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiary.ageVal).toBe(30);
      ben$.next(null);
      expect(component.beneficiary.ageVal).toBe(30);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ignores incomplete master data', () => {
      fixture.detectChanges();
      master$.next({ illnessTypes: illnesses() });
      expect(illnessArr().length).toBe(0);
      expect(component.illnessMasterData).toBeUndefined();
    });

    it('keeps female surgeries for adult females and renders rows', () => {
      fixture.detectChanges();
      master$.next(masterData());
      fixture.detectChanges();
      expect(component.surgeryMasterData.length).toBe(5);
      expect(illnessArr().length).toBe(1);
      expect(surgeryArr().length).toBe(1);
      expect(component.pastIllnessSelectList[0].length).toBe(5);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      expect(
        fixture.nativeElement.querySelectorAll('mat-select').length
      ).toBeGreaterThan(0);
    });

    it('removes female-only surgeries for males', () => {
      ben$.next({ age: '30 Years', genderName: 'Male', ageVal: 30 });
      fixture.detectChanges();
      master$.next(masterData());
      expect(
        component.surgeryMasterData.map((s: any) => s.surgeryType)
      ).not.toContain('Cesarean Section');
      expect(component.filteredSurgeryMasterData.length).toBe(4);
    });

    it('removes female-only surgeries for minors', () => {
      ben$.next({ age: '15 Years', genderName: 'Female', ageVal: 15 });
      fixture.detectChanges();
      master$.next(masterData());
      expect(component.surgeryMasterData.length).toBe(4);
    });

    it('getPastIllness / getPastSurgery return null when not FormArray', () => {
      fixture.detectChanges();
      master$.next(masterData());
      expect(component.getPastIllness()?.length).toBe(1);
      expect(component.getPastSurgery()?.length).toBe(1);
      component.pastHistoryForm = new FormGroup({});
      expect(component.getPastIllness()).toBeNull();
      expect(component.getPastSurgery()).toBeNull();
    });
  });

  describe('view mode', () => {
    it('loads illness and surgery history and patches rows', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            PastHistory: {
              pastIllness: [
                {
                  illnessType: 'Asthma',
                  timePeriodAgo: 2,
                  timePeriodUnit: 'Years',
                },
                {
                  illnessType: 'Unknown',
                  timePeriodAgo: null,
                  timePeriodUnit: null,
                },
                { illnessType: null },
              ],
              pastSurgery: [
                {
                  surgeryType: 'Appendectomy',
                  timePeriodAgo: 1,
                  timePeriodUnit: 'Years',
                },
                {
                  surgeryType: 'Unknown',
                  timePeriodAgo: null,
                  timePeriodUnit: null,
                },
                { surgeryType: null },
              ],
            },
          },
        })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next(masterData());
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(illnessArr().length).toBe(3);
      expect(surgeryArr().length).toBe(3);
      const i0 = illnessArr().at(0);
      expect(i0.value.illnessType.illnessType).toBe('Asthma');
      expect(i0.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(i0.dirty).toBeTrue();
      expect(illnessArr().at(1).get('timePeriodAgo')?.disabled).toBeTrue();
      const s0 = surgeryArr().at(0);
      expect(s0.value.surgeryType.surgeryType).toBe('Appendectomy');
      expect(s0.get('timePeriodUnit')?.enabled).toBeTrue();
      expect(component.previousSelectedSurgeryTypeList[0]).toEqual(
        jasmine.objectContaining({ surgeryType: 'Appendectomy' })
      );
    });

    it('handles history without lists, empty and failed responses', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { PastHistory: {} } })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next(masterData());
      expect(component.pastHistoryData).toEqual({});
      expect(illnessArr().length).toBe(1);

      component.pastHistoryData = undefined;
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('b1', 'v1');
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getGeneralHistory('b1', 'v1');
      expect(component.pastHistoryData).toBeUndefined();
      component.handlePastHistoryIllnessData();
      component.handlePastHistorySurgeryData();
      expect(surgeryArr().length).toBe(1);
    });
  });

  describe('illness interactions', () => {
    let m: any[];
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
      m = component.illnessMasterData;
    });

    it('addPastIllness excludes selected items and None/Nil', () => {
      illnessArr().at(0).patchValue({ illnessType: m[0] });
      component.addPastIllness();
      expect(
        component.pastIllnessSelectList[1].map((x: any) => x.illnessType)
      ).toEqual(['Diabetes', 'Other']);
      illnessArr().at(1).patchValue({ illnessType: m[4] });
      component.addPastIllness();
      expect(
        component.pastIllnessSelectList[2].map((x: any) => x.illnessType)
      ).toEqual(['Diabetes', 'Other']);
      component.filteredIllnessMasterData = undefined;
      component.addPastIllness();
      expect(component.pastIllnessSelectList.length).toBe(3);
      expect(illnessArr().length).toBe(4);
    });

    it('filterPastIllnessType moves selection between lists and enables duration', () => {
      component.addPastIllness();
      const row = illnessArr().at(0);
      row.patchValue({ otherIllnessType: 'x' });
      component.filterPastIllnessType(m[0], 0, row);
      expect(row.value.otherIllnessType).toBeNull();
      expect(row.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(component.pastIllnessSelectList[1]).not.toContain(m[0]);
      component.filterPastIllnessType(m[1], 0, row);
      expect(component.pastIllnessSelectList[1][0]).toBe(m[0]);
      expect(component.previousSelectedIllnessTypeList[0]).toBe(m[1]);
    });

    it('filterPastIllnessType with Other keeps other text; previous Other not returned', () => {
      component.addPastIllness();
      const row = illnessArr().at(0);
      row.patchValue({ otherIllnessType: 'custom' });
      component.filterPastIllnessType(m[4], 0, row);
      expect(row.value.otherIllnessType).toBe('custom');
      const len = component.pastIllnessSelectList[1].length;
      component.filterPastIllnessType(m[1], 0);
      expect(component.pastIllnessSelectList[1].length).toBe(len - 1);
    });

    it('filterPastIllnessType None/Nil collapses other rows', () => {
      component.addPastIllness();
      component.addPastIllness();
      component.previousSelectedIllnessTypeList = [undefined, m[0], undefined];
      component.filterPastIllnessType(m[3], 0, illnessArr().at(0));
      expect(illnessArr().length).toBe(1);
      expect(component.pastIllnessSelectList.length).toBe(1);
      expect(component.previousSelectedIllnessTypeList.length).toBe(1);
      component.filterPastIllnessType(m[2], 0);
      expect(illnessArr().length).toBe(1);
    });

    it('filterPastIllnessTypeInDoctor mirrors selection logic', () => {
      component.addPastIllness();
      const row = illnessArr().at(0) as FormGroup;
      row.patchValue({ otherIllnessType: 'x' });
      component.filterPastIllnessTypeInDoctor(m[0], 0, row);
      expect(row.value.otherIllnessType).toBeNull();
      expect(component.pastIllnessSelectList[1]).not.toContain(m[0]);
      component.filterPastIllnessTypeInDoctor(m[1], 0);
      expect(component.pastIllnessSelectList[1]).toContain(m[0]);
      component.filterPastIllnessTypeInDoctor(m[4], 0);
      component.filterPastIllnessTypeInDoctor(m[0], 0);
      expect(component.previousSelectedIllnessTypeList[0]).toBe(m[0]);
      component.filterPastIllnessTypeInDoctor(m[3], 0);
      expect(illnessArr().length).toBe(1);
      expect(console.log).toHaveBeenCalled();
    });

    it('removePastIllness cancelled does nothing', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removePastIllness(0, illnessArr().at(0));
      expect(illnessArr().length).toBe(1);
      expect(component.pastHistoryForm.dirty).toBeFalse();
    });

    it('removePastIllness on single row resets it', () => {
      const row = illnessArr().at(0);
      row.patchValue({ illnessType: m[0] });
      row.get('timePeriodAgo')?.enable();
      component.removePastIllness(0, row);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(row.value.illnessType).toBeNull();
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      // current behaviour: reset+disable recompute pristine, undoing markAsDirty
      expect(component.pastHistoryForm.dirty).toBeFalse();
    });

    it('removePastIllness of first row returns value and None to next list', () => {
      component.addPastIllness();
      component.previousSelectedIllnessTypeList = [m[0], m[1]];
      component.pastIllnessSelectList = [[m[0], m[3]], [m[1]]];
      component.removePastIllness(0, illnessArr().at(0));
      expect(illnessArr().length).toBe(1);
      expect(component.pastIllnessSelectList).toEqual([[m[0], m[1], m[3]]]);
      expect(component.previousSelectedIllnessTypeList).toEqual([m[1]]);
    });

    it('removePastIllness of non-first Other row does not return it', () => {
      component.addPastIllness();
      component.previousSelectedIllnessTypeList = [m[0], m[4]];
      component.pastIllnessSelectList = [[m[0]], [m[4]]];
      component.removePastIllness(1, illnessArr().at(1));
      expect(component.pastIllnessSelectList).toEqual([[m[0]]]);
    });

    it('removePastIllness first row without previous value or None', () => {
      component.addPastIllness();
      component.previousSelectedIllnessTypeList = [];
      component.pastIllnessSelectList = [[m[0]], [m[1]]];
      component.removePastIllness(0);
      expect(component.pastIllnessSelectList).toEqual([[m[1]]]);
    });

    it('checkIllnessValidity', () => {
      const g: any = component.initPastIllness();
      expect(component.checkIllnessValidity(g)).toBeTrue();
      g.get('timePeriodAgo').enable();
      g.get('timePeriodUnit').enable();
      g.patchValue({
        illnessType: m[0],
        timePeriodAgo: 1,
        timePeriodUnit: 'Days',
      });
      expect(component.checkIllnessValidity(g)).toBeFalse();
    });

    it('sortIllnessList sorts by illnessType', () => {
      const arr = [
        { illnessType: 'z' },
        { illnessType: 'a' },
        { illnessType: 'a' },
      ];
      component.sortIllnessList(arr);
      expect(arr.map(a => a.illnessType)).toEqual(['a', 'a', 'z']);
    });
  });

  describe('surgery interactions', () => {
    let m: any[];
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
      m = component.surgeryMasterData;
    });

    it('addPastSurgery excludes selected items and None/Nil', () => {
      surgeryArr().at(0).patchValue({ surgeryType: m[0] });
      component.addPastSurgery();
      expect(
        component.pastSurgerySelectList[1].map((x: any) => x.surgeryType)
      ).toEqual(['Cesarean Section', 'Other']);
      surgeryArr().at(1).patchValue({ surgeryType: m[4] });
      component.addPastSurgery();
      expect(component.pastSurgerySelectList[2].length).toBe(2);
      component.filteredSurgeryMasterData = undefined;
      component.addPastSurgery();
      expect(component.pastSurgerySelectList.length).toBe(3);
      expect(surgeryArr().length).toBe(4);
    });

    it('filterPastSurgeryType moves selection and enables duration', () => {
      component.addPastSurgery();
      const row = surgeryArr().at(0);
      row.patchValue({ otherSurgeryType: 'x' });
      component.filterPastSurgeryType(m[0], 0, row);
      expect(row.value.otherSurgeryType).toBeNull();
      expect(row.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(component.pastSurgerySelectList[1]).not.toContain(m[0]);
      component.filterPastSurgeryType(m[1], 0, row);
      expect(component.pastSurgerySelectList[1][0]).toBe(m[0]);
      row.patchValue({ otherSurgeryType: 'y' });
      component.filterPastSurgeryType(m[4], 0, row);
      expect(row.value.otherSurgeryType).toBe('y');
      const len = component.pastSurgerySelectList[1].length;
      component.filterPastSurgeryType(m[0], 0);
      expect(component.pastSurgerySelectList[1].length).toBe(len - 1);
    });

    it('filterPastSurgeryType None/Nil collapses other rows', () => {
      component.addPastSurgery();
      component.addPastSurgery();
      component.previousSelectedSurgeryTypeList = [undefined, m[0], undefined];
      component.filterPastSurgeryType(m[2], 0, surgeryArr().at(0));
      expect(surgeryArr().length).toBe(1);
      expect(component.pastSurgerySelectList[0]).toContain(m[0]);
      component.filterPastSurgeryType(m[3], 0);
      expect(surgeryArr().length).toBe(1);
    });

    it('removePastSurgery cancelled does nothing', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removePastSurgery(0, surgeryArr().at(0));
      expect(component.pastHistoryForm.dirty).toBeFalse();
    });

    it('removePastSurgery on single row resets it', () => {
      const row = surgeryArr().at(0);
      row.patchValue({ surgeryType: m[0] });
      row.markAsTouched();
      row.get('timePeriodUnit')?.enable();
      component.removePastSurgery(0, row);
      expect(row.value.surgeryType).toBeNull();
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
      expect(row.touched).toBeFalse();
      expect(component.pastHistoryForm.dirty).toBeFalse();
    });

    it('removePastSurgery of first row returns value and Nil to next list', () => {
      component.addPastSurgery();
      component.previousSelectedSurgeryTypeList = [m[0], m[1]];
      component.pastSurgerySelectList = [[m[0], m[2]], [m[1]]];
      component.removePastSurgery(0, surgeryArr().at(0));
      expect(component.pastSurgerySelectList).toEqual([[m[0], m[1], m[2]]]);
      expect(surgeryArr().length).toBe(1);
    });

    it('removePastSurgery of Other row / without previous value', () => {
      component.addPastSurgery();
      component.addPastSurgery();
      component.previousSelectedSurgeryTypeList = [m[0], m[4]];
      component.pastSurgerySelectList = [[m[0]], [m[4]], [m[1]]];
      component.removePastSurgery(1);
      expect(component.pastSurgerySelectList).toEqual([[m[0]], [m[1]]]);
      component.previousSelectedSurgeryTypeList = [];
      component.removePastSurgery(0);
      expect(component.pastSurgerySelectList).toEqual([[m[1]]]);
    });

    it('checkSurgeryValidity', () => {
      const g: any = component.initPastSurgery();
      expect(component.checkSurgeryValidity(g)).toBeTrue();
      g.get('timePeriodAgo').enable();
      g.get('timePeriodUnit').enable();
      g.patchValue({
        surgeryType: m[0],
        timePeriodAgo: 1,
        timePeriodUnit: 'Days',
      });
      expect(component.checkSurgeryValidity(g)).toBeFalse();
      expect(component.checkSurgeryValidity(new FormGroup({}))).toBeTrue();
    });

    it('sortSurgeryList sorts by surgeryType', () => {
      const arr = [
        { surgeryType: 'b' },
        { surgeryType: 'a' },
        { surgeryType: 'b' },
      ];
      component.sortSurgeryList(arr);
      expect(arr.map(a => a.surgeryType)).toEqual(['a', 'b', 'b']);
    });
  });

  describe('misc', () => {
    beforeEach(() => fixture.detectChanges());

    it('validateDuration alerts when exceeding age', () => {
      const g: any = component.initPastIllness();
      g.get('timePeriodAgo').enable();
      g.get('timePeriodUnit').enable();
      g.patchValue({ timePeriodAgo: 50, timePeriodUnit: 'Years' });
      component.validateDuration(g);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge
      );
      expect(g.value.timePeriodAgo).toBeNull();
    });

    it('validateDuration enables/disables unit', () => {
      const g: any = component.initPastIllness();
      g.get('timePeriodAgo').enable();
      g.patchValue({ timePeriodAgo: 3 });
      component.validateDuration(g);
      expect(g.get('timePeriodUnit').enabled).toBeTrue();
      g.patchValue({ timePeriodAgo: 2, timePeriodUnit: 'Days' });
      component.validateDuration(g);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(g.value.timePeriodUnit).toBe('Days');
      g.patchValue({ timePeriodAgo: null });
      component.validateDuration(g);
      expect(g.get('timePeriodUnit').disabled).toBeTrue();
    });

    it('getPreviousPastHistory opens dialog when data exists', () => {
      component.visitCategory = 'General OPD';
      const data = { data: [{}] };
      nurse.getPreviousPastHistory.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.getPreviousPastHistory();
      expect(nurse.getPreviousPastHistory).toHaveBeenCalledWith(
        'b1',
        'General OPD'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.historyData.Previousillness.previouspasthistory,
        },
      });
    });

    it('getPreviousPastHistory alerts on empty, failure and error', () => {
      nurse.getPreviousPastHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } })
      );
      component.getPreviousPastHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot
      );
      nurse.getPreviousPastHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPreviousPastHistory();
      nurse.getPreviousPastHistory.and.returnValue(throwingObs());
      component.getPreviousPastHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error'
      );
      expect(confirm.alert).toHaveBeenCalledTimes(3);
    });

    it('trackFieldInteraction delegates to tracking service', () => {
      component.trackFieldInteraction('Illness');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Illness',
        'Past History'
      );
    });

    it('ngOnDestroy unsubscribes and tolerates missing subscriptions', () => {
      component.getGeneralHistory('b1', 'v1');
      const subs = [
        component.nurseMasterDataSubscription,
        component.generalHistorySubscription,
        component.beneficiaryDetailSubscription,
      ];
      subs.forEach(s => spyOn(s, 'unsubscribe').and.callThrough());
      component.ngOnDestroy();
      subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
      component.nurseMasterDataSubscription = null;
      component.generalHistorySubscription = null;
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
