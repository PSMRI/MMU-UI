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
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { PhysicalActivityHistoryComponent } from './physical-activity-history.component';

describe('PhysicalActivityHistoryComponent', () => {
  let component: PhysicalActivityHistoryComponent;
  let fixture: ComponentFixture<PhysicalActivityHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  const master = {
    physicalActivity: [
      { pAID: 1, activityType: 'Vigorous', score: 0 },
      { pAID: 2, activityType: 'Sedentary', score: 30 },
    ],
  };

  async function setup(mode = 'new', session: any = {}) {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    idrs = autoSpy(IdrsscoreService, {}, undefined);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PhysicalActivityHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: '11', visitID: '22', ...session },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: IdrsscoreService, useValue: idrs },
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
      .overrideTemplate(PhysicalActivityHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    spyOn(console, 'log');
    fixture = TestBed.createComponent(PhysicalActivityHistoryComponent);
    component = fixture.componentInstance;
    form = new FormGroup({
      activityType: new FormControl(null),
      pAID: new FormControl(null),
      score: new FormControl(null),
    });
    component.physicalActivityHistoryForm = form;
    component.mode = mode;
    fixture.detectChanges();
  }

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('sets language and loads master questions', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.masterData).toBeUndefined();
      master$.next(master);
      expect(component.physicalActivityQuestions).toBe(master.physicalActivity);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('stores beneficiary age or 0', () => {
      ben$.next({ ageVal: 45 });
      expect(component.age).toBe(45);
      ben$.next({});
      expect(component.age).toBe(0);
    });

    it('calculateIDRSScore patches form and updates IDRS service', () => {
      master$.next(master);
      component.calculateIDRSScore({ value: 'Sedentary' }, form);
      expect(form.value.pAID).toBe(2);
      expect(form.value.score).toBe(30);
      expect(idrs.setIRDSscorePhysicalActivity).toHaveBeenCalledWith(30);
      expect(idrs.setIDRSScoreFlag).toHaveBeenCalled();
    });

    describe('getPreviousPhysicalActivityHistory', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data (visitType is never set)', () => {
        const payload = { data: [1] };
        nurse.getPreviousPhysicalActivityHistory.and.returnValue(
          of({ statusCode: 200, data: payload })
        );
        component.getPreviousPhysicalActivityHistory();
        expect(nurse.getPreviousPhysicalActivityHistory).toHaveBeenCalledWith(
          '11',
          undefined
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title: LANGUAGE_EN.previousPhyscialActivityHistoryDetails,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousPhysicalActivityHistory.and.returnValue(
          of({ statusCode: 200, data: { data: [] } })
        );
        component.getPreviousPhysicalActivityHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
            .pastHistoryalert
        );
      });
      it('alerts on non-200', () => {
        nurse.getPreviousPhysicalActivityHistory.and.returnValue(
          of({ statusCode: 500 })
        );
        component.getPreviousPhysicalActivityHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousPhysicalActivityHistory.and.returnValue(throwingObs());
        component.getPreviousPhysicalActivityHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });
  });

  describe('view mode, non-NCD visit', () => {
    beforeEach(async () => setup('view', { visitCategory: 'General OPD' }));

    it('does not fetch history', () => {
      master$.next(master);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });
  });

  describe('view mode, NCD screening', () => {
    beforeEach(async () => setup('view', { visitCategory: 'NCD screening' }));

    it('patches physical activity and sets IDRS score', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            FamilyHistory: {},
            PhysicalActivityHistory: { activityType: 'Sedentary', pAID: 2 },
          },
        })
      );
      master$.next(master);
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(form.value.activityType).toBe('Sedentary');
      expect(idrs.setIRDSscorePhysicalActivity).toHaveBeenCalledWith(30);
    });

    it('does not set score for unknown activity', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            FamilyHistory: {},
            PhysicalActivityHistory: { activityType: 'Unknown' },
          },
        })
      );
      master$.next(master);
      expect(form.value.activityType).toBe('Unknown');
      expect(idrs.setIRDSscorePhysicalActivity).not.toHaveBeenCalled();
    });

    it('skips when PhysicalActivityHistory is missing', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { FamilyHistory: {} } })
      );
      master$.next(master);
      expect(component.physicalActivityHistoryData).toBeUndefined();
      expect(form.value.activityType).toBeNull();
    });

    it('requires FamilyHistory to be present (current behaviour)', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { PhysicalActivityHistory: { activityType: 'Sedentary' } },
        })
      );
      master$.next(master);
      expect(form.value.activityType).toBeNull();
    });
  });

  describe('view mode without visit id', () => {
    beforeEach(async () =>
      setup('view', { visitCategory: 'NCD screening', visitID: null })
    );

    it('does not fetch history', () => {
      master$.next(master);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });
  });
});
