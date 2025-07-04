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

import { Component, OnInit, Input, OnChanges, DoCheck } from '@angular/core';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MasterdataService } from '../../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-cancer-doctor-diagnosis-case-sheet',
  templateUrl: './cancer-doctor-diagnosis-case-sheet.component.html',
  styleUrls: ['./cancer-doctor-diagnosis-case-sheet.component.css'],
})
export class CancerDoctorDiagnosisCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  caseSheetData: any;
  @Input()
  previous: any;
  @Input()
  printPagePreviewSelect: any;
  beneficiaryDetails: any;
  currentVitals: any;
  caseSheetDiagnosisData: any;
  date: any;
  enableDoctorSign: boolean = false;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;
  servicePointName: any;
  covidVaccineDetails: any;
  ageValidationForVaccination = '< 12 years';
  isCovidVaccinationStatusVisible = false;

  constructor(
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private masterdataService: MasterdataService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    const t = new Date();
    this.date = t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear();

    const caseSheetTMFlag = this.sessionstorage.getItem('caseSheetTMFlag');
    const specialistFlag = this.sessionstorage.getItem('specialistFlag');

    if (
      (caseSheetTMFlag !== null && caseSheetTMFlag === 'true') ||
      (specialistFlag !== null && parseInt(specialistFlag) === 200)
    ) {
      this.enableDoctorSign = true;
    }
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges() {
    console.log(this.caseSheetData);

    if (this.caseSheetData) {
      if (this.caseSheetData.BeneficiaryData)
        this.beneficiaryDetails = this.caseSheetData.BeneficiaryData;
      this.servicePointName =
        this.caseSheetData.nurseData.benVisitDetail.serviceProviderName;

      if (this.beneficiaryDetails.serviceDate) {
        const sDate = new Date(this.beneficiaryDetails.serviceDate);
        this.beneficiaryDetails.serviceDate =
          [
            this.padLeft.apply(sDate.getDate()),
            this.padLeft.apply(sDate.getMonth() + 1),
            this.padLeft.apply(sDate.getFullYear()),
          ].join('/') +
          ' ' +
          [
            this.padLeft.apply(sDate.getHours()),
            this.padLeft.apply(sDate.getMinutes()),
            this.padLeft.apply(sDate.getSeconds()),
          ].join(':');
      }

      if (this.beneficiaryDetails.consultationDate) {
        const cDate = new Date(this.beneficiaryDetails.consultationDate);
        this.beneficiaryDetails.consultationDate =
          [
            this.padLeft.apply(cDate.getDate()),
            this.padLeft.apply(cDate.getMonth() + 1),
            this.padLeft.apply(cDate.getFullYear()),
          ].join('/') +
          ' ' +
          [
            this.padLeft.apply(cDate.getHours()),
            this.padLeft.apply(cDate.getMinutes()),
            this.padLeft.apply(cDate.getSeconds()),
          ].join(':');
      }

      if (this.caseSheetData?.nurseData?.currentVitals)
        this.currentVitals = this.caseSheetData.nurseData.currentVitals;

      if (this.caseSheetData?.doctorData?.diagnosis)
        this.caseSheetDiagnosisData = this.caseSheetData.doctorData.diagnosis;

      this.getVaccinationTypeAndDoseMaster();
    }
  }

  padLeft() {
    const len = String(10).length - String(this).length + 1;
    return len > 0 ? new Array(len).join('0') + this : this;
  }
  // AV40085804 13/10/2021 Integrating Multilingual Functionality -----Start-----
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  // -----End------

  getVaccinationTypeAndDoseMaster() {
    if (this.beneficiaryDetails.ageVal >= 12) {
      this.masterdataService.getVaccinationTypeAndDoseMaster().subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            if (res.data) {
              const doseTypeList = res.data.doseType;
              const vaccineTypeList = res.data.vaccineType;
              this.getPreviousCovidVaccinationDetails(
                doseTypeList,
                vaccineTypeList
              );
            }
          }
        },
        err => {
          console.log('error', err.errorMessage);
        }
      );
    }
  }

  getPreviousCovidVaccinationDetails(doseTypeList: any, vaccineTypeList: any) {
    const beneficiaryRegID = this.sessionstorage.getItem(
      'caseSheetBeneficiaryRegID'
    );
    this.masterdataService
      .getPreviousCovidVaccinationDetails(beneficiaryRegID)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            if (res.data.covidVSID) {
              this.covidVaccineDetails = res.data;

              if (res?.data?.doseTypeID && res?.data?.covidVaccineTypeID) {
                this.covidVaccineDetails.doseTypeID = doseTypeList.filter(
                  (item: any) => {
                    return item.covidDoseTypeID === res.data.doseTypeID;
                  }
                );
                this.covidVaccineDetails.covidVaccineTypeID =
                  vaccineTypeList.filter((item: any) => {
                    return (
                      item.covidVaccineTypeID === res.data.covidVaccineTypeID
                    );
                  });
              }
            }
          }
        },
        err => {
          console.log('error', err.errorMessage);
        }
      );
  }
}
