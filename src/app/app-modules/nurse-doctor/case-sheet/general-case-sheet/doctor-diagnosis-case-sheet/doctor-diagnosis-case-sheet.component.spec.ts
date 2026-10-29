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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { DoctorDiagnosisCaseSheetComponent } from './doctor-diagnosis-case-sheet.component';

describe('DoctorDiagnosisCaseSheetComponent', () => {
  let component: DoctorDiagnosisCaseSheetComponent;
  let fixture: ComponentFixture<DoctorDiagnosisCaseSheetComponent>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let session: any;

  const setup = async (sessionValues: Record<string, any> = {}) => {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    master = autoSpy(MasterdataService);
    doctor.getHRPDetails.and.returnValue(
      of({ statusCode: 200, data: { isHRP: true } })
    );
    doctor.getAssessment.and.returnValue(of({ statusCode: 200, data: null }));
    doctor.getUserId.and.returnValue(of({ userId: 77 }));
    doctor.downloadSign.and.returnValue(
      of(new Blob(['sig'], { type: 'image/png' }))
    );
    master.getVaccinationTypeAndDoseMaster.and.returnValue(
      of({ statusCode: 200, data: null })
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorDiagnosisCaseSheetComponent],
      providers: [
        ...commonTestProviders({
          session: {
            caseSheetVisitCategory: 'ANC',
            caseSheetBeneficiaryRegID: '101',
            visitCode: '555',
            ...sessionValues,
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DoctorDiagnosisCaseSheetComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    spyOn(console, 'log');
    spyOn(console, 'error');
  };

  const sheet = (over: any = {}): any => ({
    BeneficiaryData: {
      serviceDate: '2024-03-05T08:09:10',
      consultationDate: '2024-03-06T11:12:13',
      ageVal: 30,
      ...(over.ben || {}),
    },
    nurseData: {
      covidDetails: over.covid,
      vitals: {
        benAnthropometryDetail: { weight_Kg: 60 },
        benPhysicalVitalDetail: {
          rbsTestResult: 110,
          rbsTestRemarks: 'ok',
          createdDate: 'd1',
        },
      },
      anc: { lmp: 'x' },
      idrs: over.idrs,
    },
    doctorData: over.doctorData || {
      diagnosis: {
        createdBy: 'drX',
        ncdScreeningCondition: 'Diabetes||Hypertension',
        complicationOfCurrentPregnancy: 'Anemia, Other-complications : null',
      },
      LabReport: [{ procedureName: 'CBC' }],
      Refer: {
        revisitDate: '2024-04-01T00:00:00',
        refrredToAdditionalServiceList: [],
      },
    },
  });

  describe('ngOnInit', () => {
    it('fetches language, HRP status and assessment; no TC data by default', async () => {
      await setup();
      component.ngOnInit();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('ANC');
      expect(doctor.getHRPDetails).toHaveBeenCalledWith('101', '555');
      expect(component.showHRP).toBe('true');
      expect(doctor.getAssessment).toHaveBeenCalledWith('101');
      expect(doctor.getMMUCasesheetData).not.toHaveBeenCalled();
      expect(component.enableTCReferredMMUData).toBeFalse();
    });

    it('sets showHRP false when not HRP and ignores non-200', async () => {
      await setup();
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } })
      );
      component.fetchHRPPositive();
      expect(component.showHRP).toBe('false');
      component.showHRP = 'x';
      doctor.getHRPDetails.and.returnValue(of({ statusCode: 500 }));
      component.fetchHRPPositive();
      expect(component.showHRP).toBe('x');
    });

    it('loads MMU case sheet when caseSheetTMFlag is true', async () => {
      await setup({
        caseSheetTMFlag: 'true',
        caseSheetBenFlowID: 'f1',
        caseSheetVisitID: 'v1',
        caseSheetVisitCode: 'c1',
      });
      doctor.getMMUCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.ngOnInit();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'ANC',
        benFlowID: 'f1',
        benVisitID: 'v1',
        beneficiaryRegID: '101',
        visitCode: 'c1',
      });
      expect(component.enableTCReferredMMUData).toBeTrue();
    });

    it('loads MMU case sheet when specialistFlag is 200', async () => {
      await setup({ specialistFlag: '200' });
      doctor.getMMUCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.ngOnInit();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalled();
      expect(component.enableTCReferredMMUData).toBeTrue();
    });
  });

  describe('getMMUCasesheetDataInTCReferred', () => {
    beforeEach(async () => setup());

    it('prepends RBS lab report, builds service list and refer details', () => {
      doctor.getMMUCasesheetData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            nurseData: {
              vitals: {
                benPhysicalVitalDetail: {
                  rbsTestResult: 150,
                  rbsTestRemarks: 'high',
                  createdDate: 'd',
                },
              },
            },
            doctorData: {
              LabReport: [{ procedureName: 'X' }],
              diagnosis: { createdBy: 'mmuDoc' },
              Refer: {
                refrredToAdditionalServiceList: [
                  { serviceName: 'A' },
                  { serviceName: null },
                  { serviceName: '' },
                  { serviceName: 'B' },
                ],
              },
            },
          },
        })
      );
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.MMUcaseRecords.LabReport.length).toBe(2);
      expect(component.MMUcaseRecords.LabReport[0].procedureName).toBe(
        'RBS Test'
      );
      expect(
        component.MMUcaseRecords.LabReport[0].componentList[0].testResultValue
      ).toBe(150);
      expect(component.mmuServiceList).toBe('A,B');
      expect(component.userName).toBe('mmuDoc');
      expect(component.mmuCaseSheetData.referDetails).toEqual(
        component.MMUReferDetails
      );
    });

    it('handles no RBS and no refer', () => {
      doctor.getMMUCasesheetData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            nurseData: { vitals: { benPhysicalVitalDetail: {} } },
            doctorData: { LabReport: [] },
          },
        })
      );
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.MMUcaseRecords.LabReport).toEqual([]);
      expect(component.mmuServiceList).toBe('');
      expect(component.mmuCaseSheetData.referDetails).toBeUndefined();
    });

    it('ignores non-200 response', () => {
      doctor.getMMUCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.mmuCaseSheetData).toBeUndefined();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(async () => setup());

    it('does nothing without caseSheetData', () => {
      component.ngOnChanges();
      expect(component.ncdScreeningCondition).toBeNull();
      expect(component.beneficiaryDetails).toBeUndefined();
    });

    it('formats dates, vitals, ncd condition, complications, refer revisit date', () => {
      component.visitCategory = 'ANC';
      component.caseSheetData = sheet();
      component.ngOnChanges();
      expect(component.userName).toBe('drX');
      expect(component.beneficiaryDetails.serviceDate).toBe(
        '05/03/2024 08:09:10'
      );
      expect(component.beneficiaryDetails.consultationDate).toBe(
        '06/03/2024 11:12:13'
      );
      expect(component.currentVitals.weight_Kg).toBe(60);
      expect(component.ncdScreeningCondition).toBe('Diabetes,Hypertension');
      expect(component.caseRecords.LabReport[0].procedureName).toBe('RBS Test');
      expect(component.caseRecords.LabReport.length).toBe(2);
      expect(component.tempComplication).toBeTrue();
      expect(component.newComp).toBe('Anemia');
      expect(component.referDetails.revisitDate).toBe('01/04/2024');
      expect(component.caseSheetData.referDetails).toBe(component.referDetails);
      expect(component.ancDetails).toEqual({ lmp: 'x' });
      expect(master.getVaccinationTypeAndDoseMaster).toHaveBeenCalled();
    });

    it('keeps a valid DD/MM/YYYY revisit date and no other complications', () => {
      const s = sheet({
        doctorData: {
          diagnosis: { complicationOfCurrentPregnancy: 'Anemia' },
          LabReport: [],
          Refer: { revisitDate: '10/10/2024' },
        },
        ben: { serviceDate: null, consultationDate: null, ageVal: 5 },
      });
      s.nurseData.vitals.benPhysicalVitalDetail = {};
      component.caseSheetData = s;
      component.ngOnChanges();
      expect(component.tempComplication).toBeFalse();
      expect(component.referDetails.revisitDate).toBe('10/10/2024');
      expect(component.caseRecords.LabReport).toEqual([]);
      expect(component.ncdScreeningCondition).toBeNull();
      expect(master.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });

    it('maps General OPD (QC) doctor data and service list', () => {
      component.visitCategory = 'General OPD (QC)';
      component.caseSheetData = sheet({
        doctorData: {
          findings: 'f',
          prescription: 'p',
          diagnosis: {
            diagnosisProvided: 'dp',
            instruction: 'ins',
            externalInvestigation: 'ext',
          },
          LabReport: [],
          Refer: {
            refrredToAdditionalServiceList: [
              { serviceName: 'S1' },
              { serviceName: '' },
            ],
          },
        },
      });
      component.ngOnChanges();
      expect(component.caseRecords.diagnosis).toEqual({
        provisionalDiagnosis: 'dp',
        specialistAdvice: 'ins',
        externalInvestigation: 'ext',
      });
      expect(component.caseRecords.findings).toBe('f');
      expect(component.serviceList).toBe('S1');
    });

    it('reads covid details: symptoms, contacts, travel, suspected, recommendation', () => {
      component.caseSheetData = sheet({
        covid: {
          symptom: ['fever'],
          contactStatus: ['c1'],
          travelStatus: true,
          suspectedStatusUI: 'Yes',
          recommendation: [['r1', 'r2']],
        },
      });
      component.ngOnChanges();
      expect(component.symptomsList).toEqual(['fever']);
      expect(component.symptomFlag).toBeTrue();
      expect(component.contactFlag).toBeTrue();
      expect(component.travelFlag).toBeTrue();
      expect(component.travelStatus).toBe('Yes');
      expect(component.suspectedFlag).toBeTrue();
      expect(component.suspected).toBe('Yes');
      expect(component.recFlag).toBeTrue();
      expect(component.recommendationText).toBe('r1\nr2');
    });

    it('handles travelStatus false, other travel value and empty contacts', () => {
      component.caseSheetData = sheet({
        covid: { contactStatus: [], travelStatus: false },
      });
      component.ngOnChanges();
      expect(component.contactFlag).toBeFalse();
      expect(component.travelStatus).toBe('No');
      expect(component.travelFlag).toBeTrue();

      component.caseSheetData = sheet({ covid: { travelStatus: 'maybe' } });
      component.ngOnChanges();
      expect(component.travelFlag).toBeFalse();
    });

    it('extracts unique yes-answered IDRS questions and diseases', () => {
      component.caseSheetData = sheet({
        idrs: {
          IDRSDetail: {
            idrsDetails: [
              { idrsQuestionId: 1, answer: 'yes' },
              { idrsQuestionId: 1, answer: 'yes' },
              { idrsQuestionId: 2, answer: 'no' },
              { idrsQuestionId: 3, answer: 'yes' },
            ],
            suspectedDisease: 'A,B',
            confirmedDisease: 'C',
          },
        },
      });
      component.ngOnChanges();
      expect(component.temp1.map((x: any) => x.idrsQuestionId)).toEqual([1, 3]);
      expect(component.suspect).toEqual(['A', 'B']);
      expect(component.suspectt).toEqual(['C']);
      expect(component.idrsScore).toBe(
        component.caseSheetData.nurseData.idrs.IDRSDetail
      );
    });

    it('downloads signature when doctorSignatureFlag is set', () => {
      spyOn(component, 'downloadSign');
      component.caseSheetData = sheet({ ben: { doctorSignatureFlag: true } });
      component.ngOnChanges();
      expect(component.downloadSign).toHaveBeenCalled();
    });
  });

  describe('signature', () => {
    beforeEach(async () => setup());

    it('downloadSign uses tCSpecialistUserID when present', () => {
      spyOn(component, 'showSign');
      component.beneficiaryDetails = { tCSpecialistUserID: 9 };
      component.userName = 'drX';
      component.downloadSign();
      expect(doctor.getUserId).toHaveBeenCalledWith('drX');
      expect(doctor.downloadSign).toHaveBeenCalledWith(9);
      expect(component.showSign).toHaveBeenCalledWith(jasmine.any(Blob));
    });

    it('downloadSign falls back to the fetched userId and logs errors', () => {
      doctor.downloadSign.and.returnValue(throwingObs('x'));
      component.beneficiaryDetails = {};
      component.downloadSign();
      expect(doctor.downloadSign).toHaveBeenCalledWith(77);
      expect(console.error).toHaveBeenCalled();
    });

    it('getUserId maps missing userId to null', done => {
      doctor.getUserId.and.returnValue(of(null));
      component.getUserId().subscribe(v => {
        expect(v).toBeNull();
        done();
      });
    });

    it('showSign reads the blob into imgUrl', done => {
      component.showSign(new Blob(['abc'], { type: 'text/plain' }));
      setTimeout(() => {
        expect(String(component.imgUrl)).toContain('data:text/plain');
        done();
      }, 50);
    });
  });

  describe('padLeft', () => {
    beforeEach(async () => setup());
    it('pads single digits and leaves longer values', () => {
      expect(String(component.padLeft.apply(5 as any))).toBe('05');
      expect(String(component.padLeft.apply(2024 as any))).toBe('2024');
    });
  });

  describe('covid vaccination', () => {
    beforeEach(async () => setup());

    it('skips master fetch without beneficiary details or under 12', () => {
      component.getVaccinationTypeAndDoseMaster();
      component.beneficiaryDetails = { ageVal: 10 };
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });

    it('loads masters then previous vaccination with filtered types', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({
          statusCode: 200,
          data: {
            doseType: [{ covidDoseTypeID: 1 }, { covidDoseTypeID: 2 }],
            vaccineType: [{ covidVaccineTypeID: 5 }, { covidVaccineTypeID: 6 }],
          },
        })
      );
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidVSID: 3, doseTypeID: 2, covidVaccineTypeID: 5 },
        })
      );
      component.beneficiaryDetails = { ageVal: 20 };
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
        '101'
      );
      expect(component.covidVaccineDetails.doseTypeID).toEqual([
        { covidDoseTypeID: 2 },
      ]);
      expect(component.covidVaccineDetails.covidVaccineTypeID).toEqual([
        { covidVaccineTypeID: 5 },
      ]);
    });

    it('keeps raw ids when dose/vaccine ids are missing; ignores no covidVSID', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: { covidVSID: 3 } })
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toEqual({ covidVSID: 3 });

      component.covidVaccineDetails = undefined;
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toBeUndefined();
    });

    it('logs errors and ignores non-200', () => {
      const err = throwingObs({ errorMessage: 'e' });
      master.getVaccinationTypeAndDoseMaster.and.returnValue(err);
      component.beneficiaryDetails = { ageVal: 20 };
      component.getVaccinationTypeAndDoseMaster();
      master.getPreviousCovidVaccinationDetails.and.returnValue(err);
      component.getPreviousCovidVaccinationDetails([], []);
      expect(console.log).toHaveBeenCalledWith('error', 'e');

      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 500 })
      );
      master.getPreviousCovidVaccinationDetails.calls.reset();
      component.getVaccinationTypeAndDoseMaster();
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 500 })
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toBeUndefined();
    });
  });

  describe('assessment', () => {
    beforeEach(async () => setup());

    it('fetches details for last assessment id and enables result', () => {
      doctor.getAssessment.and.returnValue(
        of({
          statusCode: 200,
          data: [{ assessmentId: 1 }, { assessmentId: 2 }],
        })
      );
      doctor.getAssessmentDet.and.returnValue(
        of({
          statusCode: 200,
          data: {
            severity: 'mild',
            cough_pattern: 'dry',
            cough_severity_score: 3,
            record_duration: 10,
          },
        })
      );
      component.getAssessmentID();
      expect(doctor.getAssessmentDet).toHaveBeenCalledWith(2);
      expect(component.severity).toBe('mild');
      expect(component.cough_pattern).toBe('dry');
      expect(component.cough_severity_score).toBe(3);
      expect(component.record_duration).toBe(10);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(component.enableResult).toBeTrue();
    });

    it('skips details when assessment id is null or response empty', () => {
      doctor.getAssessment.and.returnValue(
        of({ statusCode: 200, data: [{ assessmentId: null }] })
      );
      component.getAssessmentID();
      expect(doctor.getAssessmentDet).not.toHaveBeenCalled();
      doctor.getAssessmentDet.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.getAssessmentDetails(1);
      expect(component.enableResult).toBeFalse();
    });
  });

  it('ngDoCheck refreshes language', async () => {
    await setup();
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
