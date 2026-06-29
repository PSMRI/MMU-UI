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
import { NgClass, TitleCasePipe } from '@angular/common';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
import { BeneficiaryWorklistComponent } from '../../core/components/beneficiary-worklist/beneficiary-worklist.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  RoleWorklistService,
} from '../shared/services';

@Component({
  selector: 'app-doctor-worklist',
  templateUrl: './doctor-worklist.component.html',
  styleUrls: ['./doctor-worklist.component.scss'],
  host: { class: 'block' },
  imports: [
    NgClass,
    TitleCasePipe,
    BeneficiaryWorklistComponent,
    ...ZardTableImports,
    ...tooltipImports,
  ],
})
export class DoctorWorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  beneficiaryMetaData: any;
  currentLanguageSet: any;

  constructor(
    private readonly router: Router,
    private readonly masterdataService: MasterdataService,
    private readonly confirmationService: ConfirmationService,
    private readonly beneficiaryDetailsService: BeneficiaryDetailsService,
    private readonly doctorService: DoctorService,
    private readonly roleWorklist: RoleWorklistService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.sessionstorage.setItem('currentRole', 'Doctor');
    this.assignSelectedLanguage();
    this.roleWorklist.clearVisitSession();
    this.loadWorklist();
    this.beneficiaryDetailsService.reset();
    this.masterdataService.reset();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
    if (this.currentLanguageSet && this.beneficiaryMetaData) {
      this.beneficiaryMetaData.forEach((item: any) => {
        const temp = this.getVisitStatus(item);
        item.statusMessage = temp.statusMessage;
        item.statusCode = temp.statusCode;
      });
    }
  }

  ngOnDestroy() {
    sessionStorage.removeItem('currentRole');
  }

  assignSelectedLanguage() {
    this.currentLanguageSet = this.roleWorklist.getLanguageSet();
  }

  /** Doctor columns: status + father's name omitted, no phone column. */
  get headers(): string[] {
    const b = this.currentLanguageSet?.bendetails;
    const c = this.currentLanguageSet?.casesheet;
    return [
      c?.serialNo,
      b?.beneficiaryID,
      b?.beneficiaryName,
      b?.gender,
      b?.age,
      b?.visitCategory,
      b?.district,
      b?.visitDate,
      b?.image,
    ];
  }

  loadWorklist() {
    this.beneficiaryMetaData = [];
    this.doctorService.getDoctorWorklist().subscribe(
      (data: any) => {
        if (data && data.statusCode === 200 && data.data) {
          this.beneficiaryMetaData = data.data;
          data.data.forEach((item: any) => {
            const temp = this.getVisitStatus(item);
            item.statusMessage = temp.statusMessage;
            item.statusCode = temp.statusCode;
          });
          this.beneficiaryList = this.loadDataToBenList(data.data);
        } else this.confirmationService.alert(data.errorMessage, 'error');
      },
      err => {
        if (err?.handled) return;
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  loadDataToBenList(data: any) {
    const rows = this.roleWorklist.normalizeStandardRows(data);
    rows.forEach((element: any) => (element.arrival = false));
    return rows;
  }

  patientImageView(benRegID: any) {
    this.roleWorklist.viewBeneficiaryImage(benRegID, this.currentLanguageSet);
  }

  loadDoctorExaminationPage(beneficiary: any) {
    this.sessionstorage.setItem('visitCode', beneficiary.visitCode);
    if (beneficiary.statusCode === 1) {
      this.routeToWorkArea(beneficiary);
    } else if (beneficiary.statusCode === 2) {
      this.confirmationService.alert(beneficiary.statusMessage);
    } else if (beneficiary.statusCode === 3) {
      this.routeToWorkArea(beneficiary);
    } else if (beneficiary.statusCode === 9 || beneficiary.statusCode === 10) {
      this.viewAndPrintCaseSheet(beneficiary);
    }
  }

  viewAndPrintCaseSheet(beneficiary: any) {
    this.confirmationService
      .confirm('info', this.currentLanguageSet.alerts.info.consulation)
      .subscribe(res => {
        if (res) {
          this.routeToCaseSheet(beneficiary);
        }
      });
  }

  routeToCaseSheet(beneficiary: any) {
    this.sessionstorage.setItem('caseSheetBenFlowID', beneficiary.benFlowID);
    this.sessionstorage.setItem(
      'caseSheetVisitCategory',
      beneficiary.VisitCategory
    );
    this.sessionstorage.setItem(
      'caseSheetBeneficiaryRegID',
      beneficiary.beneficiaryRegID
    );
    this.sessionstorage.setItem('caseSheetVisitID', beneficiary.benVisitID);
    this.router.navigate(['/nurse-doctor/print/' + 'MMU' + '/' + 'current']);
  }

  routeToWorkArea(beneficiary: any) {
    this.confirmationService
      .confirm(
        `info`,
        this.currentLanguageSet.alerts.info.confirmtoProceedFurther
      )
      .subscribe(result => {
        if (result) {
          this.updateWorkArea(beneficiary);
        }
      });
  }

  updateWorkArea(beneficiary: any) {
    if (this.setDataForWorkArea(beneficiary)) {
      this.router.navigate([
        '/nurse-doctor/attendant/doctor/patient/',
        beneficiary.beneficiaryRegID,
      ]);
    }
  }

  setDataForWorkArea(beneficiary: any) {
    this.sessionstorage.setItem('beneficiaryGender', beneficiary.genderName);
    this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
    this.sessionstorage.setItem('visitCategory', beneficiary.VisitCategory);
    this.sessionstorage.setItem(
      'beneficiaryRegID',
      beneficiary.beneficiaryRegID
    );
    this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
    this.sessionstorage.setItem('beneficiaryID', beneficiary.beneficiaryID);
    this.sessionstorage.setItem('doctorFlag', beneficiary.doctorFlag);
    this.sessionstorage.setItem('nurseFlag', beneficiary.nurseFlag);
    this.sessionstorage.setItem('pharmacist_flag', beneficiary.pharmacist_flag);
    this.sessionstorage.setItem('phnum', beneficiary.preferredPhoneNum);
    return true;
  }

  getVisitStatus(beneficiaryVisitDetials: any) {
    const status = {
      statusCode: 0,
      statusMessage: '',
    };
    if (
      beneficiaryVisitDetials.doctorFlag === 2 ||
      beneficiaryVisitDetials.nurseFlag === 2
    ) {
      status.statusCode = 2;
      status.statusMessage = this.currentLanguageSet.alerts.info.pending;
    } else if (beneficiaryVisitDetials.doctorFlag === 1) {
      status.statusCode = 1;
      status.statusMessage = this.currentLanguageSet.alerts.info.pendingConsult;
    } else if (beneficiaryVisitDetials.doctorFlag === 3) {
      status.statusCode = 3;
      status.statusMessage = this.currentLanguageSet.alerts.info.labtestDone;
    } else if (beneficiaryVisitDetials.specialist_flag === 100) {
      status.statusCode = 10;
      status.statusMessage = this.currentLanguageSet.common.tmReferred;
    } else if (beneficiaryVisitDetials.doctorFlag === 9) {
      status.statusCode = 9;
      status.statusMessage = 'Consultation Done';
    }
    return status;
  }
}
