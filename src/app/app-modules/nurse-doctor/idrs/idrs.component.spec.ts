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
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { IdrsComponent } from './idrs.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { IdrsscoreService } from '../shared/services/idrsscore.service';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from '../../core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from '../../core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const QUESTIONS = [
  { idrsQuestionID: 1, question: 'd1', DiseaseQuestionType: 'Diabetes' },
  { idrsQuestionID: 2, question: 'd2', DiseaseQuestionType: 'Diabetes' },
  { idrsQuestionID: 3, question: 'a1', DiseaseQuestionType: 'Asthma' },
  { idrsQuestionID: 4, question: 'e1', DiseaseQuestionType: 'Epilepsy' },
  {
    idrsQuestionID: 5,
    question: 'v1',
    DiseaseQuestionType: 'Vision Screening',
  },
  {
    idrsQuestionID: 6,
    question: 't1',
    DiseaseQuestionType: 'Tuberculosis Screening',
  },
  {
    idrsQuestionID: 7,
    question: 'm1',
    DiseaseQuestionType: 'Malaria Screening',
  },
  { idrsQuestionID: 8, question: 'h1', DiseaseQuestionType: 'Hypertension' },
];

describe('IdrsComponent', () => {
  let component: IdrsComponent;
  let fixture: ComponentFixture<IdrsComponent>;
  let idrsForm: FormGroup;
  let medicalForm: FormGroup;
  let idrsService: IdrsscoreService;
  let nurse: any;
  let doctor: any;
  let confirmation: any;
  let session: any;
  let dialog: any;
  let masterData$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let route: any;

  beforeEach(async () => {
    spyOn(console, 'log');
    masterData$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>(null);
    route = { snapshot: { params: { attendant: 'nurse' } } };

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [IdrsComponent],
      providers: [
        ...commonTestProviders(),
        FormBuilder,
        IdrsscoreService,
        { provide: ActivatedRoute, useValue: route },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(IdrsComponent, '')
      .compileComponents();

    idrsService = TestBed.inject(IdrsscoreService);
    nurse = TestBed.inject(NurseService) as any;
    doctor = TestBed.inject(DoctorService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    nurse.getPreviousVisitData.and.returnValue(
      of({ statusCode: 200, data: null })
    );

    idrsForm = new FormGroup({
      idrsScore: new FormControl(null),
      requiredList: new FormControl(null),
      questionArray: new FormControl(null),
      suspectArray: new FormControl(null),
      confirmArray: new FormControl(null),
      isDiabetic: new FormControl(null),
    });
    medicalForm = new FormGroup({ idrsScreeningForm: idrsForm });
  });

  function create(mode = 'new') {
    fixture = TestBed.createComponent(IdrsComponent);
    component = fixture.componentInstance;
    component.idrsScreeningForm = idrsForm;
    component.patientMedicalForm = medicalForm;
    component.ncdScreeningMode = mode;
    component.visitCategory = 'NCD screening';
    fixture.detectChanges();
    return component;
  }

  function diseaseOf(name: string) {
    return component.diseases.find((d: any) => d.disease === name);
  }

  function answer(id: number, value: any) {
    component.questions1.find((q: any) => q.idrsQuestionID === id).answer =
      value;
  }

  describe('initialisation', () => {
    it('sets language and resets the idrs service state', () => {
      spyOn(idrsService, 'clearScoreFlag').and.callThrough();
      spyOn(idrsService, 'clearDiabetesSelected').and.callThrough();
      spyOn(idrsService, 'clearDiseaseSelected').and.callThrough();
      spyOn(idrsService, 'clearUnchecked').and.callThrough();
      create();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(idrsService.clearScoreFlag).toHaveBeenCalled();
      expect(idrsService.clearDiabetesSelected).toHaveBeenCalled();
      expect(idrsService.clearDiseaseSelected).toHaveBeenCalled();
      expect(idrsService.clearUnchecked).toHaveBeenCalled();
      expect(idrsForm.value.idrsScore).toBe(0);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('adds vitals/history scores into the idrs score', () => {
      create();
      idrsService.setIDRSScoreWaist(10);
      idrsService.setIDRSFamilyScore(20);
      idrsService.setIRDSscorePhysicalActivity(30);
      expect(component.idrsScoreWaist).toBe(10);
      expect(component.idrsScoreFamily).toBe(20);
      expect(component.IRDSscorePhysicalActivity).toBe(30);
      expect(idrsForm.value.idrsScore).toBe(60);
      idrsService.setIDRSScoreWaist(undefined);
      idrsService.setIDRSFamilyScore(undefined);
      idrsService.setIRDSscorePhysicalActivity(undefined);
      expect(component.idrsScoreWaist).toBe(0);
      expect(component.idrsScoreFamily).toBe(0);
      expect(component.IRDSscorePhysicalActivity).toBe(0);
    });
  });

  describe('getBeneficiaryDetails', () => {
    [
      { age: 25, score: 0 },
      { age: 40, score: 20 },
      { age: 60, score: 30 },
    ].forEach(({ age, score }) => {
      it(`gives an age score of ${score} for age ${age}`, () => {
        beneficiary$.next({ ageVal: age, beneficiaryRegID: 7 });
        create();
        expect(component.age).toBe(age);
        expect(component.idrsScore).toBe(score);
        expect(nurse.getNcdScreeningVisitCount).toHaveBeenCalledWith(7);
      });
    });

    it('defaults age to 0 when ageVal is missing', () => {
      beneficiary$.next({ beneficiaryRegID: 7 });
      create();
      expect(component.age).toBe(0);
      expect(component.idrsScore).toBe(0);
    });

    it('does not call visit count without beneficiary', () => {
      create();
      expect(nurse.getNcdScreeningVisitCount).not.toHaveBeenCalled();
    });
  });

  describe('getNurseMasterData', () => {
    it('builds questions and distinct diseases and required list for adults', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      beneficiary$.next({ ageVal: 40, beneficiaryRegID: 7 });
      create();
      masterData$.next({ IDRSQuestions: QUESTIONS });
      expect(component.questions1.length).toBe(8);
      expect(component.questions1[0]).toEqual({
        id: null,
        idrsQuestionID: 1,
        question: 'd1',
        diseaseQuestionType: 'Diabetes',
        answer: null,
      });
      expect(component.diseases.map((d: any) => d.disease)).toEqual([
        'Diabetes',
        'Asthma',
        'Epilepsy',
        'Vision Screening',
        'Tuberculosis Screening',
        'Malaria Screening',
        'Hypertension',
      ]);
      expect(diseaseOf('Diabetes').flag).toBeFalse();
      expect(diseaseOf('Asthma').flag).toBeTrue();
      expect(idrsForm.value.requiredList).not.toContain('Diabetes');
      expect(idrsForm.value.requiredList).toContain('Asthma');
      expect(nurse.getPreviousVisitData).toHaveBeenCalled();
    });

    it('keeps Diabetes required when the score is at least 60', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      beneficiary$.next({ ageVal: 60, beneficiaryRegID: 7 });
      create();
      component.idrsScoreWaist = 30;
      masterData$.next({ IDRSQuestions: QUESTIONS });
      expect(idrsForm.value.requiredList).toContain('Diabetes');
    });

    it('removes Diabetes from a pre-filled required list when the score is low', () => {
      create();
      component.required = ['Diabetes', 'Asthma'];
      component.age = 10;
      masterData$.next({ IDRSQuestions: QUESTIONS });
      expect(idrsForm.value.requiredList).toEqual(['Asthma']);
    });

    it('skips previous visit for doctor attendant and loads details in view mode / specialist', () => {
      route.snapshot.params.attendant = 'doctor';
      session.setItem('visitID', 1);
      session.setItem('beneficiaryRegID', 2);
      session.setItem('specialistFlag', '100');
      doctor.getIDRSDetails.and.returnValue(of(null));
      create('view');
      masterData$.next({ IDRSQuestions: QUESTIONS });
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
      expect(doctor.getIDRSDetails).toHaveBeenCalledTimes(2);
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith(2, 1);
    });

    it('ignores view mode without session ids and handles empty questions', () => {
      create('view');
      masterData$.next({ IDRSQuestions: [] });
      expect(component.questions1).toEqual([]);
      expect(doctor.getIDRSDetails).not.toHaveBeenCalled();
    });

    it('does nothing for a null master data emission', () => {
      create();
      expect(component.questions).toEqual([]);
    });
  });

  describe('getPreviousVisit', () => {
    function loadMaster(age: number) {
      create();
      component.age = age;
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      masterData$.next({ IDRSQuestions: QUESTIONS });
    }

    it('disables chronic confirmed diseases on revisit', () => {
      loadMaster(45);
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            isDiabetic: true,
            isDefectiveVision: true,
            isEpilepsy: true,
            questionariesData: [{ q: 1 }],
            confirmedDisease:
              'Tuberculosis Screening,Malaria Screening,Asthma,Other',
          },
        })
      );
      component.getPreviousVisit();
      expect(component.isDiabetic).toBeTrue();
      expect(diseaseOf('Diabetes').disabled).toBeTrue();
      expect(diseaseOf('Vision Screening').disabled).toBeTrue();
      expect(diseaseOf('Epilepsy').disabled).toBeTrue();
      expect(diseaseOf('Tuberculosis Screening').disabled).toBeTrue();
      expect(diseaseOf('Malaria Screening').disabled).toBeTrue();
      expect(diseaseOf('Asthma').disabled).toBeTrue();
      expect(component.chronicDisabled).toBeTrue();
      expect(component.confirmDiseaseArray).toEqual([
        'Tuberculosis Screening',
        'Malaria Screening',
        'Asthma',
        'Other',
        'Diabetes',
        'Epilepsy',
        'Vision Screening',
      ]);
      expect(component.required).toEqual(['Hypertension']);
    });

    it('handles non-diabetic revisit without confirmed diseases', () => {
      loadMaster(45);
      component.confirmDiseaseArray = ['X'];
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            isDiabetic: false,
            isDefectiveVision: false,
            isEpilepsy: false,
            questionariesData: [{ q: 1 }],
            confirmedDisease: null,
          },
        })
      );
      component.getPreviousVisit();
      expect(diseaseOf('Diabetes').flag).toBeFalse();
      expect(diseaseOf('Asthma').disabled).toBeFalse();
      expect(component.confirmDiseaseArray).toEqual(['X']);
    });

    it('skips chronic processing for young beneficiaries or no questionnaire', () => {
      loadMaster(20);
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: { isDiabetic: true, questionariesData: [{ q: 1 }] },
        })
      );
      component.getPreviousVisit();
      expect(component.chronicDisabled).toBeFalse();
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: { questionariesData: null } })
      );
      component.getPreviousVisit();
      expect(component.chronicDisabled).toBeFalse();
    });

    it('alerts on error', () => {
      create();
      const emitted: any[] = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
      nurse.getPreviousVisitData.and.returnValue(throwingObs('bad'));
      component.getPreviousVisit();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(emitted).toContain(false);
    });

    it('patches form arrays for a doctor on revisit', () => {
      create();
      route.snapshot.params.attendant = 'tcspecialist';
      component.revisit = true;
      component.questions1 = [
        { idrsQuestionID: 1, answer: 'yes' },
        { idrsQuestionID: 2, answer: null },
      ];
      component.suspect = ['Asthma'];
      component.confirmDiseaseArray = ['Epilepsy'];
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      component.getPreviousVisit();
      expect(idrsForm.value.questionArray).toEqual([
        { idrsQuestionID: 1, answer: 'yes' },
      ]);
      expect(idrsForm.value.suspectArray).toEqual(['Asthma']);
      expect(idrsForm.value.confirmArray).toEqual(['Epilepsy']);
    });
  });

  describe('idrsFlagScore', () => {
    let emitted: any[];
    beforeEach(() => {
      create();
      component.age = 45;
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      masterData$.next({ IDRSQuestions: QUESTIONS });
      emitted = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
    });

    it('emits true when the flag is cleared', () => {
      idrsService.clearScoreFlag();
      expect(emitted).toEqual([true]);
    });

    it('requires Diabetes when score >= 60 and questions unanswered', () => {
      component.idrsScore = 30;
      component.idrsScoreWaist = 30;
      idrsService.setIDRSScoreFlag();
      expect(emitted).toEqual([false]);
      expect(diseaseOf('Diabetes').flag).toBeTrue();
      expect(component.required).toContain('Diabetes');
    });

    it('does not require Diabetes when all its questions are answered', () => {
      component.idrsScore = 60;
      answer(1, 'no');
      answer(2, 'no');
      idrsService.setIDRSScoreFlag();
      expect(diseaseOf('Diabetes').flag).toBeFalse();
      expect(component.required).not.toContain('Diabetes');
    });

    it('does not require Diabetes when already diabetic (not revisit)', () => {
      component.idrsScore = 60;
      component.isDiabetic = true;
      idrsService.setIDRSScoreFlag();
      expect(diseaseOf('Diabetes').flag).toBeFalse();
      expect(component.required).toContain('Asthma');
    });

    it('uses revisit/diabetic combination to decide', () => {
      component.idrsScore = 60;
      component.revisit = true;
      component.isDiabetic = true;
      idrsService.setIDRSScoreFlag();
      expect(diseaseOf('Diabetes').flag).toBeFalse();
      component.isDiabetic = false;
      idrsService.setIDRSScoreFlag();
      expect(diseaseOf('Diabetes').flag).toBeTrue();
    });

    it('drops Diabetes when score < 60', () => {
      diseaseOf('Diabetes').flag = true;
      idrsService.setIDRSScoreFlag();
      expect(diseaseOf('Diabetes').flag).toBeFalse();
    });
  });

  describe('blood pressure driven hypertension suspicion', () => {
    let emitted: any[];
    beforeEach(() => {
      create();
      emitted = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
    });

    it('adds and removes hypertension based on systolic value', () => {
      idrsService.setSystolicBp(150);
      expect(component.suspect).toEqual(['Hypertension']);
      idrsService.setSystolicBp(160);
      expect(component.suspect).toEqual(['Hypertension']);
      idrsService.setSystolicBp(120);
      expect(component.suspect).toEqual([]);
    });

    it('adds and removes hypertension based on diastolic value', () => {
      idrsService.setDiastolicBp(95);
      expect(component.suspect).toEqual(['Hypertension']);
      idrsService.setDiastolicBp(99);
      expect(component.suspect).toEqual(['Hypertension']);
      idrsService.setDiastolicBp(70);
      expect(component.suspect).toEqual([]);
    });

    it('keeps hypertension while the other reading is high', () => {
      idrsService.setSystolicBp(150);
      idrsService.setDiastolicBp(70);
      expect(component.suspect).toEqual(['Hypertension']);
      idrsService.setDiastolicBp(95);
      idrsService.setSystolicBp(120);
      expect(component.suspect).toEqual(['Hypertension']);
    });

    it('ignores readings once hypertension is selected', () => {
      idrsService.setHypertensionSelected();
      expect(component.hypertensionChecked).toBeTrue();
      idrsService.setSystolicBp(180);
      expect(component.suspect).toEqual([]);
    });

    it('ignores undefined readings', () => {
      idrsService.setSystolicBp(undefined);
      idrsService.setDiastolicBp(undefined);
      // initial null emission is recorded; undefined ones are skipped
      expect(component.systolicValueFromVital).toBeNull();
      expect(component.diastolicValueFromVital).toBeNull();
    });

    it('emits change when hypertension is added alongside other suspects', () => {
      component.suspect = ['Asthma'];
      component.addToSuspectedHyper('Hypertension');
      expect(emitted).toEqual([false]);
      expect(component.systolicChange).toBeTrue();
      component.suspect = [];
      component.addToSuspectedHyper('Hypertension');
      expect(emitted).toEqual([false, false]);
    });

    it('does not add when already suspected or confirmed', () => {
      component.confirmDiseaseArray = ['Hypertension'];
      component.addToSuspectedHyper('Hypertension');
      expect(component.suspect).toEqual([]);
      component.addToSuspectedHyper('Other');
      expect(component.suspect).toEqual(['Other']);
    });
  });

  describe('removeSuspectedHyper', () => {
    beforeEach(() => create());

    it('keeps suspicion when a question answered yes', () => {
      component.questions1 = [
        { diseaseQuestionType: 'Hypertension', answer: 'yes' },
      ];
      component.suspect = ['Hypertension'];
      component.removeSuspectedHyper('Hypertension');
      expect(component.suspect).toEqual(['Hypertension']);
    });

    it('removes and emits when other suspects exist', () => {
      const emitted: any[] = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
      spyOn(idrsService, 'setSuspectedArrayValue').and.callThrough();
      spyOn(idrsService, 'setDiabetesSelected').and.callThrough();
      component.suspect = ['Hypertension', 'Diabetes', 'Asthma'];
      component.removeSuspectedHyper('Hypertension');
      expect(component.suspect).toEqual(['Diabetes', 'Asthma']);
      expect(emitted).toEqual([false]);
      expect(idrsService.setDiabetesSelected).toHaveBeenCalled();
      expect(idrsService.setSuspectedArrayValue).toHaveBeenCalled();
    });

    it('clears flag when only non-chronic suspects remain', () => {
      spyOn(idrsService, 'clearSuspectedArrayFlag').and.callThrough();
      component.systolicChange = true;
      const emitted: any[] = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
      component.suspect = ['Hypertension'];
      component.removeSuspectedHyper('Hypertension');
      expect(emitted).toEqual([false]);
      expect(component.suspect).toEqual([]);
      component.suspect = ['Other'];
      component.removeSuspectedHyper('Hypertension');
      expect(idrsService.clearSuspectedArrayFlag).toHaveBeenCalledTimes(2);
    });

    it('removes a non-hypertension value without emitting', () => {
      const emitted: any[] = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
      component.suspect = ['Other', 'Asthma'];
      component.removeSuspectedHyper('Other');
      expect(component.suspect).toEqual(['Asthma']);
      expect(emitted).toEqual([]);
    });
  });

  describe('removeSuspected / removeSuspect', () => {
    beforeEach(() => create());

    it('removeSuspected keeps value when question answered yes', () => {
      component.questions1 = [{ diseaseQuestionType: 'Asthma', answer: 'yes' }];
      component.suspect = ['Asthma'];
      component.removeSuspected('Asthma');
      expect(component.suspect).toEqual(['Asthma']);
    });

    it('removeSuspected handles all flag branches', () => {
      spyOn(idrsService, 'clearSuspectedArrayFlag').and.callThrough();
      spyOn(idrsService, 'setSuspectedArrayValue').and.callThrough();
      spyOn(idrsService, 'setDiabetesSelected').and.callThrough();
      component.suspect = ['Asthma', 'Diabetes', 'Epilepsy'];
      component.removeSuspected('Asthma');
      expect(component.suspect).toEqual(['Diabetes', 'Epilepsy']);
      expect(idrsService.setDiabetesSelected).toHaveBeenCalled();
      expect(idrsService.setSuspectedArrayValue).toHaveBeenCalled();
      component.removeSuspected('Epilepsy');
      expect(idrsService.clearSuspectedArrayFlag).toHaveBeenCalledTimes(1);
      component.removeSuspected('Diabetes');
      expect(component.suspect).toEqual([]);
      expect(idrsService.clearSuspectedArrayFlag).toHaveBeenCalledTimes(2);
    });

    it('removeSuspect only acts when questions exist', () => {
      component.questions1 = [];
      component.suspect = ['Asthma'];
      component.removeSuspect('Asthma');
      expect(component.suspect).toEqual(['Asthma']);
      spyOn(idrsService, 'setSuspectedArrayValue').and.callThrough();
      spyOn(idrsService, 'clearSuspectedArrayFlag').and.callThrough();
      component.questions1 = [{}];
      component.suspect = ['Asthma', 'Epilepsy', 'Other'];
      component.removeSuspect('Asthma');
      expect(component.suspect).toEqual(['Epilepsy', 'Other']);
      expect(idrsService.setSuspectedArrayValue).toHaveBeenCalled();
      component.removeSuspect('Epilepsy');
      expect(idrsService.clearSuspectedArrayFlag).toHaveBeenCalledTimes(1);
      component.removeSuspect('Other');
      expect(component.suspect).toEqual([]);
      expect(idrsService.clearSuspectedArrayFlag).toHaveBeenCalledTimes(2);
    });
  });

  describe('addToSuspected / confirm array', () => {
    beforeEach(() => create());

    it('adds Diabetes and sets service flags', () => {
      spyOn(idrsService, 'setDiabetesSelected').and.callThrough();
      spyOn(idrsService, 'setSuspectedArrayValue').and.callThrough();
      component.addToSuspected('Diabetes');
      component.addToSuspected('Diabetes');
      expect(component.suspect).toEqual(['Diabetes']);
      expect(idrsService.setDiabetesSelected).toHaveBeenCalledTimes(1);
      component.addToSuspected('Vision Screening');
      component.addToSuspected('Asthma');
      expect(idrsService.setSuspectedArrayValue).toHaveBeenCalledTimes(2);
    });

    it('does not suspect a confirmed disease', () => {
      component.confirmDiseaseArray = ['Asthma'];
      component.addToSuspected('Asthma');
      expect(component.suspect).toEqual([]);
    });

    it('addToconfirmDiseaseArray adds once and patches the form', () => {
      component.addToconfirmDiseaseArray('Asthma');
      component.addToconfirmDiseaseArray('Asthma');
      expect(component.confirmDiseaseArray).toEqual(['Asthma']);
      expect(idrsForm.value.confirmArray).toEqual(['Asthma']);
    });

    it('removeConfirmDiseaseArray removes and trims Diabetes when score low', () => {
      component.confirmDiseaseArray = ['Asthma', 'Epilepsy'];
      component.required = ['Diabetes', 'Asthma'];
      component.removeConfirmDiseaseArray('Asthma');
      expect(component.confirmDiseaseArray).toEqual(['Epilepsy']);
      expect(idrsForm.value.requiredList).toEqual(['Asthma']);
      component.idrsScore = 60;
      component.required = ['Diabetes'];
      component.removeConfirmDiseaseArray('X');
      expect(idrsForm.value.requiredList).toEqual(['Diabetes']);
    });

    it('checkQuestionsToAddInSuspect adds Diabetes on a yes answer', () => {
      component.diseases = [{ disease: 'Diabetes', confirmed: true }];
      component.questions1 = [
        { diseaseQuestionType: 'Diabetes', answer: 'no' },
        { diseaseQuestionType: 'Diabetes', answer: 'yes' },
      ];
      component.checkQuestionsToAddInSuspect('Diabetes');
      expect(component.suspect).toEqual(['Diabetes']);
      expect(component.diseases[0].confirmed).toBeFalse();
      component.suspect = [];
      component.checkQuestionsToAddInSuspect('Asthma');
      expect(component.suspect).toEqual([]);
    });

    it('updateDiabetesQuestionValue keeps Diabetes when score is high', () => {
      component.idrsScore = 60;
      component.required = ['Diabetes'];
      component.updateDiabetesQuestionValue();
      expect(idrsForm.value.requiredList).toEqual(['Diabetes']);
    });
  });

  describe('uncheckedDiseases observable', () => {
    beforeEach(() => {
      create();
      component.diseases = [
        { disease: 'Diabetes', flag: true, confirmed: true },
        { disease: 'Asthma', flag: true, confirmed: false },
      ];
    });

    it('re-suspects disease that has a yes answer', () => {
      spyOn(idrsService, 'setDiabetesSelected').and.callThrough();
      component.questions1 = [
        { diseaseQuestionType: 'Diabetes', answer: 'yes' },
      ];
      component.confirmDiseaseArray = ['Diabetes'];
      idrsService.setUnchecked('Diabetes');
      expect(component.suspect).toEqual(['Diabetes']);
      expect(component.confirmDiseaseArray).toEqual([]);
      expect(component.diseases[0].confirmed).toBeFalse();
      expect(idrsService.setDiabetesSelected).toHaveBeenCalled();
      expect(idrsForm.value.requiredList).toEqual(['Diabetes', 'Asthma']);
    });

    it('un-confirms disease without a yes answer', () => {
      component.questions1 = [
        { diseaseQuestionType: 'Diabetes', answer: 'no' },
      ];
      idrsService.setUnchecked('Diabetes');
      expect(component.suspect).toEqual([]);
      expect(component.diseases[0].confirmed).toBeFalse();
    });

    it('re-suspects non-diabetes disease without setting diabetes flag', () => {
      spyOn(idrsService, 'setDiabetesSelected').and.callThrough();
      component.questions1 = [{ diseaseQuestionType: 'Asthma', answer: 'yes' }];
      idrsService.setUnchecked('Asthma');
      expect(component.suspect).toEqual(['Asthma']);
      expect(idrsService.setDiabetesSelected).not.toHaveBeenCalled();
    });
  });

  describe('visitDiseases observable', () => {
    beforeEach(() => {
      create();
      component.questions1 = [{}];
      component.diseases = [
        { disease: 'Diabetes', flag: true, confirmed: false },
        { disease: 'Asthma', flag: true, confirmed: false },
      ];
    });

    it('confirms diseases and removes them from suspects', () => {
      spyOn(idrsService, 'clearDiabetesSelected').and.callThrough();
      component.suspect = ['Diabetes', 'Asthma'];
      idrsService.setDiseasesSelected(['Diabetes']);
      expect(component.diseases[0].confirmed).toBeTrue();
      expect(component.required).toEqual(['Asthma']);
      expect(component.confirmDiseaseArray).toEqual(['Diabetes']);
      expect(component.suspect).toEqual(['Asthma']);
      expect(idrsService.clearDiabetesSelected).toHaveBeenCalled();
    });

    it('ignores empty lists', () => {
      idrsService.setDiseasesSelected([]);
      expect(component.confirmDiseaseArray).toEqual([]);
    });

    it('deletes both confirmed diseases', () => {
      component.confirmDiseaseArray = ['Hypertension', 'Diabetes'];
      idrsService.setDiseasesSelected([
        'Hypertension',
        'Diabetes',
        'deleteHypertension',
      ]);
      // current behaviour: indexOf of string literals => last elements spliced
      expect(component.confirmDiseaseArray).toEqual([]);
    });

    it('deletes only hypertension', () => {
      component.confirmDiseaseArray = ['Hypertension', 'Asthma'];
      component.confirmed = ['Hypertension', 'deleteHypertension'];
      component.deleteDiagnosisConfirmedDisease();
      expect(component.confirmDiseaseArray).toEqual(['Hypertension']);
      expect(component.confirmed).toEqual([]);
    });

    it('deletes only diabetes', () => {
      component.confirmDiseaseArray = ['Diabetes'];
      component.confirmed = ['Diabetes', 'deleteDiabetes', 'x'];
      component.deleteDiagnosisConfirmedDisease();
      expect(component.confirmDiseaseArray).toEqual([]);
      expect(component.confirmed).toEqual(['Diabetes']);
    });

    it('does nothing when nothing matches', () => {
      component.confirmDiseaseArray = ['Asthma'];
      component.confirmed = ['deleteDiabetes'];
      component.deleteDiagnosisConfirmedDisease();
      expect(component.confirmDiseaseArray).toEqual(['Asthma']);
    });
  });

  describe('radioChange', () => {
    let emitted: any[];
    beforeEach(() => {
      create();
      component.age = 45;
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      masterData$.next({ IDRSQuestions: QUESTIONS });
      emitted = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
    });

    it('records a yes answer and suspects the disease', () => {
      component.radioChange(component.questions1[2], 'yes', 'Asthma');
      expect(emitted).toEqual([false]);
      expect(component.questions1[2].answer).toBe('yes');
      expect(component.suspect).toEqual(['Asthma']);
      expect(diseaseOf('Asthma').flag).toBeFalse();
      expect(idrsForm.value.questionArray.length).toBe(1);
      expect(idrsForm.value.suspectArray).toEqual(['Asthma']);
      expect(idrsForm.value.requiredList).not.toContain('Asthma');
      expect(idrsForm.value.isDiabetic).toBeFalse();
    });

    it('marks isDiabetic and keeps Diabetes required until all answered', () => {
      component.idrsScore = 60;
      diseaseOf('Diabetes').flag = true;
      component.radioChange(component.questions1[0], 'yes', 'Diabetes');
      expect(diseaseOf('Diabetes').flag).toBeTrue();
      expect(idrsForm.value.isDiabetic).toBeTrue();
      expect(idrsForm.value.requiredList).toContain('Diabetes');
    });

    it('trims Diabetes from required when score is low', () => {
      diseaseOf('Diabetes').flag = true;
      component.radioChange(component.questions1[2], 'no', 'Asthma');
      expect(idrsForm.value.requiredList).not.toContain('Diabetes');
    });

    it('removes suspicion on a no answer', () => {
      component.suspect = ['Asthma'];
      component.radioChange(component.questions1[2], 'no', 'Asthma');
      expect(component.suspect).toEqual([]);
    });

    it('uses the rev list when chronic answers exist', () => {
      component.chronicDisabled = true;
      component.rev = [{ idrsQuestionID: 3 }, { idrsQuestionID: 99 }];
      component.radioChange(component.questions1[2], 'yes', 'Asthma');
      expect(
        idrsForm.value.questionArray.map((q: any) => q.idrsQuestionID)
      ).toEqual([99, 3]);
    });

    it('uses the arr list for a doctor without revisit', () => {
      route.snapshot.params.attendant = 'doctor';
      component.chronicDisabled = true;
      component.rev = [{ idrsQuestionID: 99 }];
      component.radioChange(component.questions1[2], 'yes', 'Asthma');
      expect(
        idrsForm.value.questionArray.map((q: any) => q.idrsQuestionID)
      ).toEqual([3]);
    });
  });

  describe('ngOnChanges and updateIDRSDetails', () => {
    it('loads nurse details in view mode', () => {
      create();
      session.setItem('visitID', 1);
      session.setItem('beneficiaryRegID', 2);
      doctor.getIDRSDetails.and.returnValue(of(null));
      component.ncdScreeningMode = 'view';
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith(2, 1);
    });

    it('skips fetch without session ids in view / specialist mode', () => {
      create();
      session.setItem('specialistFlag', '100');
      component.ncdScreeningMode = 'view';
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(doctor.getIDRSDetails).not.toHaveBeenCalled();
    });

    it('loads nurse details for specialist flag', () => {
      create();
      session.setItem('specialistFlag', '100');
      session.setItem('visitID', 1);
      session.setItem('beneficiaryRegID', 2);
      doctor.getIDRSDetails.and.returnValue(of(null));
      component.ngOnChanges();
      expect(doctor.getIDRSDetails).toHaveBeenCalledTimes(1);
    });

    it('does nothing in new mode', () => {
      create();
      component.ngOnChanges();
      expect(component.doctorScreen).toBeFalse();
      expect(doctor.updateIDRSDetails).not.toHaveBeenCalled();
    });

    it('updates details on success', () => {
      create();
      session.setItem('visitCategory', 'NCD screening');
      const emitted: any[] = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
      doctor.updateIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } })
      );
      idrsForm.markAsDirty();
      component.ncdScreeningMode = 'update';
      component.ngOnChanges();
      expect(doctor.updateIDRSDetails).toHaveBeenCalledWith(
        idrsForm,
        'NCD screening'
      );
      expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
      expect(emitted).toEqual(['check', true]);
      expect(idrsForm.pristine).toBeTrue();
    });

    it('alerts on failure status and on error', () => {
      create();
      const emitted: any[] = [];
      component.IDRSChanged.subscribe(v => emitted.push(v));
      doctor.updateIDRSDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'nope' })
      );
      component.updateIDRSDetails(idrsForm, 'x');
      expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
      doctor.updateIDRSDetails.and.returnValue(throwingObs('err'));
      component.updateIDRSDetails(idrsForm, 'x');
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
      expect(emitted).toEqual(['check', false, 'check', false]);
    });
  });

  describe('getIDRSDetailsFrmNurse', () => {
    beforeEach(() => {
      create();
      component.age = 45;
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      masterData$.next({ IDRSQuestions: QUESTIONS });
      nurse.getPreviousVisitData.calls.reset();
    });

    it('patches answers and suspects from nurse data', () => {
      spyOn(idrsService, 'setSuspectedArrayValue').and.callThrough();
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            IDRSDetail: {
              suspectedDisease: 'Diabetes,Asthma',
              idrsDetails: [
                { idrsQuestionId: 1, answer: 'Yes', ID: 11 },
                { idrsQuestionId: 3, answer: 'No', ID: 13 },
              ],
            },
          },
        })
      );
      component.getIDRSDetailsFrmNurse(1, 2);
      expect(component.suspect).toEqual(['Diabetes', 'Asthma']);
      expect(idrsService.setSuspectedArrayValue).toHaveBeenCalled();
      expect(component.revisit).toBeFalse();
      expect(component.questions1[0].answer).toBe('yes');
      expect(component.questions1[0].id).toBe(11);
      expect(diseaseOf('Asthma').flag).toBeFalse();
      expect(idrsForm.value.questionArray.length).toBe(2);
      expect(idrsForm.value.isDiabetic).toBeTrue();
      expect(component.rev.length).toBe(2);
      expect(nurse.getPreviousVisitData).toHaveBeenCalled();
    });

    it('flags a revisit when no answered question matches', () => {
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            IDRSDetail: {
              suspectedDisease: null,
              idrsDetails: [{ idrsQuestionId: 999, answer: 'Yes', ID: 1 }],
            },
          },
        })
      );
      component.getIDRSDetailsFrmNurse(1, 2);
      expect(component.revisit).toBeTrue();
      expect(idrsForm.value.isDiabetic).toBeFalse();
    });

    it('never flags a revisit for young beneficiaries', () => {
      component.age = 20;
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            IDRSDetail: {
              idrsDetails: [{ idrsQuestionId: 999, answer: 'Yes', ID: 1 }],
            },
          },
        })
      );
      component.getIDRSDetailsFrmNurse(1, 2);
      expect(component.revisit).toBeFalse();
    });

    it('handles empty idrs details', () => {
      doctor.getIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: { IDRSDetail: { idrsDetails: [] } } })
      );
      component.getIDRSDetailsFrmNurse(1, 2);
      expect(idrsForm.value.questionArray).toEqual([]);
    });

    it('ignores non-200 responses', () => {
      doctor.getIDRSDetails.and.returnValue(of({ statusCode: 500 }));
      component.getIDRSDetailsFrmNurse(1, 2);
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
    });
  });

  describe('settingSuspectedObservable', () => {
    it('sets flag only once for chronic suspects', () => {
      create();
      spyOn(idrsService, 'setSuspectedArrayValue');
      component.suspect = ['Other', 'Malaria Screening', 'Asthma'];
      component.settingSuspectedObservable();
      expect(idrsService.setSuspectedArrayValue).toHaveBeenCalledTimes(1);
    });
  });

  describe('previous diabetes history', () => {
    beforeEach(() => {
      create();
      session.setItem('beneficiaryRegID', 5);
    });

    it('opens the dialog when history exists', () => {
      nurse.getPreviousDiabetesHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [{ a: 1 }] } })
      );
      component.getPreviousDiabetesHistory();
      expect(nurse.getPreviousDiabetesHistory).toHaveBeenCalledWith(
        5,
        'NCD screening'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: { data: [{ a: 1 }] },
          title: LANGUAGE_EN.previousDiabetesHistoryDetails,
        },
      });
    });

    it('alerts when no history', () => {
      nurse.getPreviousDiabetesHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } })
      );
      component.getPreviousDiabetesHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pastDiabetesHistoryNotAvailable
      );
    });

    it('alerts on non-200 and error', () => {
      nurse.getPreviousDiabetesHistory.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      component.getPreviousDiabetesHistory();
      nurse.getPreviousDiabetesHistory.and.returnValue(throwingObs());
      component.getPreviousDiabetesHistory();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error'
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('clears state and unsubscribes', () => {
      create();
      spyOn(idrsService, 'clearSystolicBp').and.callThrough();
      spyOn(idrsService, 'clearHypertensionSelected').and.callThrough();
      component.suspect = ['A'];
      component.ngOnDestroy();
      expect(component.suspect).toEqual([]);
      expect(idrsService.clearSystolicBp).toHaveBeenCalled();
      expect(idrsService.clearHypertensionSelected).toHaveBeenCalled();
      expect(component.idrsWaistSubscription.closed).toBeTrue();
      expect(component.visitDiseaseSubscription.closed).toBeTrue();
      expect(component.diastolicBpValueSubscription.closed).toBeTrue();
    });

    it('tolerates missing subscriptions', () => {
      fixture = TestBed.createComponent(IdrsComponent);
      component = fixture.componentInstance;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
