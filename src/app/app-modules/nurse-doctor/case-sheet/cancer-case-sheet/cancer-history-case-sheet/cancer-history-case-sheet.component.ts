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
import { CommonModule } from '@angular/common';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

import { ZardCardImports } from 'zard-ui';
import { LucideAngularModule } from 'lucide-angular';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucideUser,
  lucideHistory,
  lucideClipboardList,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-cancer-history-case-sheet',
  standalone: true,
  imports: [CommonModule, ZardCardImports, LucideAngularModule, NgIcon],
  providers: [
    provideIcons({
      lucideUsers,
      lucideUser,
      lucideHistory,
      lucideClipboardList,
    }),
  ],
  templateUrl: './cancer-history-case-sheet.component.html',
  styleUrls: ['./cancer-history-case-sheet.component.css'],
})
export class CancerHistoryCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  caseSheetData: any;
  @Input()
  previous: any;
  familyDiseaseHistory: any;
  patientPersonalHistory: any;
  patientObstetricHistory: any;
  beneficiaryDetails: any;

  blankRows = [1, 2, 3, 4];
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(public httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngOnChanges() {
    if (this.caseSheetData) {
      if (this.caseSheetData.BeneficiaryData)
        this.beneficiaryDetails = this.caseSheetData.BeneficiaryData;

      if (this.caseSheetData?.nurseData?.familyDiseaseHistory)
        this.familyDiseaseHistory =
          this.caseSheetData?.nurseData.familyDiseaseHistory;

      if (this.caseSheetData.nurseData?.benPersonalDietHistory)
        this.patientPersonalHistory = {
          ...this.caseSheetData.nurseData.benPersonalDietHistory,
        };

      if (this.caseSheetData?.nurseData?.patientPersonalHistory)
        this.patientPersonalHistory = Object.assign(
          this.patientPersonalHistory,
          this.caseSheetData.nurseData.patientPersonalHistory
        );

      if (this.caseSheetData?.nurseData?.patientObstetricHistory)
        this.patientObstetricHistory =
          this.caseSheetData.nurseData.patientObstetricHistory;
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
