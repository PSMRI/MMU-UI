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
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
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
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { FamilyHistoryNcdscreeningComponent } from './family-history-ncdscreening.component';

describe('FamilyHistoryNcdscreeningComponent', () => {
  let component: FamilyHistoryNcdscreeningComponent;
  let fixture: ComponentFixture<FamilyHistoryNcdscreeningComponent>;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let m: any[];

  const diseases = () => [
    { diseaseType: 'Asthma', snomedCode: '195967001', snomedTerm: 'Asthma' },
    { diseaseType: 'Diabetes Mellitus', snomedCode: null, snomedTerm: null },
    { diseaseType: 'Nil', snomedCode: null },
    { diseaseType: 'None', snomedCode: null },
    { diseaseType: 'Other', snomedCode: null },
  ];
  const list = () =>
    component.familyHistoryForm.controls['familyDiseaseList'] as FormArray;

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    idrs = autoSpy(
      IdrsscoreService,
      {
        dummyValue$: new BehaviorSubject<any>('dummy').asObservable(),
        IDRSFamilyScore$: new BehaviorSubject<any>(5).asObservable(),
      },
      undefined
    );
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ ageVal: 40 });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [FamilyHistoryNcdscreeningComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        FormBuilder,
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: IdrsscoreService, useValue: idrs },
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
    fixture = TestBed.createComponent(FamilyHistoryNcdscreeningComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    component.familyHistoryForm = new FormGroup({
      familyDiseaseList: new FormArray([]),
      isGeneticDisorder: new FormControl(null),
      geneticDisorder: new FormControl(null),
      isConsanguineousMarrige: new FormControl(null),
    });
    spyOn(console, 'log');
  });

  afterEach(() => component.ngOnDestroy());

  describe('initialisation', () => {
    it('subscribes to idrs streams, language and beneficiary', () => {
      fixture.detectChanges();
      expect(idrs.clearMessage).toHaveBeenCalled();
      expect(component.dummyValue).toBe('dummy');
      expect(component.idrsscoredummy).toBe(5);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.age).toBe(40);
      ben$.next({ ageVal: 0 });
      expect(component.age).toBe(0);
      ben$.next({});
      expect(component.age).toBe(0);
      ben$.next({ ageVal: 12 });
      ben$.next(null);
      expect(component.age).toBe(12);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('adds the first disease row when master data arrives', () => {
      fixture.detectChanges();
      expect(list().length).toBe(0);
      master$.next({ DiseaseTypes: diseases(), familyMemberTypes: ['Father'] });
      fixture.detectChanges();
      expect(component.familyMemeberMasterData).toEqual(['Father']);
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList[0].length).toBe(5);
      expect(list().at(0).get('familyMembers')?.disabled).toBeTrue();
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      expect(component.getFamilyDiseases()?.length).toBe(1);
      component.familyHistoryForm = new FormGroup({
        isGeneticDisorder: new FormControl(null),
      });
      expect(component.getFamilyDiseases()).toBeNull();
    });
  });

  describe('view mode', () => {
    it('patches saved family history and computes IDRS score', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            FamilyHistory: {
              familyDiseaseList: [
                {
                  ID: 1,
                  deleted: false,
                  diseaseType: 'Diabetes Mellitus',
                  familyMembers: ['Father', 'Mother'],
                },
                { ID: 2, deleted: false, diseaseType: 'Unknown' },
                { ID: 3, deleted: false, diseaseType: '' },
              ],
            },
          },
        })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next({ DiseaseTypes: diseases(), familyMemberTypes: [] });
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(list().length).toBe(3);
      const r0 = list().at(0);
      expect(r0.value.diseaseType.diseaseType).toBe('Diabetes Mellitus');
      expect(r0.get('familyMembers')?.enabled).toBeTrue();
      expect(r0.dirty).toBeTrue();
      expect(list().at(1).get('familyMembers')?.enabled).toBeTrue();
      expect(list().at(2).dirty).toBeFalse();
      expect(idrs.setdymmyvalue).toHaveBeenCalledWith('Diabetes Mellitus');
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(20);
    });

    it('ignores empty or failed history', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next({ DiseaseTypes: diseases() });
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('b1', 'v1');
      expect(component.familyHistoryData).toBeUndefined();
      expect(list().length).toBe(1);
    });
  });

  describe('with master data', () => {
    beforeEach(() => {
      fixture.detectChanges();
      master$.next({ DiseaseTypes: diseases(), familyMemberTypes: [] });
      m = component.diseaseMasterData;
    });

    it('addFamilyDisease excludes selected and None/Nil; tolerates no master', () => {
      list().at(0).patchValue({ diseaseType: m[0] });
      component.addFamilyDisease();
      expect(
        component.diseaseSelectList[1].map((d: any) => d.diseaseType)
      ).toEqual(['Diabetes Mellitus', 'Other']);
      list().at(1).patchValue({ diseaseType: m[4] });
      component.addFamilyDisease();
      expect(component.diseaseSelectList[2].length).toBe(2);
      component.diseaseMasterData = null;
      component.addFamilyDisease();
      expect(component.diseaseSelectList.length).toBe(3);
      expect(list().length).toBe(4);
    });

    it('addFamilyDiseaseTest re-offers deleted diseases and sorts new list', () => {
      component.addFamilyDisease();
      list().at(0).patchValue({ diseaseType: m[0], deleted: true });
      list().at(1).patchValue({ diseaseType: m[1], deleted: false });
      component.addFamilyDiseaseTest(1);
      expect(list().length).toBe(3);
      expect(
        component.diseaseSelectList[2].map((d: any) => d.diseaseType)
      ).toEqual(['Asthma', 'Nil', 'None', 'Other']);
    });

    it('addFamilyDiseaseTest does not re-offer deleted disease still in use', () => {
      component.addFamilyDisease();
      component.addFamilyDisease();
      list().at(0).patchValue({ diseaseType: m[0], deleted: true });
      list().at(1).patchValue({ diseaseType: m[0], deleted: false });
      list().at(2).patchValue({ diseaseType: m[4], deleted: false });
      component.addFamilyDiseaseTest(2);
      expect(
        component.diseaseSelectList[3].map((d: any) => d.diseaseType)
      ).toEqual(['Diabetes Mellitus', 'Nil', 'None', 'Other']);
      component.diseaseMasterData = null;
      component.addFamilyDiseaseTest(3);
      expect(list().length).toBe(5);
      expect(component.diseaseSelectList.length).toBe(4);
    });

    it('filterFamilyDiseaseList with snomed code patches snomed and enables members', () => {
      component.addFamilyDisease();
      const row = list().at(0);
      row.patchValue({ otherDiseaseType: 'x' });
      component.filterFamilyDiseaseList(m[0], 0, row);
      expect(idrs.setdymmyvalue).toHaveBeenCalledWith('Asthma');
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
      expect(row.value.snomedCode).toBe('195967001');
      expect(row.value.snomedTerm).toBe('Asthma');
      expect(row.value.otherDiseaseType).toBeNull();
      expect(row.get('familyMembers')?.enabled).toBeTrue();
      expect(component.diseaseSelectList[1]).not.toContain(m[0]);
      expect(component.previousSelectedDiseaseList[0]).toBe(m[0]);
    });

    it('filterFamilyDiseaseList without snomed / Other clears snomed; returns previous', () => {
      component.addFamilyDisease();
      const row = list().at(0);
      component.filterFamilyDiseaseList(m[0], 0, row);
      row.patchValue({ diseaseType: m[1] });
      component.filterFamilyDiseaseList(m[1], 0, row);
      expect(row.value.snomedCode).toBeNull();
      expect(component.diabetesPresent).toBeTrue();
      expect(component.diseaseSelectList[1]).toContain(m[0]);
      row.patchValue({ diseaseType: m[4] });
      component.filterFamilyDiseaseList(m[4], 0, row);
      expect(row.value.snomedTerm).toBeNull();
      expect(component.diabetesPresent).toBeFalse();
      expect(component.diseaseSelectList[1]).toContain(m[4]);
      const len = component.diseaseSelectList[1].length;
      component.filterFamilyDiseaseList(m[0], 0);
      expect(component.diseaseSelectList[1].length).toBe(len - 1);
    });

    it('filterFamilyDiseaseList None/Nil removes other rows and disables members', () => {
      component.addFamilyDisease();
      component.addFamilyDisease();
      component.previousSelectedDiseaseList = [undefined, m[0], undefined];
      const row = list().at(0);
      row.get('familyMembers')?.enable();
      component.filterFamilyDiseaseList(m[3], 0, row);
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList[0]).toContain(m[0]);
      expect(row.get('familyMembers')?.disabled).toBeTrue();
      component.filterFamilyDiseaseList(m[2], 0);
      expect(component.previousSelectedDiseaseList[0]).toBe(m[2]);
    });

    it('removeFamilyDisease cancelled does nothing', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeFamilyDisease(0, list().at(0));
      expect(list().length).toBe(1);
      expect(component.familyHistoryForm.dirty).toBeFalse();
    });

    it('removeFamilyDisease single unsaved row resets it and clears DM score', () => {
      const row = list().at(0);
      row.patchValue({ diseaseType: m[1] });
      component.previousSelectedDiseaseList = [m[1]];
      component.removeFamilyDisease(0, row);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(row.value.diseaseType).toBeNull();
      expect(row.value.deleted).toBeFalse();
      expect(component.diabetesPresent).toBeFalse();
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
    });

    it('removeFamilyDisease single unsaved non-DM row does not reset score', () => {
      component.previousSelectedDiseaseList = [m[0]];
      component.removeFamilyDisease(0, list().at(0));
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
      expect(list().length).toBe(1);
    });

    it('removeFamilyDisease single saved row adds a fresh row', () => {
      list().at(0).patchValue({ ID: 9, diseaseType: m[1] });
      component.previousSelectedDiseaseList = [m[1]];
      component.removeFamilyDisease(0, list().at(0));
      expect(list().length).toBe(2);
      expect(component.diseaseSelectList[1]).toBe(component.diseaseMasterData);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
      idrs.setIDRSFamilyScore.calls.reset();
      // non-DM saved single row
      component.familyHistoryForm.setControl(
        'familyDiseaseList',
        new FormArray([component.initFamilyDiseaseList()])
      );
      list().at(0).patchValue({ ID: 4 });
      component.previousSelectedDiseaseList = [m[0]];
      component.removeFamilyDisease(0, list().at(0));
      expect(list().length).toBe(2);
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
    });

    it('removeFamilyDisease unsaved row among many removes it and returns value', () => {
      component.addFamilyDisease();
      component.previousSelectedDiseaseList = [m[0], m[1]];
      component.diseaseSelectList = [[m[0]], [m[1]]];
      component.removeFamilyDisease(1, list().at(1));
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList).toEqual([[m[0], m[1]]]);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
    });

    it('removeFamilyDisease Other row among many does not return it', () => {
      component.addFamilyDisease();
      component.previousSelectedDiseaseList = [m[0], m[4]];
      component.diseaseSelectList = [[m[0]], [m[4]]];
      component.removeFamilyDisease(1);
      expect(component.diseaseSelectList).toEqual([[m[0]]]);
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
    });

    it('removeFamilyDisease saved rows are flagged deleted; last one adds a fresh row', () => {
      component.addFamilyDisease();
      list().at(0).patchValue({ ID: 3 });
      list().at(1).patchValue({ ID: 7 });
      component.previousSelectedDiseaseList = [m[0], m[1]];
      component.removeFamilyDisease(1, list().at(1));
      expect(list().length).toBe(2);
      expect(component.diseaseSelectList[1]).toEqual([]);
      component.removeFamilyDisease(0, list().at(0));
      expect(list().length).toBe(3);
      expect(component.diseaseSelectList[2]).toBe(component.diseaseMasterData);
    });

    it('checkValidity requires disease and family members', () => {
      const g: any = component.initFamilyDiseaseList();
      expect(component.checkValidity(g)).toBeTrue();
      g.get('familyMembers').enable();
      g.patchValue({ diseaseType: m[0], familyMembers: ['Father'] });
      expect(component.checkValidity(g)).toBeFalse();
    });
  });

  describe('misc', () => {
    beforeEach(() => fixture.detectChanges());

    it('isGeneticDisorder getter and resetOtherGeneticOrder', () => {
      component.familyHistoryForm.patchValue({
        isGeneticDisorder: true,
        geneticDisorder: 'x',
      });
      expect(component.isGeneticDisorder).toBeTrue();
      component.resetOtherGeneticOrder();
      expect(component.familyHistoryForm.value.geneticDisorder).toBeNull();
    });

    it('sortDiseaseList sorts by diseaseType', () => {
      const arr = [
        { diseaseType: 'b' },
        { diseaseType: 'a' },
        { diseaseType: 'a' },
      ];
      component.sortDiseaseList(arr);
      expect(arr.map(a => a.diseaseType)).toEqual(['a', 'a', 'b']);
    });

    const dmGroup = {
      value: { diseaseType: { diseaseType: 'Diabetes Mellitus' } },
    };

    it('filterFamilyMembers scores single and both parents for diabetes', () => {
      component.filterFamilyMembers({ value: ['Father', 'Brother'] }, dmGroup);
      expect(session.setItem).toHaveBeenCalledWith(
        'IdRSScoreFamilyHistory',
        '10'
      );
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(10);
      expect(idrs.setIDRSScoreFlag).toHaveBeenCalled();
      component.filterFamilyMembers({ value: ['Mother', 'Father'] }, dmGroup);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(20);
      component.filterFamilyMembers({ value: ['Father', 'Mother'] }, dmGroup);
      expect(session.setItem).toHaveBeenCalledWith(
        'IdRSScoreFamilyHistory',
        '20'
      );
      component.filterFamilyMembers({ value: [] }, dmGroup);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
      expect(component.familyMembersArray).toEqual([]);
    });

    it('filterFamilyMembers ignores non-diabetes diseases', () => {
      component.filterFamilyMembers(
        { value: ['Father'] },
        { value: { diseaseType: { diseaseType: 'Asthma' } } }
      );
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
      expect(component.familyMembersArray).toEqual(['Father']);
    });

    it('patchFamilyMembersIDRSScore computes score', () => {
      component.patchFamilyMembersIDRSScore(['Mother']);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(10);
      component.patchFamilyMembersIDRSScore(['Mother', 'Father']);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(20);
      component.patchFamilyMembersIDRSScore(['Father', 'Mother']);
      component.patchFamilyMembersIDRSScore([]);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
    });

    it('getPreviousFamilyHistory opens dialog when data exists', () => {
      component.visitCategory = 'NCD screening';
      const data = { data: [{}] };
      nurse.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.getPreviousFamilyHistory();
      expect(nurse.getPreviousFamilyHistory).toHaveBeenCalledWith(
        'b1',
        'NCD screening'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.historyData.familyhistory.previousfamilyhistory,
        },
      });
    });

    it('getPreviousFamilyHistory alerts on empty, failure and error', () => {
      nurse.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } })
      );
      component.getPreviousFamilyHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot
      );
      nurse.getPreviousFamilyHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPreviousFamilyHistory();
      nurse.getPreviousFamilyHistory.and.returnValue(throwingObs());
      component.getPreviousFamilyHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error'
      );
      expect(confirm.alert).toHaveBeenCalledTimes(3);
    });

    it('ngOnDestroy unsubscribes and tolerates missing subscriptions', () => {
      component.getGeneralHistory('b1', 'v1');
      const subs = [
        component.nurseMasterDataSubscription,
        component.generalHistorySubscription,
      ];
      subs.forEach(s => spyOn(s, 'unsubscribe').and.callThrough());
      component.ngOnDestroy();
      subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
      component.nurseMasterDataSubscription = null;
      component.generalHistorySubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
