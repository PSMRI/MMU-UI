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

import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { NurseService } from '../shared/services';

/**
 * Host contract the workarea validators read from / call back into. The
 * WorkareaComponent satisfies it; passing `this` keeps the exact same state and
 * service instances the logic used inline, so behaviour is unchanged.
 */
export interface WorkareaValidationHost {
  currentLanguageSet: any;
  visitCategory: any;
  attendantType: any;
  patientMedicalForm: FormGroup;
  beneficiary: any;
  beneficiaryAge: any;
  rbsPresent: any;
  heamoglobinPresent: any;
  visualAcuityPresent: any;
  visualAcuityMandatory: number;
  diabetesSelected: number;
  ncdTemperature: boolean;
  enableLungAssessment: boolean;
  enableProvisionalDiag: boolean;
  confirmationService: ConfirmationService;
  nurseService: NurseService;
  resetSpinnerandEnableTheSubmitButton(): void;
}

/**
 * Required-field / mandatory-data validation extracted from WorkareaComponent
 * (behaviour-identical). Stateless — all component state arrives via `host`.
 */
@Injectable({ providedIn: 'root' })
export class WorkareaValidationService {
  checkMandatory(host: WorkareaValidationHost) {
    if (host.visitCategory === null || host.visitCategory === undefined) {
      host.confirmationService.alert(
        host.currentLanguageSet.alerts.info.proceedFurther
      );
    }
    if (
      host.nurseService.fileData !== undefined &&
      host.nurseService.fileData.length > 0
    ) {
      host.confirmationService.alert(
        host.currentLanguageSet.common.kindlyuploadthefiles
      );
      host.nurseService.fileData = null;
    }
  }

  checkNurseRequirements(medicalForm: any, host: WorkareaValidationHost) {
    const vitalsForm = <FormGroup>medicalForm.controls['patientVitalsForm'];
    const examinationForm = <FormGroup>(
      host.patientMedicalForm.controls['patientExaminationForm']
    );
    const pncForm = <FormGroup>(
      host.patientMedicalForm.controls['patientPNCForm']
    );
    const ancForm = <FormGroup>(
      host.patientMedicalForm.controls['patientANCForm']
    );
    const covidForm = <FormGroup>medicalForm.controls['patientVisitForm'];
    const covidForm2 = <FormGroup>covidForm.controls['patientCovidForm'];
    const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
    const historyForm = <FormGroup>medicalForm.controls['patientHistoryForm'];

    const required = [];

    if (environment.isMMUOfflineSync) {
      if (
        host.enableLungAssessment === true &&
        host.beneficiaryAge >= 18 &&
        host.nurseService.isAssessmentDone === false
      ) {
        required.push('Please perform Lung Assessment');
      }
    }

    console.log('pncForm', pncForm);

    if (host.visitCategory === 'PNC') {
      if (pncForm.controls['deliveryPlace'].errors) {
        required.push(host.currentLanguageSet.pncData.placeofDelivery);
      }
      if (pncForm.controls['deliveryType'].errors) {
        required.push(host.currentLanguageSet.pncData.typeofDelivery);
      }
    }

    if (host.visitCategory === 'ANC') {
      const ancdetailsForm = <FormGroup>(
        ancForm.controls['patientANCDetailsForm']
      );
      const ANCVitalsForm = <FormGroup>(
        medicalForm.controls['patientVitalsForm']
      );
      console.log('ANCCaseRecordForm', ANCVitalsForm);
      if (ancdetailsForm.controls['primiGravida'].errors) {
        required.push(
          host.currentLanguageSet.ancData.ancDataDetails.primiGravida
        );
      }
      if (ancdetailsForm.controls['lmpDate'].errors) {
        required.push(
          host.currentLanguageSet.ancData.ancDataDetails.lastMenstrualPeriod
        );
      }

      if (host.attendantType === 'doctor') {
        const ANCCaseRecordForm = <FormGroup>(
          medicalForm.controls['patientCaseRecordForm']
        );
        if (host.rbsPresent > 0) {
          let investigationCount = 0;
          const labTestArray =
            ANCCaseRecordForm.controls['generalDoctorInvestigationForm'].value
              .labTest;
          if (
            labTestArray !== undefined &&
            labTestArray !== null &&
            labTestArray.length > 0
          ) {
            labTestArray.forEach((element: any) => {
              if (
                element.procedureName !== null &&
                element.procedureName.toLowerCase() ===
                  environment.RBSTest.toLowerCase()
              ) {
                investigationCount++;
              }
            });
          }

          if (
            investigationCount === 0 &&
            ANCVitalsForm.controls['rbsTestResult'].value === null
          ) {
            required.push(
              host.currentLanguageSet.pleaseSelectRBSTestInInvestigation
            );
          }
        }
        if (host.heamoglobinPresent > 0) {
          let investigationCount = 0;
          const labTestArray =
            ANCCaseRecordForm.controls['generalDoctorInvestigationForm'].value
              .labTest;
          if (
            labTestArray !== null &&
            labTestArray !== undefined &&
            labTestArray.length > 0
          ) {
            labTestArray.forEach((element: any) => {
              if (
                element.procedureName !== null &&
                element.procedureName.toLowerCase() ===
                  environment.haemoglobinTest.toLowerCase()
              ) {
                investigationCount++;
              }
            });
          }

          if (investigationCount === 0) {
            required.push(
              host.currentLanguageSet.pleaseSelectHeamoglobinTestInInvestigation
            );
          }
        }
      }
    }

    if (host.visitCategory !== 'General OPD (QC)') {
      const pregForm = <FormGroup>medicalForm.controls['patientHistoryForm'];
      const pregForm1 = <FormGroup>pregForm.controls['pastObstericHistory'];
      const pregForm2 = <FormGroup>(
        pregForm1.controls['pastObstericHistoryList']
      );
      if (host.attendantType === 'nurse') {
        if (pregForm2.controls) {
          const score1 = Number(pregForm2.controls['length']);
          for (let i = 0; i < score1; i++) {
            const pregForm3 = <FormGroup>pregForm2.controls[i];
            if (
              pregForm3.controls['pregOutcome'].value &&
              pregForm3.controls['pregOutcome'].value.pregOutcome === 'Abortion'
            ) {
              if (
                pregForm3.controls['abortionType'].value &&
                pregForm3.controls['abortionType'].value.complicationValue ===
                  'Induced' &&
                pregForm3.controls['typeofFacility'].errors
              ) {
                required.push(
                  host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .typeofFacility +
                    '-' +
                    host.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
              if (pregForm3.controls['postAbortionComplication'].errors) {
                required.push(
                  host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .complicationPostAbortion +
                    '-' +
                    host.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
              if (pregForm3.controls['abortionType'].errors) {
                required.push(
                  host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .typeOfAbortion +
                    '-' +
                    host.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
              if (pregForm3.controls['pregDuration'].errors) {
                required.push(
                  host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .noOfcompletedWeeks +
                    '-' +
                    host.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
            }
          }
        }
      }
    }

    if (host.visitCategory === 'COVID-19 Screening') {
      const historyForm = <FormGroup>(
        host.patientMedicalForm.controls['patientHistoryForm']
      );
      console.log('HistoryForm', historyForm);
      const historyForm2 = <FormGroup>(
        historyForm.controls['comorbidityHistory']
      );
      const historyForm3 = <FormArray>(
        historyForm2.controls['comorbidityConcurrentConditionsList']
      );
      const historyForm4 = <FormGroup>historyForm3.controls[0];
      if (historyForm4.controls['comorbidConditions'].errors) {
        required.push(
          host.currentLanguageSet.historyData.ancHistory
            .combordityANC_OPD_NCD_PNC.comorbidConditions
        );
      }
      if (covidForm2.controls['contactStatus'].errors) {
        required.push(host.currentLanguageSet.contactHistory);
      }

      if (covidForm2.controls['travelStatus'].errors) {
        required.push(host.currentLanguageSet.covid.travelHistory);
      }
      if (covidForm2.controls['symptom'].errors) {
        required.push(
          host.currentLanguageSet.ExaminationData.cancerScreeningExamination
            .symptoms.symptoms
        );
      }
    }
    if (
      host.visitCategory === 'General OPD' &&
      host.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      const diagForm2 = <FormArray>(
        diagForm1.controls['provisionalDiagnosisList']
      );
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (diagForm3.controls['provisionalDiagnosis'].errors) {
        required.push(
          host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              host.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }
    }
    if (host.visitCategory === 'PNC' && host.attendantType === 'doctor') {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      const diagForm2 = <FormArray>(
        diagForm1.controls['provisionalDiagnosisList']
      );
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (diagForm3.controls['provisionalDiagnosis'].errors) {
        required.push(
          host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              host.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }

      const confirmatorydiagForm = <FormArray>(
        diagForm1.controls['confirmatoryDiagnosisList']
      );

      confirmatorydiagForm.value.filter((item: any) => {
        if (
          item.confirmatoryDiagnosis &&
          (item.conceptID === null ||
            item.conceptID === undefined ||
            item.conceptID === '')
        )
          required.push(
            host.currentLanguageSet.confirmatoryDiagnosisIsNotValid
          );
      });
    }
    if (
      host.visitCategory === 'Cancer Screening' &&
      host.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['diagnosisForm'];
      if (diagForm1.controls['provisionalDiagnosisPrimaryDoctor'].errors) {
        required.push(
          host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }
    }
    if (
      host.visitCategory === 'COVID-19 Screening' &&
      host.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      console.log('diag', diagForm1);
      if (diagForm1.controls['doctorDiagnosis'].errors) {
        required.push(host.currentLanguageSet.doctorDiagnosis);
      }
    }

    if (host.visitCategory !== 'General OPD (QC)') {
      const personalHistory = historyForm.controls['personalHistory'];
      const allergyList = personalHistory.value.allergicList;

      let snomedTermNotMapped = false;

      if (allergyList.length > 0) {
        for (let i = 0; i < allergyList.length; i++) {
          if (allergyList[i].allergyType !== null) {
            if (
              allergyList[i].snomedCode === null &&
              allergyList[i].snomedTerm !== null
            ) {
              snomedTermNotMapped = true;
            } else if (
              allergyList[i].snomedCode !== null &&
              allergyList[i].snomedTerm === null
            ) {
              snomedTermNotMapped = true;
            }
          }
        }
      }

      if (snomedTermNotMapped) {
        required.push(host.currentLanguageSet.allergyNameIsNotValid);
      }
    }
    // [20] Require a family member whenever a real disease is chosen in Family
    // History (mirrors the NCD-screening rule). Family history stays optional
    // overall: an empty / None / Nil row does not raise the error.
    const familyHistoryForm = <FormGroup>(
      historyForm?.controls?.['familyHistory']
    );
    if (familyHistoryForm) {
      const familyDiseaseList = (<FormArray>(
        familyHistoryForm.controls['familyDiseaseList']
      )).value;
      let familyMember = 0;
      let familyDiseasesLength = familyDiseaseList.length;
      for (let i = 0; i < familyDiseaseList.length; i++) {
        const dt = familyDiseaseList[i].diseaseType;
        const dtName = dt && dt.diseaseType ? dt.diseaseType : dt;
        if (dt !== null && dtName !== 'None' && dtName !== 'Nil') {
          if (
            familyDiseaseList[i].familyMembers &&
            familyDiseaseList[i].familyMembers.length > 0
          ) {
            familyMember++;
          }
        } else {
          familyDiseasesLength--;
        }
      }
      if (familyMember !== familyDiseasesLength) {
        required.push(host.currentLanguageSet.familyMemberInFamilyHistory);
      }
    }
    if (vitalsForm !== undefined && vitalsForm !== null) {
      if (vitalsForm.controls['systolicBP_1stReading'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .systolicBP
        );
      }
      if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .diastolicBP
        );
      }

      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      }
      if (vitalsForm.controls['temperature'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .temperature
        );
      }
      if (vitalsForm.controls['pulseRate'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .pulseRate
        );
      }
    }
    if (host.visitCategory === 'NCD care') {
      const diagnosisForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      if (diagnosisForm !== undefined) {
        const diagnosisForm1 = <FormGroup>(
          diagnosisForm.controls['generalDiagnosisForm']
        );
        if (diagnosisForm1 !== undefined) {
          const temp =
            diagnosisForm1.controls['ncdScreeningConditionArray'].value;
          if (diagnosisForm1.controls['ncdScreeningConditionArray'].errors) {
            required.push(host.currentLanguageSet.casesheet.ncdCondition);
          }
          let flag = false;
          if (temp !== undefined && temp !== null && temp.length > 0) {
            temp.forEach((element: any) => {
              if (element === 'Other') flag = true;
            });
          }

          console.log(
            diagnosisForm1.controls['ncdScreeningConditionOther'].value
          );
          if (
            flag &&
            diagnosisForm1.controls['ncdScreeningConditionOther'].value === null
          )
            required.push(host.currentLanguageSet.nCDConditionOther);
        }
      }
    }
    console.log('referForm', referForm);
    if (host.attendantType === 'doctor') {
      const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
      if (
        referForm.controls['referredToInstituteName'].value === null &&
        sessionStorage.getItem('instFlag') === 'true' &&
        sessionStorage.getItem('suspectFlag') === 'true'
      ) {
        required.push(
          'host.currentLanguageSet.Referdetails.higherhealthcarecenter'
        );
      }

      if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
        if (
          referForm.controls['refrredToAdditionalServiceList'].value.length > 0
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(host.currentLanguageSet.Referdetails.referralReason);
          }
        } else if (
          referForm.controls['referredToInstituteName'].value !== null
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(host.currentLanguageSet.Referdetails.referralReason);
          }
        }
      } else if (referForm.controls['referredToInstituteName'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }
    console.log(examinationForm, 'examinationForm');
    if (examinationForm !== undefined && examinationForm !== null) {
      const generalExaminationForm = <FormGroup>(
        examinationForm.controls['generalExaminationForm']
      );
      if (generalExaminationForm.controls['typeOfDangerSigns'].errors) {
        required.push(
          host.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.dangersigns
        );
      }
      if (generalExaminationForm.controls['lymphnodesInvolved'].errors) {
        required.push(
          host.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.lymph
        );
      }
      if (generalExaminationForm.controls['typeOfLymphadenopathy'].errors) {
        required.push(
          host.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.typeofLymphadenopathy
        );
      }
      if (generalExaminationForm.controls['extentOfEdema'].errors) {
        required.push(
          host.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.extentofEdema
        );
      }
      if (generalExaminationForm.controls['edemaType'].errors) {
        required.push(
          host.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.typeofEdema
        );
      }
    }

    // Note: the original app does NOT require a prescription on doctor submit,
    // so no "at least one prescription" check is added here (kept faithful).

    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      host.resetSpinnerandEnableTheSubmitButton();
      return 0;
    } else {
      return 1;
    }
  }

  checkCancerRequiredData(medicalForm: any, host: WorkareaValidationHost) {
    const vitalsForm = <FormGroup>medicalForm.controls['patientVitalsForm'];
    const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
    const required = [];

    if (vitalsForm !== undefined && vitalsForm !== null) {
      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      }
      if (vitalsForm.controls['systolicBP_1stReading'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .systolicBP
        );
      }
      if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
        required.push(
          host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .diastolicBP
        );
      }
    }

    if (
      host.visitCategory === 'Cancer Screening' &&
      host.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      if (diagForm.controls['provisionalDiagnosisPrimaryDoctor'].errors) {
        required.push(
          host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }
    }

    if (host.attendantType === 'doctor') {
      if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
        if (
          referForm.controls['refrredToAdditionalServiceList'].value.length > 0
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(host.currentLanguageSet.Referdetails.referralReason);
          }
        } else if (referForm.controls['referredToInstituteID'].value !== null) {
          if (referForm.controls['referralReason'].errors) {
            required.push(host.currentLanguageSet.Referdetails.referralReason);
          }
        }
      } else if (referForm.controls['referredToInstituteID'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      host.resetSpinnerandEnableTheSubmitButton();
      return false;
    } else {
      return true;
    }
  }

  checkTMVisitDetailsRequiredData(
    medicalForm: any,
    host: WorkareaValidationHost
  ) {
    const required = [];
    const tmVisitForm = <FormGroup>medicalForm.controls['patientVisitForm'];
    const tmVisitForm2 = <FormGroup>tmVisitForm.controls['tmcConfirmationForm'];
    if (tmVisitForm2.controls['refrredToAdditionalServiceList'].errors) {
      required.push(host.currentLanguageSet.Referdetails.referredtoinstitute);
    }
    console.log('tmVisitForm2', tmVisitForm2);
    if (
      tmVisitForm2.value !== undefined &&
      tmVisitForm2.value.isTMCConfirmed !== undefined &&
      tmVisitForm2.value.isTMCConfirmed === true
    )
      tmVisitForm2.patchValue({ refrredToAdditionalServiceList: null });
    if (tmVisitForm2.controls['tmcConfirmed'].errors) {
      required.push(host.currentLanguageSet.tmcConfirmed);
    }
    console.log('tmVisitForm2', tmVisitForm2);
    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return false;
    } else {
      return true;
    }
  }

  checkNCDScreeningRequiredData(
    medicalForm: any,
    host: WorkareaValidationHost
  ) {
    //WDF requirement
    // let NCDScreeningForm = <FormGroup>medicalForm.controls['NCDScreeningForm'];
    const NCDScreeningForm = <FormGroup>(
      medicalForm.controls['patientVitalsForm']
    );
    const ncdIDRSScreeningForm = <FormGroup>(
      medicalForm.controls['idrsScreeningForm']
    );
    const required = [];

    if (environment.isMMUOfflineSync) {
      if (
        host.enableLungAssessment === true &&
        host.beneficiaryAge >= 18 &&
        host.nurseService.isAssessmentDone === false
      ) {
        required.push('Please perform Lung Assessment');
      }
    }

    let count = 0;
    const physicalActivityMandatory = <FormGroup>(
      medicalForm.controls['patientHistoryForm'].controls[
        'physicalActivityHistory'
      ]
    );
    if (
      host.attendantType === 'nurse' &&
      host.diabetesSelected === 1 &&
      NCDScreeningForm.controls['rbsCheckBox'].value === true &&
      NCDScreeningForm.controls['rbsTestResult'].value === null
    ) {
      required.push('Please perform RBS Test under Vitals');
    }
    if (host.beneficiary.ageVal >= 30) {
      const familyDiseaseList =
        medicalForm.controls.patientHistoryForm.controls.familyHistory.controls
          .familyDiseaseList.value;
      familyDiseaseList.forEach((element: any) => {
        if (
          element.diseaseType !== null &&
          element.deleted === false &&
          element.diseaseType.diseaseType === 'Diabetes Mellitus'
        ) {
          count++;
        }
      });
      if (count === 0) {
        required.push(
          host.currentLanguageSet.pleaseSelectDiabetesMellitusInFamilyHistory
        );
      }
      if (physicalActivityMandatory.controls['activityType'].errors) {
        required.push(host.currentLanguageSet.physicalActivity);
      }
    }
    let familyMember = 0;
    const familyDiseasesList =
      medicalForm.controls.patientHistoryForm.controls.familyHistory.controls
        .familyDiseaseList.value;
    let familyDiseasesLength = familyDiseasesList.length;
    for (let element = 0; element < familyDiseasesList.length; element++) {
      if (
        familyDiseasesList[element].diseaseType !== null &&
        familyDiseasesList[element].deleted === false
      ) {
        if (
          familyDiseasesList[element].familyMembers !== null &&
          familyDiseasesList[element].familyMembers.length > 0
        ) {
          familyMember++;
        }
      } else {
        familyDiseasesLength--;
      }
    }
    if (familyMember !== familyDiseasesLength) {
      required.push(host.currentLanguageSet.familyMemberInFamilyHistory);
    }
    if (ncdIDRSScreeningForm.controls['requiredList'].value !== null) {
      const ar = ncdIDRSScreeningForm.controls['requiredList'].value;
      for (let i = 0; i < ar.length; i++) {
        if (ar[i] !== 'Hypertension') {
          required.push(ar[i]);
        }
      }
    }

    //WDF requirement -> to check whether RBS test is prescribed or not
    if (host.attendantType === 'doctor') {
      const NCDScreeningCaseRecordForm = <FormGroup>(
        medicalForm.controls['patientCaseRecordForm']
      );
      if (host.rbsPresent > 0 && host.diabetesSelected > 0) {
        let investigationCount = 0;
        const labTestArray =
          NCDScreeningCaseRecordForm.controls['generalDoctorInvestigationForm']
            .value.labTest;
        if (
          labTestArray !== undefined &&
          labTestArray !== null &&
          labTestArray.length > 0
        ) {
          labTestArray.forEach((element: any) => {
            if (
              element.procedureName !== null &&
              element.procedureName.toLowerCase() ===
                environment.RBSTest.toLowerCase()
            ) {
              investigationCount++;
            }
          });
        }

        if (
          investigationCount === 0 &&
          host.diabetesSelected === 1 &&
          NCDScreeningForm.controls['rbsCheckBox'].value === true &&
          NCDScreeningForm.controls['rbsTestResult'].value === null
        ) {
          required.push('Please select RBS Test under Vitals or Investigation');
        }
        if (
          investigationCount === 0 &&
          host.diabetesSelected === 1 &&
          NCDScreeningForm.controls['rbsCheckBox'].value === false &&
          NCDScreeningForm.controls['rbsTestResult'].value === null
        ) {
          required.push('Please select RBS Test under Investigation');
        }
      }
      if (host.visualAcuityPresent > 0 && host.visualAcuityMandatory > 0) {
        let investigationVisualCount = 0;
        const labTestArray =
          NCDScreeningCaseRecordForm.controls['generalDoctorInvestigationForm']
            .value.labTest;
        if (
          labTestArray !== null &&
          labTestArray !== undefined &&
          labTestArray.length > 0
        ) {
          labTestArray.forEach((element: any) => {
            if (
              element.procedureName !== null &&
              element.procedureName.toLowerCase() ===
                environment.visualAcuityTest.toLowerCase()
            ) {
              investigationVisualCount++;
            }
          });
        }

        if (investigationVisualCount === 0) {
          required.push(
            host.currentLanguageSet.pleaseSelectVisualAcuityTestInInvestigation
          );
        }
      }
    }
    //WDF requirement
    if (NCDScreeningForm.controls['height_cm'].errors) {
      required.push(
        host.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .height
      );
    }
    if (NCDScreeningForm.controls['weight_Kg'].errors) {
      required.push(
        host.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .weight
      );
    }
    if (NCDScreeningForm.controls['waistCircumference_cm'].errors) {
      required.push(
        host.currentLanguageSet.vitalsDetails.vitalsCancerscreening_QC
          .waistCircumference
      );
    }
    console.log('ncdTemp', host.ncdTemperature);
    if (
      NCDScreeningForm.controls['temperature'].errors &&
      host.ncdTemperature === true
    ) {
      required.push(
        host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .temperature
      );
    }
    if (NCDScreeningForm.controls['pulseRate'].errors) {
      required.push(
        host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .pulseRate
      );
    }
    if (NCDScreeningForm.controls['systolicBP_1stReading'].errors) {
      required.push(
        host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .systolicBP
      );
    }
    if (NCDScreeningForm.controls['diastolicBP_1stReading'].errors) {
      required.push(
        host.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .diastolicBP
      );
    }
    if (host.attendantType === 'doctor') {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      const diagForm2 = <FormArray>(
        diagForm1.controls['provisionalDiagnosisList']
      );
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (
        diagForm3.controls['provisionalDiagnosis'].errors &&
        host.enableProvisionalDiag === true
      ) {
        required.push(
          host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              host.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }
    }

    if (host.attendantType === 'doctor') {
      const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
      if (
        referForm.controls['referredToInstituteName'].value === null &&
        sessionStorage.getItem('instFlag') === 'true' &&
        sessionStorage.getItem('suspectFlag') === 'true'
      ) {
        required.push(
          host.currentLanguageSet.Referdetails.higherhealthcarecenter
        );
      }
      if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
        if (
          referForm.controls['refrredToAdditionalServiceList'].value.length > 0
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(host.currentLanguageSet.Referdetails.referralReason);
          }
        } else if (
          referForm.controls['referredToInstituteName'].value !== null
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(host.currentLanguageSet.Referdetails.referralReason);
          }
        }
      } else if (referForm.controls['referredToInstituteName'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      host.resetSpinnerandEnableTheSubmitButton();
      return false;
    } else {
      return true;
    }
  }

  checkQuickConsultDoctorData(
    patientMedicalForm: any,
    host: WorkareaValidationHost
  ) {
    const form = <FormGroup>(
      host.patientMedicalForm.controls['patientQuickConsultForm']
    );

    const referForm = <FormGroup>(
      patientMedicalForm.controls['patientReferForm']
    );

    const required = [];

    if (form.controls['chiefComplaintList'].errors) {
      required.push(
        host.currentLanguageSet.nurseData.chiefComplaintsDetails.chiefComplaints
      );
    }
    if (form.controls['clinicalObservation'].errors) {
      required.push(host.currentLanguageSet.casesheet.clinicalObs);
    }
    if (form.controls['provisionalDiagnosisList'].errors) {
      required.push(
        host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
      );
    }
    if (
      host.visitCategory === 'General OPD (QC)' &&
      host.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        host.patientMedicalForm.controls['patientQuickConsultForm']
      );
      const diagForm2 = <FormArray>(
        diagForm.controls['provisionalDiagnosisList']
      );
      console.log('diagForm2', diagForm2);
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (diagForm3.controls['provisionalDiagnosis'].errors) {
        required.push(
          host.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              host.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }
    }

    if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
      if (
        referForm.controls['refrredToAdditionalServiceList'].value.length > 0
      ) {
        if (referForm.controls['referralReason'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      } else if (referForm.controls['referredToInstituteName'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      }
    } else if (referForm.controls['referredToInstituteName'].value !== null) {
      if (host.visitCategory === 'FP & Contraceptive Services') {
        if (referForm.controls['referralReasonList'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      } else {
        if (referForm.controls['referralReason'].errors) {
          required.push(host.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    // Note: the original app does NOT require a prescription on submit (quick
    // consult doctor flow included), so no such check is added here.

    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      host.resetSpinnerandEnableTheSubmitButton();
      return 0;
    } else {
      return 1;
    }
  }

  checkNCDScreeningHistory(historyForm: any, host: WorkareaValidationHost) {
    const required = [];

    let count = 0;
    const familyDiseaseList =
      historyForm.controls.patientHistoryForm.controls.familyHistory.controls
        .familyDiseaseList.value;
    familyDiseaseList.forEach((element: any) => {
      if (
        element.diseaseType !== null &&
        element.deleted === false &&
        element.diseaseType.diseaseType === 'Diabetes Mellitus'
      ) {
        count++;
      }
    });
    if (host.beneficiaryAge < 30) {
      count++;
    }

    if (count === 0) {
      required.push(
        host.currentLanguageSet.pleaseSelectDiabetesMellitusInFamilyHistory
      );
    }
    let familyMember = 0;
    const familyDiseasesList =
      historyForm.controls.patientHistoryForm.controls.familyHistory.controls
        .familyDiseaseList.value;
    let familyDiseasesLength = familyDiseasesList.length;
    for (let element = 0; element < familyDiseasesList.length; element++) {
      if (
        familyDiseasesList[element].diseaseType !== null &&
        familyDiseasesList[element].deleted === false
      ) {
        if (
          familyDiseasesList[element].familyMembers !== null &&
          familyDiseasesList[element].familyMembers.length > 0
        ) {
          familyMember++;
        }
      } else {
        familyDiseasesLength--;
      }
    }
    if (familyMember !== familyDiseasesLength) {
      required.push(host.currentLanguageSet.familyMemberInFamilyHistory);
    }

    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return 0;
    } else {
      return 1;
    }
  }

  checkPastObstericHistory(
    generalOPDHistory: any,
    host: WorkareaValidationHost
  ) {
    const vitalsForm = <FormGroup>(
      generalOPDHistory.controls['patientHistoryForm']
    );
    const pregForm1 = <FormGroup>vitalsForm.controls['pastObstericHistory'];
    const pregForm2 = <FormGroup>pregForm1.controls['pastObstericHistoryList'];
    const historyForm = <FormGroup>(
      generalOPDHistory.controls['patientHistoryForm']
    );
    const required = [];
    if (pregForm2.controls) {
      const score1 = Number(pregForm2.controls['length']);
      for (let i = 0; i < score1; i++) {
        const pregForm3 = <FormGroup>pregForm2.controls[i];
        if (
          pregForm3.controls['pregOutcome'].value &&
          pregForm3.controls['pregOutcome'].value.pregOutcome === 'Abortion'
        ) {
          if (
            pregForm3.controls['abortionType'].value &&
            pregForm3.controls['abortionType'].value.complicationValue ===
              'Induced' &&
            pregForm3.controls['typeofFacility'].errors
          ) {
            required.push(
              host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .typeofFacility +
                '-' +
                host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
          if (pregForm3.controls['postAbortionComplication'].errors) {
            required.push(
              host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .complicationPostAbortion +
                '-' +
                host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
          if (pregForm3.controls['abortionType'].errors) {
            required.push(
              host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .typeOfAbortion +
                '-' +
                host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
          if (pregForm3.controls['pregDuration'].errors) {
            required.push(
              host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .noOfcompletedWeeks +
                '-' +
                host.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
        }
      }
    }
    const personalHistory = historyForm.controls['personalHistory'];
    const allergyList = personalHistory.value.allergicList;

    let snomedTermNotMapped = false;

    if (allergyList.length > 0) {
      for (let i = 0; i < allergyList.length; i++) {
        if (allergyList[i].allergyType !== null) {
          if (
            allergyList[i].snomedCode === null &&
            allergyList[i].snomedTerm !== null
          ) {
            snomedTermNotMapped = true;
          } else if (
            allergyList[i].snomedCode !== null &&
            allergyList[i].snomedTerm === null
          ) {
            snomedTermNotMapped = true;
          }
        }
      }
    }

    if (snomedTermNotMapped) {
      required.push(host.currentLanguageSet.allergyNameIsNotValid);
    }
    if (required.length) {
      host.confirmationService.notify(
        host.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return 0;
    } else {
      return 1;
    }
  }
}
