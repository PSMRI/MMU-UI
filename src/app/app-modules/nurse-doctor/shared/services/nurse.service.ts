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
import { FormGroup, FormArray } from '@angular/forms';
import { SpinnerService } from '../../../core/services/spinner.service';
import { shareReplay } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Injectable()
export class NurseService {
  temp = false;
  private _listners = new Subject<any>();
  ncdTemp = new BehaviorSubject(this.temp);
  ncdTemp$ = this.ncdTemp.asObservable();
  rbsSelectedInvestigation = false;
  rbsSelectedInInvestigation = new BehaviorSubject(
    this.rbsSelectedInvestigation
  );
  rbsSelectedInInvestigation$ = this.rbsSelectedInInvestigation.asObservable();
  rbsTestResultFromDoctorFetch: any;
  rbsCurrentTestResult: any = null;
  rbsTestResultCurrent = new BehaviorSubject(this.rbsCurrentTestResult);
  rbsTestResultCurrent$ = this.rbsTestResultCurrent.asObservable();
  isAssessmentDone = false;
  enableLAssessment = new BehaviorSubject(this.temp);
  enableLAssessment$ = this.enableLAssessment.asObservable();
  enableProvisionalDiag = new BehaviorSubject(this.temp);
  enableProvisionalDiag$ = this.enableProvisionalDiag.asObservable();

  listen(): Observable<any> {
    return this._listners.asObservable();
  }

  filter(filterBy: string) {
    this._listners.next(filterBy);
  }

  fileData: any; // To store fileIDs

  constructor(
    private http: HttpClient,
    private spinnerService: SpinnerService,
    readonly sessionstorage: SessionStorageService
  ) {}

  private normalizeToUTCMidnight(date: Date | null | undefined): string | null {
    if (!date) return null;

    const d = new Date(date);

    const utcDate = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    );
    return utcDate.toISOString();
  }

  getNurseWorklist() {
    const testDate = new Date('2025-10-07T00:00:00');
    console.log('Test normalization:', this.normalizeToUTCMidnight(testDate));

    console.log(
      'getNurseWorklistUrl',
      this.sessionstorage.getItem('providerServiceID')
    );
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const fetchUrl =
      this.sessionstorage.getItem('providerServiceID') +
      `/${this.sessionstorage.getItem('serviceID')}/${vanID}`;
    return this.http.get(environment.nurseWorklist + fetchUrl);
  }
  getPreviousDiabetesHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousDiabetesHistoryUrl, {
      benRegID: benRegID,
    });
  }
  getPreviousVisitData(obj: any) {
    return this.http.post(environment.previousVisitDataUrl, obj);
  }
  getNurseWorklistTMreferred() {
    console.log(
      'getNurseWorklistUrl',
      this.sessionstorage.getItem('providerServiceID')
    );
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const fetchUrl =
      this.sessionstorage.getItem('providerServiceID') +
      `/${this.sessionstorage.getItem('serviceID')}/${vanID}`;
    return this.http.get(environment.nurseWorklistTMreferred + fetchUrl);
  }
  postNurseCancerVisitForm(
    medicalForm: any,
    imageCoordinates: any,
    sendToDoctorWorklist: any
  ) {
    const temp = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    let cancerVisitDetails = {};

    if (
      medicalForm.controls.patientVisitForm.controls.patientVisitDetailsForm
        .dirty
    ) {
      const visitDetails = Object.assign(
        {},
        medicalForm.controls.patientVisitForm.controls.patientVisitDetailsForm
          .value,
        medicalForm.controls.patientVisitForm.controls
          .patientFileUploadDetailsForm.value,
        temp
      );
      cancerVisitDetails = Object.assign(cancerVisitDetails, { visitDetails });
    }

    if (medicalForm.controls['patientVitalsForm'].dirty) {
      const vitalsDetails = Object.assign(
        {},
        medicalForm.controls['patientVitalsForm'].value,
        temp
      );
      cancerVisitDetails = Object.assign(cancerVisitDetails, { vitalsDetails });
    }

    if (medicalForm.controls['patientExaminationForm'].dirty) {
      const examinationDetails = this.postCancerExaminationDetails(
        medicalForm.controls['patientExaminationForm'],
        temp,
        imageCoordinates
      );
      cancerVisitDetails = Object.assign(cancerVisitDetails, {
        examinationDetails,
      });
    }

    if (medicalForm.controls['patientHistoryForm'].dirty) {
      const historyDetails = this.postCancerHistoryDetails(
        medicalForm.controls['patientHistoryForm'],
        temp
      );
      cancerVisitDetails = Object.assign(cancerVisitDetails, {
        historyDetails,
      });
    }

    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');

    cancerVisitDetails = Object.assign(
      cancerVisitDetails,
      { sendToDoctorWorklist },
      {
        benFlowID: this.sessionstorage.getItem('benFlowID'),
        beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        serviceID: serviceID,
        createdBy: createdBy,
      }
    );

    console.log(
      'Cancer Screening',
      JSON.stringify(cancerVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveNurseCancerScreeningDetails,
      cancerVisitDetails
    );
    // return Observable.of({});
  }

  postCancerHistoryDetails(historyForm: any, otherDetails: any) {
    let historyDetails = {};

    if (historyForm.controls.cancerPatientFamilyMedicalHistoryForm.dirty) {
      const familyDiseases = JSON.parse(
        JSON.stringify(
          historyForm.value.cancerPatientFamilyMedicalHistoryForm.diseases
        )
      );

      for (const disease of familyDiseases) {
        if (disease.cancerDiseaseType) {
          disease.cancerDiseaseType =
            disease.cancerDiseaseType.cancerDiseaseType;
          //   disease.snomedCode = disease.cancerDiseaseType.snomedCode;
          // disease.snomedTerm = disease.cancerDiseaseType.snomedTerm;
          if (disease.cancerDiseaseType === 'Any other Cancer')
            disease.cancerDiseaseType = disease.otherDiseaseType;
        }
        disease.beneficiaryRegID =
          this.sessionstorage.getItem('beneficiaryRegID');
        disease.providerServiceMapID =
          this.sessionstorage.getItem('providerServiceID');
        disease.createdBy = this.sessionstorage.getItem('userName');
      }

      const familyHistory = Object.assign(
        {},
        { diseases: familyDiseases },
        otherDetails
      );
      historyDetails = Object.assign(historyDetails, { familyHistory });
    }

    if (historyForm.controls.cancerPatientPerosnalHistoryForm.dirty) {
      const personalHistory = Object.assign(
        {},
        historyForm.value.cancerPatientPerosnalHistoryForm,
        otherDetails
      );
      historyDetails = Object.assign(historyDetails, { personalHistory });
    }

    if (historyForm.controls.cancerPatientObstetricHistoryForm.dirty) {
      const pastObstetricHistory = Object.assign(
        {},
        historyForm.value.cancerPatientObstetricHistoryForm,
        otherDetails
      );
      historyDetails = Object.assign(historyDetails, { pastObstetricHistory });
    }

    return historyDetails;
  }

  postCancerExaminationDetails(
    cancerExaminationForm: any,
    otherDetails: any,
    imageCoordinates: any
  ) {
    let examinationDetails = {};

    if (cancerExaminationForm.controls.signsForm.dirty) {
      const signsForm = cancerExaminationForm.controls.signsForm as FormGroup;
      const lymphsArray = (<FormArray>(
        signsForm.controls['lymphNodes']
      )).controls.filter(item => {
        return item.dirty;
      });

      const lymphs = lymphsArray.map(item =>
        Object.assign({}, item.value, otherDetails)
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
      const oralExaminationDetails = JSON.parse(
        JSON.stringify(cancerExaminationForm.controls.oralExaminationForm.value)
      );
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
    examinationDetails = Object.assign({}, examinationDetails, {
      imageCoordinates,
    });
    // console.log("Nurse examination Details", JSON.stringify(examinationDetails, null, 4));
    return examinationDetails;
  }

  getPreviousCancerFamilyHistory(benRegID: string) {
    return this.http.post(environment.previousCancerFamilyHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousCancerPersonalHabitHistory(benRegID: string) {
    return this.http.post(environment.previousCancerPersonalHabitHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousCancerPersonalDietHistory(benRegID: string) {
    return this.http.post(environment.previousCancerPersonalDietHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousCancerPastObstetricHistory(benRegID: string) {
    return this.http.post(environment.previousCancerPastObstetricHistoryUrl, {
      benRegID: benRegID,
    });
  }

  postNurseGeneralQCVisitForm(medicalForm: any) {
    const temp = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const visitDetails = Object.assign(
      {},
      medicalForm.controls.patientVisitForm.controls.patientVisitDetailsForm
        .value,
      medicalForm.controls.patientVisitForm.controls
        .patientFileUploadDetailsForm.value,
      temp
    );
    const vitalsDetails = Object.assign(
      {},
      medicalForm.controls['patientVitalsForm'].value,
      temp
    );
    const generalQCVisitDetails = Object.assign(
      {},
      { visitDetails: visitDetails },
      { vitalsDetails: vitalsDetails },
      {
        benFlowID: this.sessionstorage.getItem('benFlowID'),
        beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        serviceID: serviceID,
        createdBy: createdBy,
      }
    );

    console.log(
      'General Quick Consult',
      JSON.stringify(generalQCVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveNurseGeneralQuickConsult,
      generalQCVisitDetails
    );
  }

  postNurseANCVisitForm(
    medicalForm: any,
    benVisitID: any,
    visitCategory: any,
    benAge: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const nurseANCVisitDetails = {
      visitDetails: this.postGenericVisitDetailForm(
        medicalForm.controls.patientVisitForm,
        benVisitID,
        visitCategory
      ),
      ancDetails: this.postANCForm(
        medicalForm.controls.patientANCForm,
        benVisitID
      ),
      vitalDetails: this.postGenericVitalForm(
        medicalForm.controls.patientVitalsForm,
        benVisitID
      ),
      historyDetails: this.postANCHistoryForm(
        medicalForm.controls.patientHistoryForm,
        benVisitID,
        benAge
      ),
      examinationDetails: this.postGenericExaminationForm(
        medicalForm.controls.patientExaminationForm.value,
        benVisitID,
        visitCategory
      ),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };

    console.log(
      'Nurse ANC Visit Details',
      JSON.stringify(nurseANCVisitDetails, null, 4)
    );

    // return Observable.of({});
    return this.http.post(
      environment.saveNurseANCDetails,
      nurseANCVisitDetails
    );
  }

  /**
   * Visit Details Form for All Components after Visit ID is Generated
   */
  postGenericVisitDetailForm(
    patientVisitForm: any,
    benVisitID: any,
    visitCategory: any
  ): Observable<any> {
    if (visitCategory === 'ANC') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
        chiefComplaints: this.postCheifComplaintForm(
          patientVisitForm.controls.patientChiefComplaintsForm.value.complaints,
          benVisitID
        ),
        adherence: this.postAdherenceForm(
          patientVisitForm.controls.patientAdherenceForm.value,
          benVisitID
        ),
        investigation: this.postInvestigationForm(
          patientVisitForm.controls.patientInvestigationsForm.value,
          benVisitID
        ),
      };
      return visitDeatilsData;
    }
    if (visitCategory === 'General OPD') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
        chiefComplaints: this.postCheifComplaintForm(
          patientVisitForm.controls.patientChiefComplaintsForm.value.complaints,
          benVisitID
        ),
      };
      return visitDeatilsData;
    }
    if (visitCategory === 'PNC') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
        chiefComplaints: this.postCheifComplaintForm(
          patientVisitForm.controls.patientChiefComplaintsForm.value.complaints,
          benVisitID
        ),
      };
      return visitDeatilsData;
    }
    if (visitCategory === 'NCD care') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
        adherence: this.postAdherenceForm(
          patientVisitForm.controls.patientAdherenceForm.value,
          benVisitID
        ),
        investigation: this.postInvestigationForm(
          patientVisitForm.controls.patientInvestigationsForm.value,
          benVisitID
        ),
      };
      return visitDeatilsData;
    }
    if (visitCategory === 'COVID-19 Screening') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
        covidDetails: this.postCovidForm(
          patientVisitForm.controls.patientCovidForm.value,
          benVisitID
        ),
      };
      return visitDeatilsData;
    }
    if (visitCategory === 'NCD screening') {
      const visitDeatilsData: any = {
        visitDetails: this.postPatientVisitDetails(
          patientVisitForm.controls.patientVisitDetailsForm.value,
          patientVisitForm.controls.patientFileUploadDetailsForm.value
        ),
        chiefComplaints: this.postCheifComplaintForm(
          patientVisitForm.controls.patientChiefComplaintsForm.value.complaints,
          benVisitID
        ),
      };
      return visitDeatilsData;
    }
    return new Observable(observer => {
      observer.complete();
    });
  }

  postPatientVisitDetails(visitForm: any, files: any) {
    const patientVisitDetails = Object.assign({}, visitForm, files, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    console.log('visit details', JSON.stringify(patientVisitDetails, null, 4));
    return patientVisitDetails;
  }

  postCheifComplaintForm(patientChiefComplaintsForm: any, benVisitID: any) {
    const patientChiefComplaintsFormValue = JSON.parse(
      JSON.stringify(patientChiefComplaintsForm)
    );
    for (const complaint of patientChiefComplaintsFormValue) {
      if (complaint.chiefComplaint !== null) {
        complaint.chiefComplaintID = complaint.chiefComplaint.chiefComplaintID;
        complaint.chiefComplaint = complaint.chiefComplaint.chiefComplaint;
      }
      complaint.beneficiaryRegID =
        this.sessionstorage.getItem('beneficiaryRegID');
      complaint.benVisitID = benVisitID;
      complaint.providerServiceMapID =
        this.sessionstorage.getItem('providerServiceID');
      complaint.createdBy = this.sessionstorage.getItem('userName');
    }
    // console.log('chiefComplaintsForm', JSON.stringify(patientChiefComplaintsForm, null, 4));
    return patientChiefComplaintsFormValue;
  }

  postAdherenceForm(patientAdherenceForm: any, benVisitID: any) {
    const adherenceForm = Object.assign({}, patientAdherenceForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('adherenceForm', JSON.stringify(adherenceForm, null, 4));
    return adherenceForm;
  }

  postInvestigationForm(patientInvestigationsForm: any, benVisitID: any) {
    const investigationsForm = Object.assign({}, patientInvestigationsForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('investigationsForm', JSON.stringify(investigationsForm, null, 4));
    return investigationsForm;
  }

  postCovidForm(patientCovidForm: any, benVisitID: any) {
    const covidForm = Object.assign({}, patientCovidForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('adherenceForm', JSON.stringify(adherenceForm, null, 4));
    return covidForm;
  }

  postANCForm(patientANCForm: any, benVisitID: any) {
    return {
      ancObstetricDetails: this.postANCDetailForm(patientANCForm, benVisitID),
      ancImmunization: this.postANCImmunizationForm(
        patientANCForm.controls.patientANCImmunizationForm.value,
        benVisitID
      ),
    };
  }

  postANCDetailForm(patientANCForm: any, benVisitID: any) {
    const detailedANC = JSON.parse(
      JSON.stringify(patientANCForm.controls.patientANCDetailsForm.value)
    );
    const obstetricFormula = JSON.parse(
      JSON.stringify(patientANCForm.controls.obstetricFormulaForm.value)
    );

    if (detailedANC.lmpDate) {
      detailedANC.lmpDate = this.normalizeToUTCMidnight(
        new Date(detailedANC.lmpDate)
      );
    }

    if (detailedANC.expDelDt) {
      detailedANC.expDelDt = this.normalizeToUTCMidnight(
        new Date(detailedANC.expDelDt)
      );
    }

    const combinedANCForm = Object.assign({}, detailedANC, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      gravida_G: obstetricFormula.gravida_G,
      termDeliveries_T: obstetricFormula.termDeliveries_T,
      pretermDeliveries_P: obstetricFormula.pretermDeliveries_P,
      abortions_A: obstetricFormula.abortions_A,
      stillBirth: obstetricFormula.stillBirth,
      livebirths_L: obstetricFormula.livebirths_L,
      bloodGroup: obstetricFormula.bloodGroup,
    });
    // console.log('combinedANCForm', JSON.stringify(combinedANCForm, null, 4));
    return combinedANCForm;
  }

  postANCImmunizationForm(patientANCImmunizationForm: any, benVisitID: any) {
    const immunizationFormValue = JSON.parse(
      JSON.stringify(patientANCImmunizationForm)
    );

    if (immunizationFormValue.dateReceivedForTT_1) {
      immunizationFormValue.dateReceivedForTT_1 = this.normalizeToUTCMidnight(
        new Date(immunizationFormValue.dateReceivedForTT_1)
      );
    }

    if (immunizationFormValue.dateReceivedForTT_2) {
      immunizationFormValue.dateReceivedForTT_2 = this.normalizeToUTCMidnight(
        new Date(immunizationFormValue.dateReceivedForTT_2)
      );
    }

    if (immunizationFormValue.dateReceivedForTT_3) {
      immunizationFormValue.dateReceivedForTT_3 = this.normalizeToUTCMidnight(
        new Date(immunizationFormValue.dateReceivedForTT_3)
      );
    }
    const immunizationForm = Object.assign({}, immunizationFormValue, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('immunizationForm', JSON.stringify(immunizationForm, null, 4));
    return immunizationForm;
  }

  postGenericVitalForm(patientVitalForm: any, benVisitID: any) {
    const patientVitalsDetails = Object.assign({}, patientVitalForm.value, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Vitals Form', JSON.stringify(patientVitalsDetails, null, 4));
    return patientVitalsDetails;
  }

  /**
   * Examination Form for Examination Step of Non-Cancer (Generic)
   */
  postGenericExaminationForm(
    patientExaminationForm: any,
    benVisitID: any,
    visitCategory: any
  ): Observable<any> {
    if (visitCategory === 'ANC') {
      const examDetailsData: any = {
        generalExamination: this.postGeneralExaminationForm(
          patientExaminationForm.generalExaminationForm,
          benVisitID
        ),
        headToToeExamination: this.postHeadToToeExaminationForm(
          patientExaminationForm.headToToeExaminationForm,
          benVisitID
        ),
        cardioVascularExamination: this.postCardioVascularSystemForm(
          patientExaminationForm.systemicExaminationForm
            .cardioVascularSystemForm,
          benVisitID
        ),
        respiratorySystemExamination: this.postRespiratorySystemForm(
          patientExaminationForm.systemicExaminationForm.respiratorySystemForm,
          benVisitID
        ),
        centralNervousSystemExamination: this.postCentralNervousSystemForm(
          patientExaminationForm.systemicExaminationForm
            .centralNervousSystemForm,
          benVisitID
        ),
        musculoskeletalSystemExamination: this.postMusculoSkeletalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .musculoSkeletalSystemForm,
          benVisitID
        ),
        genitoUrinarySystemExamination: this.postGenitoUrinarySystemForm(
          patientExaminationForm.systemicExaminationForm
            .genitoUrinarySystemForm,
          benVisitID
        ),
        obstetricExamination: this.postANCObstetricExamination(
          patientExaminationForm.systemicExaminationForm
            .obstetricExaminationForANCForm,
          benVisitID
        ),
      };
      return examDetailsData;
    }

    if (visitCategory === 'General OPD') {
      const examDetailsData: any = {
        generalExamination: this.postGeneralExaminationForm(
          patientExaminationForm.generalExaminationForm,
          benVisitID
        ),
        headToToeExamination: this.postHeadToToeExaminationForm(
          patientExaminationForm.headToToeExaminationForm,
          benVisitID
        ),
        gastroIntestinalExamination: this.postGastroIntestinalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .gastroIntestinalSystemForm,
          benVisitID
        ),
        cardioVascularExamination: this.postCardioVascularSystemForm(
          patientExaminationForm.systemicExaminationForm
            .cardioVascularSystemForm,
          benVisitID
        ),
        respiratorySystemExamination: this.postRespiratorySystemForm(
          patientExaminationForm.systemicExaminationForm.respiratorySystemForm,
          benVisitID
        ),
        centralNervousSystemExamination: this.postCentralNervousSystemForm(
          patientExaminationForm.systemicExaminationForm
            .centralNervousSystemForm,
          benVisitID
        ),
        musculoskeletalSystemExamination: this.postMusculoSkeletalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .musculoSkeletalSystemForm,
          benVisitID
        ),
        genitoUrinarySystemExamination: this.postGenitoUrinarySystemForm(
          patientExaminationForm.systemicExaminationForm
            .genitoUrinarySystemForm,
          benVisitID
        ),
      };
      return examDetailsData;
    }

    if (visitCategory === 'PNC') {
      const examDetailsData: any = {
        generalExamination: this.postGeneralExaminationForm(
          patientExaminationForm.generalExaminationForm,
          benVisitID
        ),
        headToToeExamination: this.postHeadToToeExaminationForm(
          patientExaminationForm.headToToeExaminationForm,
          benVisitID
        ),
        gastroIntestinalExamination: this.postGastroIntestinalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .gastroIntestinalSystemForm,
          benVisitID
        ),
        cardioVascularExamination: this.postCardioVascularSystemForm(
          patientExaminationForm.systemicExaminationForm
            .cardioVascularSystemForm,
          benVisitID
        ),
        respiratorySystemExamination: this.postRespiratorySystemForm(
          patientExaminationForm.systemicExaminationForm.respiratorySystemForm,
          benVisitID
        ),
        centralNervousSystemExamination: this.postCentralNervousSystemForm(
          patientExaminationForm.systemicExaminationForm
            .centralNervousSystemForm,
          benVisitID
        ),
        musculoskeletalSystemExamination: this.postMusculoSkeletalSystemForm(
          patientExaminationForm.systemicExaminationForm
            .musculoSkeletalSystemForm,
          benVisitID
        ),
        genitoUrinarySystemExamination: this.postGenitoUrinarySystemForm(
          patientExaminationForm.systemicExaminationForm
            .genitoUrinarySystemForm,
          benVisitID
        ),
      };
      return examDetailsData;
    }
    return new Observable(observer => {
      observer.complete();
    });
  }

  /**
   * General Examination Form ** Part of Examination Form for Non-Cancer (Generic)
   *
   */
  postGeneralExaminationForm(examinationForm: any, benVisitID: any) {
    const generalExaminationForm = Object.assign({}, examinationForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General examination', JSON.stringify(generalExaminationForm, null, 4));
    return generalExaminationForm;
  }

  /**
   * Head to Toe Examination Form ** Part of Examination Form for Non-Cancer (Generic)
   *
   */
  postHeadToToeExaminationForm(examinationForm: any, benVisitID: any) {
    const headToToeExaminationForm = Object.assign({}, examinationForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Head to Toe examination', JSON.stringify(headToToeExaminationForm, null, 4));
    return headToToeExaminationForm;
  }

  /**
   * Systemic Examination Form ** Part of Examination Form for Non-Cancer (Generic)
   */

  /**
   * Gastro Intestinal System Form
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-Cancer (Generic) !!
   */
  postGastroIntestinalSystemForm(systemForm: any, benVisitID: any) {
    const gastroIntestinalSystemForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Gastro Intestinal System', JSON.stringify(gastroIntestinalSystemForm, null, 4));
    return gastroIntestinalSystemForm;
  }

  /**
   * Cardio Vascular System Form
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-Cancer (Generic) !!
   *
   */
  postCardioVascularSystemForm(systemForm: any, benVisitID: any) {
    const cardioVascularSystemForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Cardio Vascular System', JSON.stringify(cardioVascularSystemForm, null, 4));
    return cardioVascularSystemForm;
  }

  /**
   * Respiratory System Form
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-Cancer (Generic) !!
   *
   */
  postRespiratorySystemForm(systemForm: any, benVisitID: any) {
    const respiratorySystemForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Respiratory System Form', JSON.stringify(respiratorySystemForm, null, 4));
    return respiratorySystemForm;
  }

  /**
   * Central Nervous System Form
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-CGeneraler (Generic) !!
   *
   */
  postCentralNervousSystemForm(systemForm: any, benVisitID: any) {
    const centralNervousSystemForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Central Nervous System', JSON.stringify(centralNervousSystemForm, null, 4));
    return centralNervousSystemForm;
  }

  /**
   * Musculo Skeletal System Form
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-CGeneraler (Generic) !!
   *
   */
  postMusculoSkeletalSystemForm(systemForm: any, benVisitID: any) {
    const musculoSkeletalSystemForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Musculo Skeletal System', JSON.stringify(musculoSkeletalSystemForm, null, 4));
    return musculoSkeletalSystemForm;
  }

  /**
   * Genito Urinary System Form
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-CGeneraler (Generic) !!
   *
   */
  postGenitoUrinarySystemForm(systemForm: any, benVisitID: any) {
    const genitoUrinarySystemForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('General Genito Urinary System', JSON.stringify(genitoUrinarySystemForm, null, 4));
    return genitoUrinarySystemForm;
  }

  /**
   * Obstetric Examination Form -- only for ANC Visit
   * !! Part of Systemic Examination Form ** Part of Examination Form for Non-Cancer (Generic) !!
   *
   */
  postANCObstetricExamination(systemForm: any, benVisitID: any) {
    const obstetricExaminationForANCForm = Object.assign({}, systemForm, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });
    // console.log('ANC Obstetric Examination', JSON.stringify(obstetricExaminationForANCForm, null, 4));
    return obstetricExaminationForANCForm;
  }

  /**
   * ANC History
   */
  postANCHistoryForm(generalHistoryForm: any, benVisitID: any, benAge: any) {
    const temp = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: null,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    if (benAge <= 16) {
      return {
        pastHistory: this.postGeneralPastHistory(
          generalHistoryForm.controls.pastHistory,
          temp
        ),
        comorbidConditions: this.postGeneralComorbidityHistory(
          generalHistoryForm.controls.comorbidityHistory,
          temp
        ),
        medicationHistory: this.postGeneralMedicationHistroy(
          generalHistoryForm.controls.medicationHistory,
          temp
        ),
        femaleObstetricHistory: this.postGeneralPastObstetricHistory(
          generalHistoryForm.controls.pastObstericHistory,
          temp
        ),
        menstrualHistory: this.postGeneralMenstrualHistory(
          generalHistoryForm.controls.menstrualHistory,
          temp
        ),
        familyHistory: this.postGeneralFamilyHistory(
          generalHistoryForm.controls.familyHistory,
          temp
        ),
        personalHistory: this.postGeneralPersonalHistory(
          generalHistoryForm.controls.personalHistory,
          temp
        ),
        childVaccineDetails: this.postGeneralOtherVaccines(
          generalHistoryForm.controls.otherVaccines,
          temp
        ),
        immunizationHistory: this.postGeneralImmunizationHistroy(
          generalHistoryForm.controls.immunizationHistory,
          temp
        ),
      };
    } else {
      return {
        pastHistory: this.postGeneralPastHistory(
          generalHistoryForm.controls.pastHistory,
          temp
        ),
        comorbidConditions: this.postGeneralComorbidityHistory(
          generalHistoryForm.controls.comorbidityHistory,
          temp
        ),
        medicationHistory: this.postGeneralMedicationHistroy(
          generalHistoryForm.controls.medicationHistory,
          temp
        ),
        femaleObstetricHistory: this.postGeneralPastObstetricHistory(
          generalHistoryForm.controls.pastObstericHistory,
          temp
        ),
        menstrualHistory: this.postGeneralMenstrualHistory(
          generalHistoryForm.controls.menstrualHistory,
          temp
        ),
        familyHistory: this.postGeneralFamilyHistory(
          generalHistoryForm.controls.familyHistory,
          temp
        ),
        personalHistory: this.postGeneralPersonalHistory(
          generalHistoryForm.controls.personalHistory,
          temp
        ),
      };
    }
  }

  postGeneralPastHistory(pastHistoryForm: any, otherDetails: any) {
    const pastHistoryFormValue = JSON.parse(
      JSON.stringify(pastHistoryForm.value)
    );
    const illness = pastHistoryFormValue.pastIllness.slice();
    illness.map((item: any) => {
      const temp = item.illnessType;
      if (temp) {
        item.illnessType = temp.illnessType;
        item.illnessTypeID = '' + temp.illnessID;
      }
    });

    const surgery = pastHistoryFormValue.pastSurgery.slice();
    surgery.map((item: any) => {
      const temp = item.surgeryType;
      if (temp) {
        item.surgeryType = temp.surgeryType;
        item.surgeryID = '' + temp.surgeryID;
      }
    });

    const historyData = Object.assign({}, pastHistoryFormValue, otherDetails, {
      pastIllness: illness,
      pastSurgery: surgery,
    });
    // console.log("History Data", JSON.stringify(historyData, null, 4));
    return historyData;
  }

  postGeneralComorbidityHistory(
    comorbidityHistoryForm: any,
    otherDetails: any
  ) {
    const comorbidityHistoryFormValue = JSON.parse(
      JSON.stringify(comorbidityHistoryForm.value)
    );
    const comorbidityConcurrentConditions =
      comorbidityHistoryFormValue.comorbidityConcurrentConditionsList;
    comorbidityConcurrentConditions.map((item: any) => {
      const temp = item.comorbidConditions;
      if (temp) {
        item.comorbidConditions = undefined;
        item.comorbidCondition = temp.comorbidCondition;
        item.comorbidConditionID = '' + temp.comorbidConditionID;
        item.isForHistory = !temp.isForHistory;
      }
    });
    const comorbidityData = Object.assign(
      {},
      comorbidityHistoryFormValue,
      otherDetails
    );

    // console.log("Comorbidity Data", JSON.stringify(comorbidityData, null, 4));
    return comorbidityData;
  }

  postGeneralDevelopmentHistory(
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

    // console.log("Development Data", JSON.stringify(developmentData, null, 4));
    return developmentData;
  }

  postGeneralFamilyHistory(familyHistoryForm: any, otherDetails: any) {
    const familyHistoryFormValue = JSON.parse(
      JSON.stringify(familyHistoryForm.value)
    );
    const familyDiseaseList = familyHistoryFormValue.familyDiseaseList;
    familyDiseaseList.map((item: any) => {
      if (item.diseaseType) {
        item.diseaseTypeID = '' + item.diseaseType.diseaseTypeID;
        item.diseaseType = item.diseaseType.diseaseType;
        // item.snomedCode = item.diseaseType.snomedCode;
        // item.snomedTerm = item.diseaseType.snomedTerm;
      }
    });
    const familyHistoryData = Object.assign(
      {},
      familyHistoryFormValue,
      otherDetails
    );

    // console.log("Family History Data", JSON.stringify(familyHistoryData, null, 4));
    return familyHistoryData;
  }

  postGeneralFeedingHistory(feedingHistoryForm: any, otherDetails: any) {
    const feedingHistoryFormValue = JSON.parse(
      JSON.stringify(feedingHistoryForm.value)
    );
    const feedingHistoryData = Object.assign(
      {},
      feedingHistoryFormValue,
      otherDetails,
      {
        foodIntoleranceStatus: +feedingHistoryFormValue.foodIntoleranceStatus,
      }
    );

    // console.log("Feeding Data", JSON.stringify(feedingHistoryData, null, 4));
    return feedingHistoryData;
  }

  postGeneralImmunizationHistroy(
    immunizationHistoryForm: any,
    otherDetails: any
  ) {
    const immunizationFormValue = JSON.parse(
      JSON.stringify(immunizationHistoryForm.value)
    );
    const immunizationList = immunizationFormValue.immunizationList;
    // console.log(formData, 'formdata');
    // formData.forEach((item)=>{
    //   item.vaccines.forEach((vaccine)=>{
    //     vaccine.status = ""+vaccine.status
    //   })
    // })
    const immunizationHistoryData = Object.assign(
      {},
      immunizationFormValue,
      { immunizationList: immunizationList },
      otherDetails
    );
    // console.log('immunization Data', JSON.stringify(immunizationHistoryData, null, 4));
    return immunizationHistoryData;
  }

  postGeneralMedicationHistroy(medicationHistoryForm: any, otherDetails: any) {
    const medicationHistoryFormValue = JSON.parse(
      JSON.stringify(medicationHistoryForm.value)
    );
    const medicationHistoryData = Object.assign(
      {},
      medicationHistoryFormValue,
      otherDetails
    );
    // console.log("Medication Data", JSON.stringify(medicationHistoryData, null, 4));
    return medicationHistoryData;
  }

  postGeneralMenstrualHistory(menstrualHistoryForm: any, otherDetails: any) {
    const menstrualHistoryFormValue = JSON.parse(
      JSON.stringify(menstrualHistoryForm.getRawValue())
    );
    const temp = menstrualHistoryFormValue;
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

    // if (temp.problemName) {
    //   temp.menstrualProblemID = "" + temp.problemName.menstrualProblemID;
    //   temp.problemName = temp.problemName.name;
    // }

    if (!temp.lMPDate) {
      temp.lMPDate = undefined;
    } else {
      temp.lMPDate = this.normalizeToUTCMidnight(new Date(temp.lMPDate));
    }
    const menstrualHistoryData = Object.assign({}, temp, otherDetails);

    // console.log("Menstrual History Data", JSON.stringify(menstrualHistoryData, null, 4));
    return menstrualHistoryData;
  }

  postGeneralOtherVaccines(otherVaccinesForm: any, otherDetails: any) {
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
      otherVaccinesFormValue,
      { otherVaccines: undefined, childOptionalVaccineList: otherVaccines },
      otherDetails
    );
    // console.log("Other vaccines Data", JSON.stringify(otherVaccinesData, null, 4));
    return otherVaccinesData;
  }

  postGeneralPastObstetricHistory(
    pastObstetricHistoryForm: any,
    otherDetails: any
  ) {
    const pastObstetricHistoryFormValue = JSON.parse(
      JSON.stringify(pastObstetricHistoryForm.value)
    );
    const pastObstetricList =
      pastObstetricHistoryFormValue.pastObstericHistoryList;
    pastObstetricList.map((item: any) => {
      // if (item.pregComplicationList) {
      //   item.pregComplicationList.map(complication => {
      //     complication.pregComplicationID = complication.complicationID;
      //     complication.pregComplicationType = complication.complicationType;
      //   })
      // }
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
      // if (item.deliveryComplicationType) {
      //   item.deliveryComplicationID = item.deliveryComplicationType.complicationID;
      //   item.deliveryComplicationType = item.deliveryComplicationType.complicationValue;
      // }
      // if (item.postpartumComplicationType) {
      //   item.postpartumComplicationID = item.postpartumComplicationType.complicationID;
      //   item.postpartumComplicationType = item.postpartumComplicationType.complicationValue;
      // }
      if (item.pregOutcome) {
        item.pregOutcomeID = item.pregOutcome.pregOutcomeID;
        item.pregOutcome = item.pregOutcome.pregOutcome;
      }
      // if (item.postNatalComplication) {
      //   item.postNatalComplicationID = item.postNatalComplication.complicationID;
      //   item.postNatalComplication = item.postNatalComplication.complicationValue;
      // }
      if (item.newBornComplication) {
        item.newBornComplicationID = item.newBornComplication.complicationID;
        item.newBornComplication = item.newBornComplication.complicationValue;
      }
    });
    const pastObstetricHistoryData = Object.assign(
      {},
      pastObstetricHistoryFormValue,
      otherDetails,
      {
        femaleObstetricHistoryList:
          pastObstetricHistoryFormValue.pastObstericHistoryList,
        pastObstericHistoryList: undefined,
      }
    );

    // console.log("Past Obstetric History Data", JSON.stringify(pastObstetricHistoryData, null, 4));
    return pastObstetricHistoryData;
  }

  postGeneralPerinatalHistory(perinatalHistroyForm: any, otherDetails: any) {
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
    console.log(
      'Perinatal History Data',
      JSON.stringify(perinatalHistoryData, null, 4)
    );

    return perinatalHistoryData;
  }

  postGeneralPersonalHistory(personalHistoryForm: any, otherDetails: any) {
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
      otherDetails,
      {
        riskySexualPracticesStatus: personalHistoryForm.value
          .riskySexualPracticesStatus
          ? +personalHistoryForm.value.riskySexualPracticesStatus
          : null,
        tobaccoList: tobaccoList,
        alcoholList: alcoholList,
        allergicList: allergyList,
      }
    );
    // console.log("Personal History Data", JSON.stringify(personalHistoryData, null, 4));
    return personalHistoryData;
  }

  getPreviousPastHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousPastHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousMedicationHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousMedicationHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousOtherVaccines(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousOtherVaccineHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousTobaccoHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousTobaccoHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousAlcoholHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousAlcoholHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousAllergyHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousAllergyHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousFamilyHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousFamilyHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousMenstrualHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousMestrualHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousObstetricHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousPastObstetricHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousComorbidityHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousComorbidityHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousDevelopmentalHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousDevelopmentHistory, {
      benRegID: benRegID,
    });
  }

  getPreviousPerinatalHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousPerinatalHistory, {
      benRegID: benRegID,
    });
  }

  getPreviousFeedingHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousFeedingHistory, {
      benRegID: benRegID,
    });
  }

  getPreviousImmunizationHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousImmunizationHistoryUrl, {
      benRegID: benRegID,
    });
  }

  getPreviousPhysicalActivityHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousPhyscialactivityHistoryUrl, {
      benRegID: benRegID,
    });
  }
  postNCDScreeningForm(medicalForm: any, visitCategory: any) {
    const serviceDetails = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: null,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    // WDF requirement
    // let postNCDScreeningFormValue = JSON.parse(JSON.stringify(medicalForm.controls['NCDScreeningForm'].value));
    // console.log('postNCDScreeningFormValue', JSON.stringify(postNCDScreeningFormValue, null, 4));

    // // if (postNCDScreeningFormValue.screeningCondition) {
    // //   postNCDScreeningFormValue.ncdScreeningConditionID = postNCDScreeningFormValue.screeningCondition.ncdScreeningConditionID;
    // //   postNCDScreeningFormValue.screeningCondition = postNCDScreeningFormValue.screeningCondition.ncdScreeningCondition;
    // // }

    // if (postNCDScreeningFormValue.reasonForScreening) {
    //   postNCDScreeningFormValue.ncdScreeningReasonID = postNCDScreeningFormValue.reasonForScreening.ncdScreeningReasonID;
    //   postNCDScreeningFormValue.reasonForScreening = postNCDScreeningFormValue.reasonForScreening.ncdScreeningReason;
    // }

    // if (postNCDScreeningFormValue.diabeticStatus) {
    //   postNCDScreeningFormValue.diabeticStatusID = postNCDScreeningFormValue.diabeticStatus.bpAndDiabeticStatusID;
    //   postNCDScreeningFormValue.diabeticStatus = postNCDScreeningFormValue.diabeticStatus.bpAndDiabeticStatus;
    // }

    // if (postNCDScreeningFormValue.bloodPressureStatus) {
    //   postNCDScreeningFormValue.bloodPressureStatusID = postNCDScreeningFormValue.bloodPressureStatus.bpAndDiabeticStatusID;
    //   postNCDScreeningFormValue.bloodPressureStatus = postNCDScreeningFormValue.bloodPressureStatus.bpAndDiabeticStatus;
    // }

    // if (postNCDScreeningFormValue.labTestOrders) {
    //   // procedureName
    //   let bP = false;
    //   let bG = false;

    //   postNCDScreeningFormValue.labTestOrders.filter((item) => {
    //     if (item.procedureName === 'BP Measurement') {
    //       bP = true;
    //     }
    //     if (item.procedureName === 'Blood Glucose Measurement') {
    //       bG = true;
    //     }
    //   })
    //   postNCDScreeningFormValue.isBloodGlucosePrescribed = bG;
    //   postNCDScreeningFormValue.isBPPrescribed = bP;
    // }

    const laboratoryList = [
      {
        procedureID: 31,
        procedureName: 'BP Measurement',
      },
      {
        procedureID: 31,
        procedureName: 'Blood Glucose Measurement',
      },
    ];

    // postNCDScreeningFormValue.labTestOrders = postNCDScreeningFormValue.screeningTestList;
    // postNCDScreeningFormValue.screeningTestList = undefined;

    // ncdScreeningVisitDetails
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    // let visitDetails = Object.assign({}, medicalForm.controls.patientVisitForm.controls.patientVisitDetailsForm.value, medicalForm.controls.patientVisitForm.controls.patientFileUploadDetailsForm.value, serviceDetails);
    // let ncdScreeningDetails = Object.assign({}, postNCDScreeningFormValue, serviceDetails);
    const ncdScreeningVitalDetails = Object.assign(
      {},
      medicalForm.controls.patientVitalsForm.value
    );
    const ncdScreeningidrsDetails = Object.assign(
      {},
      medicalForm.controls.idrsScreeningForm.value,
      serviceDetails
    );
    // let ncdScreeningVisitDetails = Object.assign({}, { 'visitDetails': visitDetails }, { 'ncdScreeningDetails': ncdScreeningDetails }, {
    //   benFlowID: this.sessionstorage.getItem('benFlowID'), beneficiaryID: this.sessionstorage.getItem('beneficiaryID'), sessionID: this.sessionstorage.getItem('sessionID'),
    //   parkingPlaceID: parkingPlaceID, vanID: vanID
    // });

    // let chiefComplaints=  Object.assign({}, medicalForm.controls.patientVisitForm.controls.patientChiefComplaintsForm.value);

    const ncdScreeningVisitDetails = Object.assign(
      {},
      {
        visitDetails: this.postGenericVisitDetailForm(
          medicalForm.controls.patientVisitForm,
          null,
          visitCategory
        ),
      },
      {
        vitalDetails: this.postGenericVitalForm(
          medicalForm.controls.patientVitalsForm,
          null
        ),
      },
      {
        historyDetails: this.postNCDScreeningHistoryForm(
          medicalForm.controls.patientHistoryForm,
          null,
          visitCategory
        ),
      },
      { idrsDetails: ncdScreeningidrsDetails },
      {
        benFlowID: this.sessionstorage.getItem('benFlowID'),
        beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
      }
    );

    console.log(
      'postNCDScreeningFormData',
      JSON.stringify(ncdScreeningVisitDetails, null, 4)
    );

    return this.http.post(
      environment.postNCDScreeningDetails,
      ncdScreeningVisitDetails
    );
  }

  postNurseGeneralOPDVisitForm(
    medicalForm: any,
    visitCategory: any,
    beneficiary: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const nurseGeneralOPDVisitDetails = {
      visitDetails: this.postGenericVisitDetailForm(
        medicalForm.controls.patientVisitForm,
        null,
        visitCategory
      ),
      vitalDetails: this.postGenericVitalForm(
        medicalForm.controls.patientVitalsForm,
        null
      ),
      historyDetails: this.postGeneralHistoryForm(
        medicalForm.controls.patientHistoryForm,
        beneficiary
      ),
      examinationDetails: this.postGenericExaminationForm(
        medicalForm.controls.patientExaminationForm.value,
        null,
        visitCategory
      ),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };

    console.log(
      'Nurse General OPD Visit Details',
      JSON.stringify(nurseGeneralOPDVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveNurseGeneralOPDDetails,
      nurseGeneralOPDVisitDetails
    );
  }

  postGeneralHistoryForm(generalHistoryForm: any, beneficiary: any) {
    // let patientHistoryFormValue = JSON.parse(JSON.stringify(patientHistoryForm));
    const temp = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: null,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    return {
      pastHistory: this.postGeneralPastHistory(
        generalHistoryForm.controls.pastHistory,
        temp
      ),
      comorbidConditions: this.postGeneralComorbidityHistory(
        generalHistoryForm.controls.comorbidityHistory,
        temp
      ),
      medicationHistory: this.postGeneralMedicationHistroy(
        generalHistoryForm.controls.medicationHistory,
        temp
      ),
      femaleObstetricHistory: this.postGeneralPastObstetricHistory(
        generalHistoryForm.controls.pastObstericHistory,
        temp
      ),
      menstrualHistory: this.postGeneralMenstrualHistory(
        generalHistoryForm.controls.menstrualHistory,
        temp
      ),
      familyHistory: this.postGeneralFamilyHistory(
        generalHistoryForm.controls.familyHistory,
        temp
      ),
      personalHistory: this.postGeneralPersonalHistory(
        generalHistoryForm.controls.personalHistory,
        temp
      ),
      childVaccineDetails: this.postGeneralOtherVaccines(
        generalHistoryForm.controls.otherVaccines,
        temp
      ),
      immunizationHistory: this.postGeneralImmunizationHistroy(
        generalHistoryForm.controls.immunizationHistory,
        temp
      ),
      developmentHistory: this.postGeneralDevelopmentHistory(
        generalHistoryForm.controls.developmentHistory,
        temp
      ),
      feedingHistory: this.postGeneralFeedingHistory(
        generalHistoryForm.controls.feedingHistory,
        temp
      ),
      perinatalHistroy: this.postGeneralPerinatalHistory(
        generalHistoryForm.controls.perinatalHistory,
        temp
      ),
    };
    // if (beneficiary.ageVal ) {
    //   return {
    //     "pastHistory": this.postGeneralPastHistory(generalHistoryForm.controls.pastHistory, temp),
    //     "comorbidConditions": this.postGeneralComorbidityHistory(generalHistoryForm.controls.comorbidityHistory, temp),
    //     "medicationHistory": this.postGeneralMedicationHistroy(generalHistoryForm.controls.medicationHistory, temp),
    //     "femaleObstetricHistory": this.postGeneralPastObstetricHistory(generalHistoryForm.controls.pastObstericHistory, temp),
    //     "menstrualHistory": this.postGeneralMenstrualHistory(generalHistoryForm.controls.menstrualHistory, temp),
    //     "familyHistory": this.postGeneralFamilyHistory(generalHistoryForm.controls.familyHistory, temp),
    //     "personalHistory": this.postGeneralPersonalHistory(generalHistoryForm.controls.personalHistory, temp),
    //     "childVaccineDetails": this.postGeneralOtherVaccines(generalHistoryForm.controls.otherVaccines, temp),
    //     "immunizationHistory": this.postGeneralImmunizationHistroy(generalHistoryForm.controls.immunizationHistory, temp),
    //   }
    // } else {
    //   return {
    //     "pastHistory": this.postGeneralPastHistory(generalHistoryForm.controls.pastHistory, temp),
    //     "comorbidConditions": this.postGeneralComorbidityHistory(generalHistoryForm.controls.comorbidityHistory, temp),
    //     "medicationHistory": this.postGeneralMedicationHistroy(generalHistoryForm.controls.medicationHistory, temp),
    //     "femaleObstetricHistory": this.postGeneralPastObstetricHistory(generalHistoryForm.controls.pastObstericHistory, temp),
    //     "menstrualHistory": this.postGeneralMenstrualHistory(generalHistoryForm.controls.menstrualHistory, temp),
    //     "familyHistory": this.postGeneralFamilyHistory(generalHistoryForm.controls.familyHistory, temp),
    //     "personalHistory": this.postGeneralPersonalHistory(generalHistoryForm.controls.personalHistory, temp),
    //   }
    // }
  }

  postNurseNCDCareVisitForm(
    medicalForm: any,
    visitCategory: any,
    beneficiary: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const nurseGeneralOPDVisitDetails = {
      visitDetails: this.postGenericVisitDetailForm(
        medicalForm.controls.patientVisitForm,
        null,
        visitCategory
      ),
      vitalDetails: this.postGenericVitalForm(
        medicalForm.controls.patientVitalsForm,
        null
      ),
      historyDetails: this.postGeneralHistoryForm(
        medicalForm.controls.patientHistoryForm,
        beneficiary
      ),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };

    console.log(
      'Nurse NCD CARE Visit Details',
      JSON.stringify(nurseGeneralOPDVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveNurseNCDCareDetails,
      nurseGeneralOPDVisitDetails
    );
  }

  postNurseCovidCareVisitForm(
    medicalForm: any,
    visitCategory: any,
    beneficiary: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const nurseGeneralOPDVisitDetails = {
      visitDetails: this.postGenericVisitDetailForm(
        medicalForm.controls.patientVisitForm,
        null,
        visitCategory
      ),
      vitalDetails: this.postGenericVitalForm(
        medicalForm.controls.patientVitalsForm,
        null
      ),
      historyDetails: this.postGeneralHistoryForm(
        medicalForm.controls.patientHistoryForm,
        beneficiary
      ),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };

    console.log(
      'Nurse Covid CARE Visit Details',
      JSON.stringify(nurseGeneralOPDVisitDetails, null, 4)
    );

    return this.http.post(
      environment.saveNurseCovidCareDetails,
      nurseGeneralOPDVisitDetails
    );
  }

  postNursePNCVisitForm(
    medicalForm: any,
    visitCategory: any,
    beneficiary: any
  ) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const nursePNCVisitDetails = {
      visitDetails: this.postGenericVisitDetailForm(
        medicalForm.controls.patientVisitForm,
        null,
        visitCategory
      ),
      pNCDeatils: this.postPNCDetailForm(
        medicalForm.controls.patientPNCForm,
        null
      ),
      vitalDetails: this.postGenericVitalForm(
        medicalForm.controls.patientVitalsForm,
        null
      ),
      historyDetails: this.postANCHistoryForm(
        medicalForm.controls.patientHistoryForm,
        null,
        beneficiary.ageVal
      ),
      examinationDetails: this.postGenericExaminationForm(
        medicalForm.controls.patientExaminationForm.value,
        null,
        visitCategory
      ),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };

    console.log(
      'Nurse PNC Visit Details',
      JSON.stringify(nursePNCVisitDetails, null, 4)
    );

    return this.http.post(
      environment.savePNCNurseDetailsUrl,
      nursePNCVisitDetails
    );
  }

  postPNCDetailForm(patientPNCForm: any, benVisitID: any) {
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
    if (temp.dDate) {
      temp.dateOfDelivery = this.normalizeToUTCMidnight(new Date(temp.dDate));
      temp.dDate = temp.dateOfDelivery;
    }

    const patientPNCDetails = Object.assign({}, temp, {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: benVisitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    });

    return patientPNCDetails;
  }

  getNcdScreeningVisitCount(beneficiaryRegID: any) {
    return this.http.get(
      environment.getNcdScreeningVisitCountUrl + beneficiaryRegID
    );
  }
  getCountryName() {
    return this.http.get(environment.getCountryName);
  }
  getCityName(countryID: any) {
    return this.http.get(environment.getCityName + countryID + '/');
  }
  getStateName(value: any) {
    return this.http.get(environment.getStateName + value);
  }
  getDistrictName(stateID: any) {
    return this.http.get(environment.getDistrictName + stateID);
  }
  getSubDistrictName(districtID: any) {
    return this.http.get(environment.getSubDistrictName + districtID);
  }

  postNCDScreeningHistoryForm(
    medicalForm: any,
    beneficiary: any,
    visitCategory: any
  ) {
    const temp = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: null,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    return {
      familyHistory: this.postGeneralFamilyHistory(
        medicalForm.controls.familyHistory,
        temp
      ),
      physicalActivityHistory: this.postPhyscialActivityHistory(
        medicalForm.controls.physicalActivityHistory,
        temp
      ),
      personalHistory: this.postGeneralPersonalHistory(
        medicalForm.controls.personalHistory,
        temp
      ),
    };
  }

  postPhyscialActivityHistory(physicalActivityHistory: any, otherDetails: any) {
    const physicalActivityHistoryForm = Object.assign(
      {},
      physicalActivityHistory.value,
      otherDetails
    );
    // console.log('General examination', JSON.stringify(generalExaminationForm, null, 4));
    return physicalActivityHistoryForm;
  }

  getPreviousReferredHistory(benRegID: string, visitCategory: any) {
    return this.http.post(environment.previousReferredHistoryUrl, {
      benRegID: benRegID,
    });
  }

  setNCDTemp(score: any) {
    this.temp = score;
    this.ncdTemp.next(score);
  }

  clearMessage() {
    this.temp = false;
    this.ncdTemp.next(false);
  }
  getTMReferredCasesheetData(reqObj: any) {
    return this.http.post(environment.getTMCasesheetData, reqObj);
  }

  calculateBmiStatus(obj: any) {
    return this.http.post(environment.calculateBmiStatus, obj);
  }

  setRbsSelectedInInvestigation(score: any) {
    this.rbsSelectedInvestigation = score;
    this.rbsSelectedInInvestigation.next(score);
  }

  clearRbsSelectedInInvestigation() {
    this.rbsSelectedInInvestigation.next(false);
  }
  setRbsInCurrentVitals(score: any) {
    this.rbsCurrentTestResult = score;
    this.rbsTestResultCurrent.next(score);
  }

  clearRbsInVitals() {
    this.rbsTestResultCurrent.next(null);
  }

  saveBenCovidVaccinationDetails(covidVaccineStatusForm: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const createdBy = this.sessionstorage.getItem('userName');
    const covidVaccineFormValues = covidVaccineStatusForm.value;
    let nurseCovidVaccinationDetails = {};
    if (
      covidVaccineFormValues.covidVSID !== undefined &&
      covidVaccineFormValues.covidVSID !== null
    ) {
      nurseCovidVaccinationDetails = {
        covidVSID: covidVaccineFormValues.covidVSID,
        beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
        vaccineStatus: covidVaccineFormValues.vaccineStatus,
        covidVaccineTypeID: covidVaccineFormValues.vaccineTypes,
        doseTypeID: covidVaccineFormValues.doseTaken,
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: createdBy,
        vanID: vanID,
        parkingPlaceID: parkingPlaceID,
        modifiedBy: createdBy,
      };
    } else {
      nurseCovidVaccinationDetails = {
        covidVSID: null,
        beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
        vaccineStatus: covidVaccineFormValues.vaccineStatus,
        covidVaccineTypeID: covidVaccineFormValues.vaccineTypes,
        doseTypeID: covidVaccineFormValues.doseTaken,
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: createdBy,
        vanID: vanID,
        parkingPlaceID: parkingPlaceID,
      };
    }

    return this.http.post(
      environment.saveCovidVaccinationDetailsUrl,
      nurseCovidVaccinationDetails
    );
  }

  setEnableLAssessment(score: any) {
    this.temp = score;
    this.enableLAssessment.next(score);
  }
  clearEnableLAssessment() {
    this.temp = false;
    this.enableLAssessment.next(false);
  }

  setNCDScreeningProvision(score: any) {
    this.temp = score;
    this.enableProvisionalDiag.next(score);
  }
  clearNCDScreeningProvision() {
    this.temp = false;
    this.enableProvisionalDiag.next(false);
  }
}
