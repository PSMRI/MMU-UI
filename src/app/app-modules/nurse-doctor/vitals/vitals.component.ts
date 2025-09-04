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
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
@Component({
  selector: 'app-nurse-vitals',
  templateUrl: './vitals.component.html',
  styleUrls: ['./vitals.component.css'],
})
export class VitalsComponent implements OnInit, OnChanges, DoCheck {
  @Input()
  patientVitalsDataForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  vitalsMode!: string;

  @Input()
  pregnancyStatus!: string;

  showGeneralOPD = false;
  showCancer = false;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }

  ngOnChanges() {
    if (this.visitCategory) {
      this.showCancer =
        this.visitCategory === 'Cancer Screening' ? true : false;
      this.showGeneralOPD =
        this.visitCategory !== 'Cancer Screening' ? true : false;
    }
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
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
