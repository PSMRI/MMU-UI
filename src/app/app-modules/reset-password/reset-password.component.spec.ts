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
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  autoSpy,
  throwingObs,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { ConfirmationService } from '../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

const QUESTIONS = [
  { questionId: 1, question: 'Q1?' },
  { questionId: 2, question: 'Q2?' },
  { questionId: 3, question: 'Q3?' },
];

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let auth: any;
  let confirmation: any;
  let session: any;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ResetPasswordComponent],
      providers: [
        ...commonTestProviders(),
        { provide: AuthService, useValue: autoSpy(AuthService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    auth = TestBed.inject(AuthService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('creates with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.showQuestions).toBeFalse();
    expect(component.hideOnGettingQuestions).toBeTrue();
    expect(component.counter).toBe(0);
    expect(component.dynamictype).toBe('password');
  });

  it('toggles password visibility', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
  });

  describe('getQuestions', () => {
    it('stores username and shows the first question on success', () => {
      auth.getUserSecurityQuestionsAnswer.and.returnValue(
        of({ data: { SecurityQuesAns: QUESTIONS } })
      );
      component.getQuestions('nurse1');
      expect(session.setItem).toHaveBeenCalledWith('userName', 'nurse1');
      expect(auth.getUserSecurityQuestionsAnswer).toHaveBeenCalledWith(
        'nurse1'
      );
      expect(component.showQuestions).toBeTrue();
      expect(component.hideOnGettingQuestions).toBeFalse();
      expect(component.questions).toEqual(['Q1?', 'Q2?', 'Q3?']);
      expect(component.questionId).toEqual([1, 2, 3]);
      expect(component.bufferQuestion).toBe('Q1?');
      expect(component.bufferQuestionId).toBe(1);
    });

    it('ignores null response', () => {
      spyOn(component, 'handleSuccess');
      auth.getUserSecurityQuestionsAnswer.and.returnValue(of(null));
      component.getQuestions('u');
      expect(component.handleSuccess).not.toHaveBeenCalled();
    });

    it('stores the error on failure', () => {
      auth.getUserSecurityQuestionsAnswer.and.returnValue(
        throwingObs({ status: 500 })
      );
      component.getQuestions('u');
      expect(component.error).toEqual({ status: 500 });
    });
  });

  describe('handleSuccess', () => {
    it('logs out and alerts when no questions set', () => {
      spyOn(component, 'logout');
      component.handleSuccess({ SecurityQuesAns: [] });
      expect(component.logout).toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Questions are not set',
        'error'
      );
    });

    it('logs out when user not found or data missing', () => {
      spyOn(component, 'logout');
      component.handleSuccess({ forgetPassword: 'user Not Found' });
      component.handleSuccess(null);
      component.handleSuccess(undefined);
      expect(component.logout).toHaveBeenCalledTimes(3);
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  describe('nextQuestion', () => {
    beforeEach(() => {
      component.handleSuccess({ SecurityQuesAns: QUESTIONS });
    });

    it('collects answers and moves to the next question', () => {
      component.answer = 'a1';
      component.wrong_answer_msg = 'old';
      component.nextQuestion();
      expect(component.userFinalAnswers).toEqual([
        { questionId: 1, answer: 'a1' },
      ]);
      expect(component.counter).toBe(1);
      expect(component.bufferQuestion).toBe('Q2?');
      expect(component.answer).toBeUndefined();
      expect(component.wrong_answer_msg).toBe('');
    });

    it('validates answers after the third question', () => {
      spyOn(component, 'checking');
      component.nextQuestion();
      component.nextQuestion();
      component.nextQuestion();
      expect(component.counter).toBe(3);
      expect(component.checking).toHaveBeenCalledTimes(1);
      expect(component.userFinalAnswers.length).toBe(3);
    });

    it('does nothing once counter reached 3', () => {
      component.counter = 3;
      component.nextQuestion();
      expect(component.userFinalAnswers.length).toBe(0);
      expect(component.counter).toBe(3);
    });
  });

  describe('checking', () => {
    beforeEach(() => {
      session.store.set('userName', 'nurse1');
      component.handleSuccess({ SecurityQuesAns: QUESTIONS });
      component.userFinalAnswers = [{ questionId: 1, answer: 'a' }];
      component.answer = 'x';
    });

    it('navigates to set-password and stores transaction id on success', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(
        of({ statusCode: 200, data: { transactionId: 'tx1' } })
      );
      const answers = component.userFinalAnswers;
      component.counter = 3;
      component.checking();
      expect(auth.validateSecurityQuestionAndAnswer).toHaveBeenCalledWith(
        answers,
        'nurse1'
      );
      expect(component.counter).toBe(0);
      expect(router.navigate).toHaveBeenCalledWith(['/set-password']);
      expect(auth.transactionId).toBe('tx1');
      expect(component.answer).toBeUndefined();
      expect(component.userFinalAnswers).toEqual([]);
    });

    it('alerts, refetches questions and stays on reset-password on wrong answers', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(
        of({ statusCode: 5002, errorMessage: 'Wrong answers' })
      );
      auth.getUserSecurityQuestionsAnswer.and.returnValue(of(null));
      component.counter = 3;
      component.checking();
      expect(confirmation.alert).toHaveBeenCalledWith('Wrong answers', 'error');
      expect(auth.getUserSecurityQuestionsAnswer).toHaveBeenCalledWith(
        'nurse1'
      );
      expect(router.navigate).toHaveBeenCalledWith(['/reset-password']);
      expect(component.counter).toBe(0);
      expect(component.showQuestions).toBeTrue();
      // current behaviour: question arrays are appended to, not reset
      expect(component.questions.length).toBe(6);
    });

    it('handles null response without action', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(of(null));
      component.checking();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.userFinalAnswers).toEqual([]);
    });

    it('alerts and stays on reset-password on error', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(
        throwingObs({ errorMessage: 'boom' })
      );
      component.counter = 2;
      component.checking();
      expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/reset-password']);
      expect(component.counter).toBe(0);
    });
  });

  describe('logout', () => {
    it('clears sessionStorage after navigating to login', fakeAsync(() => {
      sessionStorage.setItem('k', 'v');
      component.logout();
      flushMicrotasks();
      expect(auth.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(sessionStorage.getItem('k')).toBeNull();
    }));

    it('keeps sessionStorage when navigation fails', fakeAsync(() => {
      navigateSpy.and.resolveTo(false);
      sessionStorage.setItem('k', 'v');
      component.logout();
      flushMicrotasks();
      expect(sessionStorage.getItem('k')).toBe('v');
    }));
  });

  it('renders the question section after questions are fetched', () => {
    auth.getUserSecurityQuestionsAnswer.and.returnValue(
      of({ data: { SecurityQuesAns: QUESTIONS } })
    );
    component.getQuestions('nurse1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Q1?');
  });
});
