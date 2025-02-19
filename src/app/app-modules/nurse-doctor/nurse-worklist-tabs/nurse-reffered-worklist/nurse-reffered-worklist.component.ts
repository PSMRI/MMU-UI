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

import { Component, DoCheck, OnInit, ViewChild } from '@angular/core';
import { NurseService } from '../../shared/services';
import { Router } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import {
  BeneficiaryDetailsService,
  CameraService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import * as moment from 'moment';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-reffered-worklist',
  templateUrl: './nurse-reffered-worklist.component.html',
  styleUrls: ['./nurse-reffered-worklist.component.css'],
})
export class NurseRefferedWorklistComponent implements OnInit, DoCheck {
  currentLanguageSet: any;
  currentPage: number = 0;
  displayedColumns: any = [
    'sno',
    'beneficiaryID',
    'beneficiaryName',
    'gender',
    'age',
    'status',
    'fatherName',
    'district',
    'phoneNo',
    'image',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private router: Router,
    private nurseService: NurseService,
    private confirmationService: ConfirmationService,
    private httpServices: HttpServiceService,
    private cameraService: CameraService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('currentRole', 'Doctor');
    sessionStorage.removeItem('tmCaseSheet');
    this.removeBeneficiaryDataForNurseVisit();
    this.loadWorklist();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  beneficiaryList: any;
  filteredBeneficiaryList: any = [];
  activePage = 1;
  pagedList = [];
  rowsPerPage = 5;
  filterTerm: any;
  blankTable = [1, 2, 3, 4, 5];

  filterBeneficiaryList(searchTerm: string) {
    if (!searchTerm) {
      this.filteredBeneficiaryList = this.beneficiaryList;
      this.dataSource.data = this.filteredBeneficiaryList;
      this.dataSource.paginator = this.paginator;
      this.dataSource.data.forEach((sectionCount: any, index: number) => {
        sectionCount.sno = index + 1;
      });
    } else {
      this.filteredBeneficiaryList = [];
      this.beneficiaryList.forEach((item: any) => {
        console.log('item', JSON.stringify(item, null, 4));
        for (const key in item) {
          if (
            key === 'beneficiaryID' ||
            key === 'benName' ||
            key === 'genderName' ||
            key === 'fatherName' ||
            key === 'districtName' ||
            key === 'preferredPhoneNum' ||
            key === 'villageName'
          ) {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredBeneficiaryList.push(item);
              this.dataSource.data.push(item);
              this.dataSource.paginator = this.paginator;
              this.dataSource.data.forEach(
                (sectionCount: any, index: number) => {
                  sectionCount.sno = index + 1;
                }
              );
              break;
            }
          } else {
            if (key === 'benVisitNo') {
              const value: string = '' + item[key];
              if (value === '1') {
                const val = 'First visit';
                if (val.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
                  this.filteredBeneficiaryList.push(item);
                  this.dataSource.data.push(item);
                  this.dataSource.paginator = this.paginator;
                  this.dataSource.data.forEach(
                    (sectionCount: any, index: number) => {
                      sectionCount.sno = index + 1;
                    }
                  );
                  break;
                }
              } else {
                const val = 'Revisit';
                if (val.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
                  this.filteredBeneficiaryList.push(item);
                  this.dataSource.data.push(item);
                  this.dataSource.paginator = this.paginator;
                  this.dataSource.data.forEach(
                    (sectionCount: any, index: number) => {
                      sectionCount.sno = index + 1;
                    }
                  );
                  break;
                }
              }
            }
          }
        }
      });
    }
  }
  pageChanged(event: any): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredBeneficiaryList.slice(startItem, endItem);
  }
  loadWorklist() {
    sessionStorage.removeItem('disableNoOnSuccessOfYes');
    this.filterTerm = null;
    this.nurseService.getNurseWorklistTMreferred().subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          const benlist = this.loadDataToBenList(res.data);
          this.beneficiaryList = benlist;
          this.filteredBeneficiaryList = benlist;
          this.filteredBeneficiaryList = this.filteredBeneficiaryList.filter(
            (visitCategory: any) =>
              visitCategory.VisitCategory === 'NCD screening'
          );
          this.dataSource.data = [];
          this.dataSource.data = benlist;
          this.dataSource.paginator = this.paginator;
          this.dataSource.data.forEach((sectionCount: any, index: number) => {
            sectionCount.sno = index + 1;
          });
          this.filterTerm = null;
          this.currentPage = 1;
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
    console.log(
      'filtered Beneficiary List',
      JSON.stringify(this.filteredBeneficiaryList)
    );
  }

  loadDataToBenList(data: any) {
    data.forEach((element: any) => {
      element.benFlowID = element.benFlowID || 'Not Available';
      element.beneficiaryRegID = element.beneficiaryRegID || 'Not Available';
      element.benVisitID = element.benVisitID || 'Not Available';
      element.visitCode = element.visitCode || 'Not Available';
      element.VisitReason = element.VisitReason || 'Not Available';
      element.VisitCategory = element.VisitCategory || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.nurseFlag = element.nurseFlag || 'Not Available';
      element.doctorFlag = element.doctorFlag || 'Not Available';
      element.pharmacist_flag = element.pharmacist_flag || 'Not Available';
      element.lab_technician_flag =
        element.lab_technician_flag || 'Not Available';
      element.radiologist_flag = element.radiologist_flag || 'Not Available';
      element.oncologist_flag = element.oncologist_flag || 'Not Available';
      element.specialist_flag = element.specialist_flag || 'Not Available';
      element.agentId = element.agentId || 'Not Available';
      element.visitDate =
        moment(element.visitDate).format('DD-MM-YYYY HH:mm A') ||
        'Not Available';
      element.modified_date =
        moment(element.modified_date).format('DD-MM-YYYY HH:mm A') ||
        'Not Available';
      element.benName = element.benName || 'Not Available';
      element.deleted = element.deleted || 'Not Available';
      element.age = element.age || 'Not Available';
      element.ben_age_val = element.ben_age_val || 'Not Available';
      element.dOB =
        moment(element.dOB).format('DD-MM-YYYY HH:mm A') || 'Not Available';
      element.genderID = element.genderID || 'Not Available';
      element.genderName = element.genderName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      element.fatherName = element.fatherName || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.servicePointName = element.servicePointName || 'Not Available';
      element.registrationDate =
        moment(element.registrationDate).format('DD-MM-YYYY HH:mm A') ||
        'Not Available';
      element.benVisitDate =
        moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A') ||
        'Not Available';
      element.consultationDate =
        moment(element.consultationDate).format('DD-MM-YYYY HH:mm A') ||
        'Not Available';
      element.servicePointID = element.servicePointID || 'Not Available';
      element.districtID = element.districtID || 'Not Available';
      element.villageID = element.villageID || 'Not Available';
      element.vanID = element.vanID || 'Not Available';
      element.providerServiceMapId =
        element.providerServiceMapId || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.beneficiaryID = element.beneficiaryID || 'Not Available';
      element.labIteration = element.labIteration || 'Not Available';
      element.processed = element.processed || 'Not Available';
      element.benArrivedFlag = element.benArrivedFlag || 'Not Available';
      element.tCSpecialistUserID =
        element.tCSpecialistUserID || 'Not Available';
      element.isTMVisitDone = element.isTMVisitDone || 'Not Available';
    });
    return data;
  }

  patientImageView(benregID: any) {
    this.beneficiaryDetailsService
      .getBeneficiaryImage(benregID)
      .subscribe((data: any) => {
        if (data && data.benImage) this.cameraService.viewImage(data.benImage);
        else
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.imageNotFound
          );
      });
  }

  loadNursePatientDetails(beneficiary: any) {
    console.log('beneficiary', JSON.stringify(beneficiary, null, 4));
    this.sessionstorage.setItem('visitCode', beneficiary.visitCode);
    this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
    if (beneficiary.specialist_flag === 100) {
      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.confirmtoProceedFurther
        )
        .subscribe(result => {
          if (result) {
            this.sessionstorage.setItem(
              'beneficiaryGender',
              beneficiary.genderName
            );
            this.sessionstorage.setItem(
              'beneficiaryRegID',
              beneficiary.beneficiaryRegID
            );
            this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
            this.sessionstorage.setItem(
              'beneficiaryID',
              beneficiary.beneficiaryID
            );
            this.sessionstorage.setItem(
              'specialist_flag',
              beneficiary.specialist_flag
            );
            this.sessionstorage.setItem(
              'beneficiaryData',
              JSON.stringify(beneficiary)
            );
            this.router.navigate([
              '/nurse-doctor/attendant/nurse/patient/',
              beneficiary.beneficiaryRegID,
            ]);
          }
        });
    } else if (beneficiary.specialist_flag === 200) {
      sessionStorage.setItem('tmCaseSheet', 'true');
      this.viewAndPrintCaseSheet(beneficiary);
    }
  }

  removeBeneficiaryDataForNurseVisit() {
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
    sessionStorage.removeItem('specialistFlag');
    sessionStorage.removeItem('visitCat');
    sessionStorage.removeItem('caseSheetTMFlag');
  }

  visitCategory: any;
  viewAndPrintCaseSheet(beneficiaryData: any) {
    this.setCasesheetData(beneficiaryData);
    const specialistFlag: any = this.sessionstorage.getItem('specialistFlag');
    let caseSheetRequest;
    if (
      this.sessionstorage.getItem('caseSheetTMFlag') === 'true' ||
      parseInt(specialistFlag) === 200
    ) {
      this.visitCategory = this.sessionstorage.getItem(
        'caseSheetVisitCategory'
      );
      caseSheetRequest = {
        VisitCategory: this.sessionstorage.getItem('caseSheetVisitCategory'),
        benFlowID: this.sessionstorage.getItem('caseSheetBenFlowID'),
        benVisitID: this.sessionstorage.getItem('caseSheetVisitID'),
        beneficiaryRegID: this.sessionstorage.getItem(
          'caseSheetBeneficiaryRegID'
        ),
        visitCode: this.sessionstorage.getItem('caseSheetVisitCode'),
        // "isCaseSheetdownloaded": this.sessionstorage.getItem('isCaseSheetdownloaded') === "true" ? true : false
      };
      this.getTMReferredCasesheetData(caseSheetRequest);
    }
  }
  casesheetSubs: any;
  caseSheetData: any;
  getTMReferredCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.nurseService
      .getTMReferredCasesheetData(caseSheetRequest)
      .subscribe(
        (res: any) => {
          if (res && res.statusCode === 200 && res.data) {
            this.confirmationService
              .confirm('info', this.currentLanguageSet.alerts.info.consulation)
              .subscribe(res => {
                if (res) {
                  this.routeToCaseSheet();
                }
              });
            this.caseSheetData = res.data;
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        err => {
          console.log(err, 'error');
          this.confirmationService.alert(
            'Error in fetching TM Casesheet',
            'error'
          );
        }
      );
  }
  setCasesheetData(beneficiary: any) {
    this.sessionstorage.setItem('caseSheetBenFlowID', beneficiary.benFlowID);
    this.sessionstorage.setItem(
      'caseSheetVisitCategory',
      beneficiary.VisitCategory
    );
    this.sessionstorage.setItem(
      'caseSheetBeneficiaryRegID',
      beneficiary.beneficiaryRegID
    );
    this.sessionstorage.setItem('caseSheetVisitID', beneficiary.benVisitID);
    this.sessionstorage.setItem('caseSheetVisitCode', beneficiary.visitCode);
    this.sessionstorage.setItem('caseSheetTMFlag', 'true');
  }
  routeToCaseSheet() {
    this.router.navigate(['/nurse-doctor/print/' + 'MMU' + '/' + 'current']);
  }
}
