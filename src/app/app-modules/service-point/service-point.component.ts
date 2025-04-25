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

import { Component, DoCheck, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from '../core/components/set-language.component';
import { ConfirmationService } from '../core/services';
import { HttpServiceService } from '../core/services/http-service.service';
import { ServicePointService } from './service-point.service';
import { FormBuilder, Validators } from '@angular/forms';
import { RegistrarService } from '../registrar/shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-service-point',
  templateUrl: './service-point.component.html',
  styleUrls: ['./service-point.component.css'],
})
export class ServicePointComponent implements OnInit, DoCheck {
  designation: any;
  vanServicepointDetails: any;
  servicePointsList: any = [];
  filteredServicePoints: any = [];
  vansList: any = [];

  sessionsList = [
    {
      sessionID: 1,
      sessionName: 'Morning',
    },
    {
      sessionID: 2,
      sessionName: 'Evening',
    },
    {
      sessionID: 3,
      sessionName: 'Full Day',
    },
  ];

  showVan = false;

  userId: any;
  serviceProviderId: any;
  isDisabled = true;
  currentLanguageSet: any;
  statesList: any = [];
  districtList: any = [];
  subDistrictList: any = [];
  demographicsMaster: any;
  villageList: any = [];
  userLocationDetails: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private servicePointService: ServicePointService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private languageComponent: SetLanguageComponent,
    readonly sessionstorage: SessionStorageService
  ) {}

  servicePointForm = this.fb.group({
    sessionID: ['', Validators.required],
    vanID: ['', Validators.required],
    servicePointName: ['', Validators.required],
    servicePointID: ['', Validators.required],
    stateID: ['', Validators.required],
    stateName: ['', Validators.required],
    districtID: ['', Validators.required],
    districtName: ['', Validators.required],
    blockID: ['', Validators.required],
    blockName: ['', Validators.required],
    districtBranchID: ['', Validators.required],
    villageName: ['', Validators.required],
  });

  ngOnInit() {
    this.fetchLanguageResponse();
    this.serviceProviderId = this.sessionstorage.getItem('providerServiceID');
    this.userId = this.sessionstorage.getItem('userID');
    this.getServicePoint();
  }

  // resetLocalStorage() {
  //   sessionStorage.removeItem('sessionID');
  //   sessionStorage.removeItem('serviceLineDetails');
  //   sessionStorage.removeItem('vanType');
  //   sessionStorage.removeItem('location');
  //   sessionStorage.removeItem('servicePointID');
  //   // sessionStorage.removeItem('servicePointName');
  //   sessionStorage.removeItem('facilityID');
  // }

  getServicePoint() {
    this.route.data.subscribe({
      next: (res: any) => {
        if (
          res.servicePoints.statusCode === 200 &&
          res.servicePoints.data !== null
        ) {
          const data = res.servicePoints.data;
          if (data.UserVanSpDetails)
            this.vanServicepointDetails = data.UserVanSpDetails;
        } else if (res.servicePoints.statusCode === 5002) {
          this.confirmationService.alert(
            res.servicePoints.errorMessage,
            'error'
          );
        } else {
          this.confirmationService.alert(
            res.servicePoints.errorMessage,
            'error'
          );
          this.router.navigate(['/service']);
        }
      },
      error: (err: any) => {
        this.confirmationService.alert(err, 'error');
      },
    });
  }

  filterVansList() {
    if (this.servicePointForm.controls.sessionID.value)
      this.sessionstorage.setItem(
        'sessionID',
        this.servicePointForm.controls.sessionID.value
      );

    this.vansList = [];
    this.filteredServicePoints = [];
    // this.vanID = null;
    this.servicePointForm.controls.servicePointID.reset();
    this.servicePointForm.controls.servicePointName.reset();
    this.servicePointForm.controls.vanID.reset();
    this.servicePointForm.controls.servicePointName.reset();

    if (this.vanServicepointDetails)
      this.vansList = this.vanServicepointDetails.filter((item: any) => {
        if (item.vanSession === 3) {
          return item.vanSession;
        } else {
          return (
            item.vanSession === this.servicePointForm.controls.sessionID.value
          );
        }
      });

    this.vansList = this.vansList.filter((item: any, index: any, self: any) => {
      return (
        self.findIndex((t: any) => {
          return t.vanID === item.vanID;
        }) === index
      );
    });
    this.servicePointsList = [];
  }
  filterServicePointsList() {
    this.saveVanType();
    const serviceLineDetails: any = this.vansList.filter((van: any) => {
      return this.servicePointForm.controls.vanID.value === van.vanID;
    })[0];

    this.sessionstorage.setItem(
      'serviceLineDetails',
      JSON.stringify(serviceLineDetails)
    );
    if (serviceLineDetails.facilityID) {
      sessionStorage.setItem('facilityID', serviceLineDetails.facilityID);
    }
    this.servicePointForm.controls.servicePointID.reset();
    this.servicePointForm.controls.servicePointName.reset();
    this.filteredServicePoints = [];
    this.isDisabled = false;
    if (this.vanServicepointDetails)
      this.servicePointsList = this.vanServicepointDetails.filter(
        (item: any) => {
          if (item.vanSession === '3') {
            return item.vanID === this.servicePointForm.controls.vanID.value;
          } else {
            return (
              item.vanID === this.servicePointForm.controls.vanID.value &&
              item.vanSession === this.servicePointForm.controls.sessionID.value
            );
          }
        }
      );
    this.servicePointsList = this.servicePointsList.filter(
      (item: any, index: any, self: any) => {
        return (
          self.findIndex((t: any) => {
            return t.servicePointID === item.servicePointID;
          }) === index
        );
      }
    );

    this.filteredServicePoints = this.servicePointsList.slice(0, 10);
  }

  /**
   * Temporary Solution, some code for workaround will be replaced
   */

  saveVanType() {
    let vanDetail: any;
    this.vansList.forEach((van: any) => {
      if (van.vanID === this.servicePointForm.controls.vanID.value) {
        vanDetail = van.vanNoAndType;
      }
    });
    const index = vanDetail.indexOf('- ');
    if (index !== -1) {
      this.sessionstorage.setItem('vanType', vanDetail.substring(index + 2));
    }
  }

  filterServicePointVan(searchTerm: any) {
    if (searchTerm) {
      this.filteredServicePoints = this.servicePointsList.filter(
        (servicePoint: any) => {
          return servicePoint.servicePointName
            .toLowerCase()
            .startsWith(searchTerm.toLowerCase());
        }
      );
    } else {
      this.filteredServicePoints = this.servicePointsList.slice(0, 10);
    }
  }

  routeToDesignation(designation: any) {
    switch (designation) {
      case 'Registrar':
        this.router.navigate(['/registrar/search']);
        break;
      case 'Nurse':
        this.router.navigate(['/nurse-doctor/nurse-worklist']);
        break;
      case 'Doctor':
        this.router.navigate(['/nurse-doctor/doctor-worklist']);
        break;
      case 'Lab Technician':
        this.router.navigate(['/lab']);
        break;
      case 'Pharmacist':
        this.router.navigate(['/pharmacist']);
        break;
      case 'Radiologist':
        this.router.navigate(['/nurse-doctor/radiologist-worklist']);
        break;
      case 'Oncologist':
        this.router.navigate(['/nurse-doctor/oncologist-worklist']);
        break;
      default:
    }
  }

  getDemographics() {
    const temp: any = this.servicePointsList.filter(
      (item: any) =>
        item.servicePointName ===
        this.servicePointForm.controls.servicePointName.value
    );
    let spIDs = '';
    if (temp.length > 0) {
      this.sessionstorage.setItem('servicePointID', temp[0].servicePointID);
      spIDs = temp[0].servicePointID;
      this.servicePointForm.controls.servicePointID.patchValue(
        temp[0].servicePointID
      );
      if (this.servicePointForm.controls.servicePointName.value) {
        this.sessionstorage.setItem(
          'servicePointName',
          this.servicePointForm.controls.servicePointName.value
        );
        const spID = spIDs;
        const spPSMID = this.sessionstorage.getItem('providerServiceID');
        const userId = this.sessionstorage.getItem('userID');
        this.servicePointService
          .getMMUDemographics(spID, spPSMID, userId)
          .subscribe((res: any) => {
            if (res && res.statusCode === 200) {
              this.saveDemographicsToStorage(res.data);
            } else {
              this.locationGathetingIssues();
            }
          });
      }
    } else {
      this.servicePointForm.controls.stateID.reset();
      this.servicePointForm.controls.districtID.reset();
      this.servicePointForm.controls.blockID.reset();
      this.servicePointForm.controls.districtBranchID.reset();
      this.statesList = [];
      this.districtList = [];
      this.subDistrictList = [];
      this.villageList = [];
    }
  }

  saveDemographicsToStorage(data: any) {
    if (data) {
      if (data?.userDetails) {
        this.sessionstorage.setItem('location', JSON.stringify(data));
        this.statesList = data.stateMaster;
        this.servicePointForm.controls.stateID.patchValue(
          data?.userDetails?.stateID
        );
        this.servicePointForm.controls.stateName.patchValue(
          data?.userDetails?.stateName
        );
        this.districtList = data?.userDetails?.districtList;
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issuesInFetchingLocationDetails,
          'error'
        );
      }
    } else {
      this.locationGathetingIssues();
    }
  }
  fetchDistricts(stateID: any) {
    this.registrarService.getDistrictList(stateID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.districtList = res.data;
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
          'error'
        );
      }
    });
  }

  fetchDistrictsOnStateSelection(stateID: any) {
    if (stateID) {
      this.statesList.forEach((item: any) => {
        if (item.stateID === stateID)
          return this.servicePointForm.controls.stateName.setValue(
            item.stateName
          );
      });
    }
    this.registrarService.getDistrictList(stateID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.districtList = res.data;
        this.servicePointForm.controls.blockID.reset();
        this.servicePointForm.controls.districtBranchID.reset();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issuesInFetchingDemographics,
          'error'
        );
      }
    });
  }

  fetchSubDistrictsOnDistrictSelection(districtID: any) {
    if (districtID) {
      this.districtList.forEach((item: any) => {
        if (item.districtID === districtID)
          return this.servicePointForm.controls.districtName.setValue(
            item.districtName
          );
      });
    }
    this.registrarService
      .getSubDistrictList(districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.servicePointForm.controls.districtBranchID.reset();
        }
      });
  }

  getVillageMaster(locDetails: any) {
    const blockID = locDetails?.userDetails?.blockList[0]?.blockId;
    this.registrarService.getVillageList(blockID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.villageList = res.data;
        this.servicePointForm.controls.districtBranchID.reset();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
          'error'
        );
      }
    });
  }

  onSubDistrictChange(blockID: any) {
    if (blockID) {
      this.subDistrictList.forEach((item: any) => {
        if (item.blockID === blockID)
          return this.servicePointForm.controls.blockName.setValue(
            item.blockName
          );
      });
    }
    this.registrarService.getVillageList(blockID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.villageList = res.data;
        this.servicePointForm.controls.districtBranchID.reset();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issuesinfetchingLocation,
          'error'
        );
      }
    });
  }

  onDistrictBranchSelection(districtBranchID: any) {
    if (districtBranchID) {
      this.villageList.forEach((item: any) => {
        if (item.districtBranchID === districtBranchID)
          return this.servicePointForm.controls.villageName.setValue(
            item.villageName
          );
      });
    }
  }

  saveLocationDataToStorage() {
    const locationData = {
      stateID: this.servicePointForm.controls.stateID.value,
      stateName: this.servicePointForm.controls.stateName.value,
      // stateName : this.stateName,
      districtID: this.servicePointForm.controls.districtID.value,
      districtName: this.servicePointForm.controls.districtName.value,
      blockName: this.servicePointForm.controls.blockName.value,
      blockID: this.servicePointForm.controls.blockID.value,
      subDistrictID: this.servicePointForm.controls.districtBranchID.value,
      villageName: this.servicePointForm.controls.villageName.value,
    };

    // Convert the object into a JSON string
    const locationDataJSON = JSON.stringify(locationData);

    // Store the JSON string in this.sessionstorage
    this.sessionstorage.setItem('locationData', locationDataJSON);
    this.goToWorkList();
  }

  goToWorkList() {
    this.designation = this.sessionstorage.getItem('designation');
    this.routeToDesignation(this.designation);
  }

  locationGathetingIssues() {
    this.confirmationService.alert(
      'Issues in getting your location, Please try to re-login.',
      'error'
    );
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
