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
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ViewFileComponent } from './view-file.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';

describe('ViewFileComponent', () => {
  let component: ViewFileComponent;
  let fixture: ComponentFixture<ViewFileComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewFileComponent>>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockHttpServiceService: jasmine.SpyObj<HttpServiceService>;

  const mockDialogData = {
    viewFileObj: {
      '123': [
        { fileName: 'file1.pdf', filePath: '/path/to/file1.pdf' },
        { fileName: 'file2.pdf', filePath: '/path/to/file2.pdf' },
      ],
    },
    procedureID: '123',
  };

  beforeEach(waitForAsync(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockHttpServiceService = jasmine.createSpyObj('HttpServiceService', [
      'setLanguage',
      'currentLangugae$',
    ]);

    mockHttpServiceService.currentLangugae$ = of({ languageID: 1 });

    TestBed.configureTestingModule({
      declarations: [ViewFileComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: HttpServiceService, useValue: mockHttpServiceService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set dialogRef.disableClose to true', () => {
      expect(mockDialogRef.disableClose).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should set fileObj from input viewFileObj using procedureID', () => {
      expect(component.fileObj).toBeDefined();
      expect(component.fileObj.length).toBe(2);
    });

    it('should call assignObject with viewFileObj and procedureID', () => {
      spyOn(component, 'assignObject');
      component.ngOnInit();
      expect(component.assignObject).toHaveBeenCalledWith(
        mockDialogData.viewFileObj,
        mockDialogData.procedureID
      );
    });
  });

  describe('assignObject', () => {
    it('should set fileObj to inputFileObj[procedureID]', () => {
      const inputFileObj = {
        '456': [{ fileName: 'test.pdf' }],
      };
      component.assignObject(inputFileObj, '456');
      expect(component.fileObj).toEqual([{ fileName: 'test.pdf' }]);
    });

    it('should set fileObj to undefined for non-existent procedureID', () => {
      const inputFileObj = {
        '456': [{ fileName: 'test.pdf' }],
      };
      component.assignObject(inputFileObj, '999');
      expect(component.fileObj).toBeUndefined();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      component.current_language_set = {
        alerts: { info: { wantToRemoveFile: 'Do you want to remove?' } },
      };
      // Reset the viewFileObj array for each test
      component.input.viewFileObj = {
        '123': [
          { fileName: 'file1.pdf', filePath: '/path/to/file1.pdf' },
          { fileName: 'file2.pdf', filePath: '/path/to/file2.pdf' },
        ],
      };
      component.input.procedureID = '123';
    });

    it('should call confirmationService.confirm with correct message', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      const file = component.input.viewFileObj['123'][0];
      component.remove(file);
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        'info',
        'Do you want to remove?'
      );
    });

    it('should remove file from array on confirmation', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      const file = component.input.viewFileObj['123'][0];
      component.remove(file);
      expect(component.input.viewFileObj['123'].length).toBe(1);
      expect(component.input.viewFileObj['123'][0].fileName).toBe('file2.pdf');
    });

    it('should not remove file when user declines', () => {
      mockConfirmationService.confirm.and.returnValue(of(false));
      const file = component.input.viewFileObj['123'][0];
      component.remove(file);
      expect(component.input.viewFileObj['123'].length).toBe(2);
    });

    it('should close dialog when array becomes empty after removal', () => {
      component.input.viewFileObj = {
        '123': [{ fileName: 'only-file.pdf', filePath: '/path/only.pdf' }],
      };
      mockConfirmationService.confirm.and.returnValue(of(true));
      const file = component.input.viewFileObj['123'][0];
      component.remove(file);
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not close dialog when array still has items after removal', () => {
      mockConfirmationService.confirm.and.returnValue(of(true));
      const file = component.input.viewFileObj['123'][0];
      component.remove(file);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('closeDialog', () => {
    it('should close dialog with viewFileObj as returnObj', () => {
      component.closeDialog();
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        component.input.viewFileObj
      );
    });
  });
});
