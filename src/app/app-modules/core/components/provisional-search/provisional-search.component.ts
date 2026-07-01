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

import { Component, OnInit, Inject, DoCheck } from '@angular/core';
import { MasterdataService } from '../../../nurse-doctor/shared/services/masterdata.service';
import { SpinnerService } from '../../services/spinner.service';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideSearch,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardCheckboxComponent } from 'Common-UI/v2/ui/checkbox';
import { ZardLoaderComponent } from 'Common-UI/v2/ui/loader';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-provisional-search',
  standalone: true,
  templateUrl: './provisional-search.component.html',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...ZardTableImports,
    ZardCheckboxComponent,
    ZardLoaderComponent,
    ...ZardPaginationImports,
    ...ZardSelectImports,
    ...tooltipImports,
  ],
  viewProviders: [
    provideIcons({
      lucideX,
      lucideSearch,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
})
export class ProvisionalSearchComponent implements OnInit, DoCheck {
  searchTerm: any;
  pageCount: any;
  selectedDiagnosisList: any = [];
  disableDiagnosisList: any = [];
  current_language_set: any;
  displayedColumns: any = ['ConceptID', 'term', 'empty'];
  diagnosisData: any[] = [];
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public dialogRef: MatDialogRef<ProvisionalSearchComponent>,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private spinnerService: SpinnerService
  ) {}
  placeHolderSearch: any;
  ngOnInit() {
    this.assignSelectedLanguage();
    this.search(this.input.searchTerm, 0);
    if (this.input.diagonasisType)
      this.placeHolderSearch = this.input.diagonasisType;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  selectDiagnosis(checked: boolean, item: any) {
    if (checked) {
      item.selected = true;
      this.selectedDiagnosisList.push(item);
    } else {
      const index = this.selectedDiagnosisList.indexOf(item);
      this.selectedDiagnosisList.splice(index, 1);
      item.selected = false;
    }
  }

  disableSelection(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    const temp = addedDiagnosis.filter(
      (diagnosis: any) => diagnosis.conceptID === item.conceptID
    );
    if (temp.length > 0) {
      return true;
    } else {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID
      );
      const selectedDiagnosislength =
        this.input.addedDiagnosis.length +
        this.selectedDiagnosisList.length -
        1;
      if (currentSelection.length > 0) {
        return false;
      } else if (selectedDiagnosislength < 30) {
        return false;
      } else {
        return true;
      }
    }
  }

  selectedDiagnosis(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    const temp = addedDiagnosis.filter(
      (diagnosis: any) => diagnosis.conceptID === item.conceptID
    );
    if (temp.length > 0) return true;
    else {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID
      );
      if (currentSelection.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  submitDiagnosisList() {
    this.dialogRef.close(this.selectedDiagnosisList);
  }
  showProgressBar = false;
  search(term: string, pageNo: any): void {
    if (term.length > 2) {
      this.showProgressBar = true;
      this.masterdataService
        .searchDiagnosisBasedOnPageNo(term, pageNo)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              this.showProgressBar = false;
              if (res.data && res.data.sctMaster.length > 0) {
                this.showProgressBar = false;
                this.diagnosisData = res.data.sctMaster;
                this.currentPage = 1;
              }
            } else {
              this.resetData();
              this.showProgressBar = false;
            }
          },
          err => {
            this.resetData();
            this.showProgressBar = false;
          }
        );
    }
  }

  resetData() {
    this.diagnosisData = [];
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.diagnosisData.length / this.pageSize));
  }

  get pagedList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.diagnosisData.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
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
}
