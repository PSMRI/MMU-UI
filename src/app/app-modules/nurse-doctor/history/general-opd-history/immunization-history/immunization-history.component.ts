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
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

import { MasterdataService, DoctorService } from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-immunization-history',
  templateUrl: './immunization-history.component.html',
  styleUrls: ['./immunization-history.component.css'],
})
export class ImmunizationHistoryComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  immunizationHistoryForm: any;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  temp: any;
  beneficiaryAge: any;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    console.log('immunization');
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

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }

  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          if (
            beneficiary !== null &&
            beneficiary.age !== undefined &&
            beneficiary.age !== null
          ) {
            this.beneficiaryAge = beneficiary.age.split('-')[0].trim();
          }
        }
      );
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData && masterData.childVaccinations) {
          this.masterData = masterData;
          this.getBeneficiaryDetails();
          this.filterImmunizationList(masterData.childVaccinations);
        }
      });
  }

  filterImmunizationList(list: any) {
    const immunizationAge: any = [];
    const temp: any = [];

    list.forEach((element: any) => {
      if (
        immunizationAge.indexOf(element.vaccinationTime) < 0 &&
        this.getAgeValue(element.vaccinationTime) <=
          this.getAgeValue(this.beneficiaryAge)
      )
        immunizationAge.push(element.vaccinationTime);
    });

    immunizationAge.sort((prev: any, next: any) => {
      return this.getAgeValue(prev) - this.getAgeValue(next);
    });

    immunizationAge.forEach((item: any) => {
      const vaccines: any = [];
      list.forEach((element: any) => {
        if (element.vaccinationTime === item) {
          if (element.sctCode !== null) {
            vaccines.push({
              vaccine: element.vaccineName,
              sctCode: element.sctCode,
              sctTerm: element.sctTerm,
              status: false,
            });
          } else {
            vaccines.push({
              vaccine: element.vaccineName,
              sctCode: null,
              sctTerm: null,
              status: false,
            });
          }
        }
      });
      temp.push({ defaultReceivingAge: item, vaccines: vaccines });
    });

    this.temp = temp;
    this.initImmunizationForm();
  }

  initImmunizationForm() {
    for (let i = 0; i < this.temp.length; i++) {
      this.addImmunization();
      for (let j = 0; j < this.temp[i].vaccines.length; j++) this.addVaccine(i);
    }
    (<FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    )).patchValue(this.temp);

    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.loadVaccineData(benRegID, visitID);
    }
  }

  checkSelectALL: any = [];
  count: any;
  immunizationHistorySubscription: any;
  loadVaccineData(regId: any, visitID: any) {
    this.immunizationHistorySubscription = this.doctorService
      .getGeneralHistoryDetails(regId, visitID)
      .subscribe((history: any) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.ImmunizationHistory &&
          history.data.ImmunizationHistory.immunizationList
        ) {
          const temp = history.data.ImmunizationHistory;
          (<FormArray>(
            this.immunizationHistoryForm.controls['immunizationList']
          )).patchValue(temp.immunizationList);
          console.log('temp.immunizationList', temp.immunizationList);

          temp.immunizationList.forEach((immunizationData: any) => {
            let vaccineStatusCount = 0;
            for (let i = 0; i < immunizationData.vaccines.length; i++) {
              if (
                immunizationData.vaccines[i].status &&
                immunizationData.vaccines[i].status === true
              ) {
                vaccineStatusCount = vaccineStatusCount + 1;
              }
            }

            if (vaccineStatusCount === immunizationData.vaccines.length) {
              this.checkSelectALL.push(true);
            } else {
              this.checkSelectALL.push(false);
            }
          });
        }
      });
  }

  addVaccine(i: any) {
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    const vaccineList = (<FormArray>immunizationList.controls[i]).get(
      'vaccines'
    ) as FormArray;
    vaccineList.push(this.initVaccineList());
  }

  addImmunization() {
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    immunizationList.push(this.initImmunizationList());
  }

  selectAll(event: any, i: any) {
    const value: any = event.checked;
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    const vaccineList: any = (<FormArray>immunizationList.controls[i]).get(
      'vaccines'
    ) as FormArray;
    immunizationList.markAsDirty();

    if (value) {
      vaccineList.controls.forEach((vaccine: FormGroup) => {
        vaccine.patchValue({ status: true });
      });
    } else {
      vaccineList.controls.forEach((vaccine: FormGroup) => {
        vaccine.patchValue({ status: false });
      });
    }
  }

  getAgeValue(age: any) {
    if (!age) return 0;
    const arr = age.trim().split(' ');
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') return parseInt(arr[0]) * 12 * 30;
      else if (ageUnit.toLowerCase() === 'months') return parseInt(arr[0]) * 30;
      else if (ageUnit.toLowerCase() === 'weeks') return parseInt(arr[0]) * 7;
    }
    return 0;
  }

  initImmunizationList() {
    return this.fb.group({
      defaultReceivingAge: null,
      vaccines: this.fb.array([]),
    });
  }

  initVaccineList() {
    return this.fb.group({
      vaccine: null,
      sctCode: null,
      sctTerm: null,
      status: null,
    });
  }
}
