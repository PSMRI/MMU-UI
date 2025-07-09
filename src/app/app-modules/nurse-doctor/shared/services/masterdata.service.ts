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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class MasterdataService {
  private _listners = new Subject<any>();

  listen(): Observable<any> {
    return this._listners.asObservable();
  }

  filter(filterBy: string) {
    this._listners.next(filterBy);
  }
  contactfilter(filterBy: string) {
    this._listners.next(filterBy);
  }
  /**
   * All master Data Urls
   */
  visitDetailMasterDataUrl = environment.visitDetailMasterDataUrl;
  nurseMasterDataUrl = environment.nurseMasterDataUrl;
  doctorMasterDataUrl = environment.doctorMasterDataUrl;
  snoMedDataURL = environment.snomedCTRecordURL;
  diagnosisSnomedCTRecordUrl = environment.diagnosisSnomedCTRecordUrl;
  diagnosisSnomedCTRecordUrl1 = environment.diagnosisSnomedCTRecordUrl1;
  vaccinationTypeAndDoseMasterUrl = environment.vaccinationTypeAndDoseMasterUrl;
  previousCovidVaccinationUrl = environment.previousCovidVaccinationUrl;

  /**
   * Visit details master data observable and source
   */
  visitDetailMasterDataSource = new BehaviorSubject<any>(null);
  visitDetailMasterData$ = this.visitDetailMasterDataSource.asObservable();

  /**
   * Nurse master data observable and source
   */
  nurseMasterDataSource = new BehaviorSubject<any>(null);
  nurseMasterData$ = this.nurseMasterDataSource.asObservable();

  /**
   * Doctor master data observable and source
   */
  doctorMasterDataSource = new BehaviorSubject<any>(null);
  doctorMasterData$ = this.doctorMasterDataSource.asObservable();

  getCalibrationStrips = environment.getCalibrationStrips;

  constructor(
    private http: HttpClient,
    readonly sessionstorage: SessionStorageService
  ) {}

  /**
   * Visit details master data api call
   */
  getVisitDetailMasterData() {
    return this.http
      .get(this.visitDetailMasterDataUrl)
      .subscribe((res: any) => {
        this.visitDetailMasterDataSource.next(res.data);
      });
  }

  /**
   * Nurse master data api call
   */
  getNurseMasterData(visitID: string, providerServiceID: any) {
    const gender = this.sessionstorage.getItem('beneficiaryGender');
    return (
      this.http
        .get(
          this.nurseMasterDataUrl +
            visitID +
            '/' +
            providerServiceID +
            '/' +
            gender
        )
        // return this.http.get(this.nurseMasterDataUrl+visitID)
        .subscribe((res: any) => {
          this.nurseMasterDataSource.next(res.data);
        })
    );
  }

  /**
   * Doctor master data api call
   */
  getDoctorMasterData(visitID: string, providerServiceID: any) {
    let facilityID = 0;
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    if (
      JSON.parse(serviceLineDetails).facilityID !== undefined &&
      JSON.parse(serviceLineDetails).facilityID !== null
    ) {
      facilityID = JSON.parse(serviceLineDetails).facilityID;
    }
    let vanID = 0;
    if (
      JSON.parse(serviceLineDetails).vanID !== undefined &&
      JSON.parse(serviceLineDetails).vanID !== null
    ) {
      vanID = JSON.parse(serviceLineDetails).vanID;
    }
    const gender = this.sessionstorage.getItem('beneficiaryGender');
    console.log('facility', facilityID);

    return this.http
      .get(
        this.doctorMasterDataUrl +
          visitID +
          '/' +
          providerServiceID +
          '/' +
          gender +
          '/' +
          facilityID +
          '/' +
          vanID
      )
      .subscribe((res: any) => {
        console.log('res.data', res.data);

        this.doctorMasterDataSource.next(res.data);
      });
  }

  getDoctorMasterDataForNurse(visitID: string, providerServiceID: any) {
    let facilityID = 0;
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    if (
      JSON.parse(serviceLineDetails).facilityID !== undefined &&
      JSON.parse(serviceLineDetails).facilityID !== null
    ) {
      facilityID = JSON.parse(serviceLineDetails).facilityID;
    }
    let vanID = 0;
    if (
      JSON.parse(serviceLineDetails).vanID !== undefined &&
      JSON.parse(serviceLineDetails).vanID !== null
    ) {
      vanID = JSON.parse(serviceLineDetails).vanID;
    }
    const gender = this.sessionstorage.getItem('beneficiaryGender');
    console.log('facility', facilityID);

    return this.http.get(
      this.doctorMasterDataUrl +
        visitID +
        '/' +
        providerServiceID +
        '/' +
        gender +
        '/' +
        facilityID +
        '/' +
        vanID
    );
  }

  getSnomedCTRecord(term: any) {
    return this.http.post(this.snoMedDataURL, { term: term });
  }
  getReportsMaster() {
    const serviceID = this.sessionstorage.getItem('serviceID');
    return this.http.get(environment.getReportsMasterUrl + serviceID);
  }
  getVanMaster() {
    const providerServiceID = this.sessionstorage.getItem('providerServiceID');
    return this.http.get(environment.getVanMasterUrl + providerServiceID);
  }

  getReportData(reportRequst: any) {
    return this.http.post(environment.getReportDataUrl, reportRequst);
  }

  searchDiagnosisBasedOnPageNo(searchTerm: any, pageNo: any) {
    const body = {
      term: searchTerm,
      pageNo: pageNo,
    };
    return this.http.post(this.diagnosisSnomedCTRecordUrl, body);
  }

  reset() {
    this.visitDetailMasterDataSource.next(null);
    this.nurseMasterDataSource.next(null);
    this.doctorMasterDataSource.next(null);
  }

  searchDiagnosisBasedOnPageNo1(searchTerm: any, pageNo: any) {
    const body = {
      term: searchTerm,
      pageNo: pageNo,
    };
    return this.http.post(this.diagnosisSnomedCTRecordUrl1, body);
  }
  fetchCalibrationStrips(providerServiceID: any, pageNo: any) {
    const body = {
      providerServiceMapID: providerServiceID,
      pageNo: pageNo,
    };
    return this.http.post(this.getCalibrationStrips, body);
  }

  getVaccinationTypeAndDoseMaster() {
    return this.http.get(this.vaccinationTypeAndDoseMasterUrl);
  }

  getPreviousCovidVaccinationDetails(beneficiaryRegID: any) {
    const reqObj = {
      beneficiaryRegID: beneficiaryRegID,
    };
    return this.http.post(this.previousCovidVaccinationUrl, reqObj);
  }
}
