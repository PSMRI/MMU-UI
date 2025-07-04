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
import { DatePipe } from '@angular/common';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-examination-case-sheet',
  templateUrl: './examination-case-sheet.component.html',
  styleUrls: ['./examination-case-sheet.component.css'],
  providers: [DatePipe],
})
export class ExaminationCaseSheetComponent
  implements OnInit, OnChanges, DoCheck
{
  @Input()
  previous: any;

  @Input()
  caseSheetData: any;

  visitCategory: any;
  beneficiaryRegID: any;
  visitID: any;
  generalExamination: any;
  headToToeExamination: any;
  gastroIntestinalExamination: any;
  cardioVascularExamination: any;
  respiratorySystemExamination: any;
  centralNervousSystemExamination: any;
  musculoskeletalSystemExamination: any;
  genitoUrinarySystemExamination: any;
  obstetricExamination: any;
  revisitDate: any;
  referDetails: any;
  date: any;
  serviceList: string = '';
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    public datepipe: DatePipe
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.visitCategory = this.sessionstorage.getItem('caseSheetVisitCategory');
    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitID = this.sessionstorage.getItem('visitID');
  }

  ngOnChanges() {
    if (this.caseSheetData?.nurseData?.examination) {
      const examination = this.caseSheetData.nurseData.examination;

      if (examination.generalExamination)
        this.generalExamination = examination.generalExamination;

      if (examination.headToToeExamination)
        this.headToToeExamination = examination.headToToeExamination;

      if (examination.cardiovascularExamination)
        this.cardioVascularExamination = examination.cardiovascularExamination;

      if (examination.respiratoryExamination)
        this.respiratorySystemExamination = examination.respiratoryExamination;

      if (examination.centralNervousExamination)
        this.centralNervousSystemExamination =
          examination.centralNervousExamination;

      if (examination.musculoskeletalExamination)
        this.musculoskeletalSystemExamination =
          examination.musculoskeletalExamination;

      if (examination.genitourinaryExamination)
        this.genitoUrinarySystemExamination =
          examination.genitourinaryExamination;

      if (examination.obstetricExamination)
        this.obstetricExamination = examination.obstetricExamination;

      if (examination.gastrointestinalExamination)
        this.gastroIntestinalExamination =
          examination.gastrointestinalExamination;
    }
    if (this.caseSheetData?.doctorData) {
      this.referDetails = this.caseSheetData.doctorData.Refer;
      console.log('refer', this.referDetails);
      if (this.referDetails?.refrredToAdditionalServiceList) {
        console.log(
          'institute',
          this.referDetails.refrredToAdditionalServiceList
        );
        for (
          let i = 0;
          i < this.referDetails.refrredToAdditionalServiceList.length;
          i++
        ) {
          if (this.referDetails.refrredToAdditionalServiceList[i].serviceName) {
            this.serviceList +=
              this.referDetails.refrredToAdditionalServiceList[i].serviceName;
            if (
              i >= 0 &&
              i < this.referDetails.refrredToAdditionalServiceList.length - 1
            )
              this.serviceList += ',';
          }
        }
      }
      console.log(
        'referDetailsForReferexamination',
        JSON.stringify(this.caseSheetData, null, 4)
      );
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
