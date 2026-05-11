import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { NurseService, DoctorService } from '../services';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkareaFormService {
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private sessionstorage: SessionStorageService
  ) {}

  /**
   * Centralized validation logic for various clinical visit categories
   */
  checkNurseRequirements(
    medicalForm: FormGroup,
    visitCategory: string,
    attendantType: string,
    beneficiaryAge: number,
    ncdTemperature: boolean,
    enableLungAssessment: boolean,
    rbsPresent: number,
    heamoglobinPresent: number,
    diabetesSelected: number,
    currentLanguageSet: any
  ): number {
    const vitalsForm = medicalForm.get('patientVitalsForm') as FormGroup;
    const examinationForm = medicalForm.get(
      'patientExaminationForm'
    ) as FormGroup;
    const pncForm = medicalForm.get('patientPNCForm') as FormGroup;
    const ancForm = medicalForm.get('patientANCForm') as FormGroup;
    const historyForm = medicalForm.get('patientHistoryForm') as FormGroup;
    const referForm = medicalForm.get('patientReferForm') as FormGroup;

    const required: string[] = [];

    // Offline Sync Assessment
    if (environment.isMMUOfflineSync) {
      if (
        enableLungAssessment &&
        beneficiaryAge >= 18 &&
        !this.nurseService.isAssessmentDone
      ) {
        required.push('Please perform Lung Assessment');
      }
    }

    // PNC Specific Validation
    if (visitCategory === 'PNC' && pncForm) {
      if (pncForm.controls['deliveryPlace']?.errors)
        required.push(currentLanguageSet.pncData.placeofDelivery);
      if (pncForm.controls['deliveryType']?.errors)
        required.push(currentLanguageSet.pncData.typeofDelivery);
    }

    // ANC Specific Validation
    if (visitCategory === 'ANC' && ancForm) {
      const ancdetailsForm = ancForm.get('patientANCDetailsForm') as FormGroup;
      if (ancdetailsForm?.controls['primiGravida']?.errors)
        required.push(currentLanguageSet.ancData.ancDataDetails.primiGravida);
      if (ancdetailsForm?.controls['lmpDate']?.errors)
        required.push(
          currentLanguageSet.ancData.ancDataDetails.lastMenstrualPeriod
        );

      if (attendantType === 'doctor') {
        const caseRecordForm = medicalForm.get(
          'patientCaseRecordForm'
        ) as FormGroup;
        if (rbsPresent > 0 && !vitalsForm?.get('rbsTestResult')?.value) {
          // Check if RBS exists in investigation if not in vitals
          const labTests =
            caseRecordForm
              ?.get('generalDoctorInvestigationForm')
              ?.get('labTest')?.value || [];
          const hasRbs = labTests.some(
            (t: any) =>
              t.procedureName?.toLowerCase() ===
              environment.RBSTest.toLowerCase()
          );
          if (!hasRbs)
            required.push(
              currentLanguageSet.pleaseSelectRBSTestInInvestigation
            );
        }
        if (heamoglobinPresent > 0) {
          const labTests =
            caseRecordForm
              ?.get('generalDoctorInvestigationForm')
              ?.get('labTest')?.value || [];
          const hasHb = labTests.some(
            (t: any) =>
              t.procedureName?.toLowerCase() ===
              environment.haemoglobinTest.toLowerCase()
          );
          if (!hasHb)
            required.push(
              currentLanguageSet.pleaseSelectHeamoglobinTestInInvestigation
            );
        }
      }
    }

    // Vitals Validation (Common)
    if (vitalsForm) {
      if (vitalsForm.controls['systolicBP_1stReading']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.systolicBP
        );
      if (vitalsForm.controls['diastolicBP_1stReading']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.diastolicBP
        );
      if (vitalsForm.controls['height_cm']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      if (vitalsForm.controls['weight_Kg']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      if (vitalsForm.controls['pulseRate']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.pulseRate
        );
      if (ncdTemperature && vitalsForm.controls['temperature']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.temperature
        );
    }

    // Prescription Presence for Doctors
    if (attendantType === 'doctor') {
      const drugPrescriptionForm = medicalForm
        .get('patientCaseRecordForm')
        ?.get('drugPrescriptionForm') as FormGroup;
      const prescribedDrugs =
        drugPrescriptionForm
          ?.get('prescribedDrugs')
          ?.value?.filter((d: any) => !!d.createdBy) || [];
      if (prescribedDrugs.length === 0) {
        required.push(
          currentLanguageSet?.Prescription?.prescriptionRequired ||
            'Please add at least one prescription'
        );
      }
    }

    if (required.length > 0) {
      this.confirmationService.notify(
        currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return 0;
    }
    return 1;
  }

  /**
   * Submit Cancer Visit Details (Nurse)
   */
  submitNurseCancerVisitDetails(
    medicalForm: FormGroup,
    imageCoordinates: any[],
    currentLanguageSet: any
  ): Observable<any> {
    return new Observable(observer => {
      this.confirmationService
        .confirm(
          'info',
          currentLanguageSet.alerts.info.doctorVisit,
          'Yes',
          'No'
        )
        .subscribe(result => {
          if (result !== undefined && result !== null) {
            this.nurseService
              .postNurseCancerVisitForm(medicalForm, imageCoordinates, result)
              .subscribe(
                res => {
                  observer.next(res);
                  observer.complete();
                },
                err => observer.error(err)
              );
          } else {
            observer.complete();
          }
        });
    });
  }

  /**
   * Submit General OPD Visit Details (Nurse)
   */
  submitNurseGeneralOPDVisitDetails(
    medicalForm: FormGroup,
    visitCategory: string,
    beneficiary: any
  ): Observable<any> {
    return this.nurseService.postNurseGeneralOPDVisitForm(
      medicalForm,
      visitCategory,
      beneficiary
    );
  }

  /**
   * Submit Quick Consult Visit Details (Nurse)
   */
  submitNurseQuickConsultVisitDetails(medicalForm: FormGroup): Observable<any> {
    return this.nurseService.postNurseGeneralQCVisitForm(medicalForm);
  }

  /**
   * Submit PNC Visit Details (Nurse)
   */
  submitPatientMedicalDetailsPNC(
    medicalForm: FormGroup,
    visitCategory: string,
    beneficiary: any
  ): Observable<any> {
    return this.nurseService.postNursePNCVisitForm(
      medicalForm,
      visitCategory,
      beneficiary
    );
  }

  /**
   * Cleanup session data after successful visit submission
   */
  removeBeneficiaryDataForNurseVisit(): void {
    sessionStorage.removeItem('beneficiaryGender');
    sessionStorage.removeItem('beneficiaryRegID');
    sessionStorage.removeItem('beneficiaryID');
    sessionStorage.removeItem('benFlowID');
  }

  /**
   * Submit ANC Visit Details (Nurse)
   */
  submitNurseANCVisitDetails(
    medicalForm: FormGroup,
    benVisitID: any,
    visitCategory: string,
    benAge: any
  ): Observable<any> {
    return this.nurseService.postNurseANCVisitForm(
      medicalForm,
      benVisitID,
      visitCategory,
      benAge
    );
  }

  /**
   * Submit NCD Screening Visit Details (Nurse)
   */
  submitNurseNCDScreeningVisitDetails(
    medicalForm: FormGroup,
    visitCategory: string
  ): Observable<any> {
    return this.nurseService.postNCDScreeningForm(medicalForm, visitCategory);
  }

  /**
   * Submit NCD Care Visit Details (Nurse)
   */
  submitNurseNCDcareVisitDetails(
    medicalForm: FormGroup,
    visitCategory: string,
    beneficiary: any
  ): Observable<any> {
    return this.nurseService.postNurseNCDCareVisitForm(
      medicalForm,
      visitCategory,
      beneficiary
    );
  }

  /**
   * Submit COVID Care Visit Details (Nurse)
   */
  submitNurseCovidcareVisitDetails(
    medicalForm: FormGroup,
    visitCategory: string,
    beneficiary: any
  ): Observable<any> {
    return this.nurseService.postNurseCovidCareVisitForm(
      medicalForm,
      visitCategory,
      beneficiary
    );
  }

  /**
   * Validate Cancer Screening Requirements
   */
  checkCancerRequiredData(
    medicalForm: FormGroup,
    visitCategory: string,
    attendantType: string,
    currentLanguageSet: any
  ): boolean {
    const vitalsForm = medicalForm.get('patientVitalsForm') as FormGroup;
    const referForm = medicalForm.get('patientReferForm') as FormGroup;
    const required: string[] = [];

    if (vitalsForm) {
      if (vitalsForm.controls['height_cm']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      if (vitalsForm.controls['weight_Kg']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      if (vitalsForm.controls['systolicBP_1stReading']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.systolicBP
        );
      if (vitalsForm.controls['diastolicBP_1stReading']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.diastolicBP
        );
    }

    if (visitCategory === 'Cancer Screening' && attendantType === 'doctor') {
      const diagForm = medicalForm.get('patientCaseRecordForm') as FormGroup;
      if (
        diagForm?.get('diagnosisForm')?.get('provisionalDiagnosisPrimaryDoctor')
          ?.errors
      ) {
        required.push(currentLanguageSet.DiagnosisDetails.provisionaldiagnosis);
      }
    }

    if (attendantType === 'doctor' && referForm) {
      const referredToInstituteID = referForm.get(
        'referredToInstituteID'
      )?.value;
      const additionalServices =
        referForm.get('refrredToAdditionalServiceList')?.value || [];

      if (additionalServices.length > 0 || referredToInstituteID !== null) {
        if (referForm.get('referralReason')?.errors) {
          required.push(currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    if (required.length > 0) {
      this.confirmationService.notify(
        currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return false;
    }
    return true;
  }

  /**
   * Validate NCD Screening Requirements
   */
  checkNCDScreeningRequiredData(
    medicalForm: FormGroup,
    visitCategory: string,
    attendantType: string,
    beneficiaryAge: number,
    ncdTemperature: boolean,
    enableLungAssessment: boolean,
    rbsPresent: number,
    diabetesSelected: number,
    visualAcuityPresent: number,
    visualAcuityMandatory: number,
    enableProvisionalDiag: boolean,
    currentLanguageSet: any
  ): boolean {
    const vitalsForm = medicalForm.get('patientVitalsForm') as FormGroup;
    const idrsForm = medicalForm.get('idrsScreeningForm') as FormGroup;
    const historyForm = medicalForm.get('patientHistoryForm') as FormGroup;
    const required: string[] = [];

    if (
      environment.isMMUOfflineSync &&
      enableLungAssessment &&
      beneficiaryAge >= 18 &&
      !this.nurseService.isAssessmentDone
    ) {
      required.push('Please perform Lung Assessment');
    }

    if (
      attendantType === 'nurse' &&
      diabetesSelected === 1 &&
      vitalsForm?.get('rbsCheckBox')?.value === true &&
      vitalsForm?.get('rbsTestResult')?.value === null
    ) {
      required.push('Please perform RBS Test under Vitals');
    }

    if (beneficiaryAge >= 30 && historyForm) {
      const familyDiseaseList =
        historyForm.get('familyHistory')?.get('familyDiseaseList')?.value || [];
      const hasDiabetes = familyDiseaseList.some(
        (d: any) =>
          !d.deleted && d.diseaseType?.diseaseType === 'Diabetes Mellitus'
      );
      if (!hasDiabetes)
        required.push(
          currentLanguageSet.pleaseSelectDiabetesMellitusInFamilyHistory
        );

      if (
        historyForm.get('physicalActivityHistory')?.get('activityType')?.errors
      ) {
        required.push(currentLanguageSet.physicalActivity);
      }
    }

    // Vitals Checks
    if (vitalsForm) {
      if (vitalsForm.controls['height_cm']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      if (vitalsForm.controls['weight_Kg']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      if (vitalsForm.controls['waistCircumference_cm']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsCancerscreening_QC
            .waistCircumference
        );
      if (ncdTemperature && vitalsForm.controls['temperature']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.temperature
        );
      if (vitalsForm.controls['pulseRate']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.pulseRate
        );
      if (vitalsForm.controls['systolicBP_1stReading']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.systolicBP
        );
      if (vitalsForm.controls['diastolicBP_1stReading']?.errors)
        required.push(
          currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.diastolicBP
        );
    }

    if (attendantType === 'doctor') {
      const caseRecordForm = medicalForm.get(
        'patientCaseRecordForm'
      ) as FormGroup;
      const diagForm = caseRecordForm?.get('generalDiagnosisForm') as FormGroup;

      if (
        enableProvisionalDiag &&
        diagForm
          ?.get('provisionalDiagnosisList')
          ?.get('0')
          ?.get('provisionalDiagnosis')?.errors
      ) {
        required.push(currentLanguageSet.DiagnosisDetails.provisionaldiagnosis);
      }

      if (visualAcuityPresent > 0 && visualAcuityMandatory > 0) {
        const labTests =
          caseRecordForm?.get('generalDoctorInvestigationForm')?.get('labTest')
            ?.value || [];
        const hasVisual = labTests.some(
          (t: any) =>
            t.procedureName?.toLowerCase() ===
            environment.visualAcuityTest.toLowerCase()
        );
        if (!hasVisual)
          required.push(
            currentLanguageSet.pleaseSelectVisualAcuityTestInInvestigation
          );
      }
    }

    if (required.length > 0) {
      this.confirmationService.notify(
        currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return false;
    }
    return true;
  }

  /**
   * Validate TM Visit Details Requirements
   */
  checkTMVisitDetailsRequiredData(
    medicalForm: FormGroup,
    currentLanguageSet: any
  ): boolean {
    const required: string[] = [];
    const tmVisitForm = medicalForm.get('patientVisitForm') as FormGroup;
    const tmcForm = tmVisitForm?.get('tmcConfirmationForm') as FormGroup;

    if (tmcForm?.get('refrredToAdditionalServiceList')?.errors) {
      required.push(currentLanguageSet.Referdetails.referredtoinstitute);
    }

    if (tmcForm?.value?.isTMCConfirmed === true) {
      tmcForm.patchValue({ refrredToAdditionalServiceList: null });
    }

    if (tmcForm?.get('tmcConfirmed')?.errors) {
      required.push(currentLanguageSet.tmcConfirmed);
    }

    if (required.length > 0) {
      this.confirmationService.notify(
        currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return false;
    }
    return true;
  }

  /**
   * Submit TM Patient Visit Form (Specialist)
   */
  submitTMPatientVisitForm(
    medicalForm: FormGroup,
    schedulerData: any
  ): Observable<any> {
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    return this.doctorService.postTMReferedNurseDetails(
      medicalForm,
      temp,
      schedulerData
    );
  }

  /**
   * Cleanup session data after successful doctor/specialist visit submission
   */
  removeBeneficiaryDataForDoctorVisit(): void {
    const keys = [
      'visitCode',
      'beneficiaryGender',
      'benFlowID',
      'visitCategory',
      'beneficiaryRegID',
      'visitID',
      'beneficiaryID',
      'doctorFlag',
      'nurseFlag',
      'pharmacist_flag',
      'caseSheetTMFlag',
    ];
    keys.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Handle navigation and cleanup after successful clinical data submission
   */
  handleSubmissionSuccess(res: any, isDoctor: boolean = false): void {
    if (res.statusCode === 200 || res.statusCode === 9999) {
      if (isDoctor) this.removeBeneficiaryDataForDoctorVisit();
      else this.removeBeneficiaryDataForNurseVisit();

      this.confirmationService.alert(
        res.data?.response ||
          res.data?.message ||
          'Clinical Data Submitted Successfully',
        'success'
      );
      this.router.navigate([
        isDoctor
          ? '/nurse-doctor/doctor-worklist'
          : '/nurse-doctor/nurse-worklist',
      ]);
    } else {
      this.confirmationService.alert(
        res.errorMessage || 'Error occurred during submission',
        'error'
      );
    }
  }

  /**
   * Warn the user if they are navigating away from a dirty form in the stepper
   */
  warnIfFormDirty(
    event: any,
    medicalForm: FormGroup,
    newLookupMode: boolean,
    currentLanguageSet: any,
    doctorService: any
  ): void {
    let dirty = false;
    let labelName = '';

    if (!newLookupMode) {
      const forms = {
        ANC: medicalForm.get('patientANCForm'),
        History: medicalForm.get('patientHistoryForm'),
        Vitals: medicalForm.get('patientVitalsForm'),
        Examination: medicalForm.get('patientExaminationForm'),
        Screening: medicalForm.get('idrsScreeningForm'),
        'Visit Details': medicalForm
          .get('patientVisitForm')
          ?.get('covidVaccineStatusForm'),
      };

      const label = event.previouslySelectedStep.label;
      const form = (forms as any)[label];

      if (form) {
        if (label === 'Visit Details') {
          labelName = currentLanguageSet.covidVaccinationStatus;
          if (
            doctorService.covidVaccineAgeGroup === '>=12 years' &&
            (form.dirty || doctorService.enableCovidVaccinationButton)
          ) {
            dirty = true;
          }
        } else if (label === 'Vitals') {
          labelName = label;
          if (form.dirty || doctorService.enableUpdateButtonInVitals)
            dirty = true;
        } else if (label === 'Screening') {
          labelName = label;
          if (doctorService.enableIDRSUpdate === false) dirty = true;
        } else {
          labelName = label;
          if (form.dirty) dirty = true;
        }
      }
    } else {
      const label = event.previouslySelectedStep.label;
      if (label === 'Visit Details') {
        labelName = currentLanguageSet.covidVaccinationStatus;
        const covidForm = medicalForm
          .get('patientVisitForm')
          ?.get('covidVaccineStatusForm');
        if (
          covidForm &&
          doctorService.covidVaccineAgeGroup === '>=12 years' &&
          (covidForm.dirty || doctorService.enableCovidVaccinationButton)
        ) {
          dirty = true;
        }
      }
    }

    if (dirty) {
      this.confirmationService.alert(
        `${currentLanguageSet.alerts.info.dontForget} ${labelName} ${currentLanguageSet.alerts.info.changes}`
      );
    }
  }
  /**
   * Submit Doctor General OPD Details
   */
  submitDoctorGeneralOPDDetails(
    medicalForm: FormGroup,
    schedulerData: any,
    doctorSignatureFlag: any
  ): Observable<any> {
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    return this.doctorService.postDoctorGeneralOPDDetails(
      medicalForm,
      temp,
      schedulerData,
      doctorSignatureFlag
    );
  }

  /**
   * Submit PNC Diagnosis Form (Doctor)
   */
  submitPNCDiagnosisForm(
    medicalForm: FormGroup,
    schedulerData: any,
    doctorSignatureFlag: any
  ): Observable<any> {
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    return this.doctorService.postDoctorPNCDetails(
      medicalForm,
      temp,
      schedulerData,
      doctorSignatureFlag
    );
  }

  /**
   * Submit ANC Diagnosis Form (Doctor)
   */
  submitANCDiagnosisForm(
    medicalForm: FormGroup,
    schedulerData: any,
    doctorSignatureFlag: any
  ): Observable<any> {
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    return this.doctorService.postDoctorANCDetails(
      medicalForm,
      temp,
      schedulerData,
      doctorSignatureFlag
    );
  }

  /**
   * Retrieve Lab and Prescription data from the form
   */
  getLabandPrescriptionData(medicalForm: FormGroup): any[] {
    const patientCaseRecordForm = medicalForm.get(
      'patientCaseRecordForm'
    ) as FormGroup;
    if (!patientCaseRecordForm) return [];

    const prescribedDrugs =
      (
        patientCaseRecordForm.get(
          'drugPrescriptionForm.prescribedDrugs'
        ) as FormArray
      )?.value || [];
    return prescribedDrugs.filter((item: any) => !!item.createdBy);
  }
}
