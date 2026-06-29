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

import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { NurseService, NurseWorklistService } from '../shared/services';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { BeneficiaryWorklistComponent } from '../../core/components/beneficiary-worklist/beneficiary-worklist.component';

@Component({
  selector: 'app-nurse-worklist',
  templateUrl: './nurse-worklist.component.html',
  host: { class: 'block' },
  imports: [BeneficiaryWorklistComponent],
})
export class NurseWorklistComponent implements OnInit, DoCheck, OnDestroy {
  beneficiaryList: any[] = [];
  currentLanguageSet: any;

  constructor(
    private nurseService: NurseService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private nurseWorklistService: NurseWorklistService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('currentRole', 'Nurse');
    this.removeBeneficiaryDataForNurseVisit();
    this.getNurseWorklist();
    this.beneficiaryDetailsService.reset();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    this.currentLanguageSet = this.nurseWorklistService.getLanguageSet();
  }

  ngOnDestroy() {
    sessionStorage.removeItem('currentRole');
  }

  removeBeneficiaryDataForNurseVisit() {
    this.nurseWorklistService.clearNurseVisitSession();
  }

  getNurseWorklist() {
    this.nurseService.getNurseWorklist().subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          this.beneficiaryList = this.loadDataToBenList(res.data);
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
          this.beneficiaryList = [];
        }
      },
      err => {
        if (err?.handled) {
          return;
        }
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  loadDataToBenList(data: any) {
    data.forEach((element: any) => {
      element.genderName = element.genderName || 'Not Available';
      element.age = element.age || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.fatherName = element.fatherName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
    });
    return data;
  }

  patientImageView(benregID: any) {
    this.nurseWorklistService.viewBeneficiaryImage(
      benregID,
      this.currentLanguageSet
    );
  }

  loadNursePatientDetails(beneficiary: any) {
    sessionStorage.removeItem('visitCategory');
    this.confirmationService
      .confirm(
        `info`,
        this.currentLanguageSet.alerts.info.confirmtoProceedFurther
      )
      .subscribe(result => {
        if (result) {
          this.sessionstorage.setItem(
            'beneficiaryGender',
            beneficiary.genderName
          );
          this.sessionstorage.setItem(
            'beneficiaryRegID',
            beneficiary.beneficiaryRegID
          );
          this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
          this.sessionstorage.setItem(
            'beneficiaryID',
            beneficiary.beneficiaryID
          );
          this.sessionstorage.setItem('benVisitNo', beneficiary.benVisitNo);
          this.router.navigate([
            '/nurse-doctor/attendant/nurse/patient/',
            beneficiary.beneficiaryRegID,
          ]);
        }
      });
  }
}
