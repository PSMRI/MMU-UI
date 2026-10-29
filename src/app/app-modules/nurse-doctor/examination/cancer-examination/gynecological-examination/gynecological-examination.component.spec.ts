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
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { GynecologicalExaminationComponent } from './gynecological-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import { MaterialModule } from '../../../../core/material.module';
import { DoctorService, NurseService } from '../../../shared/services';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('GynecologicalExaminationComponent', () => {
  let component: GynecologicalExaminationComponent;
  let fixture: ComponentFixture<GynecologicalExaminationComponent>;
  let camera: any;
  let lab: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let form: FormGroup;

  function fileEvent(files: File[]) {
    return { target: { files } };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GynecologicalExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: autoSpy(CameraService) },
        { provide: LabService, useValue: autoSpy(LabService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GynecologicalExaminationComponent);
    component = fixture.componentInstance;
    camera = TestBed.inject(CameraService) as any;
    lab = TestBed.inject(LabService) as any;
    nurse = TestBed.inject(NurseService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    form = new CancerUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createGynecologicalExaminationForm();
    component.gynecologicalExaminationForm = form;
    fixture.detectChanges();
  });

  it('creates and loads language', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('exposes getters and resets RTI detail', () => {
    expect(component.sufferedFromRTIOrSTI).toBe(
      form.get('sufferedFromRTIOrSTI')
    );
    expect(component.observation).toBe(form.get('observation'));
    form.patchValue({ rTIOrSTIDetail: 'x' });
    component.checkWithRTIOrSTI();
    expect(form.value.rTIOrSTIDetail).toBeNull();
  });

  it('renders the file upload section when RTI/STI is reported', () => {
    form.patchValue({ sufferedFromRTIOrSTI: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#files')).not.toBeNull();
  });

  describe('uploadFile', () => {
    it('ignores empty file lists', () => {
      component.uploadFile(fileEvent([]));
      expect(component.file).toBeUndefined();
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('rejects files without a name', () => {
      component.uploadFile(fileEvent([new File(['a'], '.png')]));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.invalidFileName,
        'error'
      );
    });

    it('rejects invalid extensions', () => {
      component.uploadFile(fileEvent([new File(['a'], 'virus.exe')]));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.invalidFileExtensionSupportedFileFormats,
        'error'
      );
    });

    it('rejects files larger than max size', () => {
      component.maxFileSize = 0;
      component.uploadFile(fileEvent([new File(['abc'], 'big.pdf')]));
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.fileSizeShouldNotExceed + ' 0 ' + LANGUAGE_EN.mb,
        'error'
      );
    });

    it('reads a valid file and emits fileData', done => {
      component.fileDataChange.subscribe((data: any[]) => {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          fileName: 'report.png',
          fileExtension: '.png',
          fileContent: btoa('hello'),
          isUploaded: false,
        });
        done();
      });
      component.uploadFile(fileEvent([new File(['hello'], 'report.png')]));
    });
  });

  describe('checkForDuplicateUpload', () => {
    beforeEach(() => spyOn(component, 'saveUploadDetails'));

    it('alerts when fileData is undefined', () => {
      component.fileData = undefined as any;
      component.checkForDuplicateUpload();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pleaseselectfiletoupload,
        'info'
      );
    });

    it('saves fileObj when savedFileData is undefined', () => {
      component.fileData = [];
      component.savedFileData = undefined;
      component.fileObj = [{ a: 1 }];
      component.checkForDuplicateUpload();
      expect(component.saveUploadDetails).toHaveBeenCalledWith([{ a: 1 }]);
    });

    it('alerts when there are no new files', () => {
      component.fileData = [];
      component.savedFileData = [];
      component.checkForDuplicateUpload();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pleaseselectfiletoupload,
        'info'
      );
    });

    it('saves only files not matching saved upload state', () => {
      const f = { fileName: 'a', isUploaded: false };
      component.fileData = [f];
      component.savedFileData = [];
      component.checkForDuplicateUpload();
      expect(component.fileObj).toEqual([f]);
      expect(component.saveUploadDetails).toHaveBeenCalledWith([f]);
    });

    it('alerts when every new file matches a saved one', () => {
      component.fileData = [
        { fileName: 'a', isUploaded: true },
        { fileName: 'b', isUploaded: true },
      ];
      component.savedFileData = [{ fileName: 'a', isUploaded: true }];
      component.checkForDuplicateUpload();
      expect(component.saveUploadDetails).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pleaseselectfiletoupload,
        'info'
      );
    });
  });

  describe('saveUploadDetails', () => {
    it('stores saved files and patches file IDs on success', () => {
      const obj = [{ fileName: 'a', isUploaded: false }];
      component.fileObj = obj;
      component.viewFiles = [{ filePath: 'old/path' }];
      lab.saveFile.and.returnValue(
        of({ statusCode: 200, data: [{ filePath: 'new/path' }] })
      );
      component.saveUploadDetails(obj);
      expect(lab.saveFile).toHaveBeenCalledWith(obj);
      expect(component.savedFileData).toEqual([
        { filePath: 'new/path', isUploaded: true },
      ]);
      expect(obj[0].isUploaded).toBeTrue();
      expect(form.value.fileIDs).toEqual(['new/path', 'old/path']);
      expect(form.dirty).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith(
        'File Uploaded successfully',
        'success'
      );
      expect(nurse.fileData).toBeNull();
    });

    it('does nothing with a non-200 response', () => {
      lab.saveFile.and.returnValue(of({ statusCode: 500 }));
      component.viewFiles = [];
      component.saveUploadDetails([]);
      expect(component.savedFileData).toEqual([]);
      expect(form.value.fileIDs).toEqual([]);
    });

    it('alerts on error', () => {
      lab.saveFile.and.returnValue(throwingObs({ errorMessage: 'oops' }));
      component.saveUploadDetails([]);
      expect(confirm.alert).toHaveBeenCalledWith('oops', 'err');
    });

    it('patches empty array when fileIDs is null', () => {
      lab.saveFile.and.returnValue(of({ statusCode: 500 }));
      component.viewFiles = null as any;
      component.fileIDs = null;
      component.saveUploadDetails([]);
      expect(form.value.fileIDs).toEqual([]);
    });
  });

  it('onLoadFileCallback reads the target result', () => {
    expect(() =>
      component.onLoadFileCallback({ currentTarget: { result: 'x' } })
    ).not.toThrow();
  });

  it('annotateImage stores points with imageID 4', () => {
    camera.annotate.and.returnValue(of({ markers: [] }));
    (
      fixture.nativeElement.querySelector(
        '#annotateGynecologicalImg'
      ) as HTMLElement
    ).click();
    expect(camera.annotate).toHaveBeenCalledWith(
      'assets/images/gynecologicalExamination.png',
      null,
      LANGUAGE_EN
    );
    expect(form.value.image).toEqual({ markers: [], imageID: 4 });
    expect(form.dirty).toBeTrue();
  });

  it('annotateImage ignores empty result', () => {
    camera.annotate.and.returnValue(of(null));
    component.annotateImage();
    expect(form.value.image).toBeNull();
  });

  it('removeFile drops the file and updates fileIDs', () => {
    component.fileData = [{ fileName: 'a' }, { fileName: 'b' }];
    component.removeFile(0);
    expect(component.fileData).toEqual([{ fileName: 'b' }]);
    // updateFormFileIDs maps `name`, which file objects do not have
    expect(form.value.fileIDs).toEqual([undefined]);
  });

  it('checkExtension validates allowed extensions', () => {
    expect(component.checkExtension(new File([''], 'a.PDF'))).toBeTrue();
    expect(component.checkExtension(new File([''], 'a.docx'))).toBeTrue();
    expect(component.checkExtension(new File([''], 'a.gif'))).toBeFalse();
  });

  it('showError alerts the message', () => {
    component.showError('bad');
    expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
  });

  it('triggerLog clicks the file input only for real clicks', () => {
    form.patchValue({ sufferedFromRTIOrSTI: true });
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#files') as HTMLElement;
    const clickSpy = spyOn(input, 'click');
    component.triggerLog({ clientX: 0 });
    expect(clickSpy).not.toHaveBeenCalled();
    component.triggerLog({ clientX: 10 });
    expect(clickSpy).toHaveBeenCalled();
  });

  describe('viewNurseSelectedFiles', () => {
    it('opens the viewer and downloads the chosen file', () => {
      const file = { fileName: 'r.pdf', filePath: 'p' };
      component.viewFiles = [file];
      dialog.open.and.returnValue(createDialogRefMock(file));
      lab.viewFileContent.and.returnValue(of(new Blob(['x'])));
      const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:x');
      component.viewNurseSelectedFiles();
      expect(dialog.open).toHaveBeenCalledWith(
        ViewRadiologyUploadedFilesComponent,
        jasmine.objectContaining({
          width: '40%',
          data: jasmine.objectContaining({ filesDetails: [file] }),
        })
      );
      expect(lab.viewFileContent).toHaveBeenCalledWith(file);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('does nothing when the viewer closes without a selection', () => {
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.viewNurseSelectedFiles();
      expect(lab.viewFileContent).not.toHaveBeenCalled();
    });
  });
});
