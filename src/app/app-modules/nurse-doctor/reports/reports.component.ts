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

import { Component, DoCheck, OnInit } from '@angular/core';
import { MasterdataService } from '../shared/services';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

declare global {
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean;
  }
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class ReportsComponent implements OnInit, DoCheck {
  reportForm!: FormGroup;
  currentLanguageSet: any;
  constructor(
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    private formBuilder: FormBuilder,
    readonly sessionstorage: SessionStorageService,
    private httpServices: HttpServiceService
  ) {}
  today!: Date;
  criteriaHead: any;

  ngOnInit() {
    this.assignSelectedLanguage();
    this.today = new Date();
    this.reportForm = this.createReportForm();
    this.getReportsMaster();
    this.getVanMaster();
  }
  /*
   * JA354063 - Multilingual Changes added on 13/10/21
   */
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  // Ends
  createReportForm() {
    return this.formBuilder.group({
      report: null,
      fromDate: null,
      toDate: null,
      van: null,
    });
  }

  reportMaster: any = [];
  getReportsMaster() {
    this.masterdataService.getReportsMaster().subscribe(
      (res: any) => {
        console.log('res', res);
        if (res && res.statusCode === 200) {
          if (res.data && res.data.length > 0) {
            this.reportMaster = res.data;
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.noReportsWereMappedforthisService
            );
          }
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  get report() {
    return this.reportForm.controls['report'].value;
  }

  checkReport() {
    console.log(this.report);
    this.reportForm.patchValue({
      fromDate: null,
      toDate: null,
      van: null,
    });
  }

  get fromDate() {
    return this.reportForm.controls['fromDate'].value;
  }
  checkFromDate() {
    console.log(this.fromDate);
    this.reportForm.patchValue({
      toDate: null,
      van: null,
    });
    const toMax = new Date(this.fromDate);
    toMax.setMonth(this.fromDate.getMonth() + 1);
    console.log(toMax, this.today);
    if (toMax > this.today) {
      console.log(this.today);
      this.maxToDate = new Date(this.today);
    } else {
      console.log('toMax', toMax);
      this.maxToDate = new Date(toMax);
    }

    console.log(this.maxToDate);
  }

  get toDate() {
    return this.reportForm.controls['toDate'].value;
  }

  maxToDate!: Date;
  checkToDate() {
    this.reportForm.patchValue({
      van: null,
    });
  }
  vanMaster: any = [];
  getVanMaster() {
    this.masterdataService.getVanMaster().subscribe(
      (res: any) => {
        if (res && res.statusCode === 200) {
          if (res.data && res.data.length > 0) {
            this.vanMaster = res.data;
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.noVansWereMappedforthisprovider
            );
          }
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
  }
  get van() {
    return this.reportForm.controls['van'].value;
  }
  reportData = [];
  getReportData() {
    const reportRequst = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      reportID: this.report.reportID,
      vanID: this.van.vanID,
    };
    console.log('reportRequst', reportRequst);
    this.masterdataService.getReportData(reportRequst).subscribe(
      (res: any) => {
        if (res && res.statusCode === 200) {
          if (res.data && res.data.length > 0) {
            this.reportData = res.data;
            this.createCriteria();
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.noDataAvailabletoGenerateReport
            );
          }
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      err => {
        this.confirmationService.alert(err, 'error');
      }
    );
  }

  createCriteria() {
    const criteria: any = [];
    criteria.push({ Filter_Name: 'Start_Date', value: this.fromDate });
    criteria.push({ Filter_Name: 'End_Date', value: this.toDate });
    criteria.push({ Filter_Name: 'Vehicle', value: this.van.vehicalNo });
    criteria.push({ Filter_Name: 'Report', value: this.report.reportName });
    this.exportExcel(criteria);
  }
  exportExcel(criteria: any) {
    if (criteria.length > 0) {
      const criteriaArray = criteria.filter(function (obj: any) {
        for (const key in obj) {
          if (obj[key] === null) {
            obj[key] = '';
          }
        }
        return obj;
      });
      if (criteriaArray.length !== 0) {
        this.criteriaHead = Object.keys(criteriaArray[0]);
        console.log('this.criteriaHead', this.criteriaHead);
      }
    }
    if (this.reportData.length > 0) {
      const array = this.reportData.filter(function (obj: any) {
        for (const key in obj) {
          if (obj[key] === null) {
            obj[key] = '';
          }
        }
        return obj;
      });
      if (array.length !== 0) {
        const head = Object.keys(array[0]);
        console.log('head', head);
        const wb_name = this.report.reportName;
        const workbook = new ExcelJS.Workbook();
        const criteria_worksheet = workbook.addWorksheet('Criteria');
        const report_worksheet = workbook.addWorksheet('Report');

        report_worksheet.addRow(head);
        criteria_worksheet.addRow(this.criteriaHead);

        // Add data
        criteria.forEach((row: { [x: string]: any }) => {
          const rowData: any[] = [];
          this.criteriaHead.forEach((header: string | number) => {
            // console.log("header1", header);
            rowData.push(row[header]);
          });
          criteria_worksheet.addRow(rowData);
        });
        this.reportData.forEach((row: { [x: string]: any }) => {
          const rowData: any[] = [];
          head.forEach(header => {
            // console.log("header2", header);
            rowData.push(row[header]);
          });
          report_worksheet.addRow(rowData);
        });

        // Write to file
        workbook.xlsx.writeBuffer().then(buffer => {
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          saveAs(blob, wb_name + '.xlsx');
          if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, wb_name);
          } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('visibility', 'hidden');
            link.download = wb_name.replace(/ /g, '_') + '.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
        // }
        this.confirmationService.alert('Report Downloaded', 'success');
      } else {
        this.confirmationService.alert('No Record Found');
      }
    }
    this.reportForm.reset();
  }

  manipulateNullReportData(reportData: any) {
    const tempReport = reportData.filter((report: any) => {
      for (const key in report) {
        if (report[key] === null) {
          report[key] = '';
        }
      }
      return report;
    });
    return tempReport;
  }

  manipulateSheetCellsAndColumns(head: any, report_worksheet: any) {
    let i = 65; // starting from 65 since it is the ASCII code of 'A'.
    let count = 0;
    while (i < head.length + 65) {
      let j;
      if (count > 0) {
        j = i - 26 * count;
      } else {
        j = i;
      }
      const cellPosition = String.fromCharCode(j);
      let finalCellName: any;
      if (count === 0) {
        finalCellName = cellPosition + '1';
        console.log(finalCellName);
      } else {
        const newcellPosition = String.fromCharCode(64 + count);
        finalCellName = newcellPosition + cellPosition + '1';
        console.log(finalCellName);
      }
      const newName = this.modifyHeader(head, i);
      delete report_worksheet[finalCellName].w;
      report_worksheet[finalCellName].v = newName;
      i++;
      if (i === 91 + count * 26) {
        // i = 65;
        count++;
      }
    }

    return report_worksheet;
  }

  modifyHeader(headers: any, i: any) {
    let modifiedHeader: string;
    modifiedHeader = headers[i - 65]
      .toString()
      .replace(/([A-Z])/g, ' $1')
      .trim();
    modifiedHeader =
      modifiedHeader.charAt(0).toUpperCase() + modifiedHeader.substr(1);
    return modifiedHeader.replace(/I D/g, 'ID');
  }
}
