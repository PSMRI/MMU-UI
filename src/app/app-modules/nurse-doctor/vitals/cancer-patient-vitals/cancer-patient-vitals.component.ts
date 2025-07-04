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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService, NurseService } from '../../shared/services';

import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { ActivatedRoute } from '@angular/router';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-cancer-patient-vitals',
  templateUrl: './cancer-patient-vitals.component.html',
  styleUrls: ['./cancer-patient-vitals.component.css'],
})
export class CancerPatientVitalsComponent
  implements OnInit, OnChanges, OnDestroy, DoCheck
{
  @Input()
  patientVitalsForm!: FormGroup;

  @Input()
  pregnancyStatus!: string;

  @Input()
  mode!: string;

  female = false;
  benAge: number = 0;
  BMI: any = null;
  male = false;
  startWeightTest = environment.startWeighturl;
  startTempTest = environment.startTempurl;
  startPulseTest = environment.startPulseurl;
  startBPTest = environment.startBPurl;
  startHemoglobinTest = environment.startHemoglobinurl;
  startBloodGlucose = environment.startBloodGlucoseurl;
  currentLanguageSet: any;
  bmiStatusMinor: any;
  totalMonths: number = 0;
  beneficiary: any;
  benGenderAndAge: any;
  rbsSelectedInInvestigationSubscription: any;
  rbsSelectedInInvestigation: boolean = false;
  startRBSTest = environment.startRBSurl;
  rbsPopup: boolean = false;
  attendant: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private languageComponent: SetLanguageComponent,
    readonly sessionstorage: SessionStorageService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.rbsPopup = false;
    this.fetchLanguageResponse();
    this.doctorService.setValueToEnableVitalsUpdateButton(false);
    this.getBeneficiaryDetails();
    this.rbsSelectedInInvestigationSubscription =
      this.nurseService.rbsSelectedInInvestigation$.subscribe(response =>
        response === undefined
          ? (this.rbsSelectedInInvestigation = false)
          : (this.rbsSelectedInInvestigation = response)
      );
  }

  ngOnChanges(changes: any) {
    this.nurseService.rbsTestResultFromDoctorFetch = null;
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getCancerVitals(benRegID, visitID);
    }

    if (String(this.mode) === 'update') {
      this.updateCancerVitals();
    }

    this.attendant = this.route.snapshot.params['attendant'];
    if (this.attendant === 'nurse') {
      this.getPreviousVisitAnthropometry();
    }
  }

  previousAnthropometryDataSubscription: any;
  getPreviousVisitAnthropometry() {
    this.previousAnthropometryDataSubscription = this.doctorService
      .getPreviousVisitAnthropometry({
        benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      })
      .subscribe((anthropometryData: any) => {
        if (
          anthropometryData &&
          anthropometryData.data &&
          anthropometryData.data.response &&
          anthropometryData.data.response !== 'Visit code is not found' &&
          anthropometryData.data.response !== 'No data found'
        ) {
          const heightStr = anthropometryData.data.response.toString();
          this.patientVitalsForm.controls['height_cm'].patchValue(
            heightStr.endsWith('.0')
              ? Math.round(anthropometryData.data.response)
              : anthropometryData.data.response
          );
        }
      });
  }

  checkDiasableRBS() {
    if (
      this.rbsSelectedInInvestigation === true ||
      (this.nurseService.rbsTestResultFromDoctorFetch !== undefined &&
        this.nurseService.rbsTestResultFromDoctorFetch !== null)
    )
      return true;

    return false;
  }
  rbsResultChange(): boolean {
    if (
      this.patientVitalsForm.controls['rbsTestResult'].value &&
      this.patientVitalsForm.controls['rbsTestResult'].value !== null
    ) {
      this.nurseService.setRbsInCurrentVitals(
        this.patientVitalsForm.controls['rbsTestResult'].value
      );
    } else {
      this.nurseService.setRbsInCurrentVitals(null);
    }
    if (
      this.rbsSelectedInInvestigation === true ||
      (this.nurseService.rbsTestResultFromDoctorFetch !== undefined &&
        this.nurseService.rbsTestResultFromDoctorFetch !== null)
    ) {
      this.patientVitalsForm.controls['rbsTestResult'].disable();
      this.patientVitalsForm.controls['rbsTestRemarks'].disable();
      return true; // disable the controls
    } else {
      this.patientVitalsForm.controls['rbsTestResult'].enable();
      this.patientVitalsForm.controls['rbsTestRemarks'].enable();
      return false; // enable the controls
    }
  }
  updateCancerVitals() {
    if (this.vitalsRequiredCheck(this.patientVitalsForm)) {
      this.doctorService
        .updateCancerVitalsDetails(
          this.patientVitalsForm.value,
          this.patientVitalsForm.getRawValue()
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.confirmationService.alert(res.data.response, 'success');
              this.doctorService.setValueToEnableVitalsUpdateButton(false);
              this.patientVitalsForm.markAsPristine();
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();

    if (this.cancerVitalsSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
    if (this.rbsSelectedInInvestigationSubscription)
      this.rbsSelectedInInvestigationSubscription.unsubscribe();
    this.nurseService.rbsTestResultFromDoctorFetch = null;

    if (this.previousAnthropometryDataSubscription)
      this.previousAnthropometryDataSubscription.unsubscribe();
  }

  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          if (beneficiary && beneficiary.ageVal) {
            this.benGenderAndAge = beneficiary;
            this.benAge = beneficiary.ageVal;
            const ageMonth = this.benGenderAndAge.age;
            const ar = ageMonth.split(' ');
            this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
          }
          if (
            beneficiary !== undefined &&
            beneficiary !== null &&
            beneficiary.genderName !== null &&
            beneficiary.genderName.toLowerCase() === 'female'
          ) {
            this.female = true;
          }
          if (
            beneficiary !== undefined &&
            beneficiary !== null &&
            beneficiary.genderName !== null &&
            beneficiary.genderName.toLowerCase() === 'male'
          ) {
            this.male = true;
          }
        }
      );
  }
  openIOTRBSModel() {
    this.rbsPopup = true;
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startRBSTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.rbsPopup = false;
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          rbsTestResult: result['result'],
        });
        this.patientVitalsForm.controls['rbsTestResult'].markAsDirty();
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
        if (
          this.patientVitalsForm.controls['rbsTestResult'].value &&
          this.patientVitalsForm.controls['rbsTestResult'].value !== null
        ) {
          this.nurseService.setRbsInCurrentVitals(
            this.patientVitalsForm.controls['rbsTestResult'].value
          );
        }
      }
    });
  }
  openIOTSPO2Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startPulseTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          sPO2: result['spo2'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  vitalsRequiredCheck(patientVitalsForm: any) {
    const required = [];
    if (patientVitalsForm.controls['height_cm'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .height
      );
    }
    if (patientVitalsForm.controls['weight_Kg'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .weight
      );
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return false;
    } else {
      return true;
    }
  }
  cancerVitalsSubscription: any;
  getCancerVitals(benRegID: any, visitID: any) {
    this.cancerVitalsSubscription = this.doctorService
      .getCancerVitalsDetails(benRegID, visitID)
      .subscribe((vitals: any) => {
        if (
          vitals !== null &&
          vitals.statusCode === 200 &&
          vitals.data !== null
        ) {
          const data = vitals.data.benVitalDetails;
          if (data) {
            this.patientVitalsForm.patchValue(data);
            this.checkNormalWaist(data.waistCircumference_cm);
            this.checkNormalHbA1c(data.hbA1C);
            this.checkNormalBloodSugarRandom(data.bloodGlucose_Random);
            this.checkNormalBloodSugarPostPrandial(
              data.bloodGlucose_2HrPostPrandial
            );
            this.checkNormalBloodSugarFasting(data.bloodGlucose_Fasting);
            this.calculateBMI(data.height_cm, data.weight_Kg);
            this.canShowBP3();
            this.nurseService.rbsTestResultFromDoctorFetch = null;
            if (data.rbsTestResult !== null) {
              this.nurseService.rbsTestResultFromDoctorFetch =
                data.rbsTestResult;
              this.rbsResultChange();
            }
          }
        }
      });
  }
  checkForRange() {
    if (
      this.rbsTestResult < 0 ||
      (this.rbsTestResult > 1000 && !this.rbsPopup)
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }
  get height_cm() {
    return this.patientVitalsForm.controls['height_cm'].value;
  }

  get weight_Kg() {
    return this.patientVitalsForm.controls['weight_Kg'].value;
  }

  get waistCircumference_cm() {
    return this.patientVitalsForm.controls['waistCircumference_cm'].value;
  }

  get systolicBP_1stReading() {
    return this.patientVitalsForm.controls['systolicBP_1stReading'].value;
  }

  get diastolicBP_1stReading() {
    return this.patientVitalsForm.controls['diastolicBP_1stReading'].value;
  }

  get systolicBP_2ndReading() {
    return this.patientVitalsForm.controls['systolicBP_2ndReading'].value;
  }

  get diastolicBP_2ndReading() {
    return this.patientVitalsForm.controls['diastolicBP_2ndReading'].value;
  }

  get systolicBP_3rdReading() {
    return this.patientVitalsForm.controls['systolicBP_3rdReading'].value;
  }

  get diastolicBP_3rdReading() {
    return this.patientVitalsForm.controls['diastolicBP_3rdReading'].value;
  }

  get hbA1C() {
    return this.patientVitalsForm.controls['hbA1C'].value;
  }

  get hemoglobin() {
    return this.patientVitalsForm.controls['hemoglobin'].value;
  }

  get bloodGlucose_Fasting() {
    return this.patientVitalsForm.controls['bloodGlucose_Fasting'].value;
  }

  get bloodGlucose_Random() {
    return this.patientVitalsForm.controls['bloodGlucose_Random'].value;
  }

  get bloodGlucose_2HrPostPrandial() {
    return this.patientVitalsForm.controls['bloodGlucose_2HrPostPrandial']
      .value;
  }
  get sPO2() {
    return this.patientVitalsForm.controls['sPO2'].value;
  }

  get rbsTestResult() {
    return this.patientVitalsForm.controls['rbsTestResult'].value;
  }
  checkSpo2() {
    if (this.sPO2 < 1 || this.sPO2 > 100) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }
  normalBMI = true;
  calculateBMI(patientHeight: any, patientWeight: any) {
    if (
      this.height_cm &&
      this.height_cm !== null &&
      this.weight_Kg &&
      this.weight_Kg !== null
    ) {
      this.BMI = (this.weight_Kg / (this.height_cm * this.height_cm)) * 10000;
      this.BMI = +this.BMI.toFixed(1);
    } else {
      this.BMI = null;
    }
    if (this.BMI !== null && this.BMI !== undefined) {
      this.calculateBMIStatusBasedOnAge();
    }
    if (this.BMI >= 18.5 && this.BMI <= 24.9) this.normalBMI = true;
    else this.normalBMI = false;
  }
  calculateBMIStatusBasedOnAge() {
    if (
      this.benGenderAndAge !== undefined &&
      this.benGenderAndAge.age !== undefined
    ) {
      const ageMonth = this.benGenderAndAge.age;
      const ar = ageMonth.split(' ');
      this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
    }
    if (
      this.totalMonths > 60 &&
      this.totalMonths <= 228 &&
      (this.benGenderAndAge.genderName.toLowerCase() === 'male' ||
        this.benGenderAndAge.genderName.toLowerCase() === 'female')
    ) {
      this.nurseService
        .calculateBmiStatus({
          yearMonth: this.benGenderAndAge.age,
          gender: this.benGenderAndAge.genderName,
          bmi: this.BMI,
        })
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              const bmiData = res.data;
              if (
                bmiData.bmiStatus !== undefined &&
                bmiData.bmiStatus !== null
              ) {
                this.bmiStatusMinor = bmiData.bmiStatus.toLowerCase();
                if (this.bmiStatusMinor === 'normal') this.normalBMI = true;
                else this.normalBMI = false;
              }
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },

          err => {
            this.confirmationService.alert(err, 'error');
          }
        );
    } else {
      if (this.BMI >= 18.5 && this.BMI <= 24.9) this.normalBMI = true;
      else this.normalBMI = false;
    }
  }

  checkHeight(patientHeight: any) {
    this.calculateBMI(this.height_cm, this.weight_Kg);
    if (patientHeight < 10 || patientHeight > 200) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkWeight(patientWeight: any) {
    this.calculateBMI(this.height_cm, this.weight_Kg);
    if (patientWeight < 25 || patientWeight > 150) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkWaist(patientWaist: any) {
    if (patientWaist < 50 || patientWaist > 150) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  normalWaist = true;
  checkNormalWaist(patientWaist: any) {
    if (
      this.female &&
      this.pregnancyStatus !== null &&
      this.pregnancyStatus?.toLowerCase() !== 'yes'
    )
      this.normalWaist = patientWaist < 80 ? true : false;
    else if (!this.female) this.normalWaist = patientWaist < 90 ? true : false;
  }

  checkSystolicBP1(systolicBP1: any) {
    this.canShowBP3();
    if (systolicBP1 < 90 || systolicBP1 > 170) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkDiastolicBP1(diastolicBP1: any) {
    this.canShowBP3();
    if (diastolicBP1 < 50 || diastolicBP1 > 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkSystolicBP2(systolicBP2: any) {
    this.canShowBP3();
    if (systolicBP2 < 90 || systolicBP2 > 170) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkDiastolicBP2(diastolicBP2: any) {
    this.canShowBP3();
    if (diastolicBP2 < 50 || diastolicBP2 > 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  showBP3 = false;
  canShowBP3() {
    if (
      (Math.abs(this.diastolicBP_2ndReading - this.diastolicBP_1stReading) >=
        6 &&
        this.diastolicBP_2ndReading !== null &&
        this.diastolicBP_1stReading !== null) ||
      (Math.abs(this.systolicBP_2ndReading - this.systolicBP_1stReading) >=
        10 &&
        this.systolicBP_1stReading !== null &&
        this.systolicBP_2ndReading !== null)
    ) {
      this.showBP3 = true;
    } else this.showBP3 = false;
  }

  checkSystolicBP3(systolicBP3: any) {
    if (systolicBP3 < 90 || systolicBP3 > 170) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkDiastolicBP3(diastolicBP3: any) {
    if (diastolicBP3 < 50 || diastolicBP3 > 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkHbA1C(valueHbA1c: any) {
    if (valueHbA1c < 4 || valueHbA1c > 6) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  normalHbA1C = true;
  checkNormalHbA1c(valueHbA1c: any) {
    if (valueHbA1c <= 5.7) this.normalHbA1C = true;
    else this.normalHbA1C = false;
  }

  checkHemoglobin(valueHemoglobin: any) {
    if (valueHemoglobin < 2 || valueHemoglobin > 18) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkBloodSugarFasting(bloodSugarFasting: any) {
    if (bloodSugarFasting < 50 || bloodSugarFasting > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  diabeticRangeFasting = false;
  checkNormalBloodSugarFasting(bloodSugar: any) {
    if (bloodSugar <= 100) this.diabeticRangeFasting = false;
    else this.diabeticRangeFasting = true;
  }

  checkBloodSugarRandom(bloodSugarRandom: any) {
    if (bloodSugarRandom < 50 || bloodSugarRandom > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  diabeticRangeRandom = false;
  checkNormalBloodSugarRandom(bloodSugar: any) {
    if (bloodSugar <= 140) this.diabeticRangeRandom = false;
    else this.diabeticRangeRandom = true;
  }

  checkBloodSugar2HrPostPrandial(bloodSugar2HrPostPrandial: any) {
    if (bloodSugar2HrPostPrandial < 50 || bloodSugar2HrPostPrandial > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  diabeticRangePostPrandial = false;
  checkNormalBloodSugarPostPrandial(bloodSugar: any) {
    if (bloodSugar <= 140) this.diabeticRangePostPrandial = false;
    else this.diabeticRangePostPrandial = true;
  }

  checkSystolicGreater1(systolic1: any, diastolic1: any) {
    console.log(systolic1, diastolic1);
    if (systolic1 && diastolic1) {
      if (parseInt(systolic1) <= parseInt(diastolic1)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp
        );
        this.patientVitalsForm.patchValue({
          systolicBP_1stReading: null,
        });
      }
    }
  }

  checkSystolicGreater2(systolic2: any, diastolic2: any) {
    console.log(systolic2, diastolic2);
    if (systolic2 && diastolic2) {
      if (parseInt(systolic2) <= parseInt(diastolic2)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp
        );
        this.patientVitalsForm.patchValue({
          systolicBP_2ndReading: null,
        });
      }
    }
  }
  checkSystolicGreater3(systolic3: any, diastolic3: any) {
    console.log(systolic3, diastolic3);
    if (systolic3 && diastolic3) {
      if (parseInt(systolic3) <= parseInt(diastolic3)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp
        );
        this.patientVitalsForm.patchValue({
          systolicBP_3rdReading: null,
        });
      }
    }
  }
  checkDiastolicLesser1(systolic1: any, diastolic1: any) {
    console.log(systolic1, diastolic1);
    if (systolic1 && diastolic1) {
      if (parseInt(systolic1) <= parseInt(diastolic1)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.diabp
        );
        this.patientVitalsForm.patchValue({
          diastolicBP_1stReading: null,
        });
      }
    }
  }

  checkDiastolicLesser2(systolic2: any, diastolic2: any) {
    console.log(systolic2, diastolic2);
    if (systolic2 && diastolic2) {
      if (parseInt(systolic2) <= parseInt(diastolic2)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.diabp
        );
        this.patientVitalsForm.patchValue({
          diastolicBP_2ndReading: null,
        });
      }
    }
  }
  checkDiastolicLesser3(systolic3: any, diastolic3: any) {
    console.log(systolic3, diastolic3);
    if (systolic3 && diastolic3) {
      if (parseInt(systolic3) <= parseInt(diastolic3)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.diabp
        );
        this.patientVitalsForm.patchValue({
          diastolicBP_3rdReading: null,
        });
      }
    }
  }
  openIOTWeightModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startWeightTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('he;;p', result, result['result']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          weight_Kg: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
        this.calculateBMI(this.weight_Kg, this.weight_Kg);
      }
    });
  }
  openIOTTempModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startTempTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('temperature', result, result['temperature']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          temperature: result['temperature'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  openIOTPulseRateModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startPulseTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('pulse_oxymetery', result, result['pulseRate']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          pulseRate: result['pulseRate'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBP1Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          systolicBP_1stReading: result['sys'],
          diastolicBP_1stReading: result['dia'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBP2Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          systolicBP_2ndReading: result['sys'],
          diastolicBP_2ndReading: result['dia'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBP3Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          systolicBP_3rdReading: result['sys'],
          diastolicBP_3rdReading: result['dia'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTHemoglobinModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startHemoglobinTest },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          hemoglobin: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGFastingModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_glucose', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_Fasting: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGRandomModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_glucose', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_Random: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGPostPrandialModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_2HrPostPrandial: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
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
