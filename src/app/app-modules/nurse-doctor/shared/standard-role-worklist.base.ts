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

import { Directive, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { RoleWorklistService } from './services/role-worklist.service';

/**
 * Shared shell for the "standard" role worklists (oncologist / radiologist):
 * both render the standard beneficiary columns and behave identically apart
 * from their `role` label and which worklist API they call. Subclasses
 * provide those two; everything else lives here. Filtering and pagination
 * are owned by the shared `app-beneficiary-worklist` component.
 */
@Directive()
export abstract class StandardRoleWorklistBase
  implements OnInit, OnDestroy, DoCheck
{
  beneficiaryList: any[] = [];
  currentLanguageSet: any;

  /** Role stored as `currentRole` (e.g. 'Oncologist', 'Radiologist'). */
  protected abstract readonly role: string;
  /** The worklist API call for this role. */
  protected abstract fetchWorklist(): Observable<any>;

  constructor(
    protected readonly roleWorklist: RoleWorklistService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('currentRole', this.role);
    this.roleWorklist.clearVisitSession();
    this.loadWorklist();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnDestroy() {
    sessionStorage.removeItem('currentRole');
  }

  assignSelectedLanguage() {
    this.currentLanguageSet = this.roleWorklist.getLanguageSet();
  }

  loadWorklist() {
    this.roleWorklist.loadStandardWorklist(
      this.fetchWorklist(),
      rows => (this.beneficiaryList = rows)
    );
  }

  loadDoctorExaminationPage(beneficiary: any) {
    this.roleWorklist.openStandardExamination(
      beneficiary,
      this.currentLanguageSet
    );
  }

  patientImageView(benRegID: any) {
    this.roleWorklist.viewBeneficiaryImage(benRegID, this.currentLanguageSet);
  }
}
