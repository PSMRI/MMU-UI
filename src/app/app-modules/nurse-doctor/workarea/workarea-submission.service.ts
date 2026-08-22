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
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService, NurseService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';

/**
 * Host contract the workarea submission flows read from / call back into. The
 * WorkareaComponent satisfies it; passing `this` keeps identical state and
 * service instances, so behaviour is unchanged.
 */
export interface WorkareaSubmissionHost {
  patientMedicalForm: FormGroup;
  patientReferForm: FormGroup;
  patientVisitForm: FormGroup;
  schedulerData: any;
  visitID: any;
  beneficiaryRegID: any;
  doctorSignatureFlag: any;
  visitCategory: any;
  beneficiary: any;
  currentLanguageSet: any;
  showProgressBar: any;
  disableSubmitButton: any;
  isSpecialist: any;
  router: Router;
  doctorService: DoctorService;
  nurseService: NurseService;
  confirmationService: ConfirmationService;
  sessionstorage: SessionStorageService;
  resetSpinnerandEnableTheSubmitButton(): any;
  onSubmitSuccess(): any;
  checkNurseRequirements(medicalForm: any): any;
  checkCancerRequiredData(medicalForm: any): any;
  checkNCDScreeningRequiredData(medicalForm: any): any;
  checkTMVisitDetailsRequiredData(medicalForm: any): any;
  checkQuickConsultDoctorData(patientMedicalForm: any): any;
  removeBeneficiaryDataForDoctorVisit(): any;
  removeBeneficiaryDataForNurseVisit(): any;
  getLabandPrescriptionData(): any;
  getImageCoordinates(patientMedicalForm: any): any;
  SMSObjectCreation(
    diagnosisList: any,
    prescriptions: any,
    prescribedDrugIDs: any
  ): any;
  sendPrescriptionSms(prescriptionSmsObject: any): any;
}

/**
 * Nurse-visit / doctor-diagnosis submission flows extracted from
 * WorkareaComponent (behaviour-identical). Stateless — component state and
 * service instances arrive via `host`.
 */
@Injectable({ providedIn: 'root' })
export class WorkareaSubmissionService {
  // Shared success / error handling for the submit flows below. Each flow only
  // differs in the success-message field, the worklist it returns to, and an
  // optional cleanup step, so the response wiring lives here once instead of
  // being copied into every subscribe.
  private handleSubmitResponse(
    host: WorkareaSubmissionHost,
    res: any,
    field: 'message' | 'response',
    nav: 'nurse' | 'doctor' | 'specialist',
    cleanup?: (host: WorkareaSubmissionHost) => void
  ): void {
    if (res.statusCode === 200 && res.data !== null) {
      host.onSubmitSuccess();
      if (cleanup) cleanup(host);
      host.confirmationService.alert(res.data[field], 'success');
      this.navigateAfterSubmit(host, nav);
    } else {
      host.resetSpinnerandEnableTheSubmitButton();
      host.confirmationService.alert(res.errorMessage, 'error');
    }
  }

  private handleSubmitError(host: WorkareaSubmissionHost, err: any): void {
    host.resetSpinnerandEnableTheSubmitButton();
    host.confirmationService.alert(err, 'error');
  }

  private navigateAfterSubmit(
    host: WorkareaSubmissionHost,
    nav: 'nurse' | 'doctor' | 'specialist'
  ): void {
    if (nav === 'nurse') {
      host.router.navigate(['/nurse-doctor/nurse-worklist']);
    } else if (nav === 'specialist' && host.isSpecialist) {
      host.router.navigate(['/common/tcspecialist-worklist']);
    } else {
      host.router.navigate(['/nurse-doctor/doctor-worklist']);
    }
  }

  submitPatientMedicalDetailsForm(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    host.disableSubmitButton = true;
    host.showProgressBar = true;

    const serviceLineDetails: any =
      host.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = host.sessionstorage.getItem('serviceID');
    const createdBy = host.sessionstorage.getItem('userName');
    const benVisitDetails = {
      benFlowID: host.sessionstorage.getItem('benFlowID'),
      beneficiaryID: host.sessionstorage.getItem('beneficiaryID'),
      sessionID: host.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };
    const temp = {
      beneficiaryRegID: '' + host.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
      createdBy: host.sessionstorage.getItem('userName'),
    };
    if (host.visitCategory === 'Cancer Screening')
      this.submitNurseCancerVisitDetails(medicalForm, host);

    if (host.visitCategory === 'NCD screening')
      this.submitNurseNCDScreeningVisitDetails(medicalForm, host);

    if (host.visitCategory === 'General OPD (QC)')
      this.submitNurseQuickConsultVisitDetails(medicalForm, host);

    if (host.visitCategory === 'ANC')
      this.submitNurseANCVisitDetails(medicalForm, host);

    if (host.visitCategory === 'PNC')
      this.submitPatientMedicalDetailsPNC(medicalForm, host);

    if (host.visitCategory === 'General OPD')
      this.submitNurseGeneralOPDVisitDetails(medicalForm, host);

    if (host.visitCategory === 'NCD care')
      this.submitNurseNCDcareVisitDetails(medicalForm, host);

    if (host.visitCategory === 'COVID-19 Screening')
      this.submitNurseCovidcareVisitDetails(medicalForm, host);
  }

  submitDoctorDiagnosisForm(host: WorkareaSubmissionHost) {
    host.disableSubmitButton = true;
    // host.showProgressBar = true;

    if (host.visitCategory === 'Cancer Screening')
      this.submitCancerDiagnosisForm(host);

    if (host.visitCategory === 'General OPD (QC)')
      this.submitQuickConsultDiagnosisForm(host);

    if (host.visitCategory === 'ANC') this.submitANCDiagnosisForm(host);

    if (host.visitCategory === 'PNC') this.submitPNCDiagnosisForm(host);

    if (host.visitCategory === 'General OPD')
      this.submitGeneralOPDDiagnosisForm(host);

    if (host.visitCategory === 'NCD care')
      this.submitNCDCareDiagnosisForm(host);

    if (host.visitCategory === 'COVID-19 Screening')
      this.submitCovidCareDiagnosisForm(host);

    if (host.visitCategory === 'NCD screening')
      this.submitNCDScreeningDiagnosisForm(host);
  }

  updateDoctorDiagnosisForm(host: WorkareaSubmissionHost) {
    host.disableSubmitButton = true;
    host.showProgressBar = true;
    const serviceLineDetails: any =
      host.sessionstorage.getItem('serviceLineDetails');

    const visitCategory = host.sessionstorage.getItem('visitCategory');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const otherDetails = {
      beneficiaryRegID: host.beneficiaryRegID,
      benVisitID: host.visitID,
      providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
      createdBy: host.sessionstorage.getItem('userName'),
      sessionID: host.sessionstorage.getItem('sessionID'),
      beneficiaryID: host.sessionstorage.getItem('beneficiaryID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      visitCode: host.sessionstorage.getItem('visitCode'),
      serviceID: host.sessionstorage.getItem('serviceID'),
      benFlowID: host.sessionstorage.getItem('benFlowID'),
      isSpecialist: host.isSpecialist,
    };

    const prescribedDrugs = host.getLabandPrescriptionData();

    if (visitCategory === 'Cancer Screening') {
      if (host.checkCancerRequiredData(host.patientMedicalForm)) {
        host.doctorService
          .saveSpecialistCancerObservation(
            host.patientMedicalForm,
            otherDetails,
            host.doctorSignatureFlag
          )
          .subscribe(
            (res: any) =>
              this.handleSubmitResponse(host, res, 'message', 'specialist'),
            (err: any) => this.handleSubmitError(host, err)
          );
      }
    } else if (visitCategory === 'NCD screening') {
      if (host.checkNCDScreeningRequiredData(host.patientMedicalForm)) {
        host.doctorService
          .updateDoctorDiagnosisDetails(
            host.patientMedicalForm,
            visitCategory,
            otherDetails,
            host.schedulerData,
            host.doctorSignatureFlag
          )
          .subscribe(
            (res: any) =>
              this.handleSubmitResponse(
                host,
                res,
                'message',
                'specialist',
                () => {
                  sessionStorage.removeItem('instFlag');
                  sessionStorage.removeItem('suspectFlag');
                }
              ),
            (err: any) => this.handleSubmitError(host, err)
          );
      }
    } else {
      if (host.checkNurseRequirements(host.patientMedicalForm)) {
        host.doctorService
          .updateDoctorDiagnosisDetails(
            host.patientMedicalForm,
            visitCategory,
            otherDetails,
            host.schedulerData,
            host.doctorSignatureFlag
          )
          .subscribe(
            (res: any) =>
              this.handleSubmitResponse(host, res, 'message', 'specialist'),
            (err: any) => this.handleSubmitError(host, err)
          );
      }
    }
  }

  submitNurseCancerVisitDetails(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkCancerRequiredData(medicalForm)) {
      // check if the form is valid
      const imageCoordiantes = host.getImageCoordinates(medicalForm);
      host.showProgressBar = false;

      host.confirmationService
        .confirm(
          `info`,
          host.currentLanguageSet.alerts.info.doctorVisit,
          'Yes',
          'No'
        )
        .subscribe(result => {
          if (result !== undefined && result !== null)
            host.nurseService
              .postNurseCancerVisitForm(medicalForm, imageCoordiantes, result)
              .subscribe(
                (res: any) => {
                  if (res.statusCode === 200 && res.data !== null) {
                    host.onSubmitSuccess();
                    host.removeBeneficiaryDataForNurseVisit();
                    host.confirmationService.alert(
                      res.data.response,
                      'success'
                    );
                    host.router.navigate(['/nurse-doctor/nurse-worklist']);
                  } else if (res.statusCode === 9999) {
                    host.onSubmitSuccess();
                    host.removeBeneficiaryDataForNurseVisit();
                    host.confirmationService.alert(res.errorMessage, 'info');
                    host.router.navigate(['/nurse-doctor/nurse-worklist']);
                  } else {
                    host.resetSpinnerandEnableTheSubmitButton();
                    host.confirmationService.alert(res.errorMessage, 'error');
                  }
                },
                err => {
                  host.resetSpinnerandEnableTheSubmitButton();
                  host.confirmationService.alert(err, 'error');
                }
              );
        });
    }
  }

  submitCancerDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkCancerRequiredData(host.patientMedicalForm)) {
      // check if the form is valid
      host.doctorService
        .postDoctorCancerVisitDetails(
          host.patientMedicalForm,
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitTMPatientVisitForm(medicalForm: any, host: WorkareaSubmissionHost) {
    if (host.checkTMVisitDetailsRequiredData(medicalForm)) {
      const tmVisitForm = <FormGroup>medicalForm.controls['patientVisitForm'];
      const tmPatientVisitDetails = <FormGroup>(
        tmVisitForm.controls['tmcConfirmationForm'].value
      );
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };
      console.log(
        'TM Patient Visit Details',
        JSON.stringify(tmPatientVisitDetails)
      );
      host.doctorService
        .postTMReferedNurseDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              host.onSubmitSuccess();
              host.removeBeneficiaryDataForDoctorVisit();
              host.confirmationService.alert(res.data.response, 'success');
              host.doctorService.prescribedDrugData = null;
              host.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              host.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            host.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  submitNurseQuickConsultVisitDetails(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkNurseRequirements(medicalForm)) {
      host.nurseService.postNurseGeneralQCVisitForm(medicalForm).subscribe(
        (res: any) =>
          this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
            h.removeBeneficiaryDataForNurseVisit()
          ),
        (err: any) => this.handleSubmitError(host, err)
      );
    }
  }

  submitQuickConsultDiagnosisForm(host: WorkareaSubmissionHost) {
    const otherQcDetails = {
      beneficiaryRegID: host.beneficiaryRegID,
      benVisitID: host.visitID,
      visitCode: host.sessionstorage.getItem('visitCode'),
      providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
      createdBy: host.sessionstorage.getItem('userName'),
    };

    const valid = host.checkQuickConsultDoctorData(host.patientMedicalForm);
    if (valid) {
      const patientQuickConsultForm = <FormGroup>(
        host.patientMedicalForm.controls['patientQuickConsultForm']
      );
      const patientQuickConsultFormValue = JSON.parse(
        JSON.stringify(patientQuickConsultForm.value)
      );
      console.log(patientQuickConsultFormValue, 'formValue');
      const chiefComplaintList =
        patientQuickConsultFormValue.chiefComplaintList;
      chiefComplaintList.forEach((element: any) => {
        if (element.chiefComplaint) {
          element.chiefComplaintID = element.chiefComplaint.chiefComplaintID;
          element.chiefComplaint = element.chiefComplaint.chiefComplaint;
        }
      });

      let prescribedDrugs =
        patientQuickConsultFormValue.prescription.prescribedDrugs;
      prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);
      patientQuickConsultFormValue.prescription = prescribedDrugs;

      let labTestOrders = [];
      if (
        patientQuickConsultFormValue.test !== null &&
        patientQuickConsultFormValue.radiology !== null
      ) {
        labTestOrders = patientQuickConsultFormValue.test.concat(
          patientQuickConsultFormValue.radiology
        );
      } else if (patientQuickConsultFormValue.test !== null) {
        labTestOrders = Object.assign([], patientQuickConsultFormValue.test);
      } else {
        labTestOrders = Object.assign(
          [],
          patientQuickConsultFormValue.radiology
        );
      }

      patientQuickConsultFormValue.labTestOrders = labTestOrders;
      patientQuickConsultFormValue.test = undefined;
      patientQuickConsultFormValue.radiology = undefined;
      patientQuickConsultFormValue.refer = host.doctorService.postGeneralRefer(
        host.patientReferForm,
        otherQcDetails
      );

      host.doctorService
        .postQuickConsultDetails(
          { quickConsultation: patientQuickConsultFormValue },
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  updateQuickConsultDiagnosisForm(host: WorkareaSubmissionHost) {
    const patientQuickConsultDetails = this.mapDoctorQuickConsultDetails(host);
    const prescribedDrugs = patientQuickConsultDetails.prescription || [];
    host.doctorService
      .updateQuickConsultDetails(
        { quickConsultation: patientQuickConsultDetails },
        host.schedulerData,
        host.isSpecialist,
        host.doctorSignatureFlag
      )
      .subscribe(
        (res: any) =>
          this.handleSubmitResponse(host, res, 'message', 'specialist'),
        (err: any) => this.handleSubmitError(host, err)
      );
  }

  mapDoctorQuickConsultDetails(host: WorkareaSubmissionHost) {
    const serviceLineDetails: any =
      host.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const otherQcDetails = {
      beneficiaryRegID: host.beneficiaryRegID,
      benVisitID: host.visitID,
      providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
      createdBy: host.sessionstorage.getItem('userName'),
      sessionID: host.sessionstorage.getItem('sessionID'),
      beneficiaryID: host.sessionstorage.getItem('beneficiaryID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      visitCode: host.sessionstorage.getItem('visitCode'),
      serviceID: host.sessionstorage.getItem('serviceID'),
      benFlowID: host.sessionstorage.getItem('benFlowID'),
      isSpecialist: host.isSpecialist,
    };
    const patientQuickConsultForm = <FormGroup>(
      host.patientMedicalForm.controls['patientQuickConsultForm']
    );
    const patientQuickConsultDetails = JSON.parse(
      JSON.stringify(patientQuickConsultForm.value)
    );
    let prescribedDrugs =
      patientQuickConsultDetails.prescription.prescribedDrugs;
    prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);
    patientQuickConsultDetails.prescription = prescribedDrugs;

    const chiefComplaintList = patientQuickConsultDetails.chiefComplaintList;
    chiefComplaintList.forEach((element: any) => {
      if (element.chiefComplaint) {
        element.chiefComplaintID = element.chiefComplaint.chiefComplaintID;
        element.chiefComplaint = element.chiefComplaint.chiefComplaint;
      }
    });

    let labTestOrders = [];
    if (
      patientQuickConsultDetails.test !== null &&
      patientQuickConsultDetails.radiology !== null
    ) {
      labTestOrders = patientQuickConsultDetails.test.concat(
        patientQuickConsultDetails.radiology
      );
    } else if (patientQuickConsultDetails.test !== null) {
      labTestOrders = Object.assign([], patientQuickConsultDetails.test);
    } else {
      labTestOrders = Object.assign([], patientQuickConsultDetails.radiology);
    }
    labTestOrders = labTestOrders.filter((test: any) => !test.disabled);

    patientQuickConsultDetails.labTestOrders = labTestOrders;
    patientQuickConsultDetails.chiefComplaintList = chiefComplaintList;
    patientQuickConsultDetails.prescribedDrugs = prescribedDrugs;
    patientQuickConsultDetails.test = undefined;
    patientQuickConsultDetails.radiology = undefined;
    host.patientReferForm = host.patientMedicalForm.get(
      'patientReferForm'
    ) as FormGroup;
    patientQuickConsultDetails.refer = host.doctorService.postGeneralRefer(
      host.patientReferForm,
      otherQcDetails
    );

    return patientQuickConsultDetails;
  }

  submitNurseANCVisitDetails(medicalForm: any, host: WorkareaSubmissionHost) {
    if (host.checkNurseRequirements(medicalForm)) {
      host.nurseService
        .postNurseANCVisitForm(
          medicalForm,
          null,
          host.visitCategory,
          host.beneficiary.ageVal
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
              h.removeBeneficiaryDataForNurseVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitANCDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkNurseRequirements(host.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };
      const prescribedDrugs = host.getLabandPrescriptionData();
      host.doctorService
        .postDoctorANCDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitNurseNCDcareVisitDetails(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkNurseRequirements(medicalForm)) {
      host.nurseService
        .postNurseNCDCareVisitForm(
          medicalForm,
          host.visitCategory,
          host.beneficiary
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
              h.removeBeneficiaryDataForNurseVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitNurseCovidcareVisitDetails(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkNurseRequirements(medicalForm)) {
      host.nurseService
        .postNurseCovidCareVisitForm(
          medicalForm,
          host.visitCategory,
          host.beneficiary
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
              h.removeBeneficiaryDataForNurseVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitNurseNCDScreeningVisitDetails(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkNCDScreeningRequiredData(medicalForm)) {
      host.nurseService
        .postNCDScreeningForm(medicalForm, host.visitCategory)
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
              h.removeBeneficiaryDataForNurseVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitNCDCareDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkNurseRequirements(host.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };

      const patientVisitForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const prescribedDrugs = host.getLabandPrescriptionData();

      host.doctorService
        .postDoctorNCDCareDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitCovidCareDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkNurseRequirements(host.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };

      const patientVisitForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );

      host.doctorService
        .postDoctorCovidCareDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitNCDScreeningDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkNCDScreeningRequiredData(host.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };

      const patientVisitForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );

      const prescribedDrugs = host.getLabandPrescriptionData();

      host.doctorService
        .postDoctorNCDScreeningDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h => {
              h.removeBeneficiaryDataForDoctorVisit();
              sessionStorage.removeItem('instFlag');
              sessionStorage.removeItem('suspectFlag');
            }),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitPatientMedicalDetailsPNC(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkNurseRequirements(medicalForm)) {
      host.nurseService
        .postNursePNCVisitForm(
          medicalForm,
          host.visitCategory,
          host.beneficiary
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
              h.removeBeneficiaryDataForNurseVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitNurseGeneralOPDVisitDetails(
    medicalForm: any,
    host: WorkareaSubmissionHost
  ) {
    if (host.checkNurseRequirements(medicalForm)) {
      host.nurseService
        .postNurseGeneralOPDVisitForm(
          medicalForm,
          host.visitCategory,
          host.beneficiary
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'response', 'nurse', h =>
              h.removeBeneficiaryDataForNurseVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitGeneralOPDDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkNurseRequirements(host.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };
      const patientVisitForm = <FormGroup>(
        host.patientMedicalForm.controls['patientCaseRecordForm']
      );

      const prescribedDrugs = host.getLabandPrescriptionData();

      host.doctorService
        .postDoctorGeneralOPDDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }

  submitPNCDiagnosisForm(host: WorkareaSubmissionHost) {
    if (host.checkNurseRequirements(host.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: host.beneficiaryRegID,
        benVisitID: host.visitID,
        visitCode: host.sessionstorage.getItem('visitCode'),
        providerServiceMapID: host.sessionstorage.getItem('providerServiceID'),
        createdBy: host.sessionstorage.getItem('userName'),
      };

      const prescribedDrugs = host.getLabandPrescriptionData();
      host.doctorService
        .postDoctorPNCDetails(
          host.patientMedicalForm,
          temp,
          host.schedulerData,
          host.doctorSignatureFlag
        )
        .subscribe(
          (res: any) =>
            this.handleSubmitResponse(host, res, 'message', 'doctor', h =>
              h.removeBeneficiaryDataForDoctorVisit()
            ),
          (err: any) => this.handleSubmitError(host, err)
        );
    }
  }
}
