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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { NurseService } from '../../shared/services/nurse.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { UploadFilesComponent } from './upload-files.component';

describe('UploadFilesComponent', () => {
  let component: UploadFilesComponent;
  let fixture: ComponentFixture<UploadFilesComponent>;
  let nurse: any;
  let doctor: any;
  let lab: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;

  const fileEvent = (files: any[]) => ({ target: { files } });

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    lab = autoSpy(LabService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [UploadFilesComponent],
      providers: [
        ...commonTestProviders({
          session: {
            userID: 7,
            serviceLineDetails: JSON.stringify({ vanID: 3 }),
          },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: LabService, useValue: lab },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: of(null) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(UploadFilesComponent, '');
    fixture = TestBed.createComponent(UploadFilesComponent);
    component = fixture.componentInstance;
    component.patientFileUploadDetailsForm = new FormGroup({
      fileIDs: new FormControl(null),
    });
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
    spyOn(console, 'log');
    component.ngOnInit();
  });

  it('ngOnInit / ngDoCheck set language', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('ngOnChanges', () => {
    it('disables selection in view mode without file selection', () => {
      component.mode = 'view';
      component.enableFileSelection = false;
      component.ngOnChanges();
      expect(component.disableFileSelection).toBeTrue();
    });

    it('enables NCD screening upload in view mode with file selection', () => {
      component.mode = 'view';
      component.enableFileSelection = true;
      component.ngOnChanges();
      expect(component.enableForNCDScreening).toBeTrue();
      expect(component.disableFileSelection).toBeFalse();
    });

    it('enables selection outside view mode', () => {
      component.disableFileSelection = true;
      component.mode = 'add';
      component.ngOnChanges();
      expect(component.disableFileSelection).toBeFalse();
    });
  });

  describe('checkExtension', () => {
    it('accepts valid extensions case-insensitively', () => {
      expect(component.checkExtension({ name: 'a.PDF' })).toBeTrue();
      expect(component.checkExtension({ name: 'a.docx' })).toBeTrue();
    });

    it('rejects unknown and multi-dot names', () => {
      expect(component.checkExtension({ name: 'a.exe' })).toBeFalse();
      expect(component.checkExtension({ name: 'a.b.pdf' })).toBeFalse();
    });

    it('treats a missing file as valid', () => {
      expect(component.checkExtension(null)).toBeTrue();
    });
  });

  describe('uploadFile', () => {
    it('ignores empty file lists', () => {
      component.uploadFile(fileEvent([]));
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(component.file).toBeUndefined();
    });

    it('alerts for invalid file name', () => {
      component.uploadFile(fileEvent([{ name: '.pdf', size: 10 }]));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.invalidFileName,
        'error'
      );
    });

    it('alerts for invalid extension', () => {
      component.uploadFile(fileEvent([{ name: 'virus.exe', size: 10 }]));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.invalidFileExtensionSupportedFileFormats,
        'error'
      );
    });

    it('alerts when file is too large', () => {
      component.uploadFile(
        fileEvent([{ name: 'big.pdf', size: 6 * 1000 * 1000 }])
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        `${LANGUAGE_EN.fileSizeShouldNotExceed} 5 ${LANGUAGE_EN.mb}`,
        'error'
      );
    });

    it('reads valid files as data URL', () => {
      const read = spyOn(FileReader.prototype, 'readAsDataURL');
      const file = new File(['abc'], 'report.pdf');
      component.uploadFile(fileEvent([file]));
      expect(read).toHaveBeenCalledWith(file);
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('file objects', () => {
    beforeEach(() => {
      component.file = { name: 'report.pdf' };
    });

    it('onLoadFileCallback builds a file manager entry', () => {
      component.onLoadFileCallback({
        currentTarget: { result: 'data:application/pdf;base64,QUJD' },
      });
      expect(component.fileObj).toEqual([
        {
          fileName: 'report.pdf',
          fileExtension: '.pdf',
          userID: 7,
          fileContent: 'QUJD',
          vanID: 3,
          isUploaded: false,
        },
      ]);
      expect(nurse.fileData).toBe(component.fileObj);
    });

    it('assignFileObject handles missing file and content', () => {
      component.file = undefined;
      component.assignFileObject(undefined);
      expect(component.fileObj[0].fileName).toBe('');
      expect(component.fileObj[0].fileExtension).toBe('');
      expect(component.fileObj[0].fileContent).toBe('');
    });

    it('remove deletes a known file and clears nurse file data', () => {
      component.assignFileObject('x,1');
      const f = component.fileObj[0];
      component.remove({ other: true });
      expect(component.fileObj.length).toBe(1);
      component.remove(f);
      expect(component.fileObj).toEqual([]);
      expect(nurse.fileData).toBeNull();
    });
  });

  describe('saveUploadDetails', () => {
    it('stores saved files, alerts and patches file IDs', () => {
      lab.saveFile.and.returnValue(
        of({ statusCode: 200, data: [{ filePath: 'p1' }, { filePath: 'p2' }] })
      );
      component.fileObj = [{ isUploaded: false }];
      component.saveUploadDetails(component.fileObj);
      expect(component.fileIDs).toEqual(['p1', 'p2']);
      expect(
        component.savedFileData.every((f: any) => f.isUploaded)
      ).toBeTrue();
      expect(component.fileObj[0].isUploaded).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith(
        'File Uploaded successfully',
        'success'
      );
      expect(component.uploadFiles).toEqual(['p1', 'p2']);
      expect(nurse.fileData).toBeNull();
    });

    it('does not store files on non-200', () => {
      lab.saveFile.and.returnValue(of({ statusCode: 5000 }));
      component.saveUploadDetails([]);
      expect(component.savedFileData).toEqual([]);
      expect(component.uploadFiles).toEqual([]);
    });

    it('patches empty list when fileIDs is null', () => {
      lab.saveFile.and.returnValue(of({ statusCode: 5000 }));
      component.fileIDs = null;
      component.saveUploadDetails([]);
      expect(component.uploadFiles).toEqual([]);
    });

    it('alerts on error', () => {
      lab.saveFile.and.returnValue(throwingObs({ errorMessage: 'fail' }));
      component.saveUploadDetails([]);
      expect(confirm.alert).toHaveBeenCalledWith('fail', 'err');
    });
  });

  describe('checkForDuplicateUpload', () => {
    const info = () =>
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pleaseselectfiletoupload,
        'info'
      );

    it('alerts when fileObj undefined', () => {
      component.fileObj = undefined;
      component.checkForDuplicateUpload();
      info();
    });

    it('uploads everything when savedFileData undefined', () => {
      spyOn(component, 'saveUploadDetails');
      component.fileObj = [{ isUploaded: false }];
      component.savedFileData = undefined;
      component.checkForDuplicateUpload();
      expect(component.saveUploadDetails).toHaveBeenCalledWith(
        component.fileObj
      );
    });

    it('alerts when no new files', () => {
      component.fileObj = [];
      component.checkForDuplicateUpload();
      info();
    });

    it('uploads only not-yet-uploaded files', () => {
      spyOn(component, 'saveUploadDetails');
      const fresh = { isUploaded: false };
      component.fileObj = [{ isUploaded: true }, fresh];
      component.savedFileData = [{ isUploaded: true }];
      component.checkForDuplicateUpload();
      expect(component.saveUploadDetails).toHaveBeenCalledWith([fresh]);
    });

    it('alerts when all pending files match saved state', () => {
      spyOn(component, 'saveUploadDetails');
      component.fileObj = [{ isUploaded: true }, { isUploaded: true }];
      component.savedFileData = [{ isUploaded: true }];
      component.checkForDuplicateUpload();
      expect(component.saveUploadDetails).not.toHaveBeenCalled();
      info();
    });
  });

  describe('viewNurseSelectedFiles', () => {
    it('opens dialog and downloads the chosen file', () => {
      const ref = createDialogRefMock({ fileName: 'r.pdf' });
      dialog.open.and.returnValue(ref);
      doctor.fileIDs = ['p1'];
      lab.viewFileContent.and.returnValue(of(new Blob(['x'])));
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:x');
      const click = spyOn(HTMLAnchorElement.prototype, 'click');
      component.viewNurseSelectedFiles();
      expect(dialog.open).toHaveBeenCalledWith(
        ViewRadiologyUploadedFilesComponent,
        jasmine.objectContaining({
          width: '40%',
          data: jasmine.objectContaining({ filesDetails: ['p1'] }),
        })
      );
      expect(lab.viewFileContent).toHaveBeenCalledWith({ fileName: 'r.pdf' });
      expect(click).toHaveBeenCalled();
    });

    it('does nothing when dialog closes without result', () => {
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.viewNurseSelectedFiles();
      expect(lab.viewFileContent).not.toHaveBeenCalled();
    });
  });

  describe('triggerLog', () => {
    it('clicks the hidden file input on real clicks', () => {
      const input = document.createElement('input');
      input.id = 'fileUpload';
      const click = spyOn(input, 'click');
      document.body.appendChild(input);
      component.triggerLog({ clientX: 10 });
      expect(click).toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('ignores keyboard-triggered clicks (clientX 0)', () => {
      const spy = spyOn(document, 'getElementById');
      component.triggerLog({ clientX: 0 });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('trackFieldInteraction forwards to tracking service', () => {
    component.trackFieldInteraction('Upload');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Upload',
      'Upload Files'
    );
  });
});
