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

import { Component, OnInit, Inject, DoCheck } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';

@Component({
  selector: 'app-case-sheet-print-page-select',
  templateUrl: './print-page-select.component.html',
  styleUrls: ['./print-page-select.component.css'],
})
export class PrintPageSelectComponent implements OnInit, DoCheck {
  printPagePreviewSelect = {
    caseSheetANC: true,
    caseSheetPNC: true,
    caseSheetHistory: true,
    caseSheetExamination: true,
    caseSheetCovidVaccinationDetails: true,
  };

  visitCategory: any;
  currentLanguageSet: any;
  isCovidVaccinationStatusVisible = false;

  constructor(
    public dialogRef: MatDialogRef<PrintPageSelectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private httpServices: HttpServiceService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    if (this.data) {
      this.visitCategory = this.data.visitCategory;
      this.printPagePreviewSelect.caseSheetANC =
        this.data.printPagePreviewSelect.caseSheetANC;
      this.printPagePreviewSelect.caseSheetPNC =
        this.data.printPagePreviewSelect.caseSheetPNC;
      this.printPagePreviewSelect.caseSheetHistory =
        this.data.printPagePreviewSelect.caseSheetHistory;
      this.printPagePreviewSelect.caseSheetExamination =
        this.data.printPagePreviewSelect.caseSheetExamination;
      this.printPagePreviewSelect.caseSheetCovidVaccinationDetails =
        this.data.printPagePreviewSelect.caseSheetCovidVaccinationDetails;
    }
  }
  /*
   * JA354063 - Multilingual Changes added on 13/10/21
   */
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  // Ends
}
