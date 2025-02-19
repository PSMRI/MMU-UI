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

import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-visit-details',
  templateUrl: './visit-details.component.html',
  styleUrls: ['./visit-details.component.css'],
})
export class VisitDetailsComponent implements OnInit, DoCheck {
  @Input()
  patientVisitDataForm!: FormGroup;

  @Input()
  mode!: string;

  visitCategory: any;

  hideAll = false;
  showANCVisit = false;
  showNCDCare = false;
  showPNC = false;
  enableFileSelection = false;
  showCOVID = false;
  showNcdScreeningVisit = false;
  isCovidVaccinationStatusVisible = false;
  current_language_set: any;
  patientVisitDetailsForm!: FormGroup;
  covidVaccineStatusForm!: FormGroup;
  patientChiefComplaintsForm!: FormGroup;
  patientAdherenceForm!: FormGroup;
  patientInvestigationsForm!: FormGroup;
  patientCovidForm!: FormGroup;
  patientFileUploadDetailsForm!: FormGroup;
  patientDiseaseForm!: FormGroup;

  constructor(
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.patientVisitDetailsForm = this.patientVisitDataForm.get(
      'patientVisitDetailsForm'
    ) as FormGroup;
    this.covidVaccineStatusForm = this.patientVisitDataForm.get(
      'covidVaccineStatusForm'
    ) as FormGroup;
    this.patientChiefComplaintsForm = this.patientVisitDataForm.get(
      'patientChiefComplaintsForm'
    ) as FormGroup;
    this.patientAdherenceForm = this.patientVisitDataForm.get(
      'patientAdherenceForm'
    ) as FormGroup;
    this.patientInvestigationsForm = this.patientVisitDataForm.get(
      'patientInvestigationsForm'
    ) as FormGroup;
    this.patientCovidForm = this.patientVisitDataForm.get(
      'patientCovidForm'
    ) as FormGroup;
    this.patientFileUploadDetailsForm = this.patientVisitDataForm.get(
      'patientFileUploadDetailsForm'
    ) as FormGroup;
    this.patientDiseaseForm = this.patientVisitDataForm.get(
      'patientDiseaseForm'
    ) as FormGroup;
    this.getVisitCategory();
  }

  getVisitCategory() {
    (<FormGroup>(
      this.patientVisitDataForm.controls['patientVisitDetailsForm']
    )).controls['visitCategory'].valueChanges.subscribe(categoryValue => {
      if (categoryValue) {
        this.visitCategory = categoryValue;
        this.conditionCheck();
      }
    });
  }

  conditionCheck() {
    if (!this.mode) this.hideAllTab();
    this.sessionstorage.setItem('visiCategoryANC', this.visitCategory);
    if (this.visitCategory === 'NCD screening') {
      this.enableFileSelection = true;
      this.showNcdScreeningVisit = true;
    }

    if (
      this.visitCategory === 'Cancer Screening' ||
      this.visitCategory === 'NCD screening' ||
      this.visitCategory === 'General OPD (QC)'
    ) {
      this.hideAll = false;
    } else if (this.visitCategory === 'ANC') {
      this.showANCVisit = true;
    } else if (this.visitCategory === 'NCD care') {
      this.showNCDCare = true;
    } else if (
      this.visitCategory === 'PNC' ||
      this.visitCategory === 'General OPD'
    ) {
      this.showPNC = true;
    } else if (this.visitCategory === 'COVID-19 Screening') {
      this.showCOVID = true;
    } else {
      this.hideAll = false;
    }
  }

  hideAllTab() {
    this.hideAll = false;
    this.showANCVisit = false;
    this.showNCDCare = false;
    this.showPNC = false;
    this.showCOVID = false;
    this.showNcdScreeningVisit = false;
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
}
