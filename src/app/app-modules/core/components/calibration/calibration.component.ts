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

//SH20094090,calibration integration,09-06-2021

import { Component, Inject, OnInit, DoCheck, ViewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
} from '@angular/material/dialog';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { ConfirmationService } from '../../services';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MatPaginator } from '@angular/material/paginator';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-calibration',
  templateUrl: './calibration.component.html',
  styleUrls: ['./calibration.component.css'],
  imports: [
    MatTooltip,
    MatIcon,
    CdkScrollable,
    MatDialogContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
    DatePipe,
  ],
})
export class CalibrationComponent implements OnInit, DoCheck {
  searchTerm: any;
  pageNo = 0;
  message = '';
  pageCount: any;
  selectedComponentsList = [];
  currentPage = 1;
  pager: any = {
    totalItems: 0,
    currentPage: 0,
    totalPages: 0,
    startPage: 0,
    endPage: 0,
    pages: 0,
  };
  pagedItems = [];
  placeHolderSearch: any;
  dataList = [];
  filteredDataList = [];
  current_language_set: any;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  components = new MatTableDataSource<any>();
  displayedColumns: any = ['sno', 'SCode', 'ExpiryDate'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    public dialogRef: MatDialogRef<CalibrationComponent>
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.masterData(this.input.providerServiceMapID, 0);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  masterData(providerServiceMapID: any, pageNo: any) {
    this.masterdataService
      .fetchCalibrationStrips(providerServiceMapID, pageNo)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            if (
              res.data &&
              res.data.calibrationData !== undefined &&
              res.data.calibrationData.length > 0
            ) {
              this.components.data = res.data.calibrationData;
              this.dataList = res.data.calibrationData;
              this.components.paginator = this.paginator;
            } else {
              this.message = this.current_language_set.common.noRecordFound;
              this.components.data = [];
              this.components.paginator = this.paginator;
            }
          } else {
            this.resetData();
          }
        },
        err => {
          this.resetData();
        }
      );
  }

  goToLink(item: any) {
    const today = new Date();
    if (item.expiryDate !== undefined && new Date(item.expiryDate) < today) {
      this.confirmationService
        .confirmCalibration(
          'info',
          this.current_language_set.coreComponents.selectedCalibrationStripIs
        )
        .subscribe(res => {
          if (res === true) {
            this.dialogRef.close(item.stripCode);
          }
        });
    } else {
      this.confirmationService
        .confirmCalibration(
          'info',
          this.current_language_set.coreComponents
            .doYouWantToProceedWithSelectedCalibrationStrip
        )
        .subscribe(res => {
          if (res === true) {
            this.dialogRef.close(item.stripCode);
          }
        });
    }
  }
  close() {
    this.dialogRef.close(null);
  }

  resetData() {
    this.components.data = [];
    this.components.paginator = this.paginator;
  }

  filterPreviousData(searchTerm: any) {
    if (!searchTerm) {
      this.components.data = this.dataList;
      this.components.paginator = this.paginator;
    } else {
      this.components.data = [];
      this.components.paginator = this.paginator;
      this.dataList.forEach(item => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.components.data.push(item);
            this.components.paginator = this.paginator;
            break;
          }
        }
      });
    }
  }
}
