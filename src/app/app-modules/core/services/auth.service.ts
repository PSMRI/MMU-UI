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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  LoginRequest,
  LoginResponse,
  SecurityQuestion,
  SecurityQuestionAnswer,
  ApiResponse,
} from '../models';

@Injectable()
export class AuthService {
  transactionId: string = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  login(
    userName: string,
    password: string,
    doLogout: boolean,
    captchaToken?: string
  ): Observable<ApiResponse<LoginResponse>> {
    const requestBody: LoginRequest = {
      userName,
      password,
      doLogout,
      withCredentials: true,
    };
    if (captchaToken) {
      requestBody.captchaToken = captchaToken;
    }

    return this.http.post<ApiResponse<LoginResponse>>(
      environment.loginUrl,
      requestBody
    );
  }

  userlogoutPreviousSession(userName: string): Observable<ApiResponse<unknown>> {
    console.log(
      'environment.userlogoutPreviousSessionUrl',
      environment.userlogoutPreviousSessionUrl
    );
    return this.http.post<ApiResponse<unknown>>(
      environment.userlogoutPreviousSessionUrl,
      { userName }
    );
  }

  getUserSecurityQuestionsAnswer(
    uname: string
  ): Observable<ApiResponse<SecurityQuestion[]>> {
    return this.http.post<ApiResponse<SecurityQuestion[]>>(
      environment.getUserSecurityQuestionsAnswerUrl,
      { userName: uname.toLowerCase() }
    );
  }

  validateSecurityQuestionAndAnswer(
    ans: SecurityQuestionAnswer,
    uname: string
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      environment.validateSecurityQuestionAndAnswerUrl,
      {
        SecurityQuesAns: ans,
        userName: uname.toLowerCase(),
      }
    );
  }

  getTransactionIdForChangePassword(uname: string): Observable<ApiResponse<{ transactionId: string }>> {
    return this.http.post<ApiResponse<{ transactionId: string }>>(
      environment.getTransactionIdForChangePasswordUrl,
      { userName: uname.toLowerCase() }
    );
  }

  getSecurityQuestions(): Observable<ApiResponse<SecurityQuestion[]>> {
    return this.http.get<ApiResponse<SecurityQuestion[]>>(
      environment.getSecurityQuestionUrl
    );
  }

  saveUserSecurityQuestionsAnswer(
    userQuestionAnswer: SecurityQuestionAnswer[]
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      environment.saveUserSecurityQuestionsAnswerUrl,
      userQuestionAnswer
    );
  }

  setNewPassword(
    userName: string,
    password: string,
    transactionId: string
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(environment.setNewPasswordUrl, {
      userName,
      password,
      transactionId: this.transactionId,
    });
  }

  validateSessionKey(): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(environment.getSessionExistsURL, {});
  }

  logout() {
    return this.http.post(environment.logoutUrl, '');
  }

  getUIVersionAndCommitDetails(url: any) {
    return this.http.get(url);
  }
  getAPIVersionAndCommitDetails() {
    return this.http.get(environment.apiVersionUrl);
  }
}
