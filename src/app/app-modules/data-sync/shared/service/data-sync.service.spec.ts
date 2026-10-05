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
import { DataSyncService } from './data-sync.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('DataSyncService', () => {
  let service: DataSyncService;
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
        DataSyncService,
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
    });

    service = TestBed.inject(DataSyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDataSYNCGroup', () => {
    it('should make GET request to getDataSYNCGroupUrl', () => {
      service.getDataSYNCGroup().subscribe();
      const req = httpMock.expectOne(environment.getDataSYNCGroupUrl);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('dataSyncLogin', () => {
    it('should make POST request with credentials', () => {
      service.dataSyncLogin('admin', 'pass123', false).subscribe();
      const req = httpMock.expectOne(environment.syncLoginUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userName: 'admin',
        password: 'pass123',
        doLogout: false,
      });
      req.flush({ statusCode: 200 });
    });
  });

  describe('userlogoutPreviousSession', () => {
    it('should POST userName to logout URL', () => {
      service.userlogoutPreviousSession('testUser').subscribe();
      const req = httpMock.expectOne(
        environment.syncUserlogoutPreviousSessionUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userName: 'testUser' });
      req.flush({ statusCode: 200 });
    });
  });

  describe('syncUploadData', () => {
    it('should POST upload request with user and vanID', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'userName') return 'testUser';
        if (key === 'serviceLineDetails') return JSON.stringify({ vanID: 10 });
        return null;
      });

      service.syncUploadData().subscribe();
      const req = httpMock.expectOne(environment.syncDataUploadUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user: 'testUser', vanID: 10 });
      req.flush({ statusCode: 200 });
    });

    it('should handle missing serviceLineDetails gracefully', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'userName') return 'testUser';
        if (key === 'serviceLineDetails') return null;
        return null;
      });

      service.syncUploadData().subscribe();
      const req = httpMock.expectOne(environment.syncDataUploadUrl);
      expect(req.request.body.user).toBe('testUser');
      req.flush({ statusCode: 200 });
    });
  });

  describe('syncAllGroups', () => {
    it('should POST to syncDataUploadUrl with user and vanID', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'userName') return 'user1';
        if (key === 'serviceLineDetails') return JSON.stringify({ vanID: 5 });
        return null;
      });

      service.syncAllGroups().subscribe();
      const req = httpMock.expectOne(environment.syncDataUploadUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user: 'user1', vanID: 5 });
      req.flush({ statusCode: 200 });
    });
  });

  describe('syncDownloadData', () => {
    it('should POST reqObj to syncDataDownloadUrl', () => {
      const reqObj = { groupId: 1 };
      service.syncDownloadData(reqObj).subscribe();
      const req = httpMock.expectOne(environment.syncDataDownloadUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reqObj);
      req.flush({ statusCode: 200 });
    });
  });

  describe('syncDownloadDataProgress', () => {
    it('should make GET request to syncDownloadProgressUrl', () => {
      service.syncDownloadDataProgress().subscribe();
      const req = httpMock.expectOne(environment.syncDownloadProgressUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ progress: 50 });
    });
  });

  describe('getVanDetailsForMasterDownload', () => {
    it('should make GET request to getVanDetailsForMasterDownloadUrl', () => {
      service.getVanDetailsForMasterDownload().subscribe();
      const req = httpMock.expectOne(
        environment.getVanDetailsForMasterDownloadUrl
      );
      expect(req.request.method).toBe('GET');
      req.flush({ vanID: 1 });
    });
  });

  describe('checkBenIDAvailability', () => {
    it('should make GET request to getBenIDs', () => {
      service.checkBenIDAvailability().subscribe();
      const req = httpMock.expectOne(environment.getBenIDs);
      expect(req.request.method).toBe('GET');
      req.flush({ available: true });
    });
  });

  describe('generateBenIDs', () => {
    it('should POST reqObj to generateBenID', () => {
      const reqObj = { count: 100, vanID: 5 };
      service.generateBenIDs(reqObj).subscribe();
      const req = httpMock.expectOne(environment.generateBenID);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reqObj);
      req.flush({ statusCode: 200 });
    });
  });

  describe('inventorySyncDownloadData', () => {
    it('should POST vanID to getInventorySyncData', () => {
      service.inventorySyncDownloadData(10).subscribe();
      const req = httpMock.expectOne(environment.getInventorySyncData);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(10);
      req.flush({ statusCode: 200 });
    });
  });
});
