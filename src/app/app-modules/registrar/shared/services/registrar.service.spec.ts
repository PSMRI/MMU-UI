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
import { RegistrarService } from './registrar.service';
import { environment } from 'src/environments/environment';

describe('RegistrarService', () => {
  let service: RegistrarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegistrarService],
    });
    service = TestBed.inject(RegistrarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('BehaviorSubjects initial values', () => {
    it('should initialise registrationMasterDetails with null', done => {
      service.registrationMasterDetails$.subscribe(val => {
        expect(val).toBeNull();
        done();
      });
    });

    it('should initialise beneficiaryDetails with null', done => {
      service.beneficiaryDetails$.subscribe(val => {
        expect(val).toBeNull();
        done();
      });
    });

    it('should initialise beneficiaryEditDetails with null', done => {
      service.beneficiaryEditDetails$.subscribe(val => {
        expect(val).toBeNull();
        done();
      });
    });
  });

  describe('getRegistrationMaster', () => {
    it('should POST to registrarMasterDataUrl and update registrationMasterDetails subject', () => {
      const mockData = { data: { occupations: [], genders: [] } };
      let emitted: any = null;
      service.registrationMasterDetails$.subscribe(val => (emitted = val));

      service.getRegistrationMaster(101);

      const req = httpMock.expectOne(environment.registrarMasterDataUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ spID: 101 });
      req.flush(mockData);

      expect(emitted).toEqual(mockData.data);
    });

    it('should not update subject when response data is falsy', () => {
      let emitted: any = null;
      service.registrationMasterDetails$.subscribe(val => (emitted = val));

      service.getRegistrationMaster(101);

      const req = httpMock.expectOne(environment.registrarMasterDataUrl);
      req.flush({ data: null });

      expect(emitted).toBeNull();
    });
  });

  describe('getPatientDataAsObservable', () => {
    it('should POST to getCompleteBeneficiaryDetail and update beneficiaryDetails subject', () => {
      const mockData = { data: { name: 'John' } };
      let emitted: any = null;
      service.beneficiaryDetails$.subscribe(val => (emitted = val));

      service.getPatientDataAsObservable(123);

      const req = httpMock.expectOne(environment.getCompleteBeneficiaryDetail);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ beneficiaryRegID: 123 });
      req.flush(mockData);

      expect(emitted).toEqual(mockData.data);
    });

    it('should not update subject when response data is falsy', () => {
      let emitted: any = null;
      service.beneficiaryDetails$.subscribe(val => (emitted = val));

      service.getPatientDataAsObservable(123);

      const req = httpMock.expectOne(environment.getCompleteBeneficiaryDetail);
      req.flush({ data: null });

      expect(emitted).toBeNull();
    });
  });

  describe('getPatientData', () => {
    it('should POST to getCompleteBeneficiaryDetail and return an observable', () => {
      const mockResp = { data: { name: 'Jane' } };
      service.getPatientData(456).subscribe(res => {
        expect(res).toEqual(mockResp);
      });

      const req = httpMock.expectOne(environment.getCompleteBeneficiaryDetail);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ beneficiaryRegID: 456 });
      req.flush(mockResp);
    });
  });

  describe('registerBeneficiary', () => {
    it('should POST beneficiary data wrapped in benD key', () => {
      const beneficiary = { firstName: 'A' };
      service.registerBeneficiary(beneficiary).subscribe();

      const req = httpMock.expectOne(environment.registerBeneficiaryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ benD: beneficiary });
      req.flush({});
    });
  });

  describe('quickSearch', () => {
    it('should POST search term to quickSearchUrl', () => {
      const searchTerm = { searchKey: 'John' };
      service.quickSearch(searchTerm).subscribe();

      const req = httpMock.expectOne(environment.quickSearchUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchTerm);
      req.flush({});
    });
  });

  describe('identityQuickSearch', () => {
    it('should POST search term to identityQuickSearchUrl', () => {
      const searchTerm = { searchKey: 'Doe' };
      service.identityQuickSearch(searchTerm).subscribe();

      const req = httpMock.expectOne(environment.identityQuickSearchUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchTerm);
      req.flush({});
    });
  });

  describe('advanceSearch', () => {
    it('should POST search terms to advanceSearchUrl', () => {
      const terms = { firstName: 'A', lastName: 'B' };
      service.advanceSearch(terms).subscribe();

      const req = httpMock.expectOne(environment.advanceSearchUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(terms);
      req.flush({});
    });
  });

  describe('advanceSearchIdentity', () => {
    it('should POST search terms to advanceSearchIdentityUrl', () => {
      const terms = { firstName: 'C' };
      service.advanceSearchIdentity(terms).subscribe();

      const req = httpMock.expectOne(environment.advanceSearchIdentityUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(terms);
      req.flush({});
    });
  });

  describe('loadMasterData', () => {
    it('should POST spID to registrarMasterDataUrl', () => {
      service.loadMasterData(55).subscribe();

      const req = httpMock.expectOne(environment.registrarMasterDataUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ spID: 55 });
      req.flush({});
    });
  });

  describe('patientRevisit', () => {
    it('should POST benRegID to patientRevisitSubmitToNurse', () => {
      const benRegID = { benRegID: 99 };
      service.patientRevisit(benRegID).subscribe();

      const req = httpMock.expectOne(environment.patientRevisitSubmitToNurse);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(benRegID);
      req.flush({});
    });
  });

  describe('identityPatientRevisit', () => {
    it('should POST ben data to identityPatientRevisitSubmitToNurseURL', () => {
      const ben = { beneficiaryRegID: 77 };
      service.identityPatientRevisit(ben).subscribe();

      const req = httpMock.expectOne(
        environment.identityPatientRevisitSubmitToNurseURL
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(ben);
      req.flush({});
    });
  });

  describe('updatePatientData', () => {
    it('should POST beneficiary to updateBeneficiaryUrl', () => {
      const beneficiary = { id: 1, name: 'Updated' };
      service.updatePatientData(beneficiary).subscribe();

      const req = httpMock.expectOne(environment.updateBeneficiaryUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(beneficiary);
      req.flush({});
    });
  });

  describe('getDistrictBlocks', () => {
    it('should POST servicePointID to servicePointVillages', () => {
      service.getDistrictBlocks(42).subscribe();

      const req = httpMock.expectOne(environment.servicePointVillages);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ servicePointID: 42 });
      req.flush({});
    });
  });

  describe('submitBeneficiary', () => {
    it('should POST iEMRForm to submitBeneficiaryIdentityUrl', () => {
      const form = { field: 'value' };
      service.submitBeneficiary(form).subscribe();

      const req = httpMock.expectOne(environment.submitBeneficiaryIdentityUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(form);
      req.flush({});
    });
  });

  describe('updateBeneficiary', () => {
    it('should POST iEMRForm to updateBeneficiaryIdentityUrl', () => {
      const form = { field: 'updated' };
      service.updateBeneficiary(form).subscribe();

      const req = httpMock.expectOne(environment.updateBeneficiaryIdentityUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(form);
      req.flush({});
    });
  });

  describe('getVillageList', () => {
    it('should GET village list by blockId', () => {
      const blockId = 10;
      service.getVillageList(blockId).subscribe();

      const req = httpMock.expectOne(
        `${environment.getVillageListUrl}${blockId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getSubDistrictList', () => {
    it('should GET sub-district list by districtId', () => {
      const districtId = 20;
      service.getSubDistrictList(districtId).subscribe();

      const req = httpMock.expectOne(
        `${environment.getSubDistrictListUrl}${districtId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getDistrictList', () => {
    it('should GET district list by stateId', () => {
      const stateId = 5;
      service.getDistrictList(stateId).subscribe();

      const req = httpMock.expectOne(
        `${environment.getDistrictListUrl}${stateId}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getDistrictTalukList', () => {
    it('should GET district taluk list by villageID', () => {
      const villageID = 30;
      service.getDistrictTalukList(villageID).subscribe();

      const req = httpMock.expectOne(
        `${environment.getDistrictTalukUrl}${villageID}`
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('clearBeneficiaryEditDetails', () => {
    it('should reset beneficiaryEditDetails to null', done => {
      service.saveBeneficiaryEditDataASobservable({ name: 'Test' });
      service.clearBeneficiaryEditDetails();

      service.beneficiaryEditDetails$.subscribe(val => {
        expect(val).toBeNull();
        done();
      });
    });
  });

  describe('saveBeneficiaryEditDataASobservable', () => {
    it('should emit the given beneficiary on beneficiaryEditDetails$', done => {
      const beneficiary = { firstName: 'X', lastName: 'Y' };
      service.saveBeneficiaryEditDataASobservable(beneficiary);

      service.beneficiaryEditDetails$.subscribe(val => {
        expect(val).toEqual(beneficiary);
        done();
      });
    });
  });
});
