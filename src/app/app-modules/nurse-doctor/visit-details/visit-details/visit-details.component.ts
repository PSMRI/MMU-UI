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
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';

import { MasterdataService, DoctorService } from '../../shared/services';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-patient-visit-details',
  templateUrl: './visit-details.component.html',
  styleUrls: ['./visit-details.component.css'],
})
export class PatientVisitDetailsComponent
  implements OnInit, DoCheck, OnChanges, OnDestroy
{
  @Input()
  patientVisitDetailsForm!: FormGroup;

  @Input()
  mode!: string;

  templateNurseMasterData: any;
  templateVisitCategories: any;
  templateVisitReasons: any;
  templateBeneficiaryDetails: any;
  templateFilterVisitCategories: any;
  templatePregnancyStatus = ['Yes', 'No', "Don't Know"];

  showPregnancyStatus = true;
  currentLanguageSet: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
    private languageComponent: SetLanguageComponent,
    private trackingService: AmritTrackingService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.getBenificiaryDetails();
  }

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getVisitDetails(visitID, benRegID);
    }
  }

  ngOnDestroy() {
    if (this.visitCategorySubscription)
      this.visitCategorySubscription.unsubscribe();

    if (this.visitDetailsSubscription)
      this.visitDetailsSubscription.unsubscribe();

    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }

  visitCategorySubscription: any;
  getVisitReasonAndCategory() {
    this.visitCategorySubscription =
      this.masterdataService.visitDetailMasterData$.subscribe(masterData => {
        if (masterData) {
          this.templateNurseMasterData = masterData;
          console.log(
            'Visit reason and category',
            this.templateNurseMasterData
          );
          this.templateVisitReasons = this.templateNurseMasterData.visitReasons;
          this.templateVisitCategories =
            this.templateNurseMasterData.visitCategories;
          this.templateFilterVisitCategories = this.templateVisitCategories;

          if (
            this.beneficiary.ageVal >= 30 &&
            !(String(this.mode) === 'view')
          ) {
            if (this.beneficiary.genderName === 'Male') {
              this.templateFilterVisitCategories =
                this.templateVisitCategories.filter(
                  (item: any) =>
                    item.visitCategory.toLowerCase() !== 'anc' &&
                    item.visitCategory.toLowerCase() !== 'pnc'
                );
            } else {
              this.templateFilterVisitCategories =
                this.templateVisitCategories.slice();
            }
            this.patientVisitDetailsForm.controls['visitReason'].setValue(
              'New Chief Complaint'
            );
            this.patientVisitDetailsForm.controls['visitCategory'].setValue(
              'NCD screening'
            );
          }
        }
      });
  }

  visitDetailsSubscription: any;
  getVisitDetails(visitID: any, benRegID: any) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    this.visitDetailsSubscription = this.doctorService
      .getVisitComplaintDetails(benRegID, visitID)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          if (
            visitCategory === 'Cancer Screening' ||
            visitCategory === 'General OPD (QC)'
          ) {
            const visitDetails = value.data.benVisitDetails;
            this.doctorService.fileIDs = value.data.benVisitDetails.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'ANC') {
            const visitDetails = value.data.ANCNurseVisitDetail;
            this.doctorService.fileIDs = value.data.ANCNurseVisitDetail.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'General OPD') {
            const visitDetails = value.data.GOPDNurseVisitDetail;
            this.doctorService.fileIDs = value.data.GOPDNurseVisitDetail.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'NCD screening') {
            const visitDetails = value.data.NCDScreeningNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.NCDScreeningNurseVisitDetail.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'NCD care') {
            const visitDetails = value.data.NCDCareNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.NCDCareNurseVisitDetail.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'PNC') {
            const visitDetails = value.data.PNCNurseVisitDetail;
            this.doctorService.fileIDs = value.data.PNCNurseVisitDetail.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'COVID-19 Screening') {
            console.log('visitData', value.data);
            const visitDetails = value.data.covid19NurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.covid19NurseVisitDetail.files;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
        }
      });
  }

  beneficiaryGender: any;
  beneficiary: any;
  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiaryDetails => {
          if (beneficiaryDetails) {
            this.beneficiary = beneficiaryDetails;
            this.beneficiaryGender = beneficiaryDetails.genderName;

            if (
              beneficiaryDetails &&
              beneficiaryDetails.genderName !== null &&
              beneficiaryDetails.genderName === 'Male'
            )
              this.showPregnancyStatus = false;
            else if (
              beneficiaryDetails &&
              beneficiaryDetails.ageVal !== null &&
              beneficiaryDetails.ageVal < 19
            )
              this.showPregnancyStatus = false;
            else this.showPregnancyStatus = true;

            this.getVisitReasonAndCategory();
          }
        }
      );
  }

  reasonSelected(visitReason: any) {
    if (visitReason === 'Screening') {
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) =>
          item.visitCategory.toLowerCase().indexOf('screening') >= 0
      );
    } else if (visitReason === 'Pandemic') {
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) => item.visitCategory.indexOf('COVID-19') >= 0
      );
    } else {
      /**
       * Filtering ANC for male and child (hardcoded)
       * TODO : need to filter based on api
       */
      if (
        this.beneficiary.genderName === 'Male' ||
        this.beneficiary.ageVal < 12
      )
        this.templateFilterVisitCategories =
          this.templateVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !== 'anc' &&
              item.visitCategory.toLowerCase() !== 'pnc'
          );
      else
        this.templateFilterVisitCategories =
          this.templateVisitCategories.slice();
    }
  }

  checkCategoryDependent(visitCategory: any) {
    this.sessionstorage.setItem('visiCategoryANC', visitCategory);
    if (visitCategory === 'ANC') {
      this.templatePregnancyStatus = ['Yes'];
      this.patientVisitDetailsForm.patchValue({ pregnancyStatus: 'Yes' });
    } else {
      this.templatePregnancyStatus = ['Yes', 'No', "Don't Know"];
      this.patientVisitDetailsForm.patchValue({ pregnancyStatus: null });
    }

    this.patientVisitDetailsForm.patchValue({ rCHID: null });
  }

  get visitReason() {
    return this.patientVisitDetailsForm.controls['visitReason'].value;
  }

  get visitCategory() {
    return this.patientVisitDetailsForm.controls['visitCategory'].value;
  }

  get pregnancyStatus() {
    return this.patientVisitDetailsForm.controls['pregnancyStatus'].value;
  }

  get rCHID() {
    return this.patientVisitDetailsForm.controls['rCHID'].value;
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(fieldName, 'Visit Details');
  }
}
