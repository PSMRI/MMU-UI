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
import { DoctorService, MasterdataService } from '../shared/services';
import { CameraService } from '../../core/services/camera.service';
import * as moment from 'moment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
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
  selector: 'app-doctor-worklist',
  templateUrl: './doctor-worklist.component.html',
  styleUrls: ['./doctor-worklist.component.scss'],
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
export class DoctorWorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  filteredBeneficiaryList: any[] = [];
  beneficiaryMetaData: any;
  filterTerm: any;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  // client-side pagination (replaces MatPaginator)
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  constructor(
    private cameraService: CameraService,
    private router: Router,
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.sessionstorage.setItem('currentRole', 'Doctor');
    this.fetchLanguageResponse();
    this.removeBeneficiaryDataForDoctorVisit();
    this.loadWorklist();
    this.beneficiaryDetailsService.reset();
    this.masterdataService.reset();
  }

  ngOnDestroy() {
    sessionStorage.removeItem('currentRole');
  }

  removeBeneficiaryDataForDoctorVisit() {
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

  loadWorklist() {
    this.filterTerm = null;
    this.beneficiaryMetaData = [];
    this.doctorService.getDoctorWorklist().subscribe(
      (data: any) => {
        if (data && data.statusCode === 200 && data.data) {
          this.beneficiaryMetaData = data.data;
          data.data.map((item: any) => {
            const temp = this.getVisitStatus(item);
            item.statusMessage = temp.statusMessage;
            item.statusCode = temp.statusCode;
          });
          const benlist = this.loadDataToBenList(data.data);
          this.beneficiaryList = benlist;
          this.filterTerm = null;
          this.setFilteredList(benlist);
        } else this.confirmationService.alert(data.errorMessage, 'error');
      },
      err => {
        if (err?.handled) {
          return;
        }
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
      element.arrival = false;
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      element.visitDate =
        moment(element.visitDate, 'DD-MM-YYYY HH:mm A') || 'Not Available';
      element.benVisitDate =
        moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
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
      'age',
      'statusMessage',
      'VisitCategory',
      'benVisitNo',
      'districtName',
      'preferredPhoneNum',
      'villageName',
      'beneficiaryRegID',
      'visitDate',
      'benVisitDate',
    ];
    const filtered = this.beneficiaryList.filter((item: any) =>
      keys.some(key => ('' + item[key]).toLowerCase().includes(term))
    );
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
        if (data?.benImage) this.cameraService.viewImage(data.benImage);
        else
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.imageNotFound
          );
      });
  }

  loadDoctorExaminationPage(beneficiary: any) {
    this.sessionstorage.setItem('visitCode', beneficiary.visitCode);
    if (beneficiary.statusCode === 1) {
      this.routeToWorkArea(beneficiary);
    } else if (beneficiary.statusCode === 2) {
      this.confirmationService.alert(beneficiary.statusMessage);
    } else if (beneficiary.statusCode === 3) {
      this.routeToWorkArea(beneficiary);
    } else if (beneficiary.statusCode === 9 || beneficiary.statusCode === 10) {
      this.viewAndPrintCaseSheet(beneficiary);
    }
  }

  viewAndPrintCaseSheet(beneficiary: any) {
    this.confirmationService
      .confirm('info', this.currentLanguageSet.alerts.info.consulation)
      .subscribe(res => {
        if (res) {
          this.routeToCaseSheet(beneficiary);
        }
      });
  }

  routeToCaseSheet(beneficiary: any) {
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
    this.router.navigate(['/nurse-doctor/print/' + 'MMU' + '/' + 'current']);
  }

  routeToWorkArea(beneficiary: any) {
    this.confirmationService
      .confirm(
        `info`,
        this.currentLanguageSet.alerts.info.confirmtoProceedFurther
      )
      .subscribe(result => {
        if (result) {
          this.updateWorkArea(beneficiary);
        }
      });
  }

  updateWorkArea(beneficiary: any) {
    const dataSeted = this.setDataForWorkArea(beneficiary);
    if (dataSeted) {
      this.router.navigate([
        '/nurse-doctor/attendant/doctor/patient/',
        beneficiary.beneficiaryRegID,
      ]);
    }
  }

  setDataForWorkArea(beneficiary: any) {
    this.sessionstorage.setItem('beneficiaryGender', beneficiary.genderName);
    this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
    this.sessionstorage.setItem('visitCategory', beneficiary.VisitCategory);
    this.sessionstorage.setItem(
      'beneficiaryRegID',
      beneficiary.beneficiaryRegID
    );
    this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
    this.sessionstorage.setItem('beneficiaryID', beneficiary.beneficiaryID);
    this.sessionstorage.setItem('doctorFlag', beneficiary.doctorFlag);
    this.sessionstorage.setItem('nurseFlag', beneficiary.nurseFlag);
    this.sessionstorage.setItem('pharmacist_flag', beneficiary.pharmacist_flag);
    this.sessionstorage.setItem('phnum', beneficiary.preferredPhoneNum);

    return true;
  }

  checkDoctorStatusAtTcCancelled(beneficiary: any) {
    if (beneficiary.doctorFlag === 2 || beneficiary.nurseFlag === 2) {
      this.confirmationService.alert(beneficiary.statusMessage);
    } else if (beneficiary.doctorFlag === 1) {
      this.routeToWorkArea(beneficiary);
    } else if (beneficiary.doctorFlag === 3) {
      this.routeToWorkArea(beneficiary);
    } else if (beneficiary.doctorFlag === 9) {
      this.viewAndPrintCaseSheet(beneficiary);
    }
  }

  getVisitStatus(beneficiaryVisitDetials: any) {
    const status = {
      statusCode: 0,
      statusMessage: '',
    };
    if (
      beneficiaryVisitDetials.doctorFlag === 2 ||
      beneficiaryVisitDetials.nurseFlag === 2
    ) {
      status.statusCode = 2;
      status.statusMessage = this.currentLanguageSet.alerts.info.pending;
    } else if (beneficiaryVisitDetials.doctorFlag === 1) {
      status.statusCode = 1;
      status.statusMessage = this.currentLanguageSet.alerts.info.pendingConsult;
    } else if (beneficiaryVisitDetials.doctorFlag === 3) {
      status.statusCode = 3;
      status.statusMessage = this.currentLanguageSet.alerts.info.labtestDone;
    } else if (beneficiaryVisitDetials.specialist_flag === 100) {
      status.statusCode = 10;
      status.statusMessage = this.currentLanguageSet.common.tmReferred;
    } else if (beneficiaryVisitDetials.doctorFlag === 9) {
      status.statusCode = 9;
      status.statusMessage = 'Consultation Done';
    }
    return status;
  }

  //BU40088124 12/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
    if (this.currentLanguageSet && this.beneficiaryMetaData) {
      this.beneficiaryMetaData.map((item: any) => {
        const temp = this.getVisitStatus(item);
        item.statusMessage = temp.statusMessage;
        item.statusCode = temp.statusCode;
      });
    }
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
