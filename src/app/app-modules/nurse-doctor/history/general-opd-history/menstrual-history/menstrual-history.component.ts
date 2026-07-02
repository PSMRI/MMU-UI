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
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgFor, NgIf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHistory } from '@ng-icons/lucide';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { ZardRadioGroupComponent } from 'Common-UI/v2/ui/radio-group';
import { ZardRadioComponent } from 'Common-UI/v2/ui/radio';
import { ZardDatePickerComponent } from 'Common-UI/v2/ui/date-picker';

@Component({
  selector: 'app-general-menstrual-history',
  templateUrl: './menstrual-history.component.html',
  viewProviders: [provideIcons({ lucideHistory })],
  imports: [
    ReactiveFormsModule,
    NgFor,
    NgIf,
    NgIcon,
    ...tooltipImports,
    ZardButtonComponent,
    ...ZardFormImports,
    ...ZardSelectImports,
    ZardRadioGroupComponent,
    ZardRadioComponent,
    ZardDatePickerComponent,
  ],
})
export class MenstrualHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  menstrualHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  menstrualHistoryData: any;
  masterData: any;
  today: any;
  minimumLMPDate: any;
  currentLanguageSet: any;
  isNoneSelected = false;
  isOtherSelected = false;

  constructor(
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.today = new Date();
    this.minimumLMPDate = new Date(
      this.today.getTime() - 365 * 24 * 60 * 60 * 1000
    );
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
        if (
          masterData &&
          masterData.menstrualCycleStatus &&
          masterData.menstrualCycleLengths &&
          masterData.menstrualCycleBloodFlowDuration &&
          masterData.menstrualProblem
        ) {
          this.masterData = masterData;
          this.checkvisitCategory();
          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getGeneralHistory(benRegID, visitID);
          }
        }
      });
  }

  checkvisitCategory() {
    if (this.visitCategory === 'ANC') {
      let temp = 'Amenorrhea';
      temp = this.masterData.menstrualCycleStatus.filter((item: any) => {
        return item.name === temp;
      })[0];
      this.menstrualHistoryForm.patchValue({ menstrualCycleStatus: temp });
      this.menstrualHistoryForm.get('lMPDate')?.disable();
    } else {
      this.menstrualHistoryForm.get('lMPDate')?.enable();
    }
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
          history.data.MenstrualHistory
        ) {
          const temp = history.data.MenstrualHistory;
          console.log('history.data.MenstrualHistory', temp);

          temp.menstrualCycleStatus =
            this.masterData.menstrualCycleStatus.filter((item: any) => {
              return item.name === temp.menstrualCycleStatus;
            })[0];
          temp.cycleLength = this.masterData.menstrualCycleLengths.filter(
            (item: any) => {
              return item.menstrualCycleRange === temp.cycleLength;
            }
          )[0];
          temp.bloodFlowDuration =
            this.masterData.menstrualCycleBloodFlowDuration.filter(
              (item: any) => {
                return item.menstrualCycleRange === temp.bloodFlowDuration;
              }
            )[0];
          const tempMenstrualProblem: any = [];
          if (
            temp.menstrualProblemList &&
            temp.menstrualProblemList.length > 0
          ) {
            this.masterData.menstrualProblem.forEach(
              (menstrualProblem: any) => {
                temp.menstrualProblemList.forEach(
                  (menstrualProblemValue: any) => {
                    if (
                      menstrualProblem.problemName ===
                      menstrualProblemValue.problemName
                    ) {
                      tempMenstrualProblem.push(menstrualProblem);
                    }
                  }
                );
              }
            );
          }

          temp.menstrualProblemList = tempMenstrualProblem.slice();
          temp.lMPDate = new Date(temp.lMPDate);

          this.menstrualHistoryForm.patchValue(temp);
          this.resetOtherMenstrualProblems();
        }
      });
  }

  getPreviousMenstrualHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousMenstrualHistory(benRegID, this.visitCategory)
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
        title:
          this.currentLanguageSet.historyData.Previousmenstrualhistory
            .previousmenstrualhistory,
      },
    });
  }

  get menstrualCycleStatus() {
    return this.menstrualHistoryForm?.controls['menstrualCycleStatus'].value;
  }

  get lMPDate() {
    return this.menstrualHistoryForm.controls['lMPDate'].value;
  }
  checkMenstrualCycleStatus() {
    console.log('here in to check');

    if (this.visitCategory === 'ANC') {
      this.menstrualHistoryForm.patchValue({
        menstrualCycleStatusID: null,
        regularity: null,
        cycleLength: null,
        menstrualCyclelengthID: null,
        menstrualFlowDurationID: null,
        bloodFlowDuration: null,
        menstrualProblemID: null,
        problemName: null,
      });
    } else {
      this.menstrualHistoryForm.patchValue({
        menstrualCycleStatusID: null,
        regularity: null,
        cycleLength: null,
        menstrualCyclelengthID: null,
        menstrualFlowDurationID: null,
        bloodFlowDuration: null,
        menstrualProblemID: null,
        problemName: null,
        lMPDate: null,
      });
    }
  }
  resetOtherMenstrualProblems() {
    const selectedList =
      this.menstrualHistoryForm.value.menstrualProblemList || [];
    this.isNoneSelected = selectedList.some(
      (item: any) => item.problemName === 'None'
    );
    this.isOtherSelected = selectedList.some(
      (item: any) => item.problemName !== 'None'
    );
  }

  /* --- Zard select adapters ---
   * z-select is a string-valued control, but these dropdowns each store a
   * full master-data OBJECT (single-select) or an OBJECT ARRAY (multi-select)
   * in their reactive-form control. These getters expose the current object
   * value(s) as string label(s) for the z-select trigger, and the handlers
   * reconstruct the object(s) from the chosen label(s) and setValue() them
   * back into the control — so the stored value TYPE and submission contract
   * are unchanged. */

  // menstrualCycleStatus (single, object keyed by name)
  getMenstrualCycleStatusLabel(): string {
    return (
      this.menstrualHistoryForm.controls['menstrualCycleStatus'].value?.name ??
      ''
    );
  }
  onMenstrualCycleStatusChange(value: string | string[]) {
    const name = Array.isArray(value) ? value[0] : value;
    const selected =
      (this.masterData?.menstrualCycleStatus || []).find(
        (item: any) => item.name === name
      ) ?? null;
    this.menstrualHistoryForm.controls['menstrualCycleStatus'].setValue(
      selected
    );
    this.menstrualHistoryForm.controls['menstrualCycleStatus'].markAsDirty();
    this.checkMenstrualCycleStatus();
  }

  // cycleLength (single, object keyed by menstrualCycleRange)
  getCycleLengthLabel(): string {
    return (
      this.menstrualHistoryForm.controls['cycleLength'].value
        ?.menstrualCycleRange ?? ''
    );
  }
  onCycleLengthChange(value: string | string[]) {
    const range = Array.isArray(value) ? value[0] : value;
    const selected =
      (this.masterData?.menstrualCycleLengths || []).find(
        (item: any) => item.menstrualCycleRange === range
      ) ?? null;
    this.menstrualHistoryForm.controls['cycleLength'].setValue(selected);
    this.menstrualHistoryForm.controls['cycleLength'].markAsDirty();
  }

  // bloodFlowDuration (single, object keyed by menstrualCycleRange)
  getBloodFlowDurationLabel(): string {
    return (
      this.menstrualHistoryForm.controls['bloodFlowDuration'].value
        ?.menstrualCycleRange ?? ''
    );
  }
  onBloodFlowDurationChange(value: string | string[]) {
    const range = Array.isArray(value) ? value[0] : value;
    const selected =
      (this.masterData?.menstrualCycleBloodFlowDuration || []).find(
        (item: any) => item.menstrualCycleRange === range
      ) ?? null;
    this.menstrualHistoryForm.controls['bloodFlowDuration'].setValue(selected);
    this.menstrualHistoryForm.controls['bloodFlowDuration'].markAsDirty();
  }

  // menstrualProblemList (multi, object array keyed by problemName)
  getMenstrualProblemValues(): string[] {
    const val =
      this.menstrualHistoryForm.controls['menstrualProblemList'].value;
    return Array.isArray(val) ? val.map((p: any) => p?.problemName) : [];
  }
  onMenstrualProblemChange(value: string | string[]) {
    const names = Array.isArray(value) ? value : [value];
    const selected = (this.masterData?.menstrualProblem || []).filter(
      (item: any) => names.includes(item.problemName)
    );
    this.menstrualHistoryForm.controls['menstrualProblemList'].setValue(
      selected
    );
    this.menstrualHistoryForm.controls['menstrualProblemList'].markAsDirty();
    this.resetOtherMenstrualProblems();
  }
}
