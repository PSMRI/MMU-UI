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

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { BeneficiaryWorklistComponent } from '../../core/components/beneficiary-worklist/beneficiary-worklist.component';
import { DoctorService, RoleWorklistService } from '../shared/services';
import { StandardRoleWorklistBase } from '../shared/standard-role-worklist.base';

@Component({
  selector: 'app-oncologist-worklist',
  templateUrl: './oncologist-worklist.component.html',
  host: { class: 'block' },
  imports: [BeneficiaryWorklistComponent],
})
export class OncologistWorklistComponent extends StandardRoleWorklistBase {
  protected readonly role = 'Oncologist';

  constructor(
    private readonly doctorService: DoctorService,
    roleWorklist: RoleWorklistService,
    sessionstorage: SessionStorageService
  ) {
    super(roleWorklist, sessionstorage);
  }

  protected fetchWorklist(): Observable<any> {
    return this.doctorService.getOncologistWorklist();
  }
}
