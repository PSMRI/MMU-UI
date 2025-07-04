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
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { DoctorService } from '../../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-history-case-sheet',
  templateUrl: './history-case-sheet.component.html',
  styleUrls: ['./history-case-sheet.component.css'],
  providers: [DatePipe],
})
export class HistoryCaseSheetComponent implements OnInit, OnChanges, DoCheck {
  @Input()
  previous: any;
  @Input()
  caseSheetData: any;

  pastIllnessList: any;
  pastSurgeryList: any;
  familyHistory: any;
  childOptionalVaccineList: any;
  comorbidConditionList: any;
  medicationHistoryList: any;
  femaleObstetricHistory: any;
  developmentalHistory: any;
  feedingHistory: any;
  menstrualHistory: any;
  perinatalHistory: any;
  personalHistory: any;
  immunizationHistory: any;
  date: any;
  referDetails: any;
  beneficiary: any;
  ANCDetailsAndFormula: any;
  generalhistory: any;
  visitCategory: any;
  blankRows = [1, 2, 3, 4];
  serviceList: string = '';
  previousPhysicalList: any;
  enableTCReferredMMUData: boolean = false;
  mmuCaseSheetData: any;
  MMUcaseRecords: any;
  MMUReferDetails: any;
  mmuServiceList: string = '';
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    public datepipe: DatePipe,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
    public httpServiceService: HttpServiceService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.visitCategory = this.sessionstorage.getItem('caseSheetVisitCategory');

    const caseSheetTMFlag = this.sessionstorage.getItem('caseSheetTMFlag');
    const specialistFlag = this.sessionstorage.getItem('specialistFlag');

    if (
      (caseSheetTMFlag !== null && caseSheetTMFlag === 'true') ||
      (specialistFlag !== null && parseInt(specialistFlag) === 200)
    ) {
      const caseSheetRequest = {
        VisitCategory: this.sessionstorage.getItem('caseSheetVisitCategory'),
        benFlowID: this.sessionstorage.getItem('caseSheetBenFlowID'),
        benVisitID: this.sessionstorage.getItem('caseSheetVisitID'),
        beneficiaryRegID: this.sessionstorage.getItem(
          'caseSheetBeneficiaryRegID'
        ),
        visitCode: this.sessionstorage.getItem('caseSheetVisitCode'),
      };
      this.getMMUCasesheetDataInTCReferred(caseSheetRequest);
      this.enableTCReferredMMUData = true;
    }
  }

  getMMUCasesheetDataInTCReferred(caseSheetRequest: any) {
    this.doctorService
      .getMMUCasesheetData(caseSheetRequest)
      .subscribe((res: any) => {
        if (res?.statusCode === 200 && res?.data) {
          this.mmuCaseSheetData = res.data;

          if (this.mmuCaseSheetData?.doctorData) {
            this.MMUReferDetails = this.mmuCaseSheetData.doctorData.Refer;
            if (this.MMUReferDetails?.refrredToAdditionalServiceList) {
              console.log(
                'institute',
                this.MMUReferDetails.refrredToAdditionalServiceList
              );
              for (
                let i = 0;
                i < this.MMUReferDetails.refrredToAdditionalServiceList.length;
                i++
              ) {
                if (
                  this.MMUReferDetails.refrredToAdditionalServiceList[i]
                    .serviceName
                ) {
                  this.mmuServiceList +=
                    this.MMUReferDetails.refrredToAdditionalServiceList[
                      i
                    ].serviceName;
                  if (
                    i >= 0 &&
                    i <
                      this.MMUReferDetails.refrredToAdditionalServiceList
                        .length -
                        1
                  )
                    this.mmuServiceList += ',';
                }
              }
            }
          }

          console.log(
            'referDetailsForRefer',
            JSON.stringify(this.MMUReferDetails, null, 4)
          );
          if (this.mmuCaseSheetData?.doctorData) {
            this.MMUReferDetails = this.mmuCaseSheetData.doctorData.Refer;
            if (
              this.MMUReferDetails &&
              this.mmuCaseSheetData.doctorData.Refer
            ) {
              this.mmuCaseSheetData.referDetails =
                this.mmuCaseSheetData.doctorData.Refer;
              console.log(
                'referDetailsForRefer',
                JSON.stringify(this.MMUReferDetails, null, 4)
              );
            }
          }
        }
      });
  }

  ngOnChanges() {
    if (this.caseSheetData?.BeneficiaryData) {
      this.beneficiary = this.caseSheetData.BeneficiaryData;
      if (this.caseSheetData?.nurseData?.history) {
        this.generalhistory = this.caseSheetData.nurseData.history;
        if (this.caseSheetData.nurseData.anc)
          this.ANCDetailsAndFormula =
            this.caseSheetData.nurseData.anc.ANCCareDetail;
        if (this.caseSheetData?.nurseData?.history?.PastHistory?.pastIllness)
          this.pastIllnessList =
            this.caseSheetData.nurseData.history.PastHistory.pastIllness;
        if (this.caseSheetData?.nurseData?.history?.PastHistory?.pastSurgery)
          this.pastSurgeryList =
            this.caseSheetData.nurseData.history.PastHistory.pastSurgery;
        if (this.caseSheetData.nurseData.history.FamilyHistory)
          this.familyHistory =
            this.caseSheetData.nurseData.history.FamilyHistory;
        if (this.caseSheetData.nurseData.history.PhysicalActivityHistory)
          this.previousPhysicalList =
            this.caseSheetData.nurseData.history.PhysicalActivityHistory;
        if (
          this.caseSheetData?.nurseData?.history?.childOptionalVaccineHistory
            ?.childOptionalVaccineList
        )
          this.childOptionalVaccineList =
            this.caseSheetData.nurseData.history.childOptionalVaccineHistory.childOptionalVaccineList;
        if (
          this.caseSheetData?.nurseData?.history?.ComorbidityConditions
            ?.comorbidityConcurrentConditionsList
        )
          this.comorbidConditionList =
            this.caseSheetData.nurseData.history.ComorbidityConditions.comorbidityConcurrentConditionsList;
        if (
          this.caseSheetData?.nurseData?.history?.MedicationHistory
            ?.medicationHistoryList
        )
          this.medicationHistoryList =
            this.caseSheetData.nurseData.history.MedicationHistory.medicationHistoryList;
        if (this.caseSheetData.nurseData.history.FemaleObstetricHistory)
          this.femaleObstetricHistory =
            this.caseSheetData.nurseData.history.FemaleObstetricHistory;
        if (this.caseSheetData.nurseData.history.DevelopmentHistory)
          this.developmentalHistory =
            this.caseSheetData.nurseData.history.DevelopmentHistory;
        if (this.caseSheetData.nurseData.history.FeedingHistory)
          this.feedingHistory =
            this.caseSheetData.nurseData.history.FeedingHistory;
        if (this.caseSheetData.nurseData.history.MenstrualHistory)
          this.menstrualHistory =
            this.caseSheetData.nurseData.history.MenstrualHistory;
        if (this.caseSheetData.nurseData.history.PerinatalHistory)
          this.perinatalHistory =
            this.caseSheetData.nurseData.history.PerinatalHistory;
        if (this.caseSheetData.nurseData.history.PersonalHistory)
          this.personalHistory =
            this.caseSheetData.nurseData.history.PersonalHistory;
        if (this.caseSheetData.nurseData.history.ImmunizationHistory)
          this.immunizationHistory =
            this.caseSheetData.nurseData.history.ImmunizationHistory;
        console.log(
          'generalhistory',
          JSON.stringify(this.generalhistory, null, 4)
        );
      }
    }
    if (this.caseSheetData?.doctorData) {
      this.referDetails = this.caseSheetData.doctorData.Refer;
      if (this.referDetails?.refrredToAdditionalServiceList) {
        console.log(
          'institute',
          this.referDetails.refrredToAdditionalServiceList
        );
        for (
          let i = 0;
          i < this.referDetails.refrredToAdditionalServiceList.length;
          i++
        ) {
          if (this.referDetails.refrredToAdditionalServiceList[i].serviceName) {
            this.serviceList +=
              this.referDetails.refrredToAdditionalServiceList[i].serviceName;
            if (
              i >= 0 &&
              i < this.referDetails.refrredToAdditionalServiceList.length - 1
            )
              this.serviceList += ',';
          }
        }
      }
    }
    console.log(
      'referDetailsForRefer',
      JSON.stringify(this.referDetails, null, 4)
    );
    if (this.caseSheetData?.doctorData) {
      this.referDetails = this.caseSheetData.doctorData.Refer;
      if (this.referDetails && this.caseSheetData.doctorData.Refer) {
        this.caseSheetData.referDetails = this.caseSheetData.doctorData.Refer;
        console.log(
          'referDetailsForRefer',
          JSON.stringify(this.referDetails, null, 4)
        );
      }
    }
    if (
      this.caseSheetData?.doctorData?.Refer &&
      this.referDetails?.revisitDate &&
      !moment(this.referDetails.revisitDate, 'DD/MM/YYYY', true).isValid()
    ) {
      const sDate = new Date(this.referDetails.revisitDate);
      this.referDetails.revisitDate = [
        this.padLeft.apply(sDate.getDate()),
        this.padLeft.apply(sDate.getMonth() + 1),
        this.padLeft.apply(sDate.getFullYear()),
      ].join('/');
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
}
