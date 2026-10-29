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
import { DevelopmentHistoryComponent } from './development-history.component';

describe('DevelopmentHistoryComponent', () => {
  let component: DevelopmentHistoryComponent;
  let fixture: ComponentFixture<DevelopmentHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let form: FormGroup;

  async function setup(mode = 'new') {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DevelopmentHistoryComponent],
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
      .overrideTemplate(DevelopmentHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    spyOn(console, 'log');
    fixture = TestBed.createComponent(DevelopmentHistoryComponent);
    component = fixture.componentInstance;
    form = new FormGroup({
      grossMotorMilestones: new FormControl(null),
      isGrossMotorMilestones: new FormControl(null),
    });
    component.developmentHistoryForm = form;
    component.mode = mode;
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
  }

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('sets language and stores master data without loading history', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.masterData).toBeUndefined();
      const m = { a: 1 };
      master$.next(m);
      expect(component.masterData).toBe(m);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngOnDestroy unsubscribes when present and tolerates nulls', () => {
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

    describe('getGeneralHistory', () => {
      it('patches form with DevelopmentHistory', () => {
        const dh = { grossMotorMilestones: 'x', isGrossMotorMilestones: true };
        doctor.getGeneralHistoryDetails.and.returnValue(
          of({ statusCode: 200, data: { DevelopmentHistory: dh } })
        );
        component.getGeneralHistory('1', '2');
        expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('1', '2');
        expect(component.developmentHistoryData).toBe(dh);
        expect(form.value).toEqual(dh);
      });

      [
        null,
        { statusCode: 500, data: { DevelopmentHistory: {} } },
        { statusCode: 200, data: null },
        { statusCode: 200, data: {} },
      ].forEach((resp, i) => {
        it(`ignores unusable response #${i}`, () => {
          doctor.getGeneralHistoryDetails.and.returnValue(of(resp));
          component.getGeneralHistory('1', '2');
          expect(component.developmentHistoryData).toBeUndefined();
          expect(form.value.grossMotorMilestones).toBeNull();
        });
      });
    });

    describe('getPreviousDevelopmentalHistory', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousDevelopmentalHistory.and.returnValue(
          of({ data: payload })
        );
        component.getPreviousDevelopmentalHistory();
        expect(nurse.getPreviousDevelopmentalHistory).toHaveBeenCalledWith(
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
        nurse.getPreviousDevelopmentalHistory.and.returnValue(
          of({ data: { data: [] } })
        );
        component.getPreviousDevelopmentalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
            .pastHistoryalert
        );
        expect(dialog.open).not.toHaveBeenCalled();
      });
      it('alerts when data null', () => {
        nurse.getPreviousDevelopmentalHistory.and.returnValue(
          of({ data: null })
        );
        component.getPreviousDevelopmentalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts when response null', () => {
        nurse.getPreviousDevelopmentalHistory.and.returnValue(of(null));
        component.getPreviousDevelopmentalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousDevelopmentalHistory.and.returnValue(throwingObs());
        component.getPreviousDevelopmentalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('loads history with session IDs when master data arrives', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { DevelopmentHistory: { grossMotorMilestones: 'g' } },
        })
      );
      master$.next({ a: 1 });
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(form.value.grossMotorMilestones).toBe('g');
    });
  });
});
