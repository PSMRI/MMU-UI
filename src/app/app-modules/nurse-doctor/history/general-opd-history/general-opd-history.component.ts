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
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-general-opd-history',
  templateUrl: './general-opd-history.component.html',
  styleUrls: ['./general-opd-history.component.css'],
})
export class GeneralOpdHistoryComponent
  implements OnInit, DoCheck, OnChanges, OnDestroy
{
  @Input()
  nurseGeneralHistoryForm!: FormGroup;

  @Input()
  mode: any;

  @Input()
  visitCategory: any;

  @Input()
  primiGravida: any;

  @Input()
  pregnancyStatus: any;

  beneficiary: any;
  showObstetricHistory = false;
  currentLanguageSet: any;

  showHistory: boolean = false;
  pastHistory!: FormGroup;
  comorbidityHistory!: FormGroup;
  medicationHistory!: FormGroup;
  personalHistory!: FormGroup;
  familyHistory!: FormGroup;
  menstrualHistory!: FormGroup;
  perinatalHistory!: FormGroup;
  pastObstericHistory!: FormGroup;
  immunizationHistory!: FormGroup;
  otherVaccines!: FormGroup;
  feedingHistory!: FormGroup;
  developmentHistory!: FormGroup;
  physicalActivityHistory!: FormGroup;

  constructor(
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.loadFormData();
    this.assignSelectedLanguage();
    this.getBeneficiaryDetails();
    console.log('showHistory', this.showHistory);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  loadFormData() {
    this.pastHistory = this.nurseGeneralHistoryForm.get(
      'pastHistory'
    ) as FormGroup;
    this.comorbidityHistory = this.nurseGeneralHistoryForm.get(
      'comorbidityHistory'
    ) as FormGroup;
    this.medicationHistory = this.nurseGeneralHistoryForm.get(
      'medicationHistory'
    ) as FormGroup;
    this.personalHistory = this.nurseGeneralHistoryForm.get(
      'personalHistory'
    ) as FormGroup;
    this.familyHistory = this.nurseGeneralHistoryForm.get(
      'familyHistory'
    ) as FormGroup;
    this.menstrualHistory = this.nurseGeneralHistoryForm.get(
      'menstrualHistory'
    ) as FormGroup;
    this.perinatalHistory = this.nurseGeneralHistoryForm.get(
      'perinatalHistory'
    ) as FormGroup;
    this.pastObstericHistory = this.nurseGeneralHistoryForm.get(
      'pastObstericHistory'
    ) as FormGroup;
    this.immunizationHistory = this.nurseGeneralHistoryForm.get(
      'immunizationHistory'
    ) as FormGroup;
    this.otherVaccines = this.nurseGeneralHistoryForm.get(
      'otherVaccines'
    ) as FormGroup;
    this.feedingHistory = this.nurseGeneralHistoryForm.get(
      'feedingHistory'
    ) as FormGroup;
    this.developmentHistory = this.nurseGeneralHistoryForm.get(
      'developmentHistory'
    ) as FormGroup;
    this.physicalActivityHistory = this.nurseGeneralHistoryForm.get(
      'physicalActivityHistory'
    ) as FormGroup;
  }

  ngOnChanges(changes: any) {
    this.loadFormData();
    if (changes.mode && String(this.mode) === 'update') {
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      if (visitCategory === 'NCD screening') {
        this.updatePatientNCDScreeningHistory(this.nurseGeneralHistoryForm);
      } else {
        this.updatePatientGeneralHistory(this.nurseGeneralHistoryForm);
      }
    }

    if (changes.pregnancyStatus) {
      this.canShowObstetricHistory();
    }

    if (changes.primiGravida) {
      this.canShowObstetricHistory();
    }
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }

  updatePatientGeneralHistory(generalOPDHistory: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.doctorService
      .updateGeneralHistory(generalOPDHistory, temp, this.beneficiary.ageVal)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (this.visitCategory === 'ANC') {
              this.getHRPDetails();
            }
            this.confirmationService.alert(res.data.response, 'success');
            this.nurseGeneralHistoryForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        err => {
          this.confirmationService.alert(err, 'error');
        }
      );
  }

  beneficiaryDetailsSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          if (beneficiary) {
            this.beneficiary = beneficiary;
            this.canShowObstetricHistory();
          }
        }
      );
  }

  canShowObstetricHistory() {
    if (this.primiGravida) this.showObstetricHistory = false;
    else if (this.beneficiary && this.beneficiary.genderName === 'Male')
      this.showObstetricHistory = false;
    else if (
      this.beneficiary &&
      this.beneficiary.genderName !== 'Male' &&
      this.beneficiary.ageVal < 12
    )
      this.showObstetricHistory = false;
    else if (
      this.beneficiary &&
      this.beneficiary.genderName !== 'Male' &&
      this.beneficiary.ageVal >= 12
    )
      this.showObstetricHistory = true;
    else if (this.visitCategory === 'PNC') this.showObstetricHistory = true;
    else if (!this.primiGravida) this.showObstetricHistory = true;
  }

  updatePatientNCDScreeningHistory(NCDScreeningHistory: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.doctorService
      .updateNCDScreeningHistory(
        NCDScreeningHistory,
        temp,
        this.beneficiary.ageVal
      )
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.confirmationService.alert(res.data.response, 'success');
            this.nurseGeneralHistoryForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        err => {
          this.confirmationService.alert(err, 'error');
        }
      );
  }

  getHRPDetails() {
    const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    const visitCode = this.sessionstorage.getItem('visitCode');
    this.doctorService
      .getHRPDetails(beneficiaryRegID, visitCode)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          if (res.data.isHRP === true) {
            this.beneficiaryDetailsService.setHRPPositive();
          } else {
            this.beneficiaryDetailsService.resetHRPPositive();
          }
        }
      });
  }
}
