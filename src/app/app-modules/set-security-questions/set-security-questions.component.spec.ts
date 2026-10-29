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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { SetSecurityQuestionsComponent } from './set-security-questions.component';
import { AuthService, ConfirmationService } from '../core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('SetSecurityQuestionsComponent', () => {
  let component: SetSecurityQuestionsComponent;
  let fixture: ComponentFixture<SetSecurityQuestionsComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockQuestions = [
    { QuestionID: 1, Question: 'Favorite color?' },
    { QuestionID: 2, Question: 'Pet name?' },
    { QuestionID: 3, Question: 'City of birth?' },
    { QuestionID: 4, Question: 'Favorite food?' },
  ];

  beforeEach(waitForAsync(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getSecurityQuestions',
      'saveUserSecurityQuestionsAnswer',
      'setNewPassword',
      'logout',
    ]);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockAuthService.getSecurityQuestions.and.returnValue(
      of({ data: mockQuestions })
    );
    mockSessionStorageService.getItem.and.callFake((key: string) => {
      if (key === 'userID') return '456';
      if (key === 'userName') return 'testuser';
      return null;
    });

    TestBed.configureTestingModule({
      declarations: [SetSecurityQuestionsComponent],
      imports: [
        FormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: SessionStorageService, useValue: mockSessionStorageService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetSecurityQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set crypto defaults', () => {
      expect(component['_keySize']).toBe(256);
      expect(component['_ivSize']).toBe(128);
      expect(component['_iterationCount']).toBe(1989);
    });
  });

  describe('ngOnInit', () => {
    it('should load userID and userName from session storage', () => {
      expect(component.uid).toBe('456');
      expect(component.uname).toBe('testuser');
    });

    it('should call getSecurityQuestions', () => {
      expect(mockAuthService.getSecurityQuestions).toHaveBeenCalled();
    });

    it('should populate questions arrays on success', () => {
      expect(component.questions).toEqual(mockQuestions);
      expect(component.replica_questions).toEqual(mockQuestions);
      expect(component.Q_array_one).toEqual(mockQuestions);
      expect(component.Q_array_two).toEqual(mockQuestions);
    });

    it('should handle error from getSecurityQuestions', () => {
      mockAuthService.getSecurityQuestions.and.returnValue(
        throwError({ message: 'Error' })
      );
      component.ngOnInit();
      // handleError is a no-op, just verify no crash
      expect(component).toBeTruthy();
    });
  });

  describe('initial state', () => {
    it('should have passwordSection false and questionsection true', () => {
      expect(component.passwordSection).toBeFalse();
      expect(component.questionsection).toBeTrue();
    });

    it('should have dynamictype as password', () => {
      expect(component.dynamictype).toBe('password');
    });

    it('should have empty selectedQuestions', () => {
      expect(component.selectedQuestions).toEqual([]);
    });
  });

  describe('showPWD / hidePWD', () => {
    it('should set dynamictype to text', () => {
      component.showPWD();
      expect(component.dynamictype).toBe('text');
    });

    it('should set dynamictype back to password', () => {
      component.showPWD();
      component.hidePWD();
      expect(component.dynamictype).toBe('password');
    });
  });

  describe('switch', () => {
    it('should set passwordSection true and questionsection false', () => {
      component.switch();
      expect(component.passwordSection).toBeTrue();
      expect(component.questionsection).toBeFalse();
    });
  });

  describe('updateQuestions', () => {
    it('should add a new question to selectedQuestions at the given position', () => {
      component.updateQuestions('q1', 0);
      expect(component.selectedQuestions[0]).toBe('q1');
    });

    it('should clear answer1 when position is 0', () => {
      component.answer1 = 'old answer';
      component.updateQuestions('q1', 0);
      expect(component.answer1).toBe('');
    });

    it('should clear answer2 when position is 1', () => {
      component.answer2 = 'old answer';
      component.updateQuestions('q2', 1);
      expect(component.answer2).toBe('');
    });

    it('should clear answer3 when position is 2', () => {
      component.answer3 = 'old answer';
      component.updateQuestions('q3', 2);
      expect(component.answer3).toBe('');
    });

    it('should alert when same question is selected at a different position', () => {
      component.selectedQuestions[0] = 'q1';
      component.updateQuestions('q1', 1);
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'This question is already selected. Choose unique question'
      );
    });

    it('should not alert when same question is reselected at the same position', () => {
      component.selectedQuestions[0] = 'q1';
      component.updateQuestions('q1', 0);
      expect(mockConfirmationService.alert).not.toHaveBeenCalled();
    });
  });

  describe('filter_function', () => {
    it('should remove the item with matching QuestionID', () => {
      const array = [
        { QuestionID: 1, Question: 'Q1' },
        { QuestionID: 2, Question: 'Q2' },
        { QuestionID: 3, Question: 'Q3' },
      ];
      const result = component.filter_function(2, array);
      expect(result.length).toBe(2);
      expect(result.find((q: any) => q.QuestionID === 2)).toBeUndefined();
    });

    it('should return same array when no match', () => {
      const array = [{ QuestionID: 1, Question: 'Q1' }];
      const result = component.filter_function(999, array);
      expect(result.length).toBe(1);
    });
  });

  describe('filterArrayOne', () => {
    it('should filter Q_array_one and Q_array_two', () => {
      component.Q_array_one = [...mockQuestions];
      component.Q_array_two = [...mockQuestions];
      component.filterArrayOne(1);
      expect(
        component.Q_array_one.find((q: any) => q.QuestionID === 1)
      ).toBeUndefined();
      expect(
        component.Q_array_two.find((q: any) => q.QuestionID === 1)
      ).toBeUndefined();
    });
  });

  describe('filterArrayTwo', () => {
    it('should filter Q_array_two and questions', () => {
      component.Q_array_two = [...mockQuestions];
      component.questions = [...mockQuestions];
      component.filterArrayTwo(2);
      expect(
        component.Q_array_two.find((q: any) => q.QuestionID === 2)
      ).toBeUndefined();
      expect(
        component.questions.find((q: any) => q.QuestionID === 2)
      ).toBeUndefined();
    });
  });

  describe('filterArrayThree', () => {
    it('should filter Q_array_one and questions', () => {
      component.Q_array_one = [...mockQuestions];
      component.questions = [...mockQuestions];
      component.filterArrayThree(3);
      expect(
        component.Q_array_one.find((q: any) => q.QuestionID === 3)
      ).toBeUndefined();
      expect(
        component.questions.find((q: any) => q.QuestionID === 3)
      ).toBeUndefined();
    });
  });

  describe('setSecurityQuestions', () => {
    it('should build dataArray and call switch when 3 unique questions selected', () => {
      spyOn(component, 'switch');
      component.selectedQuestions = ['q1', 'q2', 'q3'];
      component.question1 = 1;
      component.question2 = 2;
      component.question3 = 3;
      component.answer1 = 'a1';
      component.answer2 = 'a2';
      component.answer3 = 'a3';

      component.setSecurityQuestions();

      expect(component.dataArray.length).toBe(3);
      expect(component.dataArray[0].questionID).toBe(1);
      expect(component.dataArray[0].answers).toBe('a1');
      expect(component.dataArray[0].userID).toBe('456');
      expect(component.dataArray[0].createdBy).toBe('testuser');
      expect(component.switch).toHaveBeenCalled();
    });

    it('should alert when fewer than 3 questions are selected', () => {
      component.selectedQuestions = ['q1', 'q2'];
      component.setSecurityQuestions();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'All 3 questions should be different. Please check your selected questions'
      );
    });
  });

  describe('encrypt', () => {
    it('should return an encrypted string', () => {
      const result = component.encrypt('Piramal12Piramal', 'testPwd');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should produce different outputs due to random salt/IV', () => {
      const r1 = component.encrypt('Piramal12Piramal', 'testPwd');
      const r2 = component.encrypt('Piramal12Piramal', 'testPwd');
      expect(r1).not.toBe(r2);
    });
  });

  describe('keySize getter/setter', () => {
    it('should get and set keySize', () => {
      expect(component.keySize).toBe(256);
      component.keySize = 512;
      expect(component.keySize).toBe(512);
    });
  });

  describe('iterationCount getter/setter', () => {
    it('should get and set iterationCount', () => {
      expect(component.iterationCount).toBe(1989);
      component.iterationCount = 3000;
      expect(component.iterationCount).toBe(3000);
    });
  });

  describe('updatePassword', () => {
    it('should call saveUserSecurityQuestionsAnswer when passwords match', () => {
      component.confirmpwd = 'NewPass1!';
      component.dataArray = [{ questionID: 1, answers: 'a', userID: '456' }];
      mockAuthService.saveUserSecurityQuestionsAnswer.and.returnValue(
        of({ statusCode: 200, data: { transactionId: 'txn1' } })
      );
      mockAuthService.setNewPassword.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      mockAuthService.logout.and.returnValue(of({}));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      component.updatePassword('NewPass1!');

      expect(
        mockAuthService.saveUserSecurityQuestionsAnswer
      ).toHaveBeenCalledWith(component.dataArray);
    });

    it('should alert when passwords do not match', () => {
      component.confirmpwd = 'Other';
      component.updatePassword('NewPass1!');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        "Password doesn't match"
      );
    });

    it('should encrypt the password before sending', () => {
      component.confirmpwd = 'NewPass1!';
      component.dataArray = [];
      mockAuthService.saveUserSecurityQuestionsAnswer.and.returnValue(
        of({ statusCode: 200, data: { transactionId: 'txn1' } })
      );
      mockAuthService.setNewPassword.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      mockAuthService.logout.and.returnValue(of({}));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      component.updatePassword('NewPass1!');

      expect(component.password).toBeTruthy();
      expect(component.password).not.toBe('NewPass1!');
    });
  });

  describe('handleQuestionSaveSuccess', () => {
    it('should call setNewPassword when transactionId exists', () => {
      const response = {
        statusCode: 200,
        data: { transactionId: 'txn1' },
      };
      mockAuthService.setNewPassword.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      mockAuthService.logout.and.returnValue(of({}));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));

      component.handleQuestionSaveSuccess(response, 'encPwd');

      expect(mockAuthService.setNewPassword).toHaveBeenCalledWith(
        'testuser',
        'encPwd',
        'txn1'
      );
    });

    it('should alert error when response has no valid transactionId', () => {
      const response = {
        statusCode: 400,
        errorMessage: 'Save failed',
        data: {},
      };
      component.handleQuestionSaveSuccess(response, 'encPwd');
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Save failed',
        'error'
      );
    });

    it('throws on a null response (else-branch reads response.errorMessage, current behaviour)', () => {
      expect(() =>
        component.handleQuestionSaveSuccess(null, 'encPwd')
      ).toThrowError(TypeError);
      expect(mockAuthService.setNewPassword).not.toHaveBeenCalled();
    });
  });

  describe('handleQuestionSaveError', () => {
    it('should log the error', () => {
      spyOn(console, 'log');
      component.handleQuestionSaveError({ message: 'error' });
      expect(console.log).toHaveBeenCalledWith('question save error', {
        message: 'error',
      });
    });
  });

  describe('successCallback', () => {
    it('should alert success and call logout', () => {
      spyOn(component, 'logout');
      component.successCallback({ statusCode: 200 });
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Password changed successfully',
        'success'
      );
      expect(component.logout).toHaveBeenCalled();
    });
  });

  describe('errorCallback', () => {
    it('should log the response', () => {
      spyOn(console, 'log');
      component.errorCallback({ message: 'err' });
      expect(console.log).toHaveBeenCalledWith({ message: 'err' });
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to /login', () => {
      mockAuthService.logout.and.returnValue(of({}));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));
      spyOn(sessionStorage, 'clear');

      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear sessionStorage on successful navigation', done => {
      mockAuthService.logout.and.returnValue(of({}));
      mockRouter.navigate.and.returnValue(Promise.resolve(true));
      spyOn(sessionStorage, 'clear');

      component.logout();

      setTimeout(() => {
        expect(sessionStorage.clear).toHaveBeenCalled();
        done();
      });
    });

    it('should not clear sessionStorage when navigation returns false', done => {
      mockAuthService.logout.and.returnValue(of({}));
      mockRouter.navigate.and.returnValue(Promise.resolve(false));
      spyOn(sessionStorage, 'clear');

      component.logout();

      setTimeout(() => {
        expect(sessionStorage.clear).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('passwordPattern', () => {
    it('should match valid passwords', () => {
      expect(component.passwordPattern.test('Test1234!')).toBeTrue();
      expect(component.passwordPattern.test('Abcdefg1@')).toBeTrue();
    });

    it('should reject passwords without uppercase', () => {
      expect(component.passwordPattern.test('test1234!')).toBeFalse();
    });

    it('should reject passwords without numbers', () => {
      expect(component.passwordPattern.test('Testtest!')).toBeFalse();
    });

    it('should reject passwords without special characters', () => {
      expect(component.passwordPattern.test('Test12345')).toBeFalse();
    });

    it('should reject passwords shorter than 8 chars', () => {
      expect(component.passwordPattern.test('Te1!')).toBeFalse();
    });

    it('should reject passwords longer than 12 chars', () => {
      expect(component.passwordPattern.test('Test1234567890!')).toBeFalse();
    });
  });
});
