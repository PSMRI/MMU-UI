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

import { Component, DoCheck, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService, MasterdataService } from '../shared/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-tm-visit-details',
  templateUrl: './tm-visit-details.component.html',
  styleUrls: ['./tm-visit-details.component.css'],
})
export class TmVisitDetailsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  patientVisitForm!: FormGroup;

  @Input()
  mode!: string;

  visitCategory: any;
  hideAll = false;
  beneficiaryData: any;
  visitDetailsPregSubscription: any;
  currentLanguageSet: any;
  patientVisitDetailsForm!: FormGroup;
  tmcConfirmationForm!: FormGroup;

  constructor(
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private router: Router,
    readonly sessionstorage: SessionStorageService,
    private httpServices: HttpServiceService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    this.getVisitDetails();
    this.getPregnancyStatus();
    const selectTMC: any = this.sessionstorage.getItem('selectTMC');

    if (selectTMC === true) {
      this.patientVisitForm.controls['tmcConfirmationForm'].patchValue({
        tmcConfirmed: true,
      });
      sessionStorage.removeItem('selectTMC');
    }
    this.patientVisitDetailsForm = this.patientVisitForm.get(
      'patientVisitDetailsForm'
    ) as FormGroup;
    this.tmcConfirmationForm = this.patientVisitForm.get(
      'tmcConfirmationForm'
    ) as FormGroup;
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
  ngOnDestroy() {
    const currentURL = this.router.url;
    if (currentURL === '/nurse-doctor/print/MMU/current') {
      this.sessionstorage.setItem('selectTMC', 'true');
    } else {
      sessionStorage.removeItem('specialist_flag');
      sessionStorage.removeItem('beneficiaryData');
      if (this.visitDetailsPregSubscription)
        this.visitDetailsPregSubscription.unsubscribe();
      this.doctorService.prescribedDrugData = null;
    }
  }

  getVisitDetails() {
    const beneficiaryDataDetails: any =
      this.sessionstorage.getItem('beneficiaryData');
    this.beneficiaryData = JSON.parse(beneficiaryDataDetails);
    if (this.beneficiaryData) {
      const visitDetails = this.beneficiaryData;
      // visitDetails.visitCode = visitDetails.visitCode;
      this.patientVisitForm.controls['patientVisitDetailsForm'].patchValue({
        visitCategory: visitDetails.VisitCategory,
        visitReason: visitDetails.VisitReason,
      });
    }
  }

  getPregnancyStatus() {
    const visitID: any = this.sessionstorage.getItem('visitID');
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitDetailsPregSubscription = this.doctorService
      .getPregVisitComplaintDetails(
        benRegID,
        visitID,
        this.beneficiaryData.VisitCategory
      )
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          const visitDetails = value.data.NCDScreeningNurseVisitDetail;
          // visitDetails.visitCode = visitDetails.visitCode;
          // this.doctorService.fileIDs = value.data.NCDScreeningNurseVisitDetail.files;
          this.patientVisitForm.controls['patientVisitDetailsForm'].patchValue(
            visitDetails
          );
        }
      });
  }

  conditionCheck() {
    if (!this.mode) this.hideAllTab();
    this.sessionstorage.setItem('visiCategoryANC', this.visitCategory);
    if (this.visitCategory === 'NCD screening') {
      // condtion check
    } else {
      this.hideAll = false;
    }
  }
  hideAllTab() {
    this.hideAll = false;
  }
}
