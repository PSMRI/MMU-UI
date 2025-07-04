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
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-development-history',
  templateUrl: './development-history.component.html',
  styleUrls: ['./development-history.component.css'],
})
export class DevelopmentHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  developmentHistoryForm!: FormGroup;

  @Input()
  visitCategory: any;

  @Input()
  mode!: string;

  masterData: any;
  currentLanguageSet: any;

  constructor(
    private masterdataService: MasterdataService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData) {
          this.masterData = masterData;
          console.log('this.masterData ', this.masterData);
          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getGeneralHistory(benRegID, visitID);
          }
        }
      });
  }

  developmentHistoryData: any;
  generalHistorySubscription: any;
  getGeneralHistory(benRegID: any, visitID: any) {
    this.generalHistorySubscription = this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.DevelopmentHistory
        ) {
          this.developmentHistoryData = history.data.DevelopmentHistory;
          console.log(
            'history.data DEVELOPMWENTAL',
            this.developmentHistoryData
          );
          this.developmentHistoryForm.patchValue(this.developmentHistoryData);
        }
      });
  }

  getPreviousDevelopmentalHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    console.log('here checkig', this.visitCategory);

    this.nurseService
      .getPreviousDevelopmentalHistory(benRegID, this.visitCategory)
      .subscribe(
        (data: any) => {
          if (data !== null && data.data !== null) {
            if (data.data.data.length > 0) {
              this.viewPreviousData(data.data);
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
        title:
          this.currentLanguageSet.historyData.Perinatalhistorydetails
            .developmentalhistorydetails,
      },
    });
  }
}
