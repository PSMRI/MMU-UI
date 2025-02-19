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
  OnChanges,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';

import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-cancer-history',
  templateUrl: './cancer-history.component.html',
  styleUrls: ['./cancer-history.component.css'],
})
export class CancerHistoryComponent
  implements OnInit, OnChanges, OnDestroy, DoCheck
{
  @Input()
  nurseCancerHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  pregnancyStatus!: string;

  templateBeneficiaryDetails: any;
  familyHistoryData: any;
  languageComponent: any;
  currentLanguageSet: any;
  cancerPatientFamilyMedicalHistoryForm!: FormGroup;
  cancerPatientPerosnalHistoryForm!: FormGroup;
  cancerPatientObstetricHistoryForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.cancerPatientFamilyMedicalHistoryForm =
      this.nurseCancerHistoryForm.get(
        'cancerPatientFamilyMedicalHistoryForm'
      ) as FormGroup;
    this.cancerPatientPerosnalHistoryForm = this.nurseCancerHistoryForm.get(
      'cancerPatientPerosnalHistoryForm'
    ) as FormGroup;
    this.cancerPatientObstetricHistoryForm = this.nurseCancerHistoryForm.get(
      'cancerPatientObstetricHistoryForm'
    ) as FormGroup;
    this.getBenificiaryDetails();
    this.fetchLanguageResponse();
  }

  ngOnChanges(changes: any) {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getCancerHistory(benRegID, visitID);
    }

    if (String(this.mode) === 'update')
      this.updatePateintHistory(this.nurseCancerHistoryForm);
  }

  updatePateintHistory(cancerHistoryForm: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const updateDetails = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.doctorService
      .updateCancerHistoryDetails(cancerHistoryForm, updateDetails)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.confirmationService.alert(res.data.response, 'success');
            this.nurseCancerHistoryForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        err => {
          this.confirmationService.alert(err, 'error');
        }
      );
  }

  cancerHistorySubscription: any;
  getCancerHistory(benRegID: any, visitID: any) {
    this.cancerHistorySubscription = this.doctorService
      .getCancerHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null
        ) {
          const cancerHistoryData = history.data;

          const cancerPatientPerosnalHistoryData = Object.assign(
            {},
            cancerHistoryData.benPersonalHistory,
            cancerHistoryData.benPersonalDietHistory
          );
          (<FormGroup>(
            this.nurseCancerHistoryForm.controls[
              'cancerPatientPerosnalHistoryForm'
            ]
          )).patchValue(cancerPatientPerosnalHistoryData);

          this.familyHistoryData = cancerHistoryData.benFamilyHistory;

          const cancerPatientObstetricHistoryForm = Object.assign(
            {},
            cancerHistoryData.benObstetricHistory
          );
          (<FormGroup>(
            this.nurseCancerHistoryForm.controls[
              'cancerPatientObstetricHistoryForm'
            ]
          )).patchValue(cancerPatientObstetricHistoryForm);
        }
      });
  }

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiaryDetails => {
          if (beneficiaryDetails)
            this.templateBeneficiaryDetails = beneficiaryDetails;
        }
      );
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();

    if (this.cancerHistorySubscription)
      this.cancerHistorySubscription.unsubscribe();
  }

  //BU40088124 12/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
