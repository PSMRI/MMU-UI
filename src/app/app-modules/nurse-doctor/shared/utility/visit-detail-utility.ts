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

import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

export class VisitDetailUtils {
  constructor(
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService
  ) {}

  createPatientVisitForm(diasableFlag: boolean = false) {
    return this.fb.group({
      patientVisitDetailsForm: this.createPatientVisitDetails(diasableFlag),
      patientChiefComplaintsForm:
        this.createANCPatientChiefComplaintArrayForm(diasableFlag),
      patientAdherenceForm: this.createPatientAdherenceForm(diasableFlag),
      patientInvestigationsForm:
        this.createPatientInvestigationsForm(diasableFlag),
      patientCovidForm: this.createPatientCovidForm(diasableFlag),
      patientFileUploadDetailsForm:
        this.createPatientFileUploadDetailsForm(diasableFlag),
      patientDiseaseForm: this.createPatientDiseaseForm(diasableFlag),
      tmcConfirmationForm: this.createPatientTmcConfirmationForm(diasableFlag),
      covidVaccineStatusForm: this.createCovidVaccineStatusForm(diasableFlag),
    });
  }

  createPatientAdherenceForm(disableFlag: boolean = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      createdBy: null,
      toDrugs: { value: null, disabled: disableFlag },
      drugReason: { value: null, disabled: disableFlag },
      toReferral: { value: null, disabled: disableFlag },
      referralReason: { value: null, disabled: disableFlag },
      progress: { value: null, disabled: disableFlag },
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createPatientInvestigationsForm(disableFlag: boolean = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      createdBy: null,
      laboratoryList: { value: [], disabled: disableFlag },
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createANCPatientChiefComplaintArrayForm(disableFlag: boolean = false) {
    return this.fb.group({
      complaints: this.fb.array([
        this.createPatientChiefComplaintsForm(disableFlag),
      ]),
    });
  }

  createPatientChiefComplaintsForm(disableFlag = false): FormGroup {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      conceptID: null,
      chiefComplaint: { value: null, disabled: disableFlag },
      chiefComplaintID: { value: null, disabled: disableFlag },
      duration: { value: null, disabled: true },
      unitOfDuration: { value: null, disabled: true },
      description: { value: null, disabled: true },
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createPatientVisitDetails(disableFlag: boolean = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      providerServiceMapID: null,
      visitNo: null,
      visitCode: { value: null, disabled: true },
      visitReason: { value: null, disabled: disableFlag },
      visitCategory: { value: null, disabled: disableFlag },
      pregnancyStatus: { value: null, disabled: disableFlag },
      rCHID: { value: null, disabled: disableFlag },
      healthFacilityType: null,
      healthFacilityLocation: null,
      reportFilePath: null,
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }
  createPatientFileUploadDetailsForm(disableFlag: boolean = false) {
    return this.fb.group({
      fileIDs: null,
    });
  }

  createPatientCovidForm(disableFlag: boolean = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      conceptID: null,
      symptom: [{ value: null, disabled: disableFlag }, Validators.required],
      contactStatus: [
        { value: null, disabled: disableFlag },
        Validators.required,
      ],
      travelStatus: { value: null, disabled: disableFlag },
      travelList: this.fb.array([]),
      modeOfTravelDomestic: { value: null, disabled: disableFlag },
      fromStateDom: { value: null, disabled: disableFlag },
      fromDistrictDom: { value: null, disabled: disableFlag },
      fromSubDistrictDom: { value: null, disabled: disableFlag },
      toStateDom: { value: null, disabled: disableFlag },
      toDistrictDom: { value: null, disabled: disableFlag },
      toSubDistrictDom: { value: null, disabled: disableFlag },
      modeOfTravelInter: { value: null, disabled: disableFlag },
      fromCountryInter: { value: null, disabled: disableFlag },
      fromCityInter: { value: null, disabled: disableFlag },
      toCountryInter: { value: null, disabled: disableFlag },
      toCityInter: { value: null, disabled: disableFlag },
      suspectedStatusUI: { value: null, disabled: disableFlag },
      recommendation: this.fb.array([]),
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }
  createPatientDiseaseForm(disableFlag: boolean = false) {
    return this.fb.group({
      diseaseFormsArray: this.fb.array([]),
    });
  }

  createPatientTmcConfirmationForm(disableFlag: boolean = false) {
    return this.fb.group({
      tmcConfirmed: null,
      refrredToAdditionalServiceList: null,
      isDiabetic: null,
      isHypertensionConfirmed: null,
    });
  }

  createCovidVaccineStatusForm(disableFlag: any): FormGroup {
    return this.fb.group({
      covidVSID: null,
      ageGroup: null,
      isApplicableForVaccine: null,
      vaccineStatus: null,
      vaccineTypes: null,
      doseTaken: null,
      doseOneDate: null,
      doseTwoDate: null,
      boosterDoseDate: null,
    });
  }

  createPatientDiseaseArrayForm(data: any) {
    if (!data) {
      data = {
        diseaseName: null,
        flag: null,
        selected: null,
      };
    }
    return this.fb.group({
      diseaseName: data.disease,
      flag: data.flag,
      selected: data.selected,
    });
  }
}
