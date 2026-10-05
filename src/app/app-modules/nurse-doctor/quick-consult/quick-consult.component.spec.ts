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
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';

import { QuickConsultComponent } from './quick-consult.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { TestInVitalsService } from '../shared/services/test-in-vitals.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
import { QuickConsultUtils } from '../shared/utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

const SERVICE_LINE = JSON.stringify({ vanID: 3, parkingPlaceID: 4 });

function masterData() {
  return {
    chiefComplaintMaster: [
      { chiefComplaintID: 1, chiefComplaint: 'Fever' },
      { chiefComplaintID: 2, chiefComplaint: 'Cough' },
      { chiefComplaintID: 3, chiefComplaint: 'Ache' },
    ],
    procedures: [
      {
        procedureID: 1,
        procedureName: 'RBS Test',
        procedureType: 'Laboratory',
      },
      { procedureID: 2, procedureName: 'Xray', procedureType: 'Radiology' },
      { procedureID: 3, procedureName: 'CBC', procedureType: 'Laboratory' },
    ],
    drugFormMaster: [{ itemFormID: 1, itemFormName: 'Tablet' }],
    itemMaster: [
      {
        itemID: 1,
        itemName: 'Paracetamol',
        itemFormID: 1,
        strength: '500',
        unitOfMeasurement: 'mg',
        quantityInHand: 10,
      },
      { itemID: 5, itemName: 'Syrup', itemFormID: 2 },
    ],
    drugDoseMaster: [
      { itemFormID: 1, dose: '1 tab' },
      { itemFormID: 2, dose: '5 ml' },
    ],
    drugFrequencyMaster: ['OD'],
    drugDurationUnitMaster: ['Day'],
    routeOfAdmin: ['Oral'],
    NonEdlMaster: [
      { itemID: 2, itemName: 'Pantop', itemFormID: 1 },
      { itemID: 6, itemName: 'Other', itemFormID: 3 },
    ],
  };
}

describe('QuickConsultComponent', () => {
  let component: QuickConsultComponent;
  let fixture: ComponentFixture<QuickConsultComponent>;
  let form: FormGroup;
  let doctor: any;
  let masterSvc: any;
  let nurse: any;
  let testInVitals: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let doctorMaster$: BehaviorSubject<any>;
  let rbsSelected$: BehaviorSubject<any>;
  let rbsCurrent$: BehaviorSubject<any>;

  beforeEach(async () => {
    spyOn(console, 'log');
    doctorMaster$ = new BehaviorSubject<any>(null);
    rbsSelected$ = new BehaviorSubject<any>(undefined);
    rbsCurrent$ = new BehaviorSubject<any>(undefined);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [QuickConsultComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: SERVICE_LINE,
            userName: 'doc',
            beneficiaryRegID: 11,
            visitID: 22,
            visitCategory: 'General OPD (QC)',
          },
        }),
        FormBuilder,
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            doctorMasterData$: doctorMaster$.asObservable(),
          }),
        },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            rbsSelectedInInvestigation$: rbsSelected$.asObservable(),
            rbsTestResultCurrent$: rbsCurrent$.asObservable(),
          }),
        },
        {
          provide: TestInVitalsService,
          useValue: autoSpy(TestInVitalsService),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(QuickConsultComponent, '')
      .compileComponents();

    doctor = TestBed.inject(DoctorService) as any;
    masterSvc = TestBed.inject(MasterdataService) as any;
    nurse = TestBed.inject(NurseService) as any;
    testInVitals = TestBed.inject(TestInVitalsService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    session = TestBed.inject(SessionStorageService) as any;

    doctor.getGenericVitals.and.returnValue(
      of({
        statusCode: 200,
        data: { benAnthropometryDetail: null, benPhysicalVitalDetail: null },
      })
    );
    const utils = new QuickConsultUtils(TestBed.inject(FormBuilder), session);
    form = utils.createQuickConsultForm();
  });

  function create(mode = 'new') {
    fixture = TestBed.createComponent(QuickConsultComponent);
    component = fixture.componentInstance;
    component.patientQuickConsultForm = form;
    component.quickConsultMode = mode;
    fixture.detectChanges();
    // template is overridden, so provide the #prescriptionForm view child
    component.prescriptionForm = { form: new FormGroup({}) } as any;
    return component;
  }

  function drugs(): FormArray {
    return (form.controls['prescription'] as FormGroup).controls[
      'prescribedDrugs'
    ] as FormArray;
  }
  function diagnoses(): FormArray {
    return form.controls['provisionalDiagnosisList'] as FormArray;
  }
  function complaints(): FormArray {
    return form.controls['chiefComplaintList'] as FormArray;
  }

  describe('lifecycle', () => {
    it('initialises state, language and prescription form', () => {
      create();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(nurse.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(nurse.clearRbsInVitals).toHaveBeenCalled();
      expect(component.createdBy).toBe('doc');
      expect(component.drugPrescriptionForm).toBe(
        form.controls['prescription'] as FormGroup
      );
      expect(component.pageLimits).toEqual([0, 5]);
      expect(component.drugDurationMaster.length).toBe(29);
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      expect(component.rbsTestResultCurrent).toBeNull();
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('tracks rbs observables', () => {
      create();
      rbsSelected$.next(true);
      rbsCurrent$.next(120);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(component.rbsTestResultCurrent).toBe(120);
    });

    it('ngOnChanges resets doctor fetched rbs', () => {
      create();
      nurse.rbsTestResultFromDoctorFetch = 5;
      component.ngOnChanges();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    });

    it('ngOnDestroy unsubscribes', () => {
      create();
      doctorMaster$.next(masterData());
      nurse.rbsTestResultFromDoctorFetch = 5;
      component.ngOnDestroy();
      expect(component.masterDataSubscription.closed).toBeTrue();
      expect(component.getQuickConsultSubscription.closed).toBeTrue();
      expect(
        component.rbsSelectedInInvestigationSubscription.closed
      ).toBeTrue();
      expect(component.rbsTestResultCurrentSubscription.closed).toBeTrue();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      fixture = TestBed.createComponent(QuickConsultComponent);
      component = fixture.componentInstance;
      component.ngOnDestroy();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    });
  });

  describe('loadMasterData', () => {
    it('splits masters and loads vitals', () => {
      create();
      doctorMaster$.next(masterData());
      expect(component.chiefComplaintTemporarayList[0].length).toBe(3);
      expect(component.nonRadiologyMaster.length).toBe(2);
      expect(component.radiologyMaster.length).toBe(1);
      expect(component.drugMaster.length).toBe(2);
      expect(component.edlMaster.length).toBe(2);
      expect(doctor.getGenericVitals).toHaveBeenCalledWith({
        benRegID: 11,
        benVisitID: 22,
      });
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('fetches diagnosis details in view mode', () => {
      create('View');
      doctor.getCaseRecordAndReferDetails.and.returnValue(of(null));
      doctorMaster$.next(masterData());
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        11,
        22,
        'General OPD (QC)'
      );
    });
  });

  describe('loadVitalsFromNurse', () => {
    const vitals = {
      temperature: 98,
      systolicBP_1stReading: 120,
      diastolicBP_1stReading: 80,
      pulseRate: 70,
      respiratoryRate: 16,
      bloodGlucose_Fasting: 90,
      bloodGlucose_Random: 110,
      bloodGlucose_2hr_PP: 130,
      sPO2: 98,
      rbsTestResult: 140,
      rbsTestRemarks: 'ok',
    };

    it('patches vitals and disables rbs when fetched', () => {
      create();
      doctor.getGenericVitals.and.returnValue(
        of({
          data: {
            benAnthropometryDetail: { height_cm: 170, weight_Kg: 70, bMI: 24 },
            benPhysicalVitalDetail: vitals,
          },
        })
      );
      component.loadVitalsFromNurse();
      expect(component.bMI).toBe(24);
      expect(component.temperature).toBe(98);
      expect(component.systolicBP_1stReading).toBe(120);
      expect(component.diastolicBP_1stReading).toBe(80);
      expect(component.pulseRate).toBe(70);
      expect(component.respiratoryRate).toBe(16);
      expect(component.bloodGlucose_Fasting).toBe(90);
      expect(component.bloodGlucose_Random).toBe(110);
      expect(component.bloodGlucose_2hr_PP).toBe(130);
      expect(component.sPO2).toBe(98);
      expect(component.rbsTestResult).toBe(140);
      expect(component.rbsTestRemarks).toBe('ok');
      expect(nurse.rbsTestResultFromDoctorFetch).toBe(140);
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(140);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
      expect(testInVitals.setVitalsRBSValueInReports).toHaveBeenCalledWith(
        vitals
      );
    });

    it('leaves rbs enabled when no rbs result', () => {
      create();
      doctor.getGenericVitals.and.returnValue(
        of({
          data: {
            benAnthropometryDetail: { height_cm: 1 },
            benPhysicalVitalDetail: { ...vitals, rbsTestResult: null },
          },
        })
      );
      component.loadVitalsFromNurse();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(form.controls['rbsTestResult'].enabled).toBeTrue();
    });

    it('does nothing when vitals are missing', () => {
      create();
      component.loadVitalsFromNurse();
      expect(testInVitals.setVitalsRBSValueInReports).not.toHaveBeenCalled();
    });
  });

  describe('rbs handling', () => {
    beforeEach(() => create());

    it('checkDiasableRBS reflects investigation and fetched result', () => {
      nurse.rbsTestResultFromDoctorFetch = null;
      component.rbsSelectedInInvestigation = false;
      expect(component.checkDiasableRBS()).toBeFalse();
      component.rbsSelectedInInvestigation = true;
      expect(component.checkDiasableRBS()).toBeTrue();
      component.rbsSelectedInInvestigation = false;
      nurse.rbsTestResultFromDoctorFetch = 100;
      expect(component.checkDiasableRBS()).toBeTrue();
    });

    it('rbsResultChange enables controls when nothing selected', () => {
      nurse.rbsTestResultFromDoctorFetch = null;
      component.rbsSelectedInInvestigation = false;
      form.patchValue({ rbsTestResult: null });
      expect(component.rbsResultChange()).toBeFalse();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(null);
      expect(form.controls['rbsTestRemarks'].enabled).toBeTrue();
      component.rbsSelectedInInvestigation = true;
      form.patchValue({ rbsTestResult: 90 });
      expect(component.rbsResultChange()).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(90);
      expect(form.controls['rbsTestRemarks'].disabled).toBeTrue();
    });

    it('checkForRange alerts on out of range values', () => {
      form.patchValue({ rbsTestResult: -1 });
      component.checkForRange();
      form.patchValue({ rbsTestResult: 1001 });
      component.checkForRange();
      component.rbsPopup = true;
      component.checkForRange();
      form.patchValue({ rbsTestResult: 100 });
      component.rbsPopup = false;
      component.checkForRange();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue
      );
    });

    it('openIOTRBSModel patches the result from the device dialog', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: 150 }));
      component.openIOTRBSModel();
      expect(dialog.open).toHaveBeenCalledWith(IotcomponentComponent, {
        width: '600px',
        height: '180px',
        disableClose: true,
        data: { startAPI: environment.startRBSurl },
      });
      expect(component.rbsPopup).toBeFalse();
      expect(form.controls['rbsTestResult'].value).toBe(150);
      expect(form.controls['rbsTestResult'].dirty).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(150);
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate
      ).toHaveBeenCalledWith(
        jasmine.objectContaining({
          rbsTestResult: 150,
          createdDate: jasmine.any(Date),
        })
      );
    });

    it('openIOTRBSModel handles empty and null results', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: null }));
      component.openIOTRBSModel();
      expect(nurse.setRbsInCurrentVitals).not.toHaveBeenCalled();
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate
      ).toHaveBeenCalled();
      testInVitals.setVitalsRBSValueInReportsInUpdate.calls.reset();
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.openIOTRBSModel();
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate
      ).not.toHaveBeenCalled();
    });

    it('setRBSResultInReport skips a falsy form value', () => {
      component.patientQuickConsultForm = { value: null } as any;
      component.setRBSResultInReport();
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate
      ).not.toHaveBeenCalled();
    });

    it('checkTestName toggles rbs investigation', () => {
      component.checkTestName({
        value: [{ procedureName: 'CBC' }, { procedureName: 'rbs test' }],
      });
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
      component.checkTestName({ value: [{ procedureName: 'CBC' }] });
      expect(component.rbsSelectedInInvestigation).toBeFalse();
    });
  });

  describe('form array getters', () => {
    it('returns controls or null', () => {
      create();
      expect(component.getPrescribedDrugs()).toBe(drugs().controls);
      expect(component.getProvisionalDiagnosisList()).toBe(
        diagnoses().controls
      );
      expect(component.getChiefComplaintList()).toBe(complaints().controls);
      component.drugPrescriptionForm = new FormGroup({});
      component.patientQuickConsultForm = new FormGroup({});
      expect(component.getPrescribedDrugs()).toBeNull();
      expect(component.getProvisionalDiagnosisList()).toBeNull();
      expect(component.getChiefComplaintList()).toBeNull();
    });
  });

  describe('diagnosis', () => {
    beforeEach(() => create());

    it('adds diagnosis up to 30', () => {
      component.addDiagnosis();
      expect(diagnoses().length).toBe(2);
      for (let i = 0; i < 30; i++) component.addDiagnosis();
      expect(diagnoses().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis
      );
    });

    function validRow() {
      return new FormGroup({
        conceptID: new FormControl('1'),
        term: new FormControl('t'),
        provisionalDiagnosis: new FormControl('t'),
        viewProvisionalDiagnosisProvided: new FormControl({
          value: 't',
          disabled: true,
        }),
      });
    }

    it('deletes a valid row after confirmation', () => {
      diagnoses().clear();
      diagnoses().push(validRow());
      diagnoses().push(validRow());
      component.deleteDiagnosis(0, diagnoses().at(0));
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(diagnoses().length).toBe(1);
      expect(form.dirty).toBeTrue();
      const last = diagnoses().at(0) as FormGroup;
      component.deleteDiagnosis(0, last);
      expect(diagnoses().length).toBe(1);
      expect(last.value.term).toBeNull();
      expect(
        last.controls['viewProvisionalDiagnosisProvided'].enabled
      ).toBeTrue();
    });

    it('keeps a valid row when confirmation is declined', () => {
      diagnoses().clear();
      diagnoses().push(validRow());
      confirmation.confirm.and.returnValue(of(false));
      component.deleteDiagnosis(0, diagnoses().at(0));
      expect(diagnoses().at(0).value.term).toBe('t');
    });

    it('deletes an invalid row without confirmation', () => {
      const invalid = () =>
        new FormGroup({
          conceptID: new FormControl(null, c => ({ req: true })),
          viewProvisionalDiagnosisProvided: new FormControl({
            value: 'x',
            disabled: true,
          }),
        });
      diagnoses().clear();
      diagnoses().push(invalid());
      diagnoses().push(invalid());
      component.deleteDiagnosis(1, diagnoses().at(1));
      expect(confirmation.confirm).not.toHaveBeenCalled();
      expect(diagnoses().length).toBe(1);
      const row = diagnoses().at(0) as FormGroup;
      component.deleteDiagnosis(0, row);
      expect(
        row.controls['viewProvisionalDiagnosisProvided'].enabled
      ).toBeTrue();
    });

    it('throws for the last default row lacking the view control (app bug)', () => {
      expect(() =>
        component.deleteDiagnosis(0, diagnoses().at(0))
      ).toThrowError(TypeError);
    });

    it('onDiagnosisSelected patches selected concept', () => {
      component.onDiagnosisSelected({ conceptID: 'c', term: 'T' }, 0);
      expect(diagnoses().at(0).value).toEqual({
        conceptID: 'c',
        term: 'T',
        provisionalDiagnosis: { conceptID: 'c', term: 'T' },
      });
      component.onDiagnosisSelected(null, 0);
      expect(diagnoses().at(0).value.conceptID).toBeNull();
    });

    it('displayDiagnosis handles strings and objects', () => {
      expect(component.displayDiagnosis('abc')).toBe('abc');
      expect(component.displayDiagnosis({ term: 'T' })).toBe('T');
      expect(component.displayDiagnosis(null)).toBe('');
    });

    it('checkProvisionalDiagnosisValidity', () => {
      expect(
        component.checkProvisionalDiagnosisValidity({
          value: { conceptID: 1, term: 't' },
        })
      ).toBeFalse();
      expect(
        component.checkProvisionalDiagnosisValidity({ value: { term: 't' } })
      ).toBeTrue();
    });
  });

  describe('getDiagnosisDetails / patchDiagnosisDetails', () => {
    beforeEach(() => {
      create();
      doctorMaster$.next(masterData());
    });

    it('patches full diagnosis response', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            findings: {
              complaints: [
                { chiefComplaint: 'Fever' },
                { chiefComplaint: 'Zzz' },
              ],
              clinicalObservation: 'obs',
            },
            investigation: {
              laboratoryList: [
                { procedureID: 1, procedureName: 'RBS Test' },
                { procedureID: 2, procedureName: 'Xray' },
                { procedureID: 99, procedureName: 'Unknown' },
              ],
            },
            diagnosis: {
              diagnosisProvided: 'dx',
              externalInvestigation: 'ext',
              instruction: 'ins',
              prescriptionID: 77,
              provisionalDiagnosisList: [
                { term: 'A', conceptID: '1' },
                { term: 'B', conceptID: '2' },
              ],
            },
            prescription: [
              {
                id: 9,
                drugID: 1,
                drugName: 'Paracetamol',
                drugStrength: '500',
                drugUnit: 'mg',
                duration: 3,
                unit: 'Day',
              },
            ],
          },
        })
      );
      component.getDiagnosisDetails(11, 22, 'cat');
      expect(component.benChiefComplaints.length).toBe(2);
      expect(component.dataSource.data.length).toBe(2);
      expect(
        component.chiefComplaintMaster.map((c: any) => c.chiefComplaint)
      ).toEqual(['Cough', 'Ache']);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(2);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
      expect(form.value.test.map((t: any) => t.procedureID)).toEqual([1]);
      expect(form.value.radiology.map((t: any) => t.procedureID)).toEqual([2]);
      expect(form.value.clinicalObservation).toBe('obs');
      expect(form.value.diagnosisProvided).toBe('dx');
      expect(form.value.externalInvestigation).toBe('ext');
      expect(form.value.instruction).toBe('ins');
      expect(form.value.prescriptionID).toBe(77);
      expect(diagnoses().length).toBe(2);
      expect(diagnoses().at(1).get('term')!.value).toBe('B');
      expect(
        diagnoses().at(0).get('provisionalDiagnosis')!.disabled
      ).toBeTrue();
      expect(drugs().length).toBe(1);
      expect(drugs().at(0).value.drugStrength).toBe('500mg');
      expect(drugs().at(0).value.id).toBe(9);
    });

    it('handles sparse responses', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            findings: {},
            investigation: {},
            diagnosis: { provisionalDiagnosisList: [] },
            prescription: [],
          },
        })
      );
      component.getDiagnosisDetails(1, 2, 3);
      expect(form.value.clinicalObservation).toBeNull();
      expect(drugs().length).toBe(0);
    });

    it('ignores non-200 responses and empty data', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500, data: {} })
      );
      component.getDiagnosisDetails(1, 2, 3);
      component.patchDiagnosisDetails(null);
      expect(component.benChiefComplaints).toEqual([]);
    });
  });

  describe('medicine selection', () => {
    beforeEach(() => {
      create();
      doctorMaster$.next(masterData());
      component.tempform = { itemFormID: 1, itemFormName: 'Tablet' };
    });

    it('getFormValueChanged filters drug and dose masters by form', () => {
      component.getFormValueChanged();
      expect(component.currentPrescription.formID).toBe(1);
      expect(component.currentPrescription.formName).toBe('Tablet');
      expect(component.filteredDrugMaster.map((d: any) => d.itemID)).toEqual([
        1, 2,
      ]);
      expect(component.filteredDrugMaster[0].isEDL).toBeTrue();
      expect(component.filteredDrugMaster[1].quantityInHand).toBe(0);
      expect(component.filteredDrugDoseMaster.length).toBe(1);
      expect(component.subFilteredDrugMaster).toBe(
        component.filteredDrugMaster
      );
    });

    it('filterMedicine narrows by prefix', () => {
      component.getFormValueChanged();
      component.filterMedicine('PAN');
      expect(component.subFilteredDrugMaster.map((d: any) => d.itemID)).toEqual(
        [2]
      );
      component.filterMedicine('');
      expect(component.subFilteredDrugMaster.length).toBe(2);
    });

    it('displayFn formats options', () => {
      expect(
        component.displayFn({
          itemName: 'P',
          strength: '500',
          unitOfMeasurement: 'mg',
          quantityInHand: 4,
        })
      ).toBe('P 500mg(4)');
      expect(component.displayFn({ itemName: 'P', strength: '5' })).toBe('P 5');
      expect(component.displayFn(null)).toBe('');
    });

    it('selectMedicineObject with stock sets primary', () => {
      const option = masterData().itemMaster[0];
      component.selectMedicineObject({
        source: { value: { ...option, id: 1, isEDL: true } },
        isUserInput: true,
      });
      expect(component.currentPrescription.drugName).toBe('Paracetamol');
      expect(component.isStockAvalable).toBe('primary');
    });

    it('selectMedicineObject ignores non-user input', () => {
      component.selectMedicineObject({
        source: { value: { itemID: 1 } },
        isUserInput: false,
      });
      expect(component.currentPrescription.drugID).toBeNull();
    });

    it('selectMedicineObject without stock asks confirmation', () => {
      const option = {
        itemID: 2,
        itemName: 'Pantop',
        strength: '40',
        unitOfMeasurement: 'mg',
        quantityInHand: 0,
        isEDL: false,
      };
      component.selectMedicineObject({
        source: { value: option },
        isUserInput: true,
      });
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info ' + LANGUAGE_EN.nonEDLMedicine,
        LANGUAGE_EN.stockNotAvailableWouldYouPrescribe + 'Pantop 40mg'
      );
      expect(component.isStockAvalable).toBe('warn');

      confirmation.confirm.and.returnValue(of(false));
      component.selectMedicineObject({
        source: { value: { ...option, isEDL: true } },
        isUserInput: true,
      });
      expect(confirmation.confirm.calls.mostRecent().args[0]).toBe('info ');
      expect(component.tempDrugName).toBeNull();
      expect(component.currentPrescription.drugName).toBe('');
      expect(component.isStockAvalable).toBe('');
    });

    it('checkNotIssued blocks an already prescribed drug', () => {
      drugs().push(new FormGroup({ drugID: new FormControl(1) }));
      component.tempDrugName = { itemID: 1 };
      component.currentPrescription.drugID = 1;
      component.currentPrescription.drugName = 'Paracetamol';
      expect(component.checkNotIssued(1)).toBeFalse();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.medicinePrescribe,
        'info'
      );
      expect(component.tempDrugName.itemName).toBe('Paracetamol');
      expect(component.checkNotIssued(5)).toBeTrue();
    });

    it('reEnterMedicine clears temp name without drug id', () => {
      component.tempDrugName = { itemID: 1 };
      component.currentPrescription.drugID = null;
      component.reEnterMedicine();
      expect(component.tempDrugName).toBeNull();
      component.reEnterMedicine();
      expect(component.currentPrescription.formID).toBe(1);
    });

    it('submitForUpload adds the medicine and resets', () => {
      component.currentPrescription = {
        ...component.currentPrescription,
        drugID: 1,
        drugName: 'Paracetamol',
        drugStrength: '500',
        drugUnit: null,
        duration: 2,
        unit: 'Day',
      };
      component.submitForUpload();
      expect(drugs().length).toBe(1);
      expect(drugs().at(0).value.createdBy).toBe('doc');
      expect(drugs().at(0).value.drugStrength).toBe('500');
      expect(component.tempform).toBeNull();
      expect(component.currentPrescription.drugID).toBeNull();
    });

    it('deleteMedicine removes from UI or backend', () => {
      drugs().push(new FormGroup({ drugID: new FormControl(1) }));
      drugs().push(new FormGroup({ drugID: new FormControl(2) }));
      component.deleteMedicine(0);
      expect(drugs().length).toBe(1);
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 200 }));
      component.deleteMedicine(0, 5 as any);
      expect(doctor.deleteMedicine).toHaveBeenCalledWith(5);
      expect(drugs().length).toBe(0);
    });

    it('deleteMedicine keeps rows on backend failure or cancel', () => {
      drugs().push(new FormGroup({ drugID: new FormControl(1) }));
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 500 }));
      component.deleteMedicine(0, 5 as any);
      confirmation.confirm.and.returnValue(of(false));
      component.deleteMedicine(0);
      expect(drugs().length).toBe(1);
    });

    it('validateDrug and checkDrugFormValidity', () => {
      const med = new FormGroup({ drug: new FormControl<any>('x') });
      component.validateDrug('typed', med);
      expect(med.value.drug).toBeNull();
      med.patchValue({ drug: { a: 1 } });
      component.validateDrug({ a: 1 }, med);
      expect(med.value.drug).toEqual({ a: 1 });
      const full = {
        drug: 1,
        drugForm: 1,
        dose: 1,
        frequency: 1,
        drugDuration: 1,
        drugDurationUnit: 1,
        specialInstruction: 1,
      };
      expect(component.checkDrugFormValidity({ value: full })).toBeFalse();
      expect(
        component.checkDrugFormValidity({ value: { ...full, dose: null } })
      ).toBeTrue();
    });

    it('display helpers', () => {
      expect(component.displayDrugName({ drugDisplayName: 'D' })).toBe('D');
      expect(component.displayDrugName(null)).toBeNull();
      expect(component.displayChiefComplaint({ chiefComplaint: 'C' })).toBe(
        'C'
      );
    });
  });

  describe('chief complaints', () => {
    beforeEach(() => {
      create();
      doctorMaster$.next(masterData());
    });

    it('getSnomedCTRecord patches conceptID when found', () => {
      masterSvc.getSnomedCTRecord.and.returnValue(
        of({ data: { conceptID: 'S1' } })
      );
      component.getSnomedCTRecord('Fever', 0);
      expect(complaints().at(0).value.conceptID).toBe('S1');
      masterSvc.getSnomedCTRecord.and.returnValue(of({ data: {} }));
      complaints().at(0).patchValue({ conceptID: null });
      component.getSnomedCTRecord('Fever', 0);
      expect(complaints().at(0).value.conceptID).toBeNull();
    });

    it('addChiefComplaint builds a list excluding selected complaints', () => {
      complaints().at(0).patchValue({
        chiefComplaint: component.chiefComplaintMaster[0],
      });
      component.addChiefComplaint();
      expect(complaints().length).toBe(2);
      expect(
        component.chiefComplaintTemporarayList[1].map(
          (c: any) => c.chiefComplaint
        )
      ).toEqual(['Cough', 'Ache']);
    });

    it('addChiefComplaint skips list when all selected', () => {
      component.chiefComplaintMaster = [];
      component.addChiefComplaint();
      expect(component.chiefComplaintTemporarayList.length).toBe(1);
      expect(complaints().length).toBe(2);
    });

    it('filterComplaints moves the selection between lists', () => {
      masterSvc.getSnomedCTRecord.and.returnValue(of(null));
      const fever = component.chiefComplaintMaster[0];
      const cough = component.chiefComplaintMaster[1];
      component.chiefComplaintTemporarayList[1] =
        component.chiefComplaintMaster.slice();
      component.filterComplaints(fever, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(fever);
      component.filterComplaints(cough, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(cough);
      expect(component.chiefComplaintTemporarayList[1]).toContain(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(cough);
      component.filterComplaints({ chiefComplaint: 'none' }, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(cough);
    });

    it('suggestChiefComplaintList filters by string and object', () => {
      const fg = (v: any) =>
        new FormGroup({ chiefComplaint: new FormControl(v) });
      component.suggestChiefComplaintList(fg('co'), 0);
      expect(component.suggestedChiefComplaintList[0].length).toBe(1);
      component.suggestChiefComplaintList(fg({ chiefComplaint: 'Ach' }), 0);
      expect(component.suggestedChiefComplaintList[0][0].chiefComplaint).toBe(
        'Ache'
      );
      const none = fg('zzz');
      component.suggestChiefComplaintList(none, 0);
      expect(none.value.chiefComplaint).toBeNull();
      complaints().at(0).patchValue({ conceptID: 'x', description: 'd' });
      component.suggestChiefComplaintList(fg(''), 0);
      expect(complaints().at(0).value.conceptID).toBeNull();
      expect(complaints().at(0).value.description).toBeNull();
    });

    it('suggestChiefComplaintList with null temp list throws on length (current behaviour)', () => {
      component.chiefComplaintTemporarayList = null;
      component.suggestedChiefComplaintList = [];
      const fg = new FormGroup({ chiefComplaint: new FormControl('co') });
      expect(() => component.suggestChiefComplaintList(fg, 0)).toThrowError(
        TypeError
      );
      component.suggestedChiefComplaintList = [[]];
      const fg2 = new FormGroup({
        chiefComplaint: new FormControl({ chiefComplaint: 'x' }),
      });
      component.suggestChiefComplaintList(fg2, 0);
      expect(fg2.value.chiefComplaint).toBeNull();
    });

    it('deleteChiefComplaint restores complaint to other lists', () => {
      const fever = component.chiefComplaintMaster[0];
      component.chiefComplaintTemporarayList[1] = [
        component.chiefComplaintMaster[1],
      ];
      complaints().push(
        new FormGroup({
          chiefComplaint: new FormControl(fever),
          conceptID: new FormControl(null),
        })
      );
      component.selectedChiefComplaintList[1] = fever;
      component.suggestedChiefComplaintList[1] = [fever];
      component.deleteChiefComplaint(1, complaints().at(1));
      expect(complaints().length).toBe(1);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(4);
      expect(component.chiefComplaintTemporarayList[1].length).toBe(1);
      expect(component.selectedChiefComplaintList[1]).toBeNull();
      expect(component.suggestedChiefComplaintList[1]).toBeNull();
      expect(form.dirty).toBeTrue();
    });

    it('deleteChiefComplaint resets the last row and respects cancel', () => {
      const row = complaints().at(0);
      row.patchValue({ chiefComplaint: 'typed', conceptID: 'c' });
      component.deleteChiefComplaint(0, row);
      expect(row.value.conceptID).toBeNull();
      confirmation.confirm.and.returnValue(of(false));
      row.patchValue({ conceptID: 'c' });
      component.deleteChiefComplaint(0, row);
      expect(row.value.conceptID).toBe('c');
    });

    it('deleteChiefComplaintRow removes or resets without confirmation', () => {
      const cough = component.chiefComplaintMaster[1];
      const extra = new FormGroup({
        chiefComplaint: new FormControl(cough),
      });
      complaints().push(extra);
      component.selectedChiefComplaintList[1] = cough;
      component.suggestedChiefComplaintList[1] = [cough];
      component.deleteChiefComplaintRow(1, extra);
      expect(complaints().length).toBe(1);
      expect(component.selectedChiefComplaintList[1]).toBeNull();
      expect(
        component.chiefComplaintTemporarayList[0].map(
          (c: any) => c.chiefComplaint
        )
      ).toEqual(['Ache', 'Cough', 'Cough', 'Fever']);
      const row = complaints().at(0) as FormGroup;
      row.patchValue({ conceptID: 'c' });
      component.deleteChiefComplaintRow(0, row);
      expect(row.value.conceptID).toBeNull();
    });

    it('sortChiefComplaintList sorts alphabetically', () => {
      const list = [
        { chiefComplaint: 'b' },
        { chiefComplaint: 'a' },
        { chiefComplaint: 'b' },
      ];
      component.sortChiefComplaintList(list);
      expect(list.map(l => l.chiefComplaint)).toEqual(['a', 'b', 'b']);
    });

    it('checkComplaintFormValidity', () => {
      expect(component.checkComplaintFormValidity(null)).toBeFalse();
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: 'a', conceptID: 'b' },
        })
      ).toBeFalse();
      expect(
        component.checkComplaintFormValidity({ value: { chiefComplaint: 'a' } })
      ).toBeTrue();
    });
  });

  describe('canDisable helpers', () => {
    beforeEach(() => create());

    it('canDisableTest for RBS test when a result exists', () => {
      nurse.rbsTestResultFromDoctorFetch = null;
      component.rbsTestResultCurrent = 100;
      expect(
        component.canDisableTest({ procedureName: environment.RBSTest })
      ).toBeTrue();
      component.rbsTestResultCurrent = null;
      nurse.rbsTestResultFromDoctorFetch = 5;
      expect(
        component.canDisableTest({ procedureName: environment.RBSTest })
      ).toBeTrue();
    });

    it('canDisableTest uses the previous lab list', () => {
      nurse.rbsTestResultFromDoctorFetch = null;
      component.rbsTestResultCurrent = null;
      const t1: any = { procedureID: 1, procedureName: 'CBC' };
      expect(component.canDisableTest(t1)).toBeFalse();
      component.previousLabTestList = [{ procedureID: 1 }];
      expect(component.canDisableTest(t1)).toBeTrue();
      expect(t1.disabled).toBeTrue();
      const t2: any = { procedureID: 2, procedureName: 'X' };
      expect(component.canDisableTest(t2)).toBeFalse();
      expect(t2.disabled).toBeFalse();
    });

    it('canDisableComplaints uses previous complaints', () => {
      const c: any = { chiefComplaintID: 1 };
      expect(component.canDisableComplaints(c)).toBeFalse();
      component.previousChiefComplaints = [{ chiefComplaintID: 1 }];
      expect(component.canDisableComplaints(c)).toBeTrue();
      expect(c.disabled).toBeTrue();
      const c2: any = { chiefComplaintID: 2 };
      expect(component.canDisableComplaints(c2)).toBeFalse();
      expect(c2.disabled).toBeFalse();
    });
  });

  describe('diagnosis search paging', () => {
    beforeEach(() => create());

    it('fetches first page for terms of 3+ chars', () => {
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ id: 1, term: 'fever' }] } })
      );
      component.onDiagnosisInputKeyup(' fev ', 0);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        0
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1, term: 'fever' },
      ]);
      expect(component.pageByIndex[0]).toBe(0);
      expect(component.loadingMore[0]).toBeFalse();
      component.onDiagnosisInputKeyup('fev', 0);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(2);
    });

    it('resets for short terms', () => {
      component.onDiagnosisInputKeyup('fe', 0);
      component.onDiagnosisInputKeyup(null as any, 1);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.lastQueryByIndex[1]).toBe('');
      expect(masterSvc.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('appends unique results and marks noMore on empty page', () => {
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ id: 1 }, { code: 'c' }] } })
      );
      component.onDiagnosisInputKeyup('fever', 0);
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ id: 1 }, { term: 't' }] } })
      );
      component.onAutoNearEnd(0);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fever',
        1
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { code: 'c' },
        { term: 't' },
      ]);
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(of({}));
      component.onAutoNearEnd(0);
      expect(component.noMore[0]).toBeTrue();
      masterSvc.searchDiagnosisBasedOnPageNo.calls.reset();
      component.onAutoNearEnd(0);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('append starts from an empty list', () => {
      component.lastQueryByIndex[2] = 'abc';
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ id: 3 }] } })
      );
      component.onAutoNearEnd(2);
      expect(component.suggestedDiagnosisList[2]).toEqual([{ id: 3 }]);
      expect(component.pageByIndex[2]).toBe(1);
    });

    it('queues a request while loading and chains on completion', () => {
      const pending = new Subject<any>();
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(pending);
      component.onDiagnosisInputKeyup('fever', 0);
      expect(component.loadingMore[0]).toBeTrue();
      component.onAutoNearEnd(0);
      expect(component.wantMore[0]).toBeTrue();
      component.onDiagnosisInputKeyup('fever', 0); // blocked while loading
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(1);
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ id: 2 }] } })
      );
      pending.next({ data: { sctMaster: [{ id: 1 }] } });
      pending.complete();
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(2);
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
    });

    it('drops stale responses and logs errors', () => {
      spyOn(console, 'error');
      const pending = new Subject<any>();
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(pending);
      component.onDiagnosisInputKeyup('fever', 0);
      component.lastQueryByIndex[0] = 'other';
      pending.next({ data: { sctMaster: [{ id: 1 }] } });
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      masterSvc.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.loadingMore[1] = false;
      component.lastQueryByIndex[1] = 'abc';
      component.onAutoNearEnd(1);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching diagnosis data'
      );
    });

    it('fetchPage without term does nothing', () => {
      component.onAutoNearEnd(5);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('onPanelReady bootstraps pages until scrollable', () => {
      const frames: (() => void)[] = [];
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: any) => {
        frames.push(cb);
        return 0;
      });
      const panel: any = { scrollHeight: 100, clientHeight: 100 };
      component.lastQueryByIndex[0] = 'fever';
      let n = 0;
      masterSvc.searchDiagnosisBasedOnPageNo.and.callFake(() =>
        of({ data: { sctMaster: [{ id: ++n }] } })
      );
      component.onPanelReady(0, panel);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(1);
      component.loadingMore[0] = true;
      frames.shift()!();
      expect(frames.length).toBe(1); // re-queued while loading
      component.loadingMore[0] = false;
      frames.shift()!();
      frames.shift()!();
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(3);
      frames.shift()!(); // max pages reached
      expect(frames.length).toBe(0);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(3);
    });

    it('onPanelReady stops when scrollable, noMore, or short term', () => {
      component.lastQueryByIndex[0] = 'fe';
      component.onPanelReady(0, { scrollHeight: 10, clientHeight: 10 } as any);
      component.lastQueryByIndex[0] = 'fever';
      component.onPanelReady(0, { scrollHeight: 50, clientHeight: 10 } as any);
      component.noMore[0] = true;
      component.onPanelReady(0, { scrollHeight: 10, clientHeight: 10 } as any);
      expect(masterSvc.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });
  });
});
