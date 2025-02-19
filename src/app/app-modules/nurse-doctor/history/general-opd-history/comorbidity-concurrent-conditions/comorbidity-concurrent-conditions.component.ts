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
  FormGroup,
  FormBuilder,
  FormArray,
  AbstractControl,
} from '@angular/forms';

import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { ValidationUtils } from '../../../shared/utility/validation-utility';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-comorbidity-concurrent-conditions',
  templateUrl: './comorbidity-concurrent-conditions.component.html',
  styleUrls: ['./comorbidity-concurrent-conditions.component.css'],
})
export class ComorbidityConcurrentConditionsComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  comorbidityConcurrentConditionsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  comorbidtyData: any;
  comorbidityMasterData: any;
  comorbidityFilteredMasterData: any;
  previousSelectedComorbidity: any = [];
  comorbiditySelectList: any = [];
  ComorbidStatus: string = 'false';
  currentLanguageSet: any;
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBeneficiaryDetails();
    this.onComorbidFilterClick();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getcomorbidityConcurrentConditions(): AbstractControl[] | null {
    const comorbidityConcurrentConditionsControl =
      this.comorbidityConcurrentConditionsForm.get(
        'comorbidityConcurrentConditionsList'
      );
    return comorbidityConcurrentConditionsControl instanceof FormArray
      ? comorbidityConcurrentConditionsControl.controls
      : null;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
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
          this.comorbidityMasterData = masterData.comorbidConditions;
          this.comorbidityFilteredMasterData = masterData.comorbidConditions;

          this.addComorbidityConcurrentConditions();

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
          history.data.ComorbidityConditions
        ) {
          this.comorbidtyData = history.data.ComorbidityConditions;
          this.handleComorbidityData();
        }
      });
  }

  handleComorbidityData() {
    const formArray = this.comorbidityConcurrentConditionsForm.controls[
      'comorbidityConcurrentConditionsList'
    ] as FormArray;
    const temp =
      this.comorbidtyData.comorbidityConcurrentConditionsList.slice();

    for (let i = 0; i < temp.length; i++) {
      const comorbidityTypeArr = this.comorbidityMasterData.filter(
        (item: any) => {
          return item.comorbidCondition === temp[i].comorbidCondition;
        }
      );

      if (comorbidityTypeArr.length > 0)
        temp[i].comorbidConditions = comorbidityTypeArr[0];

      if (temp[i].comorbidCondition) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsDirty();
        k.markAsTouched();
        this.filterComorbidityConcurrentConditionsType(
          temp[i].comorbidCondition,
          i
        );
        if (
          k?.get('comorbidConditions')?.value !== null &&
          k?.get('timePeriodAgo')?.value !== null &&
          k?.get('timePeriodUnit')?.value !== null
        ) {
          k?.get('timePeriodAgo')?.enable();
          k?.get('timePeriodUnit')?.enable();
          k?.get('isForHistory')?.enable();
        }
      }

      if (i + 1 < temp.length) this.addComorbidityConcurrentConditions();
    }
  }

  addComorbidityConcurrentConditions() {
    const comorbidityConcurrentConditionsList = <FormArray>(
      this.comorbidityConcurrentConditionsForm.controls[
        'comorbidityConcurrentConditionsList'
      ]
    );
    const temp = comorbidityConcurrentConditionsList.value;

    if (this.comorbidityFilteredMasterData) {
      const result = this.comorbidityFilteredMasterData.filter((item: any) => {
        const arr = temp.filter((value: any) => {
          if (
            value.comorbidConditions !== null &&
            value.comorbidConditions.comorbidCondition !== 'Other'
          )
            return (
              value.comorbidConditions.comorbidCondition ===
              item.comorbidCondition
            );
          else return false;
        });
        if (
          (item.comorbidCondition === 'None' ||
            item.comorbidCondition === 'Nil') &&
          temp.length > 0
        )
          return false;
        else if (arr.length === 0) return true;
        else return false;
      });

      this.comorbiditySelectList.push(result.slice());
    }
    comorbidityConcurrentConditionsList.push(
      this.initComorbidityConcurrentConditions()
    );
  }

  removeComorbidityConcurrentConditions(
    i: any,
    comorbidityConcurrentConditionsForm?: AbstractControl<any, any>
  ) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe(result => {
        if (result) {
          const comorbidityConcurrentConditionsList = <FormArray>(
            this.comorbidityConcurrentConditionsForm.controls[
              'comorbidityConcurrentConditionsList'
            ]
          );
          if (
            comorbidityConcurrentConditionsList.length === 1 &&
            !!comorbidityConcurrentConditionsForm
          ) {
            comorbidityConcurrentConditionsForm.patchValue({
              comorbidConditions: null,
              otherComorbidCondition: null,
              timePeriodAgo: null,
              timePeriodUnit: null,
              isForHistory: null,
            });
            comorbidityConcurrentConditionsForm
              ?.get('timePeriodAgo')
              ?.disable();
            comorbidityConcurrentConditionsForm
              ?.get('timePeriodUnit')
              ?.disable();
          } else {
            const removedValue = this.previousSelectedComorbidity[i];

            this.comorbiditySelectList.map((item: any, t: any) => {
              if (
                t !== i &&
                removedValue &&
                removedValue.comorbidCondition !== 'Other'
              ) {
                item.push(removedValue);
                this.sortComorbidityList(item);
              }
            });

            this.previousSelectedComorbidity.splice(i, 1);
            this.comorbiditySelectList.splice(i, 1);

            comorbidityConcurrentConditionsList.removeAt(i);
          }
          this.comorbidityConcurrentConditionsForm.markAsDirty();
        }
      });
  }

  filterComorbidityConcurrentConditionsType(
    comorbidityConcurrentConditions: any,
    i: any,
    comorbidityConcurrentConditionsForm?: AbstractControl<any, any>
  ) {
    const previousValue = this.previousSelectedComorbidity[i];
    if (
      comorbidityConcurrentConditions.comorbidCondition === 'None' ||
      comorbidityConcurrentConditions.comorbidCondition === 'Nil'
    ) {
      this.removeComorbidityExecptNone();
    }
    if (
      comorbidityConcurrentConditionsForm &&
      comorbidityConcurrentConditions.comorbidCondition !== 'Other'
    )
      comorbidityConcurrentConditionsForm.patchValue({
        otherComorbidCondition: null,
      });

    if (previousValue) {
      this.comorbiditySelectList.map((item: any, t: any) => {
        if (t !== i && previousValue.comorbidCondition !== 'Other') {
          item.push(previousValue);
          this.sortComorbidityList(item);
        }
      });
    }

    this.comorbiditySelectList.map((item: any, t: any) => {
      const index = item.indexOf(comorbidityConcurrentConditions);
      if (
        index !== -1 &&
        t !== i &&
        comorbidityConcurrentConditions.comorbidCondition !== 'Other'
      )
        item = item.splice(index, 1);
    });

    this.previousSelectedComorbidity[i] = comorbidityConcurrentConditions;
    //To disable the fields
    if (
      comorbidityConcurrentConditions.comorbidCondition !== 'Nil' &&
      comorbidityConcurrentConditions.comorbidCondition !== 'None'
    ) {
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.enable();
      comorbidityConcurrentConditionsForm?.get('isForHistory')?.enable();
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.reset();
    } else {
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.disable();
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.reset();
      comorbidityConcurrentConditionsForm?.get('timePeriodUnit')?.disable();
      comorbidityConcurrentConditionsForm?.get('timePeriodUnit')?.reset();
      comorbidityConcurrentConditionsForm?.get('isForHistory')?.disable();
      comorbidityConcurrentConditionsForm?.get('isForHistory')?.reset();
    }
  }

  removeComorbidityExecptNone() {
    const comorbidityConcurrentConditionsList = <FormArray>(
      this.comorbidityConcurrentConditionsForm.controls[
        'comorbidityConcurrentConditionsList'
      ]
    );

    while (comorbidityConcurrentConditionsList.length > 1) {
      const i = comorbidityConcurrentConditionsList.length - 1;

      const removedValue = this.previousSelectedComorbidity[i];
      if (removedValue) this.comorbiditySelectList[0].push(removedValue);

      this.sortComorbidityList(this.comorbiditySelectList[0]);

      comorbidityConcurrentConditionsList.removeAt(i);
      this.previousSelectedComorbidity.splice(i, 1);
      this.comorbiditySelectList.splice(i, 1);
    }
  }

  getPreviousComorbidityHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousComorbidityHistory(benRegID, this.visitCategory)
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
        title:
          this.currentLanguageSet.historyData.comorbiditycondition
            .previouscomorbidityhistory,
      },
    });
  }

  initComorbidityConcurrentConditions() {
    return this.fb.group({
      comorbidConditions: null,
      otherComorbidCondition: null,
      timePeriodAgo: { value: null, disabled: true },
      timePeriodUnit: { value: null, disabled: true },
      isForHistory: { value: null, disabled: true },
    });
  }

  validateDuration(formGroup: AbstractControl<any, any>, event?: Event) {
    let duration = null;
    let durationUnit = null;
    let flag = true;

    if (formGroup.value.timePeriodAgo) duration = formGroup.value.timePeriodAgo;

    if (formGroup.value.timePeriodUnit)
      durationUnit = formGroup.value.timePeriodUnit;

    if (duration !== null && durationUnit !== null)
      flag = new ValidationUtils().validateDuration(
        duration,
        durationUnit,
        this.beneficiary.age
      );

    if (!flag) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.durationGreaterThanAge
      );
      formGroup.patchValue({ timePeriodAgo: null, timePeriodUnit: null });
    }
    //to disable
    if (duration && !durationUnit) {
      formGroup?.get('timePeriodUnit')?.enable();
      formGroup?.get('timePeriodUnit')?.reset();
    } else if (!duration) {
      formGroup?.get('timePeriodUnit')?.disable();
      formGroup?.get('timePeriodUnit')?.reset();
    }
  }

  sortComorbidityList(comorbidityList: any) {
    comorbidityList.sort((a: any, b: any) => {
      if (a.comorbidCondition === b.comorbidCondition) return 0;
      if (a.comorbidCondition < b.comorbidCondition) return -1;
      else return 1;
    });
  }

  checkValidity(comorbidityConcurrentConditions: AbstractControl<any, any>) {
    if (
      comorbidityConcurrentConditions?.get('comorbidConditions')?.value &&
      comorbidityConcurrentConditions?.get('timePeriodAgo')?.value &&
      comorbidityConcurrentConditions?.get('timePeriodUnit')?.value
    ) {
      return false;
    } else {
      return true;
    }
  }
  onComorbidFilterClick() {
    const visitCat = this.sessionstorage.getItem('visiCategoryANC');
    if (visitCat === 'COVID-19 Screening') {
      this.ComorbidStatus = 'true';
    } else {
      this.ComorbidStatus = 'false';
    }
  }
}
