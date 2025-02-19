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
  OnDestroy,
  DoCheck,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';

import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-cancer-family-disease-history',
  templateUrl: './family-disease-history.component.html',
  styleUrls: ['./family-disease-history.component.css'],
})
export class FamilyDiseaseHistoryComponent
  implements OnInit, OnDestroy, DoCheck
{
  @Input()
  cancerPatientFamilyMedicalHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  familyHistoryData: any;
  beneficiary: any;
  templateNurseMasterData: any;
  templateCancerDiseaseType: any;
  templateFamilyMemberType: any;

  filterCancerDiseaseType: any;
  filterFamilyMemebers: any;
  temp: any = [];
  previousValue: any = [];
  otherDiseaseType: any;

  formUtils: CancerUtils;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private httpServiceService: HttpServiceService,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private languageComponent: SetLanguageComponent,
    readonly sessionstorage: SessionStorageService
  ) {
    this.formUtils = new CancerUtils(this.fb, this.sessionstorage);
  }

  ngOnInit() {
    this.fetchLanguageResponse();
    this.getNurseMasterData();
    this.getBenificiaryDetails();
  }

  getDiseases(): AbstractControl[] | null {
    const diseasesControl =
      this.cancerPatientFamilyMedicalHistoryForm.get('diseases');
    return diseasesControl instanceof FormArray
      ? diseasesControl.controls
      : null;
  }

  handleFamilyHistoryData() {
    const formArray = this.cancerPatientFamilyMedicalHistoryForm.controls[
      'diseases'
    ] as FormArray;
    const temp = this.familyHistoryData.slice();

    for (let i = 0; i < temp.length; i++) {
      const cancerType = this.templateCancerDiseaseType.filter((item: any) => {
        return item.cancerDiseaseType === temp[i].cancerDiseaseType;
      });

      const otherCancerObj = this.templateCancerDiseaseType.filter(
        (item: any) => {
          return item.cancerDiseaseType === 'Any other Cancer';
        }
      );

      if (cancerType.length > 0) temp[i].cancerDiseaseType = cancerType[0];
      else if (temp[i].cancerDiseaseType) {
        temp[i].otherDiseaseType = temp[i].cancerDiseaseType;
        temp[i].cancerDiseaseType = otherCancerObj[0];
      }

      if (temp[i].cancerDiseaseType) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsTouched();
        this.filterFamilyMember(temp[i].cancerDiseaseType, i);
      }

      if (i + 1 < temp.length) this.addFamilyDisease();
    }
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();

    if (this.cancerHistorySubscription)
      this.cancerHistorySubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(nurseMasterData => {
        if (nurseMasterData) {
          this.templateNurseMasterData = nurseMasterData;
          this.templateCancerDiseaseType =
            this.templateNurseMasterData.CancerDiseaseType;
          this.filterCancerDiseaseType = this.templateCancerDiseaseType.slice();
          this.templateFamilyMemberType =
            this.templateNurseMasterData.familyMemberTypes;
          this.filterFamilyMemebers = this.templateFamilyMemberType;
          this.temp[0] = {
            diseaseType: this.templateCancerDiseaseType.slice(),
          };

          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getCancerHistory(benRegID, visitID);
          }
        }
      });
  }

  cancerHistorySubscription: any;
  getCancerHistory(benRegID: any, visitID: any) {
    this.cancerHistorySubscription = this.doctorService
      .getCancerHistoryDetails(benRegID, visitID)
      .subscribe((history: any) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null
        ) {
          const cancerHistoryData = history.data;
          this.familyHistoryData = cancerHistoryData.benFamilyHistory;
          this.handleFamilyHistoryData();
        }
      });
  }

  beneficiaryDetailSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiaryDetails => {
          if (beneficiaryDetails)
            console.log('beneficiary', beneficiaryDetails);
        }
      );
  }

  filterFamilyMember(
    type: any,
    i: any,
    familyDiseaseForm?: AbstractControl<any, any>
  ) {
    const arr = this.templateCancerDiseaseType.filter((item: any) => {
      return item.cancerDiseaseType === type.cancerDiseaseType;
    });

    if (this.previousValue[i]) {
      for (let t = 0; t < this.temp.length; t++) {
        if (
          t !== i &&
          this.temp[t].diseaseType.indexOf(this.previousValue[i]) < 0
        ) {
          this.temp[t].diseaseType = [
            ...this.temp[t].diseaseType,
            this.previousValue[i],
          ];
          this.sortDiseaseList(this.temp[t].diseaseType);
        }
      }
    }

    if (familyDiseaseForm instanceof FormGroup) {
      if (type.cancerDiseaseType !== 'Any other Cancer') {
        familyDiseaseForm.patchValue({
          snomedCode: type.snomedCode,
          snomedTerm: type.snomedTerm,
        });
        for (let t = 0; t < this.temp.length; t++) {
          const index = this.temp[t].diseaseType.indexOf(arr[0]);
          if (index >= 0 && t !== i) {
            this.temp[t].diseaseType = [
              ...this.temp[t].diseaseType.slice(0, index),
              ...this.temp[t].diseaseType.slice(index + 1),
            ];
          }
        }
      } else {
        familyDiseaseForm.patchValue({ snomedCode: null, snomedTerm: null });
      }
    }

    this.filterFamilyMemebers = this.templateFamilyMemberType.filter(
      (item: any) => {
        return type.gender === 'unisex' || item.gender === type.gender;
      }
    );
    this.temp[i].familyMembers = this.filterFamilyMemebers;
    this.previousValue[i] = type;
  }

  // filterFamilyMember(type: any, i: any, familyDiseaseForm?: FormGroup) {
  //   const arr = this.templateCancerDiseaseType.filter((item: any) => {
  //     return item.cancerDiseaseType === type.cancerDiseaseType;
  //   });

  //   if (this.previousValue[i]) {
  //     this.temp.map((item: any, t: any) => {
  //       if (t !== i && item.diseaseType.indexOf(this.previousValue[i]) < 0) {
  //         item.diseaseType = item.diseaseType.concat([this.previousValue[i]]);
  //         this.sortDiseaseList(item.diseaseType);
  //       }
  //     });
  //   }

  //   if (familyDiseaseForm) {
  //     if (type.cancerDiseaseType !== 'Any other Cancer') {
  //       familyDiseaseForm.patchValue({
  //         snomedCode: type.snomedCode,
  //         snomedTerm: type.snomedTerm,
  //       });
  //       this.temp.map((item: any, t: any) => {
  //         const index = item.diseaseType.indexOf(arr[0]);
  //         if (index >= 0 && t !== i) item.diseaseType.splice(index, 1);
  //       });
  //     } else {
  //       familyDiseaseForm.patchValue({ snomedCode: null, snomedTerm: null });
  //     }
  //   }

  //   this.filterFamilyMemebers = this.templateFamilyMemberType.filter(
  //     (item: any) => {
  //       return type.gender === 'unisex' || item.gender === type.gender;
  //     }
  //   );
  //   this.temp[i].familyMemebers = this.filterFamilyMemebers;
  //   this.previousValue[i] = type;
  // }

  addFamilyDisease() {
    const newDisease = <FormArray>(
      this.cancerPatientFamilyMedicalHistoryForm.controls['diseases']
    );

    const result = [];
    let i, j;
    const array1 = newDisease.value;
    for (i = 0; i < this.filterCancerDiseaseType.length; i++) {
      let flag = false;
      for (j = 0; j < array1.length; j++) {
        if (
          array1[j].cancerDiseaseType !== null &&
          array1[j].cancerDiseaseType.cancerDiseaseType !==
            'Any other Cancer' &&
          this.filterCancerDiseaseType[i].cancerDiseaseType ===
            array1[j].cancerDiseaseType.cancerDiseaseType
        ) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        result.push(this.filterCancerDiseaseType[i]);
      }
    }

    this.temp.push({ diseaseType: result.slice() });
    newDisease.push(this.formUtils.initDiseases());
  }

  removeDisease(i: number, diseaseForm: AbstractControl<any, any>) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe(result => {
        if (result) {
          const newDisease = <FormArray>(
            this.cancerPatientFamilyMedicalHistoryForm.controls['diseases']
          );

          this.cancerPatientFamilyMedicalHistoryForm.markAsDirty();
          if (newDisease.length === 1) {
            diseaseForm.reset();
          } else {
            const arr = this.templateCancerDiseaseType.filter((item: any) => {
              if (newDisease.value[i].cancerDiseaseType)
                return (
                  item.cancerDiseaseType ===
                  newDisease.value[i].cancerDiseaseType.cancerDiseaseType
                );
              else return false;
            });

            if (
              arr.length >= 1 &&
              arr[0].cancerDiseaseType !== 'Any other Cancer'
            ) {
              this.temp.map((item: any) => {
                if (item.diseaseType.indexOf(arr[0]) < 0) {
                  item.diseaseType = item.diseaseType.concat(arr);
                  this.sortDiseaseList(item.diseaseType);
                }
              });
            }

            this.previousValue.splice(i, 1);
            newDisease.removeAt(i);
            this.temp.splice(i, 1);
          }
        }
      });
  }

  getPreviousCancerFamilyHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService.getPreviousCancerFamilyHistory(benRegID).subscribe(
      (data: any) => {
        if (data !== null && data.data !== null) {
          if (data.data.data.length > 0) {
            this.viewPreviousData(data.data);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.previousInfo
            );
          }
        } else {
          this.confirmationService.alert(data.errorStatus, 'error');
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.common.prevFamilyHistory,
      },
    });
  }

  sortDiseaseList(diseaseList: any) {
    diseaseList.sort((a: any, b: any) => {
      if (a.cancerDiseaseType === b.cancerDiseaseType) return 0;
      if (a.cancerDiseaseType < b.cancerDiseaseType) return -1;
      else return 1;
    });
  }

  checkValidity(diseaseForm: any) {
    const temp = diseaseForm.value;
    if (temp && temp.cancerDiseaseType && temp.familyMemberList) {
      return false;
    } else {
      return true;
    }
  }

  //BU40088124 12/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
