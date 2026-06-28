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
import { PharmacistService } from '../shared/services/pharmacist.service';
import { CameraService } from '../../core/services/camera.service';
import { InventoryService } from '../../core/services/inventory.service';
import * as moment from 'moment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
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
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  host: { class: 'block' },
  imports: [
    FormsModule,
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
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  beneficiaryList: any[] = [];
  filteredBeneficiaryList: any[] = [];
  filterTerm: any;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  // client-side pagination (replaces MatPaginator)
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  constructor(
    private router: Router,
    private httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private pharmacistService: PharmacistService,
    private cameraService: CameraService,
    private inventoryService: InventoryService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.sessionstorage.setItem('currentRole', 'Pharmacist');
    this.removeBeneficiaryDataForVisit();
    this.loadPharmaWorklist();
    this.beneficiaryDetailsService.reset();
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

  loadPharmaWorklist() {
    this.pharmacistService.getPharmacistWorklist().subscribe(
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
    data.forEach((element: any) => {
      element.genderName = element.genderName || 'Not Available';
      element.age = element.age || 'Not Available';
      element.statusMessage = element.statusMessage || 'Not Available';
      element.VisitCategory = element.VisitCategory || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      element.visitDate =
        moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
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

  changePageSize(size: string | string[]) {
    const value = Array.isArray(size) ? size[0] : size;
    this.pageSize = Number(value);
    this.currentPage = 1;
  }

  patientImageView(benregID: any) {
    if (benregID) {
      this.beneficiaryDetailsService
        .getBeneficiaryImage(benregID)
        .subscribe((data: any) => {
          if (data && data.benImage) {
            this.cameraService.viewImage(data.benImage);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.imageNotFound
            );
          }
        });
    }
  }

  loadPharmaPage(beneficiary: any) {
    this.confirmationService
      .confirm(
        `info`,
        this.currentLanguageSet.alerts.info.confirmtoProceedFurther
      )
      .subscribe(result => {
        if (result) {
          this.inventoryService.moveToInventory(
            beneficiary.beneficiaryID,
            beneficiary.visitCode,
            beneficiary.benFlowID,
            sessionStorage.getItem('setLanguage') !== undefined
              ? sessionStorage.getItem('setLanguage')
              : 'English',
            beneficiary.beneficiaryRegID
          );
        }
      });
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
