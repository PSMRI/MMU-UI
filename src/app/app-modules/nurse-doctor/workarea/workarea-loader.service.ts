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
import { FormGroup } from '@angular/forms';
import { MasterdataService } from '../shared/services';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';

/**
 * Host contract the workarea data-loading getters read from / write to. The
 * WorkareaComponent satisfies it; passing `this` keeps identical state and
 * service instances, so behaviour is unchanged.
 */
export interface WorkareaLoaderHost {
  patientMedicalForm: FormGroup;
  visitCategory: any;
  visitCategoryList: any;
  findings: any;
  beneficiary: any;
  beneficiaryAge: any;
  beneficiaryDetailsSubscription: any;
  visitDetailMasterDataSubscription: any;
  pregnancyStatus: any;
  currentVitals: any;
  primeGravidaStatus: any;
  masterdataService: MasterdataService;
  sessionstorage: SessionStorageService;
  beneficiaryDetailsService: BeneficiaryDetailsService;
}

/**
 * Beneficiary / master-data / vitals / diagnosis loading + form-patch helpers
 * extracted from WorkareaComponent (behaviour-identical). State and service
 * instances arrive via `host`.
 */
@Injectable({ providedIn: 'root' })
export class WorkareaLoaderService {
  getBeneficiaryDetails(host: WorkareaLoaderHost) {
    host.beneficiaryDetailsSubscription =
      host.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          if (beneficiary) {
            host.beneficiary = beneficiary;
            host.beneficiaryAge = beneficiary.ageVal;
            console.log('beneficiary', beneficiary);
          }
        }
      );
  }

  getVisitReasonAndCategory(host: WorkareaLoaderHost) {
    host.masterdataService.getVisitDetailMasterData();
    host.visitDetailMasterDataSubscription =
      host.masterdataService.visitDetailMasterData$.subscribe(visitDetails => {
        if (visitDetails) {
          host.visitCategoryList = visitDetails.visitCategories;
          console.log('Visit Details Master Data', visitDetails);

          if (host.visitCategory) {
            this.getNurseMasterData(host.visitCategory, host);
            this.getDoctorMasterData(host.visitCategory, host);
          }
        }
      });
  }

  getNurseMasterData(visitCategory: string, host: WorkareaLoaderHost) {
    const visitID = this.getVisitCategoryID(visitCategory, host);
    const serviceProviderID = host.sessionstorage.getItem('providerServiceID');

    if (visitID)
      host.masterdataService.getNurseMasterData(visitID, serviceProviderID);
  }

  getDoctorMasterData(visitCategory: string, host: WorkareaLoaderHost) {
    const visitID = this.getVisitCategoryID(visitCategory, host);
    const serviceProviderID = host.sessionstorage.getItem('providerServiceID');

    if (visitID)
      host.masterdataService.getDoctorMasterData(visitID, serviceProviderID);
  }

  getVisitCategoryID(visitCategory: string, host: WorkareaLoaderHost) {
    if (visitCategory && host.visitCategoryList) {
      const temp = host.visitCategoryList.filter((category: any) => {
        return category.visitCategory === visitCategory;
      });
      if (temp.length > 0) return temp[0].visitCategoryID;
    }
    return null;
  }

  getPregnancyStatus(host: WorkareaLoaderHost) {
    const pg = <FormGroup>host.patientMedicalForm.controls['patientVisitForm'];
    pg.controls['patientVisitDetailsForm'].valueChanges.subscribe(value => {
      if (value.pregnancyStatus) {
        host.pregnancyStatus = value.pregnancyStatus;
      } else {
        host.pregnancyStatus = null;
      }
    });
  }

  patchGravidaValue(host: WorkareaLoaderHost) {
    const af = host.patientMedicalForm.controls['patientANCForm'] as FormGroup;
    const pof = (<FormGroup>(
      host.patientMedicalForm.controls['patientHistoryForm']
    )).controls['pastObstericHistory'] as FormGroup;

    (<FormGroup>af.controls['obstetricFormulaForm']).controls[
      'gravida_G'
    ].valueChanges.subscribe(value => {
      if (pof && value && value > 1)
        pof.controls['totalNoOfPreg'].setValue(value);
    });
  }

  getCurrentVitals(host: WorkareaLoaderHost) {
    host.patientMedicalForm.controls[
      'patientVitalsForm'
    ].valueChanges.subscribe(value => {
      if (value) {
        host.currentVitals = value;
      }
    });
  }

  patchCancerFindings(host: WorkareaLoaderHost) {
    host.patientMedicalForm.valueChanges.subscribe(
      (patientMedicalForm: any) => {
        host.findings = {
          briefHistory:
            patientMedicalForm.patientExaminationForm.signsForm.observation,
          oralExamination:
            patientMedicalForm.patientExaminationForm.oralExaminationForm
              .observation,
          abdominalExamination:
            patientMedicalForm.patientExaminationForm.abdominalExaminationForm
              .observation,
          gynecologicalExamination:
            patientMedicalForm.patientExaminationForm
              .gynecologicalExaminationForm.observation,
        };
      }
    );
  }

  getANCDiagnosis(host: WorkareaLoaderHost) {
    const ANCForm = <FormGroup>(
      host.patientMedicalForm.controls['patientANCForm']
    );
    const CaseRecordForm = <FormGroup>(
      host.patientMedicalForm.controls['patientCaseRecordForm']
    );

    ANCForm.controls['obstetricFormulaForm'].valueChanges.subscribe(value => {
      CaseRecordForm.controls['generalDiagnosisForm'].patchValue(value);
    });
    ANCForm.controls['patientANCDetailsForm'].valueChanges.subscribe(value => {
      CaseRecordForm.controls['generalDiagnosisForm'].patchValue(value);
    });
  }

  getPrimeGravidaStatus(host: WorkareaLoaderHost) {
    const ANCForm = <FormGroup>(
      host.patientMedicalForm.controls['patientANCForm']
    );
    (<FormGroup>ANCForm.controls['patientANCDetailsForm']).controls[
      'primiGravida'
    ].valueChanges.subscribe(value => {
      host.primeGravidaStatus = value;
    });
  }

  patchLMPDate(host: WorkareaLoaderHost) {
    const patientANCDetailsForm = (<FormGroup>(
      host.patientMedicalForm.controls['patientANCForm']
    )).controls['patientANCDetailsForm'];
    const menstrualHistoryForm = (<FormGroup>(
      host.patientMedicalForm.controls['patientHistoryForm']
    )).controls['menstrualHistory'];

    patientANCDetailsForm.valueChanges.subscribe(value => {
      if (value.lmpDate) {
        const temp = new Date(value.lmpDate);
        menstrualHistoryForm.patchValue({ lMPDate: temp });
      }
    });
  }

  patchGeneralFinding(host: WorkareaLoaderHost) {
    const patientChiefComplaintsForm = (<FormGroup>(
      host.patientMedicalForm.controls['patientVisitForm']
    )).controls['patientChiefComplaintsForm'];

    patientChiefComplaintsForm.valueChanges.subscribe(value => {
      host.findings = value;
    });
  }
}
