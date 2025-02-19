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
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-general-perinatal-history',
  templateUrl: './perinatal-history.component.html',
  styleUrls: ['./perinatal-history.component.css'],
})
export class PerinatalHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  perinatalHistoryForm!: FormGroup;

  @Input()
  visitCategory: any;

  @Input()
  mode!: string;

  masterData: any;
  selectDeliveryTypes: any;
  currentLanguageSet: any;
  constructor(
    private fb: FormBuilder,
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
          this.selectDeliveryTypes = this.masterData.deliveryTypes;
          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getGeneralHistory(benRegID, visitID);
          }
        }
      });
  }

  perinatalHistoryData: any;
  generalHistorySubscription: any;
  getGeneralHistory(benRegID: any, visitID: any) {
    this.generalHistorySubscription = this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.PerinatalHistory !== null
        ) {
          this.perinatalHistoryData = history.data.PerinatalHistory;

          if (this.perinatalHistoryData.deliveryPlaceID)
            this.perinatalHistoryData.placeOfDelivery =
              this.masterData.deliveryPlaces.filter((item: any) => {
                return (
                  item.deliveryPlaceID ===
                  this.perinatalHistoryData.deliveryPlaceID
                );
              })[0];

          if (this.perinatalHistoryData.deliveryTypeID)
            this.perinatalHistoryData.typeOfDelivery =
              this.masterData.deliveryTypes.filter((item: any) => {
                return (
                  item.deliveryTypeID ===
                  this.perinatalHistoryData.deliveryTypeID
                );
              })[0];

          if (this.perinatalHistoryData.complicationID)
            this.perinatalHistoryData.complicationAtBirth =
              this.masterData.deliveryComplicationTypes.filter((item: any) => {
                return (
                  item.complicationID ===
                  this.perinatalHistoryData.complicationID
                );
              })[0];

          this.perinatalHistoryForm.patchValue(this.perinatalHistoryData);
          //enabling the fields
          if (this.perinatalHistoryForm.controls['typeOfDelivery'].value) {
            this.perinatalHistoryForm?.get('typeOfDelivery')?.enable();
          } else {
            this.perinatalHistoryForm?.get('typeOfDelivery')?.disable();
          }
        }
      });
  }

  checkWeight(birthWeight_kg: any) {
    if (this.birthWeight_kg >= 6)
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
  }

  get birthWeight_kg() {
    return this.perinatalHistoryForm.controls['birthWeight_kg'].value;
  }

  get placeOfDelivery() {
    return this.perinatalHistoryForm.controls['placeOfDelivery'].value;
  }

  get complicationAtBirth() {
    return this.perinatalHistoryForm.controls['complicationAtBirth'].value;
  }

  resetOtherPlaceOfDelivery() {
    if (
      this.placeOfDelivery.deliveryPlace === 'Home-Supervised' ||
      this.placeOfDelivery.deliveryPlace === 'Home-Unsupervised'
    ) {
      const tempDeliveryTypes = this.masterData.deliveryTypes.filter(
        (item: any) => {
          console.log('item', item);

          return (
            item.deliveryType !== 'Assisted Delivery' &&
            item.deliveryType !== 'Cesarean Section (LSCS)'
          );
        }
      );
      this.selectDeliveryTypes = tempDeliveryTypes;
    } else {
      this.selectDeliveryTypes = this.masterData.deliveryTypes;
    }
    this.perinatalHistoryForm.patchValue({ otherPlaceOfDelivery: null });
    //enabling the fields
    if (this.placeOfDelivery.deliveryPlace) {
      this.perinatalHistoryForm?.get('typeOfDelivery')?.enable();
    } else {
      this.perinatalHistoryForm?.get('typeOfDelivery')?.disable();
    }
  }

  resetOtherComplicationAtBirth() {
    this.perinatalHistoryForm.patchValue({ otherComplicationAtBirth: null });
  }

  getPreviousPerinatalHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    console.log('here checkig', this.visitCategory);

    this.nurseService
      .getPreviousPerinatalHistory(benRegID, this.visitCategory)
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
