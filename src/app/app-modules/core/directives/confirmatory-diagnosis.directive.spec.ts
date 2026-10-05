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

import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';
import { ConfirmatoryDiagnosisDirective } from './confirmatory-diagnosis.directive';
import { HttpServiceService } from '../services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  template: `
    <div [formGroup]="parentForm">
      <div formArrayName="diagnosisList">
        <div [formGroupName]="0">
          <input
            formControlName="confirmatoryDiagnosis"
            appConfirmatoryDiagnosis
            [diagnosisListForm]="diagnosisGroup"
            [previousSelected]="previousSelected" />
          <button
            appConfirmatoryDiagnosis
            [diagnosisListForm]="diagnosisGroup"
            [previousSelected]="previousSelected">
            Search
          </button>
        </div>
      </div>
    </div>
  `,
})
class TestHostComponent {
  previousSelected: any[] = [];
  parentForm: FormGroup;
  diagnosisGroup: FormGroup;

  constructor(private fb: FormBuilder) {
    this.parentForm = this.fb.group({
      diagnosisList: this.fb.array([
        this.fb.group({
          confirmatoryDiagnosis: [''],
          term: [''],
          conceptID: [''],
        }),
      ]),
    });
    const diagArray = this.parentForm.get('diagnosisList') as FormArray;
    this.diagnosisGroup = diagArray.at(0) as FormGroup;
  }
}

describe('ConfirmatoryDiagnosisDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;
  let languageSubject: BehaviorSubject<any>;

  beforeEach(() => {
    languageSubject = new BehaviorSubject<any>({
      confirmDiagnosis: 'Confirmatory Diagnosis',
    });

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockHttpService = jasmine.createSpyObj('HttpServiceService', [], {
      currentLangugae$: languageSubject.asObservable(),
    });
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);
    mockSessionStorage.getItem.and.returnValue(null);

    TestBed.configureTestingModule({
      declarations: [ConfirmatoryDiagnosisDirective, TestHostComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: MatDialog, useValue: mockDialog },
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create directives on host elements', () => {
    const directives = fixture.debugElement.queryAll(
      By.directive(ConfirmatoryDiagnosisDirective)
    );
    expect(directives.length).toBe(2);
  });

  it('should fetch language response on init', () => {
    const buttonEl = fixture.debugElement.queryAll(
      By.directive(ConfirmatoryDiagnosisDirective)
    )[1];
    const directive = buttonEl.injector.get(ConfirmatoryDiagnosisDirective);
    expect(directive.currentLanguageSet).toBeDefined();
    expect(directive.currentLanguageSet.confirmDiagnosis).toBe(
      'Confirmatory Diagnosis'
    );
  });

  describe('click handler', () => {
    it('should open dialog when non-INPUT element is clicked', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('click', null);

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should NOT open dialog when INPUT element is clicked', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');

      const inputEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[0];
      inputEl.triggerEventHandler('click', null);

      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('keyup.enter handler', () => {
    it('should open dialog on Enter key', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('keyup.enter', null);

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('openDialog', () => {
    it('should not open dialog when search term is 2 chars or less', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('ab');

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('click', null);

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should pass correct data to dialog', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');
      component.previousSelected = [{ term: 'existing' }];
      fixture.detectChanges();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('click', null);

      const callArgs: any[] = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1]?.data.searchTerm).toBe('Diabetes mellitus');
      expect(callArgs[1]?.data.addedDiagnosis).toEqual([{ term: 'existing' }]);
      expect(callArgs[1]?.data.diagonasisType).toBe('Confirmatory Diagnosis');
      expect(callArgs[1]?.width).toBe('800px');
    });

    it('should handle dialog result with diagnosis data', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');

      const result = [{ term: 'Type 2 Diabetes', conceptID: 'C001' }];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(result));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('click', null);

      expect(diagGroup.controls['term'].value).toBe('Type 2 Diabetes');
      expect(diagGroup.controls['conceptID'].value).toBe('C001');
      expect(diagGroup.controls['confirmatoryDiagnosis'].value).toBe(
        'Type 2 Diabetes'
      );
      expect(diagGroup.controls['confirmatoryDiagnosis'].disabled).toBeTrue();
    });

    it('should not modify form when dialog returns null', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');
      diagGroup.controls['term'].setValue('');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('click', null);

      expect(diagGroup.controls['term'].value).toBe('');
    });

    it('should not modify form when dialog returns undefined (falsy)', () => {
      const diagArray = component.parentForm.get('diagnosisList') as FormArray;
      const diagGroup = diagArray.at(0) as FormGroup;
      diagGroup.controls['confirmatoryDiagnosis'].setValue('Diabetes mellitus');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(undefined));
      mockDialog.open.and.returnValue(dialogRefSpy);

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      buttonEl.triggerEventHandler('click', null);

      expect(diagGroup.controls['term'].value).toBe('');
    });
  });

  describe('ngDoCheck', () => {
    it('should call fetchLanguageResponse on each change detection cycle', () => {
      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      const directive = buttonEl.injector.get(ConfirmatoryDiagnosisDirective);
      spyOn(directive, 'fetchLanguageResponse');
      directive.ngDoCheck();
      expect(directive.fetchLanguageResponse).toHaveBeenCalled();
    });
  });

  describe('fetchLanguageResponse', () => {
    it('should update currentLanguageSet from HttpServiceService', () => {
      languageSubject.next({
        confirmDiagnosis: 'Updated Diagnosis',
      });

      const buttonEl = fixture.debugElement.queryAll(
        By.directive(ConfirmatoryDiagnosisDirective)
      )[1];
      const directive = buttonEl.injector.get(ConfirmatoryDiagnosisDirective);
      directive.fetchLanguageResponse();

      expect(directive.currentLanguageSet.confirmDiagnosis).toBe(
        'Updated Diagnosis'
      );
    });
  });
});
