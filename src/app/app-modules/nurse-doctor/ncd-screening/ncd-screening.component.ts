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
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../shared/services';
import { NCDScreeningUtils } from '../shared/utility';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { mergeMap, of } from 'rxjs';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-ncd-screening',
  templateUrl: './ncd-screening.component.html',
  styleUrls: ['./ncd-screening.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class NcdScreeningComponent
  implements OnInit, OnChanges, DoCheck, OnDestroy
{
  @Input()
  NCDScreeningForm!: FormGroup;

  @Input()
  patientMedicalForm!: FormGroup;

  @Input()
  ncdScreeningMode!: string;

  today!: Date;
  nextScreeningDate!: Date;
  age: any;

  utils = new NCDScreeningUtils(this.fb, this.sessionstorage);
  bloodPressureStatus: any;
  diabeticStatus: any;
  ncdScreeningConditions: any;
  ncdScreeningReasons: any;
  ncdScreeningDetails: any;

  startWeightTest = environment.startWeighturl;
  startBloodGlucose = environment.startBloodGlucoseurl;
  startBPTest = environment.startBPurl;

  // ncdTests: any;
  laboratoryList = [
    {
      procedureID: 31,
      procedureName: 'BP Measurement',
    },
    {
      procedureID: 31,
      procedureName: 'Blood Glucose Measurement',
    },
  ];
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private nurseService: NurseService,
    private router: Router,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  patientVisitForm!: FormGroup;
  ngOnInit() {
    this.assignSelectedLanguage();
    this.getBeneficiaryDetails();
    this.getNurseMasterData();
    this.today = new Date();
    this.nextScreeningDate = new Date();
    this.nextScreeningDate.setDate(this.today.getDate() + 1);
    this.patientVisitForm = <FormGroup>(
      this.patientMedicalForm.controls['patientVisitForm']
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
  ngOnChanges() {
    if (String(this.ncdScreeningMode) === 'update') {
      this.updateNCDScreeningDetails();
    }
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(data => {
        if (data) {
          this.bloodPressureStatus = data.bloodPressureStatus;
          this.diabeticStatus = data.diabeticStatus;
          this.ncdScreeningConditions = data.ncdScreeningConditions;
          this.ncdScreeningReasons = this.filterNCDScreeningReasons(
            Object.assign([], data.ncdScreeningReasons)
          );
          // this.ncdTests = data.ncdTests;

          if (String(this.ncdScreeningMode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getNCDScreeingDetails(benRegID, visitID);
          }
        }
      });
  }

  filterNCDScreeningReasons(reasons: any) {
    console.log(reasons);
    const filteredReasons: any = [];
    reasons.forEach((element: any) => {
      if (this.age < 30 && element.ncdScreeningReasonID === 1) {
        // according to age
      } else {
        filteredReasons.push(element);
      }
    });
    return filteredReasons;
  }

  ncdScreeningVisitCount: any;

  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$
        .pipe(
          mergeMap((beneficiary: any) => {
            if (beneficiary) {
              if (beneficiary.ageVal) {
                this.age = beneficiary.ageVal;
              } else {
                this.age = 0;
              }
              if (
                beneficiary.genderName &&
                beneficiary.genderName.toLowerCase() === 'female'
              ) {
                this.female = true;
              }
              return this.nurseService.getNcdScreeningVisitCount(
                beneficiary.beneficiaryRegID
              );
            } else {
              return of(null);
            }
          })
        )
        .subscribe((res: any) => {
          if (res && res.statusCode === 200 && res.data) {
            this.ncdScreeningVisitCount = res.data.ncdScreeningVisitCount;
            if (String(this.ncdScreeningMode) !== 'view')
              this.NCDScreeningForm.patchValue({
                ncdScreeningVisitNo: this.ncdScreeningVisitCount,
              });
          }
        });
  }

  getNCDScreeingDetails(beneficiaryRegID: any, benVisitID: any) {
    this.doctorService
      .getNcdScreeningDetails(beneficiaryRegID, benVisitID)
      .subscribe((res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          this.ncdScreeningDetails = Object.assign(
            {},
            res.data.anthropometryDetails,
            res.data.ncdScreeningDetails,
            res.data.vitalDetails
          );

          this.ncdScreeningDetails.nextScreeningDate = new Date(
            this.ncdScreeningDetails.nextScreeningDate
          );
          // this.ncdScreeningDetails.screeningCondition = this.ncdScreeningConditions.filter(item => item.ncdScreeningConditionID === this.ncdScreeningDetails.ncdScreeningConditionID)[0];
          this.ncdScreeningDetails.reasonForScreening =
            this.ncdScreeningReasons.filter(
              (item: any) =>
                item.ncdScreeningReasonID ===
                this.ncdScreeningDetails.ncdScreeningReasonID
            )[0];
          this.ncdScreeningDetails.bloodPressureStatus =
            this.bloodPressureStatus.filter(
              (item: any) =>
                item.bpAndDiabeticStatusID ===
                this.ncdScreeningDetails.bloodPressureStatusID
            )[0];
          this.ncdScreeningDetails.diabeticStatus = this.diabeticStatus.filter(
            (item: any) =>
              item.bpAndDiabeticStatusID ===
              this.ncdScreeningDetails.diabeticStatusID
          )[0];

          const temp = [];
          if (this.ncdScreeningDetails.isBPPrescribed) {
            const bp = this.laboratoryList.filter(item => {
              return item.procedureName === 'BP Measurement';
            });
            if (bp.length > 0) temp.push(bp[0]);
          }

          if (this.ncdScreeningDetails.isBloodGlucosePrescribed) {
            const bg = this.laboratoryList.filter(item => {
              return item.procedureName === 'Blood Glucose Measurement';
            });
            if (bg.length > 0) temp.push(bg[0]);
          }
          const tempNCDScreeningConditionList: any = [];

          if (this.ncdScreeningConditions) {
            this.ncdScreeningConditions.forEach((screeningCondition: any) => {
              if (
                this.ncdScreeningDetails &&
                this.ncdScreeningDetails.ncdScreeningConditionList
              ) {
                this.ncdScreeningDetails.ncdScreeningConditionList.forEach(
                  (ncdScreening: any) => {
                    if (
                      screeningCondition.ncdScreeningConditionID ===
                      ncdScreening.ncdScreeningConditionID
                    ) {
                      tempNCDScreeningConditionList.push(screeningCondition);
                    }
                  }
                );
              }
            });
          }

          this.ncdScreeningDetails.ncdScreeningConditionList =
            tempNCDScreeningConditionList.slice();

          this.ncdScreeningDetails.labTestOrders = temp.slice();
          this.NCDScreeningForm.patchValue(this.ncdScreeningDetails, {
            emitEvent: true,
          });
          this.calculateBMI();
          this.checkScreeningTest();
          this.calculateAverageDiastolicBP();
          this.calculateAverageSystolicBP();
        }
      });
  }

  checkNCDScreeningRequiredData() {
    const NCDScreeningForm = this.NCDScreeningForm;
    const required = [];

    if (NCDScreeningForm.controls['height_cm'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .height
      );
    }
    if (NCDScreeningForm.controls['weight_Kg'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .weight
      );
    }
    if (NCDScreeningForm.controls['isScreeningComplete'].errors) {
      required.push(this.currentLanguageSet.screeningComplete);
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

  updateNCDScreeningDetails() {
    if (this.checkNCDScreeningRequiredData()) {
      this.doctorService
        .updateNCDScreeningDetails(
          this.NCDScreeningForm.value,
          this.patientVisitForm.value
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.NCDScreeningForm.markAsPristine();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/common/nurse-worklist']);
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

  female = false;
  BMI: any;
  checkBloodPressure = false;
  checkBloodGlucose = false;

  checkScreeningTest() {
    const screeningTestListName: any = [];

    this.screeningTestList.map((item: any) => {
      screeningTestListName.push(item.procedureName);
    });
    if (
      screeningTestListName &&
      screeningTestListName.indexOf('BP Measurement') >= 0
    ) {
      this.checkBloodPressure = true;
    } else {
      this.checkBloodPressure = false;
      this.NCDScreeningForm.patchValue({
        systolicBP_1stReading: null,
        systolicBP_2ndReading: null,
        systolicBP_3rdReading: null,
        averageSystolicBP_Reading: null,
      });
      this.NCDScreeningForm.patchValue({
        diastolicBP_1stReading: null,
        diastolicBP_2ndReading: null,
        diastolicBP_3rdReading: null,
        averageDiastolicBP_Reading: null,
      });
      this.NCDScreeningForm.patchValue({ bloodPressureStatus: null });
    }
    if (
      screeningTestListName &&
      screeningTestListName.indexOf('Blood Glucose Measurement') >= 0
    ) {
      this.checkBloodGlucose = true;
    } else {
      this.checkBloodGlucose = false;
      this.NCDScreeningForm.patchValue({
        bloodGlucose_Fasting: null,
        bloodGlucose_Random: null,
        bloodGlucose_2hr_PP: null,
        bloodGlucose_NotSpecified: null,
      });
      this.NCDScreeningForm.patchValue({ diabeticStatus: null });
    }
  }

  normalBMI = true;
  calculateBMI() {
    if (this.height_cm && this.weight_Kg) {
      this.BMI = (this.weight_Kg / (this.height_cm * this.height_cm)) * 10000;
      this.BMI = +this.BMI.toFixed(1);
      this.NCDScreeningForm.patchValue({ bMI: this.BMI });
    } else {
      this.BMI = null;
      this.NCDScreeningForm.patchValue({ bMI: this.BMI });
    }
    if (this.BMI >= 18.5 && this.BMI <= 24.9) this.normalBMI = true;
    else this.normalBMI = false;
  }

  checkHeight() {
    if (this.height_cm < 120 || this.height_cm > 200) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkWeight() {
    if (this.weight_Kg < 25 || this.weight_Kg > 150) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  patientWaistHipRatio: any;
  normalWaistHipRatio = true;
  hipWaistRatio() {
    if (this.hipCircumference_cm && this.waistCircumference_cm) {
      this.patientWaistHipRatio = (
        this.waistCircumference_cm / this.hipCircumference_cm
      ).toFixed(2);
      this.NCDScreeningForm.patchValue({
        waistHipRatio: this.patientWaistHipRatio,
      });
      if (this.female) {
        this.normalWaistHipRatio =
          this.patientWaistHipRatio < 0.8 ? true : false;
      } else
        this.normalWaistHipRatio =
          this.patientWaistHipRatio < 0.9 ? true : false;
    }
  }

  normalHip = true;
  checkHip() {
    if (this.female)
      this.normalHip =
        this.hipCircumference_cm >= 97 && this.hipCircumference_cm <= 108
          ? true
          : false;
    else
      this.normalHip =
        this.hipCircumference_cm >= 94 && this.hipCircumference_cm <= 105
          ? true
          : false;
  }

  normalWaist = true;
  checkWaist() {
    this.normalWaist =
      this.waistCircumference_cm >= 50 && this.waistCircumference_cm <= 150
        ? true
        : false;
  }

  checkSystolicBP1() {
    if (this.systolicBP_1stReading < 90 || this.systolicBP_1stReading > 170) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkDiastolicBP1() {
    if (this.diastolicBP_1stReading < 50 || this.diastolicBP_1stReading > 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkSystolicBP2() {
    if (this.systolicBP_2ndReading < 90 || this.systolicBP_2ndReading > 170) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkDiastolicBP2() {
    if (this.diastolicBP_2ndReading < 50 || this.diastolicBP_2ndReading > 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkSystolicBP3() {
    if (this.systolicBP_3rdReading < 90 || this.systolicBP_3rdReading > 170) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkDiastolicBP3() {
    if (this.diastolicBP_3rdReading < 50 || this.diastolicBP_3rdReading > 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  calculateAverageSystolicBP() {
    if (
      this.systolicBP_1stReading !== null &&
      this.systolicBP_2ndReading !== null &&
      this.systolicBP_3rdReading !== null
    ) {
      // let averageSystolicBP: any;
      const averageSystolicBP: any = (
        (parseInt(this.systolicBP_1stReading) +
          parseInt(this.systolicBP_2ndReading) +
          parseInt(this.systolicBP_3rdReading)) /
        3
      ).toFixed(0);
      this.NCDScreeningForm.patchValue({
        averageSystolicBP_Reading: averageSystolicBP,
      });
    }
  }

  calculateAverageDiastolicBP() {
    if (
      this.diastolicBP_1stReading !== null &&
      this.diastolicBP_2ndReading !== null &&
      this.diastolicBP_3rdReading !== null
    ) {
      // let averageDiastolicBP: any;
      const averageDiastolicBP: any = (
        (parseInt(this.diastolicBP_1stReading) +
          parseInt(this.diastolicBP_2ndReading) +
          parseInt(this.diastolicBP_3rdReading)) /
        3
      ).toFixed(0);
      this.NCDScreeningForm.patchValue({
        averageDiastolicBP_Reading: averageDiastolicBP,
      });
    }
  }

  checkBloodSugarFasting() {
    if (this.bloodGlucose_Fasting < 50 || this.bloodGlucose_Fasting > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkBloodSugarRandom() {
    if (this.bloodGlucose_Random < 50 || this.bloodGlucose_Random > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkBloodSugar2HrPostPrandial() {
    if (this.bloodGlucose_2hr_PP < 50 || this.bloodGlucose_2hr_PP > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkBloodSugarNotSpecified() {
    if (
      this.bloodGlucose_NotSpecified < 50 ||
      this.bloodGlucose_NotSpecified > 700
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue
      );
    }
  }

  checkSystolicGreater1(systolic1: any, diastolic1: any) {
    console.log(systolic1, diastolic1);
    if (systolic1 && diastolic1) {
      if (parseInt(systolic1) <= parseInt(diastolic1)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp
        );
        this.NCDScreeningForm.patchValue({
          systolicBP_1stReading: null,
        });
      }
    }
    this.calculateAverageSystolicBP();
  }

  checkSystolicGreater2(systolic2: any, diastolic2: any) {
    console.log(systolic2, diastolic2);
    if (systolic2 && diastolic2) {
      if (parseInt(systolic2) <= parseInt(diastolic2)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp
        );
        this.NCDScreeningForm.patchValue({
          systolicBP_2ndReading: null,
        });
      }
    }
    this.calculateAverageSystolicBP();
  }

  checkSystolicGreater3(systolic3: any, diastolic3: any) {
    console.log(systolic3, diastolic3);
    if (systolic3 && diastolic3) {
      if (parseInt(systolic3) <= parseInt(diastolic3)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp
        );
        this.NCDScreeningForm.patchValue({
          systolicBP_3rdReading: null,
        });
      }
    }
    this.calculateAverageSystolicBP();
  }

  checkDiastolicLesser1(systolic1: any, diastolic1: any) {
    console.log(systolic1, diastolic1);
    if (systolic1 && diastolic1) {
      if (parseInt(systolic1) <= parseInt(diastolic1)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.DiaBp
        );
        this.NCDScreeningForm.patchValue({
          diastolicBP_1stReading: null,
        });
      }
    }
    this.calculateAverageDiastolicBP();
  }

  checkDiastolicLesser2(systolic2: any, diastolic2: any) {
    console.log(systolic2, diastolic2);
    if (systolic2 && diastolic2) {
      if (parseInt(systolic2) <= parseInt(diastolic2)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.DiaBp
        );
        this.NCDScreeningForm.patchValue({
          diastolicBP_2ndReading: null,
        });
      }
    }
    this.calculateAverageDiastolicBP();
  }

  checkDiastolicLesser3(systolic3: any, diastolic3: any) {
    console.log(systolic3, diastolic3);
    if (systolic3 && diastolic3) {
      if (parseInt(systolic3) <= parseInt(diastolic3)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.DiaBp
        );
        this.NCDScreeningForm.patchValue({
          diastolicBP_3rdReading: null,
        });
      }
    }
    this.calculateAverageDiastolicBP();
  }
  get screeningTestList() {
    return this.NCDScreeningForm.controls['labTestOrders'].value;
  }

  get height_cm() {
    return this.NCDScreeningForm.controls['height_cm'].value;
  }

  get weight_Kg() {
    return this.NCDScreeningForm.controls['weight_Kg'].value;
  }

  get hipCircumference_cm() {
    return this.NCDScreeningForm.controls['hipCircumference_cm'].value;
  }
  get waistHipRatio() {
    return this.NCDScreeningForm.controls['waistHipRatio'].value;
  }
  get waistCircumference_cm() {
    return this.NCDScreeningForm.controls['waistCircumference_cm'].value;
  }

  get systolicBP_1stReading() {
    return this.NCDScreeningForm.controls['systolicBP_1stReading'].value;
  }

  get diastolicBP_1stReading() {
    return this.NCDScreeningForm.controls['diastolicBP_1stReading'].value;
  }

  get systolicBP_2ndReading() {
    return this.NCDScreeningForm.controls['systolicBP_2ndReading'].value;
  }

  get diastolicBP_2ndReading() {
    return this.NCDScreeningForm.controls['diastolicBP_2ndReading'].value;
  }

  get systolicBP_3rdReading() {
    return this.NCDScreeningForm.controls['systolicBP_3rdReading'].value;
  }

  get diastolicBP_3rdReading() {
    return this.NCDScreeningForm.controls['diastolicBP_3rdReading'].value;
  }

  get averageDiastolicBP_Reading() {
    return this.NCDScreeningForm.controls['averageDiastolicBP_Reading'].value;
  }

  get averageSystolicBP_Reading() {
    return this.NCDScreeningForm.controls['averageDiastolicBP_Reading'].value;
  }

  get bloodGlucose_Fasting() {
    return this.NCDScreeningForm.controls['bloodGlucose_Fasting'].value;
  }

  get bloodGlucose_Random() {
    return this.NCDScreeningForm.controls['bloodGlucose_Random'].value;
  }

  get bloodGlucose_2hr_PP() {
    return this.NCDScreeningForm.controls['bloodGlucose_2hr_PP'].value;
  }

  get bloodGlucose_NotSpecified() {
    return this.NCDScreeningForm.controls['bloodGlucose_NotSpecified'].value;
  }

  get bMI() {
    return this.NCDScreeningForm.controls['bMI'].value;
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
        //result['result']
        this.NCDScreeningForm.patchValue({
          weight_Kg: result['result'],
        });
        this.calculateBMI();
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
        this.NCDScreeningForm.patchValue({
          bloodGlucose_Fasting: result['result'],
        });
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
        this.NCDScreeningForm.patchValue({
          bloodGlucose_Random: result['result'],
        });
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
      console.log('blood_glucose', result['sys'], result['dia']);
      if (result !== null) {
        this.NCDScreeningForm.patchValue({
          bloodGlucose_2hr_PP: result['result'],
        });
      }
    });
  }
  openIOTBGNotSpecifiedModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('blood_glucose', result['sys'], result['dia']);
      if (result !== null) {
        this.NCDScreeningForm.patchValue({
          bloodGlucose_NotSpecified: result['result'],
        });
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
        this.NCDScreeningForm.patchValue({
          systolicBP_1stReading: result['sys'],
          diastolicBP_1stReading: result['dia'],
        });
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
        this.NCDScreeningForm.patchValue({
          systolicBP_2ndReading: result['sys'],
          diastolicBP_2ndReading: result['dia'],
        });
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
        this.NCDScreeningForm.patchValue({
          systolicBP_3rdReading: result['sys'],
          diastolicBP_3rdReading: result['dia'],
        });
      }
    });
  }
}
