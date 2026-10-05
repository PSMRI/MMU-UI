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
import { OtherVaccinesComponent } from './other-vaccines.component';

describe('OtherVaccinesComponent', () => {
  let component: OtherVaccinesComponent;
  let fixture: ComponentFixture<OtherVaccinesComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;
  let BCG: any, MMR: any, OTHER: any;

  function masterData() {
    BCG = { vaccineName: 'BCG', sctCode: 'b1', sctTerm: 'bt' };
    MMR = { vaccineName: 'MMR', sctCode: null, sctTerm: null };
    OTHER = { vaccineName: 'Other', sctCode: null };
    return { vaccineMasterData: [BCG, MMR, OTHER] };
  }

  async function setup(mode = 'new') {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [OtherVaccinesComponent],
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
      .overrideTemplate(OtherVaccinesComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(OtherVaccinesComponent);
    component = fixture.componentInstance;
    form = new FormGroup({ otherVaccines: new FormArray([]) });
    component.otherVaccinesForm = form;
    component.mode = mode;
    component.visitCategory = 'PNC';
    fixture.detectChanges();
  }

  const list = () => form.controls['otherVaccines'] as FormArray;
  const names = (a: any[]) => a.map(x => x.vaccineName);

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('initialises language and beneficiary', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      ben$.next({ ageVal: 3 });
      expect(component.beneficiary).toEqual({ ageVal: 3 });
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(list().length).toBe(0);
    });

    it('ngOnDestroy unsubscribes all', () => {
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

    it('getOtherVaccines returns controls or null', () => {
      expect(component.getOtherVaccines()).toEqual([]);
      component.otherVaccinesForm = new FormGroup({
        otherVaccines: new FormControl(null),
      });
      expect(component.getOtherVaccines()).toBeNull();
    });

    it('addOtherVaccine without master data pushes empty select list', () => {
      component.vaccineMasterData = null as any;
      component.addOtherVaccine();
      expect(component.vaccineSelectList).toEqual([[]]);
      expect(list().length).toBe(1);
    });

    describe('with master data', () => {
      beforeEach(() => master$.next(masterData()));

      it('adds first row with all vaccines', () => {
        expect(component.masterData.vaccineMasterData.length).toBe(3);
        expect(list().length).toBe(1);
        expect(component.vaccineSelectList[0].length).toBe(3);
        expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      });

      it('next row excludes selected (but not Other)', () => {
        list().at(0).patchValue({ vaccineName: BCG });
        component.addOtherVaccine();
        expect(names(component.vaccineSelectList[1])).toEqual(['MMR', 'Other']);
        list().at(1).patchValue({ vaccineName: OTHER });
        component.addOtherVaccine();
        expect(names(component.vaccineSelectList[2])).toEqual(['MMR', 'Other']);
      });

      it('filterOtherVaccineList patches sct codes and removes from others', () => {
        component.addOtherVaccine();
        const row = list().at(0);
        row.patchValue({ otherVaccineName: 'x' });
        component.filterOtherVaccineList({ value: BCG }, 0, row);
        expect(row.value.sctCode).toBe('b1');
        expect(row.value.sctTerm).toBe('bt');
        expect(row.value.otherVaccineName).toBeNull();
        expect(component.vaccineSelectList[1]).not.toContain(BCG);
        expect(component.previousSelectedVaccineList[0]).toBe(BCG);
      });

      it('null sct code clears codes and previous value is restored', () => {
        component.addOtherVaccine();
        const row = list().at(0);
        component.filterOtherVaccineList({ value: BCG }, 0, row);
        component.filterOtherVaccineList({ value: MMR }, 0, row);
        expect(row.value.sctCode).toBeNull();
        expect(row.value.sctTerm).toBeNull();
        expect(component.vaccineSelectList[1]).toContain(BCG);
        expect(component.vaccineSelectList[1]).not.toContain(MMR);
      });

      it('Other leaves form untouched and is not restored twice', () => {
        component.addOtherVaccine();
        const row = list().at(0);
        row.patchValue({ sctCode: 'keep' });
        component.filterOtherVaccineList({ value: OTHER }, 0, row);
        expect(row.value.sctCode).toBe('keep');
        component.filterOtherVaccineList({ value: BCG }, 0);
        expect(
          component.vaccineSelectList[1].filter((v: any) => v === OTHER).length
        ).toBe(1);
      });

      describe('removeOtherVaccine', () => {
        it('does nothing when cancelled', () => {
          confirm.confirm.and.returnValue(of(false));
          component.removeOtherVaccine(0, list().at(0));
          expect(list().length).toBe(1);
        });

        it('resets the only row', () => {
          const row = list().at(0);
          row.patchValue({ vaccineName: BCG });
          component.removeOtherVaccine(0, row);
          expect(confirm.confirm).toHaveBeenCalledWith(
            'warn',
            LANGUAGE_EN.alerts.info.warn
          );
          expect(row.value.vaccineName).toBeNull();
        });

        it('removes row and restores vaccine elsewhere', () => {
          component.addOtherVaccine();
          component.filterOtherVaccineList({ value: MMR }, 1, list().at(1));
          component.removeOtherVaccine(1, list().at(1));
          expect(list().length).toBe(1);
          expect(component.vaccineSelectList.length).toBe(1);
          expect(component.vaccineSelectList[0]).toContain(MMR);
          expect(form.dirty).toBeTrue();
        });

        it('removes row without selection or form', () => {
          component.addOtherVaccine();
          component.removeOtherVaccine(1);
          expect(list().length).toBe(1);
        });
      });

      it('handleOtherVaccinesData throws for non-null vaccine (passes object, reads .value)', () => {
        component.otherVaccineData = {
          childOptionalVaccineList: [{ vaccineName: 'BCG' }],
        };
        expect(() => component.handleOtherVaccinesData()).toThrowError(
          TypeError
        );
      });
    });

    describe('getPreviousOtherVaccineDetails', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousOtherVaccines.and.returnValue(
          of({ statusCode: 200, data: payload })
        );
        component.getPreviousOtherVaccineDetails();
        expect(nurse.getPreviousOtherVaccines).toHaveBeenCalledWith(
          '11',
          'PNC'
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: { dataList: payload, title: LANGUAGE_EN.common.prevVaccine },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousOtherVaccines.and.returnValue(
          of({ statusCode: 200, data: { data: [] } })
        );
        component.getPreviousOtherVaccineDetails();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.pastHistoryNot
        );
      });
      it('alerts on non-200', () => {
        nurse.getPreviousOtherVaccines.and.returnValue(of({ statusCode: 500 }));
        component.getPreviousOtherVaccineDetails();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousOtherVaccines.and.returnValue(throwingObs());
        component.getPreviousOtherVaccineDetails();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });

    describe('validateAge', () => {
      it('rejects age above beneficiary age', () => {
        ben$.next({ ageVal: 2 });
        const g = new FormGroup({ actualReceivingAge: new FormControl(5) });
        component.validateAge(g);
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.ageOfReceivingVaccine
        );
        expect(g.value.actualReceivingAge).toBeNull();
      });
      it('accepts valid age or missing beneficiary', () => {
        const g = new FormGroup({ actualReceivingAge: new FormControl(5) });
        component.validateAge(g);
        ben$.next({ ageVal: 10 });
        component.validateAge(g);
        expect(confirm.alert).not.toHaveBeenCalled();
        expect(g.value.actualReceivingAge).toBe(5);
      });
    });

    it('sortOtherVaccineList sorts with equal items', () => {
      const l = [
        { vaccineName: 'b' },
        { vaccineName: 'a' },
        { vaccineName: 'b' },
      ];
      component.sortOtherVaccineList(l);
      expect(names(l)).toEqual(['a', 'b', 'b']);
    });

    it('checkValidity', () => {
      expect(
        component.checkValidity({ value: { vaccineName: 'a' } })
      ).toBeTrue();
      expect(
        component.checkValidity({
          value: {
            vaccineName: 'a',
            actualReceivingAge: 1,
            receivedFacilityName: 'f',
          },
        })
      ).toBeFalse();
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('fetches history and adds a row per entry', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            childOptionalVaccineHistory: {
              childOptionalVaccineList: [
                { vaccineName: null },
                { vaccineName: null },
              ],
            },
          },
        })
      );
      master$.next(masterData());
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(component.otherVaccineData).toBeDefined();
      expect(list().length).toBe(2);
    });

    it('ignores response without vaccine history', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      master$.next(masterData());
      expect(component.otherVaccineData).toBeUndefined();
      expect(list().length).toBe(1);
    });
  });
});
