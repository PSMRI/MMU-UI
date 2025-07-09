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
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { PreviousDetailsComponent } from '../../../../core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-cancer-obstetric-history',
  templateUrl: './obstetric-history.component.html',
  styleUrls: ['./obstetric-history.component.css'],
})
export class ObstetricHistoryComponent
  implements OnInit, OnChanges, OnDestroy, DoCheck
{
  @Input()
  cancerPatientObstetricHistoryForm!: FormGroup;

  @Input()
  ispregnant!: string;

  templateNurseMasterData: any;
  templateBeneficiaryDetails: any;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private languageComponent: SetLanguageComponent,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.getNurseMasterData();
    this.fetchLanguageResponse();
  }

  ngOnChanges() {
    if (this.ispregnant) {
      this.cancerPatientObstetricHistoryForm.controls[
        'pregnancyStatus'
      ].setValue(this.ispregnant);
    }
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.getBenificiaryDetails();
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(nurseMasterData => {
        this.templateNurseMasterData = nurseMasterData;
      });
  }

  patientAge: any;
  spaceIndex: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
      beneficiaryDetails => {
        if (beneficiaryDetails) {
          this.templateBeneficiaryDetails = beneficiaryDetails;
          this.patientAge = this.templateBeneficiaryDetails.ageVal;
        }
      }
    );
  }

  templatePregnancyStatus = ['Yes', 'No', "Don't Know"];
  templateTimesPregnant = ['0', '1', '2', '3', '>3'];
  templateTypeOfFlow = ['Little', 'Moderate', 'Heavy'];

  checkWithPregnancy() {
    this.cancerPatientObstetricHistoryForm.patchValue({
      isUrinePregTest: null,
    });
  }

  checkWithPregnantTimes() {
    this.cancerPatientObstetricHistoryForm.patchValue({
      noOfLivingChild: null,
    });
    this.cancerPatientObstetricHistoryForm.patchValue({ isAbortion: null });
  }

  checkNoOfChildren(noOfLivingChild: any) {
    if (this.noOfLivingChild > 0) {
      if (this.noOfLivingChild > 15) {
        this.cancerPatientObstetricHistoryForm.patchValue({
          noOfLivingChild: null,
        });
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.childObstericHistory
        );
      }
    } else {
      this.cancerPatientObstetricHistoryForm.patchValue({
        noOfLivingChild: null,
      });
    }
  }

  get noOfLivingChild() {
    return this.cancerPatientObstetricHistoryForm.controls['noOfLivingChild']
      .value;
  }

  checkLengthMenstrualCycle(event: any) {
    const lengthMenstrualCycle: any = event.target?.value;
    if (lengthMenstrualCycle > 0) {
      if (lengthMenstrualCycle < 25 || lengthMenstrualCycle > 40) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.recheckValue
        );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.invalidLength
      );
      this.cancerPatientObstetricHistoryForm.patchValue({
        menstrualCycleLength: null,
      });
    }
  }

  checkMenstrualFlowDuration(event: any) {
    const menstrualFlowDuration: any = event.target?.value;
    if (menstrualFlowDuration > 0) {
      if (menstrualFlowDuration > 12) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.recheckValue
        );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.invalidLength
      );
      this.cancerPatientObstetricHistoryForm.patchValue({
        menstrualFlowDuration: null,
      });
    }
  }

  checkMenarcheAge(event: any) {
    const menarcheAge = event.target.value;
    if (menarcheAge > 0) {
      if (menarcheAge <= this.patientAge) {
        if (menarcheAge < 8 || menarcheAge > 20) {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.recheckValue
          );
        }
      } else {
        this.cancerPatientObstetricHistoryForm.patchValue({
          menarche_Age: null,
        });
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.menarchAge
        );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.invalidLength
      );
      this.cancerPatientObstetricHistoryForm.patchValue({ menarche_Age: null });
    }
  }

  checkMenopauseAge(event: any) {
    const menopauseAge = event.target.value;
    if (menopauseAge > 0) {
      if (menopauseAge <= this.patientAge) {
        if (menopauseAge < 50 || menopauseAge > 60) {
          this.cancerPatientObstetricHistoryForm.patchValue({
            isPostMenopauseBleeding: null,
          });
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.recheckValue
          );
        }
      } else {
        this.cancerPatientObstetricHistoryForm.patchValue({
          menopauseAge: null,
        });
        this.cancerPatientObstetricHistoryForm.patchValue({
          isPostMenopauseBleeding: null,
        });
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.menopauseAge
        );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.invalidLength
      );
      this.cancerPatientObstetricHistoryForm.patchValue({ menopauseAge: null });
      this.cancerPatientObstetricHistoryForm.patchValue({
        isPostMenopauseBleeding: null,
      });
    }
  }

  getPreviousCancerPastObstetricHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService.getPreviousCancerPastObstetricHistory(benRegID).subscribe(
      (data: any) => {
        if (data !== null && data.data !== null) {
          if (data.data.data.length > 0) {
            this.viewPreviousData(data.data);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.previousHistoryDetailsAlert
                .prevHabitDiet
            );
          }
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
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
        title: this.currentLanguageSet.common.prevObsteric,
      },
    });
  }

  get pregnant_No() {
    return this.cancerPatientObstetricHistoryForm.controls['pregnant_No'].value;
  }

  get pregnancyStatus() {
    return this.cancerPatientObstetricHistoryForm.controls['pregnancyStatus']
      .value;
  }

  get menopauseAge() {
    return this.cancerPatientObstetricHistoryForm.controls['menopauseAge']
      .value;
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
