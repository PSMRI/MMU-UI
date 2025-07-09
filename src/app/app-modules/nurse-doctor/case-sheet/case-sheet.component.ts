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

import { Component, OnInit, Injector, DoCheck } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-case-sheet',
  templateUrl: './case-sheet.component.html',
  styleUrls: ['./case-sheet.component.css'],
})
export class CaseSheetComponent implements OnInit, DoCheck {
  QC: boolean = false;
  General: boolean = false;
  NCDScreening: boolean = false;
  CancerScreening: boolean = false;

  preview: any;
  previous: any;
  serviceType: any;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    private route: ActivatedRoute,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private injector: Injector
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.caseSheetCategory();
    this.serviceType = this.route.snapshot.params['serviceType'];
    const input = this.injector.get(MAT_DIALOG_DATA, null);
    if (input) {
      this.previous = input.previous;
      this.serviceType = input.serviceType;
    }
  }

  caseSheetCategory() {
    const dataStore = this.route.snapshot.params['printablePage'] || 'previous';
    let type;
    if (this.previous) {
      if (dataStore === 'previous') {
        type = this.sessionstorage.getItem('previousCaseSheetVisitCategory');
      }
    } else {
      if (dataStore === 'current') {
        type = this.sessionstorage.getItem('caseSheetVisitCategory');
      }
      if (dataStore === 'previous') {
        type = this.sessionstorage.getItem('previousCaseSheetVisitCategory');
      }
    }

    if (type) {
      switch (type) {
        case 'Cancer Screening':
          this.CancerScreening = true;
          break;

        case 'General OPD (QC)':
        case 'General OPD':
        case 'NCD care':
        case 'PNC':
        case 'ANC':
        case 'COVID-19 Screening':
        case 'NCD screening':
          this.General = true;
          break;

        default:
          this.QC = false;
          this.CancerScreening = false;
          this.General = false;
          break;
      }
    }
  }

  // AV40085804 13/10/2021 Integrating Multilingual Functionality -----Start-----
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  // -----End------
}
