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
  DoCheck,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from './../../../../../core/services/confirmation.service';
import { DoctorService } from '../../../../shared/services';
import { GeneralUtils } from '../../../../shared/utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-pnc-diagnosis',
  templateUrl: './pnc-diagnosis.component.html',
  styleUrls: ['./pnc-diagnosis.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class PncDiagnosisComponent
  implements OnInit, DoCheck, OnDestroy, OnChanges
{
  utils = new GeneralUtils(this.fb, this.sessionstorage);
  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;
  current_language_set: any;

  getProvisionalDiagnosisList(): AbstractControl[] | null {
    const provisionalDiagnosisListControl = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    );
    return provisionalDiagnosisListControl instanceof FormArray
      ? provisionalDiagnosisListControl.controls
      : null;
  }

  getConfirmatoryDiagnosisList(): AbstractControl[] | null {
    const confirmatoryDiagnosisListControl = this.generalDiagnosisForm.get(
      'confirmatoryDiagnosisList'
    );
    return confirmatoryDiagnosisListControl instanceof FormArray
      ? confirmatoryDiagnosisListControl.controls
      : null;
  }

  constructor(
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  beneficiaryAge: any;
  dob!: Date;
  today!: Date;
  minimumDeathDate!: Date;

  ngOnInit() {
    this.getBenificiaryDetails();
    this.today = new Date();
    this.dob = new Date();
    this.minimumDeathDate = new Date(
      this.today.getTime() - 365 * 24 * 60 * 60 * 1000
    );
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }

  ngOnChanges() {
    if (String(this.caseRecordMode) === 'view') {
      const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
      const visitID = this.sessionstorage.getItem('visitID');
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
    }
  }

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiaryDetails => {
          if (beneficiaryDetails) {
            this.beneficiaryAge = beneficiaryDetails.ageVal;
            this.dob.setFullYear(
              this.today.getFullYear() - this.beneficiaryAge
            );
          }
        }
      );
  }

  diagnosisSubscription: any;
  getDiagnosisDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.diagnosisSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res?.statusCode === 200 && res?.data?.diagnosis) {
          this.patchDiagnosisDetails(res.data.diagnosis);
        }
      });
  }

  patchDiagnosisDetails(diagnosis: any) {
    if (diagnosis.dateOfDeath)
      diagnosis.dateOfDeath = new Date(diagnosis.dateOfDeath);
    this.generalDiagnosisForm.patchValue(diagnosis);
    this.handleDiagnosisData(diagnosis);
  }

  addProvisionalDiagnosis() {
    const provisionalDiagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (provisionalDiagnosisArrayList.length < 30) {
      provisionalDiagnosisArrayList.push(
        this.utils.initProvisionalDiagnosisList()
      );
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis
      );
    }
  }

  removeProvisionalDiagnosis(index: any, provisionalDiagnosisForm: any) {
    const provisionalDiagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (provisionalDiagnosisArrayList.at(index).valid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe(result => {
          if (result) {
            if (provisionalDiagnosisArrayList.length > 1) {
              provisionalDiagnosisArrayList.removeAt(index);
            } else {
              provisionalDiagnosisForm.reset();
              provisionalDiagnosisForm.controls[
                'provisionalDiagnosis'
              ].enable();
            }
            this.generalDiagnosisForm.markAsDirty();
          }
        });
    } else if (provisionalDiagnosisArrayList.length > 1) {
      provisionalDiagnosisArrayList.removeAt(index);
    } else {
      provisionalDiagnosisForm.reset();
      provisionalDiagnosisForm.controls['provisionalDiagnosis'].enable();
    }
  }

  handleDiagnosisData(diagnosis: any) {
    if (
      diagnosis.provisionalDiagnosisList &&
      diagnosis.provisionalDiagnosisList.length > 0
    ) {
      this.handleProvisionalDiagnosisData(diagnosis.provisionalDiagnosisList);
    }

    if (
      diagnosis.confirmatoryDiagnosisList &&
      diagnosis.confirmatoryDiagnosisList.length > 0
    ) {
      this.handleConfirmatoryDiagnosisData(diagnosis.confirmatoryDiagnosisList);
    }
  }
  handleProvisionalDiagnosisData(provisionalDiagnosisDataList: any) {
    const provisionalDiagnosisList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    for (let i = 0; i < provisionalDiagnosisDataList.length; i++) {
      provisionalDiagnosisList.at(i).patchValue({
        provisionalDiagnosis: provisionalDiagnosisDataList[i].term,
        term: provisionalDiagnosisDataList[i].term,
        conceptID: provisionalDiagnosisDataList[i].conceptID,
      });
      (<FormGroup>provisionalDiagnosisList.at(i)).controls[
        'provisionalDiagnosis'
      ].disable();
      if (provisionalDiagnosisList.length < provisionalDiagnosisDataList.length)
        this.addProvisionalDiagnosis();
    }
  }

  handleConfirmatoryDiagnosisData(confirmatoryDiagnosisDataList: any) {
    const confirmatoryDiagnosisList = this.generalDiagnosisForm.controls[
      'confirmatoryDiagnosisList'
    ] as FormArray;
    for (let i = 0; i < confirmatoryDiagnosisDataList.length; i++) {
      confirmatoryDiagnosisList.at(i).patchValue({
        confirmatoryDiagnosis: confirmatoryDiagnosisDataList[i].term,
        term: confirmatoryDiagnosisDataList[i].term,
        conceptID: confirmatoryDiagnosisDataList[i].conceptID,
      });
      (<FormGroup>confirmatoryDiagnosisList.at(i)).controls[
        'confirmatoryDiagnosis'
      ].disable();
      if (
        confirmatoryDiagnosisList.length < confirmatoryDiagnosisDataList.length
      )
        this.addConfirmatoryDiagnosis();
    }
  }

  checkWithDeathDetails() {
    this.generalDiagnosisForm.patchValue({
      placeOfDeath: null,
      dateOfDeath: null,
      causeOfDeath: null,
    });
  }

  get isMaternalDeath() {
    return this.generalDiagnosisForm.controls['isMaternalDeath'].value;
  }
  addConfirmatoryDiagnosis() {
    const confirmatoryDiagnosisArrayList = this.generalDiagnosisForm.controls[
      'confirmatoryDiagnosisList'
    ] as FormArray;
    if (confirmatoryDiagnosisArrayList.length < 30) {
      confirmatoryDiagnosisArrayList.push(
        this.utils.initConfirmatoryDiagnosisList()
      );
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis
      );
    }
  }
  removeConfirmatoryDiagnosis(index: any, confirmatoryDiagnosisForm: any) {
    const confirmatoryDiagnosisFormArrayList = this.generalDiagnosisForm
      .controls['confirmatoryDiagnosisList'] as FormArray;
    if (confirmatoryDiagnosisFormArrayList.at(index).valid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe(result => {
          if (result) {
            if (confirmatoryDiagnosisFormArrayList.length > 1) {
              confirmatoryDiagnosisFormArrayList.removeAt(index);
            } else {
              confirmatoryDiagnosisForm.reset();
              confirmatoryDiagnosisForm.controls[
                'confirmatoryDiagnosis'
              ].enable();
            }
            this.generalDiagnosisForm.markAsDirty();
          }
        });
    } else if (confirmatoryDiagnosisFormArrayList.length > 1) {
      confirmatoryDiagnosisFormArrayList.removeAt(index);
    } else {
      confirmatoryDiagnosisForm.reset();
      confirmatoryDiagnosisForm.controls['confirmatoryDiagnosis'].enable();
    }
  }
  checkProvisionalDiagnosisValidity(provisionalDiagnosis: any) {
    const temp = provisionalDiagnosis.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }

  checkConfirmatoryDiagnosisValidity(confirmatoryDiagnosis: any) {
    const temp = confirmatoryDiagnosis.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }
}
