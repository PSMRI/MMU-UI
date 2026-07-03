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
  FormArray,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { NullDefaultValueDirective } from '../../../../core/directives/null-default-value.directive';
import { StringValidatorDirective } from '../../../../core/directives/stringValidator.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHistory, lucidePlus, lucideX } from '@ng-icons/lucide';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';

@Component({
  selector: 'app-general-other-vaccines',
  templateUrl: './other-vaccines.component.html',
  imports: [
    ReactiveFormsModule,
    NgFor,
    NgClass,
    NgIf,
    NgIcon,
    ...tooltipImports,
    ZardButtonComponent,
    ...ZardFormImports,
    ZardInputDirective,
    ...ZardSelectImports,
    NullDefaultValueDirective,
    StringValidatorDirective,
  ],
  viewProviders: [provideIcons({ lucideHistory, lucidePlus, lucideX })],
})
export class OtherVaccinesComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  otherVaccinesForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  otherVaccineData: any;

  vaccineMasterData = [];
  previousSelectedVaccineList: any = [];
  vaccineSelectList: any = [];
  count = 0;
  currentLanguageSet: any;
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private masterdataService: MasterdataService,
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

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }

  getOtherVaccines(): AbstractControl[] | null {
    const otherVaccinesControl = this.otherVaccinesForm.get('otherVaccines');
    return otherVaccinesControl instanceof FormArray
      ? otherVaccinesControl.controls
      : null;
  }

  beneficiaryDetailSubscription: any;
  beneficiary: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          this.beneficiary = beneficiary;
        }
      );
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData) {
          this.masterData = masterData;
          this.vaccineMasterData = masterData.vaccineMasterData;

          this.addOtherVaccine();

          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getGeneralHistory(benRegID, visitID);
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
          history.data.childOptionalVaccineHistory
        ) {
          this.otherVaccineData = history.data.childOptionalVaccineHistory;
          this.handleOtherVaccinesData();
        }
      });
  }

  handleOtherVaccinesData() {
    const formArray = this.otherVaccinesForm.controls[
      'otherVaccines'
    ] as FormArray;
    const temp = this.otherVaccineData.childOptionalVaccineList.slice();

    for (let i = 0; i < temp.length; i++) {
      const vaccines = this.vaccineMasterData.filter((item: any) => {
        return item.vaccineName === temp[i].vaccineName;
      });

      if (vaccines.length > 0) temp[i].vaccineName = vaccines[0];

      if (temp[i].vaccineName) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsTouched();
        this.filterOtherVaccineList(temp[i].vaccineName, i);
      }

      if (i + 1 < temp.length) this.addOtherVaccine();
    }
  }

  addOtherVaccine() {
    const otherVaccineList = <FormArray>(
      this.otherVaccinesForm.controls['otherVaccines']
    );
    const temp = otherVaccineList.value;
    let result: any = [];

    if (this.vaccineMasterData) {
      result = this.vaccineMasterData.filter((item: any) => {
        const arr = temp.filter((value: any) => {
          if (
            value.vaccineName !== null &&
            value.vaccineName.vaccineName !== 'Other'
          )
            return value.vaccineName.vaccineName === item.vaccineName;
          else return false;
        });
        const flag = arr.length === 0 ? true : false;
        return flag;
      });
    }
    this.vaccineSelectList.push(result.slice());
    otherVaccineList.push(this.initOtherVaccinesForm());
  }

  // The vaccineName control stores the full vaccine OBJECT, but z-select is
  // string-valued. Expose the option's display name for the trigger.
  getVaccineNameLabel(vaccine: AbstractControl<any, any>): string {
    return vaccine.value.vaccineName?.vaccineName ?? '';
  }

  // z-select emits the selected option's string (vaccineName). Resolve it back
  // to the matching object INSTANCE in vaccineSelectList[i] (identity matters:
  // filterOtherVaccineList uses indexOf on that instance), patch the control,
  // then delegate to the existing handler with the { value } shape it expects
  // (previously supplied by MatSelectChange).
  onVaccineNameChange(
    value: string | string[],
    i: any,
    vaccineForm?: AbstractControl<any, any>
  ) {
    const name = Array.isArray(value) ? value[0] : value;
    const selected = (this.vaccineSelectList[i] || []).find(
      (item: any) => item.vaccineName === name
    );
    if (!selected) return;
    vaccineForm?.patchValue({ vaccineName: selected });
    this.filterOtherVaccineList({ value: selected }, i, vaccineForm);
  }

  filterOtherVaccineList(
    event: any,
    i: any,
    vaccineForm?: AbstractControl<any, any>
  ) {
    const vaccine: any = event.value;
    const previousValue = this.previousSelectedVaccineList[i];
    const snomedCTCode = vaccine.sctCode;
    const snomedCTTerm = vaccine.sctTerm;
    if (vaccineForm && vaccine.vaccineName !== 'Other') {
      vaccineForm.patchValue({ otherVaccineName: null });
      if (vaccine.sctCode !== null) {
        vaccineForm.patchValue({
          sctCode: snomedCTCode,
          sctTerm: snomedCTTerm,
        });
      } else {
        vaccineForm.patchValue({ sctCode: null, sctTerm: null });
      }
    }
    if (previousValue) {
      this.vaccineSelectList.map((item: any, t: any) => {
        if (t !== i && previousValue.vaccineName !== 'Other') {
          item.push(previousValue);
          this.sortOtherVaccineList(item);
        }
      });
    }

    this.vaccineSelectList.map((item: any, t: any) => {
      const index = item.indexOf(vaccine);
      if (index !== -1 && t !== i && vaccine.vaccineName !== 'Other')
        item = item.splice(index, 1);
    });

    this.previousSelectedVaccineList[i] = vaccine;
  }

  removeOtherVaccine(i: any, vaccineForm?: AbstractControl<any, any>) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe(result => {
        if (result) {
          const otherVaccineList = <FormArray>(
            this.otherVaccinesForm.controls['otherVaccines']
          );
          this.otherVaccinesForm.markAsDirty();
          if (!!vaccineForm && otherVaccineList.length === 1) {
            vaccineForm.reset();
          } else {
            const removedValue = this.previousSelectedVaccineList[i];

            this.vaccineSelectList.map((item: any, t: any) => {
              if (
                t !== i &&
                !!removedValue &&
                removedValue.vaccineName !== 'Other'
              ) {
                item.push(removedValue);
                this.sortOtherVaccineList(item);
              }
            });

            this.previousSelectedVaccineList.splice(i, 1);
            this.vaccineSelectList.splice(i, 1);
            otherVaccineList.removeAt(i);
          }
        }
      });
  }

  initOtherVaccinesForm() {
    return this.fb.group({
      vaccineName: null,
      sctCode: null,
      sctTerm: null,
      otherVaccineName: null,
      actualReceivingAge: null,
      receivedFacilityName: null,
    });
  }

  getPreviousOtherVaccineDetails() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousOtherVaccines(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.alerts.info.pastHistoryNot
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
        title: this.currentLanguageSet.common.prevVaccine,
      },
    });
  }

  validateAge(formGroup: any) {
    const actualReceivingAge = formGroup.value.actualReceivingAge;

    if (this.beneficiary && this.beneficiary.ageVal < actualReceivingAge) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.ageOfReceivingVaccine
      );
      formGroup.patchValue({ actualReceivingAge: null });
    }
  }

  sortOtherVaccineList(otherVaccineList: any) {
    otherVaccineList.sort((a: any, b: any) => {
      if (a.vaccineName === b.vaccineName) return 0;
      if (a.vaccineName < b.vaccineName) return -1;
      else return 1;
    });
  }

  checkValidity(otherVaccineForm: any) {
    const temp = otherVaccineForm.value;
    if (
      temp.vaccineName &&
      temp.actualReceivingAge &&
      temp.receivedFacilityName
    ) {
      return false;
    } else {
      return true;
    }
  }
}
