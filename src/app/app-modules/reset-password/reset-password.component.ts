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

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from '../core/services/confirmation.service';
import { AuthService } from '../core/services';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { StringValidatorDirective } from '../core/directives/stringValidator.directive';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { cardImports } from 'Common-UI/v2/ui/card';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  host: { class: 'block' },
  imports: [
    NgIf,
    FormsModule,
    RouterLink,
    NgIcon,
    StringValidatorDirective,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...cardImports,
  ],
  viewProviders: [provideIcons({ lucideUser, lucideEye, lucideEyeOff })],
})
export class ResetPasswordComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    readonly sessionstorage: SessionStorageService,
    private confirmationService: ConfirmationService
  ) {}

  public response: any;
  public error: any;
  showQuestions = false;
  hideOnGettingQuestions = true;
  securityQuestions: any;
  answer: any = undefined;
  userID: any;

  dynamictype: any = 'password';

  public questionId: any[] = [];
  public questions: any[] = [];
  //public correctAnswers: any[] = [];
  public userAnswers: any[] = [];
  userFinalAnswers: any[] = [];

  wrong_answer_msg: any = '';

  getQuestions(username: any) {
    this.sessionstorage.setItem('userName', username);
    this.authService.getUserSecurityQuestionsAnswer(username).subscribe(
      (response: any) => {
        if (response !== undefined && response !== null)
          this.handleSuccess(response.data);
      },
      (error: any) => (this.error = <any>error)
    );
  }

  handleSuccess(data: any) {
    if (
      data !== undefined &&
      data !== null &&
      data.forgetPassword !== 'user Not Found'
    ) {
      if (data.SecurityQuesAns.length > 0) {
        this.securityQuestions = data.SecurityQuesAns;
        this.showQuestions = true;
        this.hideOnGettingQuestions = false;

        this.splitQuestionAndQuestionID();
      } else {
        this.logout();
        this.confirmationService.alert('Questions are not set', 'error');
      }
    } else {
      this.logout();
    }
  }

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  togglePWD() {
    this.dynamictype = this.dynamictype === 'text' ? 'password' : 'text';
  }

  splitQuestionAndQuestionID() {
    for (let i = 0; i < this.securityQuestions.length; i++) {
      this.questions.push(this.securityQuestions[i].question);
      this.questionId.push(this.securityQuestions[i].questionId);
    }
    this.showMyQuestion();
  }

  bufferQuestionId: any;
  bufferQuestion: any;
  counter = 0;

  showMyQuestion() {
    this.bufferQuestion = this.questions[this.counter];
    this.bufferQuestionId = this.questionId[this.counter];
  }

  nextQuestion() {
    if (this.counter < 3) {
      const reqObj = {
        questionId: this.questionId[this.counter],
        answer: this.answer,
      };
      this.userFinalAnswers.push(reqObj);
      this.wrong_answer_msg = '';
      this.counter = this.counter + 1;
      if (this.counter < 3) {
        this.showMyQuestion();
        this.answer = undefined;
      } else {
        this.checking();
      }
    }
  }

  checking() {
    this.authService
      .validateSecurityQuestionAndAnswer(
        this.userFinalAnswers,
        this.sessionstorage.getItem('userName')
      )
      .subscribe(
        response => {
          if (response !== undefined && response !== null) {
            if (response.statusCode === 200) {
              this.counter = 0;
              this.router.navigate(['/set-password']);
              this.authService.transactionId = response.data.transactionId;
            } else {
              this.showQuestions = true;
              this.counter = 0;
              this.confirmationService.alert(response.errorMessage, 'error');
              this.getQuestions(this.sessionstorage.getItem('userName'));
              this.router.navigate(['/reset-password']);
              this.splitQuestionAndQuestionID();
            }
          }
        },
        error => {
          this.showQuestions = true;
          this.counter = 0;
          this.confirmationService.alert(error.errorMessage, 'error');
          this.router.navigate(['/reset-password']);
          this.splitQuestionAndQuestionID();
        }
      );

    this.answer = undefined;
    this.userFinalAnswers = [];
  }

  logout() {
    this.authService.logout().subscribe(res => {
      this.router.navigate(['/login']).then(result => {
        if (result) {
          // this.sessionstorage.clear();
          sessionStorage.clear();
        }
      });
    });
  }
}
