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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DOCUMENT } from '@angular/common';
import { of } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { CommonDialogComponent } from '../components/common-dialog/common-dialog.component';

describe('ConfirmationService', () => {
  let service: ConfirmationService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: any;

  beforeEach(() => {
    mockDialogRef = {
      componentInstance: {
        title: '',
        message: '',
        status: '',
        btnOkText: '',
        btnCancelText: '',
        confirmAlert: false,
        confirmcalibration: false,
        alert: false,
        remarks: false,
        editRemarks: false,
        comments: '',
        notify: false,
        mandatories: null,
        choice: false,
        values: null,
        choiceSelect: false,
        sessionTimeout: false,
        updateTimer: jasmine.createSpy('updateTimer'),
        confirmHealthID: false,
        alertFetsenseMessage: false,
        confirmCBAC: false,
        cbacData: null,
        confirmCareContext: false,
      },
      afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(true)),
      disableClose: false,
    };

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(mockDialogRef);

    TestBed.configureTestingModule({
      providers: [
        ConfirmationService,
        { provide: MatDialog, useValue: dialogSpy },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    service = TestBed.inject(ConfirmationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('confirm', () => {
    it('should open dialog with correct default parameters', () => {
      service.confirm('Test Title', 'Test Message');

      expect(dialogSpy.open).toHaveBeenCalledWith(CommonDialogComponent, {
        width: '420px',
        disableClose: false,
      });
      expect(mockDialogRef.componentInstance.title).toBe('Test Title');
      expect(mockDialogRef.componentInstance.message).toBe('Test Message');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('OK');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Cancel');
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(true);
      expect(mockDialogRef.componentInstance.confirmcalibration).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
      expect(mockDialogRef.componentInstance.remarks).toBe(false);
      expect(mockDialogRef.componentInstance.editRemarks).toBe(false);
      expect(mockDialogRef.disableClose).toBe(true);
    });

    it('should use custom OK and Cancel text', () => {
      service.confirm('Title', 'Msg', 'Yes', 'No');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Yes');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('No');
    });

    it('should return afterClosed observable', done => {
      service.confirm('Title', 'Msg').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('confirmHealthId', () => {
    it('should open dialog with confirmHealthID flag set', () => {
      service.confirmHealthId('Health Title', 'Health Msg');

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.title).toBe('Health Title');
      expect(mockDialogRef.componentInstance.message).toBe('Health Msg');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('OK');
      expect(mockDialogRef.componentInstance.confirmHealthID).toBe(true);
      expect(mockDialogRef.componentInstance.confirmcalibration).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
      expect(mockDialogRef.disableClose).toBe(true);
    });

    it('should accept custom OK text', () => {
      service.confirmHealthId('Title', 'Msg', 'Proceed');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Proceed');
    });

    it('should return afterClosed observable', done => {
      service.confirmHealthId('Title', 'Msg').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('alert', () => {
    it('should open dialog with alert flag set and default parameters', () => {
      const result = service.alert('Alert message');

      expect(dialogSpy.open).toHaveBeenCalledWith(CommonDialogComponent, {
        width: '420px',
      });
      expect(mockDialogRef.componentInstance.message).toBe('Alert message');
      expect(mockDialogRef.componentInstance.status).toBe('info');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('OK');
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(true);
      expect(mockDialogRef.componentInstance.remarks).toBe(false);
      expect(mockDialogRef.componentInstance.editRemarks).toBe(false);
      expect(result).toBe(mockDialogRef);
    });

    it('should convert status to lowercase', () => {
      service.alert('Msg', 'ERROR');

      expect(mockDialogRef.componentInstance.status).toBe('error');
    });

    it('should accept custom OK text', () => {
      service.alert('Msg', 'info', 'Got it');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Got it');
    });

    it('should return the MatDialogRef directly (not afterClosed)', () => {
      const ref = service.alert('test');
      expect(ref).toBe(mockDialogRef);
    });
  });

  describe('remarks', () => {
    it('should open dialog with remarks flag set', () => {
      service.remarks('Enter remarks');

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.message).toBe('Enter remarks');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Submit');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Cancel');
      expect(mockDialogRef.componentInstance.remarks).toBe(true);
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
      expect(mockDialogRef.componentInstance.editRemarks).toBe(false);
    });

    it('should accept custom parameters', () => {
      service.remarks('Msg', 'left', 'right', 'Save', 'Dismiss');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Save');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Dismiss');
    });

    it('should return afterClosed observable', done => {
      service.remarks('Msg').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('editRemarks', () => {
    it('should open dialog with editRemarks flag and comments', () => {
      service.editRemarks('Edit', 'Previous comment');

      expect(dialogSpy.open).toHaveBeenCalledWith(CommonDialogComponent, {
        width: '60%',
      });
      expect(mockDialogRef.componentInstance.message).toBe('Edit');
      expect(mockDialogRef.componentInstance.comments).toBe('Previous comment');
      expect(mockDialogRef.componentInstance.editRemarks).toBe(true);
      expect(mockDialogRef.componentInstance.remarks).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
    });

    it('should accept custom button text', () => {
      service.editRemarks('Msg', 'comments', 'l', 'r', 'Update', 'Back');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Update');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Back');
    });

    it('should return afterClosed observable', done => {
      service.editRemarks('Msg', 'comments').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('notify', () => {
    it('should open dialog with notify flag and mandatories', () => {
      const mandatories = ['field1', 'field2'];
      service.notify('Missing fields', mandatories);

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.message).toBe('Missing fields');
      expect(mockDialogRef.componentInstance.notify).toBe(true);
      expect(mockDialogRef.componentInstance.mandatories).toEqual(mandatories);
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
    });

    it('should return afterClosed observable', done => {
      service.notify('Msg', []).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('choice', () => {
    it('should open dialog with choice flag and values', () => {
      const values = ['option1', 'option2'];
      service.choice('Choose one', values);

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.message).toBe('Choose one');
      expect(mockDialogRef.componentInstance.choice).toBe(true);
      expect(mockDialogRef.componentInstance.values).toEqual(values);
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Confirm');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Cancel');
      expect(mockDialogRef.componentInstance.notify).toBe(false);
    });

    it('should accept custom button text', () => {
      service.choice('Msg', [], 'c', 'c', 'Pick', 'Skip');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Pick');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Skip');
    });

    it('should return afterClosed observable', done => {
      service.choice('Msg', []).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('startTimer', () => {
    it('should open dialog with sessionTimeout and call updateTimer', () => {
      service.startTimer('Session', 'Expiring', 300);

      expect(dialogSpy.open).toHaveBeenCalledWith(CommonDialogComponent, {
        width: '420px',
        disableClose: true,
      });
      expect(mockDialogRef.componentInstance.title).toBe('Session');
      expect(mockDialogRef.componentInstance.message).toBe('Expiring');
      expect(mockDialogRef.componentInstance.sessionTimeout).toBe(true);
      expect(mockDialogRef.componentInstance.updateTimer).toHaveBeenCalledWith(
        300
      );
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Continue');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Cancel');
    });

    it('should return afterClosed observable', done => {
      service.startTimer('T', 'M', 60).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('choiceSelect', () => {
    it('should open dialog with choiceSelect flag and values', () => {
      const values = [{ id: 1, name: 'A' }];
      service.choiceSelect('Select', values);

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.message).toBe('Select');
      expect(mockDialogRef.componentInstance.choiceSelect).toBe(true);
      expect(mockDialogRef.componentInstance.choice).toBe(false);
      expect(mockDialogRef.componentInstance.values).toEqual(values);
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Proceed');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Cancel');
    });

    it('should return afterClosed observable', done => {
      service.choiceSelect('Msg', []).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('alertFetsenseMessage', () => {
    it('should open dialog with alertFetsenseMessage flag', () => {
      service.alertFetsenseMessage('Fetosense connected');

      expect(dialogSpy.open).toHaveBeenCalledWith(CommonDialogComponent, {
        width: '420px',
      });
      expect(mockDialogRef.componentInstance.message).toBe(
        'Fetosense connected'
      );
      expect(mockDialogRef.componentInstance.status).toBe('Fetosense Device');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('OK');
      expect(mockDialogRef.componentInstance.alertFetsenseMessage).toBe(true);
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
      expect(mockDialogRef.componentInstance.remarks).toBe(false);
    });

    it('should accept custom status and button text', () => {
      service.alertFetsenseMessage('Msg', 'Custom Status', 'Close');

      expect(mockDialogRef.componentInstance.status).toBe('Custom Status');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Close');
    });

    it('should not return anything (void)', () => {
      const result = service.alertFetsenseMessage('msg');
      expect(result).toBeUndefined();
    });
  });

  describe('confirmCalibration', () => {
    it('should open dialog with confirmcalibration flag', () => {
      service.confirmCalibration('Calibrate?', 'Please calibrate');

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.title).toBe('Calibrate?');
      expect(mockDialogRef.componentInstance.message).toBe('Please calibrate');
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Yes');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('No');
      expect(mockDialogRef.componentInstance.confirmcalibration).toBe(true);
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
    });

    it('should return afterClosed observable', done => {
      service.confirmCalibration('T', 'M').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('confirmCBAC', () => {
    it('should open dialog with confirmCBAC flag and data', () => {
      const cbacData = { score: 5 };
      service.confirmCBAC('CBAC', 'Review CBAC', cbacData);

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.title).toBe('CBAC');
      expect(mockDialogRef.componentInstance.message).toBe('Review CBAC');
      expect(mockDialogRef.componentInstance.confirmCBAC).toBe(true);
      expect(mockDialogRef.componentInstance.cbacData).toEqual(cbacData);
      expect(mockDialogRef.componentInstance.btnOkText).toBe('OK');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Cancel');
    });

    it('should accept custom button text', () => {
      service.confirmCBAC('T', 'M', {}, 'Proceed', 'Dismiss');

      expect(mockDialogRef.componentInstance.btnOkText).toBe('Proceed');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('Dismiss');
    });

    it('should return afterClosed observable', done => {
      service.confirmCBAC('T', 'M', {}).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('confirmCareContext', () => {
    it('should open dialog with confirmCareContext flag', () => {
      service.confirmCareContext('Care Context', 'Confirm context');

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.title).toBe('Care Context');
      expect(mockDialogRef.componentInstance.message).toBe('Confirm context');
      expect(mockDialogRef.componentInstance.confirmCareContext).toBe(true);
      expect(mockDialogRef.componentInstance.confirmCBAC).toBe(false);
      expect(mockDialogRef.componentInstance.confirmcalibration).toBe(false);
      expect(mockDialogRef.componentInstance.confirmAlert).toBe(false);
      expect(mockDialogRef.componentInstance.alert).toBe(false);
      expect(mockDialogRef.componentInstance.btnOkText).toBe('Yes');
      expect(mockDialogRef.componentInstance.btnCancelText).toBe('No');
      expect(mockDialogRef.disableClose).toBe(true);
    });

    it('should return afterClosed observable', done => {
      service.confirmCareContext('T', 'M').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });
});
