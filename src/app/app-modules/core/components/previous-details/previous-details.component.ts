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
import { lucideX, lucideSearch } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardPaginatorComponent } from 'Common-UI/v2/ui/paginator';
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
    ZardPaginatorComponent,
    ...tooltipImports,
  ],
  viewProviders: [
    provideIcons({
      lucideX,
      lucideSearch,
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
  pagedItems: any[] = [];

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

  closeDialog() {
    this.dialogRef.close();
  }
}
