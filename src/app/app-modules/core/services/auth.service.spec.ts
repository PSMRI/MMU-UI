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
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: routerSpy }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should post login request without captchaToken when not provided', () => {
      const userName = 'testUser';
      const password = 'testPass';
      const doLogout = false;

      service.login(userName, password, doLogout).subscribe((res: any) => {
        expect(res).toEqual({ statusCode: 200 });
      });

      const req = httpMock.expectOne(environment.loginUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userName: 'testUser',
        password: 'testPass',
        doLogout: false,
        withCredentials: true,
      });
      req.flush({ statusCode: 200 });
    });

    it('should include captchaToken in request body when provided', () => {
      const userName = 'testUser';
      const password = 'testPass';
      const doLogout = true;
      const captchaToken = 'abc123';

      service.login(userName, password, doLogout, captchaToken).subscribe();

      const req = httpMock.expectOne(environment.loginUrl);
      expect(req.request.body.captchaToken).toBe('abc123');
      expect(req.request.body.doLogout).toBe(true);
      req.flush({});
    });

    it('should not include captchaToken when it is falsy', () => {
      service.login('user', 'pass', false, '').subscribe();

      const req = httpMock.expectOne(environment.loginUrl);
      expect(req.request.body.captchaToken).toBeUndefined();
      req.flush({});
    });
  });

  describe('userlogoutPreviousSession', () => {
    it('should post the userName to the logout previous session URL', () => {
      service.userlogoutPreviousSession('testUser').subscribe((res: any) => {
        expect(res).toEqual({ status: 'ok' });
      });

      const req = httpMock.expectOne(environment.userlogoutPreviousSessionUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userName: 'testUser' });
      req.flush({ status: 'ok' });
    });
  });

  describe('getUserSecurityQuestionsAnswer', () => {
    it('should post lowercase userName', () => {
      service
        .getUserSecurityQuestionsAnswer('TestUser')
        .subscribe((res: any) => {
          expect(res).toEqual({ data: [] });
        });

      const req = httpMock.expectOne(
        environment.getUserSecurityQuestionsAnswerUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userName: 'testuser' });
      req.flush({ data: [] });
    });
  });

  describe('validateSecurityQuestionAndAnswer', () => {
    it('should post security answers with lowercase userName', () => {
      const answers = [{ questionId: 1, answer: 'answer1' }];

      service
        .validateSecurityQuestionAndAnswer(answers, 'TestUser')
        .subscribe((res: any) => {
          expect(res).toBeTruthy();
        });

      const req = httpMock.expectOne(
        environment.validateSecurityQuestionAndAnswerUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        SecurityQuesAns: answers,
        userName: 'testuser',
      });
      req.flush({ statusCode: 200 });
    });
  });

  describe('getTransactionIdForChangePassword', () => {
    it('should post lowercase userName', () => {
      service
        .getTransactionIdForChangePassword('Admin')
        .subscribe((res: any) => {
          expect(res).toBeTruthy();
        });

      const req = httpMock.expectOne(
        environment.getTransactionIdForChangePasswordUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userName: 'admin' });
      req.flush({ transactionId: 'txn123' });
    });
  });

  describe('getSecurityQuestions', () => {
    it('should make a GET request to the security question URL', () => {
      service.getSecurityQuestions().subscribe((res: any) => {
        expect(res.length).toBe(2);
      });

      const req = httpMock.expectOne(environment.getSecurityQuestionUrl);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('saveUserSecurityQuestionsAnswer', () => {
    it('should post user question-answer data', () => {
      const qaPair = { questionId: 1, answer: 'test' };

      service.saveUserSecurityQuestionsAnswer(qaPair).subscribe((res: any) => {
        expect(res).toEqual({ status: 'saved' });
      });

      const req = httpMock.expectOne(
        environment.saveUserSecurityQuestionsAnswerUrl
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(qaPair);
      req.flush({ status: 'saved' });
    });
  });

  describe('setNewPassword', () => {
    it('should post the new password with transactionId from service property', () => {
      service.transactionId = 'txn-456';

      service
        .setNewPassword('user1', 'newPass', 'ignored')
        .subscribe((res: any) => {
          expect(res).toBeTruthy();
        });

      const req = httpMock.expectOne(environment.setNewPasswordUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userName: 'user1',
        password: 'newPass',
        transactionId: 'txn-456',
      });
      req.flush({ statusCode: 200 });
    });

    it('should use undefined transactionId when not set', () => {
      service.transactionId = undefined;

      service.setNewPassword('user1', 'pass', 'any').subscribe();

      const req = httpMock.expectOne(environment.setNewPasswordUrl);
      expect(req.request.body.transactionId).toBeUndefined();
      req.flush({});
    });
  });

  describe('validateSessionKey', () => {
    it('should post to session exists URL with empty body', () => {
      service.validateSessionKey().subscribe((res: any) => {
        expect(res).toEqual({ statusCode: 200, data: true });
      });

      const req = httpMock.expectOne(environment.getSessionExistsURL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ statusCode: 200, data: true });
    });
  });

  describe('logout', () => {
    it('should post empty string to logout URL', () => {
      service.logout().subscribe((res: any) => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(environment.logoutUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe('');
      req.flush({ status: 'logged out' });
    });
  });

  describe('getUIVersionAndCommitDetails', () => {
    it('should make a GET request to the given URL', () => {
      const url = 'https://example.com/version.json';

      service.getUIVersionAndCommitDetails(url).subscribe((res: any) => {
        expect(res.version).toBe('1.0');
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ version: '1.0' });
    });
  });

  describe('getAPIVersionAndCommitDetails', () => {
    it('should make a GET request to the API version URL', () => {
      service.getAPIVersionAndCommitDetails().subscribe((res: any) => {
        expect(res.version).toBe('2.0');
      });

      const req = httpMock.expectOne(environment.apiVersionUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ version: '2.0' });
    });
  });
});
