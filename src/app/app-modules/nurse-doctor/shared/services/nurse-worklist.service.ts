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
import { SetLanguageComponent } from '../../../core/components/set-language.component';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { CameraService } from '../../../core/services/camera.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HttpServiceService } from '../../../core/services/http-service.service';

/**
 * Helpers shared by the nurse worklists (the "Visit" and "Referred to TC"
 * tabs). Both tabs load the same i18n set, open the beneficiary image the
 * same way and clear the same visit-related sessionStorage keys, so that
 * logic lives here once instead of being copied into each component.
 */
@Injectable({ providedIn: 'root' })
export class NurseWorklistService {
  constructor(
    private readonly httpServices: HttpServiceService,
    private readonly beneficiaryDetailsService: BeneficiaryDetailsService,
    private readonly cameraService: CameraService,
    private readonly confirmationService: ConfirmationService
  ) {}

  /** Load and return the currently selected language set. */
  getLanguageSet(): any {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    return getLanguageJson.currentLanguageObject;
  }

  /** Fetch and display the beneficiary's photo, or alert if none exists. */
  viewBeneficiaryImage(benRegID: any, currentLanguageSet: any): void {
    this.beneficiaryDetailsService
      .getBeneficiaryImage(benRegID)
      .subscribe((data: any) => {
        if (data?.benImage) this.cameraService.viewImage(data.benImage);
        else
          this.confirmationService.alert(
            currentLanguageSet?.alerts?.info?.imageNotFound
          );
      });
  }

  /** Clear the visit-related sessionStorage keys common to both tabs. */
  clearNurseVisitSession(): void {
    sessionStorage.removeItem('visitCode');
    sessionStorage.removeItem('beneficiaryGender');
    sessionStorage.removeItem('benFlowID');
    sessionStorage.removeItem('visitCategory');
    sessionStorage.removeItem('beneficiaryRegID');
    sessionStorage.removeItem('visitID');
    sessionStorage.removeItem('beneficiaryID');
    sessionStorage.removeItem('doctorFlag');
    sessionStorage.removeItem('nurseFlag');
    sessionStorage.removeItem('pharmacist_flag');
    sessionStorage.removeItem('caseSheetTMFlag');
  }
}
