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
import { Router } from '@angular/router';
import { ServicePointService } from './service-point.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('ServicePointService', () => {
  let service: ServicePointService;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ServicePointService,
        { provide: Router, useValue: mockRouter },
        {
          provide: SessionStorageService,
          useValue: mockSessionStorageService,
        },
      ],
    });
    service = TestBed.inject(ServicePointService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#getServicePoints', () => {
    it('should make a POST request to servicePointUrl', () => {
      const serviceProviderId = 'provider123';
      const mockResponse = {
        data: [{ servicePointID: 1, servicePointName: 'SP1' }],
      };

      service.getServicePoints(serviceProviderId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(environment.servicePointUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        providerServiceMapID: serviceProviderId,
      });
      req.flush(mockResponse);
    });

    it('should send providerServiceMapID in request body', () => {
      const serviceProviderId = 'testId456';

      service.getServicePoints(serviceProviderId).subscribe();

      const req = httpMock.expectOne(environment.servicePointUrl);
      expect(req.request.body.providerServiceMapID).toBe(serviceProviderId);
      req.flush({});
    });

    it('should handle empty response', () => {
      service.getServicePoints('id1').subscribe(response => {
        expect(response).toEqual({});
      });

      const req = httpMock.expectOne(environment.servicePointUrl);
      req.flush({});
    });

    it('should handle HTTP error', () => {
      service.getServicePoints('id1').subscribe({
        error: error => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(environment.servicePointUrl);
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('#getMMUDemographics', () => {
    it('should make a POST request to demographicsCurrentMasterUrl', () => {
      const spID = '10';
      const spPSMID = '20';
      const mockResponse = {
        data: { stateID: 1, districtID: 2 },
      };

      service.getMMUDemographics(spID, spPSMID).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(environment.demographicsCurrentMasterUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        spID: spID,
        spPSMID: spPSMID,
      });
      req.flush(mockResponse);
    });

    it('should send correct parameters in request body', () => {
      const spID = 'servicePoint1';
      const spPSMID = 'psmId1';

      service.getMMUDemographics(spID, spPSMID).subscribe();

      const req = httpMock.expectOne(environment.demographicsCurrentMasterUrl);
      expect(req.request.body.spID).toBe(spID);
      expect(req.request.body.spPSMID).toBe(spPSMID);
      req.flush({});
    });

    it('should handle null parameters', () => {
      service.getMMUDemographics(null, null).subscribe();

      const req = httpMock.expectOne(environment.demographicsCurrentMasterUrl);
      expect(req.request.body).toEqual({ spID: null, spPSMID: null });
      req.flush({});
    });

    it('should handle HTTP error', () => {
      service.getMMUDemographics('sp1', 'psm1').subscribe({
        error: error => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(environment.demographicsCurrentMasterUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
