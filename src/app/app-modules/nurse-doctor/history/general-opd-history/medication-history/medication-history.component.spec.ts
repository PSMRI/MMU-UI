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
import { FormArray, FormControl, FormGroup } from '@angular/forms';
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
import { MedicationHistoryComponent } from './medication-history.component';

describe('MedicationHistoryComponent', () => {
  let component: MedicationHistoryComponent;
  let fixture: ComponentFixture<MedicationHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  async function setup(mode = 'new') {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ age: '2 years' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MedicationHistoryComponent],
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
      .overrideTemplate(MedicationHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(MedicationHistoryComponent);
    component = fixture.componentInstance;
    form = new FormGroup({ medicationHistoryList: new FormArray([]) });
    component.medicationHistoryForm = form;
    component.mode = mode;
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
  }

  const list = () =>
    component.medicationHistoryForm.controls[
      'medicationHistoryList'
    ] as FormArray;

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('initialises language, beneficiary and first row', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiary).toEqual({ age: '2 years' });
      expect(list().length).toBe(1);
      expect(list().at(0).get('timePeriodAgo')?.disabled).toBeTrue();
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('stores master data without fetching history', () => {
      master$.next({ a: 1 });
      expect(component.masterData).toEqual({ a: 1 });
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('1', '2');
      const spies = [
        component.nurseMasterDataSubscription,
        component.generalHistorySubscription,
        component.beneficiaryDetailSubscription,
      ].map(s => spyOn(s, 'unsubscribe'));
      component.ngOnDestroy();
      spies.forEach(s => expect(s).toHaveBeenCalled());
      component.nurseMasterDataSubscription = null;
      component.generalHistorySubscription = null;
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('getMedicationHistory returns controls or null', () => {
      expect(component.getMedicationHistory()?.length).toBe(1);
      component.medicationHistoryForm = new FormGroup({
        medicationHistoryList: new FormControl(null),
      });
      expect(component.getMedicationHistory()).toBeNull();
    });

    it('addMedicationHistory is safe without a form', () => {
      component.medicationHistoryForm = undefined as any;
      expect(() => component.addMedicationHistory()).not.toThrow();
    });

    it('createMedicationHistoryForm builds a one-row form', () => {
      component.createMedicationHistoryForm();
      expect(list().length).toBe(1);
      expect(component.medicationHistoryForm).not.toBe(form);
    });

    describe('removeMedicationHistory', () => {
      it('does nothing when cancelled', () => {
        confirm.confirm.and.returnValue(of(false));
        component.removeMedicationHistory(0, list().at(0));
        expect(form.dirty).toBeFalse();
      });

      it('clears the only row', () => {
        spyOn(console, 'log');
        list().at(0).patchValue({ currentMedication: 'x' });
        component.removeMedicationHistory(0, list().at(0));
        expect(confirm.confirm).toHaveBeenCalledWith(
          'warn',
          LANGUAGE_EN.alerts.info.warn
        );
        expect(list().length).toBe(1);
        expect(list().at(0).get('currentMedication')?.value).toBeNull();
        expect(form.dirty).toBeTrue();
      });

      it('removes a row and marks parent dirty', () => {
        spyOn(console, 'log');
        const parent = new FormGroup({ med: form });
        component.addMedicationHistory();
        component.removeMedicationHistory(1, list().at(1));
        expect(list().length).toBe(1);
        expect(parent.dirty).toBeTrue();
      });

      it('removes the only row when no form passed', () => {
        spyOn(console, 'log');
        component.removeMedicationHistory(0);
        expect(list().length).toBe(0);
      });
    });

    describe('getPreviousMedicationHistory', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousMedicationHistory.and.returnValue(
          of({ statusCode: 200, data: payload })
        );
        component.getPreviousMedicationHistory();
        expect(nurse.getPreviousMedicationHistory).toHaveBeenCalledWith(
          '11',
          'General OPD'
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title:
              LANGUAGE_EN.historyData.Medicationhistorydetails
                .previousmedicationhistorydetails,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousMedicationHistory.and.returnValue(
          of({ statusCode: 200, data: { data: [] } })
        );
        component.getPreviousMedicationHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.pastHistoryNot
        );
      });
      it('alerts on non-200', () => {
        nurse.getPreviousMedicationHistory.and.returnValue(
          of({ statusCode: 500, data: null })
        );
        component.getPreviousMedicationHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousMedicationHistory.and.returnValue(throwingObs());
        component.getPreviousMedicationHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });

    describe('validateDuration', () => {
      let row: any;
      beforeEach(() => {
        row = list().at(0);
        row.get('timePeriodAgo').enable();
      });

      it('enables unit when only duration given', () => {
        row.patchValue({ timePeriodAgo: 3 });
        component.validateDuration(row);
        expect(row.get('timePeriodUnit').enabled).toBeTrue();
        expect(confirm.alert).not.toHaveBeenCalled();
      });

      it('disables unit when duration empty', () => {
        row.get('timePeriodUnit').enable();
        component.validateDuration(row);
        expect(row.get('timePeriodUnit').disabled).toBeTrue();
      });

      it('accepts a duration within age', () => {
        row.get('timePeriodUnit').enable();
        row.patchValue({ timePeriodAgo: 1, timePeriodUnit: 'Years' });
        component.validateDuration(row);
        expect(confirm.alert).not.toHaveBeenCalled();
        expect(row.value.timePeriodAgo).toBe(1);
        expect(row.value.timePeriodUnit).toBe('Years');
      });

      it('rejects a duration greater than age', () => {
        row.get('timePeriodUnit').enable();
        row.patchValue({ timePeriodAgo: 5, timePeriodUnit: 'Years' });
        component.validateDuration(row);
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.durationGreaterThanAge
        );
        expect(row.value.timePeriodAgo).toBeNull();
        expect(row.value.timePeriodUnit).toBeNull();
        // unit toggling uses the pre-reset local values, so it stays enabled
        expect(row.get('timePeriodUnit').enabled).toBeTrue();
      });
    });

    it('checkValidity', () => {
      const row = list().at(0);
      expect(component.checkValidity(row)).toBeTrue();
      row.patchValue({
        currentMedication: 'm',
        timePeriodAgo: 1,
        timePeriodUnit: 'Days',
      });
      expect(component.checkValidity(row)).toBeFalse();
    });

    it('enableDuration toggles duration controls', () => {
      const row = list().at(0);
      row.patchValue({ currentMedication: 'm' });
      component.enableDuration(row);
      expect(row.get('timePeriodAgo')?.enabled).toBeTrue();
      row.patchValue({ currentMedication: null });
      row.get('timePeriodUnit')?.enable();
      component.enableDuration(row);
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
      expect(() => component.enableDuration()).not.toThrow();
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('fetches history and patches rows', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            MedicationHistory: {
              medicationHistoryList: [
                {
                  currentMedication: 'a',
                  timePeriodAgo: 2,
                  timePeriodUnit: 'Days',
                },
                {
                  currentMedication: 'b',
                  timePeriodAgo: null,
                  timePeriodUnit: null,
                },
              ],
            },
          },
        })
      );
      master$.next({ m: 1 });
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(list().length).toBe(2);
      expect(list().at(0).get('timePeriodAgo')?.enabled).toBeTrue();
      expect(list().at(0).value.timePeriodUnit).toBe('Days');
      expect(list().at(1).get('timePeriodAgo')?.disabled).toBeTrue();
      expect(list().at(1).get('currentMedication')?.value).toBe('b');
      expect(list().dirty).toBeTrue();
      expect(list().touched).toBeTrue();
    });

    it('ignores responses without MedicationHistory', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(of({ statusCode: 500 }));
      master$.next({ m: 1 });
      expect(component.medicationHistoryData).toBeUndefined();
    });
  });
});
