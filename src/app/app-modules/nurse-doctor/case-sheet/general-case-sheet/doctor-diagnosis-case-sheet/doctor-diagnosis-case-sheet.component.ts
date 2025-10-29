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
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import * as moment from 'moment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { get } from 'jquery';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-doctor-diagnosis-case-sheet',
  templateUrl: './doctor-diagnosis-case-sheet.component.html',
  styleUrls: ['./doctor-diagnosis-case-sheet.component.css'],
})
export class DoctorDiagnosisCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  caseSheetData: any;
  @Input()
  previous: any;
  @Input()
  printPagePreviewSelect: any;

  date: any;
  blankRows = [1, 2, 3, 4];
  visitCategory: any;

  beneficiaryDetails: any;
  currentVitals: any;
  caseRecords: any;
  ancDetails: any;
  symptomsList: any = [];
  symptomFlag = false;
  contactList: any = [];
  contactFlag = false;
  travelStatus: any;
  travelFlag = false;
  suspectedFlag = false;
  suspected: any;
  recFlag = false;
  recommendation: any = [];
  temp: any = [];
  recommendationText!: string;
  tempComp!: string;
  indexComplication!: number;
  tempComplication = false;
  newComp!: string;
  idrsDetailsHistory: any = [];
  suspect: any = [];
  suspectt: any = [];
  temp1: any = [];

  severityValue: any;
  cough_pattern_Value: any;
  enableResult = false;
  severity: any;
  cough_pattern: any;
  cough_severity_score: any;
  record_duration: any;

  idrsScore: any;
  enableTCReferredMMUData = false;
  showHRP!: string;
  tmCaseSheet: any;
  imgUrl!: string | ArrayBuffer;
  mmuCaseSheetData: any;
  MMUcaseRecords: any;
  ncdScreeningCondition: any;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;
  covidVaccineDetails: any;
  ageValidationForVaccination = '< 12 years';
  referDetails: any;
  serviceList = '';
  referralReasonList = '';
  MMUReferDetails: any;
  mmuServiceList = '';
  isCovidVaccinationStatusVisible = false;
  userName: any;

  constructor(
    private doctorService: DoctorService,
    private nurseService: NurseService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private masterdataService: MasterdataService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.visitCategory = this.sessionstorage.getItem('caseSheetVisitCategory');
    this.tmCaseSheet = sessionStorage.getItem('tmCaseSheet');
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
    this.fetchHRPPositive();
    this.getAssessmentID();
  }
  getMMUCasesheetDataInTCReferred(caseSheetRequest: any) {
    this.doctorService
      .getMMUCasesheetData(caseSheetRequest)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          this.mmuCaseSheetData = res.data;
          this.MMUcaseRecords = this.mmuCaseSheetData.doctorData;
          const mmuVitalsData =
            this.mmuCaseSheetData.nurseData.vitals.benPhysicalVitalDetail;
          if (mmuVitalsData.rbsTestResult) {
            const mmuVitalsRBSValue = {
              prescriptionID: null,
              procedureID: null,
              createdDate: mmuVitalsData.createdDate,
              procedureName: 'RBS Test',
              procedureType: 'Laboratory',
              componentList: [
                {
                  testResultValue: mmuVitalsData.rbsTestResult,
                  remarks: mmuVitalsData.rbsTestRemarks,
                  fileIDs: [null],
                  testResultUnit: 'mg/dl',
                  loincName: null,
                  testComponentID: null,
                  componentName: null,
                },
              ],
            };
            this.MMUcaseRecords.LabReport = [mmuVitalsRBSValue].concat(
              this.MMUcaseRecords.LabReport
            );
          }

          if (this.mmuCaseSheetData?.doctorData) {
            this.MMUReferDetails = this.mmuCaseSheetData.doctorData.Refer;
            if (this.MMUReferDetails?.refrredToAdditionalServiceList) {
              this.mmuServiceList =
                this.MMUReferDetails.refrredToAdditionalServiceList
                  .map((service: any) => service.serviceName)
                  .filter((name: any) => name !== null && name !== '')
                  .join(',');
            }
            this.userName = this.MMUcaseRecords?.diagnosis?.createdBy;
          }

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
    this.ncdScreeningCondition = null;
    if (this.caseSheetData) {
      this.userName = this.caseSheetData?.doctorData?.diagnosis?.createdBy;

      const temp2 = this.caseSheetData.nurseData.covidDetails;
      const t = new Date();
      this.date =
        t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear();

      this.beneficiaryDetails = this.caseSheetData.BeneficiaryData;

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

      const temp = this.caseSheetData.nurseData.vitals;
      this.currentVitals = Object.assign(
        {},
        temp.benAnthropometryDetail,
        temp.benPhysicalVitalDetail
      );

      if (this.visitCategory !== 'General OPD (QC)') {
        this.caseRecords = this.caseSheetData.doctorData;
        if (this.caseRecords?.diagnosis?.ncdScreeningCondition) {
          this.ncdScreeningCondition =
            this.caseRecords.diagnosis.ncdScreeningCondition.replaceAll(
              '||',
              ','
            );
        }
      } else {
        const temp = this.caseSheetData.doctorData;
        this.caseRecords = {
          findings: temp.findings,
          prescription: temp.prescription,
          diagnosis: {
            provisionalDiagnosis: temp.diagnosis.diagnosisProvided,
            specialistAdvice: temp.diagnosis.instruction,
            externalInvestigation: temp.diagnosis.externalInvestigation,
          },
          LabReport: temp.LabReport,
        };
      }

      if (this.currentVitals.rbsTestResult) {
        const vitalsRBSValue = {
          prescriptionID: null,
          procedureID: null,
          createdDate: this.currentVitals.createdDate,
          procedureName: 'RBS Test',
          procedureType: 'Laboratory',
          componentList: [
            {
              testResultValue: this.currentVitals.rbsTestResult,
              remarks: this.currentVitals.rbsTestRemarks,
              fileIDs: [null],
              testResultUnit: 'mg/dl',
              loincName: null,
              testComponentID: null,
              componentName: null,
            },
          ],
        };
        this.caseRecords.LabReport = [vitalsRBSValue].concat(
          this.caseRecords.LabReport
        );
      }

      this.ancDetails = this.caseSheetData.nurseData.anc;
      if (
        this.caseRecords.diagnosis.complicationOfCurrentPregnancy !== undefined
      ) {
        this.tempComp =
          this.caseRecords.diagnosis.complicationOfCurrentPregnancy;
        console.log('tempComp' + this.tempComp);
        this.indexComplication = this.tempComp.indexOf(
          'Other-complications : null'
        );
        console.log('indexComp' + this.indexComplication);
        if (this.indexComplication !== -1) {
          this.tempComplication = true;
          this.newComp = this.tempComp.replace(
            ', Other-complications : null',
            ''
          );
          console.log('newComp' + this.newComp);
        } else {
          this.tempComplication = false;
        }
      }

      if (temp2 !== undefined) {
        if (temp2['symptom'] !== undefined) {
          this.symptomsList = temp2['symptom'];
          this.symptomFlag = true;
        }
        if (temp2['contactStatus'] !== undefined) {
          this.contactList = temp2['contactStatus'];
          if (this.contactList.length > 0) this.contactFlag = true;
          else this.contactFlag = false;
        }
        if (temp2.travelStatus !== undefined) {
          this.travelStatus = temp2.travelStatus;
          if (this.travelStatus === false) {
            this.travelFlag = true;
            this.travelStatus = 'No';
          } else if (this.travelStatus === true) {
            this.travelFlag = true;
            this.travelStatus = 'Yes';
          } else this.travelFlag = false;
        }
        if (temp2.suspectedStatusUI !== undefined) {
          this.suspectedFlag = true;
          this.suspected = temp2.suspectedStatusUI;
        }
        if (temp2['recommendation'] !== undefined) {
          this.recFlag = true;
          this.recommendation = temp2['recommendation'];
          const ar = this.recommendation[0];
          for (let i = 0; i < ar.length; i++) {
            this.temp.push(ar[i]);
          }
          const testtravelarr = this.temp.join('\n');
          this.recommendationText = testtravelarr;
        }
      }
      if (
        this.caseSheetData.nurseData.idrs !== undefined &&
        this.caseSheetData.nurseData.idrs
      ) {
        if (this.caseSheetData.nurseData.idrs.IDRSDetail) {
          this.idrsDetailsHistory =
            this.caseSheetData.nurseData.idrs.IDRSDetail;
          this.temp1 = this.idrsDetailsHistory.idrsDetails.filter(
            (response: any) => response.answer === 'yes'
          );

          this.temp1 = this.temp1.filter(
            (idrsQuestionId: any, index: any, arr: any) =>
              arr.findIndex(
                (t: any) => t.idrsQuestionId === idrsQuestionId.idrsQuestionId
              ) === index
          );
        }
        if (this.caseSheetData.nurseData.idrs.IDRSDetail) {
          this.idrsScore = this.caseSheetData.nurseData.idrs.IDRSDetail;
        }
        if (this.caseSheetData.nurseData.idrs.IDRSDetail.suspectedDisease) {
          this.suspect =
            this.caseSheetData.nurseData.idrs.IDRSDetail.suspectedDisease.split(
              ','
            );
        }
        if (this.caseSheetData.nurseData.idrs.IDRSDetail.confirmedDisease) {
          this.suspectt =
            this.caseSheetData.nurseData.idrs.IDRSDetail.confirmedDisease.split(
              ','
            );
        }
      }

      if (
        this.visitCategory === 'General OPD (QC)' &&
        this.caseSheetData?.doctorData
      ) {
        this.referDetails = this.caseSheetData.doctorData.Refer;
        if (this.referDetails?.refrredToAdditionalServiceList) {
          this.serviceList = this.referDetails.refrredToAdditionalServiceList
            .map((service: any) => service.serviceName)
            .filter((name: any) => name !== null && name !== '')
            .join(',');
        }
      }

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

      if (this.caseSheetData?.beneficiaryData?.doctorSignatureFlag) {
        this.downloadSign();
      }
      this.getVaccinationTypeAndDoseMaster();
    }
  }

  downloadSign() {
    this.getUserId().subscribe(userId => {
      const userIdToUse = this.beneficiaryDetails?.tCSpecialistUserID ?? userId;
      this.doctorService.downloadSign(userIdToUse).subscribe(
        (response: any) => {
          const blob = new Blob([response], { type: response.type });
          this.showSign(blob);
        },
        (err: any) => {
          console.error('Error downloading signature:', err);
        }
      );
    });
  }
  showSign(blob: any) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = _event => {
      this.imgUrl = reader.result as string | ArrayBuffer;
    };
  }

  padLeft() {
    const len = String(10).length - String(this).length + 1;
    return len > 0 ? new Array(len).join('0') + this : this;
  }

  fetchHRPPositive() {
    const beneficiaryRegID = this.sessionstorage.getItem(
      'caseSheetBeneficiaryRegID'
    );
    const visitCode = this.sessionstorage.getItem('visitCode');
    this.doctorService
      .getHRPDetails(beneficiaryRegID, visitCode)
      .subscribe((res: any) => {
        if (res?.statusCode === 200 && res?.data) {
          if (res.data.isHRP) {
            this.showHRP = 'true';
          } else {
            this.showHRP = 'false';
          }
        }
      });
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
    if (this.beneficiaryDetails) {
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

  getAssessmentID() {
    const benRegID = this.sessionstorage.getItem('caseSheetBeneficiaryRegID');
    this.doctorService.getAssessment(benRegID).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data !== null) {
        const lastElementIndex = res.data.length - 1;
        const lastElementData = res.data[lastElementIndex];
        const assessmentId = lastElementData.assessmentId;
        if (assessmentId !== null && assessmentId !== undefined) {
          this.getAssessmentDetails(assessmentId);
        }
      }
    });
  }

  getAssessmentDetails(assessmentId: any) {
    this.doctorService.getAssessmentDet(assessmentId).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data !== null) {
        this.severity = res.data.severity;
        this.cough_pattern = res.data.cough_pattern;
        this.cough_severity_score = res.data.cough_severity_score;
        this.record_duration = res.data.record_duration;
        this.nurseService.setEnableLAssessment(false);
        this.enableResult = true;
      }
    });
  }

  getUserId(): Observable<any> {
    return this.doctorService
      .getUserId(this.userName)
      .pipe(map((res: any) => res?.userId || null));
  }
}
