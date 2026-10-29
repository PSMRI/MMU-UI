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
import { MasterDataService } from './master-data.service';
import { environment } from 'src/environments/environment';

describe('MasterDataService', () => {
  let service: MasterDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MasterDataService],
    });

    service = TestBed.inject(MasterDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLabRequirements', () => {
    it('should POST beneficiary details to get prescribed test data', () => {
      service.getLabRequirements('12345', '100', 'VC001').subscribe(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(environment.getprescribedTestDataUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        beneficiaryRegID: '12345',
        benVisitID: '100',
        visitCode: 'VC001',
      });
      req.flush({ statusCode: 200, data: [] });
    });

    it('should handle null parameters', () => {
      service.getLabRequirements(null, null, null).subscribe();
      const req = httpMock.expectOne(environment.getprescribedTestDataUrl);
      expect(req.request.body.beneficiaryRegID).toBeNull();
      req.flush({ statusCode: 200 });
    });
  });
});
