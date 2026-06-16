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
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { NgIf } from '@angular/common';
import { GeneralOpdExaminationComponent } from './general-opd-examination/general-opd-examination.component';
import { CancerExaminationComponent } from './cancer-examination/cancer-examination.component';

@Component({
  selector: 'app-nurse-examination',
  templateUrl: './examination.component.html',
  styleUrls: ['./examination.component.css'],
  imports: [NgIf, GeneralOpdExaminationComponent, CancerExaminationComponent],
})
export class ExaminationComponent implements OnInit, DoCheck, OnChanges {
  @Input()
  visitCategory!: string;

  @Input()
  patientExaminationDataForm!: FormGroup;

  @Input()
  examinationMode!: string;

  showGeneralOPD = false;
  showCancer = false;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(private httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }

  ngOnChanges() {
    if (this.visitCategory) {
      this.showGeneralOPD =
        this.visitCategory === 'General OPD' ||
        this.visitCategory === 'ANC' ||
        this.visitCategory === 'PNC'
          ? true
          : false;
      this.showCancer =
        this.visitCategory === 'Cancer Screening' ? true : false;
    }
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
}
