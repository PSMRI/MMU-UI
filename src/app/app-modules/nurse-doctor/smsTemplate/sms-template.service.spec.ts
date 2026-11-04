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
import { SmsTemplateService } from './sms-template.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

describe('SmsTemplateService', () => {
  let service: SmsTemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const mockHttpServiceService = {
      currentLangugae$: new BehaviorSubject<any>({ language: 'English' }),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SmsTemplateService,
        { provide: HttpServiceService, useValue: mockHttpServiceService },
      ],
    });

    service = TestBed.inject(SmsTemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSMStemplates', () => {
    it('should POST with providerServiceMapID and smsTypeID', () => {
      service.getSMStemplates('PSM001', 5).subscribe();
      const req = httpMock.expectOne(environment.getSMStemplates_url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        providerServiceMapID: 'PSM001',
        smsTemplateTypeID: 5,
      });
      req.flush({ statusCode: 200 });
    });

    it('should POST with undefined smsTemplateTypeID when not provided', () => {
      service.getSMStemplates('PSM001').subscribe();
      const req = httpMock.expectOne(environment.getSMStemplates_url);
      expect(req.request.body.smsTemplateTypeID).toBeUndefined();
      req.flush({ statusCode: 200 });
    });
  });

  describe('getSMSTemplates', () => {
    it('should POST with providerServiceMapID only', () => {
      service.getSMSTemplates('PSM002').subscribe();
      const req = httpMock.expectOne(environment.getSMStemplates_url);
      expect(req.request.body).toEqual({
        providerServiceMapID: 'PSM002',
      });
      req.flush({ statusCode: 200 });
    });
  });

  describe('getSMStypes', () => {
    it('should POST with serviceID', () => {
      service.getSMStypes(2).subscribe();
      const req = httpMock.expectOne(environment.getSMStypes_url);
      expect(req.request.body).toEqual({ serviceID: 2 });
      req.flush({ statusCode: 200 });
    });
  });

  describe('sendSMS', () => {
    it('should POST the SMS object', () => {
      const smsObj = { phoneNumber: '1234567890', message: 'Test' };
      service.sendSMS(smsObj).subscribe();
      const req = httpMock.expectOne(environment.sendSMS_url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(smsObj);
      req.flush({ statusCode: 200 });
    });
  });
});
