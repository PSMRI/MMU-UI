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

import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import {
  ConfirmationService,
  BeneficiaryDetailsService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { MatDialog } from '@angular/material/dialog';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-physical-activity-history',
  templateUrl: './physical-activity-history.component.html',
  styleUrls: ['./physical-activity-history.component.css'],
})
export class PhysicalActivityHistoryComponent implements OnInit, DoCheck {
  @Input()
  physicalActivityHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;
  masterData: any;
  physicalActivityQuestions: any;
  visitType: any;
  physicalActivityHistoryData: any;
  beneficiaryDetailSubscription: any;
  age: any;
  currentLanguageSet: any;

  constructor(
    private idrsScoreService: IdrsscoreService,
    private dialog: MatDialog,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    private nurseService: NurseService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBeneficiaryDetails();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData) {
          this.masterData = masterData;
          this.physicalActivityQuestions = this.masterData.physicalActivity;
          console.log('masterData', this.masterData);

          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            const visitCategory = this.sessionstorage.getItem('visitCategory');
            if (
              visitID !== null &&
              benRegID !== null &&
              visitCategory === 'NCD screening'
            ) {
              this.getGeneralHistory(benRegID, visitID);
            }
          }
        }
      });
  }
  generalHistorySubscription: any;
  getGeneralHistory(benRegID: any, visitID: any) {
    this.generalHistorySubscription = this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.FamilyHistory
        ) {
          this.physicalActivityHistoryData =
            history.data.PhysicalActivityHistory;
          if (this.physicalActivityHistoryData !== undefined)
            this.handlePysicalActivityHistoryData();
        }
      });
  }
  handlePysicalActivityHistoryData() {
    this.physicalActivityHistoryForm.patchValue(
      this.physicalActivityHistoryData
    );
    const selectedQuestion = this.physicalActivityQuestions.filter(
      (item: any) => {
        return (
          item.activityType === this.physicalActivityHistoryData.activityType
        );
      }
    );
    if (selectedQuestion.length > 0) {
      this.idrsScoreService.setIRDSscorePhysicalActivity(
        selectedQuestion[0].score
      );
    }
  }
  calculateIDRSScore(event: any, formGrpup: any) {
    console.log('event', event);
    console.log('form', formGrpup);

    const selectedQuestion = this.physicalActivityQuestions.filter(
      (item: any) => {
        return item.activityType === event.value;
      }
    );

    console.log('questionId', selectedQuestion);
    const questionID = selectedQuestion[0].pAID;
    const IDRSScoreForPhysicalActivity = selectedQuestion[0].score;
    this.physicalActivityHistoryForm.patchValue({ pAID: questionID });
    this.physicalActivityHistoryForm.patchValue({
      score: IDRSScoreForPhysicalActivity,
    });

    this.idrsScoreService.setIRDSscorePhysicalActivity(
      IDRSScoreForPhysicalActivity
    );
    this.idrsScoreService.setIDRSScoreFlag();
  }

  getPreviousPhysicalActivityHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousPhysicalActivityHistory(benRegID, this.visitType)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.historyData.ancHistory
                  .previousHistoryDetails.pastHistoryalert
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.errorFetchingHistory,
              'error'
            );
          }
        },
        err => {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.errorFetchingHistory,
            'error'
          );
        }
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.previousPhyscialActivityHistoryDetails,
      },
    });
  }
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          console.log('idrs', beneficiary);
          if (beneficiary) {
            if (beneficiary.ageVal) {
              this.age = beneficiary.ageVal;
            } else {
              this.age = 0;
            }
          }
        }
      );
  }
}
