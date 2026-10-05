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
import { BeneficiaryDetailsService } from './beneficiary-details.service';
import { environment } from 'src/environments/environment';

describe('BeneficiaryDetailsService', () => {
  let service: BeneficiaryDetailsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BeneficiaryDetailsService],
    });

    service = TestBed.inject(BeneficiaryDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have beneficiaryDetails$ emitting null initially', done => {
      service.beneficiaryDetails$.subscribe(val => {
        expect(val).toBeNull();
        done();
      });
    });

    it('should have HRPPositive as empty string initially', () => {
      expect(service.HRPPositive).toBe('');
    });

    it('should have HRPPositiveFlag$ emitting empty string initially', done => {
      service.HRPPositiveFlag$.subscribe(val => {
        expect(val).toBe('');
        done();
      });
    });
  });

  describe('getBeneficiaryDetails', () => {
    it('should post to correct URL and emit beneficiary data on success', done => {
      const mockData = { name: 'John Doe', age: 30 };

      // Skip the initial null emission
      let emissionCount = 0;
      service.beneficiaryDetails$.subscribe(data => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(data).toEqual(mockData);
          done();
        }
      });

      service.getBeneficiaryDetails('REG123', 'FLOW456');

      const req = httpMock.expectOne(environment.getBeneficiaryDetail);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        beneficiaryRegID: 'REG123',
        benFlowID: 'FLOW456',
      });
      req.flush({ data: mockData });
    });

    it('should emit null when response has no data field', () => {
      const emissions: any[] = [];
      service.beneficiaryDetails$.subscribe(data => {
        emissions.push(data);
      });

      service.getBeneficiaryDetails('REG1', 'FLOW1');

      const req = httpMock.expectOne(environment.getBeneficiaryDetail);
      req.flush({ data: null });

      // Should only have the initial null emission (no new emission for falsy data)
      expect(emissions.length).toBe(1);
      expect(emissions[0]).toBeNull();
    });

    it('should emit null on HTTP error', done => {
      let emissionCount = 0;
      service.beneficiaryDetails$.subscribe(data => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(data).toBeNull();
          done();
        }
      });

      service.getBeneficiaryDetails('REG1', 'FLOW1');

      const req = httpMock.expectOne(environment.getBeneficiaryDetail);
      req.error(new ProgressEvent('Network error'), { status: 500 });
    });

    it('should emit null when response data is undefined', () => {
      const emissions: any[] = [];
      service.beneficiaryDetails$.subscribe(data => {
        emissions.push(data);
      });

      service.getBeneficiaryDetails('REG1', 'FLOW1');

      const req = httpMock.expectOne(environment.getBeneficiaryDetail);
      req.flush({});

      // No new emission since data is undefined (falsy)
      expect(emissions.length).toBe(1);
    });
  });

  describe('getBeneficiaryImage', () => {
    it('should return an observable from POST request', () => {
      const mockResponse = { image: 'base64data' };

      service.getBeneficiaryImage('REG123').subscribe((res: any) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(environment.getBeneficiaryImage);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ beneficiaryRegID: 'REG123' });
      req.flush(mockResponse);
    });
  });

  describe('reset', () => {
    it('should emit null on beneficiaryDetails', done => {
      // First set some data
      service.beneficiaryDetails.next({ name: 'Test' });

      // Now reset
      service.reset();

      service.beneficiaryDetails$.subscribe(data => {
        expect(data).toBeNull();
        done();
      });
    });
  });

  describe('setHRPPositive', () => {
    it('should set HRPPositive to 1', () => {
      service.setHRPPositive();
      expect(service.HRPPositive).toBe(1);
    });

    it('should emit 1 on HRPPositiveFlag$', done => {
      let emissionCount = 0;
      service.HRPPositiveFlag$.subscribe(val => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(val).toBe(1);
          done();
        }
      });

      service.setHRPPositive();
    });
  });

  describe('resetHRPPositive', () => {
    it('should set HRPPositive to 0', () => {
      service.HRPPositive = 1;
      service.resetHRPPositive();
      expect(service.HRPPositive).toBe(0);
    });

    it('should emit 0 on HRPPositiveFlag$', done => {
      let emissionCount = 0;
      service.HRPPositiveFlag$.subscribe(val => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(val).toBe(0);
          done();
        }
      });

      service.resetHRPPositive();
    });
  });
});
