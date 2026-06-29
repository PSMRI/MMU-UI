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
import * as moment from 'moment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { TitleCasePipe } from '@angular/common';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
import { BeneficiaryWorklistComponent } from '../../core/components/beneficiary-worklist/beneficiary-worklist.component';

@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  host: { class: 'block' },
  imports: [
    TitleCasePipe,
    BeneficiaryWorklistComponent,
    ...ZardTableImports,
    ...tooltipImports,
  ],
})
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  /** Columns the shared worklist may filter against. */
  readonly searchKeys = [
    'beneficiaryID',
    'benName',
    'genderName',
    'age',
    'VisitCategory',
    'benVisitNo',
    'districtName',
    'preferredPhoneNum',
    'villageName',
    'beneficiaryRegID',
    'visitDate',
    'benVisitDate',
  ];

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

  /** Column headers (kept here because they're language-driven). */
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
      b?.phoneNo,
      b?.visitDate,
      b?.image,
    ];
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
