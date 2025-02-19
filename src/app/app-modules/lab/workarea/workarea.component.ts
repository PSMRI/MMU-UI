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

import { DataManipulation } from './LabSubmissionDataManipulation';
import { Component, OnInit, ViewChild, DoCheck } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { LabService, MasterDataService } from '../shared/services';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { LabUtils } from './../shared/utility/lab-utility';
import { CanComponentDeactivate } from '../../core/services/can-deactivate-guard.service';
import { ViewFileComponent } from './../view-file/view-file.component';
import { ViewRadiologyUploadedFilesComponent } from '../../core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { Observable, of } from 'rxjs';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.css'],
})
export class WorkareaComponent
  implements OnInit, DoCheck, CanComponentDeactivate
{
  @ViewChild('sidenav')
  sidenav: any;

  utils = new LabUtils(this.fb);
  dataLoad = new DataManipulation();

  beneficiaryRegID: any;
  visitID: any;
  visitCode: any;
  technicianForm!: FormGroup;
  labForm!: FormArray;
  radiologyForm!: FormArray;
  externalForm!: FormGroup;
  archiveList: any = [];
  filteredArchiveList: any = [];
  blankTable = [undefined, undefined, undefined, undefined];
  loadingErrorMessage =
    'There were some issues fetching Beneficiary Information, Please try again.';
  valid_file_extensions = [
    'msg',
    'pdf',
    'png',
    'jpeg',
    'jpg',
    'doc',
    'docx',
    'xlsx',
    'xls',
    'csv',
    'txt',
  ];
  // invalid_file_extensions_flag: boolean = false;
  stepExpand!: number;
  stripSelected: boolean = true;
  testName!: string;
  current_language_set: any;
  maxFileSize = 5;
  ecgAbnormalities: any;
  enableEcgAbnormal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private router: Router,
    private masterdataService: MasterDataService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private labService: LabService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.visitID = this.sessionstorage.getItem('visitID');
    this.visitCode = this.sessionstorage.getItem('visitCode');
    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');

    this.getTestRequirements();
    this.stepExpand = 0;
    this.testName = environment.RBSTest;
    this.getEcgAbnormalities();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  /**
   * MERGE ALL 3 FORMS after getting data
   */
  mergeForms() {
    this.technicianForm = this.utils.createLabMasterForm();
    this.technicianForm.setControl('labForm', this.labForm);
    this.technicianForm.setControl('radiologyForm', this.radiologyForm);
    this.technicianForm.setControl('externalForm', this.externalForm);
    console.log(
      'full wala form here',
      this.technicianForm,
      'valuessss',
      JSON.stringify(this.technicianForm.value, null, 4)
    );
  }

  /////////////////////////////// CALLING AND LOADING ALL TESTS CODE BELOW/////////////////////////////
  /**
   * Call Service for getting Test Details Requirements
   */
  getTestRequirements() {
    if (this.visitID && this.beneficiaryRegID && this.visitCode) {
      this.masterdataService
        .getLabRequirements(this.beneficiaryRegID, this.visitID, this.visitCode)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data) {
              /**
               * Get Test Requirements populated to UI -- CALLED
               */
              this.loadTests(res.data);
            } else {
              //else condition
            }
          },
          error => {
            this.errorLoading(this.loadingErrorMessage);
          }
        );
    } else {
      this.errorLoading(this.loadingErrorMessage);
    }
  }

  // labTechnicianData(): AbstractControl[] | null {
  //   const diseaseFormsArrayControl =
  //     this.technicianForm.get('labForm');
  //   return diseaseFormsArrayControl instanceof FormArray
  //     ? diseaseFormsArrayControl.value
  //     : null;
  // }
  // labTechnicianData

  labTechnicianData(): any {
    console.log('labTechnicianData', this.technicianForm.get('labForm'));
    return (this.technicianForm.get('labForm') as FormArray).controls;
  }

  radiologyFormData(): any {
    return (this.technicianForm.get('radiologyForm') as FormArray).controls;
  }

  externalFormData(): any {
    return (this.technicianForm.get('externalForm') as FormArray).controls;
  }

  /**
   * Get Test Requirements populated to UI
   */
  loadTests(tests: any) {
    if (
      tests.laboratoryList &&
      tests.radiologyList
      /* && tests.external */
    ) {
      console.log(JSON.stringify(tests, null, 4));
      this.loadlabTests(Object.assign(tests.laboratoryList, []));
      this.loadRadiologyTests(Object.assign(tests.radiologyList, []));
      this.loadExternalTests(tests.externalTests);
      this.loadArchive(tests.archive);
      this.mergeForms();
    } else {
      this.errorLoading(this.loadingErrorMessage);
    }
  }
  /////////////////////////////// CALLING AND LOADING ALL TESTS CODE ABOVE/////////////////////////////

  ////////////////////////////////////////////////LAB TESTS RELATED CODE BELOW/////////////////////

  /**
   *
   * labtests loading out of response
   */
  loadlabTests(labtests: any) {
    if (labtests.length) {
      this.labForm = this.fb.array([this.utils.createLabProcedureForm()]);
      labtests.forEach((test: any, i: any) => {
        // patch values at current position
        this.patchLabTestProcedureMasterData(test, i);

        if (i < labtests.length - 1) {
          this.labForm.push(this.utils.createLabProcedureForm());
        }
      });
    }
  }

  /**
   * Patch Values for Lab Test Procedure
   */
  patchLabTestProcedureMasterData(test: any, index: any) {
    this.labForm.at(index).patchValue({
      procedureType: test.procedureType,
      procedureName: test.procedureName,
      procedureID: test.procedureID,
      prescriptionID: test.prescriptionID,
      procedureDesc: test.procedureDesc,
      procedureStartAPI: test.procedureStartAPI,
      procedureCode: test.procedureCode,
      isMandatory: test.isMandatory,
      calibrationStartAPI: test.calibrationStartAPI,
      calibrationStatusAPI: test.calibrationStatusAPI,
      calibrationEndAPI: test.calibrationEndAPI,
    });
    this.patchLabTestComponentCommonMasterData(test.compListDetails, index);
  }

  /**
   * Patch Lab Test Component Common Master Data
   */

  patchLabTestComponentCommonMasterData(compListDetails: any, index: any) {
    const compListArray = <FormArray>(
      (<FormGroup>this.labForm.at(index)).controls['compListDetails']
    );

    compListDetails.forEach((element: any, key: any) => {
      if (element.inputType === 'TextBox') {
        this.addTextBoxComponentControls(compListArray, key, element);
      } else {
        this.addSelectComponentControls(compListArray, key, element);
      }
    });
  }

  /**
   * Add additional Controls for TextBox Component -- key is to be interpreted as index
   */
  addTextBoxComponentControls(compListArray: any, key: any, element: any) {
    compListArray.push(this.utils.createLabComponentOfFields());

    (<FormArray>compListArray).at(key).patchValue({
      inputType: element.inputType,
      measurementUnit: element.measurementUnit,
      range_max: element.range_max,
      range_min: element.range_min,
      range_normal_max: element.range_normal_max,
      range_normal_min: element.range_normal_min,
      isDecimal: element.isDecimal,
      allowText: element.isDecimal === true ? 'decimal' : 'number',
      testComponentDesc: element.testComponentDesc,
      testComponentID: element.testComponentID,
      testComponentName: element.testComponentName,
      componentCode: element.componentCode,
      remarks: element.remarks,
    });
  }
  /**
   * Add additional Controls for Radio/ Dropdown Component -- key is to be interpreted as index
   */
  addSelectComponentControls(compListArray: any, key: any, element: any) {
    compListArray.push(this.utils.createLabComponentOfRadioDropDowns());

    (<FormArray>compListArray).at(key).patchValue({
      inputType: element.inputType,
      testComponentDesc: element.testComponentDesc,
      testComponentID: element.testComponentID,
      testComponentName: element.testComponentName,
      remarks: element.remarks,
      componentCode: element.componentCode,
      ecgAbnormalities: element.ecgAbnormalities,
    });
    const arrayCompOpt = <FormArray>(
      (<FormGroup>(<FormArray>compListArray).at(key)).controls['compOpt']
    );
    this.addDropDownListValuesforComponent(arrayCompOpt, element.compOpt);
  }

  /**
   * Add Values for DropDown List or Radio Button
   */
  addDropDownListValuesforComponent(arrayCompOpt: any, compOpt: any) {
    compOpt.forEach((element: any, i: any) => {
      arrayCompOpt.push(this.utils.createComponentRadioDropDownList());
      (<FormArray>arrayCompOpt).at(i).patchValue({
        name: element.name,
      });
    });
  }

  /**
   * Check whether the Input belongs to normal range
   *
   */
  checkNormalRange(procedureIndex: any, componentIndex: any) {
    const procedure = <FormGroup>this.labForm.at(procedureIndex);
    const component = (<FormArray>procedure.controls['compListDetails']).at(
      componentIndex
    );
    if (component.valueChanges && component.value.inputValue) {
      if (
        component.value.inputValue < component.value.range_normal_min ||
        component.value.inputValue > component.value.range_normal_max
      ) {
        component.patchValue({
          abnormal: true,
        });
      } else {
        component.patchValue({
          abnormal: false,
        });
      }
    }
  }

  /**
   * Check Whether the Input belongs to Range specified
   */
  checkRange(procedureIndex: any, componentIndex: any) {
    const procedure = <FormGroup>this.labForm.at(procedureIndex);
    const component = (<FormArray>procedure.controls['compListDetails']).at(
      componentIndex
    );
    if (
      component.value.inputValue &&
      (component.value.inputValue < component.value.range_min ||
        component.value.inputValue > component.value.range_max)
    ) {
      component.patchValue({
        inputValue: '',
      });
      this.confirmationService.alert(
        this.current_language_set.alerts.info.valueDetails +
          ' ' +
          `${component.value.range_min} to ${component.value.range_max}`
      );
    }
  }

  ////////////////////////////////////////////////LAB TESTS RELATED CODE ABOVE/////////////////////

  //////////////////////////////////////////RADIOLOGY TESTS RELATED CODE BELOW/////////////////////

  /**
   *
   * Radiology Tests loading out of response
   */
  loadRadiologyTests(radiologytests: any) {
    console.log(radiologytests, 'radiotests');
    console.log('restructuring lab', this.radiologyForm);

    if (radiologytests.length) {
      this.radiologyForm = this.fb.array([
        this.utils.createRadiologyProcedureForm(),
      ]);
      radiologytests.forEach((test: any, i: any) => {
        //patch values at current position
        this.patchRadiologyProcedureMasterData(test, i);

        if (i < radiologytests.length - 1) {
          this.radiologyForm.push(this.utils.createRadiologyProcedureForm());
        }
      });
    }
  }

  /**
   * Patch Values for Radiology Procedure
   */
  patchRadiologyProcedureMasterData(test: any, index: any) {
    this.radiologyForm.at(index).patchValue({
      procedureType: test.procedureType,
      procedureName: test.procedureName,
      procedureID: test.procedureID,
      prescriptionID: test.prescriptionID,
      procedureDesc: test.procedureDesc,
      gender: test.gender,
    });
    this.patchRadiologyComponentCommonMasterData(test.compDetails, index);
  }

  patchRadiologyComponentCommonMasterData(test: any, index: any) {
    const compList = <FormGroup>(
      (<FormGroup>this.radiologyForm.at(index)).controls['compDetails']
    );
    compList.patchValue({
      inputType: test.inputType,
      inputValue: test.compOpt,
      testComponentDesc: test.testComponentDesc,
      testComponentID: test.testComponentID,
      testComponentName: test.testComponentName,
      remarks: test.remarks,
    });
  }

  //////////////////////////////////////////RADIOLOGY TESTS RELATED CODE ABOVE/////////////////////

  ///////////////////////////////////////////EXTERNAL TESTS RELATED CODE BELOW/////////////////////

  /**
   *
   * External Tests loading out of response
   */
  loadExternalTests(externaltests: any) {
    if (externaltests?.tests) {
      this.externalForm = this.utils.createExternalTestForm();
      this.externalForm.patchValue({
        tests: externaltests.tests,
      });
    }
  }

  errorLoading(errorMessage: any) {
    this.confirmationService.alert(errorMessage);
    this.router.navigate(['/lab/worklist']);
  }

  laboratoryData = new MatTableDataSource<any>();
  radiologyFile = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  filteredRadiologyData: any = [];
  filteredLaboratoryData: any = [];

  loadArchive(archive: any) {
    if (archive?.length) {
      this.archiveList = archive;

      this.filteredArchiveList = this.archiveList;
      this.archiveList.forEach((fileSplit: any) => {
        if (fileSplit.procedureType === 'Radiology') {
          this.radiologyFile.data.push(fileSplit);
          this.radiologyFile.paginator = this.paginator;
          this.filteredRadiologyData = this.radiologyFile.data;
          this.radiologyFile.paginator = this.paginator;
        } else {
          this.laboratoryData.data.push(fileSplit);
          this.laboratoryData.paginator = this.paginator;
          const temLaboratoryData: any = [];
          this.filteredLaboratoryData = this.laboratoryData.data;
          this.laboratoryData.paginator = this.paginator;
        }
      });
    }
  }

  filterProceduresLab(searchTerm?: string) {
    if (!searchTerm) {
      this.laboratoryData.data = this.filteredLaboratoryData;
      this.laboratoryData.paginator = this.paginator;
    } else {
      this.laboratoryData.data = [];
      this.laboratoryData.paginator = this.paginator;
      this.filteredLaboratoryData.forEach((item: any) => {
        for (const key in item) {
          if (key === 'procedureName') {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.laboratoryData.data.push(item);
              this.laboratoryData.paginator = this.paginator;
              break;
            }
          }
        }
      });
    }
  }

  filterProceduresRadiology(searchTerm?: string) {
    if (!searchTerm) {
      this.radiologyFile.data = this.filteredRadiologyData;
      this.radiologyFile.paginator = this.paginator;
    } else {
      this.radiologyFile.data = [];
      this.radiologyFile.paginator = this.paginator;
      this.filteredRadiologyData.forEach((item: any) => {
        for (const key in item) {
          if (key === 'procedureName') {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.radiologyFile.data.push(item);
              this.radiologyFile.paginator = this.paginator;

              break;
            }
          }
        }
      });
    }
  }

  ///////////////////////////////////////////ARCHIVE RELATED CODE ABOVE/////////////////////

  //////////////FORM RESET CODE BELOW////////////////
  confirmFormReset() {
    if (this.technicianForm.dirty) {
      this.confirmationService
        .confirm('info', this.current_language_set.alerts.info.resetDetails)
        .subscribe(res => {
          if (res) {
            this.formReCall();
          }
        });
    }
  }
  /**
   * ReInitialize the Form by calling API
   */
  formReCall() {
    this.technicianForm.reset();
    this.stripSelected = true;
    this.getTestRequirements();
    this.mergeForms();
    console.log(this.technicianForm, 'formere');
  }

  //////////////FORM RESET CODE ABOVE////////////////

  fileList!: FileList;
  file: any;
  fileContent: any;
  /*
   * FILE UPLOAD RELATED CODE
   */
  fileIndex: any;
  uploadFile(event: any, index: any) {
    this.fileIndex = index;
    this.fileList = event.target.files;
    if (this.fileList.length > 0) {
      this.file = event.target.files[0];

      const fileNameExtension = this.file.name.split('.');
      const fileName = fileNameExtension[0];

      if (fileName !== undefined && fileName !== null && fileName !== '') {
        const validFormat = this.checkExtension(this.file);
        if (!validFormat) {
          this.confirmationService.alert(
            this.current_language_set.invalidFileExtensionSupportedFileFormats,
            'error'
          );
        } else if (this.fileList[0].size / 1000 / 1000 > this.maxFileSize) {
          console.log('File Size' + this.fileList[0].size / 1000 / 1000);
          this.confirmationService.alert(
            this.current_language_set.fileSizeShouldNotExceed +
              ' ' +
              this.maxFileSize +
              ' ' +
              this.current_language_set.mb,
            'error'
          );
        } else if (this.file) {
          const myReader: FileReader = new FileReader();
          myReader.onloadend = this.onLoadFileCallback.bind(this);
          myReader.readAsDataURL(this.file);
        }
      } else
        this.confirmationService.alert(
          this.current_language_set.invalidFileName,
          'error'
        );
    }
  }
  onLoadFileCallback = (event: any) => {
    console.log(event, 'myReaderevent');

    const fileContent = event.currentTarget.result;
    this.assignFileObject(this.fileIndex, fileContent);
  };
  /*
   *  check for valid file extensions
   */
  checkExtension(file: any) {
    let count = 0;
    console.log('FILE DETAILS', file);
    if (file) {
      const array_after_split = file.name.split('.');
      if (array_after_split.length === 2) {
        const file_extension = array_after_split[array_after_split.length - 1];
        for (let i = 0; i < this.valid_file_extensions.length; i++) {
          if (
            file_extension.toUpperCase() ===
            this.valid_file_extensions[i].toUpperCase()
          ) {
            count = count + 1;
          }
        }

        if (count > 0) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  fileObj: any;
  assignFileObject(fileIndex: any, fileContent: any) {
    const kmFileManager = {
      fileName: this.file !== undefined ? this.file.name : '',
      fileExtension:
        this.file !== undefined ? '.' + this.file.name.split('.')[1] : '',
      userID: this.sessionstorage.getItem('userID'),
      fileContent: fileContent !== undefined ? fileContent.split(',')[1] : '',
      vanID: JSON.parse(
        this.sessionstorage.getItem('serviceLineDetails') ?? '{}'
      )?.vanID,
      isUploaded: false,
    };

    if (this.fileObj !== undefined) {
      if (this.fileObj[fileIndex] !== undefined) {
        if (this.fileObj[fileIndex].fileName === kmFileManager.fileName) {
          return true;
        } else {
          this.fileObj[fileIndex].push(kmFileManager);
        }
      } else {
        console.log('this.fileObj', this.fileObj);
        this.fileObj[fileIndex] = [];
        this.fileObj[fileIndex].push(kmFileManager);
      }
    } else {
      this.fileObj = {};
      this.fileObj[fileIndex] = [];
      this.fileObj[fileIndex].push(kmFileManager);
    }
    console.log(this.fileObj);
    return kmFileManager;
  }
  openToViewFile(procedureID: any) {
    const dialogRef = this.dialog.open(ViewFileComponent, {
      width: '50%',
      data: {
        viewFileObj: this.fileObj,
        procedureID: procedureID,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.fileObj = result;

      if (this.fileObj[procedureID] && this.fileObj[procedureID].length === 0) {
        delete this.fileObj[procedureID];
      }
    });
  }
  savedFileData: any;
  saveUploadDetails(procedureID: any) {
    if (this.fileObj !== undefined) {
      if (this.savedFileData?.procedureID) {
        if (
          this.fileObj[procedureID].length >
          this.savedFileData[procedureID].length
        ) {
          const result = this.fileObj[procedureID].filter(
            (savedDataName: any) => {
              const arrresult = this.savedFileData[procedureID].filter(
                (uniqueFileName: any) => {
                  if (savedDataName.isUploaded === uniqueFileName.isUploaded) {
                    return true;
                  } else {
                    return false;
                  }
                }
              );
              if (arrresult.length === 0) {
                return true;
              } else {
                return false;
              }
            }
          );
          if (result && result.length > 0) {
            this.saveFileData(procedureID, result);
          } else {
            this.confirmationService.alert(
              this.current_language_set.alerts.info.selectNewFile,
              'info'
            );
          }
        } else {
          this.confirmationService.alert(
            this.current_language_set.alerts.info.selectNewFile,
            'info'
          );
        }
      } else if (this.fileObj?.procedureID?.length > 0) {
        this.saveFileData(procedureID, this.fileObj[procedureID]);
      } else {
        this.confirmationService.alert(
          this.current_language_set.alerts.info.selectNewFile,
          'info'
        );
      }
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.selectNewFile,
        'info'
      );
    }
  }

  /*
   *  Upload file
   */
  saveFileData(procedureID: any, fileReq: any) {
    this.labService.saveFile(fileReq).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          console.log('file response', res.data);
          res.data.forEach((savedFileData: any) => {
            if (this.savedFileData !== undefined) {
              if (this.savedFileData[procedureID] !== undefined) {
                this.savedFileData[procedureID].push(savedFileData);
              } else {
                this.savedFileData[procedureID] = [];
                this.savedFileData[procedureID].push(savedFileData);
              }
            } else {
              this.savedFileData = {};
              this.savedFileData[procedureID] = [];
              this.savedFileData[procedureID].push(savedFileData);
            }
            console.log(this.savedFileData);
          });

          for (const key in this.fileObj) {
            if (key === procedureID) {
              this.fileObj[procedureID].map((file: any) => {
                file.isUploaded = true;
              });
            }
          }
          for (const key in this.savedFileData) {
            if (key === procedureID) {
              this.savedFileData[procedureID].map((file: any) => {
                file.isUploaded = true;
              });
            }
          }

          console.log('fileobj after upload', this.fileObj);
          this.confirmationService.alert(
            this.current_language_set.alerts.info.successMsg,
            'success'
          );
        }
      },
      err => {
        this.confirmationService.alert(err.errorMessage, 'err');
      }
    );
  }
  validateSubmit(labCompleted: any) {
    if (this.fileObj) {
      if (this.savedFileData) {
        let objLength = 0;
        const fileObjLength = Object.keys(this.fileObj);
        const saveObjlength = Object.keys(this.savedFileData);
        if (fileObjLength.length === saveObjlength.length) {
          for (const fileObjKey in this.fileObj) {
            if (this.savedFileData[fileObjKey]) {
              if (
                this.savedFileData[fileObjKey].length ===
                this.fileObj[fileObjKey].length
              ) {
                objLength++;
                if (objLength === fileObjLength.length) {
                  this.submitDetails(labCompleted);
                }
              } else {
                this.confirmationService.alert(
                  this.current_language_set.alerts.info.uploadSelectedFile
                );
                break;
              }
            } else {
              this.confirmationService.alert(
                this.current_language_set.alerts.info.uploadSelectedFile
              );
              break;
            }
          }
        } else {
          this.confirmationService.alert(
            this.current_language_set.alerts.info.uploadSelectedFile
          );
        }
      } else {
        this.confirmationService.alert(
          this.current_language_set.alerts.info.uploadSelectedFile
        );
      }
    } else {
      this.submitDetails(labCompleted);
    }
  }
  fileIDs: any = [];
  radiologyObj: any;
  radiologyTestArrayResults: any = [];

  submitDetails(labCompleted: any) {
    let option;
    if (labCompleted) {
      option = this.current_language_set.common.submit;
    } else {
      option = 'save';
    }
    this.confirmationService
      .confirm(
        'info',
        this.current_language_set.alerts.info.confirmSubmit +
          ' ' +
          `${option}` +
          ' ' +
          this.current_language_set.alerts.info.labObservation
      )
      .subscribe(
        res => {
          if (res) {
            const techForm: any = this.dataLoad.technicalDataRestruct({
              ...this.technicianForm.value,
            });
            techForm['labCompleted'] = labCompleted;
            techForm['createdBy'] = this.sessionstorage.getItem('userName');
            techForm['doctorFlag'] = this.sessionstorage.getItem('doctorFlag');
            techForm['nurseFlag'] = this.sessionstorage.getItem('nurseFlag');
            techForm['beneficiaryRegID'] =
              this.sessionstorage.getItem('beneficiaryRegID');
            techForm['beneficiaryID'] =
              this.sessionstorage.getItem('beneficiaryID');
            techForm['benFlowID'] = this.sessionstorage.getItem('benFlowID');
            techForm['visitID'] = this.sessionstorage.getItem('visitID');
            techForm['visitCode'] = this.sessionstorage.getItem('visitCode');
            techForm['providerServiceMapID'] =
              this.sessionstorage.getItem('providerServiceID');

            if (
              this.sessionstorage.getItem('specialist_flag') === null ||
              this.sessionstorage.getItem('specialist_flag') === 'null' ||
              this.sessionstorage.getItem('specialist_flag') === ''
            ) {
              techForm['specialist_flag'] = null;
            } else {
              techForm['specialist_flag'] =
                this.sessionstorage.getItem('specialist_flag');
            }
            const serviceLineDetails: any =
              this.sessionstorage.getItem('serviceLineDetails');
            const servicePointDetails = JSON.parse(serviceLineDetails);

            techForm['vanID'] = servicePointDetails.vanID;
            techForm['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
            if (!techForm.labTestResults) {
              techForm['labTestResults'] = [];
            }
            if (!techForm.radiologyTestResults) {
              for (const key in this.savedFileData) {
                this.technicianForm.value.radiologyForm.forEach(
                  (procedureDetails: any) => {
                    if (key === procedureDetails.procedureID) {
                      this.savedFileData[key].forEach((fileId: any) => {
                        this.fileIDs.push(fileId.filePath);
                      });
                      this.radiologyObj = {
                        procedureID: procedureDetails.procedureID,
                        prescriptionID: procedureDetails.prescriptionID,
                        testComponentID:
                          procedureDetails.compDetails.testComponentID,
                        remarks: procedureDetails.compDetails.remarks,
                        fileIDs: this.fileIDs,
                      };
                      this.radiologyTestArrayResults.push(this.radiologyObj);
                      this.fileIDs = [];
                    }
                  }
                );
              }
              techForm['radiologyTestResults'] = this.radiologyTestArrayResults;
            }

            console.log(
              'technicianForm',
              JSON.stringify(this.technicianForm.value, null, 4)
            );
            console.log(JSON.stringify(techForm, null, 4), 'techForm');
            this.labService.saveLabWork(techForm).subscribe((response: any) => {
              console.log(response, 'responseddd');
              if (response && response.statusCode === 200) {
                this.confirmationService.alert(
                  response.data.response,
                  'success'
                );
                sessionStorage.removeItem('doctorFlag');
                sessionStorage.removeItem('nurseFlag');
                sessionStorage.removeItem('visitID');
                sessionStorage.removeItem('beneficiaryRegID');
                sessionStorage.removeItem('beneficiaryID');
                sessionStorage.removeItem('visitCategory');
                sessionStorage.removeItem('benFlowID');
                sessionStorage.removeItem('visitCode');
                sessionStorage.removeItem('specialist_flag');
                this.technicianForm.reset();
                this.router.navigate(['/lab/worklist']);
                console.log('data input done', res);
              } else {
                this.confirmationService.alert(response.errorMessage, 'error');
              }
            });
          }
        },
        err => {}
      );
  }
  /**
   * submitDetails for Submit // SUBMIT BUTTON ACTION CODE
   */

  sideNavModeChange(sidenav: any) {
    const deviceWidth = window.screen.width;

    if (deviceWidth < 700) sidenav.mode = 'over';
    else sidenav.mode = 'side';

    sidenav.toggle();
  }
  canDeactivate(): Observable<boolean> {
    console.log('deactivate called');
    if (this.technicianForm.dirty)
      return this.confirmationService.confirm(
        `info`,
        this.current_language_set.alerts.info.navigateFurtherAlert,
        'Yes',
        'No'
      );
    else return of(true);
  }

  viewFileContent(fileIDs: any) {
    console.log(fileIDs);
    const dialogRef = this.dialog.open(ViewRadiologyUploadedFilesComponent, {
      width: '40%',
      data: {
        filesDetails: fileIDs,
      },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.labService.viewFileContent(result).subscribe((res: any) => {
          const blob = new Blob([res], { type: res.type });
          console.log(blob, 'blob');
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

  openIOTModal(api: FormGroup, i: number) {
    this.stepExpand = i;
    console.log(this.stepExpand);
    console.log(api, 'sfasdfasfgasdfasfa');
    const output: any = [];
    api.value.compListDetails.forEach((element: any) => {
      output.push(element.componentCode);
    });
    console.log('calibration', api);
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '200px',
      disableClose: true,
      data: {
        startAPI: api.value.procedureStartAPI,
        output: output,
        procedure: api,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('he;;p', result, result['result']);
      if (result !== null) {
        //result['result']
        const comarr = api.controls['compListDetails'] as FormArray;
        for (let i = 0; i < result.length; i++) {
          if (result[i] !== undefined) {
            if (comarr.at(i).value.inputType === 'TextBox') {
              comarr.at(i).patchValue({
                inputValue: result[i],
              });
            } else if (
              comarr.at(i).value.inputType === 'RadioButton' ||
              comarr.at(i).value.inputType === 'DropDown'
            ) {
              comarr.at(i).patchValue({
                compOptSelected: result[i],
              });
            }
          }
        }
      }
    });
  }

  onStripsCheckBox(event: any, procedureIndex: any, componentIndex: any) {
    const procedure = <FormGroup>this.labForm.at(procedureIndex);
    const component = (<FormArray>procedure.controls['compListDetails']).at(
      componentIndex
    );
    if (event.checked) {
      procedure.controls['compListDetails'].setValidators([
        Validators.required,
      ]);
      this.stripSelected = false;
    } else {
      this.stripSelected = true;
    }
    component.patchValue({
      inputValue: '',
    });
  }

  getEcgAbnormalities() {
    this.labService.getEcgAbnormalities().subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          this.ecgAbnormalities = res.data;
        } else {
          console.log(res.errorMessage, 'error');
        }
      },
      err => {
        console.log(err, 'error');
      }
    );
  }

  checkForEcg(value: any, procedureName: any, index: any) {
    if (procedureName.includes('ECG')) {
      if (value === 'Abnormal') {
        this.enableEcgAbnormal = true;
      } else {
        this.enableEcgAbnormal = false;
        this.technicianForm.controls['labForm'].value.forEach(
          (item: any, index: any) => {
            if (item.procedureName === procedureName) {
              item.compListDetails.filter((element: any) => {
                element.ecgAbnormalities = [];
              });
            }
          }
        );
      }
    }
  }
}
