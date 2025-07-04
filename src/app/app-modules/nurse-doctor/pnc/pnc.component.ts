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
import { FormBuilder, FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../shared/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-pnc',
  templateUrl: './pnc.component.html',
  styleUrls: ['./pnc.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class PncComponent implements OnInit, DoCheck, OnChanges, OnDestroy {
  @Input()
  patientPNCDataForm!: FormGroup;

  @Input()
  mode!: string;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBenificiaryDetails();
    this.today = new Date();
    this.minimumDeliveryDate = new Date(
      this.today.getTime() - 365 * 24 * 60 * 60 * 1000
    );
  }
  /*
   * JA354063 - Multilingual Changes added on 13/10/21
   */
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  // Ends
  beneficiaryAge: any;
  today = new Date();
  minimumDeliveryDate = new Date();
  dob = new Date();

  ngOnChanges() {
    if (
      this.mode !== undefined &&
      this.mode !== null &&
      this.mode.toLowerCase() === 'view'
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    }

    if (
      this.mode !== undefined &&
      this.mode !== null &&
      this.mode.toLowerCase() === 'update'
    ) {
      this.updatePatientPNC(this.patientPNCDataForm);
    }
  }

  patchDataToFields(benRegID: any, visitID: any) {
    this.doctorService
      .getPNCDetails(benRegID, visitID)
      .subscribe((pNCdata: any) => {
        const tempPNCData = Object.assign({}, pNCdata.data.PNCCareDetail);

        if (this.masterData.deliveryTypes) {
          tempPNCData.deliveryType = this.masterData.deliveryTypes.filter(
            (data: any) => {
              return data.deliveryType === tempPNCData.deliveryType;
            }
          )[0];
        }

        if (this.masterData.deliveryPlaces) {
          tempPNCData.deliveryPlace = this.masterData.deliveryPlaces.filter(
            (data: any) => {
              return data.deliveryPlace === tempPNCData.deliveryPlace;
            }
          )[0];
        }

        if (this.masterData.deliveryComplicationTypes) {
          tempPNCData.deliveryComplication =
            this.masterData.deliveryComplicationTypes.filter((data: any) => {
              return (
                data.deliveryComplicationType ===
                tempPNCData.deliveryComplication
              );
            })[0];
        }

        if (this.masterData.pregOutcomes) {
          tempPNCData.pregOutcome = this.masterData.pregOutcomes.filter(
            (data: any) => {
              return data.pregOutcome === tempPNCData.pregOutcome;
            }
          )[0];
        }

        if (this.masterData.postNatalComplications) {
          tempPNCData.postNatalComplication =
            this.masterData.postNatalComplications.filter((data: any) => {
              return (
                data.complicationValue === tempPNCData.postNatalComplication
              );
            })[0];
        }

        if (this.masterData.gestation) {
          tempPNCData.gestationName = this.masterData.gestation.filter(
            (data: any) => {
              return data.name === tempPNCData.gestationName;
            }
          )[0];
        }

        if (this.masterData.newbornHealthStatuses) {
          tempPNCData.newBornHealthStatus =
            this.masterData.newbornHealthStatuses.filter((data: any) => {
              return (
                data.newBornHealthStatus === tempPNCData.newBornHealthStatus
              );
            })[0];
        }

        tempPNCData.dDate = new Date(tempPNCData.dateOfDelivery);

        const patchPNCdata = Object.assign({}, tempPNCData);
        this.patientPNCDataForm.patchValue(tempPNCData);
      });
  }

  updatePatientPNC(patientPNCDataForm: FormGroup) {
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.doctorService.updatePNCDetails(patientPNCDataForm, temp).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          this.confirmationService.alert(res.data.response, 'success');
          this.patientPNCDataForm.markAsPristine();
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
  }

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiaryDetails => {
          if (beneficiaryDetails) {
            console.log('beneficiaryDetails', beneficiaryDetails.ageVal);
            this.beneficiaryAge = beneficiaryDetails.ageVal;
            if (!this.mode) this.checkDate();
          }
        }
      );
  }

  checkDate() {
    this.today = new Date();
    this.dob = new Date();
    this.dob.setFullYear(this.today.getFullYear() - this.beneficiaryAge);
    console.log('this.dob', this.dob, 'this.today', this.today);
  }

  checkWeight() {
    if (this.birthWeightOfNewborn >= 6.0)
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
  }

  get birthWeightOfNewborn() {
    return this.patientPNCDataForm.controls['birthWeightOfNewborn'].value;
  }

  get deliveryPlace() {
    return this.patientPNCDataForm.controls['deliveryPlace'].value;
  }

  resetOtherPlaceOfDelivery() {
    this.selectDeliveryTypes = [];
    if (
      this.deliveryPlace.deliveryPlace === 'Home-Supervised' ||
      this.deliveryPlace.deliveryPlace === 'Home-Unsupervised'
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
    this.patientPNCDataForm.patchValue({
      otherDeliveryPlace: null,
      deliveryType: null,
    });
    // this.patientPNCDataForm.controls['deliveryType'].markAsUntouched();
    // this.patientPNCDataForm.controls['deliveryType'].markAsPristine();
  }

  masterData: any;
  selectDeliveryTypes: any;
  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData && masterData.deliveryTypes) {
          console.log(
            'masterData?.deliveryComplicationTypes',
            masterData.deliveryComplicationTypes
          );

          this.masterData = masterData;
          this.selectDeliveryTypes = this.masterData.deliveryTypes;

          if (this.mode) {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.patchDataToFields(benRegID, visitID);
          }
        }
      });
  }

  resetOtherDeliveryComplication() {
    this.patientPNCDataForm.patchValue({ otherDeliveryComplication: null });
  }

  get deliveryComplication() {
    return this.patientPNCDataForm.controls['deliveryComplication'].value;
  }

  get otherDeliveryComplication() {
    return this.patientPNCDataForm.controls['otherDeliveryComplication'].value;
  }

  resetOtherPostNatalComplication() {
    this.patientPNCDataForm.patchValue({ otherPostNatalComplication: null });
  }

  get postNatalComplication() {
    return this.patientPNCDataForm.controls['postNatalComplication'].value;
  }

  get otherPostNatalComplication() {
    return this.patientPNCDataForm.controls['otherPostNatalComplication'].value;
  }
}
