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
import { HttpServiceService } from '../../services/http-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../set-language.component';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
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
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-previous-details',
  standalone: true,
  templateUrl: './previous-details.component.html',
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...ZardTableImports,
    ...cardImports,
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
export class PreviousDetailsComponent implements OnInit, DoCheck {
  dataList: any = [];
  columnList: any = [];
  current_language_set: any;
  filteredDataList: any[] = [];
  displayedColumns: any = ['sno'];
  searchTerm = '';
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  constructor(
    public dialogRef: MatDialogRef<PreviousDetailsComponent>,
    public httpServiceService: HttpServiceService,
    @Inject(MAT_DIALOG_DATA) public input: any
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    if (
      this.input.dataList.data !== null &&
      this.input.dataList.data !== undefined &&
      this.input.dataList.data instanceof Array
    ) {
      this.dataList = this.input.dataList.data;
      this.filteredDataList = this.dataList.slice();
    }
    if (
      this.input.dataList.columns !== null &&
      this.input.dataList.columns !== undefined &&
      this.input.dataList.columns instanceof Array
    )
      this.columnList = this.input.dataList.columns;
    this.input.dataList.columns.filter((item: any) => {
      if (item.keyName) {
        this.displayedColumns.push(item.keyName);
      }
    });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  filterPreviousData(searchTerm: any) {
    this.currentPage = 1;
    if (!searchTerm) {
      this.filteredDataList = this.dataList;
    } else {
      this.filteredDataList = [];
      this.dataList.forEach((item: any) => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredDataList.push(item);
            break;
          }
        }
      });
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDataList.length / this.pageSize));
  }

  get pagedList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDataList.slice(start, start + this.pageSize);
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

  closeDialog() {
    this.dialogRef.close();
  }
}
