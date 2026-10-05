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
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { WorkareaComponent } from './workarea.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { IdrsscoreService } from '../shared/services/idrsscore.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { SmsNotificationComponent } from '../sms-notification/sms-notification.component';
import { OpenPreviousVisitDetailsComponent } from '../../core/components/open-previous-visit-details/open-previous-visit-details.component';

/* ------------------------------------------------------------------ */
/* Local form-building helpers                                         */
/* ------------------------------------------------------------------ */

/** Marker: a FormControl that is required and empty (has errors). */
const REQ = '__REQUIRED__';
/** Wrap a value so it is kept as a single FormControl (not expanded). */
class Val {
  constructor(public v: any) {}
}
const val = (v: any) => new Val(v);

/** Recursively build Angular form controls from a plain description. */
function build(x: any): AbstractControl {
  if (x === REQ) return new FormControl(null, Validators.required);
  if (x instanceof Val) return new FormControl(x.v);
  if (x instanceof AbstractControl) return x;
  if (Array.isArray(x)) return new FormArray(x.map(build));
  if (x && typeof x === 'object' && !(x instanceof Date)) {
    const g: any = {};
    Object.keys(x).forEach(k => (g[k] = build(x[k])));
    return new FormGroup(g);
  }
  return new FormControl(x);
}
const e = (err: boolean) => (err ? REQ : 'ok');

const L = LANGUAGE_EN;

function vitals(err = false) {
  return {
    systolicBP_1stReading: e(err),
    diastolicBP_1stReading: e(err),
    height_cm: e(err),
    weight_Kg: e(err),
    temperature: e(err),
    pulseRate: e(err),
    waistCircumference_cm: e(err),
    rbsCheckBox: false,
    rbsTestResult: 'ok',
  };
}

function refer(o: any = {}) {
  return {
    referredToInstituteName: o.inst ?? null,
    referredToInstituteID: o.instID ?? null,
    refrredToAdditionalServiceList: val(o.list === undefined ? null : o.list),
    referralReason: o.reasonErr ? REQ : 'reason',
    referralReasonList: o.reasonListErr ? REQ : 'reason',
  };
}

/** Build a medical form usable by checkNurseRequirements. */
function nurseForm(o: any = {}) {
  const desc: any = {
    patientVisitForm: {
      patientCovidForm: {
        contactStatus: e(!!o.covidErr),
        travelStatus: e(!!o.covidErr),
        symptom: e(!!o.covidErr),
      },
    },
    patientHistoryForm: {
      pastObstericHistory: { pastObstericHistoryList: o.preg ?? [] },
      personalHistory: { allergicList: o.allergies ?? [] },
      comorbidityHistory: {
        comorbidityConcurrentConditionsList: [
          { comorbidConditions: e(!!o.comorbidErr) },
        ],
      },
    },
    patientReferForm: refer(o.refer),
  };
  if (!o.noVitals) desc.patientVitalsForm = vitals(!!o.vitalsErr);
  if (o.exam !== undefined) {
    desc.patientExaminationForm = {
      generalExaminationForm: {
        typeOfDangerSigns: e(o.exam),
        lymphnodesInvolved: e(o.exam),
        typeOfLymphadenopathy: e(o.exam),
        extentOfEdema: e(o.exam),
        edemaType: e(o.exam),
      },
    };
  }
  if (o.pncErr !== undefined) {
    desc.patientPNCForm = {
      deliveryPlace: e(o.pncErr),
      deliveryType: e(o.pncErr),
    };
  }
  if (o.ancErr !== undefined) {
    desc.patientANCForm = {
      patientANCDetailsForm: {
        primiGravida: e(o.ancErr),
        lmpDate: e(o.ancErr),
      },
    };
  }
  if (o.caseRecord) desc.patientCaseRecordForm = o.caseRecord;
  return build(desc) as FormGroup;
}

function caseRecord(o: any = {}) {
  return {
    generalDoctorInvestigationForm: {
      labTest: o.labTest === undefined ? [] : o.labTest,
    },
    generalDiagnosisForm: {
      provisionalDiagnosisList: [
        {
          provisionalDiagnosis: o.provErr ? REQ : (o.prov ?? 'fever'),
          conceptID: o.concept === undefined ? '123' : o.concept,
        },
      ],
      confirmatoryDiagnosisList: [
        {
          confirmatoryDiagnosis: o.conf ?? null,
          conceptID: o.confConcept === undefined ? null : o.confConcept,
        },
      ],
      doctorDiagnosis: e(!!o.docDiagErr),
      ncdScreeningConditionArray:
        o.ncdCond === REQ ? REQ : val(o.ncdCond ?? ['Diabetes']),
      ncdScreeningConditionOther: o.ncdOther ?? null,
    },
    diagnosisForm: { provisionalDiagnosisPrimaryDoctor: e(!!o.cancerDiagErr) },
    provisionalDiagnosisPrimaryDoctor: e(!!o.cancerDiagErr),
    drugPrescriptionForm: {
      prescribedDrugs:
        o.drugs === undefined ? [{ createdBy: 'doc', drugName: 'x' }] : o.drugs,
    },
  };
}

describe('WorkareaComponent', () => {
  let component: WorkareaComponent;
  let fixture: ComponentFixture<WorkareaComponent>;
  let nurseService: any;
  let doctorService: any;
  let masterdataService: any;
  let idrs: any;
  let beneficiarySvc: any;
  let confirmation: any;
  let session: any;
  let router: Router;
  let dialog: any;
  let routeParams: any;

  const SERVICE_LINE = JSON.stringify({ vanID: 11, parkingPlaceID: 22 });

  beforeEach(async () => {
    routeParams = { attendant: 'nurse' };
    nurseService = autoSpy(NurseService, {
      ncdTemp$: new BehaviorSubject<any>(undefined),
      enableLAssessment$: new BehaviorSubject<any>(false),
      enableProvisionalDiag$: new BehaviorSubject<any>(false),
      fileData: undefined,
      isAssessmentDone: false,
    });
    doctorService = autoSpy(DoctorService, {
      enableVitalsUpdateButton$: new BehaviorSubject<any>(undefined),
      covidVaccineAgeGroup: null,
      enableCovidVaccinationButton: false,
      prescribedDrugData: 'drugs',
    });
    doctorService.postGeneralRefer.and.returnValue({ refer: true });
    masterdataService = autoSpy(MasterdataService, {
      visitDetailMasterData$: new BehaviorSubject<any>(null),
    });
    idrs = {
      tmcSubmitDisable$: new BehaviorSubject<any>(false),
      rBSPresentFlag$: new BehaviorSubject<any>(0),
      visualAcuityPresentFlag$: new BehaviorSubject<any>(0),
      heamoglobinPresentFlag$: new BehaviorSubject<any>(0),
      diabetesSelectedFlag$: new BehaviorSubject<any>(0),
      VisualAcuityTestMandatoryFlag$: new BehaviorSubject<any>(0),
    };
    beneficiarySvc = {
      beneficiaryDetails$: new BehaviorSubject<any>({ ageVal: 35 }),
    };

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorkareaComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: SERVICE_LINE,
            providerServiceID: 4,
            userName: 'nurse1',
            userID: 9,
            beneficiaryRegID: 100,
            visitID: 200,
            visitCode: 300,
            serviceID: 2,
            benFlowID: 7,
            beneficiaryID: 8,
            sessionID: 3,
          },
        }),
        { provide: NurseService, useValue: nurseService },
        { provide: DoctorService, useValue: doctorService },
        { provide: MasterdataService, useValue: masterdataService },
        { provide: IdrsscoreService, useValue: idrs },
        { provide: BeneficiaryDetailsService, useValue: beneficiarySvc },
        { provide: SetLanguageComponent, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get params() {
                return routeParams;
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(WorkareaComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'log');
  });

  afterEach(() => {
    fixture.destroy();
    sessionStorage.clear();
    localStorage.clear();
  });

  const init = (
    sessionValues: Record<string, any> = {},
    attendant = 'nurse'
  ) => {
    routeParams.attendant = attendant;
    Object.keys(sessionValues).forEach(k =>
      session.store.set(k, sessionValues[k])
    );
    fixture.detectChanges();
  };

  /* ================================================================ */
  describe('initialisation', () => {
    it('creates and initialises in new-lookup mode when no visit category', () => {
      init();
      expect(component).toBeTruthy();
      expect(component.newLookupMode).toBeTrue();
      expect(component.isSpecialist).toBeFalse();
      expect(component.doctorUpdateAndTCSubmit).toBe(L.common.update);
      expect(component.beneficiaryRegID).toBe(100);
      expect(component.visitID).toBe(200);
      expect(nurseService.clearMessage).toHaveBeenCalled();
      expect(masterdataService.getVisitDetailMasterData).toHaveBeenCalled();
      expect(doctorService.checkUsersignatureExist).toHaveBeenCalledWith(9);
      expect(component.patientVisitForm).toBeTruthy();
      expect(component.beneficiary).toEqual({ ageVal: 35 });
      expect(component.beneficiaryAge).toBe(35);
    });

    it('sets specialist values for tcspecialist attendant', () => {
      init({}, 'tcspecialist');
      expect(component.isSpecialist).toBeTrue();
      expect(component.doctorUpdateAndTCSubmit).toBe(L.common.submit);
    });

    it('stores doctor signature status when API returns data', () => {
      doctorService.checkUsersignatureExist.and.returnValue(
        of({ statusCode: 200, data: { signStatus: true } })
      );
      init();
      expect(component.doctorSignatureFlag).toBeTrue();
    });

    it('ignores signature response without data', () => {
      doctorService.checkUsersignatureExist.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      init();
      expect(component.doctorSignatureFlag).toBeFalse();
    });

    it('reacts to idrs / nurse / doctor subject emissions', () => {
      init();
      idrs.tmcSubmitDisable$.next(true);
      idrs.rBSPresentFlag$.next(1);
      idrs.visualAcuityPresentFlag$.next(2);
      idrs.heamoglobinPresentFlag$.next(3);
      idrs.diabetesSelectedFlag$.next(1);
      idrs.VisualAcuityTestMandatoryFlag$.next(1);
      nurseService.ncdTemp$.next(true);
      nurseService.enableLAssessment$.next(true);
      nurseService.enableProvisionalDiag$.next(true);
      doctorService.enableVitalsUpdateButton$.next(true);
      expect(component.tmcDisable).toBeTrue();
      expect(component.rbsPresent).toBe(1);
      expect(component.visualAcuityPresent).toBe(2);
      expect(component.heamoglobinPresent).toBe(3);
      expect(component.diabetesSelected).toBe(1);
      expect(component.visualAcuityMandatory).toBe(1);
      expect(component.ncdTemperature).toBeTrue();
      expect(component.enableLungAssessment).toBeTrue();
      expect(component.enableProvisionalDiag).toBeTrue();
      expect(component.enableUpdateButtonInVitals).toBeTrue();

      nurseService.ncdTemp$.next(undefined);
      nurseService.enableLAssessment$.next(false);
      nurseService.enableProvisionalDiag$.next(false);
      doctorService.enableVitalsUpdateButton$.next(undefined);
      expect(component.ncdTemperature).toBeFalse();
      expect(component.enableLungAssessment).toBeFalse();
      expect(component.enableProvisionalDiag).toBeFalse();
      expect(component.enableUpdateButtonInVitals).toBeFalse();
    });

    it('ignores empty beneficiary emissions', () => {
      beneficiarySvc.beneficiaryDetails$.next(null);
      init();
      expect(component.beneficiary).toBeUndefined();
    });

    it('opens view mode directly when visit category is in session', () => {
      init({ visitCategory: 'General OPD' }, 'doctor');
      expect(component.newLookupMode).toBeFalse();
      expect(component.showCaseRecord).toBeTrue();
      expect(component.visitMode.toString()).toBe('view');
      expect(
        component.patientVisitForm.get('patientVisitDetailsForm.visitCategory')
          ?.disabled
      ).toBeTrue();
    });

    it('shows only TM referred details when specialist flag is 100', () => {
      init({ specialist_flag: '100' });
      expect(component.showTMVisitDetails).toBeTrue();
      expect(component.showVisitDetails).toBeFalse();
      expect(component.showVitals).toBeFalse();
    });

    it('handles a visit category selected in new-lookup mode', () => {
      init();
      masterdataService.visitDetailMasterData$.next({
        visitCategories: [{ visitCategory: 'NCD care', visitCategoryID: 5 }],
      });
      component.patientVisitForm
        .get('patientVisitDetailsForm.visitCategory')
        ?.setValue('NCD care');
      expect(masterdataService.reset).toHaveBeenCalled();
      expect(component.visitCategory).toBe('NCD care');
      expect(masterdataService.getNurseMasterData).toHaveBeenCalledWith(5, 4);
      expect(component.showVitals).toBeTrue();
      expect(component.showHistory).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
    });

    it('ignores an empty visit category selection', () => {
      init();
      component.patientVisitForm
        .get('patientVisitDetailsForm.visitCategory')
        ?.setValue(null);
      expect(masterdataService.reset).not.toHaveBeenCalled();
    });

    it('loads nurse and doctor master data when category known', () => {
      init({ visitCategory: 'ANC' });
      masterdataService.visitDetailMasterData$.next({
        visitCategories: [{ visitCategory: 'ANC', visitCategoryID: 3 }],
      });
      expect(component.visitCategoryList.length).toBe(1);
      expect(masterdataService.getNurseMasterData).toHaveBeenCalledWith(3, 4);
      expect(masterdataService.getDoctorMasterData).toHaveBeenCalledWith(3, 4);
    });

    it('skips master data when category id not found', () => {
      init({ visitCategory: 'Unknown' });
      masterdataService.visitDetailMasterData$.next({
        visitCategories: [{ visitCategory: 'ANC', visitCategoryID: 3 }],
      });
      expect(masterdataService.getNurseMasterData).not.toHaveBeenCalled();
      expect(masterdataService.getDoctorMasterData).not.toHaveBeenCalled();
    });
  });

  /* ================================================================ */
  describe('getVisitCategoryID', () => {
    beforeEach(() => init());

    it('returns null without list or category', () => {
      component.visitCategoryList = undefined;
      expect(component.getVisitCategoryID('ANC')).toBeNull();
      component.visitCategoryList = [];
      expect(component.getVisitCategoryID('')).toBeNull();
    });

    it('returns the matching id', () => {
      component.visitCategoryList = [
        { visitCategory: 'PNC', visitCategoryID: 9 },
      ];
      expect(component.getVisitCategoryID('PNC')).toBe(9);
      expect(component.getVisitCategoryID('ANC')).toBeNull();
    });
  });

  /* ================================================================ */
  describe('handleVisitType per visit category', () => {
    beforeEach(() => init({}, 'nurse'));

    it('does nothing for a falsy category', () => {
      component.showVitals = true;
      component.handleVisitType(null);
      expect(component.showVitals).toBeTrue();
    });

    it('General OPD (QC) in view mode builds quick consult & refer forms', () => {
      component.handleVisitType('General OPD (QC)', 'view');
      expect(component.showQuickConsult).toBeTrue();
      expect(component.showRefer).toBeTrue();
      expect(component.patientQuickConsultForm).toBeTruthy();
      expect(component.patientReferForm).toBeTruthy();
      expect(component.quickConsultMode.toString()).toBe('view');
    });

    it('General OPD (QC) in new mode builds vitals only', () => {
      component.handleVisitType('General OPD (QC)');
      expect(component.showVitals).toBeTrue();
      expect(component.showQuickConsult).toBeFalse();
      expect(component.patientVitalsForm).toBeTruthy();
    });

    it('Cancer Screening new mode shows history/vitals/examination', () => {
      component.handleVisitType('Cancer Screening');
      expect(component.showHistory).toBeTrue();
      expect(component.showExamination).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
      component.patientVitalsForm.patchValue({ height_cm: 150 });
      expect(component.currentVitals).toBeTruthy();
    });

    it('Cancer Screening view mode patches cancer findings', () => {
      component.handleVisitType('Cancer Screening', 'view');
      expect(component.showCaseRecord).toBeTrue();
      expect(component.caseRecordMode.toString()).toBe('view');
      (
        component.patientExaminationForm.get('oralExaminationForm') as FormGroup
      ).patchValue({ observation: 'oral-obs' });
      expect(component.findings.oralExamination).toBe('oral-obs');
    });

    it('General OPD view mode patches general findings', () => {
      component.handleVisitType('General OPD', 'view');
      expect(component.showCaseRecord).toBeTrue();
      expect(component.examinationMode.toString()).toBe('view');
      const cc = component.patientVisitForm.get(
        'patientChiefComplaintsForm'
      ) as FormGroup;
      cc.markAsDirty();
      (cc.get('complaints') as FormArray).at(0).patchValue({
        chiefComplaint: 'cough',
      });
      expect(component.findings).toBeTruthy();
    });

    it('General OPD new mode', () => {
      component.handleVisitType('General OPD');
      expect(component.showExamination).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
    });

    it('NCD screening view and new modes', () => {
      component.handleVisitType('NCD screening');
      expect(component.showNCDScreening).toBeTrue();
      expect(component.idrsScreeningForm).toBeTruthy();
      expect(component.showCaseRecord).toBeFalse();
      component.handleVisitType('NCD screening', 'view');
      expect(component.ncdScreeningMode.toString()).toBe('view');
      expect(component.showRefer).toBeTrue();
    });

    it('PNC view and new modes', () => {
      component.handleVisitType('PNC');
      expect(component.showPNC).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
      component.handleVisitType('PNC', 'view');
      expect(component.pncMode.toString()).toBe('view');
      expect(component.patientCaseRecordForm).toBeTruthy();
    });

    it('ANC new mode wires LMP / primigravida / gravida patches', () => {
      component.handleVisitType('ANC');
      expect(component.showAnc).toBeTrue();
      const details = component.patientANCForm.get(
        'patientANCDetailsForm'
      ) as FormGroup;
      details.patchValue({ lmpDate: '2024-01-01', primiGravida: true });
      expect(component.primeGravidaStatus).toBeTrue();
      expect(
        component.patientHistoryForm.get('menstrualHistory.lMPDate')?.value
      ).toEqual(new Date('2024-01-01'));
      details.patchValue({ lmpDate: null });
      component.patientANCForm
        .get('obstetricFormulaForm.gravida_G')
        ?.setValue(3);
      expect(
        component.patientHistoryForm.get('pastObstericHistory.totalNoOfPreg')
          ?.value
      ).toBe(3);
      component.patientANCForm
        .get('obstetricFormulaForm.gravida_G')
        ?.setValue(1);
      expect(
        component.patientHistoryForm.get('pastObstericHistory.totalNoOfPreg')
          ?.value
      ).toBe(3);
    });

    it('ANC view mode copies obstetric values into diagnosis', () => {
      component.handleVisitType('ANC', 'view');
      expect(component.ancMode.toString()).toBe('view');
      const diag = component.patientCaseRecordForm.get(
        'generalDiagnosisForm'
      ) as FormGroup;
      const patchSpy = spyOn(diag, 'patchValue').and.callThrough();
      component.patientANCForm
        .get('obstetricFormulaForm.gravida_G')
        ?.setValue(2);
      component.patientANCForm
        .get('patientANCDetailsForm.primiGravida')
        ?.setValue(false);
      expect(patchSpy).toHaveBeenCalledTimes(2);
    });

    it('NCD care view mode', () => {
      component.handleVisitType('NCD care', 'view');
      expect(component.showCaseRecord).toBeTrue();
      expect(component.referMode.toString()).toBe('view');
    });

    it('COVID-19 Screening new and view modes', () => {
      component.handleVisitType('COVID-19 Screening');
      expect(component.showVitals).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
      component.handleVisitType('COVID-19 Screening', 'view');
      expect(component.showCaseRecord).toBeTrue();
      expect(component.historyMode.toString()).toBe('view');
    });

    it('unknown category just hides everything', () => {
      component.showVitals = true;
      component.handleVisitType('Something else');
      expect(component.showVitals).toBeFalse();
    });

    it('specialist flag 100 shows TM referred only', () => {
      component.specialistFlag = '100';
      component.handleVisitType('ANC');
      expect(component.showTMVisitDetails).toBeTrue();
    });

    it('hideAll removes forms and triggers change detection for nurse', () => {
      component.handleVisitType('General OPD', 'view');
      const cdr = (component as any).changeDetectorRef;
      spyOn(cdr, 'detectChanges');
      component.hideAll();
      expect(component.patientMedicalForm.get('patientVitalsForm')).toBeNull();
      expect(cdr.detectChanges).toHaveBeenCalled();
      component.attendantType = 'doctor';
      cdr.detectChanges.calls.reset();
      component.hideAll();
      expect(cdr.detectChanges).not.toHaveBeenCalled();
    });
  });

  /* ================================================================ */
  describe('submit dispatchers', () => {
    beforeEach(() => init());

    const nurseMap: Array<[string, string]> = [
      ['Cancer Screening', 'submitNurseCancerVisitDetails'],
      ['NCD screening', 'submitNurseNCDScreeningVisitDetails'],
      ['General OPD (QC)', 'submitNurseQuickConsultVisitDetails'],
      ['ANC', 'submitNurseANCVisitDetails'],
      ['PNC', 'submitPatientMedicalDetailsPNC'],
      ['General OPD', 'submitNurseGeneralOPDVisitDetails'],
      ['NCD care', 'submitNurseNCDcareVisitDetails'],
      ['COVID-19 Screening', 'submitNurseCovidcareVisitDetails'],
    ];
    nurseMap.forEach(([cat, method]) => {
      it(`nurse submit routes "${cat}" to ${method}`, () => {
        const spies = nurseMap.map(([, m]) => spyOn(component as any, m));
        component.visitCategory = cat;
        const form = { f: 1 };
        component.submitPatientMedicalDetailsForm(form);
        expect(component.disableSubmitButton).toBeTrue();
        expect(component.showProgressBar).toBeTrue();
        spies.forEach((s, i) => {
          if (nurseMap[i][1] === method) {
            expect(s).toHaveBeenCalledWith(form);
          } else expect(s).not.toHaveBeenCalled();
        });
      });
    });

    const doctorMap: Array<[string, string]> = [
      ['Cancer Screening', 'submitCancerDiagnosisForm'],
      ['General OPD (QC)', 'submitQuickConsultDiagnosisForm'],
      ['ANC', 'submitANCDiagnosisForm'],
      ['PNC', 'submitPNCDiagnosisForm'],
      ['General OPD', 'submitGeneralOPDDiagnosisForm'],
      ['NCD care', 'submitNCDCareDiagnosisForm'],
      ['COVID-19 Screening', 'submitCovidCareDiagnosisForm'],
      ['NCD screening', 'submitNCDScreeningDiagnosisForm'],
    ];
    doctorMap.forEach(([cat, method]) => {
      it(`doctor submit routes "${cat}" to ${method}`, () => {
        const spies = doctorMap.map(([, m]) => spyOn(component as any, m));
        component.visitCategory = cat;
        component.submitDoctorDiagnosisForm();
        expect(component.disableSubmitButton).toBeTrue();
        spies.forEach((s, i) => {
          if (doctorMap[i][1] === method) expect(s).toHaveBeenCalled();
          else expect(s).not.toHaveBeenCalled();
        });
      });
    });
  });

  /* ================================================================ */
  describe('nurse submit flows', () => {
    const cases: Array<[string, string, string]> = [
      [
        'submitNurseQuickConsultVisitDetails',
        'postNurseGeneralQCVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseANCVisitDetails',
        'postNurseANCVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseNCDcareVisitDetails',
        'postNurseNCDCareVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseCovidcareVisitDetails',
        'postNurseCovidCareVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseNCDScreeningVisitDetails',
        'postNCDScreeningForm',
        'checkNCDScreeningRequiredData',
      ],
      [
        'submitPatientMedicalDetailsPNC',
        'postNursePNCVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseGeneralOPDVisitDetails',
        'postNurseGeneralOPDVisitForm',
        'checkNurseRequirements',
      ],
    ];

    beforeEach(() => {
      init();
      component.beneficiary = { ageVal: 40 };
    });

    cases.forEach(([method, svc, check]) => {
      describe(method, () => {
        it('does not post when validation fails', () => {
          spyOn(component as any, check).and.returnValue(0);
          (component as any)[method]({});
          expect(nurseService[svc]).not.toHaveBeenCalled();
        });

        it('navigates to nurse worklist on success', () => {
          spyOn(component as any, check).and.returnValue(1);
          sessionStorage.setItem('benFlowID', '1');
          nurseService[svc].and.returnValue(
            of({ statusCode: 200, data: { response: 'saved' } })
          );
          const resetSpy = spyOn(component.patientMedicalForm, 'reset');
          (component as any)[method]({});
          expect(resetSpy).toHaveBeenCalled();
          expect(sessionStorage.getItem('benFlowID')).toBeNull();
          expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
          expect(router.navigate).toHaveBeenCalledWith([
            '/nurse-doctor/nurse-worklist',
          ]);
        });

        it('alerts error on non-200 response', () => {
          spyOn(component as any, check).and.returnValue(1);
          component.disableSubmitButton = true;
          nurseService[svc].and.returnValue(
            of({ statusCode: 5000, errorMessage: 'bad' })
          );
          (component as any)[method]({});
          expect(component.disableSubmitButton).toBeFalse();
          expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
          expect(router.navigate).not.toHaveBeenCalled();
        });

        it('alerts error when request fails', () => {
          spyOn(component as any, check).and.returnValue(1);
          component.showProgressBar = true;
          nurseService[svc].and.returnValue(throwingObs('boom'));
          (component as any)[method]({});
          expect(component.showProgressBar).toBeFalse();
          expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
        });
      });
    });
  });

  /* ================================================================ */
  describe('nurse cancer submit', () => {
    beforeEach(() => {
      init();
      spyOn(component, 'getImageCoordinates').and.returnValue([{ x: 1 }]);
    });

    it('does nothing when cancer validation fails', () => {
      spyOn(component, 'checkCancerRequiredData').and.returnValue(false);
      component.submitNurseCancerVisitDetails({});
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });

    it('does not post when confirm returns null', () => {
      spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      confirmation.confirm.and.returnValue(of(null));
      component.submitNurseCancerVisitDetails({});
      expect(nurseService.postNurseCancerVisitForm).not.toHaveBeenCalled();
    });

    it('posts and navigates on success', () => {
      spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      nurseService.postNurseCancerVisitForm.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } })
      );
      const form = { a: 1 };
      component.submitNurseCancerVisitDetails(form);
      expect(nurseService.postNurseCancerVisitForm).toHaveBeenCalledWith(
        form,
        [{ x: 1 }],
        true
      );
      expect(confirmation.alert).toHaveBeenCalledWith('ok', 'success');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });

    it('handles 9999 status with info alert and navigates', () => {
      spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      nurseService.postNurseCancerVisitForm.and.returnValue(
        of({ statusCode: 9999, errorMessage: 'dup' })
      );
      component.submitNurseCancerVisitDetails({});
      expect(confirmation.alert).toHaveBeenCalledWith('dup', 'info');
      expect(router.navigate).toHaveBeenCalled();
    });

    it('handles other status and errors', () => {
      spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      nurseService.postNurseCancerVisitForm.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.submitNurseCancerVisitDetails({});
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      nurseService.postNurseCancerVisitForm.and.returnValue(throwingObs('x'));
      component.submitNurseCancerVisitDetails({});
      expect(confirmation.alert).toHaveBeenCalledWith('x', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  /* ================================================================ */
  describe('getImageCoordinates', () => {
    it('collects images with van & parking place ids', () => {
      init();
      const form = build({
        patientExaminationForm: {
          oralExaminationForm: { image: val({ id: 1 }) },
          abdominalExaminationForm: { image: val(null) },
          gynecologicalExaminationForm: { image: val({ id: 3 }) },
          breastExaminationForm: { image: val({ id: 4 }) },
        },
      });
      const res = component.getImageCoordinates(form);
      expect(res.length).toBe(3);
      expect(res[0]).toEqual({ id: 1, vanID: 11, parkingPlaceID: 22 });
      expect(res[2].id).toBe(4);
    });

    it('collects the abdominal image and returns empty when none', () => {
      init();
      const form = build({
        patientExaminationForm: {
          oralExaminationForm: { image: val(null) },
          abdominalExaminationForm: { image: val({ id: 2 }) },
          gynecologicalExaminationForm: { image: val(null) },
          breastExaminationForm: { image: val(null) },
        },
      });
      expect(component.getImageCoordinates(form)).toEqual([
        { id: 2, vanID: 11, parkingPlaceID: 22 },
      ]);
    });
  });

  /* ================================================================ */
  describe('doctor submit flows', () => {
    const cases: Array<[string, string, string, string]> = [
      [
        'submitANCDiagnosisForm',
        'postDoctorANCDetails',
        'checkNurseRequirements',
        'message',
      ],
      [
        'submitNCDCareDiagnosisForm',
        'postDoctorNCDCareDetails',
        'checkNurseRequirements',
        'message',
      ],
      [
        'submitCovidCareDiagnosisForm',
        'postDoctorCovidCareDetails',
        'checkNurseRequirements',
        'response',
      ],
      [
        'submitNCDScreeningDiagnosisForm',
        'postDoctorNCDScreeningDetails',
        'checkNCDScreeningRequiredData',
        'message',
      ],
      [
        'submitGeneralOPDDiagnosisForm',
        'postDoctorGeneralOPDDetails',
        'checkNurseRequirements',
        'message',
      ],
      [
        'submitPNCDiagnosisForm',
        'postDoctorPNCDetails',
        'checkNurseRequirements',
        'message',
      ],
      [
        'submitCancerDiagnosisForm',
        'postDoctorCancerVisitDetails',
        'checkCancerRequiredData',
        'message',
      ],
    ];

    beforeEach(() => {
      init({}, 'doctor');
      spyOn(component, 'getLabandPrescriptionData').and.returnValue([]);
    });

    cases.forEach(([method, svc, check, msgKey]) => {
      describe(method, () => {
        it('does not post when validation fails', () => {
          spyOn(component as any, check).and.returnValue(0);
          (component as any)[method]();
          expect(doctorService[svc]).not.toHaveBeenCalled();
        });

        it('navigates to doctor worklist on success', () => {
          spyOn(component as any, check).and.returnValue(1);
          sessionStorage.setItem('visitCode', '1');
          sessionStorage.setItem('instFlag', 'true');
          doctorService[svc].and.returnValue(
            of({ statusCode: 200, data: { [msgKey]: 'done' } })
          );
          (component as any)[method]();
          expect(doctorService[svc]).toHaveBeenCalled();
          expect(sessionStorage.getItem('visitCode')).toBeNull();
          expect(confirmation.alert).toHaveBeenCalledWith('done', 'success');
          expect(router.navigate).toHaveBeenCalledWith([
            '/nurse-doctor/doctor-worklist',
          ]);
        });

        it('alerts on non-200 response', () => {
          spyOn(component as any, check).and.returnValue(1);
          component.disableSubmitButton = true;
          doctorService[svc].and.returnValue(
            of({ statusCode: 200, data: null, errorMessage: 'nodata' })
          );
          (component as any)[method]();
          expect(component.disableSubmitButton).toBeFalse();
          expect(confirmation.alert).toHaveBeenCalledWith('nodata', 'error');
        });

        it('alerts on request error', () => {
          spyOn(component as any, check).and.returnValue(1);
          doctorService[svc].and.returnValue(throwingObs('err'));
          (component as any)[method]();
          expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
          expect(router.navigate).not.toHaveBeenCalled();
        });
      });
    });

    it('NCD screening success clears inst/suspect flags', () => {
      spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
      sessionStorage.setItem('instFlag', 'true');
      sessionStorage.setItem('suspectFlag', 'true');
      doctorService.postDoctorNCDScreeningDetails.and.returnValue(
        of({ statusCode: 200, data: { message: 'm' } })
      );
      component.submitNCDScreeningDiagnosisForm();
      expect(sessionStorage.getItem('instFlag')).toBeNull();
      expect(sessionStorage.getItem('suspectFlag')).toBeNull();
    });
  });

  /* ================================================================ */
  describe('updateDoctorDiagnosisForm', () => {
    beforeEach(() => {
      init({}, 'doctor');
      spyOn(component, 'getLabandPrescriptionData').and.returnValue([]);
    });

    const setCat = (cat: string) => session.store.set('visitCategory', cat);

    it('Cancer Screening: saves specialist observation (specialist)', () => {
      setCat('Cancer Screening');
      component.isSpecialist = true;
      spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      doctorService.saveSpecialistCancerObservation.and.returnValue(
        of({ statusCode: 200, data: { message: 'saved' } })
      );
      component.updateDoctorDiagnosisForm();
      expect(component.showProgressBar).toBeTrue();
      const args =
        doctorService.saveSpecialistCancerObservation.calls.mostRecent().args;
      expect(args[1].vanID).toBe(11);
      expect(args[1].isSpecialist).toBeTrue();
      expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
      expect(router.navigate).toHaveBeenCalledWith([
        '/common/tcspecialist-worklist',
      ]);
    });

    it('Cancer Screening: non-specialist, failure and error paths', () => {
      setCat('Cancer Screening');
      spyOn(component, 'checkCancerRequiredData').and.returnValue(true);
      doctorService.saveSpecialistCancerObservation.and.returnValue(
        of({ statusCode: 200, data: { message: 'saved' } })
      );
      component.updateDoctorDiagnosisForm();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
      doctorService.saveSpecialistCancerObservation.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.updateDoctorDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      doctorService.saveSpecialistCancerObservation.and.returnValue(
        throwingObs('e1')
      );
      component.updateDoctorDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('e1', 'error');
      expect(component.disableSubmitButton).toBeFalse();
    });

    it('Cancer Screening: skips when invalid', () => {
      setCat('Cancer Screening');
      spyOn(component, 'checkCancerRequiredData').and.returnValue(false);
      component.updateDoctorDiagnosisForm();
      expect(
        doctorService.saveSpecialistCancerObservation
      ).not.toHaveBeenCalled();
    });

    it('NCD screening: update, clears flags, specialist + non specialist', () => {
      setCat('NCD screening');
      spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
      sessionStorage.setItem('instFlag', 'true');
      doctorService.updateDoctorDiagnosisDetails.and.returnValue(
        of({ statusCode: 200, data: { message: 'u' } })
      );
      component.updateDoctorDiagnosisForm();
      expect(
        doctorService.updateDoctorDiagnosisDetails.calls.mostRecent().args[1]
      ).toBe('NCD screening');
      expect(sessionStorage.getItem('instFlag')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
      component.isSpecialist = true;
      component.updateDoctorDiagnosisForm();
      expect(router.navigate).toHaveBeenCalledWith([
        '/common/tcspecialist-worklist',
      ]);
    });

    it('NCD screening: failure, error and invalid', () => {
      setCat('NCD screening');
      const chk = spyOn(
        component,
        'checkNCDScreeningRequiredData'
      ).and.returnValue(true);
      doctorService.updateDoctorDiagnosisDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'no' })
      );
      component.updateDoctorDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('no', 'error');
      doctorService.updateDoctorDiagnosisDetails.and.returnValue(
        throwingObs('e2')
      );
      component.updateDoctorDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('e2', 'error');
      chk.and.returnValue(false);
      doctorService.updateDoctorDiagnosisDetails.calls.reset();
      component.updateDoctorDiagnosisForm();
      expect(doctorService.updateDoctorDiagnosisDetails).not.toHaveBeenCalled();
    });

    it('other categories: update success specialist / non-specialist', () => {
      setCat('ANC');
      spyOn(component, 'checkNurseRequirements').and.returnValue(1);
      doctorService.updateDoctorDiagnosisDetails.and.returnValue(
        of({ statusCode: 200, data: { message: 'ok' } })
      );
      component.updateDoctorDiagnosisForm();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
      component.isSpecialist = true;
      component.updateDoctorDiagnosisForm();
      expect(router.navigate).toHaveBeenCalledWith([
        '/common/tcspecialist-worklist',
      ]);
    });

    it('other categories: failure, error and invalid', () => {
      setCat('PNC');
      const chk = spyOn(component, 'checkNurseRequirements').and.returnValue(1);
      doctorService.updateDoctorDiagnosisDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'nope' })
      );
      component.updateDoctorDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
      doctorService.updateDoctorDiagnosisDetails.and.returnValue(
        throwingObs('e3')
      );
      component.updateDoctorDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('e3', 'error');
      chk.and.returnValue(0);
      doctorService.updateDoctorDiagnosisDetails.calls.reset();
      component.updateDoctorDiagnosisForm();
      expect(doctorService.updateDoctorDiagnosisDetails).not.toHaveBeenCalled();
    });
  });

  /* ================================================================ */
  describe('getLabandPrescriptionData', () => {
    it('returns only prescribed drugs with createdBy', () => {
      init();
      component.patientMedicalForm = build({
        patientCaseRecordForm: {
          drugPrescriptionForm: {
            prescribedDrugs: [
              { createdBy: 'd', drugName: 'A' },
              { createdBy: null, drugName: 'B' },
            ],
          },
        },
      }) as FormGroup;
      expect(component.getLabandPrescriptionData()).toEqual([
        { createdBy: 'd', drugName: 'A' },
      ]);
    });
  });

  /* ================================================================ */
  describe('checkNurseRequirements', () => {
    const run = (cat: string, attendant: string, form: FormGroup) => {
      component.visitCategory = cat;
      component.attendantType = attendant;
      component.patientMedicalForm = form;
      return component.checkNurseRequirements(form);
    };
    const notified = () =>
      confirmation.notify.calls.mostRecent()?.args[1] as string[];

    beforeEach(() => {
      init();
      spyOn(console, 'warn');
    });

    it('passes for a valid General OPD nurse form', () => {
      const form = nurseForm({
        exam: false,
        preg: [{ pregOrder: 1, pregOutcome: { pregOutcome: 'Live Birth' } }],
        allergies: [
          { allergyType: 'Food', snomedCode: '1', snomedTerm: 't' },
          { allergyType: null, snomedCode: null, snomedTerm: 't' },
        ],
      });
      expect(run('General OPD', 'nurse', form)).toBe(1);
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('collects PNC, vitals, examination, obstetric & allergy errors', () => {
      const form = nurseForm({
        pncErr: true,
        vitalsErr: true,
        exam: true,
        preg: [
          {
            pregOrder: 1,
            pregOutcome: { pregOutcome: 'Abortion' },
            abortionType: { complicationValue: 'Induced' },
            typeofFacility: REQ,
            postAbortionComplication: REQ,
            pregDuration: REQ,
          },
          {
            pregOrder: 2,
            pregOutcome: { pregOutcome: 'Abortion' },
            abortionType: REQ,
            typeofFacility: 'x',
            postAbortionComplication: 'x',
            pregDuration: 'x',
          },
        ],
        allergies: [{ allergyType: 'Food', snomedCode: null, snomedTerm: 't' }],
      });
      component.disableSubmitButton = true;
      expect(run('PNC', 'nurse', form)).toBe(0);
      const req = notified();
      expect(req).toContain(L.pncData.placeofDelivery);
      expect(req).toContain(L.pncData.typeofDelivery);
      expect(req).toContain(
        L.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.systolicBP
      );
      expect(req).toContain(
        L.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.pulseRate
      );
      expect(req).toContain(
        L.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC.height
      );
      expect(req).toContain(
        L.ExaminationData.ANC_OPD_PNCExamination.genExamination.dangersigns
      );
      expect(req).toContain(
        L.ExaminationData.ANC_OPD_PNCExamination.genExamination.typeofEdema
      );
      expect(req).toContain(L.allergyNameIsNotValid);
      const ob = L.historyData.opdNCDPNCHistory.obstetric;
      expect(req).toContain(
        ob.typeofFacility + '-' + ob.orderofPregnancy + ' 1'
      );
      expect(req).toContain(
        ob.complicationPostAbortion + '-' + ob.orderofPregnancy + ' 1'
      );
      expect(req).toContain(
        ob.noOfcompletedWeeks + '-' + ob.orderofPregnancy + ' 1'
      );
      expect(req).toContain(
        ob.typeOfAbortion + '-' + ob.orderofPregnancy + ' 2'
      );
      expect(component.disableSubmitButton).toBeFalse();
    });

    it('flags allergy with code but no term', () => {
      const form = nurseForm({
        allergies: [{ allergyType: 'Drug', snomedCode: '1', snomedTerm: null }],
      });
      expect(run('NCD care', 'nurse', form)).toBe(0);
      expect(notified()).toContain(L.allergyNameIsNotValid);
    });

    it('skips obstetric checks for doctor', () => {
      const form = nurseForm({
        caseRecord: caseRecord(),
        preg: [
          {
            pregOrder: 1,
            pregOutcome: { pregOutcome: 'Abortion' },
            abortionType: REQ,
            typeofFacility: REQ,
            postAbortionComplication: REQ,
            pregDuration: REQ,
          },
        ],
      });
      expect(run('NCD care', 'doctor', form)).toBe(1);
    });

    it('ANC nurse: primigravida and LMP required', () => {
      const form = nurseForm({ ancErr: true });
      expect(run('ANC', 'nurse', form)).toBe(0);
      expect(notified()).toContain(L.ancData.ancDataDetails.primiGravida);
      expect(notified()).toContain(
        L.ancData.ancDataDetails.lastMenstrualPeriod
      );
    });

    it('ANC doctor: RBS and haemoglobin investigations required', () => {
      component.rbsPresent = 1;
      component.heamoglobinPresent = 1;
      const form = nurseForm({
        ancErr: false,
        caseRecord: caseRecord({ labTest: [{ procedureName: null }] }),
      });
      (form.get('patientVitalsForm.rbsTestResult') as FormControl).setValue(
        null
      );
      expect(run('ANC', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.pleaseSelectRBSTestInInvestigation);
      expect(notified()).toContain(
        L.pleaseSelectHeamoglobinTestInInvestigation
      );
    });

    it('ANC doctor: passes when RBS and haemoglobin tests prescribed', () => {
      component.rbsPresent = 1;
      component.heamoglobinPresent = 1;
      const form = nurseForm({
        ancErr: false,
        caseRecord: caseRecord({
          labTest: [
            { procedureName: 'RBS Test' },
            { procedureName: 'Haemoglobin Test' },
          ],
        }),
      });
      expect(run('ANC', 'doctor', form)).toBe(1);
    });

    it('ANC doctor: empty lab test list with RBS result present only needs haemoglobin', () => {
      component.rbsPresent = 1;
      component.heamoglobinPresent = 1;
      const form = nurseForm({
        ancErr: false,
        caseRecord: caseRecord({ labTest: null }),
      });
      expect(run('ANC', 'doctor', form)).toBe(0);
      expect(notified()).not.toContain(L.pleaseSelectRBSTestInInvestigation);
      expect(notified()).toContain(
        L.pleaseSelectHeamoglobinTestInInvestigation
      );
    });

    it('COVID-19 nurse: comorbidity, contact, travel, symptom required', () => {
      const form = nurseForm({ covidErr: true, comorbidErr: true });
      expect(run('COVID-19 Screening', 'nurse', form)).toBe(0);
      const req = notified();
      expect(req).toContain(
        L.historyData.ancHistory.combordityANC_OPD_NCD_PNC.comorbidConditions
      );
      expect(req).toContain(L.contactHistory);
      expect(req).toContain(L.covid.travelHistory);
      expect(req).toContain(
        L.ExaminationData.cancerScreeningExamination.symptoms.symptoms
      );
    });

    it('COVID-19 doctor: doctor diagnosis required', () => {
      const form = nurseForm({
        caseRecord: caseRecord({ docDiagErr: true }),
      });
      expect(run('COVID-19 Screening', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.doctorDiagnosis);
    });

    it('General OPD doctor: provisional diagnosis required', () => {
      const form = nurseForm({ caseRecord: caseRecord({ provErr: true }) });
      expect(run('General OPD', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.DiagnosisDetails.provisionaldiagnosis);
    });

    it('General OPD doctor: provisional diagnosis without concept is invalid', () => {
      const form = nurseForm({ caseRecord: caseRecord({ concept: '' }) });
      expect(run('General OPD', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.provisionalDiagnosisIsNotValid);
    });

    it('PNC doctor: provisional required', () => {
      const form = nurseForm({
        pncErr: false,
        caseRecord: caseRecord({ provErr: true }),
      });
      expect(run('PNC', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.DiagnosisDetails.provisionaldiagnosis);
    });

    it('PNC doctor: provisional & confirmatory without concept invalid', () => {
      const form = nurseForm({
        pncErr: false,
        caseRecord: caseRecord({
          concept: null,
          conf: 'x',
          confConcept: undefined,
        }),
      });
      expect(run('PNC', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.provisionalDiagnosisIsNotValid);
      expect(notified()).toContain(L.confirmatoryDiagnosisIsNotValid);
    });

    it('PNC doctor: valid diagnoses pass', () => {
      const form = nurseForm({
        pncErr: false,
        caseRecord: caseRecord({ conf: 'x', confConcept: '9' }),
      });
      expect(run('PNC', 'doctor', form)).toBe(1);
    });

    it('Cancer Screening doctor: provisional diagnosis required', () => {
      const form = nurseForm({
        caseRecord: caseRecord({ cancerDiagErr: true }),
      });
      expect(run('Cancer Screening', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.DiagnosisDetails.provisionaldiagnosis);
    });

    it('NCD care: condition required', () => {
      const form = nurseForm({ caseRecord: caseRecord({ ncdCond: REQ }) });
      expect(run('NCD care', 'nurse', form)).toBe(0);
      expect(notified()).toContain(L.casesheet.ncdCondition);
    });

    it('NCD care: other condition requires text', () => {
      const form = nurseForm({
        caseRecord: caseRecord({ ncdCond: ['Other'] }),
      });
      expect(run('NCD care', 'nurse', form)).toBe(0);
      expect(notified()).toContain(L.nCDConditionOther);
      const ok = nurseForm({
        caseRecord: caseRecord({ ncdCond: ['Other'], ncdOther: 'y' }),
      });
      confirmation.notify.calls.reset();
      expect(run('NCD care', 'nurse', ok)).toBe(1);
    });

    it('NCD care: tolerates missing case record / diagnosis form', () => {
      expect(run('NCD care', 'nurse', nurseForm())).toBe(1);
      const form = nurseForm({ caseRecord: { other: 1 } });
      expect(run('NCD care', 'nurse', form)).toBe(1);
    });

    it('General OPD (QC): skips history checks without vitals', () => {
      const form = nurseForm({ noVitals: true });
      form.removeControl('patientHistoryForm');
      expect(run('General OPD (QC)', 'nurse', form)).toBe(1);
    });

    it('doctor: higher health care centre required when inst & suspect flags', () => {
      sessionStorage.setItem('instFlag', 'true');
      sessionStorage.setItem('suspectFlag', 'true');
      const form = nurseForm({ caseRecord: caseRecord() });
      expect(run('NCD care', 'doctor', form)).toBe(0);
      expect(notified()).toContain(
        'this.currentLanguageSet.Referdetails.higherhealthcarecenter'
      );
    });

    it('doctor: referral reason required for additional services', () => {
      const form = nurseForm({
        caseRecord: caseRecord(),
        refer: { list: ['svc'], reasonErr: true },
      });
      expect(run('NCD care', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.Referdetails.referralReason);
    });

    it('doctor: referral reason required for empty service list with institute', () => {
      const form = nurseForm({
        caseRecord: caseRecord(),
        refer: { list: [], inst: 'PHC', reasonErr: true },
      });
      expect(run('NCD care', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.Referdetails.referralReason);
    });

    it('doctor: referral reason required for null service list with institute', () => {
      const form = nurseForm({
        caseRecord: caseRecord(),
        refer: { list: null, inst: 'PHC', reasonErr: true },
      });
      expect(run('NCD care', 'doctor', form)).toBe(0);
      expect(notified()).toContain(L.Referdetails.referralReason);
    });

    it('doctor: referral with reason given passes', () => {
      const f1 = nurseForm({
        caseRecord: caseRecord(),
        refer: { list: ['svc'] },
      });
      expect(run('NCD care', 'doctor', f1)).toBe(1);
      const f2 = nurseForm({
        caseRecord: caseRecord(),
        refer: { list: [], inst: 'PHC' },
      });
      expect(run('NCD care', 'doctor', f2)).toBe(1);
      const f3 = nurseForm({
        caseRecord: caseRecord(),
        refer: { list: null, inst: 'PHC' },
      });
      expect(run('NCD care', 'doctor', f3)).toBe(1);
    });

    it('doctor: at least one prescription required (fallback message)', () => {
      const form = nurseForm({
        caseRecord: caseRecord({ drugs: [{ createdBy: null }] }),
      });
      expect(run('NCD care', 'doctor', form)).toBe(0);
      expect(notified()).toContain('Please add at least one prescription');
    });

    it('doctor: prescription validation errors are caught', () => {
      const cr: any = caseRecord();
      cr.drugPrescriptionForm = { prescribedDrugs: val(5) };
      const form = nurseForm({ caseRecord: cr });
      expect(run('NCD care', 'doctor', form)).toBe(1);
      expect(console.warn).toHaveBeenCalled();
    });

    it('doctor: no drug prescription form is skipped', () => {
      const cr: any = caseRecord();
      delete cr.drugPrescriptionForm;
      const form = nurseForm({ caseRecord: cr });
      expect(run('NCD care', 'doctor', form)).toBe(1);
    });

    describe('offline sync lung assessment', () => {
      afterEach(() => (environment.isMMUOfflineSync = false));

      it('requires lung assessment for adults when enabled', () => {
        environment.isMMUOfflineSync = true;
        component.enableLungAssessment = true;
        component.beneficiaryAge = 30;
        nurseService.isAssessmentDone = false;
        expect(run('General OPD', 'nurse', nurseForm())).toBe(0);
        expect(notified()).toContain('Please perform Lung Assessment');
      });

      it('does not require lung assessment when already done', () => {
        environment.isMMUOfflineSync = true;
        component.enableLungAssessment = true;
        component.beneficiaryAge = 30;
        nurseService.isAssessmentDone = true;
        expect(run('General OPD', 'nurse', nurseForm())).toBe(1);
      });
    });
  });

  /* ================================================================ */
  describe('checkCancerRequiredData', () => {
    const cancerForm = (o: any = {}) =>
      build({
        ...(o.noVitals ? {} : { patientVitalsForm: vitals(!!o.vitalsErr) }),
        patientReferForm: {
          ...refer(o.refer),
        },
        patientCaseRecordForm: {
          provisionalDiagnosisPrimaryDoctor: e(!!o.diagErr),
        },
      }) as FormGroup;
    const run = (attendant: string, form: FormGroup) => {
      component.visitCategory = 'Cancer Screening';
      component.attendantType = attendant;
      component.patientMedicalForm = form;
      return component.checkCancerRequiredData(form);
    };

    beforeEach(() => init());

    it('returns true for valid nurse data and when vitals missing', () => {
      expect(run('nurse', cancerForm())).toBeTrue();
      expect(run('nurse', cancerForm({ noVitals: true }))).toBeTrue();
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('collects vitals errors', () => {
      expect(run('nurse', cancerForm({ vitalsErr: true }))).toBeFalse();
      const req = confirmation.notify.calls.mostRecent().args[1];
      expect(req.length).toBe(4);
      expect(req).toContain(
        L.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC.weight
      );
      expect(req).toContain(
        L.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.diastolicBP
      );
    });

    it('doctor: diagnosis and referral reason for service list', () => {
      expect(
        run(
          'doctor',
          cancerForm({ diagErr: true, refer: { list: ['a'], reasonErr: true } })
        )
      ).toBeFalse();
      const req = confirmation.notify.calls.mostRecent().args[1];
      expect(req).toContain(L.DiagnosisDetails.provisionaldiagnosis);
      expect(req).toContain(L.Referdetails.referralReason);
    });

    it('doctor: referral reason for empty list with institute id', () => {
      expect(
        run(
          'doctor',
          cancerForm({ refer: { list: [], instID: 3, reasonErr: true } })
        )
      ).toBeFalse();
    });

    it('doctor: referral reason for null list with institute id', () => {
      expect(
        run(
          'doctor',
          cancerForm({ refer: { list: null, instID: 3, reasonErr: true } })
        )
      ).toBeFalse();
    });

    it('doctor: valid referral combinations pass', () => {
      expect(run('doctor', cancerForm({ refer: { list: ['a'] } }))).toBeTrue();
      expect(
        run('doctor', cancerForm({ refer: { list: [], instID: 3 } }))
      ).toBeTrue();
      expect(run('doctor', cancerForm({ refer: { list: [] } }))).toBeTrue();
      expect(
        run('doctor', cancerForm({ refer: { list: null, instID: 3 } }))
      ).toBeTrue();
      expect(run('doctor', cancerForm({ refer: { list: null } }))).toBeTrue();
    });
  });

  /* ================================================================ */
  describe('TM visit details', () => {
    const tmForm = (o: any) =>
      build({ patientVisitForm: { tmcConfirmationForm: o } }) as FormGroup;

    beforeEach(() => init());

    it('checkTMVisitDetailsRequiredData collects errors and clears list when confirmed', () => {
      const form = tmForm({
        refrredToAdditionalServiceList: val(['x']),
        isTMCConfirmed: true,
        tmcConfirmed: REQ,
      });
      expect(component.checkTMVisitDetailsRequiredData(form)).toBeFalse();
      expect(
        form.get(
          'patientVisitForm.tmcConfirmationForm.refrredToAdditionalServiceList'
        )?.value
      ).toBeNull();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        L.tmcConfirmed,
      ]);
    });

    it('checkTMVisitDetailsRequiredData flags referred institute', () => {
      const form = tmForm({
        refrredToAdditionalServiceList: REQ,
        isTMCConfirmed: false,
        tmcConfirmed: true,
      });
      expect(component.checkTMVisitDetailsRequiredData(form)).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        L.Referdetails.referredtoinstitute,
      ]);
    });

    it('checkTMVisitDetailsRequiredData passes when valid', () => {
      const form = tmForm({
        refrredToAdditionalServiceList: val(['x']),
        isTMCConfirmed: false,
        tmcConfirmed: true,
      });
      expect(component.checkTMVisitDetailsRequiredData(form)).toBeTrue();
    });

    it('submitTMPatientVisitForm posts and navigates on success', () => {
      const form = tmForm({
        refrredToAdditionalServiceList: val(['x']),
        isTMCConfirmed: false,
        tmcConfirmed: true,
      });
      doctorService.postTMReferedNurseDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'tm ok' } })
      );
      component.submitTMPatientVisitForm(form);
      const temp =
        doctorService.postTMReferedNurseDetails.calls.mostRecent().args[1];
      expect(temp.visitCode).toBe(300);
      expect(doctorService.prescribedDrugData).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith('tm ok', 'success');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });

    it('submitTMPatientVisitForm handles failure, error, invalid', () => {
      const form = tmForm({
        refrredToAdditionalServiceList: val(['x']),
        isTMCConfirmed: false,
        tmcConfirmed: true,
      });
      doctorService.postTMReferedNurseDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'tm bad' })
      );
      component.submitTMPatientVisitForm(form);
      expect(confirmation.alert).toHaveBeenCalledWith('tm bad', 'error');
      doctorService.postTMReferedNurseDetails.and.returnValue(
        throwingObs('tm err')
      );
      component.submitTMPatientVisitForm(form);
      expect(confirmation.alert).toHaveBeenCalledWith('tm err', 'error');
      spyOn(component, 'checkTMVisitDetailsRequiredData').and.returnValue(
        false
      );
      doctorService.postTMReferedNurseDetails.calls.reset();
      component.submitTMPatientVisitForm(form);
      expect(doctorService.postTMReferedNurseDetails).not.toHaveBeenCalled();
    });
  });

  /* ================================================================ */
  describe('checkNCDScreeningRequiredData', () => {
    const ncdForm = (o: any = {}) => {
      const v: any = vitals(!!o.vitalsErr);
      v.rbsCheckBox = o.rbsCheck ?? false;
      v.rbsTestResult = o.rbsResult === undefined ? 'ok' : o.rbsResult;
      return build({
        patientVitalsForm: v,
        idrsScreeningForm: {
          requiredList: val(
            o.requiredList === undefined ? null : o.requiredList
          ),
        },
        patientHistoryForm: {
          physicalActivityHistory: { activityType: e(!!o.activityErr) },
          familyHistory: {
            familyDiseaseList: o.family ?? [
              {
                diseaseType: { diseaseType: 'Diabetes Mellitus' },
                deleted: false,
                familyMembers: ['Father'],
              },
            ],
          },
        },
        patientCaseRecordForm: caseRecord(o.cr || {}),
        patientReferForm: refer(o.refer),
      }) as FormGroup;
    };
    const run = (attendant: string, form: FormGroup) => {
      component.visitCategory = 'NCD screening';
      component.attendantType = attendant;
      component.patientMedicalForm = form;
      return component.checkNCDScreeningRequiredData(form);
    };
    const notified = () => confirmation.notify.calls.mostRecent().args[1];

    beforeEach(() => {
      init();
      component.beneficiary = { ageVal: 40 };
    });

    it('passes for a valid nurse form', () => {
      expect(run('nurse', ncdForm())).toBeTrue();
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('collects nurse errors (RBS, family, activity, idrs, vitals)', () => {
      component.diabetesSelected = 1;
      component.ncdTemperature = true;
      const form = ncdForm({
        rbsCheck: true,
        rbsResult: null,
        activityErr: true,
        vitalsErr: true,
        requiredList: ['Diabetes', 'Hypertension'],
        family: [
          {
            diseaseType: { diseaseType: 'Hypertension' },
            deleted: false,
            familyMembers: null,
          },
          { diseaseType: null, deleted: false, familyMembers: null },
        ],
      });
      expect(run('nurse', form)).toBeFalse();
      const req = notified();
      expect(req).toContain('Please perform RBS Test under Vitals');
      expect(req).toContain(L.pleaseSelectDiabetesMellitusInFamilyHistory);
      expect(req).toContain(L.physicalActivity);
      expect(req).toContain(L.familyMemberInFamilyHistory);
      expect(req).toContain('Diabetes');
      expect(req).not.toContain('Hypertension');
      expect(req).toContain(
        L.vitalsDetails.vitalsCancerscreening_QC.waistCircumference
      );
      expect(req).toContain(
        L.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.temperature
      );
      expect(req).toContain(
        L.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.diastolicBP
      );
    });

    it('skips family checks for under-30 and temperature when not required', () => {
      component.beneficiary = { ageVal: 20 };
      component.ncdTemperature = false;
      const form = ncdForm({ family: [] });
      (form.get('patientVitalsForm.temperature') as FormControl).setValue(null);
      (form.get('patientVitalsForm.temperature') as FormControl).setValidators(
        Validators.required
      );
      form.get('patientVitalsForm.temperature')?.updateValueAndValidity();
      expect(run('nurse', form)).toBeTrue();
    });

    it('doctor: valid form with prescribed tests passes', () => {
      component.rbsPresent = 1;
      component.diabetesSelected = 1;
      component.visualAcuityPresent = 1;
      component.visualAcuityMandatory = 1;
      const form = ncdForm({
        cr: {
          labTest: [
            { procedureName: 'RBS Test' },
            { procedureName: 'Visual Acuity Test' },
            { procedureName: null },
          ],
        },
      });
      expect(run('doctor', form)).toBeTrue();
    });

    it('doctor: RBS under vitals or investigation & visual acuity required', () => {
      component.rbsPresent = 1;
      component.diabetesSelected = 1;
      component.visualAcuityPresent = 1;
      component.visualAcuityMandatory = 1;
      const form = ncdForm({
        rbsCheck: true,
        rbsResult: null,
        cr: { labTest: [{ procedureName: null }] },
      });
      expect(run('doctor', form)).toBeFalse();
      expect(notified()).toContain(
        'Please select RBS Test under Vitals or Investigation'
      );
      expect(notified()).toContain(
        L.pleaseSelectVisualAcuityTestInInvestigation
      );
    });

    it('doctor: RBS under investigation required when checkbox unchecked', () => {
      component.rbsPresent = 1;
      component.diabetesSelected = 1;
      component.visualAcuityPresent = 1;
      component.visualAcuityMandatory = 1;
      const form = ncdForm({
        rbsCheck: false,
        rbsResult: null,
        cr: { labTest: null },
      });
      expect(run('doctor', form)).toBeFalse();
      expect(notified()).toContain(
        'Please select RBS Test under Investigation'
      );
      expect(notified()).toContain(
        L.pleaseSelectVisualAcuityTestInInvestigation
      );
    });

    it('doctor: provisional diagnosis required when enabled / invalid without concept', () => {
      component.enableProvisionalDiag = true;
      expect(run('doctor', ncdForm({ cr: { provErr: true } }))).toBeFalse();
      expect(notified()).toContain(L.DiagnosisDetails.provisionaldiagnosis);
      expect(run('doctor', ncdForm({ cr: { concept: null } }))).toBeFalse();
      expect(notified()).toContain(L.provisionalDiagnosisIsNotValid);
    });

    it('doctor: provisional error ignored when not enabled', () => {
      component.enableProvisionalDiag = false;
      expect(run('doctor', ncdForm({ cr: { provErr: true } }))).toBeTrue();
    });

    it('doctor: higher health centre and referral reasons', () => {
      sessionStorage.setItem('instFlag', 'true');
      sessionStorage.setItem('suspectFlag', 'true');
      expect(run('doctor', ncdForm())).toBeFalse();
      expect(notified()).toContain(L.Referdetails.higherhealthcarecenter);
      sessionStorage.clear();
      expect(
        run('doctor', ncdForm({ refer: { list: ['a'], reasonErr: true } }))
      ).toBeFalse();
      expect(notified()).toContain(L.Referdetails.referralReason);
      expect(
        run(
          'doctor',
          ncdForm({ refer: { list: [], inst: 'X', reasonErr: true } })
        )
      ).toBeFalse();
      expect(
        run(
          'doctor',
          ncdForm({ refer: { list: null, inst: 'X', reasonErr: true } })
        )
      ).toBeFalse();
    });

    it('doctor: valid referral combinations pass', () => {
      expect(run('doctor', ncdForm({ refer: { list: ['a'] } }))).toBeTrue();
      expect(
        run('doctor', ncdForm({ refer: { list: [], inst: 'X' } }))
      ).toBeTrue();
      expect(run('doctor', ncdForm({ refer: { list: [] } }))).toBeTrue();
      expect(
        run('doctor', ncdForm({ refer: { list: null, inst: 'X' } }))
      ).toBeTrue();
    });

    it('requires lung assessment when offline sync enabled', () => {
      environment.isMMUOfflineSync = true;
      try {
        component.enableLungAssessment = true;
        component.beneficiaryAge = 50;
        nurseService.isAssessmentDone = false;
        expect(run('nurse', ncdForm())).toBeFalse();
        expect(notified()).toContain('Please perform Lung Assessment');
      } finally {
        environment.isMMUOfflineSync = false;
      }
    });
  });

  /* ================================================================ */
  describe('quick consult (doctor)', () => {
    const qcForm = (o: any = {}) => {
      const provList = new FormArray(
        [
          build({
            provisionalDiagnosis: o.provErr ? REQ : 'flu',
            conceptID: o.concept === undefined ? 'c1' : o.concept,
          }),
        ],
        o.provListErr ? () => ({ bad: true }) : null
      );
      const qc = new FormGroup({
        chiefComplaintList: new FormArray(
          [
            build({
              chiefComplaint: { chiefComplaintID: 1, chiefComplaint: 'Fever' },
            }),
            build({ chiefComplaint: null }),
          ],
          o.ccErr ? () => ({ bad: true }) : null
        ),
        clinicalObservation: build(o.obsErr ? REQ : 'obs'),
        provisionalDiagnosisList: provList,
        prescription: build({
          prescribedDrugs: [
            { createdBy: 'd', drugName: 'A' },
            { createdBy: null },
          ],
        }),
        test: build(o.test === undefined ? [{ name: 't1' }] : o.test),
        radiology: build(
          o.radiology === undefined ? [{ name: 'r1' }] : o.radiology
        ),
      });
      const desc: any = {
        patientQuickConsultForm: qc,
        patientReferForm: refer(o.refer),
      };
      if (o.caseRecord) desc.patientCaseRecordForm = o.caseRecord;
      return build(desc) as FormGroup;
    };
    const run = (
      form: FormGroup,
      attendant = 'doctor',
      cat = 'General OPD (QC)'
    ) => {
      component.visitCategory = cat;
      component.attendantType = attendant;
      component.patientMedicalForm = form;
      return component.checkQuickConsultDoctorData(form);
    };
    const notified = () => confirmation.notify.calls.mostRecent().args[1];

    beforeEach(() => {
      init({}, 'doctor');
      spyOn(console, 'warn');
    });

    it('checkQuickConsultDoctorData passes for valid form', () => {
      expect(run(qcForm())).toBe(1);
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('checkQuickConsultDoctorData collects form errors', () => {
      expect(
        run(
          qcForm({
            ccErr: true,
            obsErr: true,
            provListErr: true,
            provErr: true,
          })
        )
      ).toBe(0);
      const req = notified();
      expect(req).toContain(L.nurseData.chiefComplaintsDetails.chiefComplaints);
      expect(req).toContain(L.casesheet.clinicalObs);
      expect(req).toContain(L.DiagnosisDetails.provisionaldiagnosis);
    });

    it('checkQuickConsultDoctorData flags diagnosis without concept', () => {
      expect(run(qcForm({ concept: null }))).toBe(0);
      expect(notified()).toContain(L.provisionalDiagnosisIsNotValid);
    });

    it('checkQuickConsultDoctorData skips diagnosis item checks for nurse', () => {
      expect(run(qcForm({ concept: null }), 'nurse')).toBe(1);
    });

    it('checkQuickConsultDoctorData referral reasons', () => {
      expect(run(qcForm({ refer: { list: ['a'], reasonErr: true } }))).toBe(0);
      expect(
        run(qcForm({ refer: { list: [], inst: 'X', reasonErr: true } }))
      ).toBe(0);
      expect(
        run(qcForm({ refer: { list: null, inst: 'X', reasonErr: true } }))
      ).toBe(0);
      expect(notified()).toContain(L.Referdetails.referralReason);
      expect(run(qcForm({ refer: { list: ['a'] } }))).toBe(1);
      expect(run(qcForm({ refer: { list: [], inst: 'X' } }))).toBe(1);
      expect(run(qcForm({ refer: { list: [] } }))).toBe(1);
      expect(run(qcForm({ refer: { list: null, inst: 'X' } }))).toBe(1);
    });

    it('checkQuickConsultDoctorData FP referral reason list', () => {
      expect(
        run(
          qcForm({ refer: { list: null, inst: 'X', reasonListErr: true } }),
          'doctor',
          'FP & Contraceptive Services'
        )
      ).toBe(0);
      expect(
        run(
          qcForm({ refer: { list: null, inst: 'X' } }),
          'doctor',
          'FP & Contraceptive Services'
        )
      ).toBe(1);
    });

    it('checkQuickConsultDoctorData validates prescription in case record', () => {
      expect(
        run(
          qcForm({
            caseRecord: { drugPrescriptionForm: { prescribedDrugs: [] } },
          })
        )
      ).toBe(0);
      expect(notified()).toContain('Please add at least one prescription');
      expect(
        run(
          qcForm({
            caseRecord: {
              drugPrescriptionForm: { prescribedDrugs: [{ createdBy: 'd' }] },
            },
          })
        )
      ).toBe(1);
      expect(
        run(
          qcForm({
            caseRecord: { drugPrescriptionForm: { prescribedDrugs: val(7) } },
          })
        )
      ).toBe(1);
      expect(console.warn).toHaveBeenCalled();
      expect(run(qcForm({ caseRecord: { other: 1 } }))).toBe(1);
    });

    it('submitQuickConsultDiagnosisForm posts mapped payload (test + radiology)', () => {
      const form = qcForm();
      component.patientMedicalForm = form;
      component.patientReferForm = form.get('patientReferForm') as FormGroup;
      spyOn(component, 'checkQuickConsultDoctorData').and.returnValue(1);
      doctorService.postQuickConsultDetails.and.returnValue(
        of({ statusCode: 200, data: { message: 'qc ok' } })
      );
      component.submitQuickConsultDiagnosisForm();
      const payload =
        doctorService.postQuickConsultDetails.calls.mostRecent().args[0]
          .quickConsultation;
      expect(payload.chiefComplaintList[0]).toEqual(
        jasmine.objectContaining({
          chiefComplaintID: 1,
          chiefComplaint: 'Fever',
        })
      );
      expect(payload.prescription.length).toBe(1);
      expect(payload.labTestOrders).toEqual([{ name: 't1' }, { name: 'r1' }]);
      expect(payload.refer).toEqual({ refer: true });
      expect(confirmation.alert).toHaveBeenCalledWith('qc ok', 'success');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
    });

    it('submitQuickConsultDiagnosisForm handles test-only and radiology-only', () => {
      spyOn(component, 'checkQuickConsultDoctorData').and.returnValue(1);
      component.patientMedicalForm = qcForm({ radiology: null });
      component.submitQuickConsultDiagnosisForm();
      expect(
        doctorService.postQuickConsultDetails.calls.mostRecent().args[0]
          .quickConsultation.labTestOrders
      ).toEqual([{ name: 't1' }]);
      component.patientMedicalForm = qcForm({ test: null });
      component.submitQuickConsultDiagnosisForm();
      expect(
        doctorService.postQuickConsultDetails.calls.mostRecent().args[0]
          .quickConsultation.labTestOrders
      ).toEqual([{ name: 'r1' }]);
    });

    it('submitQuickConsultDiagnosisForm failure, error and invalid', () => {
      const chk = spyOn(
        component,
        'checkQuickConsultDoctorData'
      ).and.returnValue(1);
      component.patientMedicalForm = qcForm();
      doctorService.postQuickConsultDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'qc bad' })
      );
      component.submitQuickConsultDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('qc bad', 'error');
      doctorService.postQuickConsultDetails.and.returnValue(throwingObs('qe'));
      component.submitQuickConsultDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('qe', 'error');
      chk.and.returnValue(0);
      doctorService.postQuickConsultDetails.calls.reset();
      component.submitQuickConsultDiagnosisForm();
      expect(doctorService.postQuickConsultDetails).not.toHaveBeenCalled();
    });

    it('mapDoctorQuickConsultDetails filters disabled tests and maps refer', () => {
      component.patientMedicalForm = qcForm({
        test: [{ name: 't1', disabled: true }, { name: 't2' }],
      });
      const res = component.mapDoctorQuickConsultDetails();
      expect(res.labTestOrders).toEqual([{ name: 't2' }, { name: 'r1' }]);
      expect(res.prescribedDrugs.length).toBe(1);
      expect(res.test).toBeUndefined();
      expect(res.refer).toEqual({ refer: true });
      const other = doctorService.postGeneralRefer.calls.mostRecent().args[1];
      expect(other.vanID).toBe(11);
      expect(other.parkingPlaceID).toBe(22);
    });

    it('mapDoctorQuickConsultDetails test-only / radiology-only', () => {
      component.patientMedicalForm = qcForm({ radiology: null });
      expect(component.mapDoctorQuickConsultDetails().labTestOrders).toEqual([
        { name: 't1' },
      ]);
      component.patientMedicalForm = qcForm({ test: null });
      expect(component.mapDoctorQuickConsultDetails().labTestOrders).toEqual([
        { name: 'r1' },
      ]);
    });

    it('updateQuickConsultDiagnosisForm success specialist / non-specialist', () => {
      component.patientMedicalForm = qcForm();
      doctorService.updateQuickConsultDetails.and.returnValue(
        of({ statusCode: 200, data: { message: 'upd' } })
      );
      component.updateQuickConsultDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('upd', 'success');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
      component.isSpecialist = true;
      component.updateQuickConsultDiagnosisForm();
      expect(router.navigate).toHaveBeenCalledWith([
        '/common/tcspecialist-worklist',
      ]);
    });

    it('updateQuickConsultDiagnosisForm failure and error', () => {
      component.patientMedicalForm = qcForm();
      doctorService.updateQuickConsultDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'uf' })
      );
      component.updateQuickConsultDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('uf', 'error');
      doctorService.updateQuickConsultDetails.and.returnValue(
        throwingObs('ue')
      );
      component.updateQuickConsultDiagnosisForm();
      expect(confirmation.alert).toHaveBeenCalledWith('ue', 'error');
    });
  });

  /* ================================================================ */
  describe('SMS helpers', () => {
    beforeEach(() => init());

    it('SMSObjectCreation maps diagnosis and prescriptions', () => {
      component.beneficiaryRegID = 5;
      const res = component.SMSObjectCreation(
        [{ term: 'A' }, { term: 'B' }],
        [
          {
            drugName: 'Para',
            dose: '1 tab',
            drugStrength: '500mg',
            frequency: 'BD',
            duration: 3,
          },
        ],
        [77]
      );
      expect(res.diagnosisProvided).toBe('A, B');
      expect(res.prescribedDrugs[0]).toEqual({
        beneficiaryRegID: 5,
        prescribedDrugID: 77,
        drugName: 'Para',
        dosage: '1 tab (500mg)',
        frequency: 'BD',
        noOfDays: 3,
      });
    });

    it('SMSObjectCreation tolerates null inputs', () => {
      const res = component.SMSObjectCreation(null, null, []);
      expect(res.diagnosisProvided).toBeUndefined();
      expect(res.prescribedDrugs).toBeUndefined();
    });

    it('sendPrescriptionSms opens dialog and navigates after close', () => {
      component.sendPrescriptionSms({ a: 1 });
      expect(dialog.open).toHaveBeenCalledWith(
        SmsNotificationComponent,
        jasmine.objectContaining({ data: { a: 1 }, disableClose: true })
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
      component.isSpecialist = true;
      component.sendPrescriptionSms({});
      expect(router.navigate).toHaveBeenCalledWith([
        '/common/tcspecialist-worklist',
      ]);
    });
  });

  /* ================================================================ */
  describe('update-mode methods & history checks', () => {
    beforeEach(() => init());

    it('simple update mode setters', () => {
      component.updatePatientVitals();
      component.updatePatientExamination();
      component.updatePatientANC();
      component.updatePatientPNC();
      expect(component.vitalsMode.toString()).toBe('update');
      expect(component.examinationMode.toString()).toBe('update');
      expect(component.ancMode.toString()).toBe('update');
      expect(component.pncMode.toString()).toBe('update');
    });

    it('updatePatientHistory for Cancer Screening sets update directly', () => {
      component.visitCategory = 'Cancer Screening';
      component.updatePatientHistory();
      expect(component.historyMode.toString()).toBe('update');
    });

    it('updatePatientHistory for NCD screening depends on history check', () => {
      component.visitCategory = 'NCD screening';
      const chk = spyOn(component, 'checkNCDScreeningHistory').and.returnValue(
        0
      );
      component.historyMode = undefined;
      component.updatePatientHistory();
      expect(component.historyMode).toBeUndefined();
      chk.and.returnValue(1);
      component.updatePatientHistory();
      expect(component.historyMode.toString()).toBe('update');
    });

    it('updatePatientHistory for other categories depends on obstetric check', () => {
      component.visitCategory = 'ANC';
      const chk = spyOn(component, 'checkPastObstericHistory').and.returnValue(
        0
      );
      component.historyMode = undefined;
      component.updatePatientHistory();
      expect(component.historyMode).toBeUndefined();
      chk.and.returnValue(1);
      component.updatePatientHistory();
      expect(component.historyMode.toString()).toBe('update');
    });

    it('checkNCDScreeningHistory flags missing DM and family members', () => {
      component.beneficiaryAge = 40;
      const form = build({
        patientHistoryForm: {
          familyHistory: {
            familyDiseaseList: [
              {
                diseaseType: { diseaseType: 'Asthma' },
                deleted: false,
                familyMembers: [],
              },
              { diseaseType: null, deleted: false, familyMembers: null },
            ],
          },
        },
      });
      expect(component.checkNCDScreeningHistory(form)).toBe(0);
      const req = confirmation.notify.calls.mostRecent().args[1];
      expect(req).toContain(L.pleaseSelectDiabetesMellitusInFamilyHistory);
      expect(req).toContain(L.familyMemberInFamilyHistory);
    });

    it('checkNCDScreeningHistory passes for valid / young beneficiary', () => {
      component.beneficiaryAge = 40;
      const form = build({
        patientHistoryForm: {
          familyHistory: {
            familyDiseaseList: [
              {
                diseaseType: { diseaseType: 'Diabetes Mellitus' },
                deleted: false,
                familyMembers: ['Mother'],
              },
            ],
          },
        },
      });
      expect(component.checkNCDScreeningHistory(form)).toBe(1);
      component.beneficiaryAge = 20;
      const empty = build({
        patientHistoryForm: { familyHistory: { familyDiseaseList: [] } },
      });
      expect(component.checkNCDScreeningHistory(empty)).toBe(1);
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('checkPastObstericHistory collects abortion and allergy errors', () => {
      const form = build({
        patientHistoryForm: {
          pastObstericHistory: {
            pastObstericHistoryList: [
              {
                pregOrder: 1,
                pregOutcome: { pregOutcome: 'Abortion' },
                abortionType: { complicationValue: 'Induced' },
                typeofFacility: REQ,
                postAbortionComplication: REQ,
                pregDuration: REQ,
              },
              {
                pregOrder: 2,
                pregOutcome: { pregOutcome: 'Abortion' },
                abortionType: REQ,
                typeofFacility: 'x',
                postAbortionComplication: 'x',
                pregDuration: 'x',
              },
              { pregOrder: 3, pregOutcome: null },
            ],
          },
          personalHistory: {
            allergicList: [
              { allergyType: 'Food', snomedCode: '1', snomedTerm: null },
              { allergyType: 'Food', snomedCode: null, snomedTerm: 'x' },
              { allergyType: null, snomedCode: null, snomedTerm: null },
            ],
          },
        },
      });
      expect(component.checkPastObstericHistory(form)).toBe(0);
      const req = confirmation.notify.calls.mostRecent().args[1];
      expect(req.length).toBe(5);
      expect(req).toContain(L.allergyNameIsNotValid);
    });

    it('checkPastObstericHistory passes for clean history', () => {
      const form = build({
        patientHistoryForm: {
          pastObstericHistory: { pastObstericHistoryList: [] },
          personalHistory: {
            allergicList: [
              { allergyType: 'Food', snomedCode: '1', snomedTerm: 't' },
            ],
          },
        },
      });
      expect(component.checkPastObstericHistory(form)).toBe(1);
    });

    it('updatePatientNcdScreening notifies non-hypertension requirements', () => {
      component.patientMedicalForm = build({
        idrsScreeningForm: { requiredList: val(['Diabetes', 'Hypertension']) },
      }) as FormGroup;
      component.updatePatientNcdScreening();
      expect(confirmation.notify).toHaveBeenCalledWith(
        L.alerts.info.mandatoryFields,
        ['Diabetes']
      );
      expect(component.ncdScreeningMode).toBeUndefined();
    });

    it('updatePatientNcdScreening sets update mode when nothing required', () => {
      component.patientMedicalForm = build({
        idrsScreeningForm: { requiredList: val(['Hypertension']) },
      }) as FormGroup;
      component.updatePatientNcdScreening();
      expect(component.ncdScreeningMode.toString()).toBe('update');
      component.ncdScreeningMode = undefined;
      component.patientMedicalForm = build({
        idrsScreeningForm: { requiredList: val(null) },
      }) as FormGroup;
      component.updatePatientNcdScreening();
      expect(component.ncdScreeningMode.toString()).toBe('update');
    });
  });

  /* ================================================================ */
  describe('updatePending', () => {
    const pendingForm = () =>
      build({
        patientANCForm: { a: 1 },
        patientHistoryForm: { a: 1 },
        patientVitalsForm: { a: 1 },
        patientExaminationForm: { a: 1 },
        idrsScreeningForm: { a: 1 },
        patientVisitForm: { covidVaccineStatusForm: { a: 1 } },
      }) as FormGroup;
    const ev = (label: string) => ({ previouslySelectedStep: { label } });
    const expected = (label: string) =>
      L.alerts.info.dontForget + ' ' + label + ' ' + L.alerts.info.changes;

    beforeEach(() => {
      init();
      component.newLookupMode = false;
      component.patientMedicalForm = pendingForm();
    });

    ['ANC', 'History', 'Vitals', 'Examination'].forEach(label => {
      it(`alerts when ${label} form is dirty`, () => {
        const map: any = {
          ANC: 'patientANCForm',
          History: 'patientHistoryForm',
          Vitals: 'patientVitalsForm',
          Examination: 'patientExaminationForm',
        };
        component.updatePending(ev(label));
        expect(confirmation.alert).not.toHaveBeenCalled();
        component.patientMedicalForm.get(map[label])?.markAsDirty();
        component.updatePending(ev(label));
        expect(confirmation.alert).toHaveBeenCalledWith(expected(label));
      });
    });

    it('alerts for Vitals when update button enabled', () => {
      component.enableUpdateButtonInVitals = true;
      component.updatePending(ev('Vitals'));
      expect(confirmation.alert).toHaveBeenCalledWith(expected('Vitals'));
    });

    it('alerts for Screening when IDRS update disabled', () => {
      component.updatePending(ev('Screening'));
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.idrsChange(false);
      expect(component.enableIDRSUpdate).toBeFalse();
      component.updatePending(ev('Screening'));
      expect(confirmation.alert).toHaveBeenCalledWith(expected('Screening'));
    });

    it('alerts for Visit Details covid vaccination changes', () => {
      component.updatePending(ev('Visit Details'));
      expect(confirmation.alert).not.toHaveBeenCalled();
      doctorService.covidVaccineAgeGroup = '>=12 years';
      component.patientMedicalForm
        .get('patientVisitForm.covidVaccineStatusForm')
        ?.markAsDirty();
      component.updatePending(ev('Visit Details'));
      expect(confirmation.alert).toHaveBeenCalledWith(
        expected(L.covidVaccinationStatus)
      );
    });

    it('ignores unknown step labels', () => {
      component.updatePending(ev('Other'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('new lookup mode: only visit details considered', () => {
      component.newLookupMode = true;
      component.updatePending(ev('ANC'));
      component.updatePending(ev('Visit Details'));
      expect(confirmation.alert).not.toHaveBeenCalled();
      doctorService.covidVaccineAgeGroup = '>=12 years';
      doctorService.enableCovidVaccinationButton = true;
      component.updatePending(ev('Visit Details'));
      expect(confirmation.alert).toHaveBeenCalledWith(
        expected(L.covidVaccinationStatus)
      );
    });
  });

  /* ================================================================ */
  describe('misc behaviour', () => {
    beforeEach(() => init());

    it('checkMandatory alerts when no visit category and pending files', () => {
      component.visitCategory = null;
      nurseService.fileData = [{ f: 1 }];
      component.checkMandatory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        L.alerts.info.proceedFurther
      );
      expect(confirmation.alert).toHaveBeenCalledWith(
        L.common.kindlyuploadthefiles
      );
      expect(nurseService.fileData).toBeNull();
    });

    it('checkMandatory does nothing when category set and no files', () => {
      component.visitCategory = 'ANC';
      nurseService.fileData = [];
      component.checkMandatory();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('removeBeneficiaryDataForNurseVisit / DoctorVisit clear storage', () => {
      ['beneficiaryRegID', 'benFlowID', 'visitCategory', 'doctorFlag'].forEach(
        k => sessionStorage.setItem(k, '1')
      );
      component.removeBeneficiaryDataForNurseVisit();
      expect(sessionStorage.getItem('beneficiaryRegID')).toBeNull();
      expect(sessionStorage.getItem('visitCategory')).toBe('1');
      component.removeBeneficiaryDataForDoctorVisit();
      expect(sessionStorage.getItem('visitCategory')).toBeNull();
      expect(sessionStorage.getItem('doctorFlag')).toBeNull();
    });

    it('resetSpinnerandEnableTheSubmitButton resets flags', () => {
      component.disableSubmitButton = true;
      component.showProgressBar = true;
      component.resetSpinnerandEnableTheSubmitButton();
      expect(component.disableSubmitButton).toBeFalse();
      expect(component.showProgressBar).toBeFalse();
    });

    it('getPregnancyStatus tracks pregnancy status changes', () => {
      component.getPregnancyStatus();
      const vd = component.patientVisitForm.get(
        'patientVisitDetailsForm'
      ) as FormGroup;
      vd.patchValue({ pregnancyStatus: 'Yes' });
      expect(component.pregnancyStatus).toBe('Yes');
      vd.patchValue({ pregnancyStatus: null });
      expect(component.pregnancyStatus).toBeNull();
    });

    it('sideNavModeChange uses over mode on small screens', () => {
      const proto = Object.getPrototypeOf(window.screen);
      const widthSpy = spyOnProperty(proto, 'width', 'get').and.returnValue(
        500
      );
      const sidenav = { mode: '', toggle: jasmine.createSpy('toggle') };
      component.sideNavModeChange(sidenav);
      expect(sidenav.mode).toBe('over');
      widthSpy.and.returnValue(1200);
      component.sideNavModeChange(sidenav);
      expect(sidenav.mode).toBe('side');
      expect(sidenav.toggle).toHaveBeenCalledTimes(2);
    });

    it('canDeactivate returns true for TM case sheet', done => {
      session.store.set('caseSheetTMFlag', 'true');
      component.canDeactivate().subscribe(r => {
        expect(r).toBeTrue();
        expect(confirmation.confirm).not.toHaveBeenCalled();
        done();
      });
    });

    it('canDeactivate confirms when form dirty', () => {
      sessionStorage.setItem('x', '1');
      component.patientMedicalForm.markAsDirty();
      confirmation.confirm.and.returnValue(of(false));
      let result: any;
      component.canDeactivate().subscribe(r => (result = r));
      expect(result).toBeFalse();
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        L.alerts.info.navigateFurtherAlert,
        'Yes',
        'No'
      );
    });

    it('canDeactivate confirms when vitals update pending', () => {
      component.enableUpdateButtonInVitals = true;
      component.canDeactivate().subscribe();
      expect(confirmation.confirm).toHaveBeenCalled();
    });

    it('canDeactivate returns true for clean form', () => {
      let result: any;
      component.canDeactivate().subscribe(r => (result = r));
      expect(result).toBeTrue();
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });

    it('preventSubmitOnEnter prevents default', () => {
      const evt = jasmine.createSpyObj('Event', ['preventDefault']);
      component.preventSubmitOnEnter(evt);
      expect(evt.preventDefault).toHaveBeenCalled();
    });

    it('ngDoCheck refreshes language set', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toBe(L);
    });

    it('fetchLanguageResponse skips setValues without language', () => {
      const http: any = (component as any).httpServiceService;
      http.currentLangugae$ = of(null);
      spyOn(component, 'setValues');
      component.fetchLanguageResponse();
      expect(component.setValues).not.toHaveBeenCalled();
    });

    it('openBenPreviousisitDetails opens previous visit dialog', () => {
      component.openBenPreviousisitDetails();
      expect(dialog.open).toHaveBeenCalledWith(
        OpenPreviousVisitDetailsComponent,
        jasmine.objectContaining({ data: { previous: true } })
      );
    });

    it('ngAfterViewInit / ngAfterViewChecked run change detection', () => {
      const cdr = (component as any).changeDetectorRef;
      spyOn(cdr, 'detectChanges');
      component.ngAfterViewInit();
      component.ngAfterViewChecked();
      expect(cdr.detectChanges).toHaveBeenCalledTimes(2);
    });

    it('ngOnDestroy unsubscribes and clears caches', () => {
      const sub = component.tmcSubmitSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
      expect(component.rbsPresentSubscription.closed).toBeTrue();
      expect(component.enableVitalsButtonSubscription.closed).toBeTrue();
      expect(doctorService.clearCache).toHaveBeenCalled();
      expect(masterdataService.reset).toHaveBeenCalled();
    });
  });

  it('ngOnDestroy tolerates missing subscriptions before init', () => {
    component.ngOnDestroy();
    expect(doctorService.clearCache).toHaveBeenCalled();
    expect(masterdataService.reset).toHaveBeenCalled();
  });
});
