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
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
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
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  styleUrls: ['./worklist.component.scss'],
  imports: [
    FormsModule,
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
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  filteredBeneficiaryList: any[] = [];
  filterTerm: any;
  current_language_set: any;

  // client-side pagination (replaces MatPaginator)
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  constructor(
    private dialog: MatDialog,
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
          const benlist = this.loadDataToBenList(data.data);
          this.beneficiaryList = benlist;
          this.filterTerm = null;
          this.setFilteredList(benlist);
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
          this.beneficiaryList = [];
          this.setFilteredList([]);
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
      keys.some(key => ('' + item[key]).toLowerCase().indexOf(term) >= 0)
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

  /** A small window of page numbers around the current page (max 5). */
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
