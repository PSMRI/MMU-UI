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
import { PharmacistService } from './pharmacist.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('PharmacistService', () => {
  let service: PharmacistService;
  let httpMock: HttpTestingController;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;

  beforeEach(() => {
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PharmacistService,
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
    });

    service = TestBed.inject(PharmacistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPharmacistWorklist', () => {
    it('should make GET request with correctly built URL', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return JSON.stringify({ vanID: 10 });
        if (key === 'providerServiceID') return '100';
        if (key === 'serviceID') return '2';
        return null;
      });

      service.getPharmacistWorklist().subscribe(res => {
        expect(res).toBeTruthy();
      });

      const expectedUrl = environment.pharmacistWorklist + '100/2/10';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: [] });
    });

    it('should construct URL with different van IDs', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return JSON.stringify({ vanID: 25 });
        if (key === 'providerServiceID') return '200';
        if (key === 'serviceID') return '3';
        return null;
      });

      service.getPharmacistWorklist().subscribe();
      const expectedUrl = environment.pharmacistWorklist + '200/3/25';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200 });
    });
  });
});
