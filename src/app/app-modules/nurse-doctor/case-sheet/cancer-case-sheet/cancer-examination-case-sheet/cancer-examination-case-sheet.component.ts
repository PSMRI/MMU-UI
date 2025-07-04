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

import { Component, OnInit, Input, DoCheck, OnChanges } from '@angular/core';
import * as moment from 'moment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
@Component({
  selector: 'app-cancer-examination-case-sheet',
  templateUrl: './cancer-examination-case-sheet.component.html',
  styleUrls: ['./cancer-examination-case-sheet.component.css'],
})
export class CancerExaminationCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  caseSheetData: any;
  @Input()
  previous: any;
  gynecologicalImageUrl = 'assets/images/gynecologicalExamination.png';
  breastImageUrl = 'assets/images/breastExamination.png';
  abdominalImageUrl = 'assets/images/abdominalExamination.png';
  oralImageUrl = 'assets/images/oralExamination.png';
  date: any;
  signsAndSymptoms: any;
  BenCancerLymphNodeDetails: any;
  oralExamination: any;
  breastExamination: any;
  abdominalExamination: any;
  gynecologicalExamination: any;
  imageAnnotatedData: any;
  beneficiaryDetails: any;
  diagnosisdetails: any;

  blankRows = [1, 2, 3, 4];
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(public httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }

  ngOnChanges() {
    if (this.caseSheetData) {
      if (this.caseSheetData.BeneficiaryData)
        this.beneficiaryDetails = this.caseSheetData.BeneficiaryData;

      this.signsAndSymptoms = this.caseSheetData.nurseData.signsAndSymptoms;
      this.BenCancerLymphNodeDetails =
        this.caseSheetData.nurseData.BenCancerLymphNodeDetails;
      this.oralExamination = this.caseSheetData.nurseData.oralExamination;
      this.breastExamination = this.caseSheetData.nurseData.breastExamination;
      this.abdominalExamination =
        this.caseSheetData.nurseData.abdominalExamination;
      this.gynecologicalExamination =
        this.caseSheetData.nurseData.gynecologicalExamination;
      this.imageAnnotatedData = this.caseSheetData.ImageAnnotatedData;
    }
    const t = new Date();
    this.date = t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear();
    if (this.caseSheetData?.doctorData?.diagnosis) {
      this.diagnosisdetails = this.caseSheetData.doctorData.diagnosis;
      if (
        this.caseSheetData?.doctorData?.diagnosis?.revisitDate &&
        !moment(
          this.caseSheetData.doctorData.diagnosis.revisitDate,
          'DD/MM/YYYY',
          true
        ).isValid()
      ) {
        const sDate = new Date(this.diagnosisdetails.revisitDate);
        this.diagnosisdetails.revisitDate = [
          this.padLeft.apply(sDate.getDate()),
          this.padLeft.apply(sDate.getMonth() + 1),
          this.padLeft.apply(sDate.getFullYear()),
        ].join('/');
      }
    }
  }
  padLeft() {
    const len = String(10).length - String(this).length + 1;
    return len > 0 ? new Array(len).join('0') + this : this;
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  getImageAnnotation(imageID: any) {
    const arr = this.imageAnnotatedData.filter(
      (item: any) => item.imageID === imageID
    );
    return arr.length > 0 ? arr[0] : null;
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
