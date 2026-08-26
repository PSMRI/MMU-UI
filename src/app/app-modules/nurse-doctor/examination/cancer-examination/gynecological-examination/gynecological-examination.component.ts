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
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  DoCheck,
  EventEmitter,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CameraService } from '../../../../core/services/camera.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { DoctorService, NurseService } from '../../../shared/services';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-doctor-gynecological-examination',
  templateUrl: './gynecological-examination.component.html',
  styleUrls: ['./gynecological-examination.component.css'],
})
export class GynecologicalExaminationComponent implements OnInit, DoCheck {
  @Input()
  gynecologicalExaminationForm!: FormGroup;

  @Input()
  patientFileUploadDetailsForm!: FormGroup;
  @Input()
  viewFiles: any[] = [];

  @ViewChild('gynaecologicalImage')
  private gynaecologicalImage!: ElementRef;

  imagePoints: any;
  currentLanguageSet: any;
  uploadedFiles: File[] = [];
  fileDataChange: any = new EventEmitter<any[]>();
  fileObj: any = [];
  savedFileData: any = [];
  fileIDs: any = [];
  fileList!: FileList;
  fileData: any[] = [];

  constructor(
    private cameraService: CameraService,
    public httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private nurseService: NurseService,
    private labService: LabService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private doctorService: DoctorService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  checkWithRTIOrSTI() {
    this.gynecologicalExaminationForm.patchValue({ rTIOrSTIDetail: null });
  }

  get sufferedFromRTIOrSTI() {
    return this.gynecologicalExaminationForm.get('sufferedFromRTIOrSTI');
  }

  get observation() {
    return this.gynecologicalExaminationForm.get('observation');
  }

  uploadFile(event: any) {
    this.fileList = event.target.files;
    if (this.fileList.length > 0) {
      this.file = this.fileList[0];

      const fileNameExtension = this.file.name.split('.');
      const fileName = fileNameExtension[0];
      if (fileName !== undefined && fileName !== null && fileName !== '') {
        const validFormat = this.checkExtension(this.file);
        if (!validFormat) {
          this.confirmationService.alert(
            this.currentLanguageSet.invalidFileExtensionSupportedFileFormats,
            'error'
          );
        } else {
          if (this.fileList[0].size / 1000 / 1000 > this.maxFileSize) {
            this.confirmationService.alert(
              this.currentLanguageSet.fileSizeShouldNotExceed +
                ' ' +
                this.maxFileSize +
                ' ' +
                this.currentLanguageSet.mb,
              'error'
            );
          } else if (this.file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const fileContent = reader.result as string;
              const fileObj = {
                fileName: this.file?.name,
                fileExtension: '.' + this.file?.name.split('.').pop(),
                fileContent: fileContent.split(',')[1],
                isUploaded: false,
              };
              this.fileData.push(fileObj);
              this.fileDataChange.emit(this.fileData); // emit change
            };
            reader.readAsDataURL(this.file);
          }
        }
      } else
        this.confirmationService.alert(
          this.currentLanguageSet.invalidFileName,
          'error'
        );
    }
  }

  checkForDuplicateUpload() {
    if (this.fileData !== undefined) {
      if (this.savedFileData !== undefined) {
        if (this.fileData.length > this.savedFileData.length) {
          const result = this.fileData.filter((uniqueFileName: any) => {
            const arrNames = this.savedFileData.filter((savedFileName: any) => {
              if (uniqueFileName.isUploaded === savedFileName.isUploaded) {
                return true;
              } else {
                return false;
              }
            });
            if (arrNames.length === 0) {
              return true;
            } else {
              return false;
            }
          });
          if (result && result.length > 0) {
            this.fileObj = result;

            this.saveUploadDetails(result);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.pleaseselectfiletoupload,
              'info'
            );
          }
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.pleaseselectfiletoupload,
            'info'
          );
        }
      } else {
        this.saveUploadDetails(this.fileObj);
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.pleaseselectfiletoupload,
        'info'
      );
    }
  }

  saveUploadDetails(fileObj: any) {
    this.labService.saveFile(fileObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          res.data.forEach((file: any) => {
            this.savedFileData.push(file);
            this.fileIDs.push(file.filePath);

            this.gynecologicalExaminationForm.markAsDirty();
            this.gynecologicalExaminationForm.updateValueAndValidity();
            this.confirmationService.alert(
              'File Uploaded successfully',
              'success'
            );
          });
          this.fileObj.map((file: any) => {
            file.isUploaded = true;
          });
          this.savedFileData.map((file: any) => {
            file.isUploaded = true;
          });
        }
      },
      err => {
        this.confirmationService.alert(err.errorMessage, 'err');
      }
    );
    if (this.viewFiles && this.viewFiles.length > 0) {
      this.viewFiles.forEach((file: any) => {
        this.fileIDs.push(file.filePath);
      });
    }

    if (this.fileIDs !== null) {
      this.gynecologicalExaminationForm.patchValue({
        fileIDs: this.fileIDs,
      });
    } else {
      this.gynecologicalExaminationForm.patchValue({
        fileIDs: [],
      });
    }

    this.nurseService.fileData = null;
  }

  onLoadFileCallback = (event: any) => {
    const fileContent = event.currentTarget.result;
  };

  annotateImage() {
    this.cameraService
      .annotate(
        this.gynaecologicalImage.nativeElement.attributes.src.nodeValue,
        this.gynecologicalExaminationForm.controls['image'].value,
        this.currentLanguageSet
      )
      .subscribe(result => {
        if (result) {
          this.imagePoints = result;
          this.imagePoints.imageID = 4;
          this.gynecologicalExaminationForm.patchValue({
            image: this.imagePoints,
          });
          this.gynecologicalExaminationForm.markAsDirty();
        }
      });
  }

  maxFileSize = 5; // MB
  file: File | undefined;

  removeFile(index: number): void {
    this.fileData.splice(index, 1);
    this.updateFormFileIDs();
  }

  updateFormFileIDs(): void {
    const fileNames = this.fileData.map(f => f.name); // or server-generated IDs
    this.gynecologicalExaminationForm.patchValue({ fileIDs: fileNames });
  }

  checkExtension(file: File): boolean {
    const allowedExtensions = ['pdf', 'docx', 'jpg', 'png']; // add your valid extensions
    const extension = file.name.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(extension || '');
  }

  showError(message: string): void {
    this.confirmationService.alert(message, 'error');
  }

  triggerLog(event: any) {
    if (event.clientX !== 0) {
      const x = document.getElementById('files');
      x?.click();
    }
  }

  viewNurseSelectedFiles() {
    const ViewTestReport = this.dialog.open(
      ViewRadiologyUploadedFilesComponent,
      {
        width: '40%',
        data: {
          filesDetails: this.viewFiles,
          // width: 0.8 * window.innerWidth + "px",
          panelClass: 'dialog-width',
          disableClose: false,
        },
      }
    );
    ViewTestReport.afterClosed().subscribe(result => {
      if (result) {
        this.labService.viewFileContent(result).subscribe((res: any) => {
          const blob = new Blob([res], { type: res.type });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }
    });
  }
}
