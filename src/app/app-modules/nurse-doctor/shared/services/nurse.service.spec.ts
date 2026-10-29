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

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { NurseService } from './nurse.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { FormControl, FormGroup, FormArray } from '@angular/forms';

describe('NurseService', () => {
  let service: NurseService;
  let httpMock: HttpTestingController;
  let sessionStorageSpy: jasmine.SpyObj<SessionStorageService>;
  let spinnerSpy: jasmine.SpyObj<SpinnerService>;

  beforeEach(() => {
    sessionStorageSpy = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);
    sessionStorageSpy.getItem.and.callFake((key: string) => {
      const store: Record<string, string> = {
        providerServiceID: '1234',
        serviceID: '5',
        serviceLineDetails: JSON.stringify({ vanID: 10, parkingPlaceID: 20 }),
        beneficiaryRegID: '9876',
        visitID: '111',
        benFlowID: '222',
        beneficiaryID: '333',
        sessionID: 'sess1',
        userName: 'testUser',
        beneficiaryGender: 'Male',
      };
      return store[key] || null;
    });

    spinnerSpy = jasmine.createSpyObj('SpinnerService', ['setLoading']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NurseService,
        { provide: SpinnerService, useValue: spinnerSpy },
        { provide: SessionStorageService, useValue: sessionStorageSpy },
      ],
    });

    service = TestBed.inject(NurseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------
  // Initial property values
  // -------------------------------------------------------------------
  describe('initial state', () => {
    it('should have temp set to false', () => {
      expect(service.temp).toBeFalse();
    });

    it('should have rbsSelectedInvestigation set to false', () => {
      expect(service.rbsSelectedInvestigation).toBeFalse();
    });

    it('should have rbsCurrentTestResult set to null', () => {
      expect(service.rbsCurrentTestResult).toBeNull();
    });

    it('should have isAssessmentDone set to false', () => {
      expect(service.isAssessmentDone).toBeFalse();
    });
  });

  // -------------------------------------------------------------------
  // Subject / BehaviorSubject emissions
  // -------------------------------------------------------------------
  describe('BehaviorSubject - ncdTemp', () => {
    it('should emit initial value false', (done: DoneFn) => {
      service.ncdTemp$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setNCDTemp should emit the given score', (done: DoneFn) => {
      service.setNCDTemp(true);
      service.ncdTemp$.subscribe(value => {
        expect(value).toBeTrue();
        done();
      });
    });

    it('clearMessage should reset ncdTemp to false', (done: DoneFn) => {
      service.setNCDTemp(true);
      service.clearMessage();
      service.ncdTemp$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setNCDTemp should also update temp property', () => {
      service.setNCDTemp(true);
      expect(service.temp).toBeTrue();
    });

    it('clearMessage should reset temp property to false', () => {
      service.setNCDTemp(true);
      service.clearMessage();
      expect(service.temp).toBeFalse();
    });
  });

  describe('BehaviorSubject - rbsSelectedInInvestigation', () => {
    it('should emit initial value false', (done: DoneFn) => {
      service.rbsSelectedInInvestigation$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setRbsSelectedInInvestigation should emit the given score', (done: DoneFn) => {
      service.setRbsSelectedInInvestigation(true);
      service.rbsSelectedInInvestigation$.subscribe(value => {
        expect(value).toBeTrue();
        done();
      });
    });

    it('clearRbsSelectedInInvestigation should reset to false', (done: DoneFn) => {
      service.setRbsSelectedInInvestigation(true);
      service.clearRbsSelectedInInvestigation();
      service.rbsSelectedInInvestigation$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });
  });

  describe('BehaviorSubject - rbsTestResultCurrent', () => {
    it('should emit initial value null', (done: DoneFn) => {
      service.rbsTestResultCurrent$.subscribe(value => {
        expect(value).toBeNull();
        done();
      });
    });

    it('setRbsInCurrentVitals should emit the given score', (done: DoneFn) => {
      service.setRbsInCurrentVitals(42);
      service.rbsTestResultCurrent$.subscribe(value => {
        expect(value).toBe(42);
        done();
      });
    });

    it('clearRbsInVitals should reset to null', (done: DoneFn) => {
      service.setRbsInCurrentVitals(42);
      service.clearRbsInVitals();
      service.rbsTestResultCurrent$.subscribe(value => {
        expect(value).toBeNull();
        done();
      });
    });

    it('setRbsInCurrentVitals should also update rbsCurrentTestResult property', () => {
      service.setRbsInCurrentVitals('testResult');
      expect(service.rbsCurrentTestResult).toBe('testResult');
    });
  });

  describe('BehaviorSubject - enableLAssessment', () => {
    it('should emit initial value false', (done: DoneFn) => {
      service.enableLAssessment$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setEnableLAssessment should emit the given score', (done: DoneFn) => {
      service.setEnableLAssessment(true);
      service.enableLAssessment$.subscribe(value => {
        expect(value).toBeTrue();
        done();
      });
    });

    it('clearEnableLAssessment should reset to false', (done: DoneFn) => {
      service.setEnableLAssessment(true);
      service.clearEnableLAssessment();
      service.enableLAssessment$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setEnableLAssessment should also update temp property', () => {
      service.setEnableLAssessment(true);
      expect(service.temp).toBeTrue();
    });
  });

  describe('BehaviorSubject - enableProvisionalDiag', () => {
    it('should emit initial value false', (done: DoneFn) => {
      service.enableProvisionalDiag$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setNCDScreeningProvision should emit the given score', (done: DoneFn) => {
      service.setNCDScreeningProvision(true);
      service.enableProvisionalDiag$.subscribe(value => {
        expect(value).toBeTrue();
        done();
      });
    });

    it('clearNCDScreeningProvision should reset to false', (done: DoneFn) => {
      service.setNCDScreeningProvision(true);
      service.clearNCDScreeningProvision();
      service.enableProvisionalDiag$.subscribe(value => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('setNCDScreeningProvision should also update temp property', () => {
      service.setNCDScreeningProvision(true);
      expect(service.temp).toBeTrue();
    });
  });

  // -------------------------------------------------------------------
  // Subject - listen / filter
  // -------------------------------------------------------------------
  describe('listen / filter', () => {
    it('listen should return an observable that emits when filter is called', (done: DoneFn) => {
      service.listen().subscribe(value => {
        expect(value).toBe('myFilter');
        done();
      });
      service.filter('myFilter');
    });
  });

  // -------------------------------------------------------------------
  // Worklist methods (GET)
  // -------------------------------------------------------------------
  describe('worklist methods', () => {
    it('getNurseWorklist should call GET with correct URL', () => {
      service.getNurseWorklist().subscribe();
      const expectedUrl = environment.nurseWorklist + '1234/5/10';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: 'worklist' });
    });

    it('getNurseWorklistTMreferred should call GET with correct URL', () => {
      service.getNurseWorklistTMreferred().subscribe();
      const expectedUrl = environment.nurseWorklistTMreferred + '1234/5/10';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: 'tmWorklist' });
    });
  });

  // -------------------------------------------------------------------
  // Previous history GET/POST methods
  // -------------------------------------------------------------------
  describe('previous history methods', () => {
    it('getPreviousDiabetesHistory should POST benRegID', () => {
      service.getPreviousDiabetesHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousDiabetesHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousVisitData should POST the given obj', () => {
      const obj = { someKey: 'someValue' };
      service.getPreviousVisitData(obj).subscribe();
      const req = httpMock.expectOne(environment.previousVisitDataUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(obj);
      req.flush({});
    });

    it('getPreviousCancerFamilyHistory should POST benRegID', () => {
      service.getPreviousCancerFamilyHistory('12345').subscribe();
      const req = httpMock.expectOne(
        environment.previousCancerFamilyHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousCancerPersonalHabitHistory should POST benRegID', () => {
      service.getPreviousCancerPersonalHabitHistory('12345').subscribe();
      const req = httpMock.expectOne(
        environment.previousCancerPersonalHabitHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousCancerPersonalDietHistory should POST benRegID', () => {
      service.getPreviousCancerPersonalDietHistory('12345').subscribe();
      const req = httpMock.expectOne(
        environment.previousCancerPersonalDietHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousCancerPastObstetricHistory should POST benRegID', () => {
      service.getPreviousCancerPastObstetricHistory('12345').subscribe();
      const req = httpMock.expectOne(
        environment.previousCancerPastObstetricHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousPastHistory should POST benRegID', () => {
      service.getPreviousPastHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousPastHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousMedicationHistory should POST benRegID', () => {
      service.getPreviousMedicationHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousMedicationHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousOtherVaccines should POST benRegID', () => {
      service.getPreviousOtherVaccines('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(
        environment.previousOtherVaccineHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousTobaccoHistory should POST benRegID', () => {
      service.getPreviousTobaccoHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousTobaccoHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousAlcoholHistory should POST benRegID', () => {
      service.getPreviousAlcoholHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousAlcoholHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousAllergyHistory should POST benRegID', () => {
      service.getPreviousAllergyHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousAllergyHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousFamilyHistory should POST benRegID', () => {
      service.getPreviousFamilyHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousFamilyHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousMenstrualHistory should POST benRegID', () => {
      service.getPreviousMenstrualHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousMestrualHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousObstetricHistory should POST benRegID', () => {
      service.getPreviousObstetricHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(
        environment.previousPastObstetricHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousComorbidityHistory should POST benRegID', () => {
      service.getPreviousComorbidityHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousComorbidityHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousDevelopmentalHistory should POST benRegID', () => {
      service.getPreviousDevelopmentalHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousDevelopmentHistory);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousPerinatalHistory should POST benRegID', () => {
      service.getPreviousPerinatalHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousPerinatalHistory);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousFeedingHistory should POST benRegID', () => {
      service.getPreviousFeedingHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousFeedingHistory);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousImmunizationHistory should POST benRegID', () => {
      service.getPreviousImmunizationHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(
        environment.previousImmunizationHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousPhysicalActivityHistory should POST benRegID', () => {
      service.getPreviousPhysicalActivityHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(
        environment.previousPhyscialactivityHistoryUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });

    it('getPreviousReferredHistory should POST benRegID', () => {
      service.getPreviousReferredHistory('12345', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.previousReferredHistoryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benRegID: '12345' });
      req.flush({});
    });
  });

  // -------------------------------------------------------------------
  // Location methods (GET)
  // -------------------------------------------------------------------
  describe('location methods', () => {
    it('getCountryName should call GET', () => {
      service.getCountryName().subscribe();
      const req = httpMock.expectOne(environment.getCountryName);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getCityName should call GET with countryID appended', () => {
      service.getCityName(99).subscribe();
      const req = httpMock.expectOne(environment.getCityName + '99/');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getStateName should call GET with value appended', () => {
      service.getStateName(5).subscribe();
      const req = httpMock.expectOne(environment.getStateName + '5');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getDistrictName should call GET with stateID appended', () => {
      service.getDistrictName(3).subscribe();
      const req = httpMock.expectOne(environment.getDistrictName + '3');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getSubDistrictName should call GET with districtID appended', () => {
      service.getSubDistrictName(7).subscribe();
      const req = httpMock.expectOne(environment.getSubDistrictName + '7');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  // -------------------------------------------------------------------
  // NCD screening visit count & misc GET/POST
  // -------------------------------------------------------------------
  describe('NCD screening visit count and miscellaneous', () => {
    it('getNcdScreeningVisitCount should call GET with beneficiaryRegID', () => {
      service.getNcdScreeningVisitCount('9876').subscribe();
      const req = httpMock.expectOne(
        environment.getNcdScreeningVisitCountUrl + '9876'
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getTMReferredCasesheetData should POST the given object', () => {
      const reqObj = { benFlowID: '222' };
      service.getTMReferredCasesheetData(reqObj).subscribe();
      const req = httpMock.expectOne(environment.getTMCasesheetData);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reqObj);
      req.flush({});
    });

    it('calculateBmiStatus should POST the given object', () => {
      const obj = { height: 170, weight: 70 };
      service.calculateBmiStatus(obj).subscribe();
      const req = httpMock.expectOne(environment.calculateBmiStatus);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(obj);
      req.flush({});
    });
  });

  // -------------------------------------------------------------------
  // Helper: build a mock "generic" history form for reuse
  // -------------------------------------------------------------------
  function buildMockHistorySubForm(value: any) {
    return {
      value: value,
      getRawValue: () => value,
      controls: {},
    };
  }

  function buildMockHistoryControls() {
    return {
      controls: {
        pastHistory: buildMockHistorySubForm({
          pastIllness: [],
          pastSurgery: [],
        }),
        comorbidityHistory: buildMockHistorySubForm({
          comorbidityConcurrentConditionsList: [],
        }),
        medicationHistory: buildMockHistorySubForm({}),
        pastObstericHistory: buildMockHistorySubForm({
          pastObstericHistoryList: [],
        }),
        menstrualHistory: {
          value: {
            menstrualCycleStatus: null,
            cycleLength: null,
            bloodFlowDuration: null,
            lMPDate: null,
          },
          getRawValue() {
            return this.value;
          },
          controls: {},
        },
        familyHistory: buildMockHistorySubForm({ familyDiseaseList: [] }),
        personalHistory: {
          value: {
            tobaccoList: [],
            alcoholList: [],
            allergicList: [],
            riskySexualPracticesStatus: null,
          },
          getRawValue() {
            return this.value;
          },
          controls: {},
        },
        otherVaccines: buildMockHistorySubForm({ otherVaccines: [] }),
        immunizationHistory: buildMockHistorySubForm({ immunizationList: [] }),
        developmentHistory: buildMockHistorySubForm({}),
        feedingHistory: buildMockHistorySubForm({ foodIntoleranceStatus: '0' }),
        perinatalHistory: buildMockHistorySubForm({
          placeOfDelivery: null,
          typeOfDelivery: null,
          complicationAtBirth: null,
        }),
        physicalActivityHistory: buildMockHistorySubForm({}),
      },
    };
  }

  function buildMockVisitForm() {
    return {
      controls: {
        patientVisitDetailsForm: {
          value: { visitReason: 'New Chief Complaint' },
        },
        patientFileUploadDetailsForm: { value: { fileIDs: [] } },
        patientChiefComplaintsForm: { value: { complaints: [] } },
        patientAdherenceForm: { value: {} },
        patientInvestigationsForm: { value: {} },
        patientCovidForm: { value: {} },
      },
    };
  }

  function buildMockExaminationFormValue() {
    return {
      generalExaminationForm: {},
      headToToeExaminationForm: {},
      systemicExaminationForm: {
        gastroIntestinalSystemForm: {},
        cardioVascularSystemForm: {},
        respiratorySystemForm: {},
        centralNervousSystemForm: {},
        musculoSkeletalSystemForm: {},
        genitoUrinarySystemForm: {},
        obstetricExaminationForANCForm: {},
      },
    };
  }

  function buildMockVitalsForm() {
    return { value: { height: 170, weight: 70 } };
  }

  // -------------------------------------------------------------------
  // postPatientVisitDetails
  // -------------------------------------------------------------------
  describe('postPatientVisitDetails', () => {
    it('should return merged object with session data', () => {
      const result = service.postPatientVisitDetails(
        { visitReason: 'Follow Up' },
        { fileIDs: [1, 2] }
      );
      expect(result.visitReason).toBe('Follow Up');
      expect(result.fileIDs).toEqual([1, 2]);
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.providerServiceMapID).toBe('1234');
      expect(result.createdBy).toBe('testUser');
    });
  });

  // -------------------------------------------------------------------
  // postCheifComplaintForm
  // -------------------------------------------------------------------
  describe('postCheifComplaintForm', () => {
    it('should process complaints and attach session data', () => {
      const complaints = [
        {
          chiefComplaint: {
            chiefComplaintID: 100,
            chiefComplaint: 'Headache',
          },
        },
      ];
      const result = service.postCheifComplaintForm(complaints, 'visit1');
      expect(result[0].chiefComplaintID).toBe(100);
      expect(result[0].chiefComplaint).toBe('Headache');
      expect(result[0].beneficiaryRegID).toBe('9876');
      expect(result[0].benVisitID).toBe('visit1');
      expect(result[0].providerServiceMapID).toBe('1234');
      expect(result[0].createdBy).toBe('testUser');
    });

    it('should handle null chiefComplaint gracefully', () => {
      const complaints = [{ chiefComplaint: null }];
      const result = service.postCheifComplaintForm(complaints, 'visit1');
      expect(result[0].beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postAdherenceForm
  // -------------------------------------------------------------------
  describe('postAdherenceForm', () => {
    it('should merge adherence data with session data', () => {
      const result = service.postAdherenceForm({ toDrugs: true }, 'visit1');
      expect(result.toDrugs).toBeTrue();
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.benVisitID).toBe('visit1');
    });
  });

  // -------------------------------------------------------------------
  // postInvestigationForm
  // -------------------------------------------------------------------
  describe('postInvestigationForm', () => {
    it('should merge investigation data with session data', () => {
      const result = service.postInvestigationForm(
        { labTest: 'CBC' },
        'visit1'
      );
      expect(result.labTest).toBe('CBC');
      expect(result.beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postCovidForm
  // -------------------------------------------------------------------
  describe('postCovidForm', () => {
    it('should merge covid form data with session data', () => {
      const result = service.postCovidForm({ symptom: 'Cough' }, 'visit1');
      expect(result.symptom).toBe('Cough');
      expect(result.beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postGenericVitalForm
  // -------------------------------------------------------------------
  describe('postGenericVitalForm', () => {
    it('should merge vitals with session data', () => {
      const result = service.postGenericVitalForm(
        { value: { height: 170, weight: 70 } },
        'visit1'
      );
      expect(result.height).toBe(170);
      expect(result.weight).toBe(70);
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.benVisitID).toBe('visit1');
    });
  });

  // -------------------------------------------------------------------
  // Examination sub-form posting methods
  // -------------------------------------------------------------------
  describe('examination sub-form posting', () => {
    const formData = { finding: 'Normal' };
    const benVisitID = 'visit1';

    it('postGeneralExaminationForm should merge with session data', () => {
      const result = service.postGeneralExaminationForm(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.benVisitID).toBe(benVisitID);
      expect(result.providerServiceMapID).toBe('1234');
      expect(result.createdBy).toBe('testUser');
    });

    it('postHeadToToeExaminationForm should merge with session data', () => {
      const result = service.postHeadToToeExaminationForm(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postGastroIntestinalSystemForm should merge with session data', () => {
      const result = service.postGastroIntestinalSystemForm(
        formData,
        benVisitID
      );
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postCardioVascularSystemForm should merge with session data', () => {
      const result = service.postCardioVascularSystemForm(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postRespiratorySystemForm should merge with session data', () => {
      const result = service.postRespiratorySystemForm(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postCentralNervousSystemForm should merge with session data', () => {
      const result = service.postCentralNervousSystemForm(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postMusculoSkeletalSystemForm should merge with session data', () => {
      const result = service.postMusculoSkeletalSystemForm(
        formData,
        benVisitID
      );
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postGenitoUrinarySystemForm should merge with session data', () => {
      const result = service.postGenitoUrinarySystemForm(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('postANCObstetricExamination should merge with session data', () => {
      const result = service.postANCObstetricExamination(formData, benVisitID);
      expect(result.finding).toBe('Normal');
      expect(result.beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postGenericVisitDetailForm - visit category branching
  // -------------------------------------------------------------------
  describe('postGenericVisitDetailForm', () => {
    let mockVisitForm: any;

    beforeEach(() => {
      mockVisitForm = buildMockVisitForm();
    });

    it('should return ANC visit details with adherence and investigation for ANC', () => {
      const result: any = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'ANC'
      );
      expect(result.visitDetails).toBeDefined();
      expect(result.chiefComplaints).toBeDefined();
      expect(result.adherence).toBeDefined();
      expect(result.investigation).toBeDefined();
    });

    it('should return General OPD visit details with chiefComplaints only', () => {
      const result: any = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'General OPD'
      );
      expect(result.visitDetails).toBeDefined();
      expect(result.chiefComplaints).toBeDefined();
      expect(result.adherence).toBeUndefined();
      expect(result.investigation).toBeUndefined();
    });

    it('should return PNC visit details with chiefComplaints', () => {
      const result: any = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'PNC'
      );
      expect(result.visitDetails).toBeDefined();
      expect(result.chiefComplaints).toBeDefined();
    });

    it('should return NCD care visit details with adherence and investigation', () => {
      const result: any = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'NCD care'
      );
      expect(result.visitDetails).toBeDefined();
      expect(result.adherence).toBeDefined();
      expect(result.investigation).toBeDefined();
      expect(result.chiefComplaints).toBeUndefined();
    });

    it('should return COVID-19 Screening visit details with covidDetails', () => {
      const result: any = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'COVID-19 Screening'
      );
      expect(result.visitDetails).toBeDefined();
      expect(result.covidDetails).toBeDefined();
      expect(result.chiefComplaints).toBeUndefined();
    });

    it('should return NCD screening visit details with chiefComplaints', () => {
      const result: any = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'NCD screening'
      );
      expect(result.visitDetails).toBeDefined();
      expect(result.chiefComplaints).toBeDefined();
    });

    it('should return an Observable that completes for unknown visit category', (done: DoneFn) => {
      const result = service.postGenericVisitDetailForm(
        mockVisitForm,
        'visit1',
        'Unknown Category'
      );
      result.subscribe({
        complete: () => {
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------
  // postGenericExaminationForm - visit category branching
  // -------------------------------------------------------------------
  describe('postGenericExaminationForm', () => {
    let mockExamFormValue: any;

    beforeEach(() => {
      mockExamFormValue = buildMockExaminationFormValue();
    });

    it('should include obstetricExamination for ANC', () => {
      const result: any = service.postGenericExaminationForm(
        mockExamFormValue,
        'visit1',
        'ANC'
      );
      expect(result.generalExamination).toBeDefined();
      expect(result.headToToeExamination).toBeDefined();
      expect(result.cardioVascularExamination).toBeDefined();
      expect(result.respiratorySystemExamination).toBeDefined();
      expect(result.centralNervousSystemExamination).toBeDefined();
      expect(result.musculoskeletalSystemExamination).toBeDefined();
      expect(result.genitoUrinarySystemExamination).toBeDefined();
      expect(result.obstetricExamination).toBeDefined();
      // ANC does NOT include gastroIntestinalExamination
      expect(result.gastroIntestinalExamination).toBeUndefined();
    });

    it('should include gastroIntestinalExamination for General OPD but not obstetric', () => {
      const result: any = service.postGenericExaminationForm(
        mockExamFormValue,
        'visit1',
        'General OPD'
      );
      expect(result.generalExamination).toBeDefined();
      expect(result.headToToeExamination).toBeDefined();
      expect(result.gastroIntestinalExamination).toBeDefined();
      expect(result.cardioVascularExamination).toBeDefined();
      expect(result.respiratorySystemExamination).toBeDefined();
      expect(result.centralNervousSystemExamination).toBeDefined();
      expect(result.musculoskeletalSystemExamination).toBeDefined();
      expect(result.genitoUrinarySystemExamination).toBeDefined();
      expect(result.obstetricExamination).toBeUndefined();
    });

    it('should include gastroIntestinalExamination for PNC but not obstetric', () => {
      const result: any = service.postGenericExaminationForm(
        mockExamFormValue,
        'visit1',
        'PNC'
      );
      expect(result.generalExamination).toBeDefined();
      expect(result.gastroIntestinalExamination).toBeDefined();
      expect(result.obstetricExamination).toBeUndefined();
    });

    it('should return an Observable that completes for unknown visit category', (done: DoneFn) => {
      const result = service.postGenericExaminationForm(
        mockExamFormValue,
        'visit1',
        'Unknown Category'
      );
      result.subscribe({
        complete: () => {
          done();
        },
      });
    });
  });

  // -------------------------------------------------------------------
  // postANCHistoryForm - benAge branching
  // -------------------------------------------------------------------
  describe('postANCHistoryForm', () => {
    let mockHistoryForm: any;

    beforeEach(() => {
      mockHistoryForm = buildMockHistoryControls();
    });

    it('should include childVaccineDetails and immunizationHistory when benAge <= 16', () => {
      const result: any = service.postANCHistoryForm(
        mockHistoryForm,
        'visit1',
        10
      );
      expect(result.pastHistory).toBeDefined();
      expect(result.comorbidConditions).toBeDefined();
      expect(result.medicationHistory).toBeDefined();
      expect(result.femaleObstetricHistory).toBeDefined();
      expect(result.menstrualHistory).toBeDefined();
      expect(result.familyHistory).toBeDefined();
      expect(result.personalHistory).toBeDefined();
      expect(result.childVaccineDetails).toBeDefined();
      expect(result.immunizationHistory).toBeDefined();
    });

    it('should include childVaccineDetails and immunizationHistory when benAge is exactly 16', () => {
      const result: any = service.postANCHistoryForm(
        mockHistoryForm,
        'visit1',
        16
      );
      expect(result.childVaccineDetails).toBeDefined();
      expect(result.immunizationHistory).toBeDefined();
    });

    it('should NOT include childVaccineDetails or immunizationHistory when benAge > 16', () => {
      const result: any = service.postANCHistoryForm(
        mockHistoryForm,
        'visit1',
        25
      );
      expect(result.pastHistory).toBeDefined();
      expect(result.comorbidConditions).toBeDefined();
      expect(result.medicationHistory).toBeDefined();
      expect(result.femaleObstetricHistory).toBeDefined();
      expect(result.menstrualHistory).toBeDefined();
      expect(result.familyHistory).toBeDefined();
      expect(result.personalHistory).toBeDefined();
      expect(result.childVaccineDetails).toBeUndefined();
      expect(result.immunizationHistory).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------
  // postGeneralHistoryForm
  // -------------------------------------------------------------------
  describe('postGeneralHistoryForm', () => {
    it('should return all history sections including development, feeding, perinatal', () => {
      const mockHistoryForm = buildMockHistoryControls();
      const result: any = service.postGeneralHistoryForm(mockHistoryForm, {
        ageVal: 10,
      });
      expect(result.pastHistory).toBeDefined();
      expect(result.comorbidConditions).toBeDefined();
      expect(result.medicationHistory).toBeDefined();
      expect(result.femaleObstetricHistory).toBeDefined();
      expect(result.menstrualHistory).toBeDefined();
      expect(result.familyHistory).toBeDefined();
      expect(result.personalHistory).toBeDefined();
      expect(result.childVaccineDetails).toBeDefined();
      expect(result.immunizationHistory).toBeDefined();
      expect(result.developmentHistory).toBeDefined();
      expect(result.feedingHistory).toBeDefined();
      expect(result.perinatalHistroy).toBeDefined();
    });
  });

  // -------------------------------------------------------------------
  // postNCDScreeningHistoryForm
  // -------------------------------------------------------------------
  describe('postNCDScreeningHistoryForm', () => {
    it('should return familyHistory, physicalActivityHistory, and personalHistory', () => {
      const mockForm = buildMockHistoryControls();
      const result: any = service.postNCDScreeningHistoryForm(
        mockForm,
        null,
        'NCD screening'
      );
      expect(result.familyHistory).toBeDefined();
      expect(result.physicalActivityHistory).toBeDefined();
      expect(result.personalHistory).toBeDefined();
    });
  });

  // -------------------------------------------------------------------
  // postPhyscialActivityHistory
  // -------------------------------------------------------------------
  describe('postPhyscialActivityHistory', () => {
    it('should merge physical activity data with otherDetails', () => {
      const result = service.postPhyscialActivityHistory(
        { value: { activityType: 'Walking' } },
        { beneficiaryRegID: '9876' }
      );
      expect(result.activityType).toBe('Walking');
      expect(result.beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postGeneralPastHistory
  // -------------------------------------------------------------------
  describe('postGeneralPastHistory', () => {
    it('should process illness and surgery types', () => {
      const pastHistoryForm = {
        value: {
          pastIllness: [
            {
              illnessType: { illnessType: 'Diabetes', illnessID: 1 },
            },
          ],
          pastSurgery: [
            {
              surgeryType: { surgeryType: 'Appendectomy', surgeryID: 2 },
            },
          ],
        },
      };
      const otherDetails = { beneficiaryRegID: '9876' };
      const result = service.postGeneralPastHistory(
        pastHistoryForm,
        otherDetails
      );
      expect(result.pastIllness[0].illnessType).toBe('Diabetes');
      expect(result.pastIllness[0].illnessTypeID).toBe('1');
      expect(result.pastSurgery[0].surgeryType).toBe('Appendectomy');
      expect(result.pastSurgery[0].surgeryID).toBe('2');
      expect(result.beneficiaryRegID).toBe('9876');
    });

    it('should handle null illnessType', () => {
      const pastHistoryForm = {
        value: {
          pastIllness: [{ illnessType: null }],
          pastSurgery: [],
        },
      };
      const result = service.postGeneralPastHistory(pastHistoryForm, {});
      expect(result.pastIllness[0].illnessType).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // postGeneralComorbidityHistory
  // -------------------------------------------------------------------
  describe('postGeneralComorbidityHistory', () => {
    it('should process comorbid conditions', () => {
      const form = {
        value: {
          comorbidityConcurrentConditionsList: [
            {
              comorbidConditions: {
                comorbidCondition: 'Hypertension',
                comorbidConditionID: 10,
                isForHistory: false,
              },
            },
          ],
        },
      };
      const result = service.postGeneralComorbidityHistory(form, {
        beneficiaryRegID: '9876',
      });
      expect(
        result.comorbidityConcurrentConditionsList[0].comorbidCondition
      ).toBe('Hypertension');
      expect(
        result.comorbidityConcurrentConditionsList[0].comorbidConditionID
      ).toBe('10');
      expect(
        result.comorbidityConcurrentConditionsList[0].isForHistory
      ).toBeTrue();
    });
  });

  // -------------------------------------------------------------------
  // postGeneralFamilyHistory
  // -------------------------------------------------------------------
  describe('postGeneralFamilyHistory', () => {
    it('should process disease types', () => {
      const form = {
        value: {
          familyDiseaseList: [
            {
              diseaseType: {
                diseaseType: 'Cancer',
                diseaseTypeID: 5,
              },
            },
          ],
        },
      };
      const result = service.postGeneralFamilyHistory(form, {});
      expect(result.familyDiseaseList[0].diseaseType).toBe('Cancer');
      expect(result.familyDiseaseList[0].diseaseTypeID).toBe('5');
    });
  });

  // -------------------------------------------------------------------
  // postGeneralFeedingHistory
  // -------------------------------------------------------------------
  describe('postGeneralFeedingHistory', () => {
    it('should convert foodIntoleranceStatus to number', () => {
      const form = {
        value: { foodIntoleranceStatus: '1', typeOfFood: 'Milk' },
      };
      const result = service.postGeneralFeedingHistory(form, {});
      expect(result.foodIntoleranceStatus).toBe(1);
      expect(result.typeOfFood).toBe('Milk');
    });
  });

  // -------------------------------------------------------------------
  // postGeneralMenstrualHistory
  // -------------------------------------------------------------------
  describe('postGeneralMenstrualHistory', () => {
    it('should process menstrual cycle status, cycleLength and bloodFlowDuration', () => {
      const form = {
        value: {
          menstrualCycleStatus: {
            menstrualCycleStatusID: 1,
            name: 'Regular',
          },
          cycleLength: {
            menstrualRangeID: 2,
            menstrualCycleRange: '24-28 days',
          },
          bloodFlowDuration: {
            menstrualRangeID: 3,
            menstrualCycleRange: '3-5 days',
          },
          lMPDate: null,
        },
        getRawValue() {
          return this.value;
        },
      };
      const result = service.postGeneralMenstrualHistory(form, {});
      expect(result.menstrualCycleStatusID).toBe('1');
      expect(result.menstrualCycleStatus).toBe('Regular');
      expect(result.menstrualCyclelengthID).toBe('2');
      expect(result.cycleLength).toBe('24-28 days');
      expect(result.menstrualFlowDurationID).toBe('3');
      expect(result.bloodFlowDuration).toBe('3-5 days');
    });

    it('should set lMPDate to undefined if falsy', () => {
      const form = {
        value: {
          menstrualCycleStatus: null,
          cycleLength: null,
          bloodFlowDuration: null,
          lMPDate: null,
        },
        getRawValue() {
          return this.value;
        },
      };
      const result = service.postGeneralMenstrualHistory(form, {});
      expect(result.lMPDate).toBeUndefined();
    });

    it('should normalize lMPDate when provided', () => {
      const form = {
        value: {
          menstrualCycleStatus: null,
          cycleLength: null,
          bloodFlowDuration: null,
          lMPDate: '2025-06-15',
        },
        getRawValue() {
          return this.value;
        },
      };
      const result = service.postGeneralMenstrualHistory(form, {});
      expect(result.lMPDate).toBeDefined();
      expect(result.lMPDate).toContain('2025-06-15');
    });
  });

  // -------------------------------------------------------------------
  // postGeneralOtherVaccines
  // -------------------------------------------------------------------
  describe('postGeneralOtherVaccines', () => {
    it('should process vaccine names and output childOptionalVaccineList', () => {
      const form = {
        value: {
          otherVaccines: [
            { vaccineName: { vaccineID: 10, vaccineName: 'MMR' } },
          ],
        },
      };
      const result = service.postGeneralOtherVaccines(form, {});
      expect(result.childOptionalVaccineList[0].vaccineID).toBe(10);
      expect(result.childOptionalVaccineList[0].vaccineName).toBe('MMR');
      expect(result.otherVaccines).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------
  // postGeneralPersonalHistory
  // -------------------------------------------------------------------
  describe('postGeneralPersonalHistory', () => {
    it('should process tobacco, alcohol and allergy lists', () => {
      const form = {
        value: {
          tobaccoList: [
            {
              tobaccoUseType: {
                personalHabitTypeID: 1,
                habitValue: 'Cigarettes',
              },
            },
          ],
          alcoholList: [
            {
              typeOfAlcohol: {
                personalHabitTypeID: 2,
                habitValue: 'Beer',
              },
              avgAlcoholConsumption: { habitValue: 'Moderate' },
            },
          ],
          allergicList: [
            {
              allergyType: { allergyType: 'Drug' },
              typeOfAllergicReactions: [{ allergicReactionTypeID: 99 }],
            },
          ],
          riskySexualPracticesStatus: null,
        },
        getRawValue() {
          return this.value;
        },
      };
      const result = service.postGeneralPersonalHistory(form, {});
      expect(result.tobaccoList[0].tobaccoUseTypeID).toBe(1);
      expect(result.tobaccoList[0].tobaccoUseType).toBe('Cigarettes');
      expect(result.alcoholList[0].alcoholTypeID).toBe(2);
      expect(result.alcoholList[0].typeOfAlcohol).toBe('Beer');
      expect(result.alcoholList[0].avgAlcoholConsumption).toBe('Moderate');
      expect(result.allergicList[0].allergyType).toBe('Drug');
      expect(
        result.allergicList[0].typeOfAllergicReactions[0].allergicReactionTypeID
      ).toBe('99');
    });

    it('should convert riskySexualPracticesStatus to number if truthy', () => {
      const form = {
        value: {
          tobaccoList: [],
          alcoholList: [],
          allergicList: [],
          riskySexualPracticesStatus: '1',
        },
        getRawValue() {
          return this.value;
        },
      };
      const result = service.postGeneralPersonalHistory(form, {});
      expect(result.riskySexualPracticesStatus).toBe(1);
    });

    it('should set riskySexualPracticesStatus to null if falsy', () => {
      const form = {
        value: {
          tobaccoList: [],
          alcoholList: [],
          allergicList: [],
          riskySexualPracticesStatus: null,
        },
        getRawValue() {
          return this.value;
        },
      };
      const result = service.postGeneralPersonalHistory(form, {});
      expect(result.riskySexualPracticesStatus).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // postGeneralPerinatalHistory
  // -------------------------------------------------------------------
  describe('postGeneralPerinatalHistory', () => {
    it('should process placeOfDelivery, typeOfDelivery, complicationAtBirth', () => {
      const form = {
        value: {
          placeOfDelivery: {
            deliveryPlaceID: 1,
            deliveryPlace: 'Hospital',
          },
          typeOfDelivery: {
            deliveryTypeID: 2,
            deliveryType: 'Normal',
          },
          complicationAtBirth: {
            birthComplicationID: 3,
            name: 'None',
          },
        },
      };
      const result = service.postGeneralPerinatalHistory(form, {});
      expect(result.deliveryPlaceID).toBe(1);
      expect(result.placeOfDelivery).toBe('Hospital');
      expect(result.deliveryTypeID).toBe(2);
      expect(result.typeOfDelivery).toBe('Normal');
      expect(result.complicationAtBirthID).toBe(3);
      expect(result.complicationAtBirth).toBe('None');
    });

    it('should leave null sub-objects alone', () => {
      const form = {
        value: {
          placeOfDelivery: null,
          typeOfDelivery: null,
          complicationAtBirth: null,
        },
      };
      const result = service.postGeneralPerinatalHistory(form, {});
      expect(result.placeOfDelivery).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // postGeneralPastObstetricHistory
  // -------------------------------------------------------------------
  describe('postGeneralPastObstetricHistory', () => {
    it('should process obstetric history list items', () => {
      const form = {
        value: {
          pastObstericHistoryList: [
            {
              durationType: { pregDurationID: 1, durationType: 'Term' },
              deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
              deliveryPlace: {
                deliveryPlaceID: 3,
                deliveryPlace: 'Hospital',
              },
              pregOutcome: { pregOutcomeID: 4, pregOutcome: 'Live Birth' },
              newBornComplication: {
                complicationID: 5,
                complicationValue: 'None',
              },
            },
          ],
        },
      };
      const result = service.postGeneralPastObstetricHistory(form, {});
      const item = result.femaleObstetricHistoryList[0];
      expect(item.pregDurationID).toBe(1);
      expect(item.durationType).toBe('Term');
      expect(item.deliveryTypeID).toBe(2);
      expect(item.deliveryType).toBe('Normal');
      expect(item.deliveryPlaceID).toBe(3);
      expect(item.deliveryPlace).toBe('Hospital');
      expect(item.pregOutcomeID).toBe(4);
      expect(item.pregOutcome).toBe('Live Birth');
      expect(item.newBornComplicationID).toBe(5);
      expect(item.newBornComplication).toBe('None');
      // pastObstericHistoryList should be set to undefined
      expect(result.pastObstericHistoryList).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------
  // postANCForm
  // -------------------------------------------------------------------
  describe('postANCForm', () => {
    it('should return object with ancObstetricDetails and ancImmunization', () => {
      const mockPatientANCForm = {
        controls: {
          patientANCDetailsForm: { value: { gravida: 2 } },
          obstetricFormulaForm: {
            value: {
              gravida_G: 2,
              termDeliveries_T: 1,
              pretermDeliveries_P: 0,
              abortions_A: 0,
              stillBirth: 0,
              livebirths_L: 1,
              bloodGroup: 'O+',
            },
          },
          patientANCImmunizationForm: {
            value: {
              dateReceivedForTT_1: null,
              dateReceivedForTT_2: null,
              dateReceivedForTT_3: null,
            },
          },
        },
      };
      const result = service.postANCForm(mockPatientANCForm, 'visit1');
      expect(result.ancObstetricDetails).toBeDefined();
      expect(result.ancImmunization).toBeDefined();
      expect(result.ancObstetricDetails.gravida_G).toBe(2);
      expect(result.ancImmunization.beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postANCDetailForm
  // -------------------------------------------------------------------
  describe('postANCDetailForm', () => {
    it('should merge ANC details with obstetric formula and session data', () => {
      const mockForm = {
        controls: {
          patientANCDetailsForm: {
            value: { lmpDate: null, expDelDt: null, primiGravida: true },
          },
          obstetricFormulaForm: {
            value: {
              gravida_G: 3,
              termDeliveries_T: 2,
              pretermDeliveries_P: 0,
              abortions_A: 0,
              stillBirth: 0,
              livebirths_L: 2,
              bloodGroup: 'A+',
            },
          },
        },
      };
      const result = service.postANCDetailForm(mockForm, 'visit1');
      expect(result.gravida_G).toBe(3);
      expect(result.bloodGroup).toBe('A+');
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.benVisitID).toBe('visit1');
    });

    it('should normalize lmpDate and expDelDt when provided', () => {
      const mockForm = {
        controls: {
          patientANCDetailsForm: {
            value: {
              lmpDate: '2025-01-15',
              expDelDt: '2025-10-22',
            },
          },
          obstetricFormulaForm: {
            value: {
              gravida_G: 1,
              termDeliveries_T: 0,
              pretermDeliveries_P: 0,
              abortions_A: 0,
              stillBirth: 0,
              livebirths_L: 0,
              bloodGroup: 'B+',
            },
          },
        },
      };
      const result = service.postANCDetailForm(mockForm, 'visit1');
      expect(result.lmpDate).toBeDefined();
      expect(result.lmpDate).toContain('2025-01-15');
      expect(result.expDelDt).toBeDefined();
      expect(result.expDelDt).toContain('2025-10-22');
    });
  });

  // -------------------------------------------------------------------
  // postANCImmunizationForm
  // -------------------------------------------------------------------
  describe('postANCImmunizationForm', () => {
    it('should normalize TT dates and merge with session data', () => {
      const immunizationForm = {
        dateReceivedForTT_1: '2025-03-01',
        dateReceivedForTT_2: '2025-04-01',
        dateReceivedForTT_3: null,
      };
      const result = service.postANCImmunizationForm(
        immunizationForm,
        'visit1'
      );
      expect(result.dateReceivedForTT_1).toContain('2025-03-01');
      expect(result.dateReceivedForTT_2).toContain('2025-04-01');
      expect(result.dateReceivedForTT_3).toBeNull();
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.benVisitID).toBe('visit1');
    });
  });

  // -------------------------------------------------------------------
  // postPNCDetailForm
  // -------------------------------------------------------------------
  describe('postPNCDetailForm', () => {
    it('should process delivery details and merge with session data', () => {
      const mockPNCForm = {
        value: {
          deliveryPlace: {
            deliveryPlaceID: 1,
            deliveryPlace: 'Hospital',
          },
          deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
          deliveryComplication: {
            complicationID: 3,
            deliveryComplicationType: 'None',
          },
          pregOutcome: { pregOutcomeID: 4, pregOutcome: 'Live Birth' },
          postNatalComplication: {
            complicationID: 5,
            complicationValue: 'None',
          },
          gestationName: { gestationID: 6, name: 'Full Term' },
          newBornHealthStatus: {
            newBornHealthStatusID: 7,
            newBornHealthStatus: 'Healthy',
          },
          dDate: '2025-06-15',
        },
      };
      const result = service.postPNCDetailForm(mockPNCForm, 'visit1');
      expect(result.deliveryPlaceID).toBe(1);
      expect(result.deliveryPlace).toBe('Hospital');
      expect(result.deliveryTypeID).toBe(2);
      expect(result.deliveryType).toBe('Normal');
      expect(result.deliveryComplicationID).toBe(3);
      expect(result.deliveryComplication).toBe('None');
      expect(result.pregOutcomeID).toBe(4);
      expect(result.pregOutcome).toBe('Live Birth');
      expect(result.postNatalComplicationID).toBe(5);
      expect(result.postNatalComplication).toBe('None');
      expect(result.gestationID).toBe(6);
      expect(result.gestationName).toBe('Full Term');
      expect(result.newBornHealthStatusID).toBe(7);
      expect(result.newBornHealthStatus).toBe('Healthy');
      expect(result.dateOfDelivery).toBeDefined();
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.benVisitID).toBe('visit1');
    });

    it('should handle null sub-objects', () => {
      const mockPNCForm = {
        value: {
          deliveryPlace: null,
          deliveryType: null,
          deliveryComplication: null,
          pregOutcome: null,
          postNatalComplication: null,
          gestationName: null,
          newBornHealthStatus: null,
          dDate: null,
        },
      };
      const result = service.postPNCDetailForm(mockPNCForm, null);
      expect(result.deliveryPlace).toBeNull();
      expect(result.beneficiaryRegID).toBe('9876');
    });
  });

  // -------------------------------------------------------------------
  // postCancerHistoryDetails
  // -------------------------------------------------------------------
  describe('postCancerHistoryDetails', () => {
    it('should return empty object when no sub-forms are dirty', () => {
      const historyForm = {
        controls: {
          cancerPatientFamilyMedicalHistoryForm: { dirty: false },
          cancerPatientPerosnalHistoryForm: { dirty: false },
          cancerPatientObstetricHistoryForm: { dirty: false },
        },
        value: {
          cancerPatientFamilyMedicalHistoryForm: { diseases: [] },
          cancerPatientPerosnalHistoryForm: {},
          cancerPatientObstetricHistoryForm: {},
        },
      };
      const result = service.postCancerHistoryDetails(historyForm, {});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should include familyHistory when family form is dirty', () => {
      const historyForm = {
        controls: {
          cancerPatientFamilyMedicalHistoryForm: { dirty: true },
          cancerPatientPerosnalHistoryForm: { dirty: false },
          cancerPatientObstetricHistoryForm: { dirty: false },
        },
        value: {
          cancerPatientFamilyMedicalHistoryForm: {
            diseases: [
              {
                cancerDiseaseType: {
                  cancerDiseaseType: 'Breast Cancer',
                },
                otherDiseaseType: null,
              },
            ],
          },
          cancerPatientPerosnalHistoryForm: {},
          cancerPatientObstetricHistoryForm: {},
        },
      };
      const result: any = service.postCancerHistoryDetails(historyForm, {
        beneficiaryRegID: '9876',
      });
      expect(result.familyHistory).toBeDefined();
      expect(result.familyHistory.diseases[0].cancerDiseaseType).toBe(
        'Breast Cancer'
      );
    });

    it('should replace "Any other Cancer" with otherDiseaseType', () => {
      const historyForm = {
        controls: {
          cancerPatientFamilyMedicalHistoryForm: { dirty: true },
          cancerPatientPerosnalHistoryForm: { dirty: false },
          cancerPatientObstetricHistoryForm: { dirty: false },
        },
        value: {
          cancerPatientFamilyMedicalHistoryForm: {
            diseases: [
              {
                cancerDiseaseType: {
                  cancerDiseaseType: 'Any other Cancer',
                },
                otherDiseaseType: 'Rare Cancer XYZ',
              },
            ],
          },
        },
      };
      const result: any = service.postCancerHistoryDetails(historyForm, {});
      expect(result.familyHistory.diseases[0].cancerDiseaseType).toBe(
        'Rare Cancer XYZ'
      );
    });

    it('should include personalHistory when personal form is dirty', () => {
      const historyForm = {
        controls: {
          cancerPatientFamilyMedicalHistoryForm: { dirty: false },
          cancerPatientPerosnalHistoryForm: { dirty: true },
          cancerPatientObstetricHistoryForm: { dirty: false },
        },
        value: {
          cancerPatientFamilyMedicalHistoryForm: { diseases: [] },
          cancerPatientPerosnalHistoryForm: { dietType: 'Vegetarian' },
          cancerPatientObstetricHistoryForm: {},
        },
      };
      const result: any = service.postCancerHistoryDetails(historyForm, {});
      expect(result.personalHistory).toBeDefined();
      expect(result.personalHistory.dietType).toBe('Vegetarian');
    });

    it('should include pastObstetricHistory when obstetric form is dirty', () => {
      const historyForm = {
        controls: {
          cancerPatientFamilyMedicalHistoryForm: { dirty: false },
          cancerPatientPerosnalHistoryForm: { dirty: false },
          cancerPatientObstetricHistoryForm: { dirty: true },
        },
        value: {
          cancerPatientFamilyMedicalHistoryForm: { diseases: [] },
          cancerPatientPerosnalHistoryForm: {},
          cancerPatientObstetricHistoryForm: { noOfPregnancies: 2 },
        },
      };
      const result: any = service.postCancerHistoryDetails(historyForm, {});
      expect(result.pastObstetricHistory).toBeDefined();
      expect(result.pastObstetricHistory.noOfPregnancies).toBe(2);
    });
  });

  // -------------------------------------------------------------------
  // postCancerExaminationDetails
  // -------------------------------------------------------------------
  describe('postCancerExaminationDetails', () => {
    it('should return imageCoordinates always', () => {
      const examForm = {
        controls: {
          signsForm: { dirty: false, controls: {}, value: {} },
          oralExaminationForm: { dirty: false, value: {} },
          breastExaminationForm: { dirty: false, value: {} },
          abdominalExaminationForm: { dirty: false, value: {} },
          gynecologicalExaminationForm: { dirty: false, value: {} },
        },
      };
      const result: any = service.postCancerExaminationDetails(examForm, {}, [
        { x: 1, y: 2 },
      ]);
      expect(result.imageCoordinates).toEqual([{ x: 1, y: 2 }]);
    });

    it('should include oralDetails when oral form is dirty', () => {
      const examForm = {
        controls: {
          signsForm: { dirty: false, controls: {}, value: {} },
          oralExaminationForm: {
            dirty: true,
            value: {
              preMalignantLesionTypeList: null,
              otherLesionType: null,
              image: null,
              mouthOpening: 'Normal',
            },
          },
          breastExaminationForm: { dirty: false, value: {} },
          abdominalExaminationForm: { dirty: false, value: {} },
          gynecologicalExaminationForm: { dirty: false, value: {} },
        },
      };
      const result: any = service.postCancerExaminationDetails(
        examForm,
        {},
        []
      );
      expect(result.oralDetails).toBeDefined();
      expect(result.oralDetails.mouthOpening).toBe('Normal');
      expect(result.oralDetails.otherLesionType).toBeUndefined();
      expect(result.oralDetails.image).toBeUndefined();
    });

    it('should include breastDetails when breast form is dirty', () => {
      const examForm = {
        controls: {
          signsForm: { dirty: false, controls: {}, value: {} },
          oralExaminationForm: { dirty: false, value: {} },
          breastExaminationForm: {
            dirty: true,
            value: { lumpSize: 'Small', image: 'img1' },
          },
          abdominalExaminationForm: { dirty: false, value: {} },
          gynecologicalExaminationForm: { dirty: false, value: {} },
        },
      };
      const result: any = service.postCancerExaminationDetails(
        examForm,
        {},
        []
      );
      expect(result.breastDetails).toBeDefined();
      expect(result.breastDetails.lumpSize).toBe('Small');
      expect(result.breastDetails.image).toBeUndefined();
    });

    it('should include abdominalDetails when abdominal form is dirty', () => {
      const examForm = {
        controls: {
          signsForm: { dirty: false, controls: {}, value: {} },
          oralExaminationForm: { dirty: false, value: {} },
          breastExaminationForm: { dirty: false, value: {} },
          abdominalExaminationForm: {
            dirty: true,
            value: { liver: 'Enlarged', image: 'img2' },
          },
          gynecologicalExaminationForm: { dirty: false, value: {} },
        },
      };
      const result: any = service.postCancerExaminationDetails(
        examForm,
        {},
        []
      );
      expect(result.abdominalDetails).toBeDefined();
      expect(result.abdominalDetails.liver).toBe('Enlarged');
      expect(result.abdominalDetails.image).toBeUndefined();
    });

    it('should include gynecologicalDetails when gynecological form is dirty', () => {
      const examForm = {
        controls: {
          signsForm: { dirty: false, controls: {}, value: {} },
          oralExaminationForm: { dirty: false, value: {} },
          breastExaminationForm: { dirty: false, value: {} },
          abdominalExaminationForm: { dirty: false, value: {} },
          gynecologicalExaminationForm: {
            dirty: true,
            value: { cervix: 'Normal', image: 'img3' },
          },
        },
      };
      const result: any = service.postCancerExaminationDetails(
        examForm,
        {},
        []
      );
      expect(result.gynecologicalDetails).toBeDefined();
      expect(result.gynecologicalDetails.cervix).toBe('Normal');
      expect(result.gynecologicalDetails.image).toBeUndefined();
    });

    it('should include signsDetails with lymphNodes filtering when signs form is dirty', () => {
      const mockLymphNodeControl1 = new FormControl({ lymphNodeName: 'Neck' });
      mockLymphNodeControl1.markAsDirty();
      const mockLymphNodeControl2 = new FormControl({
        lymphNodeName: 'Axilla',
      });
      // mockLymphNodeControl2 stays pristine

      const lymphNodesArray = new FormArray([
        mockLymphNodeControl1,
        mockLymphNodeControl2,
      ]);
      const signsFormGroup = new FormGroup({
        lymphNodes: lymphNodesArray,
        observation: new FormControl('Swelling'),
      });
      signsFormGroup.markAsDirty();

      const examForm = {
        controls: {
          signsForm: signsFormGroup,
          oralExaminationForm: { dirty: false, value: {} },
          breastExaminationForm: { dirty: false, value: {} },
          abdominalExaminationForm: { dirty: false, value: {} },
          gynecologicalExaminationForm: { dirty: false, value: {} },
        },
      };
      const result: any = service.postCancerExaminationDetails(
        examForm,
        { beneficiaryRegID: '9876' },
        []
      );
      expect(result.signsDetails).toBeDefined();
      expect(result.signsDetails.cancerSignAndSymptoms).toBeDefined();
      expect(result.signsDetails.cancerLymphNodeDetails.length).toBe(1);
      expect(result.signsDetails.cancerLymphNodeDetails[0].lymphNodeName).toBe(
        'Neck'
      );
    });
  });

  // -------------------------------------------------------------------
  // Nurse visit form methods (POST to HTTP)
  // -------------------------------------------------------------------
  describe('nurse visit form POST methods', () => {
    function buildFullMedicalForm() {
      return {
        controls: {
          patientVisitForm: buildMockVisitForm(),
          patientVitalsForm: buildMockVitalsForm(),
          patientHistoryForm: buildMockHistoryControls(),
          patientExaminationForm: { value: buildMockExaminationFormValue() },
          patientANCForm: {
            controls: {
              patientANCDetailsForm: {
                value: { lmpDate: null, expDelDt: null },
              },
              obstetricFormulaForm: {
                value: {
                  gravida_G: 1,
                  termDeliveries_T: 0,
                  pretermDeliveries_P: 0,
                  abortions_A: 0,
                  stillBirth: 0,
                  livebirths_L: 0,
                  bloodGroup: 'O+',
                },
              },
              patientANCImmunizationForm: {
                value: {
                  dateReceivedForTT_1: null,
                  dateReceivedForTT_2: null,
                  dateReceivedForTT_3: null,
                },
              },
            },
          },
          patientPNCForm: {
            value: {
              deliveryPlace: null,
              deliveryType: null,
              deliveryComplication: null,
              pregOutcome: null,
              postNatalComplication: null,
              gestationName: null,
              newBornHealthStatus: null,
              dDate: null,
            },
          },
          NCDScreeningForm: { value: {} },
          idrsScreeningForm: { value: {} },
        },
      };
    }

    it('postNurseANCVisitForm should POST to saveNurseANCDetails', () => {
      const medicalForm = buildFullMedicalForm();
      service
        .postNurseANCVisitForm(medicalForm, 'visit1', 'ANC', 25)
        .subscribe();
      const req = httpMock.expectOne(environment.saveNurseANCDetails);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.ancDetails).toBeDefined();
      expect(req.request.body.vitalDetails).toBeDefined();
      expect(req.request.body.historyDetails).toBeDefined();
      expect(req.request.body.examinationDetails).toBeDefined();
      expect(req.request.body.benFlowID).toBe('222');
      expect(req.request.body.beneficiaryID).toBe('333');
      expect(req.request.body.sessionID).toBe('sess1');
      expect(req.request.body.parkingPlaceID).toBe(20);
      expect(req.request.body.vanID).toBe(10);
      expect(req.request.body.serviceID).toBe('5');
      expect(req.request.body.createdBy).toBe('testUser');
      req.flush({});
    });

    it('postNurseGeneralOPDVisitForm should POST to saveNurseGeneralOPDDetails', () => {
      const medicalForm = buildFullMedicalForm();
      service
        .postNurseGeneralOPDVisitForm(medicalForm, 'General OPD', {
          ageVal: 30,
        })
        .subscribe();
      const req = httpMock.expectOne(environment.saveNurseGeneralOPDDetails);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.vitalDetails).toBeDefined();
      expect(req.request.body.historyDetails).toBeDefined();
      expect(req.request.body.examinationDetails).toBeDefined();
      expect(req.request.body.vanID).toBe(10);
      req.flush({});
    });

    it('postNurseNCDCareVisitForm should POST to saveNurseNCDCareDetails', () => {
      const medicalForm = buildFullMedicalForm();
      service
        .postNurseNCDCareVisitForm(medicalForm, 'NCD care', { ageVal: 50 })
        .subscribe();
      const req = httpMock.expectOne(environment.saveNurseNCDCareDetails);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.vitalDetails).toBeDefined();
      expect(req.request.body.historyDetails).toBeDefined();
      // NCD care does not include examinationDetails
      expect(req.request.body.examinationDetails).toBeUndefined();
      req.flush({});
    });

    it('postNurseCovidCareVisitForm should POST to saveNurseCovidCareDetails', () => {
      const medicalForm = buildFullMedicalForm();
      service
        .postNurseCovidCareVisitForm(medicalForm, 'COVID-19 Screening', {
          ageVal: 40,
        })
        .subscribe();
      const req = httpMock.expectOne(environment.saveNurseCovidCareDetails);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.vitalDetails).toBeDefined();
      expect(req.request.body.historyDetails).toBeDefined();
      req.flush({});
    });

    it('postNursePNCVisitForm should POST to savePNCNurseDetailsUrl', () => {
      const medicalForm = buildFullMedicalForm();
      service
        .postNursePNCVisitForm(medicalForm, 'PNC', { ageVal: 28 })
        .subscribe();
      const req = httpMock.expectOne(environment.savePNCNurseDetailsUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.pNCDeatils).toBeDefined();
      expect(req.request.body.vitalDetails).toBeDefined();
      expect(req.request.body.historyDetails).toBeDefined();
      expect(req.request.body.examinationDetails).toBeDefined();
      req.flush({});
    });

    it('postNurseGeneralQCVisitForm should POST to saveNurseGeneralQuickConsult', () => {
      const medicalForm = {
        controls: {
          patientVisitForm: {
            controls: {
              patientVisitDetailsForm: {
                value: { visitReason: 'Quick Consult' },
              },
              patientFileUploadDetailsForm: { value: {} },
            },
          },
          patientVitalsForm: { value: { height: 170 } },
        },
      };
      service.postNurseGeneralQCVisitForm(medicalForm).subscribe();
      const req = httpMock.expectOne(environment.saveNurseGeneralQuickConsult);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.vitalsDetails).toBeDefined();
      expect(req.request.body.benFlowID).toBe('222');
      expect(req.request.body.parkingPlaceID).toBe(20);
      expect(req.request.body.vanID).toBe(10);
      req.flush({});
    });

    it('postNCDScreeningForm should POST to postNCDScreeningDetails', () => {
      const medicalForm = buildFullMedicalForm();
      service.postNCDScreeningForm(medicalForm, 'NCD screening').subscribe();
      const req = httpMock.expectOne(environment.postNCDScreeningDetails);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.visitDetails).toBeDefined();
      expect(req.request.body.vitalDetails).toBeDefined();
      expect(req.request.body.historyDetails).toBeDefined();
      expect(req.request.body.idrsDetails).toBeDefined();
      expect(req.request.body.benFlowID).toBe('222');
      req.flush({});
    });
  });

  // -------------------------------------------------------------------
  // postNurseCancerVisitForm
  // -------------------------------------------------------------------
  describe('postNurseCancerVisitForm', () => {
    it('should POST to saveNurseCancerScreeningDetails with session metadata', () => {
      const medicalForm = {
        controls: {
          patientVisitForm: {
            controls: {
              patientVisitDetailsForm: { dirty: true, value: {} },
              patientFileUploadDetailsForm: { value: {} },
            },
          },
          patientVitalsForm: { dirty: true, value: { weight: 60 } },
          patientExaminationForm: {
            dirty: false,
            controls: {},
            value: {},
          },
          patientHistoryForm: {
            dirty: false,
            controls: {},
            value: {},
          },
        },
      };
      service.postNurseCancerVisitForm(medicalForm, [], true).subscribe();
      const req = httpMock.expectOne(
        environment.saveNurseCancerScreeningDetails
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sendToDoctorWorklist).toBeTrue();
      expect(req.request.body.benFlowID).toBe('222');
      expect(req.request.body.beneficiaryID).toBe('333');
      expect(req.request.body.sessionID).toBe('sess1');
      expect(req.request.body.vanID).toBe(10);
      expect(req.request.body.parkingPlaceID).toBe(20);
      expect(req.request.body.serviceID).toBe('5');
      expect(req.request.body.createdBy).toBe('testUser');
      req.flush({});
    });

    it('should include visitDetails only when visit form is dirty', () => {
      const medicalForm = {
        controls: {
          patientVisitForm: {
            controls: {
              patientVisitDetailsForm: { dirty: false, value: {} },
              patientFileUploadDetailsForm: { value: {} },
            },
          },
          patientVitalsForm: { dirty: false, value: {} },
          patientExaminationForm: { dirty: false, controls: {}, value: {} },
          patientHistoryForm: { dirty: false, controls: {}, value: {} },
        },
      };
      service.postNurseCancerVisitForm(medicalForm, [], false).subscribe();
      const req = httpMock.expectOne(
        environment.saveNurseCancerScreeningDetails
      );
      expect(req.request.body.visitDetails).toBeUndefined();
      expect(req.request.body.vitalsDetails).toBeUndefined();
      req.flush({});
    });
  });

  // -------------------------------------------------------------------
  // saveBenCovidVaccinationDetails
  // -------------------------------------------------------------------
  describe('saveBenCovidVaccinationDetails', () => {
    it('should POST with covidVSID when provided', () => {
      const form = {
        value: {
          covidVSID: 123,
          vaccineStatus: 'Vaccinated',
          vaccineTypes: 'Covaxin',
          doseTaken: 'Dose1',
        },
      };
      service.saveBenCovidVaccinationDetails(form).subscribe();
      const req = httpMock.expectOne(
        environment.saveCovidVaccinationDetailsUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.covidVSID).toBe(123);
      expect(req.request.body.modifiedBy).toBe('testUser');
      expect(req.request.body.vanID).toBe(10);
      expect(req.request.body.parkingPlaceID).toBe(20);
      req.flush({});
    });

    it('should POST with covidVSID as null when not provided', () => {
      const form = {
        value: {
          covidVSID: null,
          vaccineStatus: 'Not Vaccinated',
          vaccineTypes: null,
          doseTaken: null,
        },
      };
      service.saveBenCovidVaccinationDetails(form).subscribe();
      const req = httpMock.expectOne(
        environment.saveCovidVaccinationDetailsUrl
      );
      expect(req.request.body.covidVSID).toBeNull();
      expect(req.request.body.modifiedBy).toBeUndefined();
      req.flush({});
    });

    it('should POST with covidVSID as null when undefined', () => {
      const form = {
        value: {
          covidVSID: undefined,
          vaccineStatus: 'Not Vaccinated',
          vaccineTypes: null,
          doseTaken: null,
        },
      };
      service.saveBenCovidVaccinationDetails(form).subscribe();
      const req = httpMock.expectOne(
        environment.saveCovidVaccinationDetailsUrl
      );
      expect(req.request.body.covidVSID).toBeNull();
      req.flush({});
    });
  });

  // -------------------------------------------------------------------
  // normalizeToUTCMidnight (tested indirectly via public methods)
  // -------------------------------------------------------------------
  describe('normalizeToUTCMidnight (indirect)', () => {
    it('should normalize a date to UTC midnight ISO string via postANCDetailForm', () => {
      const mockForm = {
        controls: {
          patientANCDetailsForm: {
            value: { lmpDate: '2025-10-07', expDelDt: null },
          },
          obstetricFormulaForm: {
            value: {
              gravida_G: 1,
              termDeliveries_T: 0,
              pretermDeliveries_P: 0,
              abortions_A: 0,
              stillBirth: 0,
              livebirths_L: 0,
              bloodGroup: 'O+',
            },
          },
        },
      };
      const result = service.postANCDetailForm(mockForm, 'visit1');
      expect(result.lmpDate).toMatch(/2025-10-07T00:00:00\.000Z/);
    });

    it('should return null for null date via postANCDetailForm', () => {
      const mockForm = {
        controls: {
          patientANCDetailsForm: {
            value: { lmpDate: null, expDelDt: null },
          },
          obstetricFormulaForm: {
            value: {
              gravida_G: 1,
              termDeliveries_T: 0,
              pretermDeliveries_P: 0,
              abortions_A: 0,
              stillBirth: 0,
              livebirths_L: 0,
              bloodGroup: 'O+',
            },
          },
        },
      };
      const result = service.postANCDetailForm(mockForm, 'visit1');
      // lmpDate stays null because normalizeToUTCMidnight returns null for falsy input
      // but the if-guard prevents calling normalizeToUTCMidnight when lmpDate is null
      expect(result.lmpDate).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // fileData property
  // -------------------------------------------------------------------
  describe('fileData', () => {
    it('should allow setting and getting fileData', () => {
      expect(service.fileData).toBeUndefined();
      service.fileData = [1, 2, 3];
      expect(service.fileData).toEqual([1, 2, 3]);
    });
  });

  // -------------------------------------------------------------------
  // rbsTestResultFromDoctorFetch
  // -------------------------------------------------------------------
  describe('rbsTestResultFromDoctorFetch', () => {
    it('should allow setting and reading rbsTestResultFromDoctorFetch', () => {
      expect(service.rbsTestResultFromDoctorFetch).toBeUndefined();
      service.rbsTestResultFromDoctorFetch = 'someResult';
      expect(service.rbsTestResultFromDoctorFetch).toBe('someResult');
    });
  });
});
