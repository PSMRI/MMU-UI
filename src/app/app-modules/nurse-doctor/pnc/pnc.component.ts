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
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../shared/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgFor, NgIf } from '@angular/common';
import { NullDefaultValueDirective } from '../../core/directives/null-default-value.directive';
import { StringValidatorDirective } from '../../core/directives/stringValidator.directive';
import { NumberValidatorDirective } from '../../core/directives/numberValidator.directive';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { ZardDatePickerComponent } from 'Common-UI/v2/ui/date-picker';

@Component({
  selector: 'app-nurse-pnc',
  templateUrl: './pnc.component.html',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    NgIf,
    NullDefaultValueDirective,
    StringValidatorDirective,
    NumberValidatorDirective,
    ...cardImports,
    ...ZardFormImports,
    ZardInputDirective,
    ...ZardSelectImports,
    ZardDatePickerComponent,
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
  // z-date-picker is Date-valued; the reactive-form control keeps its original
  // ISO-string value, so this model is kept decoupled and synced via dateChange.
  deliveryDateModel: Date | null = null;

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

        tempPNCData.dDate = this.normalizeToUTCMidnight(
          new Date(tempPNCData.dateOfDelivery)
        );

        const patchPNCdata = Object.assign({}, tempPNCData);
        this.patientPNCDataForm.patchValue(tempPNCData);
        this.deliveryDateModel = tempPNCData.dDate
          ? new Date(tempPNCData.dDate)
          : null;
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

    const dDate = patientPNCDataForm.get('dDate')?.value;
    if (dDate) {
      patientPNCDataForm.patchValue({
        dateOfDelivery: this.normalizeToUTCMidnight(new Date(dDate)),
        dDate: this.normalizeToUTCMidnight(new Date(dDate)),
      });
    }

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

  // --- Zard control adapters. z-select is string-valued and z-date-picker is
  // Date-valued, but the reactive-form controls keep their original master-data
  // objects / ISO-string value so the submission contract is unchanged. Each
  // handler maps the emitted display string back to the master object. ---
  private singleValue(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
  }

  onDeliveryPlaceChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const place = (this.masterData?.deliveryPlaces || []).find(
      (p: any) => p.deliveryPlace === v
    );
    this.patientPNCDataForm.controls['deliveryPlace'].setValue(place ?? null);
    this.patientPNCDataForm.controls['deliveryPlace'].markAsDirty();
    this.resetOtherPlaceOfDelivery();
  }

  onDeliveryTypeChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const type = (this.selectDeliveryTypes || []).find(
      (t: any) => t.deliveryType === v
    );
    this.patientPNCDataForm.controls['deliveryType'].setValue(type ?? null);
    this.patientPNCDataForm.controls['deliveryType'].markAsDirty();
  }

  onDeliveryComplicationChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const complication = (
      this.masterData?.deliveryComplicationTypes || []
    ).find((item: any) => item.deliveryComplicationType === v);
    this.patientPNCDataForm.controls['deliveryComplication'].setValue(
      complication ?? null
    );
    this.patientPNCDataForm.controls['deliveryComplication'].markAsDirty();
    this.resetOtherDeliveryComplication();
  }

  onPregOutcomeChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const outcome = (this.masterData?.pregOutcomes || []).find(
      (item: any) => item.pregOutcome === v
    );
    this.patientPNCDataForm.controls['pregOutcome'].setValue(outcome ?? null);
    this.patientPNCDataForm.controls['pregOutcome'].markAsDirty();
  }

  onPostNatalComplicationChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const complication = (this.masterData?.postNatalComplications || []).find(
      (item: any) => item.complicationValue === v
    );
    this.patientPNCDataForm.controls['postNatalComplication'].setValue(
      complication ?? null
    );
    this.patientPNCDataForm.controls['postNatalComplication'].markAsDirty();
    this.resetOtherPostNatalComplication();
  }

  onGestationChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const gestation = (this.masterData?.gestation || []).find(
      (item: any) => item.name === v
    );
    this.patientPNCDataForm.controls['gestationName'].setValue(
      gestation ?? null
    );
    this.patientPNCDataForm.controls['gestationName'].markAsDirty();
  }

  onNewBornHealthStatusChange(value: string | string[]): void {
    const v = this.singleValue(value);
    const status = (this.masterData?.newbornHealthStatuses || []).find(
      (item: any) => item.newBornHealthStatus === v
    );
    this.patientPNCDataForm.controls['newBornHealthStatus'].setValue(
      status ?? null
    );
    this.patientPNCDataForm.controls['newBornHealthStatus'].markAsDirty();
  }

  onDeliveryDateChange(date: Date | null): void {
    this.patientPNCDataForm.controls['dDate'].setValue(date ?? null);
    this.patientPNCDataForm.controls['dDate'].markAsDirty();
  }

  private normalizeToUTCMidnight(date: Date | null | undefined): string | null {
    if (!date) return null;

    const d = new Date(date);
    const utcDate = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    );
    return utcDate.toISOString();
  }
}
