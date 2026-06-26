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
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideRefreshCw,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-nurse-reffered-worklist',
  templateUrl: './nurse-reffered-worklist.component.html',
  styleUrls: ['./nurse-reffered-worklist.component.scss'],
  imports: [
    FormsModule,
    NgClass,
    NgFor,
    NgIf,
    TitleCasePipe,
    NgIcon,
    ZardButtonComponent,
    ...cardImports,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...tooltipImports,
  ],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucideRefreshCw,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
})
export class NurseRefferedWorklistComponent implements OnInit, DoCheck {
  currentLanguageSet: any;
  beneficiaryList: any[] = [];
  filteredBeneficiaryList: any[] = [];
  filterTerm: any;

  // client-side pagination (replaces MatPaginator)
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  visitCategory: any;
  casesheetSubs: any;
  caseSheetData: any;

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

  loadWorklist() {
    sessionStorage.removeItem('disableNoOnSuccessOfYes');
    this.filterTerm = null;
    this.nurseService.getNurseWorklistTMreferred().subscribe((res: any) => {
      if (res.statusCode === 200 && res.data !== null) {
        const benlist = this.loadDataToBenList(res.data);
        this.beneficiaryList = benlist;
        this.filterTerm = null;
        this.setFilteredList(benlist);
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
        this.beneficiaryList = [];
        this.setFilteredList([]);
      }
    });
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

  filterBeneficiaryList(searchTerm: string) {
    if (!searchTerm) {
      this.setFilteredList(this.beneficiaryList);
      return;
    }
    const term = searchTerm.toLowerCase();
    const keys = [
      'beneficiaryID',
      'benName',
      'genderName',
      'fatherName',
      'districtName',
      'preferredPhoneNum',
      'villageName',
    ];
    const filtered = this.beneficiaryList.filter((item: any) => {
      if (keys.some(key => ('' + item[key]).toLowerCase().includes(term))) {
        return true;
      }
      const status = '' + item.benVisitNo === '1' ? 'first visit' : 'revisit';
      return status.includes(term);
    });
    this.setFilteredList(filtered);
  }

  /** Re-number (sno), reset to first page, and store the visible list. */
  private setFilteredList(list: any[]) {
    list.forEach((item: any, index: number) => (item.sno = index + 1));
    this.filteredBeneficiaryList = list;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredBeneficiaryList.length / this.pageSize)
    );
  }

  get pagedList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBeneficiaryList.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  changePageSize(size: number) {
    this.pageSize = Number(size);
    this.currentPage = 1;
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
      };
      this.getTMReferredCasesheetData(caseSheetRequest);
    }
  }

  getTMReferredCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.nurseService
      .getTMReferredCasesheetData(caseSheetRequest)
      .subscribe(
        (res: any) => {
          if (res && res.statusCode === 200 && res.data) {
            this.confirmationService
              .confirm('info', this.currentLanguageSet.alerts.info.consulation)
              .subscribe(result => {
                if (result) {
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
