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

import { ConfirmationService } from './../../../core/services/confirmation.service';
import { Component, OnInit, Input, OnDestroy, DoCheck } from '@angular/core';
import {
  FormGroup,
  FormArray,
  FormBuilder,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { RegisterEditLocationComponent } from '../register-edit-location/register-edit-location.component';
import { _MatAutocompleteBase } from '@angular/material/autocomplete';
import { RegistrarService } from '../../shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-register-demographic-details',
  templateUrl: './register-demographic-details.component.html',
  styleUrls: ['./register-demographic-details.component.css'],
})
export class RegisterDemographicDetailsComponent
  implements OnInit, OnDestroy, DoCheck
{
  disabled: any = false;
  flag: any = false;
  villgeBranch: any;
  selectedvillageList: any = [];
  suggestedvillageList: any = [];
  DistrictTalukList: any;
  tempVillageName: any;
  subFilteredVillageMaster: any = [];
  masterData: any;
  masterDataSubscription: any;

  revisitData: any;
  revisitDataSubscription: any;

  @Input()
  demographicDetailsForm!: FormGroup;

  @Input()
  patientRevisit = false;

  demographicsEditEnabled = false;
  demographicsEditText!: string;

  demographicsMaster: any;
  statesList: any;
  districtList: any;
  subDistrictList: any;
  villageList: any;
  zonesList: any;
  parkingPlaceList: any;
  servicePointList: any;

  disableState = true;
  disableDistrict = true;
  disableSubDistrict = false;
  disableVillage = false;
  dialogRef!: MatDialogRef<RegisterEditLocationComponent>;
  currentLanguageSet: any;
  locationData: any;
  demographicsVillageList: any;

  constructor(
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private router: Router,
    private dialog: MatDialog,
    readonly sessionstorage: SessionStorageService,
    private languageComponent: SetLanguageComponent,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    const locationData: any = this.sessionstorage.getItem('locationData');
    this.locationData = JSON.parse(locationData);

    this.demographicsEditText = this.currentLanguageSet.bendetails.editLocation
      ? this.currentLanguageSet.bendetails.editLocation
      : 'Edit Location';
    this.loadMasterDataObservable();

    console.log(this.patientRevisit, 'revisit demographics');

    if (this.patientRevisit) {
      this.configMasterForDemographics();
    } else if (!this.patientRevisit) {
      this.loadLocationFromStorage();
    }

    this.demographicsVillageList = this.demographicDetailsForm.controls[
      'villages'
    ] as FormArray;
    console.log('village List', this.demographicsVillageList);
  }

  getDemographicsVillageList(): AbstractControl[] | null {
    const demographicsVillageListControl =
      this.demographicDetailsForm.get('villages');
    return demographicsVillageListControl instanceof FormArray
      ? demographicsVillageListControl.controls
      : null;
  }

  ngOnDestroy() {
    if (this.masterDataSubscription) {
      this.masterDataSubscription.unsubscribe();
    }
    if (this.patientRevisit && this.revisitDataSubscription) {
      this.revisitDataSubscription.unsubscribe();
    }
  }

  /**New Filtering Villages*/
  filterVillage(villageValue: any, i: any) {
    console.log('VillageValue' + villageValue);
    console.log(i);
    this.suggestedVillageList(
      this.fb.group({ villageID: villageValue.villageName }),
      i
    );

    const arr = this.villageList.filter((branch: any) => {
      return branch.villageName === villageValue.villageName;
    });

    if (this.selectedvillageList && this.selectedvillageList[i]) {
      this.villageList.map((branch: any, t: any) => {
        if (t !== i) {
          const bb = Object.keys(branch).map(key => ({
            type: key,
            value: branch[key],
          }));
          bb.push(this.selectedvillageList[i]);
          this.sortVillageList(bb);
        }
      });
    }

    if (arr.length > 0) {
      console.log('ArrayList' + arr);

      this.villageList.map((branch: any, t: any) => {
        let bb = Object.keys(branch).map(key => ({
          type: key,
          value: branch[key],
        }));
        const index = bb.indexOf(arr[0]);
        if (index !== -1 && t !== i) bb = bb.splice(index, 1);
      });
      this.selectedvillageList[i] = arr[0];
    }
  }
  sortVillageList(branchList: any) {
    branchList.sort((a: any, b: any) => {
      if (a.villageName === b.villageName) return 0;
      if (a.villageName < b.villageName) return -1;
      else return 1;
    });
  }

  /**NEw Suggested village List */
  suggestedVillageList(villageForm: AbstractControl<any, any>, i: any) {
    const village = villageForm.value.villageID;
    console.log('village' + village);
    console.log('i', i);

    if (typeof village === 'string') {
      if (
        this.subFilteredVillageMaster !== undefined &&
        this.subFilteredVillageMaster !== null &&
        this.subFilteredVillageMaster.length > 0
      ) {
        this.suggestedvillageList[i] = this.subFilteredVillageMaster[i].filter(
          (districtBranch: any) =>
            districtBranch.villageName
              .toLowerCase()
              .indexOf(village.toLowerCase().trim()) >= 0
        );
      }
      const found = this.suggestedvillageList[i].some(
        (el: any) => el.villageName === village
      );
      if (!found) {
        console.log('SuggestVillage1' + this.suggestedvillageList[i]);
        this.emptyDistrict();
        this.emptySubDistrict();
        this.disableDistrict = true;
        this.disableSubDistrict = true;
      } else {
        this.disableDistrict = false;
        this.disableSubDistrict = false;
      }
    } else if (typeof village === 'object' && village) {
      if (
        this.subFilteredVillageMaster !== undefined &&
        this.subFilteredVillageMaster !== null &&
        this.subFilteredVillageMaster.length > 0
      ) {
        this.suggestedvillageList[i] = this.subFilteredVillageMaster[i].filter(
          (districtBranch: any) =>
            districtBranch.villageName
              .toLowerCase()
              .indexOf(village.villageName.toLowerCase().trim()) >= 0
        );
      }
      const found = this.suggestedvillageList[i].some(
        (el: any) => el.villageName === village
      );
      if (!found) {
        this.emptyDistrict();
        this.emptySubDistrict();
      } else {
        this.disableDistrict = false;
        this.disableSubDistrict = false;
      }
    }

    if (this.suggestedvillageList[i].length === 0) villageForm.reset();
  }
  /**
   * Load Basic Master Data Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res: any) => {
        if (res !== null) {
          this.masterData = res;
        }
      });
  }

  /**
   * If Benefeciary Demographic data is supposed to be set default
   */
  setDemographicDefaults() {
    if (this.patientRevisit) {
      this.disableState = true;
      this.disableDistrict = true;
      this.disableSubDistrict = true;
      this.loadEditDefaults();
    } else if (!this.patientRevisit) {
      this.disableState = true;
      this.disableDistrict = true;
      (<FormGroup>this.villgeBranch.at(0)).controls['villageID'].enable();
      this.loadLocationFromStorage();
    }
  }

  loadEditDefaults() {
    this.configState();
    this.configDistrict();
    this.configSubDistrict();
    this.configVillage();
    this.configZone();
    this.configParkingPlace();
    this.configServicePoint();
  }

  /***********************************LOAD BEN EDIT DEMOGRAPHICS STARTS********************************/

  /**
   * Load Master and Current Demographic Details for an Old Beneficiary
   * FOR BENEFICIARY EDIT FROM BENEFICIARY DATA
   */
  configMasterForDemographics() {
    this.revisitDataSubscription =
      this.registrarService.beneficiaryEditDetails$.subscribe((res: any) => {
        if (res && res.beneficiaryID) {
          this.revisitData = Object.assign({}, res);
          if (this.patientRevisit) {
            this.setDemographicDefaults();
            this.loadBenEditDetails();
          }
        }
      });
  }

  /**
   * LoadBenEditDetails
   */
  loadBenEditDetails() {
    this.demographicDetailsForm.patchValue({
      habitation:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.habitation) ||
        null,
      addressLine1:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.addressLine1) ||
        null,
      addressLine2:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.addressLine2) ||
        null,
      addressLine3:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.addressLine3) ||
        null,
      pincode:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.pinCode) ||
        null,
    });
  }

  /**
   * Config States  for Ben Edit
   */
  configState() {
    const location: any = this.sessionstorage.getItem('location');
    this.demographicsMaster = Object.assign(
      {},
      JSON.parse(location),
      { servicePointID: this.sessionstorage.getItem('servicePointID') },
      { servicePointName: this.sessionstorage.getItem('servicePointName') }
    );
    if (
      this.demographicsMaster.stateMaster &&
      this.demographicsMaster.stateMaster.length >= 1
    ) {
      this.statesList = this.demographicsMaster.stateMaster;
    }
    this.demographicDetailsForm.patchValue({
      stateID:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_state &&
          this.revisitData.i_bendemographics.m_state.stateID) ||
        null,
      stateName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_state &&
          this.revisitData.i_bendemographics.m_state.stateName) ||
        null,
      stateCode:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_state &&
          this.revisitData.i_bendemographics.m_state.stateCode) ||
        null,
    });
  }
  /**
   * Config Districts  for Ben Edit
   */
  configDistrict() {
    this.districtList = [
      {
        districtID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_district &&
            this.revisitData.i_bendemographics.m_district.districtID) ||
          null,
        districtName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_district &&
            this.revisitData.i_bendemographics.m_district.districtName) ||
          null,
      },
    ];
    this.demographicDetailsForm.patchValue({
      districtID:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_district &&
          this.revisitData.i_bendemographics.m_district.districtID) ||
        null,
      districtName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_district &&
          this.revisitData.i_bendemographics.m_district.districtName) ||
        null,
    });
  }
  /**
   * Config Sub Districts  for Ben Edit
   */
  configSubDistrict() {
    this.subDistrictList = [
      {
        blockID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_districtblock &&
            this.revisitData.i_bendemographics.m_districtblock.blockID) ||
          null ||
          null,
        blockName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_districtblock &&
            this.revisitData.i_bendemographics.m_districtblock.blockName) ||
          null,
      },
    ];
    this.demographicDetailsForm.patchValue({
      blockID:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_districtblock &&
          this.revisitData.i_bendemographics.m_districtblock.blockID) ||
        null,
      blockName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_districtblock &&
          this.revisitData.i_bendemographics.m_districtblock.blockName) ||
        null,
    });
  }
  /**
   * Config Villages for Ben Edit
   */
  configVillage() {
    this.suggestedvillageList[0] = [
      {
        districtBranchID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_districtbranchmapping &&
            this.revisitData.i_bendemographics.m_districtbranchmapping
              .districtBranchID) ||
          null,
        villageName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_districtbranchmapping &&
            this.revisitData.i_bendemographics.m_districtbranchmapping
              .villageName) ||
          null,
      },
    ];
    this.villgeBranch = this.demographicDetailsForm.controls[
      'villages'
    ] as FormArray;
    this.villgeBranch.at(0).patchValue({
      villageID: {
        districtBranchID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_districtbranchmapping &&
            this.revisitData.i_bendemographics.m_districtbranchmapping
              .districtBranchID) ||
          null,
        villageName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.m_districtbranchmapping &&
            this.revisitData.i_bendemographics.m_districtbranchmapping
              .villageName) ||
          null,
      },
    });
    this.demographicDetailsForm.patchValue({
      villageID:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_districtbranchmapping &&
          this.revisitData.i_bendemographics.m_districtbranchmapping
            .districtBranchID) ||
        null,
      villageName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.m_districtbranchmapping &&
          this.revisitData.i_bendemographics.m_districtbranchmapping
            .villageName) ||
        null,
    });
    (<FormGroup>this.villgeBranch.at(0)).controls['villageID'].disable();
  }
  /**
   * Config Zones  for Ben Edit
   */
  configZone() {
    this.zonesList = [
      {
        zoneID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.zoneID) ||
          null,
        zoneName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.zoneName) ||
          null,
      },
    ];
    console.log(this.demographicsMaster.otherLoc, 'zoneLocs------mm-------');
    this.demographicDetailsForm.patchValue({
      zoneID:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.zoneID) ||
        null,
      zoneName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.zoneName) ||
        null,
    });
  }
  /**
   * Config Parking Place  for Ben Edit
   */
  configParkingPlace() {
    this.parkingPlaceList = [
      {
        parkingPlaceID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.parkingPlaceID) ||
          null,
        parkingPlaceName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.parkingPlaceName) ||
          null,
      },
    ];
    this.demographicDetailsForm.patchValue({
      parkingPlace:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.parkingPlaceID) ||
        null,
      parkingPlaceName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.parkingPlaceName) ||
        null,
    });
  }
  /**
   * Config Service Point  for Ben Edit
   */
  configServicePoint() {
    this.servicePointList = [
      {
        servicePointID:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.servicePointID) ||
          null,
        servicePointName:
          (this.revisitData.i_bendemographics &&
            this.revisitData.i_bendemographics.servicePointName) ||
          null,
      },
    ];
    this.demographicDetailsForm.patchValue({
      servicePoint:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.servicePointID) ||
        null,
      servicePointName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.servicePointName) ||
        null,
    });
  }
  /***********************************LOAD BEN EDIT DEMOGRAPHICS ENDS********************************/

  /***********************************LOAD NEW BEN DEMOGRAPHICS STARTS********************************/
  /**
   * Load Master and Current Demographic Details for an NEW Beneficiary
   * FOR BENEFICIARY NEW FROM LOCAL STORAGE
   */

  /**
   * Check and save location Data from Storage
   */
  loadLocationFromStorage() {
    const locationData: any = this.sessionstorage.getItem('location');
    const location = JSON.parse(locationData);
    this.demographicsMaster = Object.assign({}, location, {
      servicePointID: this.sessionstorage.getItem('servicePointID'),
      servicePointName: this.sessionstorage.getItem('servicePointName'),
    });
    this.villgeBranch = this.demographicDetailsForm.controls[
      'villages'
    ] as FormArray;
    this.villgeBranch.at(0).patchValue({
      villageID: {
        districtBranchID: null,
        villageName: null,
      },
    });
    this.suggestedvillageList[0] = null;
    console.log(this.demographicsMaster, 'demographics master');

    if (
      this.demographicsMaster.otherLoc &&
      this.demographicsMaster.stateMaster &&
      this.demographicsMaster.stateMaster.length >= 1 &&
      this.demographicsMaster.servicePointID &&
      this.demographicsMaster.servicePointName
    ) {
      this.loadLocalMasterForDemographic();
      this.subDistrictList = [];
      console.log(this.subFilteredVillageMaster);

      this.emptyVillage();
      this.emptyDistrict();
      this.emptySubDistrict();
      this.stateChangeOnLoad();
      this.disableDistrict = false;
    } else if (
      this.demographicsMaster.stateMaster &&
      this.demographicsMaster.stateMaster.length >= 1
    ) {
      this.statesList = this.demographicsMaster.stateMaster;
      this.loadServicePoint();
      this.districtList = [];
      this.subDistrictList = [];
      this.villageList = [];

      this.emptyVillage();
      this.emptySubDistrict();
      this.emptyDistrict();
      this.emptyState();
    }
  }

  // Calling all data masters separately
  loadLocalMasterForDemographic() {
    if (!this.patientRevisit) {
      this.loadState();
      this.loadSubDistrict();
      this.loadVillage();
      this.loadZone();
      this.loadParkingPlace();
      this.loadServicePoint();
    }
  }

  /**
   * Load States  for New Patient
   */
  loadState() {
    this.statesList = this.demographicsMaster.stateMaster;
    this.demographicDetailsForm.patchValue({
      stateID: this.locationData.stateID,
      stateName: this.locationData.stateName,
    });
  }

  /**
   * Load Sub Districts  for New Patient
   */
  loadSubDistrict() {
    this.subDistrictList = [
      {
        blockID: this.demographicsMaster.otherLoc.blockID,
        blockName: this.demographicsMaster.otherLoc.blockName,
      },
    ];
  }

  loadVillage() {
    this.villageList = this.demographicsMaster.villageMaster;
    this.demographicDetailsForm.patchValue({
      villageID: null,
      villageName: null,
    });
  }

  /**
   * Load Zones  for New Patient
   */
  loadZone() {
    this.zonesList = [
      {
        zoneID: this.demographicsMaster.otherLoc.zoneID,
        zoneName: this.demographicsMaster.otherLoc.zoneName,
      },
    ];
    console.log(this.demographicsMaster.otherLoc, 'zoneLocs------mm-------');
    this.demographicDetailsForm.patchValue({
      zoneID: this.demographicsMaster.otherLoc.zoneID,
      zoneName: this.demographicsMaster.otherLoc.zoneName,
    });
  }
  /**
   * Load Parking Place  for New Patient
   */
  loadParkingPlace() {
    this.parkingPlaceList = [
      {
        parkingPlaceID: this.demographicsMaster.otherLoc.parkingPlaceID,
        parkingPlaceName: this.demographicsMaster.otherLoc.parkingPlaceName,
      },
    ];
    this.demographicDetailsForm.patchValue({
      parkingPlace: this.demographicsMaster.otherLoc.parkingPlaceID,
      parkingPlaceName: this.demographicsMaster.otherLoc.parkingPlaceName,
    });
  }
  /**
   * Load Service  for New Patient
   */
  loadServicePoint() {
    this.servicePointList = [
      {
        servicePointID: this.demographicsMaster.servicePointID,
        servicePointName: this.demographicsMaster.servicePointName,
      },
    ];
    this.demographicDetailsForm.patchValue({
      servicePoint: this.demographicsMaster.servicePointID,
      servicePointName: this.demographicsMaster.servicePointName,
    });
  }

  /***********************************LOAD NEW BEN DEMOGRAPHICS ENDS********************************/

  /**
   * If there is any issue in loading location data for demographics then call this
   */

  locationErrors() {
    this.confirmationService.alert(
      this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
      'error'
    );
    this.router.navigate(['/registrar/search/']);
  }

  chooseLocations() {
    return [{ id: 3, name: 'State' }];
  }

  /**
   * Confirm User whether they want to edit the demographics
   */
  confirmEditDemographics(event: any) {
    const locationChoice = this.chooseLocations();

    if (event.checked === true) {
      this.demographicsEditEnabled = true;
      this.confirmationService
        .choice('Edit Location', locationChoice)
        .subscribe(res => {
          if (res) {
            this.demographicsEditText =
              this.currentLanguageSet.common.restoreDefault;
            this.editReConfig(res);
          } else {
            this.demographicsEditText =
              this.currentLanguageSet.bendetails.editLocation;
            this.demographicsEditEnabled = false;
          }
        });
    } else if (event.checked === false) {
      this.demographicsEditEnabled = false;
      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.sureToRemoveChanges,
          'Yes',
          'No'
        )
        .subscribe(res => {
          if (res) {
            this.demographicsEditText =
              this.currentLanguageSet.bendetails.editLocation;

            this.setDemographicDefaults();
          } else {
            this.demographicsEditText =
              this.currentLanguageSet.common.restoreDefault;
            this.demographicsEditEnabled = true;
          }
        });
    }
  }

  /**
   * ReConfig What to Enable for editing
   */
  editReConfig(request: any) {
    switch (request) {
      case 1:
        this.enableUptoTaluk();
        break;
      case 2:
        this.enableUptoDistrict();
        break;
      case 3:
        this.enableUptoState();
        break;
      default:
        break;
    }
  }

  /*************************** Enable/ Disable State/ District or SubDistrict ********/
  enableUptoTaluk() {
    this.emptyVillage();

    this.villageList = [];

    this.disableSubDistrict = false;

    this.onDistrictChange();
  }
  enableUptoDistrict() {
    this.emptyVillage();
    this.emptySubDistrict();

    this.villageList = [];
    this.subDistrictList = [];

    this.disableSubDistrict = false;
    this.disableDistrict = false;

    this.onStateChange();
  }

  enableUptoState() {
    this.emptyVillage();
    this.emptySubDistrict();
    this.emptyDistrict();
    this.emptyState();

    this.villageList = [];
    this.subDistrictList = [];
    this.districtList = [];

    this.disableSubDistrict = false;
    this.disableDistrict = false;
    this.disableState = false;
  }
  /*****--ENDS--************** Enable/ Disable State/ District or SubDistrict ********/

  /************ On Change of State, District, SubDistrict & Vilage */

  stateChangeOnLoad() {
    this.updateStateName(this.demographicDetailsForm.value.stateID);
    this.registrarService
      .getDistrictList(this.demographicDetailsForm.value.stateID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.districtList = res.data;
          this.emptyDistrict();
          this.emptySubDistrict();
          this.emptyVillage();
          this.demographicDetailsForm.patchValue({
            districtID: this.locationData.districtID,
            districtName: this.locationData.districtName,
          });
          this.onDistrictChangeOnLoad();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  onDistrictChangeOnLoad() {
    this.updateDistrictName(this.demographicDetailsForm.value.districtID);
    this.registrarService
      .getSubDistrictList(this.demographicDetailsForm.value.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.emptySubDistrict();
          this.demographicDetailsForm.patchValue({
            blockID: this.locationData.blockID,
            blockName: this.locationData.blockName,
          });
          this.onSubDistrictOnLoad();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  onSubDistrictOnLoad() {
    this.updateSubDistrictName();
    this.registrarService
      .getVillageList(this.demographicDetailsForm.value.blockID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.villageList = res.data;
          this.subFilteredVillageMaster[0] = this.villageList.slice();
          this.villgeBranch = this.demographicDetailsForm.controls[
            'villages'
          ] as FormArray;
          this.villgeBranch.at(0).patchValue({
            villageID: {
              districtBranchID: this.locationData.subDistrictID,
              villageName: this.locationData.villageName,
            },
          });
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
            'error'
          );
        }
      });
  }

  onSubDistrictChange() {
    this.updateSubDistrictName();

    this.registrarService
      .getVillageList(this.demographicDetailsForm.value.blockID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.villageList = res.data;
          this.subFilteredVillageMaster = res.data;
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
            'error'
          );
        }
      });
  }

  onDistrictChange() {
    this.updateDistrictName(this.demographicDetailsForm.value.districtID);
    this.registrarService
      .getSubDistrictList(this.demographicDetailsForm.value.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.emptySubDistrict();
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  onStateChange() {
    this.updateStateName(this.demographicDetailsForm.value.stateID);

    this.registrarService
      .getDistrictList(this.demographicDetailsForm.value.stateID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.districtList = res.data;
          this.emptyDistrict();
          this.emptySubDistrict();
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  /******--ENDS--****** On Change of State, District, SubDistrict */

  /** Remove Data from DropDowns */

  emptyVillage() {
    this.demographicDetailsForm.patchValue({
      villageID: null,
      villageName: null,
    });
  }

  emptySubDistrict() {
    this.demographicDetailsForm.patchValue({
      blockID: null,
      blockName: null,
    });
  }

  emptyDistrict() {
    this.demographicDetailsForm.patchValue({
      districtID: null,
      districtName: null,
    });
  }

  emptyState() {
    this.demographicDetailsForm.patchValue({
      stateID: null,
      stateName: null,
    });
  }

  /** --ENDS-- **Remove Data from DropDowns */

  /*****
   * Update State, District, SubDistrict and Village Name
   */
  updateVillageName() {
    const branches = this.demographicDetailsForm.value.villages[0].villageID;
    console.log('Branch' + branches);
    this.villageList.forEach((village: any) => {
      console.log(this.demographicDetailsForm.value);
      if (village.districtBranchID === branches.districtBranchID) {
        this.demographicDetailsForm.patchValue({
          villageID: village.villageName,
        });
      }
    });
  }
  displayVillage(village: any) {
    console.log(village);
    return village && village.villageName;
  }

  updateSubDistrictName() {
    this.subDistrictList.forEach((subDistrict: any) => {
      if (subDistrict.blockID === this.demographicDetailsForm.value.blockID) {
        this.demographicDetailsForm.patchValue({
          blockName: subDistrict.blockName,
        });
      }
    });
  }
  updateDistrictName(patchDistrict: any) {
    if (patchDistrict !== undefined && patchDistrict !== null) {
      this.districtList.find((district: any) => {
        if (district.districtName === patchDistrict) {
          this.demographicDetailsForm.patchValue({
            districtID: district.districtID,
            districtName: district.districtName,
          });
          this.fetchSubDistrictsOnDistrictSelection();
        } else {
          if (district.districtID === patchDistrict) {
            this.demographicDetailsForm.patchValue({
              districtID: district.districtID,
              districtName: district.districtName,
            });
          }
        }
      });
    }
  }

  fetchSubDistrictsOnDistrictSelection() {
    this.registrarService
      .getSubDistrictList(this.demographicDetailsForm.value.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.emptySubDistrict();
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  updateStateName(patchState: any) {
    if (patchState !== undefined && patchState !== null) {
      this.statesList.find((state: any) => {
        if (state.stateID === patchState) {
          this.demographicDetailsForm.patchValue({
            stateID: state.stateID,
            stateName: state.stateName,
          });
        }
      });
    }
  }

  /*New code to populate district and taluk -using villageID*/

  onChangeVillage(event: any) {
    console.log('VillageID' + event);
    this.registrarService
      .getDistrictTalukList(event.districtBranchID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.DistrictTalukList = res.data;

          console.log(this.DistrictTalukList[0].districtID);
          this.districtList = res.data;
          this.subDistrictList = res.data;

          this.demographicDetailsForm.patchValue({
            districtID: this.DistrictTalukList[0].districtID,
            blockID: this.DistrictTalukList[0].blockID,
            blockName: this.DistrictTalukList[0].blockName,
            districtName: this.DistrictTalukList[0].districtName,
          });

          this.updateVillageName();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
            'error'
          );
        }
      });
  }

  /**
   * New -- Confirm User whether they want to edit the demographics
   */
  confirmEditDemographicsNew(event: any) {
    if (event.checked === true) {
      this.demographicsEditEnabled = true;
      this.dialogRef = this.dialog.open(RegisterEditLocationComponent);

      this.dialogRef.afterClosed().subscribe(result => {
        if (result !== undefined && result !== null) {
          console.log(result.data);
          this.villageList = result.data.villageList;
          this.suggestedvillageList[0] = result.data.selectedVillage;
          console.log('SuggestedList' + this.suggestedvillageList[0]);

          this.emptyVillage();
          this.villgeBranch = this.demographicDetailsForm.controls[
            'villages'
          ] as FormArray;
          this.villgeBranch.at(0).patchValue({
            villageID: {
              districtBranchID: result.data.selectedVillage[0].villageID,
              villageName: result.data.selectedVillage[0].villageName,
            },
          });
          (<FormGroup>this.villgeBranch.at(0)).controls['villageID'].enable();
          console.log(this.villgeBranch);
          console.log(this.demographicDetailsForm.value.villages[0]);

          this.updateVillageName();

          this.districtList = result.data.selectedDistrict;
          this.subDistrictList = result.data.selectedBlock;
          console.log(
            'Selected' + result.data.selectedDistrict[0].districtName
          );
          this.demographicDetailsForm.patchValue({
            stateID: result.data.selectedState[0].stateID,
            stateName: result.data.selectedState[0].stateName,
            districtID: result.data.selectedDistrict[0].districtID,
            districtName: result.data.selectedDistrict[0].districtName,
            blockID: result.data.selectedBlock[0].blockID,
            blockName: result.data.selectedBlock[0].blockName,
          });

          this.disableDistrict = true;
          this.disableSubDistrict = true;
          (<FormGroup>this.villgeBranch.at(0)).controls['villageID'].disable();
          this.demographicsEditText =
            this.currentLanguageSet.common.restoreDefault;
        } else {
          this.demographicsEditText =
            this.currentLanguageSet.bendetails.editLocation;
          this.demographicsEditEnabled = false;

          this.disableDistrict = true;
          this.disableSubDistrict = true;
          if (!this.patientRevisit) {
            (<FormGroup>this.villgeBranch.at(0)).controls['villageID'].enable();
          }
        }
      });
    } else if (event.checked === false) {
      this.demographicsEditEnabled = false;
      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.sureToRemoveChanges,
          'Yes',
          'No'
        )
        .subscribe(res => {
          if (res) {
            this.disableDistrict = false;
            this.disableSubDistrict = false;
            this.disableVillage = false;
            this.demographicsEditText =
              this.currentLanguageSet.bendetails.editLocation;
            this.setDemographicDefaults();
          } else {
            this.demographicsEditText =
              this.currentLanguageSet.common.restoreDefault;
            this.demographicsEditEnabled = true;
          }
        });
    }
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
    if (
      this.currentLanguageSet !== undefined &&
      this.currentLanguageSet !== null
    ) {
      if (this.demographicsEditEnabled !== false) {
        this.demographicsEditText =
          this.currentLanguageSet.common.restoreDefault;
      } else {
        this.demographicsEditText =
          this.currentLanguageSet.bendetails.editLocation;
      }
    }
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
