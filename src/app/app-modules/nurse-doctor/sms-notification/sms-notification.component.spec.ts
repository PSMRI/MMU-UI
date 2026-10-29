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
import { BehaviorSubject, of, throwError } from 'rxjs';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SmsNotificationComponent } from './sms-notification.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SmsTemplateService } from '../smsTemplate/sms-template.service';
import { ConfirmationService } from '../../core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('SmsNotificationComponent', () => {
  let component: SmsNotificationComponent;
  let fixture: ComponentFixture<SmsNotificationComponent>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSmsService: jasmine.SpyObj<SmsTemplateService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SmsNotificationComponent>>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;

  const mockLanguageObject = { sms: 'SMS', send: 'Send' };

  const mockDialogData = {
    prescribedDrugs: [
      {
        beneficiaryRegID: '123',
        prescribedDrugID: '456',
        drug: 'Paracetamol',
        strength: '500mg',
        frequency: 'Twice daily',
        noOfDays: 5,
        remarks: 'After food',
        diagnosisProvided: 'Fever',
        prescriptionID: 'P001',
      },
      {
        beneficiaryRegID: '123',
        prescribedDrugID: '789',
        drug: 'Amoxicillin',
        strength: '250mg',
        frequency: 'Thrice daily',
        noOfDays: 7,
        remarks: 'Before food',
        diagnosisProvided: 'Infection',
        prescriptionID: 'P002',
      },
    ],
  };

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj(
      'HttpServiceService',
      ['fetchLanguageSet'],
      {
        currentLangugae$: new BehaviorSubject(
          mockLanguageObject
        ).asObservable(),
      }
    );
    mockSmsService = jasmine.createSpyObj('SmsTemplateService', [
      'getSMStypes',
      'getSMStemplates',
      'sendSMS',
    ]);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);

    TestBed.configureTestingModule({
      declarations: [SmsNotificationComponent],
      providers: [
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SmsTemplateService, useValue: mockSmsService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmsNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should create MatTableDataSource from prescribedDrugs', () => {
      expect(component.dataSource).toBeDefined();
      expect(component.dataSource.data).toEqual(mockDialogData.prescribedDrugs);
    });

    it('should call assignSelectedLanguage', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngOnInit();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });
  });

  describe('ngDoCheck', () => {
    it('should call assignSelectedLanguage', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngDoCheck();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });
  });

  describe('assignSelectedLanguage', () => {
    it('should set currentLanguageSet', () => {
      component.assignSelectedLanguage();
      expect(component.currentLanguageSet).toEqual(mockLanguageObject);
    });
  });

  describe('mobileNum', () => {
    it('should set validNumber to true when value length is 10', () => {
      component.mobileNum('9876543210');
      expect(component.validNumber).toBeTrue();
    });

    it('should set validNumber to false when value length is less than 10', () => {
      component.mobileNum('12345');
      expect(component.validNumber).toBeFalse();
    });

    it('should set validNumber to false when value length is more than 10', () => {
      component.mobileNum('12345678901');
      expect(component.validNumber).toBeFalse();
    });

    it('should set validNumber to false for empty string', () => {
      component.mobileNum('');
      expect(component.validNumber).toBeFalse();
    });
  });

  describe('sendSMS', () => {
    it('should not proceed when currentServiceID is undefined', () => {
      mockSessionStorage.getItem.and.returnValue(undefined);
      component.sendSMS();
      expect(mockSmsService.getSMStypes).not.toHaveBeenCalled();
    });

    it('should chain SMS service calls and close dialog on success', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        const store: Record<string, string> = {
          currentServiceID: 'svc1',
          providerServiceMapID: 'psm1',
          phnum: '9876543210',
          userName: 'testUser',
          providerServiceID: 'ps1',
        };
        return store[key];
      });

      mockSmsService.getSMStypes.and.returnValue(
        of({
          data: [
            { smsType: 'MMUPrescription SMS', smsTypeID: 'type1' },
            { smsType: 'Other SMS', smsTypeID: 'type2' },
          ],
        })
      );

      mockSmsService.getSMStemplates.and.returnValue(
        of({
          data: [
            { smsTemplateID: 'tpl1', deleted: false },
            { smsTemplateID: 'tpl2', deleted: true },
          ],
        })
      );

      mockSmsService.sendSMS.and.returnValue(of({ statusCode: 200 }));

      component.sendSMS();

      expect(mockSmsService.getSMStypes).toHaveBeenCalledWith('svc1');
      expect(mockSmsService.getSMStemplates).toHaveBeenCalledWith(
        'psm1',
        'type1'
      );
      expect(mockSmsService.sendSMS).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'SMS sent successfully',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Data saved successfully',
        'success'
      );
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should use mobileNumber when phnum is Not Available', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        const store: Record<string, string> = {
          currentServiceID: 'svc1',
          providerServiceMapID: 'psm1',
          phnum: 'Not Available',
          userName: 'testUser',
          providerServiceID: 'ps1',
        };
        return store[key];
      });

      mockSmsService.getSMStypes.and.returnValue(
        of({
          data: [{ smsType: 'MMUPrescription SMS', smsTypeID: 'type1' }],
        })
      );
      mockSmsService.getSMStemplates.and.returnValue(
        of({ data: [{ smsTemplateID: 'tpl1', deleted: false }] })
      );
      mockSmsService.sendSMS.and.returnValue(of({ statusCode: 200 }));

      component.mobileNumber = '1234567890';
      component.sendSMS();

      const sendSMSArg = mockSmsService.sendSMS.calls.mostRecent().args[0];
      expect(sendSMSArg[0].alternateNo).toBe('1234567890');
    });

    it('should show error snackbar on SMS send failure', () => {
      mockSessionStorage.getItem.and.callFake((key: string) => {
        const store: Record<string, string> = {
          currentServiceID: 'svc1',
          providerServiceMapID: 'psm1',
          phnum: '9876543210',
          userName: 'testUser',
          providerServiceID: 'ps1',
        };
        return store[key];
      });

      mockSmsService.getSMStypes.and.returnValue(
        of({
          data: [{ smsType: 'MMUPrescription SMS', smsTypeID: 'type1' }],
        })
      );
      mockSmsService.getSMStemplates.and.returnValue(
        of({ data: [{ smsTemplateID: 'tpl1', deleted: false }] })
      );
      mockSmsService.sendSMS.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.sendSMS();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'SMS not sent',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });
  });

  describe('allowOnlyNumbers', () => {
    it('should prevent non-numeric keypress', () => {
      const event = {
        which: 65,
        keyCode: 65,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;

      component.allowOnlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric keypress (digit 0 = charCode 48)', () => {
      const event = {
        which: 48,
        keyCode: 48,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;

      component.allowOnlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow numeric keypress (digit 9 = charCode 57)', () => {
      const event = {
        which: 57,
        keyCode: 57,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;

      component.allowOnlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should use keyCode when which is 0', () => {
      const event = {
        which: 0,
        keyCode: 65,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;

      component.allowOnlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('displayedColumns', () => {
    it('should have the expected columns', () => {
      expect(component.displayedColumns).toEqual([
        'prescriptionID',
        'diagnosisProvided',
        'drug',
        'strength',
        'frequency',
        'noOfDays',
        'remarks',
      ]);
    });
  });
});
