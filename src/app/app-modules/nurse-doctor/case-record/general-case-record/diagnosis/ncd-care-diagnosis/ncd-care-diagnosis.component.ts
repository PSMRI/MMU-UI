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

import { Component, OnInit, Input, DoCheck } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { MasterdataService, DoctorService } from '../../../../shared/services';
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { GeneralUtils } from 'src/app/app-modules/nurse-doctor/shared/utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-ncd-care-diagnosis',
  templateUrl: './ncd-care-diagnosis.component.html',
  styleUrls: ['./ncd-care-diagnosis.component.css'],
})
export class NcdCareDiagnosisComponent implements OnInit, DoCheck {
  utils = new GeneralUtils(this.fb, this.sessionstorage);

  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  ncdCareConditions: any;
  ncdCareTypes: any;
  isNcdScreeningConditionOther: boolean = false;
  temp: any = [];
  current_language_set: any;
  attendantType: any;
  enableNCDCondition: boolean = false;
  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private httpServiceService: HttpServiceService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.getDoctorMasterData();
    this.attendantType = this.route.snapshot.params['attendant'];
    if (this.attendantType === 'doctor') {
      this.enableNCDCondition = true;
    }
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getDoctorMasterData() {
    this.masterdataService.doctorMasterData$.subscribe(masterData => {
      if (masterData) {
        if (masterData.ncdCareConditions)
          this.ncdCareConditions = masterData.ncdCareConditions.slice();
        if (masterData.ncdCareTypes)
          this.ncdCareTypes = masterData.ncdCareTypes.slice();

        if (String(this.caseRecordMode) === 'view') {
          const beneficiaryRegID =
            this.sessionstorage.getItem('beneficiaryRegID');
          const visitID = this.sessionstorage.getItem('visitID');
          const visitCategory = this.sessionstorage.getItem('visitCategory');
          this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
        }
      }
    });
  }

  getProvisionalDiagnosisList(): AbstractControl[] | null {
    const provisionalDiagnosisListControl = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    );
    return provisionalDiagnosisListControl instanceof FormArray
      ? provisionalDiagnosisListControl.controls
      : null;
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
    this.generalDiagnosisForm.patchValue(diagnosis);
    const generalArray = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;

    const previousArray = diagnosis.provisionalDiagnosisList;
    let j = 0;
    if (previousArray !== undefined && previousArray.length > 0) {
      previousArray.forEach((i: any) => {
        generalArray.at(j).patchValue({
          conceptID: i.conceptID,
          term: i.term,
          provisionalDiagnosis: i.term,
        });
        (<FormGroup>generalArray.at(j)).controls[
          'provisionalDiagnosis'
        ].disable();
        if (generalArray.length < previousArray.length) {
          this.addDiagnosis();
        }
        j++;
      });
    }
  }

  addDiagnosis() {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (diagnosisListForm.length < 30) {
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis
      );
    }
  }

  deleteDiagnosis(index: any, diagnosisList: AbstractControl<any, any>) {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (!diagnosisListForm.at(index).invalid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe(result => {
          if (result) {
            const diagnosisListForm = this.generalDiagnosisForm.controls[
              'provisionalDiagnosisList'
            ] as FormArray;
            if (diagnosisListForm.length > 1) {
              diagnosisListForm.removeAt(index);
            } else {
              diagnosisListForm.removeAt(index);
              diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
            }
          }
        });
    } else {
      if (diagnosisListForm.length > 1) {
        diagnosisListForm.removeAt(index);
      } else {
        diagnosisListForm.removeAt(index);
        diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
      }
    }
  }

  checkProvisionalDiagnosisValidity(diagnosis: any) {
    const tempDiagnosis = diagnosis.value;
    if (tempDiagnosis.conceptID && tempDiagnosis.term) {
      return false;
    } else {
      return true;
    }
  }

  changeNcdScreeningCondition(eventValue: any, event: any) {
    const value: any = event.value;
    let flag = false;
    if (value !== undefined && value !== null && value.length > 0) {
      value.forEach((element: any) => {
        if (element === 'Other') flag = true;
      });
    }
    if (flag) this.isNcdScreeningConditionOther = true;
    else {
      this.generalDiagnosisForm.controls[
        'ncdScreeningConditionOther'
      ].patchValue(null);
      this.isNcdScreeningConditionOther = false;
    }
    this.temp = value;
    this.generalDiagnosisForm.controls['ncdScreeningConditionArray'].patchValue(
      value
    );
  }
}
