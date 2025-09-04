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

import { Component, OnInit, Inject, Input, DoCheck } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegistrarService } from '../../shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-register-edit-location',
  templateUrl: './register-edit-location.component.html',
  styleUrls: ['./register-edit-location.component.css'],
})
export class RegisterEditLocationComponent implements OnInit, DoCheck {
  statesList: any;
  districtList: any;
  subDistrictList: any;
  villageList: any;
  demographicsMaster: any;
  editDetails: any;

  demographicEditDetailsForm!: FormGroup;
  currentLanguageSet: any;

  constructor(
    public dialogRef: MatDialogRef<RegisterEditLocationComponent>,
    @Inject(MAT_DIALOG_DATA) public input: any,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
    private languageComponent: SetLanguageComponent,
    private trackingService: AmritTrackingService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.demographicEditDetailsForm = new FormGroup({
      stateID: new FormControl(''),
      stateName: new FormControl(''),
      districtID: new FormControl(''),
      districtName: new FormControl(''),
      blockID: new FormControl(''),
      blockName: new FormControl(''),
      villageID: new FormControl(''),
      villageName: new FormControl(''),
    });
    this.configState();

    this.loadState();
    //this.statesList = this.input.dataList.data;
  }
  configState() {
    const location: any = this.sessionstorage.getItem('location');
    this.demographicsMaster = Object.assign(
      {},
      JSON.parse(location),
      { servicePointID: this.sessionstorage.getItem('servicePointID') },
      { servicePointName: this.sessionstorage.getItem('servicePointName') }
    );
  }
  loadState() {
    this.statesList = this.demographicsMaster.stateMaster;
    this.demographicEditDetailsForm.patchValue({
      stateID: this.demographicsMaster.otherLoc.stateID,
      stateName: this.demographicsMaster.otherLoc.stateName,
    });
    this.emptyState();
  }
  emptyState() {
    this.demographicEditDetailsForm.patchValue({
      stateID: null,
      stateName: null,
    });
  }

  onStateChange() {
    this.updateStateName();

    this.registrarService
      .getDistrictList(this.demographicEditDetailsForm.value.stateID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.districtList = res.data;
          console.log(this.districtList);
          this.emptyDistrict();
          //this.emptySubDistrict();
          // this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  onDistrictChange() {
    this.updateDistrictName();
    this.registrarService
      .getSubDistrictList(this.demographicEditDetailsForm.value.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.emptySubDistrict();
          //this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }
  onSubDistrictChange() {
    this.updateSubDistrictName();

    this.registrarService
      .getVillageList(this.demographicEditDetailsForm.value.blockID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.villageList = res.data;

          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingLocationDetails,
            'error'
          );
        }
      });
  }
  onVillageChange() {
    this.updateVillageName();
  }
  updateSubDistrictName() {
    this.subDistrictList.forEach((subDistrict: any) => {
      if (
        subDistrict.blockID === this.demographicEditDetailsForm.value.blockID
      ) {
        this.demographicEditDetailsForm.patchValue({
          blockName: subDistrict.blockName,
        });
      }
    });
  }
  updateVillageName() {
    this.villageList.forEach((village: any) => {
      if (
        village.districtBranchID ===
        this.demographicEditDetailsForm.value.villageID
      ) {
        this.demographicEditDetailsForm.patchValue({
          villageName: village.villageName,
        });
      }
    });
  }
  updateDistrictName() {
    this.districtList.forEach((district: any) => {
      if (
        district.districtID === this.demographicEditDetailsForm.value.districtID
      ) {
        this.demographicEditDetailsForm.patchValue({
          districtName: district.districtName,
        });
      }
    });
  }
  updateStateName() {
    this.statesList.forEach((state: any) => {
      if (state.stateID === this.demographicEditDetailsForm.value.stateID) {
        this.demographicEditDetailsForm.patchValue({
          stateName: state.stateName,
        });
      }
    });
  }
  emptyVillage() {
    this.demographicEditDetailsForm.patchValue({
      villageID: null,
      villageName: null,
    });
  }

  emptySubDistrict() {
    this.demographicEditDetailsForm.patchValue({
      blockID: null,
      blockName: null,
    });
  }

  emptyDistrict() {
    this.demographicEditDetailsForm.patchValue({
      districtID: null,
      districtName: null,
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
  onSubmitEditLocation() {
    console.log(this.demographicEditDetailsForm.value.stateID);
    console.log(this.demographicEditDetailsForm.value.villageID);
    const selectedState = [
      {
        stateID: this.demographicEditDetailsForm.value.stateID,
        stateName: this.demographicEditDetailsForm.value.stateName,
      },
    ];
    const selectedVillage = [
      {
        villageID: this.demographicEditDetailsForm.value.villageID,
        villageName: this.demographicEditDetailsForm.value.villageName,
      },
    ];
    const selectedDistrict = [
      {
        districtID: this.demographicEditDetailsForm.value.districtID,
        districtName: this.demographicEditDetailsForm.value.districtName,
      },
    ];
    const selectedBlock = [
      {
        blockID: this.demographicEditDetailsForm.value.blockID,
        blockName: this.demographicEditDetailsForm.value.blockName,
      },
    ];
    this.editDetails = Object.assign(
      { selectedState: selectedState },
      { selectedDistrict: selectedDistrict },
      { selectedBlock: selectedBlock },
      { selectedVillage: selectedVillage },
      { villageList: this.villageList }
    );
    console.log('Edit DEtails' + this.editDetails);

    // this.dialogRef.close({event:'close',data:this.demographicEditDetailsForm.value.stateID});
    this.dialogRef.close({ event: 'close', data: this.editDetails });
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

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(
      fieldName,
      'Register Edit Location'
    );
  }
}
