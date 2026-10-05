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
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { FamilyDiseaseHistoryComponent } from './family-disease-history.component';

describe('Cancer FamilyDiseaseHistoryComponent', () => {
  let component: FamilyDiseaseHistoryComponent;
  let fixture: ComponentFixture<FamilyDiseaseHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;
  let A: any, B: any, OTHER: any;
  let members: any[];

  function masterData() {
    A = {
      cancerDiseaseType: 'Breast',
      gender: 'female',
      snomedCode: '1',
      snomedTerm: 'breast',
    };
    B = {
      cancerDiseaseType: 'Oral',
      gender: 'unisex',
      snomedCode: '2',
      snomedTerm: 'oral',
    };
    OTHER = { cancerDiseaseType: 'Any other Cancer', gender: 'unisex' };
    members = [
      { name: 'Mother', gender: 'female' },
      { name: 'Father', gender: 'male' },
    ];
    return { CancerDiseaseType: [A, OTHER, B], familyMemberTypes: members };
  }

  async function setup(mode = 'new') {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyDiseaseHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: '5',
            visitID: '6',
            serviceLineDetails: JSON.stringify({
              vanID: 1,
              parkingPlaceID: 2,
            }),
          },
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
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FamilyDiseaseHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(FamilyDiseaseHistoryComponent);
    component = fixture.componentInstance;
    form = new FormGroup({
      diseases: new FormArray([component.formUtils.initDiseases()]),
    });
    component.cancerPatientFamilyMedicalHistoryForm = form;
    component.mode = mode;
    fixture.detectChanges();
  }

  const diseases = () => form.controls['diseases'] as FormArray;

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('ignores null master data and does not fetch history', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.templateNurseMasterData).toBeUndefined();
      expect(doctor.getCancerHistoryDetails).not.toHaveBeenCalled();
    });

    it('maps master data into template lists', () => {
      const m = masterData();
      master$.next(m);
      expect(component.templateCancerDiseaseType).toBe(m.CancerDiseaseType);
      expect(component.filterCancerDiseaseType).toEqual(m.CancerDiseaseType);
      expect(component.templateFamilyMemberType).toBe(members);
      expect(component.filterFamilyMemebers).toBe(members);
      expect(component.temp[0].diseaseType).toEqual(m.CancerDiseaseType);
      expect(doctor.getCancerHistoryDetails).not.toHaveBeenCalled();
    });

    it('logs beneficiary details when present', () => {
      spyOn(console, 'log');
      ben$.next({ ageVal: 3 });
      expect(console.log).toHaveBeenCalledWith('beneficiary', { ageVal: 3 });
    });

    it('getDiseases returns controls or null', () => {
      expect(component.getDiseases()?.length).toBe(1);
      component.cancerPatientFamilyMedicalHistoryForm = new FormGroup({
        diseases: new FormControl(null),
      });
      expect(component.getDiseases()).toBeNull();
    });

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngOnDestroy unsubscribes all active subscriptions', () => {
      doctor.getCancerHistoryDetails.and.returnValue(of({ statusCode: 500 }));
      master$.next(masterData());
      component.getCancerHistory('5', '6');
      const subs = [
        component.nurseMasterDataSubscription,
        component.beneficiaryDetailSubscription,
        component.cancerHistorySubscription,
      ].map(s => spyOn(s, 'unsubscribe'));
      component.ngOnDestroy();
      subs.forEach(s => expect(s).toHaveBeenCalled());
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      component.nurseMasterDataSubscription = null;
      component.beneficiaryDetailSubscription = null;
      component.cancerHistorySubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    describe('with master data', () => {
      beforeEach(() => master$.next(masterData()));

      it('filterFamilyMember patches snomed and removes type from other rows', () => {
        component.addFamilyDisease();
        const row = diseases().at(0);
        component.filterFamilyMember(A, 0, row);
        expect(row.value.snomedCode).toBe('1');
        expect(row.value.snomedTerm).toBe('breast');
        expect(component.temp[1].diseaseType).not.toContain(A);
        expect(component.temp[0].familyMembers).toEqual([members[0]]);
        expect(component.previousValue[0]).toBe(A);
      });

      it('filterFamilyMember re-adds previous value to other rows', () => {
        component.addFamilyDisease();
        const row = diseases().at(0);
        component.filterFamilyMember(A, 0, row);
        component.filterFamilyMember(B, 0, row);
        expect(component.temp[1].diseaseType).toContain(A);
        expect(component.temp[1].diseaseType).not.toContain(B);
        expect(
          component.temp[1].diseaseType.map((d: any) => d.cancerDiseaseType)
        ).toEqual(['Any other Cancer', 'Breast']);
        expect(component.temp[0].familyMembers).toEqual(members);
      });

      it('filterFamilyMember clears snomed for Any other Cancer', () => {
        const row = diseases().at(0);
        row.patchValue({ snomedCode: 'x', snomedTerm: 'y' });
        component.filterFamilyMember(OTHER, 0, row);
        expect(row.value.snomedCode).toBeNull();
        expect(row.value.snomedTerm).toBeNull();
      });

      it('filterFamilyMember without a form only filters members', () => {
        component.filterFamilyMember(A, 0);
        expect(component.filterFamilyMemebers).toEqual([members[0]]);
      });

      it('addFamilyDisease excludes already-selected types', () => {
        diseases().at(0).patchValue({ cancerDiseaseType: A });
        component.addFamilyDisease();
        expect(diseases().length).toBe(2);
        expect(component.temp[1].diseaseType).toEqual([OTHER, B]);
      });

      it('addFamilyDisease keeps Any other Cancer available', () => {
        diseases().at(0).patchValue({ cancerDiseaseType: OTHER });
        component.addFamilyDisease();
        expect(component.temp[1].diseaseType).toEqual([A, OTHER, B]);
      });

      describe('removeDisease', () => {
        it('does nothing when not confirmed', () => {
          confirm.confirm.and.returnValue(of(false));
          component.addFamilyDisease();
          component.removeDisease(1, diseases().at(1));
          expect(confirm.confirm).toHaveBeenCalledWith(
            'warn',
            LANGUAGE_EN.alerts.info.warn
          );
          expect(diseases().length).toBe(2);
        });

        it('resets the only row', () => {
          const row = diseases().at(0);
          row.patchValue({ cancerDiseaseType: A, familyMemberList: ['x'] });
          component.removeDisease(0, row);
          expect(row.value.cancerDiseaseType).toBeNull();
          expect(row.value.familyMemberList).toBeNull();
          expect(diseases().length).toBe(1);
        });

        it('removes row and restores its type to other lists', () => {
          component.addFamilyDisease();
          const row = diseases().at(1);
          row.patchValue({ cancerDiseaseType: A });
          component.filterFamilyMember(A, 1, row);
          expect(component.temp[0].diseaseType).not.toContain(A);
          component.removeDisease(1, row);
          expect(diseases().length).toBe(1);
          expect(component.temp.length).toBe(1);
          expect(component.temp[0].diseaseType).toContain(A);
        });

        it('removes a row without selected type', () => {
          component.addFamilyDisease();
          component.removeDisease(1, diseases().at(1));
          expect(diseases().length).toBe(1);
        });

        it('removes an Any-other row without touching lists', () => {
          component.addFamilyDisease();
          diseases().at(1).patchValue({ cancerDiseaseType: OTHER });
          const before = component.temp[0].diseaseType.slice();
          component.removeDisease(1, diseases().at(1));
          expect(component.temp[0].diseaseType).toEqual(before);
          expect(diseases().length).toBe(1);
        });
      });
    });

    it('sortDiseaseList orders by type and handles equals', () => {
      const list = [
        { cancerDiseaseType: 'b' },
        { cancerDiseaseType: 'a' },
        { cancerDiseaseType: 'b' },
      ];
      component.sortDiseaseList(list);
      expect(list.map(l => l.cancerDiseaseType)).toEqual(['a', 'b', 'b']);
    });

    it('checkValidity is false only when type and members are set', () => {
      expect(component.checkValidity({ value: null })).toBeTrue();
      expect(
        component.checkValidity({ value: { cancerDiseaseType: 'a' } })
      ).toBeTrue();
      expect(
        component.checkValidity({
          value: { cancerDiseaseType: 'a', familyMemberList: ['m'] },
        })
      ).toBeFalse();
    });

    describe('getPreviousCancerFamilyHistory', () => {
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousCancerFamilyHistory.and.returnValue(
          of({ data: payload })
        );
        component.getPreviousCancerFamilyHistory();
        expect(nurse.getPreviousCancerFamilyHistory).toHaveBeenCalledWith('5');
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title: LANGUAGE_EN.common.prevFamilyHistory,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousCancerFamilyHistory.and.returnValue(
          of({ data: { data: [] } })
        );
        component.getPreviousCancerFamilyHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.previousInfo
        );
      });
      it('alerts errorStatus when data null', () => {
        nurse.getPreviousCancerFamilyHistory.and.returnValue(
          of({ data: null, errorStatus: 'bad' })
        );
        component.getPreviousCancerFamilyHistory();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousCancerFamilyHistory.and.returnValue(throwingObs('e'));
        component.getPreviousCancerFamilyHistory();
        expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      });
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('fetches and patches cancer family history', () => {
      doctor.getCancerHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benFamilyHistory: [
              { cancerDiseaseType: 'Breast', familyMemberList: ['Mother'] },
              { cancerDiseaseType: 'Custom' },
              { cancerDiseaseType: null },
            ],
          },
        })
      );
      master$.next(masterData());
      expect(doctor.getCancerHistoryDetails).toHaveBeenCalledWith('5', '6');
      expect(diseases().length).toBe(3);
      expect(diseases().at(0).value.cancerDiseaseType).toBe(A);
      expect(diseases().at(0).value.familyMemberList).toEqual(['Mother']);
      expect(diseases().at(0).touched).toBeTrue();
      expect(diseases().at(1).value.cancerDiseaseType).toBe(OTHER);
      expect(diseases().at(1).value.otherDiseaseType).toBe('Custom');
      expect(diseases().at(2).value.cancerDiseaseType).toBeNull();
    });

    it('ignores non-200 history', () => {
      doctor.getCancerHistoryDetails.and.returnValue(of({ statusCode: 500 }));
      master$.next(masterData());
      expect(component.familyHistoryData).toBeUndefined();
      expect(diseases().length).toBe(1);
    });
  });
});
