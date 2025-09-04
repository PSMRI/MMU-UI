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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class DoctorService {
  fileIDs: any; // To store fileIDs
  gynecologicalFiles: any; // To store gynecological examination files
  enableCovidVaccinationButton = false;
  prescribedDrugData: any;
  covidVaccineAgeGroup: any;

  constructor(
    private http: HttpClient,
    readonly sessionstorage: SessionStorageService
  ) {}

  getDoctorWorklist() {
    console.log(
      'getDoctorWorklistUrl',
      this.sessionstorage.getItem('providerServiceID')
    );
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const fetchUrl =
      this.sessionstorage.getItem('providerServiceID') +
      `/${this.sessionstorage.getItem('serviceID')}/${vanID}`;
    return this.http.get(environment.doctorWorkList + fetchUrl);
  }

  getServiceOnState() {
    return this.http.post(environment.getServiceOnStateUrl, {});
  }

  updateBeneficiaryArrivalStatus(arrivalStatusDetails: any) {
    return this.http.post(
      environment.updateBeneficiaryArrivalStatusUrl,
      arrivalStatusDetails
    );
  }

  cancelBeneficiaryTCRequest(tcRequest: any) {
    return this.http.post(environment.cancelBeneficiaryTCRequestUrl, tcRequest);
  }

  getSpecialistWorklist() {
    return this.http.get(
      environment.specialistWorkListURL +
        this.sessionstorage.getItem('providerServiceID') +
        `/${this.sessionstorage.getItem(
          'serviceID'
        )}/${this.sessionstorage.getItem('userID')}`
    );
  }

  getDoctorFutureWorklist() {
    return this.http.get(
      environment.doctorFutureWorkList +
        this.sessionstorage.getItem('providerServiceID') +
        `/${this.sessionstorage.getItem('serviceID')}`
    );
  }

  getSpecialistFutureWorklist() {
    return this.http.get(
      environment.specialistFutureWorkListURL +
        this.sessionstorage.getItem('providerServiceID') +
        `/${this.sessionstorage.getItem(
          'serviceID'
        )}/${this.sessionstorage.getItem('userID')}`
    );
  }

  getRadiologistWorklist() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const fetchUrl =
      this.sessionstorage.getItem('providerServiceID') +
      `/${this.sessionstorage.getItem('serviceID')}/${vanID}`;
    return this.http.get(environment.radiologistWorklist + fetchUrl);
  }

  getOncologistWorklist() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const fetchUrl =
      this.sessionstorage.getItem('providerServiceID') +
      `/${this.sessionstorage.getItem('serviceID')}/${vanID}`;
    return this.http.get(environment.oncologistWorklist + fetchUrl);
  }

  confirmStatus(benVisitID: any) {
    return this.http.post(environment.updateVisitStatus, {
      benVisitID: benVisitID,
    });
  }

  getMMUHistory() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    return this.http.post(environment.previousMMUHistoryUrl, {
      beneficiaryRegID: benRegID,
    });
  }

  getTMHistory() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    return this.http.post(environment.previousTMHistoryUrl, {
      beneficiaryRegID: benRegID,
    });
  }

  getMCTSHistory() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    return this.http.post(environment.previousMCTSHistoryUrl, {
      beneficiaryRegID: benRegID,
    });
  }

  get104History() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    return this.http.post(environment.previous104HistoryUrl, {
      beneficiaryRegID: benRegID,
    });
  }

  /**
   ****************************CANCER SCREENING***********************************
   */

  postDoctorCancerVisitDetails(cancerForm: any, tcRequest: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

    const otherDetails = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    const referDetails = cancerForm.controls.patientCaseRecordForm.value;
    const diagnosisDetails = cancerForm.controls.patientReferForm.value;
    const diagnosis = Object.assign(
      {},
      diagnosisDetails,
      referDetails,
      otherDetails
    );
    const cancerRequest = Object.assign({
      tcRequest: tcRequest,
      diagnosis: diagnosis,
    });
    console.log(
      'Doctor Cancer visit Details',
      JSON.stringify(cancerRequest, null, 4)
    );
    return this.http.post(
      environment.saveDoctorCancerScreeningDetails,
      cancerRequest
    );
  }

  getVisitDetails(beneficiaryID: string, visitID: string) {
    return this.http.post(environment.getCancerScreeningVisitDetails, {
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  getCancerHistoryDetails(beneficiaryID: string, visitID: string) {
    return this.http.post(environment.getCancerScreeningHistoryDetails, {
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  getCancerVitalsDetails(beneficiaryID: string, visitID: string) {
    console.log(beneficiaryID, visitID, 'null something');
    return this.http.post(environment.getCancerScreeningVitalsDetails, {
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  getCancerExaminationDetails(beneficiaryID: string, visitID: string) {
    return this.http.post(environment.getCancerScreeningExaminationDetails, {
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  updateCancerExaminationDetails(
    cancerExaminationForm: any,
    otherDetails: any,
    imageCoordinates: any
  ): Observable<any> {
    let examinationDetails;

    if (cancerExaminationForm.controls.signsForm.dirty) {
      const signsForm = cancerExaminationForm.controls.signsForm as FormGroup;
      // let lymphsArray = (<FormArray>signsForm.controls.lymphNodes).controls.filter(item => {
      //   return item.dirty;
      // })

      const lymphsArray = (<FormArray>signsForm.controls['lymphNodes'])
        .controls;
      const lymphs = lymphsArray.map(item =>
        Object.assign({}, item.value, otherDetails, {
          createdBy: this.sessionstorage.getItem('userName'),
        })
      );

      const cancerSignAndSymptoms = Object.assign(
        {},
        signsForm.value,
        { lymphNodes: undefined },
        otherDetails
      );
      const signsDetails = Object.assign(
        {},
        {
          cancerSignAndSymptoms: cancerSignAndSymptoms,
          cancerLymphNodeDetails: lymphs,
        }
      );
      examinationDetails = Object.assign({}, examinationDetails, {
        signsDetails,
      });
    }

    if (cancerExaminationForm.controls.oralExaminationForm.dirty) {
      const oralExaminationDetails =
        cancerExaminationForm.controls.oralExaminationForm.value;
      if (oralExaminationDetails.preMalignantLesionTypeList !== null) {
        const index =
          oralExaminationDetails.preMalignantLesionTypeList.indexOf(
            'Any other lesion'
          );
        if (
          index > -1 &&
          index === oralExaminationDetails.preMalignantLesionTypeList.length - 1
        ) {
          oralExaminationDetails.preMalignantLesionTypeList.pop();
          oralExaminationDetails.preMalignantLesionTypeList.push(
            oralExaminationDetails.otherLesionType
          );
        }
      }
      const oralDetails = Object.assign(
        {},
        oralExaminationDetails,
        { otherLesionType: undefined },
        { image: undefined },
        otherDetails
      );
      examinationDetails = Object.assign({}, examinationDetails, {
        oralDetails,
      });
    }

    if (cancerExaminationForm.controls.breastExaminationForm.dirty) {
      const breastExaminationDetails =
        cancerExaminationForm.controls.breastExaminationForm.value;
      const breastDetails = Object.assign(
        {},
        breastExaminationDetails,
        otherDetails,
        { image: undefined }
      );
      examinationDetails = Object.assign({}, examinationDetails, {
        breastDetails,
      });
    }

    if (cancerExaminationForm.controls.abdominalExaminationForm.dirty) {
      const abdominalExaminationDetails =
        cancerExaminationForm.controls.abdominalExaminationForm.value;
      const abdominalDetails = Object.assign(
        {},
        abdominalExaminationDetails,
        otherDetails,
        { image: undefined }
      );
      examinationDetails = Object.assign({}, examinationDetails, {
        abdominalDetails,
      });
    }

    if (cancerExaminationForm.controls.gynecologicalExaminationForm.dirty) {
      const gynecologicalExaminationDetails =
        cancerExaminationForm.controls.gynecologicalExaminationForm.value;
      const gynecologicalDetails = Object.assign(
        {},
        gynecologicalExaminationDetails,
        otherDetails,
        { image: undefined }
      );
      examinationDetails = Object.assign({}, examinationDetails, {
        gynecologicalDetails,
      });
    }

    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    if (imageCoordinates.length > 0)
      examinationDetails = Object.assign(
        {},
        examinationDetails,
        { imageCoordinates },
        {
          beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
          sessionID: this.sessionstorage.getItem('sessionID'),
          parkingPlaceID: parkingPlaceID,
          vanID: vanID,
          benFlowID: this.sessionstorage.getItem('benFlowID'),
          visitCode: this.sessionstorage.getItem('visitCode'),
        }
      );

    console.log(
      'Update Examination details',
      JSON.stringify(examinationDetails, null, 4)
    );

    return this.http.post(
      environment.updateCancerScreeningExamination,
      examinationDetails
    );
  }

  updateCancerVitalsDetails(
    cancerVitals: any,
    disabledFormcontrolValue: any
  ): Observable<any> {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const updateDetails = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    const patientVitalsDetails = Object.assign(
      {},
      cancerVitals,
      disabledFormcontrolValue,
      updateDetails
    );
    return this.http.post(
      environment.updateCancerScreeningVitals,
      patientVitalsDetails
    );
  }

  updateCancerHistoryDetails(patientHistoryForm: any, otherDetails: any) {
    const temp = {
      familyHistory: this.cancerFamilyHistoryForm(
        patientHistoryForm.controls.cancerPatientFamilyMedicalHistoryForm,
        otherDetails
      ),
      personalHistory: this.cancerPersonalHistoryForm(
        patientHistoryForm.controls.cancerPatientPerosnalHistoryForm,
        otherDetails
      ),
      pastObstetricHistory: this.cancerObstetricHistoryForm(
        patientHistoryForm.controls.cancerPatientObstetricHistoryForm,
        otherDetails
      ),
    };
    console.log('Updated Cancer History', JSON.stringify(temp, null, 4));
    return this.http.post(environment.updateCancerScreeningHistory, temp);
  }

  cancerFamilyHistoryForm(familyHistoryForm: any, otherDetails: any) {
    let familyHistoryDetails;

    if (familyHistoryForm.dirty && familyHistoryForm.value.diseases !== null) {
      const diseases = JSON.parse(
        JSON.stringify(familyHistoryForm.value.diseases)
      );
      for (let i = 0; i < diseases.length; i++) {
        diseases[i].cancerDiseaseType =
          diseases[i].cancerDiseaseType.cancerDiseaseType;

        if (diseases[i].cancerDiseaseType === 'Any other Cancer')
          diseases[i].cancerDiseaseType = diseases[i].otherDiseaseType;

        diseases[i] = Object.assign({}, diseases[i], otherDetails);
      }
      familyHistoryDetails = diseases;
    }
    return familyHistoryDetails;
  }

  cancerObstetricHistoryForm(obstetricHistoryForm: any, otherDetails: any) {
    let obstetricHistoryDetails;
    if (obstetricHistoryForm.dirty) {
      obstetricHistoryDetails = Object.assign(
        {},
        obstetricHistoryForm.value,
        otherDetails
      );
    }
    return obstetricHistoryDetails;
  }

  cancerPersonalHistoryForm(
    patientPerosnalHistoryForm: any,
    otherDetails: any
  ) {
    let personalDetails;
    if (patientPerosnalHistoryForm.dirty) {
      personalDetails = Object.assign(
        {},
        patientPerosnalHistoryForm.value,
        otherDetails
      );
    }
    return personalDetails;
  }

  /**
   **************************END of CANCER SCREENING**************************
   */

  /**
   **************************GENERAL OPD QUICK CONSULT**************************
   */

  postQuickConsultDetails(consultationData: any, tcRequest: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      tcRequest: tcRequest,
    };
    const quickConsultation = Object.assign(
      {},
      consultationData.quickConsultation,
      temp
    );

    console.log('qc', JSON.stringify(quickConsultation, null, 4));
    return this.http.post(environment.saveDoctorGeneralQuickConsult, {
      quickConsultation,
    });
    // return Observable.of({statusCode: 5000, data:{ response: 'furrrr'} , errorMessage: 'furrrr'});
  }

  updateQuickConsultDetails(
    consultationData: any,
    tcRequest: any,
    isSpecialist: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      tcRequest: tcRequest,
      isSpecialist: isSpecialist,
    };
    const quickConsultation = Object.assign(
      {},
      consultationData.quickConsultation,
      temp
    );

    console.log(
      'updated quick consultation',
      JSON.stringify(quickConsultation, null, 4)
    );
    return this.http.post(
      environment.updateGeneralOPDQuickConsultDoctorDetails,
      { quickConsultation }
    );
  }

  /**
   **************************END OF GENERAL OPD QUICK CONSULT**************************
   */

  /**
   **************************NCD SCREENING**************************
   */

  getNcdScreeningDetails(beneficiaryID: any, benVisitID: any) {
    return this.http.post(environment.getNCDScreeningDetails, {
      benRegID: beneficiaryID,
      benVisitID: benVisitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  updateNCDScreeningDetails(
    ncdScreeningFormValue: any,
    patientVisitFormValue: any
  ) {
    const serviceDetails = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };
    const postNCDScreeningFormValue = JSON.parse(
      JSON.stringify(ncdScreeningFormValue)
    );

    if (postNCDScreeningFormValue.reasonForScreening) {
      postNCDScreeningFormValue.ncdScreeningReasonID =
        postNCDScreeningFormValue.reasonForScreening.ncdScreeningReasonID;
      postNCDScreeningFormValue.reasonForScreening =
        postNCDScreeningFormValue.reasonForScreening.ncdScreeningReason;
    }

    if (postNCDScreeningFormValue.diabeticStatus) {
      postNCDScreeningFormValue.diabeticStatusID =
        postNCDScreeningFormValue.diabeticStatus.bpAndDiabeticStatusID;
      postNCDScreeningFormValue.diabeticStatus =
        postNCDScreeningFormValue.diabeticStatus.bpAndDiabeticStatus;
    }

    if (postNCDScreeningFormValue.bloodPressureStatus) {
      postNCDScreeningFormValue.bloodPressureStatusID =
        postNCDScreeningFormValue.bloodPressureStatus.bpAndDiabeticStatusID;
      postNCDScreeningFormValue.bloodPressureStatus =
        postNCDScreeningFormValue.bloodPressureStatus.bpAndDiabeticStatus;
    }

    if (postNCDScreeningFormValue.labTestOrders) {
      // procedureName
      let bP = false;
      let bG = false;

      postNCDScreeningFormValue.labTestOrders.filter((item: any) => {
        if (item.procedureName === 'BP Measurement') {
          bP = true;
        }
        if (item.procedureName === 'Blood Glucose Measurement') {
          bG = true;
        }
      });
      postNCDScreeningFormValue.isBloodGlucosePrescribed = bG;
      postNCDScreeningFormValue.isBPPrescribed = bP;
    }

    const ncdScreeningDetails = Object.assign(
      {},
      postNCDScreeningFormValue,
      serviceDetails,
      { benFlowID: this.sessionstorage.getItem('benFlowID') },
      patientVisitFormValue.patientFileUploadDetailsForm
    );
    console.log(
      'Update NCD Screening Data',
      JSON.stringify(ncdScreeningDetails, null, 4)
    );

    return this.http.post(
      environment.updateNCDScreeningDetails,
      ncdScreeningDetails
    );
  }

  /**
   **************************END OF NCD SCREENING**************************
   */

  /**
   **************************ANC**************************
   */

  postDoctorANCDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const ancVisitDetails = {
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postANCCaseRecordDiagnosis(diagnosisForm, otherDetails),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };

    console.log(
      'ANC Doctor Visit Details',
      JSON.stringify(ancVisitDetails, null, 4)
    );

    // return Observable.of(null);
    return this.http.post(environment.saveDoctorANCDetails, ancVisitDetails);
  }

  updateANCDetails(patientANCForm: any, temp: any) {
    const updatedANCDetails = {
      ancObstetricDetails: this.updateANCDetailsandObstetricFormula(
        patientANCForm,
        temp
      ),
      ancImmunization: this.updateANCImmunization(
        patientANCForm.controls.patientANCImmunizationForm,
        temp
      ),
    };
    return this.http.post(
      environment.updateANCDetailsUrl,
      Object.assign({}, updatedANCDetails, temp)
    );
  }

  updateANCDetailsandObstetricFormula(patientANCForm: any, temp: any) {
    const detailedANC = JSON.parse(
      JSON.stringify(patientANCForm.controls.patientANCDetailsForm.value)
    );
    const obstetricFormula = JSON.parse(
      JSON.stringify(patientANCForm.controls.obstetricFormulaForm.value)
    );

    if (detailedANC.lmpDate) {
      const lmpDate = new Date(detailedANC.lmpDate);
      const adjustedDate = new Date(
        lmpDate.getTime() - lmpDate.getTimezoneOffset() * 60000
      );
      detailedANC.lmpDate = adjustedDate.toISOString();
    }

    const combinedANCForm = Object.assign(
      {},
      detailedANC,
      {
        gravida_G: obstetricFormula.gravida_G,
        termDeliveries_T: obstetricFormula.termDeliveries_T,
        pretermDeliveries_P: obstetricFormula.pretermDeliveries_P,
        abortions_A: obstetricFormula.abortions_A,
        stillBirth: obstetricFormula.stillBirth,
        livebirths_L: obstetricFormula.livebirths_L,
        bloodGroup: obstetricFormula.bloodGroup,
      },
      temp
    );

    return combinedANCForm;
  }

  updateANCImmunization(immunizationForm: any, temp: any) {
    const immunizationData = Object.assign({}, immunizationForm.value, temp);
    return immunizationData;
  }

  getAncCareDetails(beneficiaryID: string, visitID: string) {
    return this.http.post(environment.getANCDetailsUrl, {
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  /**
   **************************END OF ANC**************************
   */

  /**
   **************************General OPD**************************
   */

  postDoctorGeneralOPDDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const generalVisitDetails = {
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postGeneralOPDCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      ),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };

    console.log(
      'Doctor Visit Details',
      JSON.stringify(generalVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveDoctorGeneralOPDDetails,
      generalVisitDetails
    );
  }

  /**
   **************************END OF GENERAL OPD**************************
   */

  /**
   **************************NCD Care**************************
   */

  postDoctorNCDCareDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const ncdCareVisitDetails = {
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postNCDCareCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      ),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };

    console.log(
      'Doctor NCD CARE Visit Details',
      JSON.stringify(ncdCareVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveDoctorNCDCareDetails,
      ncdCareVisitDetails
    );
  }

  /**
   **************************END OF NCD CARE**************************
   */

  postDoctorCovidCareDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const covidCareVisitDetails = {
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postCovidCareCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      ),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };

    console.log(
      'Doctor Covid CARE Visit Details',
      JSON.stringify(covidCareVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveDoctorCovidCareDetails,
      covidCareVisitDetails
    );
  }
  postDoctorNCDScreeningDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const NCDScreeningDetails = {
      visitDetails: this.postGenericVisitDetailForm(
        patientMedicalForm.controls.patientVisitForm,
        null,
        visitCategory
      ),
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postNCDscreeningCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      ),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };

    console.log(
      'Doctor Covid CARE Visit Details',
      JSON.stringify(NCDScreeningDetails, null, 4)
    );

    return this.http.post(
      environment.saveDoctorNCDScreeningDetails,
      NCDScreeningDetails
    );
  }

  /**
   **************************END OF Covid CARE**************************
   */

  /**
   **************************COMMON TO ANC, GENRAL OPD, NCD CARE, PNC**************************
   */

  getVisitComplaint: any;
  getVisitComplaintDetails(beneficiaryID: string, visitID: string) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const otherDetails = Object.assign({
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });

    if (!this.getVisitComplaint) {
      if (visitCategory === 'Cancer Screening') {
        this.getVisitComplaint = this.http.post(
          environment.getCancerScreeningVisitDetails,
          otherDetails
        );
      }
      if (visitCategory === 'General OPD (QC)') {
        this.getVisitComplaint = this.http.post(
          environment.getGeneralOPDQuickConsultVisitDetails,
          otherDetails
        );
      }
      if (visitCategory === 'ANC') {
        this.getVisitComplaint = this.http.post(
          environment.getANCVisitDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'General OPD') {
        this.getVisitComplaint = this.http.post(
          environment.getGeneralOPDVisitDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'NCD screening') {
        this.getVisitComplaint = this.http.post(
          environment.getNCDScreeningVisitDetails,
          otherDetails
        );
      }
      if (visitCategory === 'NCD care') {
        this.getVisitComplaint = this.http.post(
          environment.getNCDCareVisitDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'PNC') {
        return this.http.post(environment.getPNCVisitDetailsUrl, otherDetails);
      }
      if (visitCategory === 'COVID-19 Screening') {
        return this.http.post(
          environment.getCovidCareVisitDetailsUrl,
          otherDetails
        );
      }
    }
    return this.getVisitComplaint;
  }

  getPregVisitComplaint: any;
  getPregVisitComplaintDetails(
    beneficiaryID: string,
    visitID: string,
    visitCategory: string
  ) {
    // let visitCategory = "NCD screening";
    const otherDetails = Object.assign({
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });

    // if (!this.getPregVisitComplaint) {

    // if (visitCategory === 'NCD screening') {
    this.getPregVisitComplaint = this.http.post(
      environment.getNCDScreeningVisitDetails,
      otherDetails
    );
    //
    // }

    // }
    return this.getPregVisitComplaint;
  }

  generalHistory: any;
  getGeneralHistoryDetails(benRegID: any, visitID: any) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const otherDetails = Object.assign({
      benRegID: benRegID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
    if (!this.generalHistory) {
      if (visitCategory === 'ANC') {
        this.generalHistory = this.http.post(
          environment.getANCHistoryDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'General OPD') {
        this.generalHistory = this.http.post(
          environment.getGeneralOPDHistoryDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'NCD care') {
        this.generalHistory = this.http.post(
          environment.getNCDCareHistoryDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'PNC') {
        this.generalHistory = this.http.post(
          environment.getPNCHistoryDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'COVID-19 Screening') {
        this.generalHistory = this.http.post(
          environment.getCovidCareHistoryDetailsUrl,
          otherDetails
        );
      }
      if (visitCategory === 'NCD screening') {
        this.generalHistory = this.http.post(
          environment.getNCDScreeningHistoryDetails,
          otherDetails
        );
      }
    }
    return this.generalHistory;
  }

  getPreviousVisitAnthropometry(benRegId: any) {
    return this.http.post(environment.getPreviousAnthropometryUrl, benRegId);
  }

  getGenericVitals(beneficiary: any): Observable<any> {
    const otherDetails = Object.assign({}, beneficiary, {
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    if (visitCategory === 'General OPD (QC)') {
      return this.http.post(
        environment.getGeneralOPDQuickConsultVitalDetails,
        otherDetails
      );
    }
    if (visitCategory === 'ANC') {
      return this.http.post(environment.getANCVitalsDetailsUrl, otherDetails);
    }
    if (visitCategory === 'General OPD') {
      return this.http.post(
        environment.getGeneralOPDVitalDetailsUrl,
        otherDetails
      );
    }

    if (visitCategory === 'NCD care') {
      return this.http.post(
        environment.getNCDCareVitalDetailsUrl,
        otherDetails
      );
    }
    if (visitCategory === 'PNC') {
      return this.http.post(environment.getPNCVitalsDetailsUrl, otherDetails);
    }
    if (visitCategory === 'COVID-19 Screening') {
      return this.http.post(
        environment.getCovidCareVitalDetailsUrl,
        otherDetails
      );
    }
    if (visitCategory === 'NCD screening') {
      return this.http.post(
        environment.getNCDSceeriningVitalDetails,
        otherDetails
      );
    }
    // Return an observable that emits no value and completes
    return new Observable(observer => {
      observer.complete();
    });
  }

  getGeneralExamintionData(
    beneficiaryID: string,
    visitID: string
  ): Observable<any> {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const otherDetails = Object.assign({
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });

    if (visitCategory === 'ANC') {
      return this.http.post(environment.getANCExaminationDataUrl, otherDetails);
    }
    if (visitCategory === 'General OPD') {
      return this.http.post(
        environment.getGeneralOPDExaminationDetailsUrl,
        otherDetails
      );
    }
    if (visitCategory === 'PNC') {
      return this.http.post(environment.getPNCExaminationDataUrl, otherDetails);
    }
    return new Observable(observer => {
      observer.complete();
    });
  }

  updateGeneralHistory(
    generalHistoryForm: any,
    temp: any,
    beneficiaryAge: any
  ): Observable<any> {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const updatedHistoryDetails = {
      pastHistory: this.updateGeneralPastHistory(
        generalHistoryForm.controls.pastHistory,
        temp
      ),
      comorbidConditions: this.updateGeneralComorbidityHistory(
        generalHistoryForm.controls.comorbidityHistory,
        temp
      ),
      medicationHistory: this.updateGeneralMedicationHistory(
        generalHistoryForm.controls.medicationHistory,
        temp
      ),
      femaleObstetricHistory: this.updateGeneralPastObstetricHistory(
        generalHistoryForm.controls.pastObstericHistory,
        temp
      ),
      menstrualHistory: this.updateGeneralMenstrualHistory(
        generalHistoryForm.controls.menstrualHistory,
        temp
      ),
      familyHistory: this.updateGeneralFamilyHistory(
        generalHistoryForm.controls.familyHistory,
        temp
      ),
      personalHistory: this.updateGeneralPersonalHistory(
        generalHistoryForm.controls.personalHistory,
        temp
      ),
      childVaccineDetails: this.updateGeneralOtherVaccines(
        generalHistoryForm.controls.otherVaccines,
        temp
      ),
      immunizationHistory: this.updateGeneralImmunizationHistory(
        generalHistoryForm.controls.immunizationHistory,
        temp
      ),
      developmentHistory: this.updateGeneralDevelopmentHistory(
        generalHistoryForm.controls.developmentHistory,
        temp
      ),
      feedingHistory: this.updateGeneralFeedingHistory(
        generalHistoryForm.controls.feedingHistory,
        temp
      ),
      perinatalHistroy: this.updateGeneralPerinatalHistory(
        generalHistoryForm.controls.perinatalHistory,
        temp
      ),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
    };

    console.log(
      'Update General History',
      JSON.stringify(updatedHistoryDetails, null, 4)
    );

    if (visitCategory === 'ANC') {
      delete updatedHistoryDetails.feedingHistory;
      delete updatedHistoryDetails.developmentHistory;
      delete updatedHistoryDetails.perinatalHistroy;

      return this.http.post(
        environment.updateANCHistoryDetailsUrl,
        updatedHistoryDetails
      );
    }

    if (visitCategory === 'General OPD') {
      return this.http.post(
        environment.updateGeneralOPDHistoryDetailsUrl,
        updatedHistoryDetails
      );
    }

    if (visitCategory === 'NCD care') {
      return this.http.post(
        environment.updateNCDCareHistoryDetailsUrl,
        updatedHistoryDetails
      );
    }

    if (visitCategory === 'PNC') {
      delete updatedHistoryDetails.feedingHistory;
      delete updatedHistoryDetails.developmentHistory;
      delete updatedHistoryDetails.perinatalHistroy;

      return this.http.post(
        environment.updatePNCHistoryDetailsUrl,
        updatedHistoryDetails
      );
    }

    if (visitCategory === 'COVID-19 Screening') {
      return this.http.post(
        environment.updateCovidCareHistoryDetailsUrl,
        updatedHistoryDetails
      );
    }

    return new Observable(observer => {
      observer.complete();
    });
  }

  updateGeneralDevelopmentHistory(
    developmentHistoryForm: any,
    otherDetails: any
  ) {
    const developmentHistoryFormValue = JSON.parse(
      JSON.stringify(developmentHistoryForm.value)
    );
    const developmentData = Object.assign(
      {},
      developmentHistoryFormValue,
      otherDetails
    );
    return developmentData;
  }

  updateGeneralFeedingHistory(feedingHistoryForm: any, otherDetails: any) {
    const feedingHistoryFormValue = JSON.parse(
      JSON.stringify(feedingHistoryForm.value)
    );
    const feedingHistoryData = Object.assign(
      {},
      feedingHistoryFormValue,
      otherDetails,
      {
        foodIntoleranceStatus: !feedingHistoryFormValue.foodIntoleranceStatus
          ? feedingHistoryFormValue.foodIntoleranceStatus
          : +feedingHistoryFormValue.foodIntoleranceStatus,
      }
    );
    return feedingHistoryData;
  }

  updateGeneralPerinatalHistory(perinatalHistroyForm: any, otherDetails: any) {
    const temp = JSON.parse(JSON.stringify(perinatalHistroyForm.value));
    if (temp.placeOfDelivery) {
      temp.deliveryPlaceID = temp.placeOfDelivery.deliveryPlaceID;
      temp.placeOfDelivery = temp.placeOfDelivery.deliveryPlace;
    }

    if (temp.typeOfDelivery) {
      temp.deliveryTypeID = temp.typeOfDelivery.deliveryTypeID;
      temp.typeOfDelivery = temp.typeOfDelivery.deliveryType;
    }

    if (temp.complicationAtBirth) {
      temp.complicationAtBirthID = temp.complicationAtBirth.birthComplicationID;
      temp.complicationAtBirth = temp.complicationAtBirth.name;
    }
    const perinatalHistoryData = Object.assign({}, temp, otherDetails);
    return perinatalHistoryData;
  }

  updateGeneralPastHistory(pastHistory: any, otherDetails: any) {
    const pastHistoryForm = JSON.parse(JSON.stringify(pastHistory.value));
    const illness = pastHistoryForm.pastIllness.slice();
    illness.map((item: any) => {
      const temp = item.illnessType;
      if (temp) {
        item.illnessType = temp.illnessType;
        item.illnessTypeID = '' + temp.illnessID;
        item.timePeriodAgo = item.timePeriodAgo
          ? '' + item.timePeriodAgo
          : null;
      }
    });

    const surgery = pastHistoryForm.pastSurgery.slice();
    surgery.map((item: any) => {
      const temp = item.surgeryType;
      if (temp) {
        item.surgeryType = temp.surgeryType;
        item.surgeryID = '' + temp.surgeryID;
        item.timePeriodAgo = item.timePeriodAgo
          ? '' + item.timePeriodAgo
          : null;
      }
    });

    const historyData = Object.assign({}, pastHistoryForm.value, otherDetails, {
      pastIllness: illness,
      pastSurgery: surgery,
    });
    return historyData;
  }

  updateGeneralComorbidityHistory(
    comorbidityHistoryForm: any,
    otherDetails: any
  ) {
    const comorbidityHistoryFormData = JSON.parse(
      JSON.stringify(comorbidityHistoryForm.value)
    );
    const comorbidityConcurrentConditions = Object.assign(
      [],
      comorbidityHistoryFormData.comorbidityConcurrentConditionsList
    );
    comorbidityConcurrentConditions.map((item: any, i: any) => {
      const temp = Object.assign({}, item.comorbidConditions);
      if (temp) {
        item.comorbidConditions = undefined;
        item.comorbidCondition = temp.comorbidCondition;
        if (temp.comorbidConditionID)
          item.comorbidConditionID = '' + temp.comorbidConditionID;
        // item.isForHistory = !item.isForHistory;
      }
    });
    const comorbidityData = Object.assign(
      {},
      comorbidityHistoryFormData,
      otherDetails
    );
    return comorbidityData;
  }

  updateGeneralMedicationHistory(medicationHistory: any, temp: any) {
    const formValue = JSON.parse(JSON.stringify(medicationHistory.value));
    const apiObject = Object.assign({}, formValue, temp);
    return apiObject;
  }

  updateGeneralPersonalHistory(personalHistoryForm: any, temp: any) {
    const personalHistoryFormValue = JSON.parse(
      JSON.stringify(personalHistoryForm.value)
    );
    const tobaccoList = personalHistoryFormValue.tobaccoList;
    if (tobaccoList) {
      tobaccoList.map((item: any) => {
        if (item.tobaccoUseType) {
          item.tobaccoUseTypeID = item.tobaccoUseType.personalHabitTypeID;
          item.tobaccoUseType = item.tobaccoUseType.habitValue;
        }
      });
    }

    const alcoholList = personalHistoryFormValue.alcoholList;
    if (alcoholList) {
      alcoholList.map((item: any) => {
        if (item.typeOfAlcohol) {
          item.alcoholTypeID = item.typeOfAlcohol.personalHabitTypeID;
          item.typeOfAlcohol = item.typeOfAlcohol.habitValue;
        }
        if (item.avgAlcoholConsumption)
          item.avgAlcoholConsumption = item.avgAlcoholConsumption.habitValue;
      });
    }

    const allergyList = personalHistoryFormValue.allergicList;
    if (allergyList) {
      allergyList.map((item: any) => {
        if (item.allergyType) item.allergyType = item.allergyType.allergyType;
        if (item.typeOfAllergicReactions) {
          item.typeOfAllergicReactions.map((value: any) => {
            value.allergicReactionTypeID = '' + value.allergicReactionTypeID;
          });
        }
      });
    }

    const personalHistoryData = Object.assign(
      {},
      personalHistoryFormValue,
      temp,
      {
        riskySexualPracticesStatus:
          personalHistoryFormValue.riskySexualPracticesStatus !== undefined
            ? +personalHistoryFormValue.riskySexualPracticesStatus
            : null,
        tobaccoList: tobaccoList,
        alcoholList: alcoholList,
        allergicList: allergyList,
      }
    );
    return personalHistoryData;
  }

  updateGeneralFamilyHistory(familyHistoryForm: any, temp: any) {
    const familyHistoryFormValue = JSON.parse(
      JSON.stringify(familyHistoryForm.value)
    );
    const familyDiseaseList = familyHistoryFormValue.familyDiseaseList;

    familyDiseaseList.map((item: any) => {
      if (item.diseaseType) {
        item.diseaseTypeID = '' + item.diseaseType.diseaseTypeID;
        item.diseaseType = item.diseaseType.diseaseType;
      }
    });
    const familyHistoryData = Object.assign({}, familyHistoryFormValue, temp);
    return familyHistoryData;
  }

  updateGeneralMenstrualHistory(menstrualHistory: any, otherDetails: any) {
    const temp = JSON.parse(JSON.stringify(menstrualHistory.getRawValue()));
    if (temp.menstrualCycleStatus) {
      temp.menstrualCycleStatusID =
        '' + temp.menstrualCycleStatus.menstrualCycleStatusID;
      temp.menstrualCycleStatus = temp.menstrualCycleStatus.name;
    }

    if (temp.cycleLength) {
      temp.menstrualCyclelengthID = '' + temp.cycleLength.menstrualRangeID;
      temp.cycleLength = temp.cycleLength.menstrualCycleRange;
    }

    if (temp.bloodFlowDuration) {
      temp.menstrualFlowDurationID =
        '' + temp.bloodFlowDuration.menstrualRangeID;
      temp.bloodFlowDuration = temp.bloodFlowDuration.menstrualCycleRange;
    }

    if (
      temp.lMPDate === null ||
      temp.lMPDate === undefined ||
      temp.lMPDate === 'Invalid Date'
    ) {
      delete temp['lMPDate'];
    } else {
      const lmpDate = new Date(temp.lMPDate);
      const adjustedDate = new Date(
        lmpDate.getTime() - lmpDate.getTimezoneOffset() * 60000
      );
      temp.lMPDate = adjustedDate.toISOString();
    }

    const menstrualHistoryData = Object.assign({}, temp, otherDetails);
    return menstrualHistoryData;
  }

  updateGeneralPastObstetricHistory(pastObstetricHistoryForm: any, temp: any) {
    const pastObstetricHistoryFormValue = JSON.parse(
      JSON.stringify(pastObstetricHistoryForm.value)
    );
    const pastObstetricList =
      pastObstetricHistoryFormValue.pastObstericHistoryList;

    pastObstetricList.map((item: any) => {
      if (item.durationType) {
        item.pregDurationID = item.durationType.pregDurationID;
        item.durationType = item.durationType.durationType;
      }
      if (item.deliveryType) {
        item.deliveryTypeID = item.deliveryType.deliveryTypeID;
        item.deliveryType = item.deliveryType.deliveryType;
      }
      if (item.deliveryPlace) {
        item.deliveryPlaceID = item.deliveryPlace.deliveryPlaceID;
        item.deliveryPlace = item.deliveryPlace.deliveryPlace;
      }
      if (item.pregOutcome) {
        item.pregOutcomeID = item.pregOutcome.pregOutcomeID;
        item.pregOutcome = item.pregOutcome.pregOutcome;
      }
      if (item.newBornComplication) {
        item.newBornComplicationID = item.newBornComplication.complicationID;
        item.newBornComplication = item.newBornComplication.complicationValue;
      }
    });
    const pastObstetricHistoryData = Object.assign(
      {},
      pastObstetricHistoryFormValue,
      temp,
      {
        femaleObstetricHistoryList:
          pastObstetricHistoryFormValue.pastObstericHistoryList,
        pastObstericHistoryList: undefined,
      }
    );
    return pastObstetricHistoryData;
  }

  updateGeneralImmunizationHistory(immunizationHistoryForm: any, temp: any) {
    const immunizationHistoryFormValue = JSON.parse(
      JSON.stringify(immunizationHistoryForm.value)
    );
    const formData = immunizationHistoryFormValue.immunizationList;
    const immunizationHistoryData = Object.assign(
      {},
      { immunizationList: formData },
      temp
    );
    return immunizationHistoryData;
  }

  updateGeneralOtherVaccines(otherVaccinesForm: any, temp: any) {
    const otherVaccinesFormValue = JSON.parse(
      JSON.stringify(otherVaccinesForm.value)
    );
    const otherVaccines = otherVaccinesFormValue.otherVaccines;

    otherVaccines.map((vaccine: any) => {
      if (vaccine.vaccineName) {
        vaccine.vaccineID = vaccine.vaccineName.vaccineID;
        vaccine.vaccineName = vaccine.vaccineName.vaccineName;
      }
    });
    const otherVaccinesData = Object.assign(
      {},
      { childOptionalVaccineList: otherVaccines },
      temp
    );
    return otherVaccinesData;
  }

  updateGeneralVitals(
    patientVitalsForm: any,
    visitCategory: any
  ): Observable<object> {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const patientVitalData = Object.assign(
      {},
      patientVitalsForm.value,
      patientVitalsForm.getRawValue(),
      {
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        modifiedBy: this.sessionstorage.getItem('userName'),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
        visitCode: this.sessionstorage.getItem('visitCode'),
        benVisitID: this.sessionstorage.getItem('visitID'),
      }
    );
    if (visitCategory === 'ANC') {
      return this.http.post(
        environment.updateANCVitalsDetailsUrl,
        patientVitalData
      );
    }
    if (visitCategory === 'General OPD') {
      return this.http.post(
        environment.updateGeneralOPDVitalsDetailsUrl,
        patientVitalData
      );
    }
    if (visitCategory === 'NCD care') {
      return this.http.post(
        environment.updateNCDCareVitalsDetailsUrl,
        patientVitalData
      );
    }

    if (visitCategory === 'PNC') {
      return this.http.post(
        environment.updatePNCVitalsDetailsUrl,
        patientVitalData
      );
    }
    if (visitCategory === 'COVID-19 Screening') {
      return this.http.post(
        environment.updateCovidCareVitalsDetailsUrl,
        patientVitalData
      );
    }
    if (visitCategory === 'NCD screening') {
      return this.http.post(
        environment.updateNCDVitalsDetailsUrl,
        patientVitalData
      );
    }

    return new Observable(observer => {
      observer.complete();
    });
  }

  updateIDRSDetails(
    idrsScreeningForm: any,
    visitCategory: any
  ): Observable<object> {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const patientIDRSData = Object.assign({}, idrsScreeningForm.value, {
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      createdBy: this.sessionstorage.getItem('userName'),
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      deleted: false,
    });

    const idrsDetails = { idrsDetails: patientIDRSData };
    if (visitCategory === 'NCD screening') {
      return this.http.post(
        environment.updateNCDScreeningIDRSDetailsUrl,
        idrsDetails
      );
    }
    return new Observable(observer => {
      observer.complete();
    });
  }
  updatePatientExamination(
    patientExaminationForm: any,
    visitCategory: any,
    updateDetails: any
  ): Observable<object> {
    let updatedExaminationDetails;
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    if (visitCategory === 'ANC') {
      updatedExaminationDetails = {
        generalExamination: this.updateGeneralExaminationForm(
          patientExaminationForm.generalExaminationForm,
          updateDetails
        ),
        headToToeExamination: this.updateHeadToToeExaminationForm(
          patientExaminationForm.headToToeExaminationForm,
          updateDetails
        ),
        cardioVascularExamination: this.updateCardioVascularSystemForm(
          patientExaminationForm.systemicExaminationForm
            .cardioVascularSystemForm,
          updateDetails
        ),
        respiratorySystemExamination: this.updateRespiratorySystemForm(
          patientExaminationForm.systemicExaminationForm.respiratorySystemForm,
          updateDetails
        ),
        centralNervousSystemExamination: this.updateCentralNervousSystemForm(
          patientExaminationForm.systemicExaminationForm
            .centralNervousSystemForm,
          updateDetails
        ),
        musculoskeletalSystemExamination: this.updateMusculoSkeletalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .musculoSkeletalSystemForm,
          updateDetails
        ),
        genitoUrinarySystemExamination: this.updateGenitoUrinarySystemForm(
          patientExaminationForm.systemicExaminationForm
            .genitoUrinarySystemForm,
          updateDetails
        ),
        obstetricExamination: this.updateANCObstetricExamination(
          patientExaminationForm.systemicExaminationForm
            .obstetricExaminationForANCForm,
          updateDetails
        ),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        visitCode: this.sessionstorage.getItem('visitCode'),
        benVisitID: this.sessionstorage.getItem('visitID'),
      };

      console.log(
        'Update ANC Examination',
        JSON.stringify(updatedExaminationDetails, null, 4)
      );

      return this.http.post(
        environment.updateANCExaminationDetailsUrl,
        updatedExaminationDetails
      );
    }

    if (visitCategory === 'PNC') {
      updatedExaminationDetails = {
        generalExamination: this.updateGeneralExaminationForm(
          patientExaminationForm.generalExaminationForm,
          updateDetails
        ),
        headToToeExamination: this.updateHeadToToeExaminationForm(
          patientExaminationForm.headToToeExaminationForm,
          updateDetails
        ),
        gastroIntestinalExamination: this.updateGastroIntestinalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .gastroIntestinalSystemForm,
          updateDetails
        ),
        cardioVascularExamination: this.updateCardioVascularSystemForm(
          patientExaminationForm.systemicExaminationForm
            .cardioVascularSystemForm,
          updateDetails
        ),
        respiratorySystemExamination: this.updateRespiratorySystemForm(
          patientExaminationForm.systemicExaminationForm.respiratorySystemForm,
          updateDetails
        ),
        centralNervousSystemExamination: this.updateCentralNervousSystemForm(
          patientExaminationForm.systemicExaminationForm
            .centralNervousSystemForm,
          updateDetails
        ),
        musculoskeletalSystemExamination: this.updateMusculoSkeletalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .musculoSkeletalSystemForm,
          updateDetails
        ),
        genitoUrinarySystemExamination: this.updateGenitoUrinarySystemForm(
          patientExaminationForm.systemicExaminationForm
            .genitoUrinarySystemForm,
          updateDetails
        ),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        visitCode: this.sessionstorage.getItem('visitCode'),
        benVisitID: this.sessionstorage.getItem('visitID'),
      };

      console.log(
        'Update PNC Examination',
        JSON.stringify(updatedExaminationDetails, null, 4)
      );

      return this.http.post(
        environment.updatePNCExaminationDetailsUrl,
        updatedExaminationDetails
      );
    }

    if (visitCategory === 'General OPD') {
      updatedExaminationDetails = {
        generalExamination: this.updateGeneralExaminationForm(
          patientExaminationForm.generalExaminationForm,
          updateDetails
        ),
        headToToeExamination: this.updateHeadToToeExaminationForm(
          patientExaminationForm.headToToeExaminationForm,
          updateDetails
        ),
        gastroIntestinalExamination: this.updateGastroIntestinalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .gastroIntestinalSystemForm,
          updateDetails
        ),
        cardioVascularExamination: this.updateCardioVascularSystemForm(
          patientExaminationForm.systemicExaminationForm
            .cardioVascularSystemForm,
          updateDetails
        ),
        respiratorySystemExamination: this.updateRespiratorySystemForm(
          patientExaminationForm.systemicExaminationForm.respiratorySystemForm,
          updateDetails
        ),
        centralNervousSystemExamination: this.updateCentralNervousSystemForm(
          patientExaminationForm.systemicExaminationForm
            .centralNervousSystemForm,
          updateDetails
        ),
        musculoskeletalSystemExamination: this.updateMusculoSkeletalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .musculoSkeletalSystemForm,
          updateDetails
        ),
        genitoUrinarySystemExamination: this.updateGenitoUrinarySystemForm(
          patientExaminationForm.systemicExaminationForm
            .genitoUrinarySystemForm,
          updateDetails
        ),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        visitCode: this.sessionstorage.getItem('visitCode'),
        benVisitID: this.sessionstorage.getItem('visitID'),
      };

      console.log(
        'Update General OPD Examination',
        JSON.stringify(updatedExaminationDetails, null, 4)
      );

      return this.http.post(
        environment.updateGeneralOPDExaminationDetailsUrl,
        updatedExaminationDetails
      );
    }

    return new Observable(observer => {
      observer.complete();
    });
  }

  updateGeneralExaminationForm(
    generalExaminationForm: any,
    updateDetails: any
  ) {
    const generalExaminationFormdata = Object.assign(
      {},
      generalExaminationForm,
      updateDetails
    );
    return generalExaminationFormdata;
  }

  updateHeadToToeExaminationForm(
    headToToeExaminationForm: any,
    updateDetails: any
  ) {
    const headToToeExaminationFormData = Object.assign(
      {},
      headToToeExaminationForm,
      updateDetails
    );
    return headToToeExaminationFormData;
  }

  updateGastroIntestinalSystemForm(
    gastroIntestinalSystemForm: any,
    updateDetails: any
  ) {
    const gastroIntestinalSystemFormData = Object.assign(
      {},
      gastroIntestinalSystemForm,
      updateDetails
    );
    return gastroIntestinalSystemFormData;
  }

  updateCardioVascularSystemForm(
    cardioVascularSystemForm: any,
    updateDetails: any
  ) {
    const cardioVascularSystemFormData = Object.assign(
      {},
      cardioVascularSystemForm,
      updateDetails
    );
    return cardioVascularSystemFormData;
  }

  updateRespiratorySystemForm(respiratorySystemForm: any, updateDetails: any) {
    const respiratorySystemFormData = Object.assign(
      {},
      respiratorySystemForm,
      updateDetails
    );
    return respiratorySystemFormData;
  }

  updateCentralNervousSystemForm(
    centralNervousSystemForm: any,
    updateDetails: any
  ) {
    const centralNervousSystemFormData = Object.assign(
      {},
      centralNervousSystemForm,
      updateDetails
    );
    return centralNervousSystemFormData;
  }

  updateMusculoSkeletalSystemForm(
    musculoSkeletalSystemForm: any,
    updateDetails: any
  ) {
    const musculoSkeletalSystemFormData = Object.assign(
      {},
      musculoSkeletalSystemForm,
      updateDetails
    );
    return musculoSkeletalSystemFormData;
  }

  updateGenitoUrinarySystemForm(
    genitoUrinarySystemForm: any,
    updateDetails: any
  ) {
    const genitoUrinarySystemFormData = Object.assign(
      {},
      genitoUrinarySystemForm,
      updateDetails
    );
    return genitoUrinarySystemFormData;
  }

  updateANCObstetricExamination(
    obstetricExaminationForANCForm: any,
    updateDetails: any
  ) {
    const obstetricExaminationForANCFormData = Object.assign(
      {},
      obstetricExaminationForANCForm,
      updateDetails
    );
    return obstetricExaminationForANCFormData;
  }

  postGeneralCaseRecordFindings(findingForm: any, otherDetails: any) {
    const findingFormValue = JSON.parse(JSON.stringify(findingForm.value));
    let complaints = findingFormValue.complaints;
    complaints = complaints.filter((item: any) => !!item.chiefComplaint);
    complaints.map((item: any) => {
      if (item.chiefComplaint) {
        item.chiefComplaintID = item.chiefComplaint.chiefComplaintID;
        item.chiefComplaint = item.chiefComplaint.chiefComplaint;
      }
      item.duration = item.duration ? '' + item.duration : null;
      return item;
    });

    const findingFormData = Object.assign(
      {},
      findingFormValue,
      { complaints },
      otherDetails
    );
    return findingFormData;
  }

  postANCCaseRecordDiagnosis(diagnosisForm: any, otherDetails: any) {
    const diagnosisFormData = Object.assign(
      {},
      diagnosisForm.value,
      otherDetails
    );
    if (diagnosisForm.value.dateOfDeath === null) {
      delete diagnosisFormData['dateOfDeath'];
    }
    return diagnosisFormData;
  }

  postGeneralOPDCaseRecordDiagnosis(diagnosisForm: any, otherDetails: any) {
    const diagnosisFormData = Object.assign(
      {},
      diagnosisForm.value,
      otherDetails
    );
    return diagnosisFormData;
  }

  postNCDCareCaseRecordDiagnosis(diagnosisForm: any, otherDetails: any) {
    const diagnosisFormData = JSON.parse(JSON.stringify(diagnosisForm.value));

    if (diagnosisFormData.ncdCareType) {
      diagnosisFormData.ncdCareTypeID =
        diagnosisFormData.ncdCareType.ncdCareTypeID;
      diagnosisFormData.ncdCareType = diagnosisFormData.ncdCareType.ncdCareType;
    }

    const diagnosisData = Object.assign({}, diagnosisFormData, otherDetails);
    return diagnosisData;
  }

  postCovidCareCaseRecordDiagnosis(diagnosisForm: any, otherDetails: any) {
    const diagnosisFormData = Object.assign(
      {},
      diagnosisForm.value,
      otherDetails
    );
    return diagnosisFormData;
  }
  postNCDscreeningCaseRecordDiagnosis(diagnosisForm: any, otherDetails: any) {
    const diagnosisFormData = Object.assign(
      {},
      diagnosisForm.value,
      otherDetails
    );
    return diagnosisFormData;
  }
  postGeneralCaseRecordInvestigation(
    investigationForm: any,
    otherDetails: any
  ) {
    const investigationFormValue = JSON.parse(
      JSON.stringify(investigationForm.value)
    );
    let labTest: any[] = [];
    if (investigationFormValue.labTest) {
      if (investigationFormValue?.radiologyTest?.length) {
        labTest = investigationFormValue.labTest.concat(
          investigationFormValue.radiologyTest
        );
      } else {
        labTest = investigationFormValue.labTest;
      }
    }

    const temp = labTest.filter((test: any) => {
      return !test.disabled;
    });
    labTest = temp.slice();
    const investigationFormData = Object.assign(
      {},
      investigationFormValue,
      otherDetails,
      { laboratoryList: labTest, radiologyTest: undefined, labTest: undefined }
    );

    return investigationFormData;
  }

  postGeneralCaseRecordPrescription(prescriptionForm: any, otherDetails: any) {
    const prescriptionFormValue = JSON.parse(
      JSON.stringify(prescriptionForm.value)
    );
    let prescribedDrugs = prescriptionFormValue.prescribedDrugs;
    prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);
    console.log('these to send', prescribedDrugs);
    return prescribedDrugs;
  }

  deleteMedicine(id: any) {
    return this.http.post(environment.drugDeleteUrl, { id });
  }

  postGeneralRefer(referForm: any, otherDetails: any) {
    const referFormData = JSON.parse(JSON.stringify(referForm.value));
    if (referFormData.referredToInstituteName) {
      referFormData.referredToInstituteID =
        referFormData.referredToInstituteName.institutionID;
      referFormData.referredToInstituteName =
        referFormData.referredToInstituteName.institutionName;
    }

    if (referFormData.refrredToAdditionalServiceList) {
      const temp = referFormData.refrredToAdditionalServiceList.filter(
        (item: any) => {
          return !item.disabled;
        }
      );
      referFormData.refrredToAdditionalServiceList = temp.slice();
    }
    if (referFormData.revisitDate) {
      referFormData.revisitDate = referForm.controls['revisitDate'].value;
    }
    if (referFormData.referralReason) {
      referFormData.referralReason = referForm.controls['referralReason'].value;
    }

    const referData = Object.assign({}, referFormData, otherDetails);
    return referData;
  }

  /**
   * Post Oncologist Remarks on Cancer Casesheet, Later on, If Required, Move this is Oncologist Service
   */
  postOncologistRemarksforCancerCaseSheet(
    remarks: any,
    visitID: any,
    regID: any
  ) {
    return this.http.post(environment.updateOncologistRemarksCancelUrl, {
      beneficiaryRegID: regID,
      benVisitID: visitID,
      modifiedBy: this.sessionstorage.getItem('userName'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      provisionalDiagnosisOncologist: remarks,
    });
  }

  clearCache() {
    this.generalHistory = null;
    this.getVisitComplaint = null;
    this.caseRecordAndReferDetails = null;
  }

  postDoctorPNCDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const pncVisitDetails = {
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postANCCaseRecordDiagnosis(diagnosisForm, otherDetails),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };

    console.log(
      'PNC Doctor Visit Details',
      JSON.stringify(pncVisitDetails, null, 4)
    );

    return this.http.post(environment.savePNCDoctorDetailsUrl, pncVisitDetails);
  }

  getPNCDetails(beneficiaryID: string, visitID: string) {
    return this.http.post(environment.getPNCDetailsUrl, {
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
  }

  updatePNCDetails(patientPNCForm: any, otherDetails: any) {
    const temp = JSON.parse(JSON.stringify(patientPNCForm.value));
    if (temp.deliveryPlace) {
      temp.deliveryPlaceID = temp.deliveryPlace.deliveryPlaceID;
      temp.deliveryPlace = temp.deliveryPlace.deliveryPlace;
    }

    if (temp.deliveryType) {
      temp.deliveryTypeID = temp.deliveryType.deliveryTypeID;
      temp.deliveryType = temp.deliveryType.deliveryType;
    }

    if (temp.deliveryComplication) {
      temp.deliveryComplicationID = temp.deliveryComplication.complicationID;
      temp.deliveryComplication =
        temp.deliveryComplication.deliveryComplicationType;
    }

    if (temp.pregOutcome) {
      temp.pregOutcomeID = temp.pregOutcome.pregOutcomeID;
      temp.pregOutcome = temp.pregOutcome.pregOutcome;
    }

    if (temp.postNatalComplication) {
      temp.postNatalComplicationID = temp.postNatalComplication.complicationID;
      temp.postNatalComplication = temp.postNatalComplication.complicationValue;
    }

    if (temp.gestationName) {
      temp.gestationID = temp.gestationName.gestationID;
      temp.gestationName = temp.gestationName.name;
    }

    if (temp.newBornHealthStatus) {
      temp.newBornHealthStatusID =
        temp.newBornHealthStatus.newBornHealthStatusID;
      temp.newBornHealthStatus = temp.newBornHealthStatus.newBornHealthStatus;
    }
    const updatedPNCDetails = Object.assign({}, temp, otherDetails);

    console.log(
      'json',
      JSON.stringify({ PNCDetails: updatedPNCDetails }, null, 4)
    );

    return this.http.post(environment.updatePNCDetailsUrl, {
      PNCDetails: updatedPNCDetails,
    });
  }

  /*
  Get Significiant findings
  */

  getPreviousSignificiantFindings(beneficiaryRegID: any) {
    return this.http.post(
      environment.getPreviousSignificiantFindingUrl,
      beneficiaryRegID
    );
  }

  caseRecordAndReferDetails: any;
  getCaseRecordAndReferDetails(
    beneficiaryRegID: any,
    visitID: any,
    visitCategory: any
  ) {
    const otherDetails = Object.assign({
      benRegID: beneficiaryRegID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });

    if (!this.caseRecordAndReferDetails) {
      if (visitCategory === 'Cancer Screening') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getCancerScreeningDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'General OPD (QC)') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getGeneralOPDQuickConsultDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'ANC') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getANCDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'General OPD') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getGeneralOPDDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'NCD screening') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getNCDScreeningDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'NCD care') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getNCDCareDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'PNC') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getPNCDoctorDetails,
          otherDetails
        );
      }
      if (visitCategory === 'COVID-19 Screening') {
        this.caseRecordAndReferDetails = this.http.post(
          environment.getCovidDoctorDetails,
          otherDetails
        );
      }
    }
    return this.caseRecordAndReferDetails;
  }

  updateDoctorDiagnosisDetails(
    patientMedicalForm: any,
    visitCategory: any,
    otherDetails: any,
    tcRequest: any
  ): Observable<object> {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const findingForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalFindingsForm'];
    const investigationForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDoctorInvestigationForm'];
    const prescriptionForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['drugPrescriptionForm'];
    const diagnosisForm = (<FormGroup>(
      patientMedicalForm.controls['patientCaseRecordForm']
    )).controls['generalDiagnosisForm'];
    const referForm = patientMedicalForm.controls['patientReferForm'];

    const updatedDoctorDiagnosis = {
      findings: this.postGeneralCaseRecordFindings(findingForm, otherDetails),
      diagnosis: this.postGeneralCaseRecordDiagnosis(
        diagnosisForm,
        visitCategory,
        otherDetails
      ),
      investigation: this.postGeneralCaseRecordInvestigation(
        investigationForm,
        otherDetails
      ),
      prescription: this.postGeneralCaseRecordPrescription(
        prescriptionForm,
        otherDetails
      ),
      refer: this.postGeneralRefer(referForm, otherDetails),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: this.sessionstorage.getItem('doctorFlag'),
      nurseFlag: this.sessionstorage.getItem('nurseFlag'),
      pharmacist_flag: this.sessionstorage.getItem('pharmacist_flag'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
      isSpecialist: otherDetails.isSpecialist,
    };

    console.log(
      'updated doctor details',
      JSON.stringify(updatedDoctorDiagnosis, null, 4)
    );

    if (visitCategory === 'ANC') {
      return this.http.post(
        environment.updateANCDoctorDetails,
        updatedDoctorDiagnosis
      );
    }
    if (visitCategory === 'General OPD') {
      return this.http.post(
        environment.updateGeneralOPDDoctorDetails,
        updatedDoctorDiagnosis
      );
    }
    if (visitCategory === 'NCD care') {
      return this.http.post(
        environment.updateNCDCareDoctorDetails,
        updatedDoctorDiagnosis
      );
    }
    if (visitCategory === 'PNC') {
      return this.http.post(
        environment.updatePNCDoctorDetails,
        updatedDoctorDiagnosis
      );
    }
    if (visitCategory === 'COVID-19 Screening') {
      return this.http.post(
        environment.updateCovidDoctorDetails,
        updatedDoctorDiagnosis
      );
    }
    if (visitCategory === 'NCD screening') {
      return this.http.post(
        environment.updateNCDScreeningDoctorDetails,
        updatedDoctorDiagnosis
      );
    }

    // Return an observable that emits no value and completes
    return new Observable(observer => {
      observer.complete();
    });
  }

  postGeneralCaseRecordDiagnosis(
    diagnosisForm: any,
    visitCategory: any,
    otherDetails: any
  ) {
    let diagnosisDetails;

    if (visitCategory === 'ANC') {
      diagnosisDetails = this.postANCCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      );
    }
    if (visitCategory === 'General OPD') {
      diagnosisDetails = this.postGeneralOPDCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      );
    }
    if (visitCategory === 'NCD care') {
      diagnosisDetails = this.postNCDCareCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      );
    }
    if (visitCategory === 'PNC') {
      diagnosisDetails = this.postANCCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      );
    }
    if (visitCategory === 'COVID-19 Screening') {
      diagnosisDetails = this.postCovidCareCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      );
    }
    if (visitCategory === 'NCD screening') {
      diagnosisDetails = this.postNCDscreeningCaseRecordDiagnosis(
        diagnosisForm,
        otherDetails
      );
    }

    return diagnosisDetails;
  }

  getMMUCasesheetData(caseSheetRequest: any) {
    console.log('get here in serv', caseSheetRequest);

    return this.http.post(environment.getMMUCasesheetDataUrl, caseSheetRequest);
  }

  getTMCasesheetData(caseSheetRequest: any) {
    console.log('get here in serv', caseSheetRequest);

    return this.http.post(environment.getTMCasesheetDataUrl, caseSheetRequest);
  }

  getArchivedReports(ArchivedReports: any) {
    return this.http.post(environment.archivedReportsUrl, ArchivedReports);
  }

  getPatientMCTSCallHistory(callDetailID: any) {
    return this.http.post(environment.patientMCTSCallHistoryUrl, callDetailID);
  }

  getMasterSpecialization() {
    return this.http.post(environment.getMasterSpecializationUrl, {});
  }

  getSpecialist(specialistReqObj: any) {
    return this.http.post(environment.getSpecialistUrl, specialistReqObj);
  }
  getAvailableSlot(availableSlotReqObj: any) {
    return this.http.post(environment.getAvailableSlotUrl, availableSlotReqObj);
  }

  scheduleTC(schedulerRequest: any) {
    return this.http.post(environment.scheduleTCUrl, schedulerRequest);
  }

  beneficiaryTCRequestStatus(beneficiaryTCRequest: any) {
    console.log(JSON.stringify(beneficiaryTCRequest));
    return this.http.post(
      environment.beneficiaryTCRequestStatusUrl,
      beneficiaryTCRequest
    );
  }

  getSwymedMail() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    console.log('vanID', vanID);

    return this.http.get(environment.getSwymedMailUrl + `/${vanID}`);
  }
  // getCancerScreeningDoctorDetails() {
  //   return this.http.post(environment.getCancerScreeningDoctorDetailsUrl, {})
  // }
  saveSpecialistCancerObservation(
    specialistDiagonosis: any,
    otherDetails: any
  ) {
    const diagnosisDetails =
      specialistDiagonosis.controls.patientCaseRecordForm.value;
    const referDetails = specialistDiagonosis.controls.patientReferForm.value;
    if (referDetails['referredToInstituteName']) {
      delete referDetails['referredToInstituteName'];
    }
    const diagnosis = Object.assign(
      {},
      referDetails,
      diagnosisDetails,
      otherDetails
    );
    console.log(
      'saveSpecialistCancerObservation',
      JSON.stringify({ diagnosis }, null, 4)
    );
    return this.http.post(environment.saveSpecialistCancerObservationUrl, {
      diagnosis,
    });
  }
  updateNCDScreeningHistory(
    NCDScreeningHistoryForm: any,
    temp: any,
    beneficiaryAge: any
  ): Observable<any> {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const updatedHistoryDetails = {
      familyHistory: this.updateGeneralFamilyHistory(
        NCDScreeningHistoryForm.controls.familyHistory,
        temp
      ),
      physicalActivityHistory: this.updatePhyscialActivityHistory(
        NCDScreeningHistoryForm.controls.physicalActivityHistory,
        temp
      ),
      personalHistory: this.updateGeneralPersonalHistory(
        NCDScreeningHistoryForm.controls.personalHistory,
        temp
      ),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: this.sessionstorage.getItem('visitID'),
    };

    console.log(
      'Update NCD Screening History',
      JSON.stringify(updatedHistoryDetails, null, 4)
    );

    if (visitCategory === 'NCD screening') {
      return this.http.post(
        environment.updateNCDScreeningHistoryDetailsUrl,
        updatedHistoryDetails
      );
    }
    return new Observable(observer => {
      observer.complete();
    });
  }
  updatePhyscialActivityHistory(
    physicalActivityHistory: any,
    otherDetails: any
  ) {
    const physicalActivityHistoryForm = Object.assign(
      {},
      physicalActivityHistory.value,
      otherDetails
    );
    return physicalActivityHistoryForm;
  }

  getIDRSDetails(beneficiaryID: string, visitID: string): Observable<any> {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const otherDetails = Object.assign({
      benRegID: beneficiaryID,
      benVisitID: visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    });
    if (visitCategory === 'NCD screening') {
      return this.http.post(
        environment.getNCDScreeningIDRSDetails,
        otherDetails
      );
    }

    return new Observable(observer => {
      observer.complete();
    });
  }

  postTMReferedNurseDetails(
    patientMedicalForm: any,
    otherDetails: any,
    tcRequest: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const referForm = (<FormGroup>(
      patientMedicalForm.controls['patientVisitForm']
    )).controls['tmcConfirmationForm'];
    const isTMCDone = referForm.value.tmcConfirmed;
    const benData: any = this.sessionstorage.getItem('beneficiaryData');
    const beneficiaryData = JSON.parse(benData);
    const generalVisitDetails = {
      prescription: this.prescribedDrugData ? this.prescribedDrugData : null,
      refer: this.postTMVisitDatilsRefer(
        referForm,
        otherDetails,
        beneficiaryData
      ),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      doctorFlag: String(beneficiaryData.doctorFlag),
      nurseFlag: String(beneficiaryData.nurseFlag),
      pharmacist_flag:
        beneficiaryData.pharmacist_flag === 'Not Available' ? 0 : 1,
      isSpecialist: false,
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
      benVisitID: String(beneficiaryData.benVisitID),
      serviceID: this.sessionstorage.getItem('serviceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      isTMCDone: isTMCDone,
    };
    console.log(
      'TM Nurse Details',
      JSON.stringify(generalVisitDetails, null, 4)
    );

    return this.http.post(
      environment.postNCDScreeningDetails,
      generalVisitDetails
    );
    // return Observable.of({errorMessage: 'furrrr'});
  }

  postTMVisitDatilsRefer(
    referForm: any,
    otherDetails: any,
    beneficiaryData: any
  ) {
    const referFormData = JSON.parse(JSON.stringify(referForm.value));
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    let temp = {};
    if (referFormData.refrredToAdditionalServiceList) {
      temp = {
        referredToInstituteID:
          referFormData.refrredToAdditionalServiceList.institutionID,
        referredToInstituteName:
          referFormData.refrredToAdditionalServiceList.institutionName,
        refrredToAdditionalServiceList: null,
        revisitDate: null,
        referralReason: null,
        vanID: beneficiaryData.vanID,
        parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
        sessionID: this.sessionstorage.getItem('sessionID'),
        beneficiaryID: String(beneficiaryData.beneficiaryID),
        serviceID: this.sessionstorage.getItem('serviceID'),
        benFlowID: String(beneficiaryData.benFlowID),
        isSpecialist: false,
      };
    }
    otherDetails.benVisitID = String(beneficiaryData.benVisitID);
    const referData = Object.assign({}, temp, otherDetails);
    return referData;
  }
  HRPDetails: any;
  getHRPDetails(beneficiaryRegID: any, visitCode: any) {
    const reqObj = Object.assign({
      benRegID: beneficiaryRegID,
      visitCode: visitCode,
    });

    this.HRPDetails = this.http.post(environment.loadHRPUrl, reqObj);
    return this.HRPDetails;
  }

  /* Doctor Signature download */
  downloadSign(userID: any) {
    return this.http
      .get(environment.downloadSignUrl + userID, { responseType: 'blob' })
      .pipe(map((res: any) => <Blob>res.blob()));
  }

  enableButton: any = false;
  enableVitalsUpdateButton = new BehaviorSubject(this.enableButton);
  enableVitalsUpdateButton$ = this.enableVitalsUpdateButton.asObservable();
  setValueToEnableVitalsUpdateButton(value: any) {
    this.enableVitalsUpdateButton.next(value);
  }

  getAssessment(benRegID: any) {
    return this.http.get(environment.getAssessmentIdUrl + '/' + benRegID);
  }

  getAssessmentDet(assessmentId: any) {
    return this.http.get(environment.getAssessmentUrl + '/' + assessmentId);
  }

  historyResponse: any = [];
  populateHistoryResponse = new BehaviorSubject<any>(this.historyResponse);
  populateHistoryResponse$ = this.populateHistoryResponse.asObservable();

  setCapturedHistoryByNurse(historyResponse: any) {
    this.populateHistoryResponse.next(historyResponse);
  }

  postGenericVisitDetailForm(
    patientVisitForm: any,
    benVisitID: any,
    visitCategory: any
  ): Observable<any> {
    if (visitCategory === 'NCD screening') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
      };
      return visitDeatilsData;
    }
    return new Observable(observer => {
      observer.complete();
    });
  }

  postPatientVisitDetails(visitForm: any, files: any) {
    const fileList: string[] = [];

    // Extract from previous file objects
    if (this.fileIDs && this.fileIDs.length > 0) {
      this.fileIDs.forEach((file: { filePath: string }) => {
        if (file.filePath) {
          fileList.push(file.filePath);
        }
      });
    }
    // Add new file IDs
    if (files && files?.fileIDs.length > 0) {
      fileList.push(...files.fileIDs);
    }
    const patientVisitDetails = {
      ...visitForm,
      fileIDs: fileList,
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    return patientVisitDetails;
  }
}
