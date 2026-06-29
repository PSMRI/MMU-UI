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

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NurseWorklistService } from './nurse-worklist.service';

/**
 * Logic shared by the "standard" role worklists (doctor / oncologist /
 * radiologist tabs): normalise the standard rows, run the worklist fetch
 * and route to the work area / case sheet. The language / image / session
 * helpers common to every worklist are reused from NurseWorklistService.
 */
@Injectable({ providedIn: 'root' })
export class RoleWorklistService {
  constructor(
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
    private readonly sessionstorage: SessionStorageService,
    private readonly nurseWorklist: NurseWorklistService
  ) {}

  /** Load and return the currently selected language set. */
  getLanguageSet(): any {
    return this.nurseWorklist.getLanguageSet();
  }

  /** Fetch and display the beneficiary's photo, or alert if none exists. */
  viewBeneficiaryImage(benRegID: any, currentLanguageSet: any): void {
    this.nurseWorklist.viewBeneficiaryImage(benRegID, currentLanguageSet);
  }

  /** Clear the visit-related sessionStorage keys common to every role. */
  clearVisitSession(): void {
    this.nurseWorklist.clearNurseVisitSession();
  }

  /** Fill the "Not Available" defaults the standard worklist columns need. */
  normalizeStandardRows(data: any[]): any[] {
    data.forEach((element: any) => {
      element.genderName = element.genderName || 'Not Available';
      element.age = element.age || 'Not Available';
      element.statusMessage = element.statusMessage || 'Not Available';
      element.VisitCategory = element.VisitCategory || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      element.visitDate =
        moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
      element.benVisitDate =
        moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
    });
    return data;
  }

  /**
   * Run a worklist fetch and hand the normalised rows back (or an empty
   * list + alert on error). `assign` stores the rows on the component.
   */
  loadStandardWorklist(
    request: Observable<any>,
    assign: (rows: any[]) => void
  ): void {
    request.subscribe(
      (data: any) => {
        if (data.statusCode === 200 && data.data !== null) {
          assign(this.normalizeStandardRows(data.data));
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
          assign([]);
        }
      },
      err => {
        if (err?.handled) return;
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  /**
   * Standard row activation: a fresh visit (`visitFlowStatusFlag === 'N'`)
   * routes to the common patient work area; otherwise it offers the TC
   * case sheet. Used by the oncologist/radiologist tabs.
   */
  openStandardExamination(beneficiary: any, currentLanguageSet: any): void {
    this.sessionstorage.setItem('visitCode', beneficiary.visitCode);
    if (beneficiary.visitFlowStatusFlag === 'N') {
      this.confirmationService
        .confirm(
          `info`,
          currentLanguageSet?.alerts?.info?.confirmtoProceedFurther
        )
        .subscribe(result => {
          if (result) {
            this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
            this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
            this.sessionstorage.setItem('doctorFlag', beneficiary.doctorFlag);
            this.sessionstorage.setItem('nurseFlag', beneficiary.nurseFlag);
            this.sessionstorage.setItem(
              'pharmacist_flag',
              beneficiary.pharmacist_flag
            );
            this.sessionstorage.setItem(
              'beneficiaryRegID',
              beneficiary.beneficiaryRegID
            );
            this.sessionstorage.setItem(
              'beneficiaryID',
              beneficiary.beneficiaryID
            );
            this.sessionstorage.setItem(
              'visitCategory',
              beneficiary.VisitCategory
            );
            this.router.navigate([
              '/common/patient',
              beneficiary.beneficiaryRegID,
            ]);
          }
        });
    } else {
      this.confirmationService
        .confirm('info', currentLanguageSet?.alerts?.info?.consulation)
        .subscribe(res => {
          if (res) {
            this.sessionstorage.setItem(
              'caseSheetBenFlowID',
              beneficiary.benFlowID
            );
            this.sessionstorage.setItem(
              'caseSheetVisitCategory',
              beneficiary.VisitCategory
            );
            this.sessionstorage.setItem(
              'caseSheetBeneficiaryRegID',
              beneficiary.beneficiaryRegID
            );
            this.sessionstorage.setItem(
              'caseSheetVisitID',
              beneficiary.benVisitID
            );
            this.router.navigate([
              '/nurse-doctor/print/' + 'MMU' + '/' + 'current',
            ]);
          }
        });
    }
  }
}
