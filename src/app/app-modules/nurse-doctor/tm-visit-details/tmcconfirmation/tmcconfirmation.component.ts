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
  Input,
  OnInit,
  Injector,
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NurseService, DoctorService } from '../../shared/services';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { DataSyncLoginComponent } from 'src/app/app-modules/core/components/data-sync-login/data-sync-login.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-tmcconfirmation',
  templateUrl: './tmcconfirmation.component.html',
  styleUrls: ['./tmcconfirmation.component.css'],
})
export class TmcconfirmationComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  mode!: string;

  @Input()
  tmcConfirmationFormsGroup!: FormGroup;

  @Input()
  patientVisitDetailsForm!: FormGroup;

  additionalServices: any;
  higherHealthcareCenter: any;
  visitCategory: any;
  visitCategoryList: any;
  previousServiceList: any;
  selectValueService: any;
  beneficiaryData: any;
  userName!: string;
  password!: string;

  isDiabetic: any = false;
  beneficiaryRegID: any;
  visitID: any;
  referSubscription: any;
  defaultCentre: any;
  prescribedDrugDataFromCaseSheet: any;

  dynamictype = 'password';
  dialogRef: any;
  data: any;
  casesheetSubs: any;
  caseSheetData: any;
  disableNoOnSuccessOfYes: any;
  showRadio: boolean = false;
  confirmedDisease: any;
  currentLanguageSet: any;

  constructor(
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private dialog: MatDialog,
    private idrsScoreService: IdrsscoreService,
    readonly sessionstorage: SessionStorageService,
    private httpServices: HttpServiceService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    //this.visitCategory = this.sessionstorage.getItem("visiCategoryANC");
    this.visitCategory =
      this.patientVisitDetailsForm.controls['visitCategory'].value;
    this.getVisitReasonAndCategory();
    sessionStorage.removeItem('tmCaseSheet');
    // this.checkDiabetes();
    // this.checkHypertensionAndDiabetics()
    if (this.tmcConfirmationFormsGroup.value.tmcConfirmed) {
      this.showRadio = true;
      if (this.idrsScoreService.isHypertensionConfirmed) {
        this.tmcConfirmationFormsGroup.patchValue({
          isHypertensionConfirmed: true,
        });
      } else {
        this.tmcConfirmationFormsGroup.patchValue({
          isHypertensionConfirmed: false,
        });
      }
      if (this.idrsScoreService.isDiabeticsConfirmed) {
        this.tmcConfirmationFormsGroup.patchValue({ isDiabetic: true });
      } else {
        this.tmcConfirmationFormsGroup.patchValue({ isDiabetic: false });
      }
    } else this.showRadio = false;
    if (this.doctorService.prescribedDrugData) {
      this.prescribedDrugDataFromCaseSheet =
        this.doctorService.prescribedDrugData;
    }
    if (this.sessionstorage.getItem('disableNoOnSuccessOfYes') === 'true') {
      this.disableNoOnSuccessOfYes = true;
    } else {
      this.disableNoOnSuccessOfYes = false;
    }
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
    if (this.visitDetailMasterDataSubscription)
      this.visitDetailMasterDataSubscription.unsubscribe();
    // sessionStorage.removeItem("tmCaseSheet");
  }
  getReferDetails() {
    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitID = this.sessionstorage.getItem('visitID');
    //this.visitCategory = this.sessionstorage.getItem('visitCategory');
    this.referSubscription = this.doctorService
      .getCaseRecordAndReferDetails(
        this.beneficiaryRegID,
        this.visitID,
        this.visitCategory
      )
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.Refer) {
          const referedToInstitute = this.higherHealthcareCenter.filter(
            (item: any) => {
              return (
                item.institutionID === res.data.Refer.referredToInstituteID
              );
            }
          );
          if (referedToInstitute.length > 0) {
            res.data.Refer.referredToInstituteName = referedToInstitute[0];
            this.tmcConfirmationFormsGroup.patchValue({
              refrredToAdditionalServiceList:
                res.data.Refer.referredToInstituteName,
            });
            this.defaultCentre = referedToInstitute[0].institutionName;
            console.log('form', this.tmcConfirmationFormsGroup);
          }
        }
      });
  }
  checkDiabetes() {
    const obj = {
      benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
    };
    this.nurseService.getPreviousVisitData(obj).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data !== null) {
        console.log('visit', res);
        //if(res.data.isDiabetic)
        this.tmcConfirmationFormsGroup.patchValue({
          isDiabetic: res.data.isDiabetic,
        });
        console.log('diabet', this.tmcConfirmationFormsGroup);
      }
    });
  }
  resetAdditionalServiceList(tmcConfirmed: any) {
    if (tmcConfirmed.value) {
      this.idrsScoreService.setTMCSubmit(true);
      this.showRadio = true;
      //this.tmcConfirmationFormsGroup.patchValue({ refrredToAdditionalServiceList: null });
      this.tmcConfirmationFormsGroup.controls[
        'refrredToAdditionalServiceList'
      ].setErrors(null);
    } else {
      this.idrsScoreService.setTMCSubmit(false);
      this.showRadio = false;
      this.tmcConfirmationFormsGroup.controls[
        'refrredToAdditionalServiceList'
      ].setValidators(Validators.required);
    }
  }
  visitDetailMasterDataSubscription: any;
  getVisitReasonAndCategory() {
    this.masterdataService.getVisitDetailMasterData();
    this.visitDetailMasterDataSubscription =
      this.masterdataService.visitDetailMasterData$.subscribe(visitDetails => {
        if (visitDetails) {
          this.visitCategoryList = visitDetails.visitCategories;
          console.log('Visit Details Master Data', visitDetails);
          if (this.visitCategory) {
            this.getDoctorMasterData(this.visitCategory);
          }
        }
      });
  }
  getVisitCategoryID(visitCategory: string) {
    if (visitCategory && this.visitCategoryList) {
      const temp = this.visitCategoryList.filter((category: any) => {
        return category.visitCategory === visitCategory;
      });
      if (temp.length > 0) {
        this.sessionstorage.setItem(
          'caseSheetVisitCategoryID',
          temp[0].visitCategoryID
        );
        return temp[0].visitCategoryID;
      }
    }
    return null;
  }
  getDoctorMasterData(visitCategory: string) {
    const visitID = this.getVisitCategoryID(this.visitCategory);
    const serviceProviderID = this.sessionstorage.getItem('providerServiceID');
    if (visitID) {
      this.masterdataService
        .getDoctorMasterDataForNurse(visitID, serviceProviderID)
        .subscribe((res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.higherHealthcareCenter = res.data.higherHealthCare;
            this.getReferDetails();
          }
        });
    }
  }

  public higherhealthcarecenter(selected: any): void {
    console.log('form', this.tmcConfirmationFormsGroup);
    if (selected !== null && selected.institutionName) {
      this.selectValueService = true;
    }
  }
  dataSync: boolean = false;
  viewAndPrintCaseSheet() {
    // this.confirmedDisease = res.data.nurseData.idrs.idrsDetail.confirmedDisease;
    this.onceAuthorizeViewTMCS();
    // this.openDialog();
  }
  onceAuthorizeViewTMCS() {
    const beneficiaryDataDetail: any =
      this.sessionstorage.getItem('beneficiaryData');
    this.beneficiaryData = JSON.parse(beneficiaryDataDetail);
    this.setCasesheetData(this.beneficiaryData);
    let caseSheetRequest;
    const specialistFlagValue: any =
      this.sessionstorage.getItem('specialistFlag');
    if (
      this.sessionstorage.getItem('caseSheetTMFlag') === 'true' ||
      parseInt(specialistFlagValue) === 200
    ) {
      this.visitCategory = this.sessionstorage.getItem(
        'caseSheetVisitCategory'
      );
      caseSheetRequest = {
        VisitCategory: this.sessionstorage.getItem('caseSheetVisitCategory'),
        benFlowID: this.sessionstorage.getItem('caseSheetBenFlowID'),
        benVisitID: this.sessionstorage.getItem('caseSheetVisitID'),
        beneficiaryRegID: this.sessionstorage.getItem(
          'caseSheetBeneficiaryRegID'
        ),
        visitCode: this.sessionstorage.getItem('caseSheetVisitCode'),
      };
      this.getTMReferredCasesheetData(caseSheetRequest);
    }
  }

  getTMReferredCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.nurseService
      .getTMReferredCasesheetData(caseSheetRequest)
      .subscribe(
        (res: any) => {
          if (res && res.statusCode === 200 && res.data) {
            this.idrsScoreService.setTMCSubmit(false);
            this.sessionstorage.setItem('disableNoOnSuccessOfYes', 'true');
            sessionStorage.setItem('tmCaseSheet', 'true');
            this.disableNoOnSuccessOfYes = this.sessionstorage.getItem(
              'disableNoOnSuccessOfYes'
            );
            //checking hypertension in confirmed diseases

            this.checkHypertensionAndDiabetics(
              res.data.nurseData.idrs.IDRSDetail.confirmedDisease
            );

            this.confirmationService
              .confirm('info', this.currentLanguageSet.alerts.info.consulation)
              .subscribe(res => {
                if (res) {
                  this.routeToCaseSheet();
                }
              });
            this.caseSheetData = res.data;
          } else if (res.statusCode === 5003) {
            this.openDialog();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
            this.idrsScoreService.setTMCSubmit(true);
          }
        },
        err => {
          console.log(err, 'error');
          this.idrsScoreService.setTMCSubmit(true);
          this.confirmationService.alert(
            this.currentLanguageSet.errorInfetchingTMCasesheet,
            'error'
          );
        }
      );
  }

  // marking Yes and NO for hypertension confiramtion
  checkHypertensionAndDiabetics(confirmedDisease: any) {
    const strHypertension = 'Hypertension';
    const strDiabetics = 'Diabetes';
    if (
      confirmedDisease !== undefined &&
      confirmedDisease !== null &&
      confirmedDisease.includes(strHypertension)
    ) {
      this.tmcConfirmationFormsGroup.patchValue({
        isHypertensionConfirmed: true,
      });
      this.idrsScoreService.isHypertensionConfirmed = true;
    } else {
      this.tmcConfirmationFormsGroup.patchValue({
        isHypertensionConfirmed: false,
      });
      this.idrsScoreService.isHypertensionConfirmed = false;
    }
    if (
      confirmedDisease !== undefined &&
      confirmedDisease !== null &&
      confirmedDisease.includes(strDiabetics)
    ) {
      this.tmcConfirmationFormsGroup.patchValue({ isDiabetic: true });
      this.idrsScoreService.isDiabeticsConfirmed = true;
    } else {
      this.tmcConfirmationFormsGroup.patchValue({ isDiabetic: false });
      this.idrsScoreService.isDiabeticsConfirmed = false;
    }
  }
  setCasesheetData(beneficiary: any) {
    this.sessionstorage.setItem('caseSheetBenFlowID', beneficiary.benFlowID);
    this.sessionstorage.setItem(
      'caseSheetVisitCategory',
      beneficiary.VisitCategory
    );
    this.sessionstorage.setItem(
      'caseSheetBeneficiaryRegID',
      beneficiary.beneficiaryRegID
    );
    this.sessionstorage.setItem('caseSheetVisitID', beneficiary.benVisitID);
    this.sessionstorage.setItem('caseSheetVisitCode', beneficiary.visitCode);
    this.sessionstorage.setItem('caseSheetTMFlag', 'true');
  }
  routeToCaseSheet() {
    this.router.navigate(['/nurse-doctor/print/' + 'MMU' + '/' + 'current']);
  }
  loginDialogRef!: MatDialogRef<DataSyncLoginComponent>;
  openDialog() {
    this.loginDialogRef = this.dialog.open(DataSyncLoginComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'fit-screen',
      backdropClass: 'backdrop',
      position: { top: '20px' },
      data: {
        provideAuthorizationToViewTmCS: true,
      },
    });
    this.loginDialogRef.afterClosed().subscribe(result => {
      if (
        result &&
        sessionStorage.getItem('authorizeToViewTMcasesheet') === 'Authorized'
      ) {
        console.log(result, 'authorized');
        this.onceAuthorizeViewTMCS();
      }
    });
  }
}
