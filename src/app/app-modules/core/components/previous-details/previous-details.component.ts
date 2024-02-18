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

import {
  Component,
  OnInit,
  Input,
  Inject,
  DoCheck,
  ViewChild,
} from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../set-language.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-previous-details',
  templateUrl: './previous-details.component.html',
  styleUrls: ['./previous-details.component.css'],
})
export class PreviousDetailsComponent implements OnInit, DoCheck {
  dataList: any = [];
  columnList: any = [];
  current_language_set: any;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  filteredDataList = new MatTableDataSource<any>();

  constructor(
    public dialogRef: MatDialogRef<PreviousDetailsComponent>,
    public httpServiceService: HttpServiceService,
    @Inject(MAT_DIALOG_DATA) public input: any
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    if (this.input.dataList.data instanceof Array) {
      this.dataList = this.input.dataList.data;
      this.filteredDataList.data = this.dataList.slice();
    }
    if (this.input.dataList.columns instanceof Array)
      this.columnList = this.input.dataList.columns;
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
    console.log('searchTerm', searchTerm);
    if (!searchTerm) {
      this.filteredDataList.data = this.dataList;
      this.filteredDataList.paginator = this.paginator;
    } else {
      this.filteredDataList.data = [];
      this.dataList.forEach((item: any) => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredDataList.data.push(item);
            this.filteredDataList.paginator = this.paginator;
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
