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
import { MasterdataService } from './masterdata.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('MasterdataService', () => {
  let service: MasterdataService;
  let httpMock: HttpTestingController;
  let sessionStorageSpy: jasmine.SpyObj<SessionStorageService>;

  beforeEach(() => {
    sessionStorageSpy = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MasterdataService,
        { provide: SessionStorageService, useValue: sessionStorageSpy },
      ],
    });

    service = TestBed.inject(MasterdataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('URL properties', () => {
    it('should initialize URL properties from environment', () => {
      expect(service.visitDetailMasterDataUrl).toBe(
        environment.visitDetailMasterDataUrl
      );
      expect(service.nurseMasterDataUrl).toBe(environment.nurseMasterDataUrl);
      expect(service.doctorMasterDataUrl).toBe(environment.doctorMasterDataUrl);
      expect(service.snoMedDataURL).toBe(environment.snomedCTRecordURL);
      expect(service.diagnosisSnomedCTRecordUrl).toBe(
        environment.diagnosisSnomedCTRecordUrl
      );
      expect(service.diagnosisSnomedCTRecordUrl1).toBe(
        environment.diagnosisSnomedCTRecordUrl1
      );
      expect(service.vaccinationTypeAndDoseMasterUrl).toBe(
        environment.vaccinationTypeAndDoseMasterUrl
      );
      expect(service.previousCovidVaccinationUrl).toBe(
        environment.previousCovidVaccinationUrl
      );
      expect(service.getCalibrationStrips).toBe(
        environment.getCalibrationStrips
      );
    });
  });

  describe('BehaviorSubjects initial state', () => {
    it('should have null initial value for visitDetailMasterDataSource', done => {
      service.visitDetailMasterData$.subscribe(data => {
        expect(data).toBeNull();
        done();
      });
    });

    it('should have null initial value for nurseMasterDataSource', done => {
      service.nurseMasterData$.subscribe(data => {
        expect(data).toBeNull();
        done();
      });
    });

    it('should have null initial value for doctorMasterDataSource', done => {
      service.doctorMasterData$.subscribe(data => {
        expect(data).toBeNull();
        done();
      });
    });
  });

  describe('listen, filter, contactfilter', () => {
    it('listen should return an Observable', () => {
      const obs = service.listen();
      expect(obs.subscribe).toBeDefined();
    });

    it('filter should emit the filterBy value through listen', done => {
      service.listen().subscribe(value => {
        expect(value).toBe('testFilter');
        done();
      });
      service.filter('testFilter');
    });

    it('contactfilter should emit the filterBy value through listen', done => {
      service.listen().subscribe(value => {
        expect(value).toBe('contactValue');
        done();
      });
      service.contactfilter('contactValue');
    });
  });

  describe('getVisitDetailMasterData', () => {
    it('should make GET request and update visitDetailMasterDataSource', done => {
      const mockData = { visitCategories: ['ANC', 'PNC'] };

      service.getVisitDetailMasterData();

      const req = httpMock.expectOne(environment.visitDetailMasterDataUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockData });

      service.visitDetailMasterData$.subscribe(data => {
        expect(data).toEqual(mockData);
        done();
      });
    });
  });

  describe('getNurseMasterData', () => {
    it('should make GET request with visitID, providerServiceID, and gender and update nurseMasterDataSource', done => {
      const mockData = { nurseMaster: 'data' };
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'beneficiaryGender') return 'Male';
        return null;
      });

      service.getNurseMasterData('4', '10');

      const expectedUrl = environment.nurseMasterDataUrl + '4/10/Male';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockData });

      service.nurseMasterData$.subscribe(data => {
        expect(data).toEqual(mockData);
        done();
      });
    });
  });

  describe('getDoctorMasterData', () => {
    it('should make GET request with visitID, providerServiceID, gender, facilityID, and vanID and update doctorMasterDataSource', done => {
      const mockData = { doctorMaster: 'data' };
      const serviceLineDetails = JSON.stringify({
        facilityID: 5,
        vanID: 12,
      });
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return serviceLineDetails;
        if (key === 'beneficiaryGender') return 'Female';
        return null;
      });

      service.getDoctorMasterData('3', '20');

      const expectedUrl = environment.doctorMasterDataUrl + '3/20/Female/5/12';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockData });

      service.doctorMasterData$.subscribe(data => {
        expect(data).toEqual(mockData);
        done();
      });
    });

    it('should default facilityID and vanID to 0 when not present', done => {
      const mockData = { doctorMaster: 'default' };
      const serviceLineDetails = JSON.stringify({});
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return serviceLineDetails;
        if (key === 'beneficiaryGender') return 'Male';
        return null;
      });

      service.getDoctorMasterData('1', '5');

      const expectedUrl = environment.doctorMasterDataUrl + '1/5/Male/0/0';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockData });

      service.doctorMasterData$.subscribe(data => {
        expect(data).toEqual(mockData);
        done();
      });
    });
  });

  describe('getDoctorMasterDataForNurse', () => {
    it('should return an Observable and not subscribe internally', () => {
      const serviceLineDetails = JSON.stringify({
        facilityID: 2,
        vanID: 8,
      });
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return serviceLineDetails;
        if (key === 'beneficiaryGender') return 'Male';
        return null;
      });

      const result = service.getDoctorMasterDataForNurse('6', '15');
      expect(result.subscribe).toBeDefined();

      result.subscribe((res: any) => {
        expect(res).toEqual({ data: 'test' });
      });

      const expectedUrl = environment.doctorMasterDataUrl + '6/15/Male/2/8';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: 'test' });
    });
  });

  describe('getSnomedCTRecord', () => {
    it('should make POST request with term', () => {
      service.getSnomedCTRecord('fever').subscribe((res: any) => {
        expect(res).toEqual({ result: 'snomed' });
      });

      const req = httpMock.expectOne(environment.snomedCTRecordURL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ term: 'fever' });
      req.flush({ result: 'snomed' });
    });
  });

  describe('getReportsMaster', () => {
    it('should make GET request with serviceID from session', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'serviceID') return '100';
        return null;
      });

      service.getReportsMaster().subscribe((res: any) => {
        expect(res).toEqual({ reports: [] });
      });

      const req = httpMock.expectOne(environment.getReportsMasterUrl + '100');
      expect(req.request.method).toBe('GET');
      req.flush({ reports: [] });
    });
  });

  describe('getVanMaster', () => {
    it('should make GET request with providerServiceID from session', () => {
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'providerServiceID') return '50';
        return null;
      });

      service.getVanMaster().subscribe((res: any) => {
        expect(res).toEqual({ vans: [] });
      });

      const req = httpMock.expectOne(environment.getVanMasterUrl + '50');
      expect(req.request.method).toBe('GET');
      req.flush({ vans: [] });
    });
  });

  describe('getReportData', () => {
    it('should make POST request with report request payload', () => {
      const reportRequest = { reportType: 'daily', date: '2024-01-01' };

      service.getReportData(reportRequest).subscribe((res: any) => {
        expect(res).toEqual({ report: 'data' });
      });

      const req = httpMock.expectOne(environment.getReportDataUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reportRequest);
      req.flush({ report: 'data' });
    });
  });

  describe('searchDiagnosisBasedOnPageNo', () => {
    it('should make POST request with searchTerm and pageNo', () => {
      service
        .searchDiagnosisBasedOnPageNo('diabetes', 1)
        .subscribe((res: any) => {
          expect(res).toEqual({ results: [] });
        });

      const req = httpMock.expectOne(environment.diagnosisSnomedCTRecordUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ term: 'diabetes', pageNo: 1 });
      req.flush({ results: [] });
    });
  });

  describe('searchDiagnosisBasedOnPageNo1', () => {
    it('should make POST request with searchTerm and pageNo', () => {
      service
        .searchDiagnosisBasedOnPageNo1('asthma', 2)
        .subscribe((res: any) => {
          expect(res).toEqual({ results: ['asthma'] });
        });

      const req = httpMock.expectOne(environment.diagnosisSnomedCTRecordUrl1);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ term: 'asthma', pageNo: 2 });
      req.flush({ results: ['asthma'] });
    });
  });

  describe('fetchCalibrationStrips', () => {
    it('should make POST request with providerServiceMapID and pageNo', () => {
      service.fetchCalibrationStrips('25', 0).subscribe((res: any) => {
        expect(res).toEqual({ strips: [] });
      });

      const req = httpMock.expectOne(environment.getCalibrationStrips);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        providerServiceMapID: '25',
        pageNo: 0,
      });
      req.flush({ strips: [] });
    });
  });

  describe('getVaccinationTypeAndDoseMaster', () => {
    it('should make GET request', () => {
      service.getVaccinationTypeAndDoseMaster().subscribe((res: any) => {
        expect(res).toEqual({ types: [] });
      });

      const req = httpMock.expectOne(
        environment.vaccinationTypeAndDoseMasterUrl
      );
      expect(req.request.method).toBe('GET');
      req.flush({ types: [] });
    });
  });

  describe('getPreviousCovidVaccinationDetails', () => {
    it('should make POST request with beneficiaryRegID', () => {
      service
        .getPreviousCovidVaccinationDetails('12345')
        .subscribe((res: any) => {
          expect(res).toEqual({ vaccinations: [] });
        });

      const req = httpMock.expectOne(environment.previousCovidVaccinationUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ beneficiaryRegID: '12345' });
      req.flush({ vaccinations: [] });
    });
  });

  describe('reset', () => {
    it('should set all BehaviorSubjects to null', () => {
      service.visitDetailMasterDataSource.next({ some: 'data' });
      service.nurseMasterDataSource.next({ nurse: 'data' });
      service.doctorMasterDataSource.next({ doctor: 'data' });

      service.reset();

      service.visitDetailMasterData$.subscribe(data => {
        expect(data).toBeNull();
      });
      service.nurseMasterData$.subscribe(data => {
        expect(data).toBeNull();
      });
      service.doctorMasterData$.subscribe(data => {
        expect(data).toBeNull();
      });
    });
  });
});
