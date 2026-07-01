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
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { MatDialog } from '@angular/material/dialog';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { ZardDatePickerComponent } from 'Common-UI/v2/ui/date-picker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHistory } from '@ng-icons/lucide';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-general-refer',
  templateUrl: './general-refer.component.html',
  viewProviders: [provideIcons({ lucideHistory })],
  providers: [
    {
      provide: DatePipe,
    },
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgIf,
    NgFor,
    NgIcon,
    ...cardImports,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...tooltipImports,
    ...ZardSelectImports,
    ZardDatePickerComponent,
  ],
})
export class GeneralReferComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  referForm!: FormGroup;

  @Input()
  referMode!: string;

  revisitDate: any;
  tomorrow: any;
  maxSchedulerDate: any;
  today: any;
  higherHealthcareCenter: any;
  additionalServices: any;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;

  previousServiceList: any;
  referralReason: any;
  selectValue: any;
  selectValueService: any;
  healthCareReferred = false;
  showMsg: any = 0;
  tmcSuggested: any = 0;
  instituteFlag = false;
  hypertensionSelected: any = 0;
  confirmedDiabeticValue: any;
  currentLanguageSet: any;
  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    public datepipe: DatePipe,
    private masterdataService: MasterdataService,
    private idrsScoreService: IdrsscoreService,
    private nurseService: NurseService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private httpServices: HttpServiceService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    this.getDoctorMasterData();
    this.idrsScoreService.IDRSSuspectedFlag$.subscribe(response => {
      this.showMsg = response;
      if (this.showMsg > 0) sessionStorage.setItem('suspectFlag', 'true');
      else sessionStorage.setItem('suspectFlag', 'false');
    });
    this.idrsScoreService.tmcSuggestedFlag$.subscribe(
      response => (this.tmcSuggested = response)
    );
    this.idrsScoreService.referralSuggestedFlag$.subscribe(response => {
      this.showMsg = response;
      if (this.showMsg > 0) sessionStorage.setItem('suspectFlag', 'true');
      else sessionStorage.setItem('suspectFlag', 'false');
    });
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;
    this.referForm.get('referralReason')?.disable();
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

  ngOnDestroy() {
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.referSubscription) this.referSubscription.unsubscribe();

    this.idrsScoreService.clearSuspectedArrayFlag();
    this.idrsScoreService.clearTMCSuggested();
    this.idrsScoreService.clearReferralSuggested();
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe(masterData => {
        if (masterData) {
          this.higherHealthcareCenter = masterData.higherHealthCare;
          if (this.higherHealthcareCenter.length === 0) {
            this.instituteFlag = false;
            sessionStorage.setItem('instFlag', 'false');
          } else {
            this.instituteFlag = true;
            sessionStorage.setItem('instFlag', 'true');
          }
          this.additionalServices = masterData.additionalServices;
          console.log(masterData.revisitDate);
          console.log('hi');
          this.revisitDate = masterData.revisitDate;

          if (String(this.referMode) === 'view') {
            this.beneficiaryRegID =
              this.sessionstorage.getItem('beneficiaryRegID');
            this.visitID = this.sessionstorage.getItem('visitID');
            this.visitCategory = this.sessionstorage.getItem('visitCategory');
            this.getReferDetails(
              this.beneficiaryRegID,
              this.visitID,
              this.visitCategory
            );
          }
        }
      });
  }

  referSubscription: any;
  getReferDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.referSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.Refer) {
          this.patchReferDetails(res.data.Refer);
        }
      });
  }

  patchReferDetails(referDetails: any) {
    this.revisitDate = referDetails.revisitDate;
    this.referralReason = referDetails.referralReason;
    this.revisitDate = this.datepipe.transform(this.revisitDate, 'yyyy-MM-dd');
    const temp: any = [];
    if (referDetails.refrredToAdditionalServiceList) {
      this.previousServiceList = referDetails.refrredToAdditionalServiceList;
      referDetails.refrredToAdditionalServiceList.map((item: any) => {
        const arr = this.additionalServices.filter((element: any) => {
          return element.serviceName === item.serviceName;
        });
        if (arr.length > 0) temp.push(arr[0]);
      });
    }
    referDetails.refrredToAdditionalServiceList = temp.slice();

    const referedToInstitute = this.higherHealthcareCenter.filter(
      (item: any) => {
        return item.institutionID === referDetails.referredToInstituteID;
      }
    );
    if (referedToInstitute.length > 0) {
      referDetails.referredToInstituteName = referedToInstitute[0];
    }
    console.log('referredDet=' + referDetails);
    console.log('revisitDate' + this.revisitDate);
    referDetails.revisitDate = this.revisitDate;
    referDetails.referralReason = this.referralReason;
    this.referForm.patchValue({ referralReason: referDetails.referralReason });
    this.referForm.patchValue(referDetails);
    this.revisitDateModel = referDetails.revisitDate
      ? new Date(referDetails.revisitDate)
      : null;
    if (referDetails.referredToInstituteName !== null) {
      this.healthCareReferred = true;
    }
  }
  get RevisitDate() {
    return this.referForm.get('revisitDate');
  }

  get ReferralReason() {
    return this.referForm.get('referralReason');
  }

  checkdate(revisitDate: Date) {
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;

    const localDate = new Date(
      revisitDate.getTime() - revisitDate.getTimezoneOffset() * 60000
    );

    this.referForm.patchValue({ revisitDate: localDate.toISOString() });
  }

  canDisable(service: any) {
    if (this.previousServiceList) {
      const temp = this.previousServiceList.filter((item: any) => {
        return item === service.serviceName;
      });

      if (temp.length > 0) {
        service.disabled = true;
        return true;
      } else {
        service.disabled = false;
        return false;
      }
    } else {
      // If previousServiceList is falsy, return false or any other default value
      return false;
    }
  }

  public additionalservices(selected: any): void {
    if (selected !== null && selected.length > 0) {
      this.selectValueService = selected.length;
      console.log(this.selectValueService);
    }
    this.toggleReferralReasonValidator();
  }

  public higherhealthcarecenter(selected: any): void {
    if (selected !== null && selected.institutionName) {
      this.selectValue = 1;
      this.healthCareReferred = true;
    } // should display the selected option.
    this.toggleReferralReasonValidator();
    console.log(this.selectValue);
  }

  // --- Zard control adapters. z-select is string-valued and z-date-picker is
  // Date-valued, but the reactive-form controls keep their original object /
  // object-array / ISO-string values so the submission contract is unchanged. ---
  revisitDateModel: Date | null = null;

  get selectedServiceNames(): string[] {
    const val = this.referForm.get('refrredToAdditionalServiceList')?.value;
    return Array.isArray(val) ? val.map((s: any) => s?.serviceName) : [];
  }

  onInstituteChange(value: string | string[]): void {
    const id = Array.isArray(value) ? value[0] : value;
    const center = (this.higherHealthcareCenter || []).find(
      (c: any) => String(c.institutionID) === id
    );
    this.referForm.controls['referredToInstituteName'].setValue(center ?? null);
    this.referForm.controls['referredToInstituteName'].markAsDirty();
    this.higherhealthcarecenter(center ?? null);
  }

  onAdditionalServicesChange(value: string | string[]): void {
    const names = Array.isArray(value) ? value : [value];
    const selected = (this.additionalServices || []).filter((s: any) =>
      names.includes(s.serviceName)
    );
    this.referForm.controls['refrredToAdditionalServiceList'].setValue(
      selected
    );
    this.referForm.controls['refrredToAdditionalServiceList'].markAsDirty();
    this.additionalservices(selected);
  }

  onRevisitDateChange(date: Date | null): void {
    if (date) {
      this.checkdate(date);
    } else {
      this.referForm.patchValue({ revisitDate: null });
    }
  }

  private toggleReferralReasonValidator(): void {
    const control = this.referForm.get('referralReason');

    if (this.selectValue > 0 || this.selectValueService > 0) {
      control?.enable();
      control?.setValidators([Validators.required]);
    } else {
      control?.disable();
      control?.clearValidators();
    }

    control?.updateValueAndValidity();
  }

  getPreviousReferralHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousReferredHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.Referdetails
                  .previousReferralhistorynotAvailable
              );
            }
          } else {
            this.confirmationService.alert(
              'Error in fetching previous history',
              'error'
            );
          }
        },
        err => {
          this.confirmationService.alert(
            'Error in fetching previous history',
            'error'
          );
        }
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.previousReferralHistoryDetails,
      },
    });
  }
}
