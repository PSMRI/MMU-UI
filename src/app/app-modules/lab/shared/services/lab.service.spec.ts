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
import { LabService } from './lab.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('LabService', () => {
  let service: LabService;
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
        LabService,
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
    });

    service = TestBed.inject(LabService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLabWorklist', () => {
    it('should make GET request with correct URL params', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return JSON.stringify({ vanID: 10 });
        if (key === 'providerServiceID') return '100';
        if (key === 'serviceID') return '2';
        return null;
      });

      service.getLabWorklist().subscribe();
      const expectedUrl = environment.labWorklist + '100/2/10';
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: [] });
    });
  });

  describe('getEcgAbnormalities', () => {
    it('should make GET request to getEcgAbnormalitiesMasterUrl', () => {
      service.getEcgAbnormalities().subscribe();
      const req = httpMock.expectOne(environment.getEcgAbnormalitiesMasterUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, data: [] });
    });
  });

  describe('saveLabWork', () => {
    it('should POST tech form data to labSaveWork URL', () => {
      const techForm = { labTestID: 1, result: 'Positive' };
      service.saveLabWork(techForm).subscribe();
      const req = httpMock.expectOne(environment.labSaveWork);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(techForm);
      req.flush({ statusCode: 200 });
    });
  });

  describe('saveFile', () => {
    it('should POST file data to saveFile URL', () => {
      const file = { fileName: 'test.pdf', fileContent: 'base64data' };
      service.saveFile(file).subscribe();
      const req = httpMock.expectOne(environment.saveFile);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(file);
      req.flush({ statusCode: 200 });
    });
  });

  describe('viewFileContent', () => {
    it('should POST viewFileIndex and return blob', () => {
      const viewFileIndex = { fileID: 123 };
      service.viewFileContent(viewFileIndex).subscribe(res => {
        expect(res).toBeTruthy();
      });
      const req = httpMock.expectOne(environment.viewFileData);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(viewFileIndex);
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['test']));
    });
  });
});
