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

import { Component, Inject, OnInit, DoCheck } from '@angular/core';
import { ZardDialogRef, Z_MODAL_DATA } from 'Common-UI/v2/ui/dialog';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { ConfirmationService } from '../../services';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideSearch } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardLoaderComponent } from 'Common-UI/v2/ui/loader';
import { ZardPaginatorComponent } from 'Common-UI/v2/ui/paginator';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

@Component({
  selector: 'app-calibration',
  standalone: true,
  templateUrl: './calibration.component.html',
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    FormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...ZardTableImports,
    ZardLoaderComponent,
    ZardPaginatorComponent,
    ...tooltipImports,
  ],
  providers: [MasterdataService],
  viewProviders: [
    provideIcons({
      lucideX,
      lucideSearch,
    }),
  ],
})
export class CalibrationComponent implements OnInit, DoCheck {
  searchTerm: any;
  pageNo = 0;
  message = '';
  pageCount: any;
  selectedComponentsList = [];
  placeHolderSearch: any;
  dataList: any[] = [];
  filteredDataList: any[] = [];
  current_language_set: any;
  displayedColumns: any = ['sno', 'SCode', 'ExpiryDate'];
  showProgressBar = false;
  pagedItems: any[] = [];

  constructor(
    @Inject(Z_MODAL_DATA) public input: any,
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    public dialogRef: ZardDialogRef<CalibrationComponent>
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
    this.showProgressBar = true;
    this.masterdataService
      .fetchCalibrationStrips(providerServiceMapID, pageNo)
      .subscribe(
        (res: any) => {
          this.showProgressBar = false;
          if (res.statusCode === 200) {
            if (
              res.data &&
              res.data.calibrationData !== undefined &&
              res.data.calibrationData.length > 0
            ) {
              this.dataList = res.data.calibrationData;
              this.filteredDataList = res.data.calibrationData;
            } else {
              this.message = this.current_language_set.common.noRecordFound;
              this.resetData();
            }
          } else {
            this.resetData();
          }
        },
        err => {
          this.showProgressBar = false;
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
    this.dataList = [];
    this.filteredDataList = [];
  }

  filterPreviousData(searchTerm: any) {
    if (!searchTerm) {
      this.filteredDataList = this.dataList;
    } else {
      this.filteredDataList = [];
      this.dataList.forEach(item => {
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
}
