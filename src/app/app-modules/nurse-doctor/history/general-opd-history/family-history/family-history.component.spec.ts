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
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { FamilyHistoryComponent } from './family-history.component';

describe('General FamilyHistoryComponent', () => {
  let component: FamilyHistoryComponent;
  let fixture: ComponentFixture<FamilyHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let form: FormGroup;
  let D: any, H: any, NONE: any, OTHER: any;

  function masterData() {
    D = { diseaseType: 'Diabetes', snomedCode: 'd1', snomedTerm: 'dt' };
    H = { diseaseType: 'Hypertension', snomedCode: 'h1', snomedTerm: 'ht' };
    NONE = { diseaseType: 'None' };
    OTHER = { diseaseType: 'Other' };
    return {
      DiseaseTypes: [D, H, NONE, OTHER],
      familyMemberTypes: ['Mother', 'Father'],
    };
  }

  async function setup(mode = 'new') {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyHistoryComponent],
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
      .overrideTemplate(FamilyHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    fixture = TestBed.createComponent(FamilyHistoryComponent);
    component = fixture.componentInstance;
    form = new FormGroup({
      familyDiseaseList: new FormArray([]),
      geneticDisorder: new FormControl(null),
      isConsanguineousMarrige: new FormControl(null),
      isGeneticDisorder: new FormControl(null),
    });
    component.familyHistoryForm = form;
    component.mode = mode;
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
  }

  const list = () => form.controls['familyDiseaseList'] as FormArray;
  const names = (arr: any[]) => arr.map(a => a.diseaseType);

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('sets language and waits for master data', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(list().length).toBe(0);
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
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

    it('getFamilyDiseases returns controls or null', () => {
      expect(component.getFamilyDiseases()).toEqual([]);
      component.familyHistoryForm = new FormGroup({
        familyDiseaseList: new FormControl(null),
      });
      expect(component.getFamilyDiseases()).toBeNull();
    });

    it('addFamilyDisease without master list only pushes a row', () => {
      component.diseaseMasterData = null;
      component.addFamilyDisease();
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList.length).toBe(0);
      expect(list().at(0).get('familyMembers')?.disabled).toBeTrue();
    });

    describe('with master data', () => {
      beforeEach(() => master$.next(masterData()));

      it('stores master data and adds first row with all diseases', () => {
        expect(component.diseaseMasterData.length).toBe(4);
        expect(component.familyMemeberMasterData).toEqual(['Mother', 'Father']);
        expect(list().length).toBe(1);
        expect(component.diseaseSelectList[0].length).toBe(4);
        expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      });

      it('next row excludes None and already-selected, keeps Other', () => {
        list().at(0).patchValue({ diseaseType: D });
        component.addFamilyDisease();
        expect(names(component.diseaseSelectList[1])).toEqual([
          'Hypertension',
          'Other',
        ]);
        list().at(1).patchValue({ diseaseType: OTHER });
        component.addFamilyDisease();
        expect(names(component.diseaseSelectList[2])).toEqual([
          'Hypertension',
          'Other',
        ]);
      });

      it('filterFamilyDiseaseList patches snomed, removes from other lists and enables members', () => {
        component.addFamilyDisease();
        const row = list().at(0);
        component.filterFamilyDiseaseList(D, 0, row);
        expect(row.value.snomedCode).toBe('d1');
        expect(row.value.snomedTerm).toBe('dt');
        expect(row.get('familyMembers')?.enabled).toBeTrue();
        expect(component.diseaseSelectList[1]).not.toContain(D);
        expect(component.previousSelectedDiseaseList[0]).toBe(D);
      });

      it('filterFamilyDiseaseList returns previous value to other lists', () => {
        component.addFamilyDisease();
        const row = list().at(0);
        component.filterFamilyDiseaseList(D, 0, row);
        component.filterFamilyDiseaseList(H, 0, row);
        expect(component.diseaseSelectList[1]).toContain(D);
        expect(component.diseaseSelectList[1]).not.toContain(H);
      });

      it('filterFamilyDiseaseList with Other keeps other lists and snomed', () => {
        component.addFamilyDisease();
        const row = list().at(0);
        row.patchValue({ snomedCode: 'keep' });
        component.filterFamilyDiseaseList(OTHER, 0, row);
        expect(row.value.snomedCode).toBe('keep');
        expect(component.diseaseSelectList[1]).toContain(OTHER);
        component.filterFamilyDiseaseList(D, 0, row);
        expect(
          component.diseaseSelectList[1].filter((x: any) => x === OTHER).length
        ).toBe(1);
      });

      it('selecting None removes other rows and disables members', () => {
        component.addFamilyDisease();
        component.filterFamilyDiseaseList(H, 1, list().at(1));
        component.addFamilyDisease();
        const row = list().at(0);
        component.filterFamilyDiseaseList(NONE, 0, row);
        expect(list().length).toBe(1);
        expect(component.diseaseSelectList.length).toBe(1);
        expect(component.diseaseSelectList[0]).toContain(H);
        expect(row.get('familyMembers')?.disabled).toBeTrue();
      });

      it('filterFamilyDiseaseList works without a form', () => {
        component.filterFamilyDiseaseList(D, 0);
        expect(component.previousSelectedDiseaseList[0]).toBe(D);
      });

      describe('removeFamilyDisease', () => {
        it('does nothing when cancelled', () => {
          confirm.confirm.and.returnValue(of(false));
          component.removeFamilyDisease(0, list().at(0));
          expect(list().length).toBe(1);
          expect(form.dirty).toBeFalse();
        });

        it('resets the only row', () => {
          const row = list().at(0);
          row.patchValue({ diseaseType: D });
          component.removeFamilyDisease(0, row);
          expect(confirm.confirm).toHaveBeenCalledWith(
            'warn',
            LANGUAGE_EN.alerts.info.warn
          );
          expect(row.value.diseaseType).toBeNull();
          expect(list().length).toBe(1);
        });

        it('removes a row and returns its disease to other lists', () => {
          component.addFamilyDisease();
          component.filterFamilyDiseaseList(H, 1, list().at(1));
          expect(component.diseaseSelectList[0]).not.toContain(H);
          component.removeFamilyDisease(1, list().at(1));
          expect(list().length).toBe(1);
          expect(component.diseaseSelectList.length).toBe(1);
          expect(component.diseaseSelectList[0]).toContain(H);
          expect(form.dirty).toBeTrue();
        });

        it('removes a row without form or selection', () => {
          component.addFamilyDisease();
          component.removeFamilyDisease(1);
          expect(list().length).toBe(1);
        });
      });
    });

    describe('getPreviousFamilyHistory', () => {
      const info = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousFamilyHistory.and.returnValue(
          of({ statusCode: 200, data: payload })
        );
        component.getPreviousFamilyHistory();
        expect(nurse.getPreviousFamilyHistory).toHaveBeenCalledWith(
          '11',
          'General OPD'
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title: LANGUAGE_EN.historyData.familyhistory.previousfamilyhistory,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousFamilyHistory.and.returnValue(
          of({ statusCode: 200, data: { data: [] } })
        );
        component.getPreviousFamilyHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
            .pastHistoryalert
        );
      });
      it('alerts error on non-200', () => {
        nurse.getPreviousFamilyHistory.and.returnValue(of({ statusCode: 500 }));
        component.getPreviousFamilyHistory();
        expect(confirm.alert).toHaveBeenCalledWith(info(), 'error');
      });
      it('alerts error on failure', () => {
        nurse.getPreviousFamilyHistory.and.returnValue(throwingObs());
        component.getPreviousFamilyHistory();
        expect(confirm.alert).toHaveBeenCalledWith(info(), 'error');
      });
    });

    it('isGeneticDisorder getter and reset', () => {
      form.patchValue({ isGeneticDisorder: 'Yes', geneticDisorder: 'x' });
      expect(component.isGeneticDisorder).toBe('Yes');
      component.resetOtherGeneticOrder();
      expect(form.value.geneticDisorder).toBeNull();
    });

    it('sortDiseaseList sorts including equal items', () => {
      const l = [
        { diseaseType: 'b' },
        { diseaseType: 'a' },
        { diseaseType: 'b' },
      ];
      component.sortDiseaseList(l);
      expect(names(l)).toEqual(['a', 'b', 'b']);
    });

    it('checkValidity', () => {
      expect(component.checkValidity({ value: {} })).toBeTrue();
      expect(
        component.checkValidity({
          value: { diseaseType: 'a', familyMembers: ['m'] },
        })
      ).toBeFalse();
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('fetches and patches family history', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            FamilyHistory: {
              familyDiseaseList: [
                { diseaseType: 'Diabetes', familyMembers: ['Mother'] },
                { diseaseType: 'Unknown', otherDiseaseType: 'z' },
                { diseaseType: null },
              ],
              geneticDisorder: 'g',
              isConsanguineousMarrige: 'No',
              isGeneticDisorder: 'Yes',
            },
          },
        })
      );
      master$.next(masterData());
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(form.value.geneticDisorder).toBe('g');
      expect(form.value.isGeneticDisorder).toBe('Yes');
      expect(list().length).toBe(3);
      const first = list().at(0);
      expect(first.value.diseaseType).toBe(D);
      expect(first.get('familyMembers')?.enabled).toBeTrue();
      expect(first.dirty).toBeTrue();
      expect(list().at(1).value.diseaseType).toBe('Unknown');
      expect(list().at(2).value.diseaseType).toBeNull();
    });

    it('ignores response without FamilyHistory', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      master$.next(masterData());
      expect(component.familyHistoryData).toBeUndefined();
    });
  });
});
