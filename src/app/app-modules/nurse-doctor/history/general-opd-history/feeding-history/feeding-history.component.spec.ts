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
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { FeedingHistoryComponent } from './feeding-history.component';

const CONTROLS = [
  'typeOfFeed',
  'compFeedStartAge',
  'noOfCompFeedPerDay',
  'foodIntoleranceStatus',
  'typeofFoodIntolerance',
];

describe('FeedingHistoryComponent', () => {
  let component: FeedingHistoryComponent;
  let fixture: ComponentFixture<FeedingHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  async function setup(mode = 'new', ben: any = null) {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(ben);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FeedingHistoryComponent],
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
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FeedingHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(FeedingHistoryComponent);
    component = fixture.componentInstance;
    const g: any = {};
    CONTROLS.forEach(c => (g[c] = new FormControl(null)));
    form = new FormGroup(g);
    component.feedingHistoryForm = form;
    component.mode = mode;
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
  }

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('sets language, age stays 0 without beneficiary, master data stored', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.age).toBe(0);
      const m = { a: 1 };
      master$.next(m);
      expect(component.masterData).toBe(m);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('computes age in months from "years - months" string', () => {
      ben$.next({ age: '2 years - 3 months' });
      expect(component.age).toBe(27);
    });

    it('computes age in months from "months" string', () => {
      ben$.next({ age: '7 months - 4 days' });
      expect(component.age).toBe(7);
    });

    it('leaves age unchanged when neither years nor months', () => {
      ben$.next({ age: '10 days' });
      expect(component.age).toBe(0);
    });

    it('ngOnDestroy unsubscribes when present and tolerates nulls', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('1', '2');
      const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const b = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
      const c = spyOn(component.generalHistorySubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(a).toHaveBeenCalled();
      expect(b).toHaveBeenCalled();
      expect(c).toHaveBeenCalled();
      component.nurseMasterDataSubscription = null;
      component.beneficiaryDetailSubscription = null;
      component.generalHistorySubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    describe('getGeneralHistory', () => {
      it('patches form with FeedingHistory', () => {
        const fh = { typeOfFeed: 'Breast', compFeedStartAge: 6 };
        doctor.getGeneralHistoryDetails.and.returnValue(
          of({ statusCode: 200, data: { FeedingHistory: fh } })
        );
        component.getGeneralHistory('1', '2');
        expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('1', '2');
        expect(component.feedingHistoryData).toBe(fh);
        expect(form.value.typeOfFeed).toBe('Breast');
        expect(component.compFeedStartAge).toBe(6);
      });

      [
        null,
        { statusCode: 500, data: { FeedingHistory: {} } },
        { statusCode: 200, data: null },
        { statusCode: 200, data: {} },
      ].forEach((resp, i) => {
        it(`ignores unusable response #${i}`, () => {
          doctor.getGeneralHistoryDetails.and.returnValue(of(resp));
          component.getGeneralHistory('1', '2');
          expect(component.feedingHistoryData).toBeUndefined();
          expect(form.value.typeOfFeed).toBeNull();
        });
      });
    });

    it('getters and reset helpers', () => {
      form.patchValue({
        foodIntoleranceStatus: 'Yes',
        noOfCompFeedPerDay: 3,
        typeofFoodIntolerance: 'Milk',
      });
      expect(component.foodIntoleranceStatus).toBe('Yes');
      component.resetNoOfCompFeedPerDay();
      expect(form.value.noOfCompFeedPerDay).toBeNull();
      component.resetTypeofFoodIntolerance();
      expect(form.value.typeofFoodIntolerance).toBeNull();
    });

    describe('getPreviousFeedingHistory', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousFeedingHistory.and.returnValue(of({ data: payload }));
        component.getPreviousFeedingHistory();
        expect(nurse.getPreviousFeedingHistory).toHaveBeenCalledWith(
          '11',
          'General OPD'
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title:
              LANGUAGE_EN.historyData.Perinatalhistorydetails
                .developmentalhistorydetails,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousFeedingHistory.and.returnValue(
          of({ data: { data: [] } })
        );
        component.getPreviousFeedingHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
            .pastHistoryalert
        );
        expect(dialog.open).not.toHaveBeenCalled();
      });
      it('alerts when data null', () => {
        nurse.getPreviousFeedingHistory.and.returnValue(of({ data: null }));
        component.getPreviousFeedingHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts when response null', () => {
        nurse.getPreviousFeedingHistory.and.returnValue(of(null));
        component.getPreviousFeedingHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousFeedingHistory.and.returnValue(throwingObs());
        component.getPreviousFeedingHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });
  });

  describe('initial beneficiary', () => {
    beforeEach(async () => setup('new', { age: '1 years - 1 months' }));
    it('computes age on init', () => {
      expect(component.age).toBe(13);
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('loads history with session IDs when master data arrives', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { FeedingHistory: { typeOfFeed: 'F' } } })
      );
      master$.next({ a: 1 });
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(form.value.typeOfFeed).toBe('F');
    });
  });
});
