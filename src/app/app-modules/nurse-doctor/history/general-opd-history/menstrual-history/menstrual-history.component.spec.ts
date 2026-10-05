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
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { MenstrualHistoryComponent } from './menstrual-history.component';

const CONTROLS = [
  'menstrualCycleStatus',
  'menstrualCycleStatusID',
  'regularity',
  'cycleLength',
  'menstrualCyclelengthID',
  'menstrualFlowDurationID',
  'bloodFlowDuration',
  'menstrualProblemID',
  'problemName',
  'menstrualProblemList',
  'lMPDate',
];

describe('MenstrualHistoryComponent', () => {
  let component: MenstrualHistoryComponent;
  let fixture: ComponentFixture<MenstrualHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let form: FormGroup;

  const master = {
    menstrualCycleStatus: [{ name: 'Amenorrhea' }, { name: 'Active' }],
    menstrualCycleLengths: [{ menstrualCycleRange: '21-35' }],
    menstrualCycleBloodFlowDuration: [{ menstrualCycleRange: '3-5' }],
    menstrualProblem: [{ problemName: 'None' }, { problemName: 'Pain' }],
  };

  async function setup(mode: string, visitCategory: string) {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MenstrualHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: '11', visitID: '22' },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(MenstrualHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(MenstrualHistoryComponent);
    component = fixture.componentInstance;
    const g: any = {};
    CONTROLS.forEach(c => (g[c] = new FormControl(null)));
    form = new FormGroup(g);
    component.menstrualHistoryForm = form;
    component.mode = mode;
    component.visitCategory = visitCategory;
    fixture.detectChanges();
  }

  describe('General OPD, new mode', () => {
    beforeEach(async () => setup('new', 'General OPD'));

    it('initialises dates and language', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.today instanceof Date).toBeTrue();
      const diff =
        component.today.getTime() - component.minimumLMPDate.getTime();
      expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ignores incomplete master data', () => {
      master$.next({ menstrualCycleStatus: [] });
      expect(component.masterData).toBeUndefined();
    });

    it('enables LMP date for non-ANC visits', () => {
      form.get('lMPDate')?.disable();
      master$.next(master);
      expect(component.masterData).toBe(master);
      expect(form.get('lMPDate')?.enabled).toBeTrue();
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('1', '2');
      const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const b = spyOn(component.generalHistorySubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(a).toHaveBeenCalled();
      expect(b).toHaveBeenCalled();
      component.nurseMasterDataSubscription = null;
      component.generalHistorySubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('checkMenstrualCycleStatus clears fields including LMP', () => {
      spyOn(console, 'log');
      form.patchValue({ regularity: 'R', cycleLength: 'x', lMPDate: 'd' });
      component.checkMenstrualCycleStatus();
      expect(form.value.regularity).toBeNull();
      expect(form.value.cycleLength).toBeNull();
      expect(form.value.lMPDate).toBeNull();
    });

    it('getters read controls', () => {
      form.patchValue({ menstrualCycleStatus: 'S', lMPDate: 'L' });
      expect(component.menstrualCycleStatus).toBe('S');
      expect(component.lMPDate).toBe('L');
      component.menstrualHistoryForm = undefined as any;
      expect(component.menstrualCycleStatus).toBeUndefined();
    });

    it('resetOtherMenstrualProblems flags None and Other', () => {
      component.resetOtherMenstrualProblems();
      expect(component.isNoneSelected).toBeFalse();
      expect(component.isOtherSelected).toBeFalse();
      form.patchValue({ menstrualProblemList: [{ problemName: 'None' }] });
      component.resetOtherMenstrualProblems();
      expect(component.isNoneSelected).toBeTrue();
      expect(component.isOtherSelected).toBeFalse();
      form.patchValue({ menstrualProblemList: [{ problemName: 'Pain' }] });
      component.resetOtherMenstrualProblems();
      expect(component.isNoneSelected).toBeFalse();
      expect(component.isOtherSelected).toBeTrue();
    });

    describe('getPreviousMenstrualHistory', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousMenstrualHistory.and.returnValue(
          of({ statusCode: 200, data: payload })
        );
        component.getPreviousMenstrualHistory();
        expect(nurse.getPreviousMenstrualHistory).toHaveBeenCalledWith(
          '11',
          'General OPD'
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title:
              LANGUAGE_EN.historyData.Previousmenstrualhistory
                .previousmenstrualhistory,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousMenstrualHistory.and.returnValue(
          of({ statusCode: 200, data: { data: [] } })
        );
        component.getPreviousMenstrualHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.pastHistoryNot
        );
      });
      it('alerts on non-200', () => {
        nurse.getPreviousMenstrualHistory.and.returnValue(
          of({ statusCode: 500 })
        );
        component.getPreviousMenstrualHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousMenstrualHistory.and.returnValue(throwingObs());
        component.getPreviousMenstrualHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });
  });

  describe('ANC visit', () => {
    beforeEach(async () => setup('new', 'ANC'));

    it('sets Amenorrhea and disables LMP date', () => {
      master$.next(master);
      expect(form.value.menstrualCycleStatus).toEqual({
        name: 'Amenorrhea',
      });
      expect(form.get('lMPDate')?.disabled).toBeTrue();
    });

    it('checkMenstrualCycleStatus keeps LMP date', () => {
      spyOn(console, 'log');
      form.patchValue({ regularity: 'R', lMPDate: 'keep' });
      component.checkMenstrualCycleStatus();
      expect(form.value.regularity).toBeNull();
      expect(form.value.lMPDate).toBe('keep');
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view', 'General OPD'));

    it('fetches history and maps master values', () => {
      spyOn(console, 'log');
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            MenstrualHistory: {
              menstrualCycleStatus: 'Active',
              cycleLength: '21-35',
              bloodFlowDuration: '3-5',
              menstrualProblemList: [{ problemName: 'Pain' }],
              lMPDate: '2024-01-02T00:00:00.000Z',
              regularity: 'Regular',
            },
          },
        })
      );
      master$.next(master);
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(form.value.menstrualCycleStatus).toEqual({ name: 'Active' });
      expect(form.value.cycleLength).toBe(master.menstrualCycleLengths[0]);
      expect(form.value.bloodFlowDuration).toBe(
        master.menstrualCycleBloodFlowDuration[0]
      );
      expect(form.value.menstrualProblemList).toEqual([
        master.menstrualProblem[1],
      ]);
      expect(form.value.lMPDate instanceof Date).toBeTrue();
      expect(form.value.regularity).toBe('Regular');
      expect(component.isOtherSelected).toBeTrue();
    });

    it('handles missing problem list', () => {
      spyOn(console, 'log');
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { MenstrualHistory: { lMPDate: null } } })
      );
      master$.next(master);
      expect(form.value.menstrualProblemList).toEqual([]);
      expect(component.isNoneSelected).toBeFalse();
    });

    it('ignores non-200', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(of({ statusCode: 500 }));
      master$.next(master);
      expect(form.value.regularity).toBeNull();
    });
  });
});
