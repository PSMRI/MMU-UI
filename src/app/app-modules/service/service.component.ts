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
import { Router } from '@angular/router';
import { SetLanguageComponent } from '../core/components/set-language.component';
import { ConfirmationService } from '../core/services';
import { HttpServiceService } from '../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css'],
})
export class ServiceComponent implements OnInit, DoCheck {
  servicesList: any;
  serviceIDs: any;
  fullName: any;
  currentLanguageSet: any;
  designation: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private languageComponent: SetLanguageComponent,
    private router: Router,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    const services: any = this.sessionstorage.getItem('services');
    this.servicesList = JSON.parse(services);
    this.fullName = this.sessionstorage.getItem('fullName');
  }

  loginDataResponse: any;
  selectService(service: any) {
    this.sessionstorage.setItem('providerServiceID', service.providerServiceID);
    this.sessionstorage.setItem('serviceName', service.serviceName);
    this.sessionstorage.setItem('serviceID', service.serviceID);
    sessionStorage.setItem('apimanClientKey', service.apimanClientKey);
    const loginDataResponse: any =
      this.sessionstorage.getItem('loginDataResponse');
    this.loginDataResponse = JSON.parse(loginDataResponse);
    this.checkRoleAndDesingnationMappedForservice(
      this.loginDataResponse,
      service
    );
  }

  checkRoleAndDesingnationMappedForservice(
    loginDataResponse: any,
    service: any
  ) {
    let serviceData: any;

    if (
      loginDataResponse &&
      loginDataResponse.previlegeObj !== null &&
      loginDataResponse.previlegeObj !== undefined
    ) {
      serviceData = loginDataResponse.previlegeObj.filter((item: any) => {
        return item.serviceName === service.serviceName;
      })[0];

      if (serviceData !== null) {
        this.checkMappedRoleForService(serviceData);
      }
    }
  }

  roleArray: any = [];
  checkMappedRoleForService(serviceData: any) {
    this.roleArray = [];
    let roleData;
    if (serviceData.roles) {
      roleData = serviceData.roles;
      if (roleData.length > 0) {
        roleData.forEach((role: any) => {
          role.serviceRoleScreenMappings.forEach((serviceRole: any) => {
            this.roleArray.push(serviceRole.screen.screenName);
          });
        });
        if (this.roleArray && this.roleArray.length > 0) {
          this.sessionstorage.setItem('role', JSON.stringify(this.roleArray));
          this.checkMappedDesignation(this.loginDataResponse);
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.mapRoleFeature,
            'error'
          );
        }
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.mapRoleFeature,
          'error'
        );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.mapRoleFeature,
        'error'
      );
    }
  }

  checkMappedDesignation(loginDataResponse: {
    designation: { designationName: any };
  }) {
    if (
      loginDataResponse.designation &&
      loginDataResponse.designation.designationName
    ) {
      this.designation = loginDataResponse.designation.designationName;
      if (this.designation !== null) {
        this.checkDesignationWithRole();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.mapDesignation,
          'error'
        );
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.mapDesignation,
        'error'
      );
    }
  }

  checkDesignationWithRole() {
    if (this.roleArray.includes(this.designation)) {
      this.sessionstorage.setItem('designation', this.designation);
      this.routeToDesignation(this.designation);
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.mapDesignation,
        'error'
      );
    }
  }

  routeToDesignation(designation: any) {
    this.router.navigate(['/servicePoint']);
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
