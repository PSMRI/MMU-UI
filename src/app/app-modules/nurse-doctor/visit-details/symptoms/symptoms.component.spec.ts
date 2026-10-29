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
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { SymptomsComponent } from './symptoms.component';

describe('SymptomsComponent', () => {
  let component: SymptomsComponent;
  let fixture: ComponentFixture<SymptomsComponent>;
  let master: any;
  let doctor: any;
  let session: any;
  let nurseMaster$: BehaviorSubject<any>;

  const symptomMaster = [
    { symptoms: 'Fever' },
    { symptoms: 'Cough' },
    { symptoms: 'Breathing Difficulty' },
    { symptoms: 'No Symptoms' },
  ];

  beforeEach(async () => {
    nurseMaster$ = new BehaviorSubject<any>(null);
    master = autoSpy(MasterdataService, { nurseMasterData$: nurseMaster$ });
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SymptomsComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: autoSpy(NurseService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(SymptomsComponent, '');
    fixture = TestBed.createComponent(SymptomsComponent);
    component = fixture.componentInstance;
    component.patientCovidForm = new FormGroup({
      symptom: new FormControl([]),
    });
    session = TestBed.inject(SessionStorageService);
    spyOn(console, 'log');
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('ngOnInit sets language, resets flags and session symptom', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('symptom', 'null');
    expect(component.disable).toEqual(['false', 'false', 'false', 'false']);
    expect(component.checked).toEqual([false, false, false, false]);
    expect(component.symptomsList).toEqual([]);
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('builds the symptom list from master data', () => {
    nurseMaster$.next({ covidSymptomsMaster: symptomMaster });
    expect(component.masterData.covidSymptomsMaster).toBe(symptomMaster);
    expect(component.symptomsList).toEqual([
      'Fever',
      'Cough',
      'Breathing Difficulty',
      'No Symptoms',
    ]);
    expect(component.symptomsArray).toBe(component.symptomsList);
  });

  it('ignores master data without covid symptoms', () => {
    nurseMaster$.next({ other: [] });
    expect(component.masterData).toBeUndefined();
  });

  describe('symptomSelected', () => {
    beforeEach(() => nurseMaster$.next({ covidSymptomsMaster: symptomMaster }));

    it('restricts list to No Symptoms when chosen', () => {
      component.patientCovidForm.patchValue({ symptom: ['No Symptoms'] });
      component.symptomSelected();
      expect(component.symptomsList).toEqual(['No Symptoms']);
      expect(component.answer1).toBe('false');
      expect(master.filter).toHaveBeenCalledWith('false');
    });

    it('excludes No Symptoms and flags allSymptom for three symptoms', () => {
      component.patientCovidForm.patchValue({
        symptom: ['Fever', 'Cough', 'Breathing Difficulty'],
      });
      component.symptomSelected();
      expect(component.symptomsList).not.toContain('No Symptoms');
      expect(session.store.get('allSymptom')).toBe('true');
      expect(component.answer1).toBe('true');
      expect(master.filter).toHaveBeenCalledWith('true');
    });

    it('sets allSymptom false for fewer symptoms', () => {
      component.patientCovidForm.patchValue({ symptom: ['Fever'] });
      component.symptomSelected();
      expect(session.store.get('allSymptom')).toBe('false');
    });

    it('resets list and session when nothing selected', () => {
      component.patientCovidForm.patchValue({ symptom: ['Fever'] });
      component.symptomSelected();
      component.patientCovidForm.patchValue({ symptom: [] });
      component.symptomSelected();
      expect(component.symptomsList).toBe(component.symptomsArray);
      expect(session.store.get('symptom')).toBe('null');
      expect(session.store.get('allSymptom')).toBe('null');
      expect(master.filter).toHaveBeenCalledWith('null');
    });
  });

  describe('ngOnChanges', () => {
    it('loads covid symptoms in view mode', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidDetails: { symptom: ['Fever'] } },
        })
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.sympFlag).toBeTrue();
      expect(component.covidSymptoms).toEqual(['Fever']);
      expect(component.symptom).toEqual(['Fever']);
    });

    it('ignores responses without covid details', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { covidDetails: null } })
      );
      component.getHistoryDetails('b1', 'v1');
      expect(component.sympFlag).toBeFalse();
    });

    it('does not fetch outside view mode', () => {
      component.mode = 'add';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy unsubscribes', () => {
    const a = jasmine.createSpyObj('a', ['unsubscribe']);
    const b = jasmine.createSpyObj('b', ['unsubscribe']);
    component.nurseMasterDataSubscription = a;
    component.coividSymptomsHistory = b;
    component.ngOnDestroy();
    expect(a.unsubscribe).toHaveBeenCalled();
    expect(b.unsubscribe).toHaveBeenCalled();
  });
});
