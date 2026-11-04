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
import { CommonService } from './common-services.service';
import { environment } from 'src/environments/environment';

describe('CommonService', () => {
  let service: CommonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommonService],
    });
    service = TestBed.inject(CommonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Subject and Observable', () => {
    it('should have a commonServices Subject', () => {
      expect(service.commonServices).toBeDefined();
    });

    it('should have a commonServices$ observable', () => {
      expect(service.commonServices$).toBeDefined();
    });

    it('should emit values through commonServices$', (done: DoneFn) => {
      const testData = { key: 'value' };
      service.commonServices$.subscribe(data => {
        expect(data).toEqual(testData);
        done();
      });
      service.commonServices.next(testData);
    });
  });

  describe('URL properties', () => {
    it('should have getStatesURL from environment', () => {
      expect(service.getStatesURL).toBe(environment.getStatesURL);
    });

    it('should have getDistrictsURL from environment', () => {
      expect(service.getDistrictsURL).toBe(environment.getDistrictsURL);
    });
  });

  describe('#getStates', () => {
    it('should make a GET request to getStatesURL', () => {
      const mockResponse = { data: [{ stateId: 1, stateName: 'TestState' }] };

      service.getStates(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(environment.getStatesURL);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should accept any countryId parameter', () => {
      service.getStates(99).subscribe();

      const req = httpMock.expectOne(environment.getStatesURL);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('#getDistricts', () => {
    it('should make a GET request to getDistrictsURL with stateId appended', () => {
      const stateId = 5;
      const mockResponse = {
        data: [{ districtId: 1, districtName: 'TestDistrict' }],
      };

      service.getDistricts(stateId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(environment.getDistrictsURL + stateId);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle different stateId values', () => {
      const stateId = 100;

      service.getDistricts(stateId).subscribe();

      const req = httpMock.expectOne(environment.getDistrictsURL + stateId);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle HTTP error responses', () => {
      const stateId = 1;

      service.getDistricts(stateId).subscribe({
        error: error => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(environment.getDistrictsURL + stateId);
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });
});
