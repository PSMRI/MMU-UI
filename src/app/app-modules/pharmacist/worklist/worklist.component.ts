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

import { Component, OnInit, OnDestroy, DoCheck } from '@angular/core';
import { Router } from '@angular/router';

import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { PharmacistService } from '../shared/services/pharmacist.service';
import { CameraService } from '../../core/services/camera.service';
import { InventoryService } from '../../core/services/inventory.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { BeneficiaryWorklistComponent } from '../../core/components/beneficiary-worklist/beneficiary-worklist.component';
import { normalizeStandardWorklistRows } from '../../core/components/beneficiary-worklist/worklist-data.util';

@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  host: { class: 'block' },
  imports: [BeneficiaryWorklistComponent],
})
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    private router: Router,
    private httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private pharmacistService: PharmacistService,
    private cameraService: CameraService,
    private inventoryService: InventoryService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.sessionstorage.setItem('currentRole', 'Pharmacist');
    this.removeBeneficiaryDataForVisit();
    this.loadPharmaWorklist();
    this.beneficiaryDetailsService.reset();
  }

  removeBeneficiaryDataForVisit() {
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

  ngOnDestroy() {
    sessionStorage.removeItem('currentRole');
  }

  loadPharmaWorklist() {
    this.pharmacistService.getPharmacistWorklist().subscribe(
      (data: any) => {
        if (data && data.statusCode === 200 && data.data) {
          this.beneficiaryList = this.loadDataToBenList(data.data);
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
          this.beneficiaryList = [];
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  loadDataToBenList(data: any) {
    return normalizeStandardWorklistRows(data);
  }

  patientImageView(benregID: any) {
    if (benregID) {
      this.beneficiaryDetailsService
        .getBeneficiaryImage(benregID)
        .subscribe((data: any) => {
          if (data && data.benImage) {
            this.cameraService.viewImage(data.benImage);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.imageNotFound
            );
          }
        });
    }
  }

  loadPharmaPage(beneficiary: any) {
    this.confirmationService
      .confirm(
        `info`,
        this.currentLanguageSet.alerts.info.confirmtoProceedFurther
      )
      .subscribe(result => {
        if (result) {
          this.inventoryService.moveToInventory(
            beneficiary.beneficiaryID,
            beneficiary.visitCode,
            beneficiary.benFlowID,
            sessionStorage.getItem('setLanguage') !== undefined
              ? sessionStorage.getItem('setLanguage')
              : 'English',
            beneficiary.beneficiaryRegID
          );
        }
      });
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
