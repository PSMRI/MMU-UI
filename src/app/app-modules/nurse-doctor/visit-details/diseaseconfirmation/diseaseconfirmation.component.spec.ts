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
import { FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { DiseaseconfirmationComponent } from './diseaseconfirmation.component';

describe('DiseaseconfirmationComponent', () => {
  let component: DiseaseconfirmationComponent;
  let fixture: ComponentFixture<DiseaseconfirmationComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let nurseMasterData$: BehaviorSubject<any>;
  let params: any;
  let session: Record<string, any>;

  const questions = [
    { DiseaseQuestionType: 'Diabetes' },
    { DiseaseQuestionType: 'Diabetes' },
    { DiseaseQuestionType: 'Hypertension' },
    { DiseaseQuestionType: 'Epilepsy' },
    { DiseaseQuestionType: 'Vision Screening' },
    { DiseaseQuestionType: 'Asthma' },
  ];

  const build = async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DiseaseconfirmationComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: IdrsscoreService, useValue: idrs },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DiseaseconfirmationComponent);
    component = fixture.componentInstance;
    component.diseaseFormsGroup = new FormGroup({
      diseaseFormsArray: new FormArray([new FormGroup({})]),
    });
  };

  beforeEach(() => {
    nurseMasterData$ = new BehaviorSubject<any>({ IDRSQuestions: questions });
    master = autoSpy(MasterdataService, { nurseMasterData$ });
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    idrs = autoSpy(IdrsscoreService);
    params = {};
    session = {
      visitID: 'v1',
      beneficiaryRegID: 'b1',
      serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    };
    spyOn(console, 'log');
  });

  const rows = () => component.getDiseaseFormArray();
  const names = () => rows().map((r: any) => r.value.diseaseName);
  const lastSelected = () =>
    idrs.setDiseasesSelected.calls.mostRecent().args[0];

  describe('edit mode (revisit suspected diseases)', () => {
    it('builds unique diseases, pre-selects previous confirmed and disables them', async () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            confirmedDisease: 'Asthma',
            isDiabetic: true,
            isDefectiveVision: true,
            isEpilepsy: true,
            isHypertension: true,
          },
        })
      );
      await build();
      component.ngOnInit();
      expect(nurse.getPreviousVisitData).toHaveBeenCalledWith({
        benRegID: 'b1',
      });
      expect(names()).toEqual([
        'Diabetes',
        'Hypertension',
        'Epilepsy',
        'Vision Screening',
        'Asthma',
      ]);
      expect(component.suspect).toEqual([
        'Asthma',
        'Diabetes',
        'Vision Screening',
        'Epilepsy',
        'Hypertension',
      ]);
      expect(rows().every((r: any) => r.get('selected').disabled)).toBeTrue();
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setConfirmedDiabeticSelected).toHaveBeenCalled();
      expect(lastSelected().length).toBe(5);
    });

    it('with no previous data only publishes empty selection', async () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      await build();
      component.ngOnInit();
      expect(rows().length).toBe(0);
      expect(lastSelected()).toEqual([]);
    });

    it('does nothing without master data or questions', async () => {
      nurseMasterData$.next(null);
      await build();
      component.ngOnInit();
      nurseMasterData$.next({ IDRSQuestions: [] });
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
    });

    it('marks doctor attendant', async () => {
      params = { attendant: 'doctor' };
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      await build();
      component.isDoctor = false;
      component.ngOnInit();
      expect(component.attendantType).toBe('doctor');
      expect(component.isDoctor).toBeTrue();
      expect(rows().some((r: any) => r.get('selected').disabled)).toBeFalse();
    });
  });

  describe('view mode (IDRS details)', () => {
    beforeEach(() => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: { isDiabetic: true } })
      );
    });

    it('adds current IDRS confirmed diseases to previous ones', async () => {
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: 'Hypertension,Diabetes' } },
        })
      );
      await build();
      component.mode = 'view';
      component.ngOnInit();
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.suspect).toEqual(['Diabetes', 'Hypertension']);
      const hyper = component.diseaseArray.find(
        (d: any) => d.disease === 'Hypertension'
      );
      const diab = component.diseaseArray.find(
        (d: any) => d.disease === 'Diabetes'
      );
      expect(hyper.current).toBeTrue();
      expect(diab.current).toBeFalse();
      expect(rows()[0].get('selected').disabled).toBeTrue();
      expect(rows()[1].get('selected').disabled).toBeFalse();
      expect(lastSelected()).toEqual(['Diabetes', 'Hypertension']);
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
    });

    it('uses IDRS diseases as current when no previous ones exist; doctor disables all', async () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: { confirmedDisease: null } })
      );
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: 'Epilepsy' } },
        })
      );
      params = { attendant: 'doctor' };
      await build();
      component.mode = 'view';
      // ngOnInit reads the route param only after the (normally async) IDRS
      // call is issued; with synchronous mocks, seed it as it would be by then.
      component.attendantType = 'doctor';
      component.ngOnInit();
      expect(component.attendantType).toBe('doctor');
      expect(component.suspect).toEqual(['Epilepsy']);
      const ep = component.diseaseArray.find(
        (d: any) => d.disease === 'Epilepsy'
      );
      expect(ep.current).toBeTrue();
      expect(ep.selected).toBeTrue();
      expect(rows().every((r: any) => r.get('selected').disabled)).toBeTrue();
    });

    it('handles IDRS with no confirmed disease and failed IDRS call', async () => {
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: null } },
        })
      );
      await build();
      component.mode = 'view';
      component.ngOnInit();
      expect(component.suspect).toEqual(['Diabetes']);
      expect(rows().length).toBe(5);

      doctor.getIDRSDetails.and.returnValue(of(null));
      component.getIDRSDetailsFrmNurse('v1', 'b1');
      expect(lastSelected()).toEqual(['Diabetes']);
    });

    it('skips IDRS when previous visit fails, and when ids missing', async () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      await build();
      component.mode = 'view';
      component.ngOnInit();
      expect(doctor.getIDRSDetails).not.toHaveBeenCalled();
    });

    it('does not load when visit id is missing', async () => {
      delete session['visitID'];
      await build();
      component.mode = 'view';
      component.ngOnInit();
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
    });
  });

  describe('checked', () => {
    beforeEach(async () => {
      await build();
      component.diseaseFormsGroup = new FormGroup({
        diseaseFormsArray: new FormArray([]),
      });
      component.addMoreDiseases({ disease: 'Hypertension', selected: true });
      component.addMoreDiseases({ disease: 'Diabetes', selected: false });
      component.addMoreDiseases({ disease: 'Asthma', selected: true });
    });

    it('checking Hypertension/Diabetes sets flags and publishes selection', () => {
      component.checked({ checked: true }, rows()[0]);
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Hypertension',
        'Asthma',
      ]);
      component.checked({ checked: true }, rows()[1]);
      expect(idrs.setConfirmedDiabeticSelected).toHaveBeenCalled();
    });

    it('unchecking clears flags and reports unchecked disease', () => {
      component.checked({ checked: false }, rows()[0]);
      expect(idrs.clearHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setUnchecked).toHaveBeenCalledWith('Hypertension');
      component.checked({ checked: false }, rows()[1]);
      expect(idrs.clearConfirmedDiabeticSelected).toHaveBeenCalled();
      component.checked({ checked: false }, rows()[2]);
      expect(idrs.setUnchecked).toHaveBeenCalledWith('Asthma');
      expect(idrs.setDiseasesSelected).not.toHaveBeenCalled();
    });
  });

  describe('getDiseasesMasterData', () => {
    it('builds disease rows from master questions', async () => {
      await build();
      component.diseaseFormsGroup = new FormGroup({
        diseaseFormsArray: new FormArray([]),
      });
      component.getDiseasesMasterData();
      expect(names()).toEqual([
        'Diabetes',
        'Hypertension',
        'Epilepsy',
        'Vision Screening',
        'Asthma',
      ]);
      expect(rows().some((r: any) => r.get('selected').disabled)).toBeFalse();
    });

    it('disables pre-selected rows and ignores empty master', async () => {
      await build();
      component.diseaseFormsGroup = new FormGroup({
        diseaseFormsArray: new FormArray([]),
      });
      const sel = { ...component, diseaseArray: [] };
      nurseMasterData$.next(null);
      component.getDiseasesMasterData();
      expect(rows().length).toBe(0);
      expect(sel).toBeDefined();
    });
  });

  describe('addToChronicDiseases', () => {
    beforeEach(async () => {
      await build();
      component.diseaseFormsGroup = new FormGroup({
        diseaseFormsArray: new FormArray([]),
      });
      [
        'Vision Screening',
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Asthma',
      ].forEach(d =>
        component.addMoreDiseases({ disease: d, selected: false })
      );
    });

    it('selects and disables matching chronic diseases', () => {
      component.addToChronicDiseases({
        data: {
          isDefectiveVision: true,
          isDiabetic: true,
          isEpilepsy: true,
          isHypertension: true,
        },
      });
      const r = rows();
      [0, 1, 2, 3].forEach(i => {
        expect(r[i].get('selected').value).toBeTrue();
        expect(r[i].get('selected').disabled).toBeTrue();
      });
      expect(r[4].get('selected').value).toBeFalse();
      expect(r[4].get('selected').disabled).toBeFalse();
    });

    it('leaves rows untouched when no flags are set', () => {
      component.addToChronicDiseases({ data: {} });
      expect(rows().some((r: any) => r.get('selected').disabled)).toBeFalse();
    });
  });

  it('addToSuspected avoids duplicates', async () => {
    await build();
    component.suspect = ['A'];
    component.addToSuspected('A');
    component.addToSuspected('B');
    expect(component.suspect).toEqual(['A', 'B']);
  });

  it('addMoreDiseases with no data adds an empty row', async () => {
    await build();
    component.diseaseFormsGroup = new FormGroup({
      diseaseFormsArray: new FormArray([]),
    });
    component.addMoreDiseases(null);
    // createPatientDiseaseArrayForm reads data.disease, which the default
    // placeholder object lacks, so the control value becomes null.
    expect(rows()[0].value).toEqual({
      diseaseName: null,
      flag: null,
      selected: null,
    });
  });
});
