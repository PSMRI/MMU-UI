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

import { Component, OnInit, Input, OnChanges, DoCheck } from '@angular/core';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-nurse-systemic-examination',
  templateUrl: './systemic-examination.component.html',
  styleUrls: ['./systemic-examination.component.css'],
})
export class SystemicExaminationComponent
  implements OnInit, OnChanges, DoCheck
{
  generalUtils = new GeneralUtils(this.fb, this.sessionstorage);

  @Input()
  systemicExaminationDataForm!: FormGroup;

  @Input()
  visitCategory!: string;

  displayANC!: boolean;
  displayGeneral!: boolean;
  languageComponent!: SetLanguageComponent;

  currentLanguageSet: any;
  gastroIntestinalSystemForm!: FormGroup;
  cardioVascularSystemForm!: FormGroup;
  respiratorySystemForm!: FormGroup;
  centralNervousSystemForm!: FormGroup;
  musculoSkeletalSystemForm!: FormGroup;
  genitoUrinarySystemForm!: FormGroup;
  obstetricExaminationForANCForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService
  ) {}

  ngOnInit() {
    this.displayANC = false;
    this.displayGeneral = false;
    this.fetchLanguageResponse();

    if (this.visitCategory === 'ANC') {
      this.systemicExaminationDataForm.addControl(
        'obstetricExaminationForANCForm',
        this.generalUtils.createObstetricExaminationForANCForm()
      );
      this.displayANC = true;
    } else if (
      this.visitCategory === 'General OPD' ||
      this.visitCategory === 'PNC'
    ) {
      this.displayGeneral = true;
    }
    this.loadFormData();
  }

  loadFormData() {
    this.gastroIntestinalSystemForm = this.systemicExaminationDataForm.get(
      'gastroIntestinalSystemForm'
    ) as FormGroup;
    this.cardioVascularSystemForm = this.systemicExaminationDataForm.get(
      'cardioVascularSystemForm'
    ) as FormGroup;
    this.respiratorySystemForm = this.systemicExaminationDataForm.get(
      'respiratorySystemForm'
    ) as FormGroup;
    this.centralNervousSystemForm = this.systemicExaminationDataForm.get(
      'centralNervousSystemForm'
    ) as FormGroup;
    this.musculoSkeletalSystemForm = this.systemicExaminationDataForm.get(
      'musculoSkeletalSystemForm'
    ) as FormGroup;
    this.genitoUrinarySystemForm = this.systemicExaminationDataForm.get(
      'genitoUrinarySystemForm'
    ) as FormGroup;
    this.obstetricExaminationForANCForm = this.systemicExaminationDataForm.get(
      'obstetricExaminationForANCForm'
    ) as FormGroup;
  }
  ngOnChanges() {
    this.displayANC = this.visitCategory === 'ANC' ? true : false;
    if (this.displayANC) {
      this.systemicExaminationDataForm.addControl(
        'obstetricExaminationForANCForm',
        this.generalUtils.createObstetricExaminationForANCForm()
      );
    } else if (!this.displayANC) {
      this.systemicExaminationDataForm.removeControl(
        'obstetricExaminationForANCForm'
      );
      if (
        this.visitCategory === 'General OPD' ||
        this.visitCategory === 'PNC'
      ) {
        this.displayGeneral = true;
      }
    }
    this.loadFormData();
  }

  //BU40088124 12/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(
      fieldName,
      'Systemic Examination'
    );
  }
}
