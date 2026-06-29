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
import { LabService, MasterDataService } from '../shared/services';
import { CameraService } from '../../core/services/camera.service';
import * as moment from 'moment';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { BeneficiaryWorklistComponent } from '../../core/components/beneficiary-worklist/beneficiary-worklist.component';

@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  host: { class: 'block' },
  imports: [BeneficiaryWorklistComponent],
})
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  current_language_set: any;

  constructor(
    private cameraService: CameraService,
    private router: Router,
    private masterdataService: MasterDataService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private labService: LabService,
    readonly sessionstorage: SessionStorageService,
    private httpServiceService: HttpServiceService
  ) {}

  ngOnInit() {
    this.sessionstorage.setItem('currentRole', 'Lab Technician');
    this.loadWorklist();
    this.beneficiaryDetailsService.reset();
    this.removeBeneficiaryDataForVisit();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
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

  loadWorklist() {
    this.labService.getLabWorklist().subscribe(
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
    const benDataList: any = [];
    data.forEach((element: any) => {
      benDataList.push({
        beneficiaryID: element.beneficiaryID,
        beneficiaryRegID: element.beneficiaryRegID,
        benName: element.benName,
        genderName: element.genderName || 'Not Available',
        age: element.age || 'Not Available',
        VisitCategory: element.VisitCategory || 'Not Available',
        benVisitNo: element.benVisitNo || 'Not Available',
        districtName: element.districtName || 'Not Available',
        villageName: element.villageName || 'Not Available',
        preferredPhoneNum: element.preferredPhoneNum || 'Not Available',
        benFlowID: element.benFlowID,
        benVisitID: element.benVisitID,
        visitDate:
          moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
          'Not Available',
        benVisitDate:
          moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
          'Not Available',
        labObject: element,
      });
    });
    return benDataList;
  }

  patientImageView(benregID: any) {
    if (
      benregID &&
      benregID !== null &&
      benregID !== '' &&
      benregID !== undefined
    ) {
      this.beneficiaryDetailsService
        .getBeneficiaryImage(benregID)
        .subscribe((data: any) => {
          if (data?.benImage) this.cameraService.viewImage(data.benImage);
          else
            this.confirmationService.alert(
              this.current_language_set.alerts.info.imageNotFound
            );
        });
    }
  }

  loadLabExaminationPage(beneficiary: any) {
    this.confirmationService
      .confirm(
        `info`,
        this.current_language_set.alerts.info.confirmtoProceedFurther
      )
      .subscribe(result => {
        if (result) {
          this.sessionstorage.setItem(
            'doctorFlag',
            beneficiary.labObject.doctorFlag
          );
          this.sessionstorage.setItem(
            'nurseFlag',
            beneficiary.labObject.nurseFlag
          );
          this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
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
          this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
          this.sessionstorage.setItem(
            'visitCode',
            beneficiary.labObject.visitCode
          );
          if (
            beneficiary.labObject.specialist_flag &&
            beneficiary.labObject.specialist_flag >= 0
          ) {
            this.sessionstorage.setItem(
              'specialist_flag',
              beneficiary.labObject.specialist_flag
            );
          } else {
            if (this.sessionstorage.getItem('specialist_flag')) {
              const storedValue =
                this.sessionstorage.getItem('specialist_flag');
              storedValue !== null ? JSON.parse(storedValue) : null;
            }
          }
          this.router.navigate(['/lab/patient/', beneficiary.beneficiaryRegID]);
        }
      });
  }
}
