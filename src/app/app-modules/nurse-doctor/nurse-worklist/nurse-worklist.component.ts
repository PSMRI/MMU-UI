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

import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { NurseService } from '../shared/services';
import { CameraService } from '../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
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
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-nurse-worklist',
  templateUrl: './nurse-worklist.component.html',
  host: { class: 'block' },
  imports: [
    FormsModule,
    NgClass,
    NgFor,
    NgIf,
    TitleCasePipe,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...cardImports,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
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
export class NurseWorklistComponent implements OnInit, DoCheck, OnDestroy {
  beneficiaryList: any[] = [];
  filteredBeneficiaryList: any[] = [];
  filterTerm: any;
  currentLanguageSet: any;

  // client-side pagination (replaces MatPaginator)
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  constructor(
    private nurseService: NurseService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private cameraService: CameraService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('currentRole', 'Nurse');
    this.removeBeneficiaryDataForNurseVisit();
    this.getNurseWorklist();
    this.beneficiaryDetailsService.reset();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    sessionStorage.removeItem('currentRole');
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
    sessionStorage.removeItem('caseSheetTMFlag');
  }

  getNurseWorklist() {
    this.nurseService.getNurseWorklist().subscribe(
      (res: any) => {
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
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.fatherName = element.fatherName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
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
      // status column is derived text ("First visit" / "Revisit")
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

  changePageSize(size: string | string[]) {
    const value = Array.isArray(size) ? size[0] : size;
    this.pageSize = Number(value);
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
    sessionStorage.removeItem('visitCategory');
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
          this.sessionstorage.setItem('benVisitNo', beneficiary.benVisitNo);
          this.router.navigate([
            '/nurse-doctor/attendant/nurse/patient/',
            beneficiary.beneficiaryRegID,
          ]);
        }
      });
  }
}
