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
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { DoctorService } from './doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;
  let sessionStorageSpy: jasmine.SpyObj<SessionStorageService>;

  const mockSessionStore: Record<string, string> = {
    providerServiceID: '1234',
    serviceID: '5',
    serviceLineDetails: JSON.stringify({
      vanID: 10,
      parkingPlaceID: 20,
      facilityID: 30,
    }),
    beneficiaryRegID: '9876',
    visitID: '111',
    benFlowID: '222',
    beneficiaryID: '333',
    doctorFlag: '1',
    nurseFlag: '2',
    pharmacist_flag: '3',
    visitCode: 'VC001',
    sessionID: 'sess1',
    userName: 'testUser',
    visitCategory: 'General OPD',
    beneficiaryData: JSON.stringify({
      doctorFlag: '1',
      nurseFlag: '2',
      pharmacist_flag: 'Not Available',
      benVisitID: '111',
      beneficiaryID: '333',
      benFlowID: '222',
      vanID: 10,
    }),
  };

  beforeEach(() => {
    sessionStorageSpy = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);
    sessionStorageSpy.getItem.and.callFake(
      (key: string) => mockSessionStore[key] || null
    );

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DoctorService,
        { provide: SessionStorageService, useValue: sessionStorageSpy },
      ],
    });

    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Properties initialization', () => {
    it('should initialize enableCovidVaccinationButton to false', () => {
      expect(service.enableCovidVaccinationButton).toBeFalse();
    });

    it('should initialize enableButton to false', () => {
      expect(service.enableButton).toBeFalse();
    });

    it('should initialize historyResponse to empty array', () => {
      expect(service.historyResponse).toEqual([]);
    });
  });

  describe('BehaviorSubjects', () => {
    it('should emit initial value for enableVitalsUpdateButton$', done => {
      service.enableVitalsUpdateButton$.subscribe(val => {
        expect(val).toBeFalse();
        done();
      });
    });

    it('should emit updated value via setValueToEnableVitalsUpdateButton', done => {
      service.setValueToEnableVitalsUpdateButton(true);
      service.enableVitalsUpdateButton$.subscribe(val => {
        expect(val).toBeTrue();
        done();
      });
    });

    it('should emit initial value for populateHistoryResponse$', done => {
      service.populateHistoryResponse$.subscribe(val => {
        expect(val).toEqual([]);
        done();
      });
    });

    it('should emit data via setCapturedHistoryByNurse', done => {
      const mockHistory = [{ key: 'value' }];
      service.setCapturedHistoryByNurse(mockHistory);
      service.populateHistoryResponse$.subscribe(val => {
        expect(val).toEqual(mockHistory);
        done();
      });
    });
  });

  describe('clearCache', () => {
    it('should set generalHistory, getVisitComplaint, caseRecordAndReferDetails to null', () => {
      service.generalHistory = 'something';
      service.getVisitComplaint = 'something';
      service.caseRecordAndReferDetails = 'something';
      service.clearCache();
      expect(service.generalHistory).toBeNull();
      expect(service.getVisitComplaint).toBeNull();
      expect(service.caseRecordAndReferDetails).toBeNull();
    });
  });

  describe('Worklist methods', () => {
    it('getDoctorWorklist should GET with correct URL', () => {
      service.getDoctorWorklist().subscribe();
      const req = httpMock.expectOne(environment.doctorWorkList + '1234/5/10');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('getSpecialistWorklist should GET with correct URL', () => {
      service.getSpecialistWorklist().subscribe();
      const req = httpMock.expectOne(
        environment.specialistWorkListURL + '1234/5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('getDoctorFutureWorklist should GET with correct URL', () => {
      service.getDoctorFutureWorklist().subscribe();
      const req = httpMock.expectOne(
        environment.doctorFutureWorkList + '1234/5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('getSpecialistFutureWorklist should GET with correct URL', () => {
      service.getSpecialistFutureWorklist().subscribe();
      const req = httpMock.expectOne(
        environment.specialistFutureWorkListURL + '1234/5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('getRadiologistWorklist should GET with correct URL', () => {
      service.getRadiologistWorklist().subscribe();
      const req = httpMock.expectOne(
        environment.radiologistWorklist + '1234/5/10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('getOncologistWorklist should GET with correct URL', () => {
      service.getOncologistWorklist().subscribe();
      const req = httpMock.expectOne(
        environment.oncologistWorklist + '1234/5/10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });
  });

  describe('Simple POST/GET methods', () => {
    it('getServiceOnState should POST to getServiceOnStateUrl', () => {
      service.getServiceOnState().subscribe();
      const req = httpMock.expectOne(environment.getServiceOnStateUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ data: [] });
    });

    it('updateBeneficiaryArrivalStatus should POST arrival details', () => {
      const details = { benFlowID: '1', arrivalStatus: true };
      service.updateBeneficiaryArrivalStatus(details).subscribe();
      const req = httpMock.expectOne(
        environment.updateBeneficiaryArrivalStatusUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(details);
      req.flush({ statusCode: 200 });
    });

    it('cancelBeneficiaryTCRequest should POST tcRequest', () => {
      const tcReq = { benFlowID: '1' };
      service.cancelBeneficiaryTCRequest(tcReq).subscribe();
      const req = httpMock.expectOne(environment.cancelBeneficiaryTCRequestUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(tcReq);
      req.flush({ statusCode: 200 });
    });

    it('confirmStatus should POST with benVisitID', () => {
      service.confirmStatus('VID1').subscribe();
      const req = httpMock.expectOne(environment.updateVisitStatus);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benVisitID: 'VID1' });
      req.flush({ statusCode: 200 });
    });

    it('getMMUHistory should POST beneficiaryRegID from session', () => {
      service.getMMUHistory().subscribe();
      const req = httpMock.expectOne(environment.previousMMUHistoryUrl);
      expect(req.request.body).toEqual({ beneficiaryRegID: '9876' });
      req.flush({ data: [] });
    });

    it('getTMHistory should POST beneficiaryRegID from session', () => {
      service.getTMHistory().subscribe();
      const req = httpMock.expectOne(environment.previousTMHistoryUrl);
      expect(req.request.body).toEqual({ beneficiaryRegID: '9876' });
      req.flush({ data: [] });
    });

    it('getMCTSHistory should POST beneficiaryRegID from session', () => {
      service.getMCTSHistory().subscribe();
      const req = httpMock.expectOne(environment.previousMCTSHistoryUrl);
      expect(req.request.body).toEqual({ beneficiaryRegID: '9876' });
      req.flush({ data: [] });
    });

    it('get104History should POST beneficiaryRegID from session', () => {
      service.get104History().subscribe();
      const req = httpMock.expectOne(environment.previous104HistoryUrl);
      expect(req.request.body).toEqual({ beneficiaryRegID: '9876' });
      req.flush({ data: [] });
    });

    it('deleteMedicine should POST with id', () => {
      service.deleteMedicine(42).subscribe();
      const req = httpMock.expectOne(environment.drugDeleteUrl);
      expect(req.request.body).toEqual({ id: 42 });
      req.flush({ statusCode: 200 });
    });

    it('getMMUCasesheetData should POST caseSheetRequest', () => {
      const csReq = { benRegID: '1', benVisitID: '2' };
      service.getMMUCasesheetData(csReq).subscribe();
      const req = httpMock.expectOne(environment.getMMUCasesheetDataUrl);
      expect(req.request.body).toEqual(csReq);
      req.flush({ data: {} });
    });

    it('getTMCasesheetData should POST caseSheetRequest', () => {
      const csReq = { benRegID: '1' };
      service.getTMCasesheetData(csReq).subscribe();
      const req = httpMock.expectOne(environment.getTMCasesheetDataUrl);
      expect(req.request.body).toEqual(csReq);
      req.flush({ data: {} });
    });

    it('getArchivedReports should POST', () => {
      const ar = { benRegID: '1' };
      service.getArchivedReports(ar).subscribe();
      const req = httpMock.expectOne(environment.archivedReportsUrl);
      expect(req.request.body).toEqual(ar);
      req.flush({ data: [] });
    });

    it('getPatientMCTSCallHistory should POST', () => {
      const callId = { callDetailID: '10' };
      service.getPatientMCTSCallHistory(callId).subscribe();
      const req = httpMock.expectOne(environment.patientMCTSCallHistoryUrl);
      expect(req.request.body).toEqual(callId);
      req.flush({ data: [] });
    });

    it('getMasterSpecialization should POST empty body', () => {
      service.getMasterSpecialization().subscribe();
      const req = httpMock.expectOne(environment.getMasterSpecializationUrl);
      expect(req.request.body).toEqual({});
      req.flush({ data: [] });
    });

    it('getSpecialist should POST specialistReqObj', () => {
      const obj = { specializationID: 1 };
      service.getSpecialist(obj).subscribe();
      const req = httpMock.expectOne(environment.getSpecialistUrl);
      expect(req.request.body).toEqual(obj);
      req.flush({ data: [] });
    });

    it('getAvailableSlot should POST', () => {
      const obj = { date: '2024-01-01' };
      service.getAvailableSlot(obj).subscribe();
      const req = httpMock.expectOne(environment.getAvailableSlotUrl);
      expect(req.request.body).toEqual(obj);
      req.flush({ data: [] });
    });

    it('scheduleTC should POST schedulerRequest', () => {
      const obj = { benRegID: '1' };
      service.scheduleTC(obj).subscribe();
      const req = httpMock.expectOne(environment.scheduleTCUrl);
      expect(req.request.body).toEqual(obj);
      req.flush({ statusCode: 200 });
    });

    it('beneficiaryTCRequestStatus should POST', () => {
      const obj = { benFlowID: '1' };
      service.beneficiaryTCRequestStatus(obj).subscribe();
      const req = httpMock.expectOne(environment.beneficiaryTCRequestStatusUrl);
      expect(req.request.body).toEqual(obj);
      req.flush({ statusCode: 200 });
    });

    it('getSwymedMail should GET with vanID', () => {
      service.getSwymedMail().subscribe();
      const req = httpMock.expectOne(environment.getSwymedMailUrl + '/10');
      expect(req.request.method).toBe('GET');
      req.flush({ data: {} });
    });

    it('downloadSign should GET with blob responseType', () => {
      service.downloadSign(42).subscribe();
      const req = httpMock.expectOne(environment.downloadSignUrl + 42);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob());
    });

    it('getUserId should GET with userName', () => {
      service.getUserId('testUser').subscribe();
      const req = httpMock.expectOne(environment.getUserId + 'testUser');
      expect(req.request.method).toBe('GET');
      req.flush({ data: { userID: 1 } });
    });

    it('getAssessment should GET with benRegID', () => {
      service.getAssessment('REG1').subscribe();
      const req = httpMock.expectOne(environment.getAssessmentIdUrl + '/REG1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: {} });
    });

    it('getAssessmentDet should GET with assessmentId', () => {
      service.getAssessmentDet('A1').subscribe();
      const req = httpMock.expectOne(environment.getAssessmentUrl + '/A1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: {} });
    });

    it('checkUsersignatureExist should GET with userID', () => {
      service.checkUsersignatureExist(5).subscribe();
      const req = httpMock.expectOne(environment.checkUsersignExistUrl + 5);
      expect(req.request.method).toBe('GET');
      req.flush({ data: true });
    });

    it('getPreviousVisitAnthropometry should POST', () => {
      const obj = { benRegID: '1' };
      service.getPreviousVisitAnthropometry(obj).subscribe();
      const req = httpMock.expectOne(environment.getPreviousAnthropometryUrl);
      expect(req.request.body).toEqual(obj);
      req.flush({ data: [] });
    });

    it('getPreviousSignificiantFindings should POST', () => {
      const obj = { benRegID: '1' };
      service.getPreviousSignificiantFindings(obj).subscribe();
      const req = httpMock.expectOne(
        environment.getPreviousSignificiantFindingUrl
      );
      expect(req.request.body).toEqual(obj);
      req.flush({ data: [] });
    });

    it('getHRPDetails should POST and cache result', () => {
      service.getHRPDetails('REG1', 'VC1').subscribe();
      const req = httpMock.expectOne(environment.loadHRPUrl);
      expect(req.request.body).toEqual({
        benRegID: 'REG1',
        visitCode: 'VC1',
      });
      req.flush({ data: {} });
      expect(service.HRPDetails).toBeDefined();
    });
  });

  describe('Cancer screening methods', () => {
    it('getVisitDetails should POST with correct body', () => {
      service.getVisitDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getCancerScreeningVisitDetails
      );
      expect(req.request.body).toEqual({
        benRegID: 'BEN1',
        benVisitID: 'VIS1',
        visitCode: 'VC001',
      });
      req.flush({ data: {} });
    });

    it('getCancerHistoryDetails should POST', () => {
      service.getCancerHistoryDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getCancerScreeningHistoryDetails
      );
      expect(req.request.body.benRegID).toBe('BEN1');
      req.flush({ data: {} });
    });

    it('getCancerVitalsDetails should POST', () => {
      service.getCancerVitalsDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getCancerScreeningVitalsDetails
      );
      expect(req.request.body.benRegID).toBe('BEN1');
      req.flush({ data: {} });
    });

    it('getCancerExaminationDetails should POST', () => {
      service.getCancerExaminationDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getCancerScreeningExaminationDetails
      );
      expect(req.request.body.benRegID).toBe('BEN1');
      req.flush({ data: {} });
    });
  });

  describe('NCD Screening methods', () => {
    it('getNcdScreeningDetails should POST', () => {
      service.getNcdScreeningDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getNCDScreeningDetails);
      expect(req.request.body).toEqual({
        benRegID: 'BEN1',
        benVisitID: 'VIS1',
        visitCode: 'VC001',
      });
      req.flush({ data: {} });
    });
  });

  describe('ANC methods', () => {
    it('getAncCareDetails should POST', () => {
      service.getAncCareDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getANCDetailsUrl);
      expect(req.request.body).toEqual({
        benRegID: 'BEN1',
        benVisitID: 'VIS1',
        visitCode: 'VC001',
      });
      req.flush({ data: {} });
    });
  });

  describe('PNC methods', () => {
    it('getPNCDetails should POST', () => {
      service.getPNCDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getPNCDetailsUrl);
      expect(req.request.body).toEqual({
        benRegID: 'BEN1',
        benVisitID: 'VIS1',
        visitCode: 'VC001',
      });
      req.flush({ data: {} });
    });
  });

  describe('postOncologistRemarksforCancerCaseSheet', () => {
    it('should POST oncologist remarks', () => {
      service
        .postOncologistRemarksforCancerCaseSheet('remark', 'VIS1', 'REG1')
        .subscribe();
      const req = httpMock.expectOne(
        environment.updateOncologistRemarksCancelUrl
      );
      expect(req.request.body.provisionalDiagnosisOncologist).toBe('remark');
      expect(req.request.body.beneficiaryRegID).toBe('REG1');
      expect(req.request.body.benVisitID).toBe('VIS1');
      expect(req.request.body.modifiedBy).toBe('testUser');
      req.flush({ statusCode: 200 });
    });
  });

  describe('getVisitComplaintDetails (caching & visit-category branching)', () => {
    it('should use Cancer Screening URL for Cancer Screening visit', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'Cancer Screening';
        return mockSessionStore[key] || null;
      });
      service.getVisitComplaint = null;
      service.getVisitComplaintDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getCancerScreeningVisitDetails
      );
      req.flush({ data: {} });
    });

    it('should use General OPD QC URL for General OPD (QC) visit', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD (QC)';
        return mockSessionStore[key] || null;
      });
      service.getVisitComplaint = null;
      service.getVisitComplaintDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getGeneralOPDQuickConsultVisitDetails
      );
      req.flush({ data: {} });
    });

    it('should use ANC URL for ANC visit', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'ANC';
        return mockSessionStore[key] || null;
      });
      service.getVisitComplaint = null;
      service.getVisitComplaintDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getANCVisitDetailsUrl);
      req.flush({ data: {} });
    });

    it('should use cached value if getVisitComplaint is already set', () => {
      service.getVisitComplaint = 'cachedValue';
      const result = service.getVisitComplaintDetails('BEN1', 'VIS1');
      expect(result).toBe('cachedValue');
    });

    it('should use PNC URL for PNC visit (returns directly)', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'PNC';
        return mockSessionStore[key] || null;
      });
      service.getVisitComplaint = null;
      service.getVisitComplaintDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getPNCVisitDetailsUrl);
      req.flush({ data: {} });
    });

    it('should use COVID-19 URL for COVID-19 Screening visit', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'COVID-19 Screening';
        return mockSessionStore[key] || null;
      });
      service.getVisitComplaint = null;
      service.getVisitComplaintDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getCovidCareVisitDetailsUrl);
      req.flush({ data: {} });
    });
  });

  describe('getPregVisitComplaintDetails', () => {
    it('should POST to NCD Screening visit details URL', () => {
      service
        .getPregVisitComplaintDetails('BEN1', 'VIS1', 'NCD screening')
        .subscribe();
      const req = httpMock.expectOne(environment.getNCDScreeningVisitDetails);
      expect(req.request.body.benRegID).toBe('BEN1');
      req.flush({ data: {} });
    });
  });

  describe('getGeneralHistoryDetails (caching & visit-category branching)', () => {
    it('should use ANC URL for ANC visit', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'ANC';
        return mockSessionStore[key] || null;
      });
      service.generalHistory = null;
      service.getGeneralHistoryDetails('REG1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getANCHistoryDetailsUrl);
      req.flush({ data: {} });
    });

    it('should use General OPD URL for General OPD visit', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD';
        return mockSessionStore[key] || null;
      });
      service.generalHistory = null;
      service.getGeneralHistoryDetails('REG1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getGeneralOPDHistoryDetailsUrl
      );
      req.flush({ data: {} });
    });

    it('should return cached value if generalHistory is set', () => {
      service.generalHistory = 'cached';
      const result = service.getGeneralHistoryDetails('REG1', 'VIS1');
      expect(result).toBe('cached');
    });
  });

  describe('getGenericVitals (visit-category branching)', () => {
    const beneficiary = { benRegID: 'REG1', benVisitID: 'VIS1' };

    it('should use General OPD QC URL for General OPD (QC)', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD (QC)';
        return mockSessionStore[key] || null;
      });
      service.getGenericVitals(beneficiary).subscribe();
      const req = httpMock.expectOne(
        environment.getGeneralOPDQuickConsultVitalDetails
      );
      req.flush({ data: {} });
    });

    it('should use ANC URL for ANC', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'ANC';
        return mockSessionStore[key] || null;
      });
      service.getGenericVitals(beneficiary).subscribe();
      const req = httpMock.expectOne(environment.getANCVitalsDetailsUrl);
      req.flush({ data: {} });
    });

    it('should use NCD screening URL for NCD screening', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'NCD screening';
        return mockSessionStore[key] || null;
      });
      service.getGenericVitals(beneficiary).subscribe();
      const req = httpMock.expectOne(environment.getNCDSceeriningVitalDetails);
      req.flush({ data: {} });
    });

    it('should complete without emitting for unknown visit category', done => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'Unknown';
        return mockSessionStore[key] || null;
      });
      service.getGenericVitals(beneficiary).subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('getGeneralExamintionData (visit-category branching)', () => {
    it('should use ANC URL for ANC', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'ANC';
        return mockSessionStore[key] || null;
      });
      service.getGeneralExamintionData('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getANCExaminationDataUrl);
      req.flush({ data: {} });
    });

    it('should use General OPD URL for General OPD', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD';
        return mockSessionStore[key] || null;
      });
      service.getGeneralExamintionData('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(
        environment.getGeneralOPDExaminationDetailsUrl
      );
      req.flush({ data: {} });
    });

    it('should use PNC URL for PNC', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'PNC';
        return mockSessionStore[key] || null;
      });
      service.getGeneralExamintionData('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getPNCExaminationDataUrl);
      req.flush({ data: {} });
    });

    it('should complete without emit for unknown category', done => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'Unknown';
        return mockSessionStore[key] || null;
      });
      service.getGeneralExamintionData('BEN1', 'VIS1').subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('updateGeneralVitals (visit-category branching)', () => {
    const mockVitalsForm = {
      value: { weight: 70, height: 170 },
      getRawValue: () => ({ weight: 70, height: 170 }),
    };

    it('should POST to ANC vitals URL for ANC', () => {
      service.updateGeneralVitals(mockVitalsForm, 'ANC').subscribe();
      const req = httpMock.expectOne(environment.updateANCVitalsDetailsUrl);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200 });
    });

    it('should POST to General OPD vitals URL for General OPD', () => {
      service.updateGeneralVitals(mockVitalsForm, 'General OPD').subscribe();
      const req = httpMock.expectOne(
        environment.updateGeneralOPDVitalsDetailsUrl
      );
      req.flush({ statusCode: 200 });
    });

    it('should POST to NCD care vitals URL for NCD care', () => {
      service.updateGeneralVitals(mockVitalsForm, 'NCD care').subscribe();
      const req = httpMock.expectOne(environment.updateNCDCareVitalsDetailsUrl);
      req.flush({ statusCode: 200 });
    });

    it('should POST to PNC vitals URL for PNC', () => {
      service.updateGeneralVitals(mockVitalsForm, 'PNC').subscribe();
      const req = httpMock.expectOne(environment.updatePNCVitalsDetailsUrl);
      req.flush({ statusCode: 200 });
    });

    it('should POST to COVID vitals URL for COVID-19 Screening', () => {
      service
        .updateGeneralVitals(mockVitalsForm, 'COVID-19 Screening')
        .subscribe();
      const req = httpMock.expectOne(
        environment.updateCovidCareVitalsDetailsUrl
      );
      req.flush({ statusCode: 200 });
    });

    it('should POST to NCD screening vitals URL for NCD screening', () => {
      service.updateGeneralVitals(mockVitalsForm, 'NCD screening').subscribe();
      const req = httpMock.expectOne(environment.updateNCDVitalsDetailsUrl);
      req.flush({ statusCode: 200 });
    });

    it('should complete without emit for unknown category', done => {
      service.updateGeneralVitals(mockVitalsForm, 'Unknown').subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('updateIDRSDetails', () => {
    const mockIdrsForm = {
      value: { idrsScore: 60 },
    };

    it('should POST for NCD screening', () => {
      service.updateIDRSDetails(mockIdrsForm, 'NCD screening').subscribe();
      const req = httpMock.expectOne(
        environment.updateNCDScreeningIDRSDetailsUrl
      );
      expect(req.request.body.idrsDetails).toBeDefined();
      req.flush({ statusCode: 200 });
    });

    it('should complete without emit for non-NCD screening', done => {
      service.updateIDRSDetails(mockIdrsForm, 'General OPD').subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('getIDRSDetails', () => {
    it('should POST for NCD screening', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'NCD screening';
        return mockSessionStore[key] || null;
      });
      service.getIDRSDetails('BEN1', 'VIS1').subscribe();
      const req = httpMock.expectOne(environment.getNCDScreeningIDRSDetails);
      req.flush({ data: {} });
    });

    it('should complete for non-NCD screening', done => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD';
        return mockSessionStore[key] || null;
      });
      service.getIDRSDetails('BEN1', 'VIS1').subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('getCaseRecordAndReferDetails (caching & branching)', () => {
    it('should use Cancer Screening URL', () => {
      service.caseRecordAndReferDetails = null;
      service
        .getCaseRecordAndReferDetails('REG1', 'VIS1', 'Cancer Screening')
        .subscribe();
      const req = httpMock.expectOne(
        environment.getCancerScreeningDoctorDetails
      );
      req.flush({ data: {} });
    });

    it('should use ANC URL', () => {
      service.caseRecordAndReferDetails = null;
      service.getCaseRecordAndReferDetails('REG1', 'VIS1', 'ANC').subscribe();
      const req = httpMock.expectOne(environment.getANCDoctorDetails);
      req.flush({ data: {} });
    });

    it('should use General OPD (QC) URL', () => {
      service.caseRecordAndReferDetails = null;
      service
        .getCaseRecordAndReferDetails('REG1', 'VIS1', 'General OPD (QC)')
        .subscribe();
      const req = httpMock.expectOne(
        environment.getGeneralOPDQuickConsultDoctorDetails
      );
      req.flush({ data: {} });
    });

    it('should use cached value', () => {
      service.caseRecordAndReferDetails = 'cached';
      const result = service.getCaseRecordAndReferDetails(
        'REG1',
        'VIS1',
        'ANC'
      );
      expect(result).toBe('cached');
    });
  });

  describe('Examination update helper methods', () => {
    it('updateGeneralExaminationForm should merge form and details', () => {
      const result = service.updateGeneralExaminationForm(
        { consciousness: 'conscious' },
        { modifiedBy: 'test' }
      );
      expect(result.consciousness).toBe('conscious');
      expect(result.modifiedBy).toBe('test');
    });

    it('updateHeadToToeExaminationForm should merge', () => {
      const result = service.updateHeadToToeExaminationForm(
        { headExam: 'normal' },
        { modifiedBy: 'test' }
      );
      expect(result.headExam).toBe('normal');
      expect(result.modifiedBy).toBe('test');
    });

    it('updateCardioVascularSystemForm should merge', () => {
      const result = service.updateCardioVascularSystemForm(
        { heartRate: 72 },
        { modifiedBy: 'test' }
      );
      expect(result.heartRate).toBe(72);
    });

    it('updateRespiratorySystemForm should merge', () => {
      const result = service.updateRespiratorySystemForm(
        { respiratoryRate: 18 },
        { modifiedBy: 'test' }
      );
      expect(result.respiratoryRate).toBe(18);
    });

    it('updateCentralNervousSystemForm should merge', () => {
      const result = service.updateCentralNervousSystemForm(
        { cns: 'normal' },
        { modifiedBy: 'test' }
      );
      expect(result.cns).toBe('normal');
    });

    it('updateMusculoSkeletalSystemForm should merge', () => {
      const result = service.updateMusculoSkeletalSystemForm(
        { joints: 'normal' },
        { modifiedBy: 'test' }
      );
      expect(result.joints).toBe('normal');
    });

    it('updateGenitoUrinarySystemForm should merge', () => {
      const result = service.updateGenitoUrinarySystemForm(
        { kidney: 'normal' },
        { modifiedBy: 'test' }
      );
      expect(result.kidney).toBe('normal');
    });

    it('updateGastroIntestinalSystemForm should merge', () => {
      const result = service.updateGastroIntestinalSystemForm(
        { abdomen: 'soft' },
        { modifiedBy: 'test' }
      );
      expect(result.abdomen).toBe('soft');
    });

    it('updateANCObstetricExamination should merge', () => {
      const result = service.updateANCObstetricExamination(
        { fundalHeight: '30' },
        { modifiedBy: 'test' }
      );
      expect(result.fundalHeight).toBe('30');
    });
  });

  describe('History update helper methods', () => {
    it('updateGeneralDevelopmentHistory should merge form value and details', () => {
      const form = { value: { grossMotorMilestone: 'normal' } };
      const result = service.updateGeneralDevelopmentHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.grossMotorMilestone).toBe('normal');
      expect(result.modifiedBy).toBe('test');
    });

    it('updateGeneralMedicationHistory should merge', () => {
      const form = {
        value: { medicationHistoryList: [{ medication: 'aspirin' }] },
      };
      const result = service.updateGeneralMedicationHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.medicationHistoryList).toBeDefined();
    });

    it('updateGeneralImmunizationHistory should extract immunizationList', () => {
      const form = {
        value: {
          immunizationList: [{ vaccine: 'BCG' }],
        },
      };
      const result = service.updateGeneralImmunizationHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.immunizationList).toEqual([{ vaccine: 'BCG' }]);
    });

    it('updateGeneralOtherVaccines should map vaccine names', () => {
      const form = {
        value: {
          otherVaccines: [
            {
              vaccineName: { vaccineID: 1, vaccineName: 'Hepatitis B' },
            },
          ],
        },
      };
      const result = service.updateGeneralOtherVaccines(form, {
        modifiedBy: 'test',
      });
      expect(result.childOptionalVaccineList[0].vaccineID).toBe(1);
      expect(result.childOptionalVaccineList[0].vaccineName).toBe(
        'Hepatitis B'
      );
    });

    it('updateGeneralFeedingHistory should handle foodIntoleranceStatus', () => {
      const form = {
        value: { foodIntoleranceStatus: '1', typeOfFood: 'milk' },
      };
      const result = service.updateGeneralFeedingHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.foodIntoleranceStatus).toBe(1);
    });

    it('updateGeneralFeedingHistory should handle falsy foodIntoleranceStatus', () => {
      const form = {
        value: { foodIntoleranceStatus: '', typeOfFood: 'milk' },
      };
      const result = service.updateGeneralFeedingHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.foodIntoleranceStatus).toBe('');
    });

    it('updateGeneralPerinatalHistory should map placeOfDelivery', () => {
      const form = {
        value: {
          placeOfDelivery: {
            deliveryPlaceID: 1,
            deliveryPlace: 'Hospital',
          },
          typeOfDelivery: null,
          complicationAtBirth: null,
        },
      };
      const result = service.updateGeneralPerinatalHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.deliveryPlaceID).toBe(1);
      expect(result.placeOfDelivery).toBe('Hospital');
    });

    it('updateGeneralPerinatalHistory should map typeOfDelivery', () => {
      const form = {
        value: {
          placeOfDelivery: null,
          typeOfDelivery: {
            deliveryTypeID: 2,
            deliveryType: 'Normal',
          },
          complicationAtBirth: null,
        },
      };
      const result = service.updateGeneralPerinatalHistory(form, {});
      expect(result.deliveryTypeID).toBe(2);
      expect(result.typeOfDelivery).toBe('Normal');
    });

    it('updateGeneralPerinatalHistory should map complicationAtBirth', () => {
      const form = {
        value: {
          placeOfDelivery: null,
          typeOfDelivery: null,
          complicationAtBirth: {
            birthComplicationID: 3,
            name: 'None',
          },
        },
      };
      const result = service.updateGeneralPerinatalHistory(form, {});
      expect(result.complicationAtBirthID).toBe(3);
      expect(result.complicationAtBirth).toBe('None');
    });
  });

  describe('Case record helper methods', () => {
    it('postGeneralCaseRecordFindings should filter and map complaints', () => {
      const findingForm = {
        value: {
          complaints: [
            {
              chiefComplaint: {
                chiefComplaintID: 1,
                chiefComplaint: 'Fever',
              },
              duration: 5,
            },
            { chiefComplaint: null, duration: null },
          ],
        },
      };
      const result = service.postGeneralCaseRecordFindings(findingForm, {
        benRegID: '1',
      });
      expect(result.complaints.length).toBe(1);
      expect(result.complaints[0].chiefComplaintID).toBe(1);
      expect(result.complaints[0].chiefComplaint).toBe('Fever');
      expect(result.complaints[0].duration).toBe('5');
    });

    it('postANCCaseRecordDiagnosis should merge and remove null dateOfDeath', () => {
      const diagForm = {
        value: { diagnosis: 'normal', dateOfDeath: null },
      };
      const result = service.postANCCaseRecordDiagnosis(diagForm, {
        benRegID: '1',
      });
      expect(result.diagnosis).toBe('normal');
      expect(result.dateOfDeath).toBeUndefined();
    });

    it('postANCCaseRecordDiagnosis should keep dateOfDeath if not null', () => {
      const diagForm = {
        value: { diagnosis: 'anemia', dateOfDeath: '2024-01-01' },
      };
      const result = service.postANCCaseRecordDiagnosis(diagForm, {});
      expect(result.dateOfDeath).toBe('2024-01-01');
    });

    it('postGeneralOPDCaseRecordDiagnosis should merge', () => {
      const diagForm = { value: { diagnosis: 'flu' } };
      const result = service.postGeneralOPDCaseRecordDiagnosis(diagForm, {
        benRegID: '1',
      });
      expect(result.diagnosis).toBe('flu');
      expect(result.benRegID).toBe('1');
    });

    it('postNCDCareCaseRecordDiagnosis should map ncdCareType', () => {
      const diagForm = {
        value: {
          ncdCareType: {
            ncdCareTypeID: 1,
            ncdCareType: 'Diabetes',
          },
        },
      };
      const result = service.postNCDCareCaseRecordDiagnosis(diagForm, {});
      expect(result.ncdCareTypeID).toBe(1);
      expect(result.ncdCareType).toBe('Diabetes');
    });

    it('postGeneralCaseRecordInvestigation should concat lab and radiology tests', () => {
      const investigationForm = {
        value: {
          labTest: [
            { procedureName: 'CBC', disabled: false },
            { procedureName: 'DisabledTest', disabled: true },
          ],
          radiologyTest: [{ procedureName: 'X-Ray', disabled: false }],
        },
      };
      const result = service.postGeneralCaseRecordInvestigation(
        investigationForm,
        {}
      );
      expect(result.laboratoryList.length).toBe(2);
      expect(result.labTest).toBeUndefined();
      expect(result.radiologyTest).toBeUndefined();
    });

    it('postGeneralCaseRecordInvestigation should handle null radiologyTest', () => {
      const investigationForm = {
        value: {
          labTest: [{ procedureName: 'CBC', disabled: false }],
          radiologyTest: [],
        },
      };
      const result = service.postGeneralCaseRecordInvestigation(
        investigationForm,
        {}
      );
      expect(result.laboratoryList.length).toBe(1);
    });

    it('postGeneralCaseRecordPrescription should filter by createdBy', () => {
      const prescriptionForm = {
        value: {
          prescribedDrugs: [
            { drugName: 'Paracetamol', createdBy: 'doc1' },
            { drugName: 'Empty', createdBy: null },
          ],
        },
      };
      const result = service.postGeneralCaseRecordPrescription(
        prescriptionForm,
        {}
      );
      expect(result.length).toBe(1);
      expect(result[0].drugName).toBe('Paracetamol');
    });

    it('postGeneralRefer should map referredToInstituteName', () => {
      const referForm = {
        value: {
          referredToInstituteName: {
            institutionID: 1,
            institutionName: 'Hospital A',
          },
          refrredToAdditionalServiceList: null,
          revisitDate: null,
          referralReason: null,
        },
        controls: {
          revisitDate: { value: null },
          referralReason: { value: null },
        },
      };
      const result = service.postGeneralRefer(referForm, {});
      expect(result.referredToInstituteID).toBe(1);
      expect(result.referredToInstituteName).toBe('Hospital A');
    });

    it('postGeneralRefer should filter disabled additional services', () => {
      const referForm = {
        value: {
          referredToInstituteName: null,
          refrredToAdditionalServiceList: [
            { serviceName: 'Lab', disabled: false },
            { serviceName: 'Disabled', disabled: true },
          ],
          revisitDate: null,
          referralReason: null,
        },
        controls: {
          revisitDate: { value: null },
          referralReason: { value: null },
        },
      };
      const result = service.postGeneralRefer(referForm, {});
      expect(result.refrredToAdditionalServiceList.length).toBe(1);
    });
  });

  describe('postGeneralCaseRecordDiagnosis (visit-category routing)', () => {
    const diagForm = { value: { diagnosis: 'test' } };
    const otherDetails = { benRegID: '1' };

    it('should route to ANC diagnosis for ANC', () => {
      const result = service.postGeneralCaseRecordDiagnosis(
        diagForm,
        'ANC',
        otherDetails
      );
      expect(result).toBeDefined();
    });

    it('should route to General OPD diagnosis for General OPD', () => {
      const result = service.postGeneralCaseRecordDiagnosis(
        diagForm,
        'General OPD',
        otherDetails
      );
      expect(result).toBeDefined();
    });

    it('should route to NCD care diagnosis for NCD care', () => {
      const ncdForm = {
        value: {
          ncdCareType: { ncdCareTypeID: 1, ncdCareType: 'Diabetes' },
        },
      };
      const result = service.postGeneralCaseRecordDiagnosis(
        ncdForm,
        'NCD care',
        otherDetails
      );
      expect(result.ncdCareTypeID).toBe(1);
    });

    it('should route to PNC (ANC handler) for PNC', () => {
      const pncForm = { value: { diagnosis: 'pnc', dateOfDeath: null } };
      const result = service.postGeneralCaseRecordDiagnosis(
        pncForm,
        'PNC',
        otherDetails
      );
      expect(result).toBeDefined();
    });

    it('should return undefined for unknown category', () => {
      const result = service.postGeneralCaseRecordDiagnosis(
        diagForm,
        'Unknown',
        otherDetails
      );
      expect(result).toBeUndefined();
    });
  });

  describe('updateGeneralHistory (visit-category branching)', () => {
    const mockHistoryForm = {
      controls: {
        pastHistory: { value: { pastIllness: [], pastSurgery: [] } },
        comorbidityHistory: {
          value: { comorbidityConcurrentConditionsList: [] },
        },
        medicationHistory: { value: {} },
        pastObstericHistory: {
          value: { pastObstericHistoryList: [] },
        },
        menstrualHistory: {
          value: {},
          getRawValue: () => ({}),
        },
        familyHistory: { value: { familyDiseaseList: [] } },
        personalHistory: {
          value: {
            tobaccoList: [],
            alcoholList: [],
            allergicList: [],
          },
        },
        otherVaccines: { value: { otherVaccines: [] } },
        immunizationHistory: { value: { immunizationList: [] } },
        developmentHistory: { value: {} },
        feedingHistory: { value: { foodIntoleranceStatus: '' } },
        perinatalHistory: {
          value: {
            placeOfDelivery: null,
            typeOfDelivery: null,
            complicationAtBirth: null,
          },
        },
      },
    };
    const temp = { modifiedBy: 'test' };

    it('should POST to ANC history URL and remove child-specific fields', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'ANC';
        return mockSessionStore[key] || null;
      });
      service.updateGeneralHistory(mockHistoryForm, temp, 30).subscribe();
      const req = httpMock.expectOne(environment.updateANCHistoryDetailsUrl);
      expect(req.request.body.feedingHistory).toBeUndefined();
      expect(req.request.body.developmentHistory).toBeUndefined();
      expect(req.request.body.perinatalHistroy).toBeUndefined();
      req.flush({ statusCode: 200 });
    });

    it('should POST to General OPD history URL', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD';
        return mockSessionStore[key] || null;
      });
      service.updateGeneralHistory(mockHistoryForm, temp, 30).subscribe();
      const req = httpMock.expectOne(
        environment.updateGeneralOPDHistoryDetailsUrl
      );
      req.flush({ statusCode: 200 });
    });

    it('should POST to NCD care history URL', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'NCD care';
        return mockSessionStore[key] || null;
      });
      service.updateGeneralHistory(mockHistoryForm, temp, 30).subscribe();
      const req = httpMock.expectOne(
        environment.updateNCDCareHistoryDetailsUrl
      );
      req.flush({ statusCode: 200 });
    });

    it('should POST to PNC history URL', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'PNC';
        return mockSessionStore[key] || null;
      });
      service.updateGeneralHistory(mockHistoryForm, temp, 30).subscribe();
      const req = httpMock.expectOne(environment.updatePNCHistoryDetailsUrl);
      req.flush({ statusCode: 200 });
    });

    it('should POST to COVID history URL', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'COVID-19 Screening';
        return mockSessionStore[key] || null;
      });
      service.updateGeneralHistory(mockHistoryForm, temp, 30).subscribe();
      const req = httpMock.expectOne(
        environment.updateCovidCareHistoryDetailsUrl
      );
      req.flush({ statusCode: 200 });
    });

    it('should complete for unknown visit category', done => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'Unknown';
        return mockSessionStore[key] || null;
      });
      service.updateGeneralHistory(mockHistoryForm, temp, 30).subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('Cancer history helpers', () => {
    it('cancerFamilyHistoryForm should return undefined when form is not dirty', () => {
      const form = { dirty: false, value: { diseases: null } };
      const result = service.cancerFamilyHistoryForm(form, {});
      expect(result).toBeUndefined();
    });

    it('cancerFamilyHistoryForm should map diseases when dirty and non-null', () => {
      const form = {
        dirty: true,
        value: {
          diseases: [
            {
              cancerDiseaseType: {
                cancerDiseaseType: 'Lung Cancer',
              },
              otherDiseaseType: null,
            },
          ],
        },
      };
      const result = service.cancerFamilyHistoryForm(form, {
        benRegID: '1',
      });
      expect(result[0].cancerDiseaseType).toBe('Lung Cancer');
    });

    it('cancerFamilyHistoryForm should use otherDiseaseType for Any other Cancer', () => {
      const form = {
        dirty: true,
        value: {
          diseases: [
            {
              cancerDiseaseType: {
                cancerDiseaseType: 'Any other Cancer',
              },
              otherDiseaseType: 'Rare Cancer',
            },
          ],
        },
      };
      const result = service.cancerFamilyHistoryForm(form, {});
      expect(result[0].cancerDiseaseType).toBe('Rare Cancer');
    });

    it('cancerObstetricHistoryForm should return undefined when not dirty', () => {
      const form = { dirty: false, value: {} };
      const result = service.cancerObstetricHistoryForm(form, {});
      expect(result).toBeUndefined();
    });

    it('cancerObstetricHistoryForm should merge when dirty', () => {
      const form = { dirty: true, value: { pregnancyStatus: 'no' } };
      const result = service.cancerObstetricHistoryForm(form, {
        benRegID: '1',
      });
      expect(result.pregnancyStatus).toBe('no');
      expect(result.benRegID).toBe('1');
    });

    it('cancerPersonalHistoryForm should return undefined when not dirty', () => {
      const form = { dirty: false, value: {} };
      const result = service.cancerPersonalHistoryForm(form, {});
      expect(result).toBeUndefined();
    });

    it('cancerPersonalHistoryForm should merge when dirty', () => {
      const form = { dirty: true, value: { tobaccoUse: 'yes' } };
      const result = service.cancerPersonalHistoryForm(form, {
        benRegID: '1',
      });
      expect(result.tobaccoUse).toBe('yes');
    });
  });

  describe('updateANCDetails', () => {
    it('should POST updated ANC details', () => {
      const patientANCForm = {
        controls: {
          patientANCDetailsForm: {
            value: { lmpDate: null },
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
            value: { tT_1Status: 'done' },
          },
        },
      };
      service.updateANCDetails(patientANCForm, { benRegID: '1' }).subscribe();
      const req = httpMock.expectOne(environment.updateANCDetailsUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.ancObstetricDetails).toBeDefined();
      expect(req.request.body.ancImmunization).toBeDefined();
      req.flush({ statusCode: 200 });
    });
  });

  describe('updatePNCDetails', () => {
    it('should POST updated PNC details with mapped fields', () => {
      const patientPNCForm = {
        value: {
          deliveryPlace: {
            deliveryPlaceID: 1,
            deliveryPlace: 'Hospital',
          },
          deliveryType: {
            deliveryTypeID: 2,
            deliveryType: 'Normal',
          },
          deliveryComplication: null,
          pregOutcome: null,
          postNatalComplication: null,
          gestationName: null,
          newBornHealthStatus: null,
        },
      };
      service.updatePNCDetails(patientPNCForm, { benRegID: '1' }).subscribe();
      const req = httpMock.expectOne(environment.updatePNCDetailsUrl);
      expect(req.request.body.PNCDetails.deliveryPlaceID).toBe(1);
      expect(req.request.body.PNCDetails.deliveryPlace).toBe('Hospital');
      req.flush({ statusCode: 200 });
    });
  });

  describe('updateNCDScreeningHistory', () => {
    const mockHistoryForm = {
      controls: {
        familyHistory: { value: { familyDiseaseList: [] } },
        physicalActivityHistory: { value: { activityType: 'moderate' } },
        personalHistory: {
          value: {
            tobaccoList: [],
            alcoholList: [],
            allergicList: [],
          },
        },
      },
    };

    it('should POST for NCD screening', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'NCD screening';
        return mockSessionStore[key] || null;
      });
      service.updateNCDScreeningHistory(mockHistoryForm, {}, 30).subscribe();
      const req = httpMock.expectOne(
        environment.updateNCDScreeningHistoryDetailsUrl
      );
      req.flush({ statusCode: 200 });
    });

    it('should complete for non-NCD screening', done => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'visitCategory') return 'General OPD';
        return mockSessionStore[key] || null;
      });
      service.updateNCDScreeningHistory(mockHistoryForm, {}, 30).subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('updatePhyscialActivityHistory', () => {
    it('should merge form value and otherDetails', () => {
      const form = { value: { activityType: 'moderate' } };
      const result = service.updatePhyscialActivityHistory(form, {
        modifiedBy: 'test',
      });
      expect(result.activityType).toBe('moderate');
      expect(result.modifiedBy).toBe('test');
    });
  });

  describe('saveSpecialistCancerObservation', () => {
    it('should POST specialist cancer observation', () => {
      const specialistForm = {
        controls: {
          patientCaseRecordForm: { value: { diagnosis: 'test' } },
          patientReferForm: { value: { remarks: 'note' } },
        },
      };
      service
        .saveSpecialistCancerObservation(
          specialistForm,
          { benRegID: '1' },
          true
        )
        .subscribe();
      const req = httpMock.expectOne(
        environment.saveSpecialistCancerObservationUrl
      );
      expect(req.request.body.diagnosis).toBeDefined();
      expect(req.request.body.diagnosis.doctorSignatureFlag).toBeTrue();
      req.flush({ statusCode: 200 });
    });
  });

  describe('postGenericVisitDetailForm', () => {
    it('should handle NCD screening', () => {
      const patientVisitForm = {
        controls: {
          patientVisitDetailsForm: { value: { visitNo: 1 } },
          patientFileUploadDetailsForm: { value: {} },
        },
      };
      const result: any = service.postGenericVisitDetailForm(
        patientVisitForm,
        null,
        'NCD screening'
      );
      expect(result.visitDetails).toBeDefined();
    });

    it('should complete for unknown category', done => {
      const patientVisitForm = { controls: {} };
      const result = service.postGenericVisitDetailForm(
        patientVisitForm,
        null,
        'Unknown'
      );
      result.subscribe({
        next: () => fail('should not emit'),
        complete: () => done(),
      });
    });
  });

  describe('postPatientVisitDetails', () => {
    it('should merge visit and files with session data', () => {
      const result = service.postPatientVisitDetails(
        { visitNo: 1 },
        { fileIDs: [] }
      );
      expect(result.visitNo).toBe(1);
      expect(result.beneficiaryRegID).toBe('9876');
      expect(result.providerServiceMapID).toBe('1234');
      expect(result.createdBy).toBe('testUser');
    });
  });

  describe('additional coverage', () => {
    const withCategory = (cat: string) =>
      sessionStorageSpy.getItem.and.callFake((key: string) =>
        key === 'visitCategory' ? cat : mockSessionStore[key] || null
      );

    beforeEach(() => spyOn(console, 'log'));

    const medicalForm = (diagnosis: any = { provisionalDiagnosis: 'x' }) =>
      new FormGroup({
        patientCaseRecordForm: new FormGroup({
          generalFindingsForm: new FormGroup({
            complaints: new FormControl([
              {
                chiefComplaint: {
                  chiefComplaintID: 4,
                  chiefComplaint: 'Fever',
                },
                duration: 3,
              },
              { chiefComplaint: null, duration: 1 },
            ]),
          }),
          generalDoctorInvestigationForm: new FormGroup({
            labTest: new FormControl([
              { procedureID: 1 },
              { procedureID: 2, disabled: true },
            ]),
            radiologyTest: new FormControl([{ procedureID: 3 }]),
          }),
          drugPrescriptionForm: new FormGroup({
            prescribedDrugs: new FormControl([
              { drugID: 1, createdBy: 'doc' },
              { drugID: 2 },
            ]),
          }),
          generalDiagnosisForm: new FormGroup({
            ...Object.keys(diagnosis).reduce(
              (acc: any, k) => ({ ...acc, [k]: new FormControl(diagnosis[k]) }),
              {}
            ),
          }),
        }),
        patientReferForm: new FormGroup({
          referredToInstituteName: new FormControl({
            institutionID: 8,
            institutionName: 'PHC',
          }),
          refrredToAdditionalServiceList: new FormControl([
            { serviceID: 1 },
            { serviceID: 2, disabled: true },
          ]),
          revisitDate: new FormControl('2024-01-01'),
          referralReason: new FormControl('reason'),
        }),
        patientVisitForm: new FormGroup({
          patientVisitDetailsForm: new FormControl({ visitReason: 'R' }),
          patientFileUploadDetailsForm: new FormControl({ fileIDs: [1] }),
        }),
      });

    const checkCommon = (body: any) => {
      expect(body.findings.complaints).toEqual([
        { chiefComplaint: 'Fever', chiefComplaintID: 4, duration: '3' },
      ]);
      expect(body.investigation.laboratoryList).toEqual([
        { procedureID: 1 },
        { procedureID: 3 },
      ]);
      expect(body.prescription).toEqual([{ drugID: 1, createdBy: 'doc' }]);
      expect(body.refer.referredToInstituteID).toBe(8);
      expect(body.refer.referredToInstituteName).toBe('PHC');
      expect(body.refer.refrredToAdditionalServiceList).toEqual([
        { serviceID: 1 },
      ]);
      expect(body.refer.revisitDate).toBe('2024-01-01');
      expect(body.refer.referralReason).toBe('reason');
      expect(body.vanID).toBe(10);
      expect(body.parkingPlaceID).toBe(20);
      expect(body.beneficiaryRegID).toBe('9876');
    };

    it('postDoctorCancerVisitDetails merges case record, refer and session details', () => {
      const form = {
        controls: {
          patientCaseRecordForm: { value: { remarks: 'r' } },
          patientReferForm: { value: { referralReason: 'x' } },
        },
      };
      service.postDoctorCancerVisitDetails(form, { tc: 1 }, true).subscribe();
      const req = httpMock.expectOne(
        environment.saveDoctorCancerScreeningDetails
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.tcRequest).toEqual({ tc: 1 });
      expect(req.request.body.doctorSignatureFlag).toBeTrue();
      expect(req.request.body.diagnosis.remarks).toBe('r');
      expect(req.request.body.diagnosis.referralReason).toBe('x');
      expect(req.request.body.diagnosis.vanID).toBe(10);
      expect(req.request.body.diagnosis.beneficiaryRegID).toBe('9876');
      req.flush({});
    });

    describe('updateCancerExaminationDetails', () => {
      const exam = (
        dirty: boolean,
        lesions: any = ['A', 'Any other lesion']
      ) => {
        const g = (value: any) => ({ dirty, value });
        return {
          controls: {
            signsForm: new FormGroup({
              shortnessOfBreath: new FormControl(true),
              lymphNodes: new FormArray([
                new FormGroup({ lymphNodeName: new FormControl('Neck') }),
              ]),
            }),
            oralExaminationForm: g({
              preMalignantLesionTypeList: lesions,
              otherLesionType: 'Custom',
              image: 'img',
            }),
            breastExaminationForm: g({ lump: true, image: 'i' }),
            abdominalExaminationForm: g({ liver: 'ok', image: 'i' }),
            gynecologicalExaminationForm: g({ cervix: 'ok', image: 'i' }),
          },
        };
      };

      it('builds every dirty section and image coordinates', () => {
        const form: any = exam(true);
        form.controls.signsForm.markAsDirty();
        service
          .updateCancerExaminationDetails(form, { visitCode: 'V' }, [{ x: 1 }])
          .subscribe();
        const req = httpMock.expectOne(
          environment.updateCancerScreeningExamination
        );
        const b = req.request.body;
        expect(
          b.signsDetails.cancerSignAndSymptoms.shortnessOfBreath
        ).toBeTrue();
        expect(b.signsDetails.cancerLymphNodeDetails[0]).toEqual({
          lymphNodeName: 'Neck',
          visitCode: 'V',
          createdBy: 'testUser',
        });
        expect(b.oralDetails.preMalignantLesionTypeList).toEqual([
          'A',
          'Custom',
        ]);
        expect(b.oralDetails.image).toBeUndefined();
        expect(b.breastDetails.lump).toBeTrue();
        expect(b.abdominalDetails.liver).toBe('ok');
        expect(b.gynecologicalDetails.cervix).toBe('ok');
        expect(b.imageCoordinates).toEqual([{ x: 1 }]);
        expect(b.vanID).toBe(10);
        req.flush({});
      });

      it('keeps lesion list when "Any other lesion" is not last and skips clean sections', () => {
        const form: any = exam(true, ['Any other lesion', 'B']);
        service.updateCancerExaminationDetails(form, {}, []).subscribe();
        const req = httpMock.expectOne(
          environment.updateCancerScreeningExamination
        );
        expect(req.request.body.signsDetails).toBeUndefined();
        expect(req.request.body.oralDetails.preMalignantLesionTypeList).toEqual(
          ['Any other lesion', 'B']
        );
        expect(req.request.body.imageCoordinates).toBeUndefined();
        req.flush({});
      });

      it('posts nothing-but-null when no section is dirty', () => {
        service
          .updateCancerExaminationDetails(exam(false, null), {}, [])
          .subscribe();
        const req = httpMock.expectOne(
          environment.updateCancerScreeningExamination
        );
        expect(req.request.body).toBeNull();
        req.flush({});
      });

      it('handles a null lesion list on a dirty oral form', () => {
        service
          .updateCancerExaminationDetails(exam(true, null), {}, [])
          .subscribe();
        const req = httpMock.expectOne(
          environment.updateCancerScreeningExamination
        );
        expect(
          req.request.body.oralDetails.preMalignantLesionTypeList
        ).toBeNull();
        req.flush({});
      });
    });

    it('updateCancerVitalsDetails merges vitals, disabled values and session data', () => {
      service
        .updateCancerVitalsDetails({ weight: 50 }, { height: 160 })
        .subscribe();
      const req = httpMock.expectOne(environment.updateCancerScreeningVitals);
      expect(req.request.body).toEqual(
        jasmine.objectContaining({
          weight: 50,
          height: 160,
          beneficiaryRegID: '9876',
          modifiedBy: 'testUser',
          vanID: 10,
          parkingPlaceID: 20,
          visitCode: 'VC001',
        })
      );
      req.flush({});
    });

    it('updateCancerHistoryDetails maps family, personal and obstetric history', () => {
      const form = {
        controls: {
          cancerPatientFamilyMedicalHistoryForm: {
            dirty: true,
            value: {
              diseases: [
                { cancerDiseaseType: { cancerDiseaseType: 'Breast' } },
                {
                  cancerDiseaseType: { cancerDiseaseType: 'Any other Cancer' },
                  otherDiseaseType: 'Rare',
                },
              ],
            },
          },
          cancerPatientPerosnalHistoryForm: {
            dirty: true,
            value: { smoke: 1 },
          },
          cancerPatientObstetricHistoryForm: { dirty: false, value: {} },
        },
      };
      service.updateCancerHistoryDetails(form, { visitCode: 'V' }).subscribe();
      const req = httpMock.expectOne(environment.updateCancerScreeningHistory);
      expect(req.request.body.familyHistory).toEqual([
        { cancerDiseaseType: 'Breast', visitCode: 'V' },
        { cancerDiseaseType: 'Rare', otherDiseaseType: 'Rare', visitCode: 'V' },
      ]);
      expect(req.request.body.personalHistory).toEqual({
        smoke: 1,
        visitCode: 'V',
      });
      expect(req.request.body.pastObstetricHistory).toBeUndefined();
      req.flush({});
    });

    it('postQuickConsultDetails posts quick consultation with session data', () => {
      service
        .postQuickConsultDetails(
          { quickConsultation: { a: 1 } },
          { t: 1 },
          false
        )
        .subscribe();
      const req = httpMock.expectOne(environment.saveDoctorGeneralQuickConsult);
      const qc = req.request.body.quickConsultation;
      expect(qc.a).toBe(1);
      expect(qc.tcRequest).toEqual({ t: 1 });
      expect(qc.doctorSignatureFlag).toBeFalse();
      expect(qc.vanID).toBe(10);
      expect(qc.createdBy).toBe('testUser');
      req.flush({});
    });

    it('updateQuickConsultDetails posts quick consultation with specialist flag', () => {
      service
        .updateQuickConsultDetails(
          { quickConsultation: { a: 2 } },
          null,
          true,
          true
        )
        .subscribe();
      const req = httpMock.expectOne(
        environment.updateGeneralOPDQuickConsultDoctorDetails
      );
      const qc = req.request.body.quickConsultation;
      expect(qc.a).toBe(2);
      expect(qc.isSpecialist).toBeTrue();
      expect(qc.doctorSignatureFlag).toBeTrue();
      expect(qc.parkingPlaceID).toBe(20);
      req.flush({});
    });

    it('updateNCDScreeningDetails flattens masters and computes prescribed tests', () => {
      service
        .updateNCDScreeningDetails(
          {
            reasonForScreening: {
              ncdScreeningReasonID: 1,
              ncdScreeningReason: 'Camp',
            },
            diabeticStatus: {
              bpAndDiabeticStatusID: 2,
              bpAndDiabeticStatus: 'Known',
            },
            bloodPressureStatus: {
              bpAndDiabeticStatusID: 3,
              bpAndDiabeticStatus: 'New',
            },
            labTestOrders: [
              { procedureName: 'BP Measurement' },
              { procedureName: 'Blood Glucose Measurement' },
            ],
          },
          { patientFileUploadDetailsForm: { fileIDs: [9] } }
        )
        .subscribe();
      const req = httpMock.expectOne(environment.updateNCDScreeningDetails);
      const b = req.request.body;
      expect(b.ncdScreeningReasonID).toBe(1);
      expect(b.reasonForScreening).toBe('Camp');
      expect(b.diabeticStatusID).toBe(2);
      expect(b.diabeticStatus).toBe('Known');
      expect(b.bloodPressureStatusID).toBe(3);
      expect(b.bloodPressureStatus).toBe('New');
      expect(b.isBPPrescribed).toBeTrue();
      expect(b.isBloodGlucosePrescribed).toBeTrue();
      expect(b.fileIDs).toEqual([9]);
      expect(b.benFlowID).toBe('222');
      req.flush({});
    });

    it('updateNCDScreeningDetails leaves fields alone when masters are absent', () => {
      service
        .updateNCDScreeningDetails(
          { labTestOrders: [{ procedureName: 'X' }] },
          {}
        )
        .subscribe();
      const req = httpMock.expectOne(environment.updateNCDScreeningDetails);
      expect(req.request.body.isBPPrescribed).toBeFalse();
      expect(req.request.body.isBloodGlucosePrescribed).toBeFalse();
      expect(req.request.body.ncdScreeningReasonID).toBeUndefined();
      req.flush({});
    });

    it('postDoctorANCDetails builds the full ANC payload and drops null dateOfDeath', () => {
      service
        .postDoctorANCDetails(
          medicalForm({ provisionalDiagnosis: 'p', dateOfDeath: null }),
          { createdBy: 'doc' },
          { tc: 1 },
          true
        )
        .subscribe();
      const req = httpMock.expectOne(environment.saveDoctorANCDetails);
      checkCommon(req.request.body);
      expect(req.request.body.diagnosis.provisionalDiagnosis).toBe('p');
      expect('dateOfDeath' in req.request.body.diagnosis).toBeFalse();
      expect(req.request.body.tcRequest).toEqual({ tc: 1 });
      req.flush({});
    });

    it('postDoctorGeneralOPDDetails builds the General OPD payload', () => {
      service
        .postDoctorGeneralOPDDetails(
          medicalForm(),
          { createdBy: 'doc' },
          null,
          false
        )
        .subscribe();
      const req = httpMock.expectOne(environment.saveDoctorGeneralOPDDetails);
      checkCommon(req.request.body);
      expect(req.request.body.doctorSignatureFlag).toBeFalse();
      req.flush({});
    });

    it('postDoctorNCDCareDetails flattens ncdCareType', () => {
      service
        .postDoctorNCDCareDetails(
          medicalForm({ ncdCareType: { ncdCareTypeID: 5, ncdCareType: 'DM' } }),
          {},
          null,
          true
        )
        .subscribe();
      const req = httpMock.expectOne(environment.saveDoctorNCDCareDetails);
      checkCommon(req.request.body);
      expect(req.request.body.diagnosis.ncdCareTypeID).toBe(5);
      expect(req.request.body.diagnosis.ncdCareType).toBe('DM');
      req.flush({});
    });

    it('postDoctorCovidCareDetails builds the covid payload', () => {
      service
        .postDoctorCovidCareDetails(medicalForm(), {}, { tc: 2 })
        .subscribe();
      const req = httpMock.expectOne(environment.saveDoctorCovidCareDetails);
      checkCommon(req.request.body);
      expect(req.request.body.tcRequest).toEqual({ tc: 2 });
      req.flush({});
    });

    it('postDoctorNCDScreeningDetails includes visit details for NCD screening', () => {
      withCategory('NCD screening');
      service
        .postDoctorNCDScreeningDetails(medicalForm(), {}, null, true)
        .subscribe();
      const req = httpMock.expectOne(environment.saveDoctorNCDScreeningDetails);
      checkCommon(req.request.body);
      expect(req.request.body.visitDetails.visitDetails.visitReason).toBe('R');
      expect(req.request.body.visitDetails.visitDetails.fileIDs).toEqual([1]);
      req.flush({});
    });

    it('postDoctorPNCDetails builds the PNC payload', () => {
      service
        .postDoctorPNCDetails(
          medicalForm({ dateOfDeath: '2024' }),
          {},
          null,
          true
        )
        .subscribe();
      const req = httpMock.expectOne(environment.savePNCDoctorDetailsUrl);
      checkCommon(req.request.body);
      expect(req.request.body.diagnosis.dateOfDeath).toBe('2024');
      req.flush({});
    });

    describe('updateDoctorDiagnosisDetails routes by visit category', () => {
      const cases: [string, string][] = [
        ['ANC', 'updateANCDoctorDetails'],
        ['General OPD', 'updateGeneralOPDDoctorDetails'],
        ['NCD care', 'updateNCDCareDoctorDetails'],
        ['PNC', 'updatePNCDoctorDetails'],
        ['COVID-19 Screening', 'updateCovidDoctorDetails'],
        ['NCD screening', 'updateNCDScreeningDoctorDetails'],
      ];
      cases.forEach(([cat, key]) => {
        it(`posts to ${key} for ${cat}`, () => {
          service
            .updateDoctorDiagnosisDetails(
              medicalForm({ provisionalDiagnosis: cat }),
              cat,
              { isSpecialist: true },
              null,
              false
            )
            .subscribe();
          const req = httpMock.expectOne((environment as any)[key]);
          checkCommon(req.request.body);
          expect(req.request.body.diagnosis.provisionalDiagnosis).toBe(cat);
          expect(req.request.body.isSpecialist).toBeTrue();
          req.flush({});
        });
      });

      it('completes without a request for unknown category', done => {
        service
          .updateDoctorDiagnosisDetails(medicalForm(), 'Other', {}, null, false)
          .subscribe({
            next: () => fail('should not emit'),
            complete: () => {
              httpMock.expectNone(() => true);
              done();
            },
          });
      });
    });

    describe('updatePatientExamination', () => {
      const exam = {
        generalExaminationForm: { a: 1 },
        headToToeExaminationForm: { b: 1 },
        systemicExaminationForm: {
          gastroIntestinalSystemForm: { g: 1 },
          cardioVascularSystemForm: { c: 1 },
          respiratorySystemForm: { r: 1 },
          centralNervousSystemForm: { n: 1 },
          musculoSkeletalSystemForm: { m: 1 },
          genitoUrinarySystemForm: { u: 1 },
          obstetricExaminationForANCForm: { o: 1 },
        },
      };
      const cases: [string, string][] = [
        ['ANC', 'updateANCExaminationDetailsUrl'],
        ['PNC', 'updatePNCExaminationDetailsUrl'],
        ['General OPD', 'updateGeneralOPDExaminationDetailsUrl'],
      ];
      cases.forEach(([cat, key]) => {
        it(`posts ${cat} examination`, () => {
          service
            .updatePatientExamination(exam, cat, { modifiedBy: 'u' })
            .subscribe();
          const req = httpMock.expectOne((environment as any)[key]);
          const b = req.request.body;
          expect(b.generalExamination).toEqual({ a: 1, modifiedBy: 'u' });
          expect(b.cardioVascularExamination).toEqual({
            c: 1,
            modifiedBy: 'u',
          });
          expect(b.genitoUrinarySystemExamination).toEqual({
            u: 1,
            modifiedBy: 'u',
          });
          expect(b.vanID).toBe(10);
          if (cat === 'ANC') {
            expect(b.obstetricExamination).toEqual({ o: 1, modifiedBy: 'u' });
          } else {
            expect(b.gastroIntestinalExamination).toEqual({
              g: 1,
              modifiedBy: 'u',
            });
          }
          req.flush({});
        });
      });

      it('completes for other categories', done => {
        service.updatePatientExamination(exam, 'NCD care', {}).subscribe({
          next: () => fail('should not emit'),
          complete: () => done(),
        });
      });
    });

    describe('cached getters for remaining categories', () => {
      const complaint: [string, string][] = [
        ['General OPD', 'getGeneralOPDVisitDetailsUrl'],
        ['NCD screening', 'getNCDScreeningVisitDetails'],
        ['NCD care', 'getNCDCareVisitDetailsUrl'],
        ['COVID-19 Screening', 'getCovidCareVisitDetailsUrl'],
      ];
      complaint.forEach(([cat, key]) => {
        it(`getVisitComplaintDetails uses ${key} for ${cat}`, () => {
          withCategory(cat);
          service.getVisitComplaint = null;
          service.getVisitComplaintDetails('B', 'V').subscribe();
          const req = httpMock.expectOne((environment as any)[key]);
          expect(req.request.body).toEqual({
            benRegID: 'B',
            benVisitID: 'V',
            visitCode: 'VC001',
          });
          req.flush({});
        });
      });

      const history: [string, string][] = [
        ['NCD care', 'getNCDCareHistoryDetailsUrl'],
        ['PNC', 'getPNCHistoryDetailsUrl'],
        ['COVID-19 Screening', 'getCovidCareHistoryDetailsUrl'],
        ['NCD screening', 'getNCDScreeningHistoryDetails'],
        ['ANC', 'getANCHistoryDetailsUrl'],
        ['General OPD', 'getGeneralOPDHistoryDetailsUrl'],
      ];
      history.forEach(([cat, key]) => {
        it(`getGeneralHistoryDetails uses ${key} for ${cat}`, () => {
          withCategory(cat);
          service.generalHistory = null;
          service.getGeneralHistoryDetails('B', 'V').subscribe();
          httpMock.expectOne((environment as any)[key]).flush({});
        });
      });

      const vitals: [string, string][] = [
        ['General OPD', 'getGeneralOPDVitalDetailsUrl'],
        ['NCD care', 'getNCDCareVitalDetailsUrl'],
        ['PNC', 'getPNCVitalsDetailsUrl'],
        ['COVID-19 Screening', 'getCovidCareVitalDetailsUrl'],
        ['NCD screening', 'getNCDSceeriningVitalDetails'],
      ];
      vitals.forEach(([cat, key]) => {
        it(`getGenericVitals uses ${key} for ${cat}`, () => {
          withCategory(cat);
          service.getGenericVitals({ benRegID: 'B' }).subscribe();
          const req = httpMock.expectOne((environment as any)[key]);
          expect(req.request.body).toEqual({
            benRegID: 'B',
            visitCode: 'VC001',
          });
          req.flush({});
        });
      });

      const caseRecord: [string, string][] = [
        ['General OPD', 'getGeneralOPDDoctorDetails'],
        ['NCD screening', 'getNCDScreeningDoctorDetails'],
        ['NCD care', 'getNCDCareDoctorDetails'],
        ['PNC', 'getPNCDoctorDetails'],
        ['COVID-19 Screening', 'getCovidDoctorDetails'],
      ];
      caseRecord.forEach(([cat, key]) => {
        it(`getCaseRecordAndReferDetails uses ${key} for ${cat}`, () => {
          service.caseRecordAndReferDetails = null;
          service.getCaseRecordAndReferDetails('B', 'V', cat).subscribe();
          httpMock.expectOne((environment as any)[key]).flush({});
        });
      });
    });

    describe('history mapping helpers with populated lists', () => {
      it('updateGeneralPastHistory maps illness and surgery types', () => {
        const res = service.updateGeneralPastHistory(
          {
            value: {
              pastIllness: [
                {
                  illnessType: { illnessType: 'TB', illnessID: 3 },
                  timePeriodAgo: 2,
                },
                {
                  illnessType: { illnessType: 'X', illnessID: 4 },
                  timePeriodAgo: null,
                },
                { illnessType: null },
              ],
              pastSurgery: [
                {
                  surgeryType: { surgeryType: 'Appendix', surgeryID: 7 },
                  timePeriodAgo: 1,
                },
                { surgeryType: { surgeryType: 'Y', surgeryID: 8 } },
                { surgeryType: null },
              ],
            },
          },
          { o: 1 }
        );
        expect(res.pastIllness[0]).toEqual({
          illnessType: 'TB',
          illnessTypeID: '3',
          timePeriodAgo: '2',
        });
        expect(res.pastIllness[1].timePeriodAgo).toBeNull();
        expect(res.pastSurgery[0]).toEqual({
          surgeryType: 'Appendix',
          surgeryID: '7',
          timePeriodAgo: '1',
        });
        expect(res.pastSurgery[1].timePeriodAgo).toBeNull();
        expect(res.o).toBe(1);
      });

      it('updateGeneralComorbidityHistory maps conditions', () => {
        const res = service.updateGeneralComorbidityHistory(
          {
            value: {
              comorbidityConcurrentConditionsList: [
                {
                  comorbidConditions: {
                    comorbidCondition: 'DM',
                    comorbidConditionID: 2,
                  },
                },
                { comorbidConditions: { comorbidCondition: 'Other' } },
              ],
            },
          },
          { o: 1 }
        );
        expect(res.o).toBe(1);
        expect(res.comorbidityConcurrentConditionsList[0]).toEqual({
          comorbidConditions: undefined,
          comorbidCondition: 'DM',
          comorbidConditionID: '2',
        });
        expect(
          res.comorbidityConcurrentConditionsList[1].comorbidConditionID
        ).toBeUndefined();
      });

      it('updateGeneralPersonalHistory maps tobacco, alcohol and allergies', () => {
        const res = service.updateGeneralPersonalHistory(
          {
            value: {
              riskySexualPracticesStatus: '1',
              tobaccoList: [
                {
                  tobaccoUseType: {
                    personalHabitTypeID: 1,
                    habitValue: 'Beedi',
                  },
                },
                { tobaccoUseType: null },
              ],
              alcoholList: [
                {
                  typeOfAlcohol: { personalHabitTypeID: 2, habitValue: 'Beer' },
                  avgAlcoholConsumption: { habitValue: '1-2' },
                },
                {},
              ],
              allergicList: [
                {
                  allergyType: { allergyType: 'Food' },
                  typeOfAllergicReactions: [{ allergicReactionTypeID: 5 }],
                },
                {},
              ],
            },
          },
          { o: 1 }
        );
        expect(res.riskySexualPracticesStatus).toBe(1);
        expect(res.tobaccoList[0]).toEqual({
          tobaccoUseTypeID: 1,
          tobaccoUseType: 'Beedi',
        });
        expect(res.alcoholList[0]).toEqual({
          alcoholTypeID: 2,
          typeOfAlcohol: 'Beer',
          avgAlcoholConsumption: '1-2',
        });
        expect(res.allergicList[0].allergyType).toBe('Food');
        expect(
          res.allergicList[0].typeOfAllergicReactions[0].allergicReactionTypeID
        ).toBe('5');
      });

      it('updateGeneralPersonalHistory handles missing lists and status', () => {
        const res = service.updateGeneralPersonalHistory({ value: {} }, {});
        expect(res.riskySexualPracticesStatus).toBeNull();
        expect(res.tobaccoList).toBeUndefined();
      });

      it('updateGeneralFamilyHistory maps disease types', () => {
        const res = service.updateGeneralFamilyHistory(
          {
            value: {
              familyDiseaseList: [
                { diseaseType: { diseaseTypeID: 3, diseaseType: 'DM' } },
                { diseaseType: null },
              ],
            },
          },
          { o: 1 }
        );
        expect(res.familyDiseaseList[0]).toEqual({
          diseaseTypeID: '3',
          diseaseType: 'DM',
        });
        expect(res.o).toBe(1);
      });

      it('updateGeneralMenstrualHistory maps masters and adjusts LMP date', () => {
        const res = service.updateGeneralMenstrualHistory(
          {
            getRawValue: () => ({
              menstrualCycleStatus: {
                menstrualCycleStatusID: 1,
                name: 'Regular',
              },
              cycleLength: { menstrualRangeID: 2, menstrualCycleRange: '28' },
              bloodFlowDuration: {
                menstrualRangeID: 3,
                menstrualCycleRange: '5',
              },
              lMPDate: '2024-01-10T00:00:00.000Z',
            }),
          },
          { o: 1 }
        );
        expect(res.menstrualCycleStatusID).toBe('1');
        expect(res.menstrualCycleStatus).toBe('Regular');
        expect(res.menstrualCyclelengthID).toBe('2');
        expect(res.cycleLength).toBe('28');
        expect(res.menstrualFlowDurationID).toBe('3');
        expect(res.bloodFlowDuration).toBe('5');
        expect(typeof res.lMPDate).toBe('string');
        expect(res.o).toBe(1);
      });

      it('updateGeneralMenstrualHistory drops invalid LMP date', () => {
        const res = service.updateGeneralMenstrualHistory(
          { getRawValue: () => ({ lMPDate: 'Invalid Date' }) },
          {}
        );
        expect('lMPDate' in res).toBeFalse();
      });

      it('updateGeneralPastObstetricHistory maps every master', () => {
        const res = service.updateGeneralPastObstetricHistory(
          {
            value: {
              pastObstericHistoryList: [
                {
                  durationType: { pregDurationID: 1, durationType: 'Term' },
                  deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
                  deliveryPlace: { deliveryPlaceID: 3, deliveryPlace: 'Home' },
                  pregOutcome: { pregOutcomeID: 4, pregOutcome: 'Live' },
                  newBornComplication: {
                    complicationID: 5,
                    complicationValue: 'None',
                  },
                },
                {},
              ],
            },
          },
          { o: 1 }
        );
        expect(res.pastObstericHistoryList).toBeUndefined();
        expect(res.femaleObstetricHistoryList[0]).toEqual({
          pregDurationID: 1,
          durationType: 'Term',
          deliveryTypeID: 2,
          deliveryType: 'Normal',
          deliveryPlaceID: 3,
          deliveryPlace: 'Home',
          pregOutcomeID: 4,
          pregOutcome: 'Live',
          newBornComplicationID: 5,
          newBornComplication: 'None',
        });
      });
    });

    it('updatePNCDetails maps every PNC master field', () => {
      service
        .updatePNCDetails(
          {
            value: {
              deliveryPlace: { deliveryPlaceID: 1, deliveryPlace: 'Home' },
              deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
              deliveryComplication: {
                complicationID: 3,
                deliveryComplicationType: 'PPH',
              },
              pregOutcome: { pregOutcomeID: 4, pregOutcome: 'Live' },
              postNatalComplication: {
                complicationID: 5,
                complicationValue: 'Fever',
              },
              gestationName: { gestationID: 6, name: 'Term' },
              newBornHealthStatus: {
                newBornHealthStatusID: 7,
                newBornHealthStatus: 'Good',
              },
            },
          },
          { o: 1 }
        )
        .subscribe();
      const req = httpMock.expectOne(environment.updatePNCDetailsUrl);
      expect(req.request.body.PNCDetails).toEqual({
        deliveryPlaceID: 1,
        deliveryPlace: 'Home',
        deliveryTypeID: 2,
        deliveryType: 'Normal',
        deliveryComplicationID: 3,
        deliveryComplication: 'PPH',
        pregOutcomeID: 4,
        pregOutcome: 'Live',
        postNatalComplicationID: 5,
        postNatalComplication: 'Fever',
        gestationID: 6,
        gestationName: 'Term',
        newBornHealthStatusID: 7,
        newBornHealthStatus: 'Good',
        o: 1,
      });
      req.flush({});
    });

    it('postGeneralCaseRecordDiagnosis handles COVID and NCD screening categories', () => {
      const form = { value: { d: 1 } };
      expect(
        service.postGeneralCaseRecordDiagnosis(form, 'COVID-19 Screening', {
          o: 1,
        })
      ).toEqual({ d: 1, o: 1 });
      expect(
        service.postGeneralCaseRecordDiagnosis(form, 'NCD screening', { o: 2 })
      ).toEqual({ d: 1, o: 2 });
      expect(
        service.postGeneralCaseRecordDiagnosis(form, 'Other', {})
      ).toBeUndefined();
    });

    it('saveSpecialistCancerObservation removes referredToInstituteName', () => {
      const form = {
        controls: {
          patientCaseRecordForm: { value: { obs: 'o' } },
          patientReferForm: {
            value: { referredToInstituteName: 'X', reason: 'r' },
          },
        },
      };
      service.saveSpecialistCancerObservation(form, { u: 1 }, true).subscribe();
      const req = httpMock.expectOne(
        environment.saveSpecialistCancerObservationUrl
      );
      expect(req.request.body.diagnosis).toEqual({
        reason: 'r',
        obs: 'o',
        u: 1,
        doctorSignatureFlag: true,
      });
      req.flush({});
    });

    describe('postTMReferedNurseDetails', () => {
      const tmForm = (value: any) => ({
        controls: {
          patientVisitForm: new FormGroup({
            tmcConfirmationForm: new FormControl(value),
          }),
        },
      });

      it('builds refer details from selected institution and uses prescribed drugs', () => {
        service.prescribedDrugData = [{ drugID: 1 }];
        service
          .postTMReferedNurseDetails(
            tmForm({
              tmcConfirmed: true,
              refrredToAdditionalServiceList: {
                institutionID: 4,
                institutionName: 'DH',
              },
            }),
            { createdBy: 'n' },
            null
          )
          .subscribe();
        const req = httpMock.expectOne(environment.postNCDScreeningDetails);
        const b = req.request.body;
        expect(b.prescription).toEqual([{ drugID: 1 }]);
        expect(b.isTMCDone).toBeTrue();
        expect(b.doctorFlag).toBe('1');
        expect(b.nurseFlag).toBe('2');
        expect(b.pharmacist_flag).toBe(0);
        expect(b.benVisitID).toBe('111');
        expect(b.refer).toEqual(
          jasmine.objectContaining({
            referredToInstituteID: 4,
            referredToInstituteName: 'DH',
            vanID: 10,
            parkingPlaceID: 20,
            beneficiaryID: '333',
            benFlowID: '222',
            benVisitID: '111',
            createdBy: 'n',
            isSpecialist: false,
          })
        );
        req.flush({});
      });

      it('sends null prescription and minimal refer when nothing selected', () => {
        service.prescribedDrugData = null;
        sessionStorageSpy.getItem.and.callFake((key: string) =>
          key === 'beneficiaryData'
            ? JSON.stringify({
                doctorFlag: 1,
                nurseFlag: 1,
                pharmacist_flag: 1,
                benVisitID: 5,
              })
            : mockSessionStore[key] || null
        );
        service
          .postTMReferedNurseDetails(tmForm({ tmcConfirmed: false }), {}, null)
          .subscribe();
        const req = httpMock.expectOne(environment.postNCDScreeningDetails);
        expect(req.request.body.prescription).toBeNull();
        expect(req.request.body.pharmacist_flag).toBe(1);
        expect(req.request.body.refer).toEqual({ benVisitID: '5' });
        req.flush({});
      });
    });
  });
});
