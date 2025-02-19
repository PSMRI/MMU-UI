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

import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../../shared/services';
import { Subscription } from 'rxjs';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-doctor-investigations',
  templateUrl: './doctor-investigations.component.html',
  styleUrls: ['./doctor-investigations.component.css'],
})
export class DoctorInvestigationsComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  generalDoctorInvestigationForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  @Input()
  visit!: string;

  chiefComplaintMaster: any;
  nonRadiologyMaster: any;
  radiologyMaster: any;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;

  previousLabTestList: any;
  diabetesSelected: any;
  VisualAcuityMandatory: boolean = false;
  RBSTestDoneInVitals: boolean = false;
  VisualAcuityTestDone: boolean = false;
  diastolicBpValue: any;
  systolicBpValue: any;
  RBSTestScore!: number;
  rbsPresent: boolean = false;
  visualAcuityPresent: boolean = false;
  RBSAndHeamoglobinSelected: boolean = false;
  confirmedDiabeticValue: any;
  hypertensionSelected: any;
  current_language_set: any;
  rbsTestResultCurrent: any;
  diabestesSuspectedSubscription!: Subscription;
  hyperSuspectedSubscription!: Subscription;
  diabetesConfirmedSubscription!: Subscription;
  systolicSubscription!: Subscription;
  diastolicSubscription!: Subscription;
  rbsTestResultSubscription!: Subscription;
  rbsSelectedInInvestigation: boolean = false;
  hemoglobbinSelected!: boolean;
  RBSTestScoreInVitals!: number;

  constructor(
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    private idrsScoreService: IdrsscoreService,
    private httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.getDoctorMasterData();
    this.getNurseMasterData();
    this.idrsScoreService.clearDiabetesSelected();
    this.idrsScoreService.clearSystolicBp();
    this.idrsScoreService.clearDiastolicBp();
    this.rbsSelectedInInvestigation = false;
    this.idrsScoreService.clearHypertensionSelected();
    this.idrsScoreService.clearConfirmedDiabeticSelected();
    this.nurseService.clearRbsInVitals();
    this.nurseService.clearRbsSelectedInInvestigation();
    this.diabestesSuspectedSubscription =
      this.idrsScoreService.diabetesSelectedFlag$.subscribe(
        response => (this.diabetesSelected = response)
      );

    this.hyperSuspectedSubscription =
      this.idrsScoreService.hypertensionSelectedFlag$.subscribe(response => {
        this.hypertensionSelected = response;
        this.changeOfConfirmedHypertension(this.hypertensionSelected);
      });
    this.diabetesConfirmedSubscription =
      this.idrsScoreService.confirmedDiabeticSelectedFlag$.subscribe(
        response => {
          this.confirmedDiabeticValue = response;
          this.changeOfConfirmedDiabetes(this.confirmedDiabeticValue);
        }
      );
    this.systolicSubscription =
      this.idrsScoreService.systolicBpValue$.subscribe(response => {
        this.systolicBpValue = response;
        this.changeOfSystolicBp();
        console.log('score', this.RBSTestScore);
      });
    this.diastolicSubscription =
      this.idrsScoreService.diastolicBpValue$.subscribe(response => {
        this.diastolicBpValue = response;
        this.changeOdDiastolicBp(this.diastolicBpValue);
      });
    /* RBS value from vitals */
    this.rbsTestResultSubscription =
      this.nurseService.rbsTestResultCurrent$.subscribe(response => {
        if (response !== undefined && response !== null) {
          this.RBSTestScoreInVitals = response;
          this.RBSTestDoneInVitals = true;
          this.checkRBSScore();
          this.rbsTestResultCurrent = response;
        } else {
          this.RBSTestScoreInVitals = response;
          this.RBSTestDoneInVitals = false;
          this.rbsTestResultCurrent = null;
          this.checkRBSScore();
        }
      });
    this.checkForDiabetesSuspected();
  }
  checkForDiabetesSuspected() {
    if (this.diabetesSelected === 1 && this.RBSTestScoreInVitals === null) {
      this.RBSTestDoneInVitals = false;
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
  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.investigationSubscription)
      this.investigationSubscription.unsubscribe();
    if (this.diabestesSuspectedSubscription)
      this.diabestesSuspectedSubscription.unsubscribe();
    if (this.hyperSuspectedSubscription)
      this.hyperSuspectedSubscription.unsubscribe();
    if (this.systolicSubscription) this.systolicSubscription.unsubscribe();
    if (this.diastolicSubscription) this.diastolicSubscription.unsubscribe();
    if (this.rbsTestResultSubscription)
      this.rbsTestResultSubscription.unsubscribe();
  }

  investigationSubscription: any;
  getInvestigationDetails(
    beneficiaryRegID: any,
    visitID: any,
    visitCategory: any
  ) {
    this.investigationSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res?.data?.investigation) {
          console.log(res, 'investigations');
          this.patchInvestigationDetails(
            res.data.investigation,
            res.data.diagnosis
          );
          this.checkTestScore(res.data.LabReport);
        }
      });
  }

  patchInvestigationDetails(investigation: any, diagnosis: any) {
    const labTest: any = [];
    const radiologyTest: any = [];
    let externalInvestigation = '';

    if (investigation.laboratoryList) {
      this.previousLabTestList = investigation.laboratoryList;

      investigation.laboratoryList.map((item: any) => {
        const temp = this.nonRadiologyMaster.filter((element: any) => {
          return element.procedureID === item.procedureID;
        });
        if (temp.length > 0) labTest.push(temp[0]);
      });

      investigation.laboratoryList.map((item: any) => {
        const temp = this.radiologyMaster.filter((element: any) => {
          return element.procedureID === item.procedureID;
        });
        if (temp.length > 0) radiologyTest.push(temp[0]);

        //checking RBS test is prescribed or not
        if (
          item.procedureName.toLowerCase() === environment.RBSTest.toLowerCase()
        ) {
          this.rbsSelectedInInvestigation = true;
          this.nurseService.setRbsSelectedInInvestigation(true);
        }
        if (
          item.procedureName.toLowerCase() ===
          environment.haemoglobinTest.toLowerCase()
        ) {
          this.hemoglobbinSelected = true;
        }
        if (
          item.procedureName.toLowerCase() ===
          environment.visualAcuityTest.toLowerCase()
        ) {
          this.VisualAcuityTestDone = true;
        }
      });
    }

    if (diagnosis?.externalInvestigation) {
      externalInvestigation = diagnosis.externalInvestigation;
    }

    this.generalDoctorInvestigationForm.patchValue({
      labTest,
      radiologyTest,
      externalInvestigations: externalInvestigation,
    });
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData?.procedures) {
          this.nonRadiologyMaster = masterData.procedures.filter(
            (item: any) => {
              return item.procedureType === 'Laboratory';
            }
          );
          this.radiologyMaster = masterData.procedures.filter((item: any) => {
            return item.procedureType === 'Radiology';
          });
          // checking RBS and Visual acuity is present or not.
          this.nonRadiologyMaster.forEach((element: any) => {
            if (
              element.procedureName.toLowerCase() ===
              environment.RBSTest.toLowerCase()
            ) {
              this.rbsPresent = true;
              this.idrsScoreService.rBSPresentInMaster();
            }
            if (
              element.procedureName.toLowerCase() ===
              environment.visualAcuityTest.toLowerCase()
            ) {
              this.visualAcuityPresent = true;
              this.idrsScoreService.visualAcuityPresentInMaster();
            }
            if (
              element.procedureName.toLowerCase() ===
              environment.haemoglobinTest.toLowerCase()
            ) {
              this.idrsScoreService.haemoglobinPresentInMaster();
            }
          });

          if (String(this.caseRecordMode) === 'view') {
            this.beneficiaryRegID =
              this.sessionstorage.getItem('beneficiaryRegID');
            this.visitID = this.sessionstorage.getItem('visitID');
            this.visitCategory = this.sessionstorage.getItem('visitCategory');
            this.getInvestigationDetails(
              this.beneficiaryRegID,
              this.visitID,
              this.visitCategory
            );
          }
        }
      });
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe(masterData => {
        if (masterData) {
          console.log('doctor master', masterData);
        }
      });
  }

  canDisable(test: any) {
    if (
      ((this.rbsTestResultCurrent !== null &&
        this.rbsTestResultCurrent !== undefined) ||
        (this.nurseService.rbsTestResultFromDoctorFetch !== null &&
          this.nurseService.rbsTestResultFromDoctorFetch !== undefined)) &&
      test.procedureName.toLowerCase() === environment.RBSTest.toLowerCase()
    ) {
      return true;
    }
    if (this.previousLabTestList) {
      const temp = this.previousLabTestList.filter((item: any) => {
        return item.procedureID === test.procedureID;
      });

      if (temp.length > 0) test.disabled = true;
      else test.disabled = false;

      return temp.length > 0;
    }
    return false;
  }
  checkTestScore(labreports: any) {
    labreports.forEach((element: any) => {
      if (
        element.procedureName.toLowerCase() ===
        environment.RBSTest.toLowerCase()
      ) {
        this.RBSTestScore = element.componentList[0].testResultValue;
      }
    });
    this.checkRBSScore();
  }
  checkRBSScore() {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
      (this.hypertensionSelected === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.setTMCSuggested();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.clearTMCSuggested();
    }
  }
  checkTestName(event: any) {
    console.log('testName', event);
    this.VisualAcuityTestDone = false;
    const item = event.value;
    let oneSelected = 0;
    this.nurseService.setRbsSelectedInInvestigation(false);
    this.rbsSelectedInInvestigation = false;
    this.hemoglobbinSelected = false;
    item.forEach((element: any) => {
      if (
        element.procedureName.toLowerCase() ===
        environment.RBSTest.toLowerCase()
      ) {
        this.rbsSelectedInInvestigation = true;
        this.nurseService.setRbsSelectedInInvestigation(true);
        oneSelected++;
      }
      if (
        element.procedureName.toLowerCase() ===
        environment.visualAcuityTest.toLowerCase()
      ) {
        this.VisualAcuityTestDone = true;
      }
      if (
        element.procedureName.toLowerCase() ===
        environment.haemoglobinTest.toLowerCase()
      ) {
        oneSelected++;
        this.hemoglobbinSelected = true;
      }
    });
  }
  changeOfSystolicBp() {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
      (this.hypertensionSelected === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.setTMCSuggested();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.clearTMCSuggested();
    }
  }
  changeOdDiastolicBp(diastolicBp: any) {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
      (this.hypertensionSelected === 0 && diastolicBp >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.setTMCSuggested();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.clearTMCSuggested();
    }
  }

  changeOfConfirmedDiabetes(confirmedDiabeticVal: any) {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
      (this.hypertensionSelected === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.setTMCSuggested();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.clearTMCSuggested();
    }
  }

  changeOfConfirmedHypertension(confirmedHypertensionVal: any) {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (confirmedHypertensionVal === 0 && this.systolicBpValue >= 140) ||
      (confirmedHypertensionVal === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.setTMCSuggested();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
      this.idrsScoreService.clearTMCSuggested();
    }
  }
}
