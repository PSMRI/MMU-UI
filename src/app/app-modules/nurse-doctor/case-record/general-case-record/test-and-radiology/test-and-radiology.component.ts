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
  OnDestroy,
  DoCheck,
  ViewChild,
} from '@angular/core';
import { ViewTestReportComponent } from './view-test-report/view-test-report.component';
import { DoctorService } from '../../../shared/services';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../../shared/services/test-in-vitals.service';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-test-and-radiology',
  templateUrl: './test-and-radiology.component.html',
  styleUrls: ['./test-and-radiology.component.css'],
})
export class TestAndRadiologyComponent implements OnInit, OnDestroy, DoCheck {
  current_language_set: any;
  displayedColumns: any = [
    'date',
    'testName',
    'componentName',
    'result',
    'measurementUnit',
    'remarks',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  filteredLabResults = new MatTableDataSource<any>();

  constructor(
    private doctorService: DoctorService,
    private dialog: MatDialog,
    private labService: LabService,
    private idrsScoreService: IdrsscoreService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private testInVitalsService: TestInVitalsService
  ) {}

  currentLabRowsPerPage = 5;
  currentLabActivePage = 1;
  previousLabRowsPerPage = 5;
  previousLabActivePage = 1;
  rotate = true;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  vitalsRBSResp: any = null;

  ngOnInit() {
    this.testInVitalsService.clearVitalsRBSValueInReports();
    this.testInVitalsService.clearVitalsRBSValueInReportsInUpdate();
    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitID = this.sessionstorage.getItem('visitID');
    this.visitCategory = this.sessionstorage.getItem('visitCategory');

    this.testInVitalsService.vitalRBSTestResult$.subscribe(response => {
      console.log('vital subscription response: ', response);
      if (response.visitCode) {
        if (response.rbsTestResult) {
          this.vitalsRBSResp = null;
          this.vitalsRBSResp = {
            prescriptionID: null,
            procedureID: null,
            createdDate: response.createdDate,
            procedureName: 'RBS Test',
            procedureType: 'Laboratory',
            componentList: [
              {
                testResultValue: response.rbsTestResult,
                remarks: response.rbsTestRemarks,
                fileIDs: [null],
                testResultUnit: 'mg/dl',
                testComponentID: null,
                componentName: null,
              },
            ],
          };
        }
      }

      this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.visitID = this.sessionstorage.getItem('visitID');
      this.visitCategory = this.sessionstorage.getItem('visitCategory');
      this.getTestResults(
        this.beneficiaryRegID,
        this.visitID,
        this.visitCategory
      );
    });

    this.testInVitalsService.vitalRBSTestResultInUpdate$.subscribe(
      vitalsresp => {
        this.checkRBSResultInVitalsUpdate(vitalsresp);
      }
    );
  }
  ngOnDestroy() {
    if (this.testResultsSubscription)
      this.testResultsSubscription.unsubscribe();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  checkRBSResultInVitalsUpdate(vitalsresp: any) {
    if (vitalsresp.rbsTestResult) {
      let vitalsRBSResponse = null;
      vitalsRBSResponse = {
        prescriptionID: null,
        procedureID: null,
        createdDate: vitalsresp.createdDate,
        procedureName: 'RBS Test',
        procedureType: 'Laboratory',
        componentList: [
          {
            testResultValue: vitalsresp.rbsTestResult,
            remarks: vitalsresp.rbsTestRemarks,
            fileIDs: [null],
            testResultUnit: 'mg/dl',
            testComponentID: null,
            componentName: null,
          },
        ],
      };

      this.labResults.forEach((element: any, index: any) => {
        if (
          element.procedureName === 'RBS Test' &&
          element.procedureID === null
        )
          this.labResults.splice(index, 1);
      });
      this.labResults = [vitalsRBSResponse].concat(this.labResults);
      this.filteredLabResults.data = this.labResults;
      this.filteredLabResults.paginator = this.paginator;

      this.currentLabPageChanged({
        page: this.currentLabActivePage,
        itemsPerPage: this.currentLabRowsPerPage,
      });
    } else {
      this.labResults.forEach((element: any, index: any) => {
        if (
          element.procedureName === 'RBS Test' &&
          element.procedureID === null
        )
          this.labResults.splice(index, 1);
      });

      this.filteredLabResults.data = this.labResults;
      this.filteredLabResults.paginator = this.paginator;

      this.currentLabPageChanged({
        page: this.currentLabActivePage,
        itemsPerPage: this.currentLabRowsPerPage,
      });
    }
  }

  labResults: any = [];
  radiologyResults: any = [];
  archivedResults: any = [];
  testResultsSubscription: any;
  getTestResults(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.testResultsSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        console.log('response archive', res);
        if (res && res.statusCode === 200 && res.data) {
          console.log('labresult', res.data.LabReport);
          this.labResults = res.data.LabReport.filter((lab: any) => {
            return lab.procedureType === 'Laboratory';
          });
          this.filteredLabResults.data = this.labResults;
          this.filteredLabResults.paginator = this.paginator;

          //coded added to check whether strips are available for RBS Test
          if (visitCategory === 'NCD screening') {
            this.filteredLabResults.data.forEach((element: any) => {
              if (element.procedureName === environment.RBSTest) {
                return element.componentList.forEach((element1: any) => {
                  if (element1.stripsNotAvailable === true) {
                    this.idrsScoreService.setReferralSuggested();
                  }
                });
              }
            });
          }

          if (this.vitalsRBSResp) {
            this.labResults = [this.vitalsRBSResp].concat(this.labResults);
          }

          this.filteredLabResults.data = this.labResults;
          this.filteredLabResults.paginator = this.paginator;

          this.radiologyResults = res.data.LabReport.filter(
            (radiology: any) => {
              return radiology.procedureType === 'Radiology';
            }
          );
          this.archivedResults = res.data.ArchivedVisitcodeForLabResult;
          this.currentLabPageChanged({
            page: this.currentLabActivePage,
            itemsPerPage: this.currentLabRowsPerPage,
          });
        }
      });
  }

  // filteredLabResults: any = [];
  filterProcedures(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredLabResults.data = this.labResults;
      this.filteredLabResults.paginator = this.paginator;
    } else {
      this.filteredLabResults.data = [];
      this.filteredLabResults.paginator = this.paginator;
      this.labResults.forEach((item: any) => {
        const value: string = '' + item.procedureName;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredLabResults.data.push(item);
        }
      });
    }

    this.currentLabActivePage = 1;
    this.currentLabPageChanged({
      page: 1,
      itemsPerPage: this.currentLabRowsPerPage,
    });
  }
  currentLabPagedList: any = [];
  currentLabPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.currentLabPagedList = this.filteredLabResults.data.slice(
      startItem,
      endItem
    );
    console.log('list', this.currentLabPagedList);
  }

  showTestResult(fileIDs: any) {
    const ViewTestReport = this.dialog.open(
      ViewRadiologyUploadedFilesComponent,
      {
        width: '40%',
        data: {
          filesDetails: fileIDs,
          panelClass: 'dialog-width',
          disableClose: false,
        },
      }
    );
    ViewTestReport.afterClosed().subscribe(result => {
      if (result) {
        this.labService.viewFileContent(result).subscribe((res: any) => {
          const blob = new Blob([res], { type: res.type });
          console.log(blob, 'blob');
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }
    });
  }
  enableArchiveView: boolean = false;
  archivedLabResults: any = [];
  filteredArchivedLabResults: any = [];
  archivedRadiologyResults: any = [];
  visitedDate: any;
  visitCode: any;
  showArchivedTestResult(visitCode: any) {
    const archivedReport = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      visitCode: visitCode.visitCode,
    };
    this.doctorService
      .getArchivedReports(archivedReport)
      .subscribe((response: any) => {
        if (response.statusCode === 200) {
          this.archivedLabResults = response.data.filter((lab: any) => {
            return lab.procedureType === 'Laboratory';
          });
          this.filteredArchivedLabResults = this.archivedLabResults;
          this.previousLabPageChanged({
            page: this.previousLabActivePage,
            itemsPerPage: this.previousLabRowsPerPage,
          });
          this.archivedRadiologyResults = response.data.filter(
            (radiology: any) => {
              return radiology.procedureType === 'Radiology';
            }
          );
          this.enableArchiveView = true;
          this.visitedDate = visitCode.date;
          this.visitCode = visitCode.visitCode;
        }
      });
  }

  filterArchivedProcedures(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredArchivedLabResults = this.archivedLabResults;
    } else {
      this.filteredArchivedLabResults = [];
      this.archivedLabResults.forEach((item: any) => {
        const value: string = '' + item.procedureName;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredArchivedLabResults.push(item);
        }
      });
    }

    this.previousLabActivePage = 1;
    this.previousLabPageChanged({
      page: 1,
      itemsPerPage: this.previousLabRowsPerPage,
    });
  }

  previousLabPagedList: any = [];
  previousLabPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousLabPagedList = this.filteredArchivedLabResults.slice(
      startItem,
      endItem
    );
    console.log('list', this.previousLabPagedList);
  }

  showArchivedRadiologyTestResult(radiologyReport: any) {
    console.log('reports', radiologyReport);
    this.dialog.open(ViewTestReportComponent, {
      data: radiologyReport,
      width: 0.8 * window.innerWidth + 'px',
      panelClass: 'dialog-width',
      disableClose: false,
    });
  }

  resetArchived() {
    console.log('hwere');

    this.archivedLabResults = [];
    this.filteredArchivedLabResults = [];
    this.archivedRadiologyResults = [];
    this.visitCode = null;
    this.visitedDate = null;
    this.enableArchiveView = false;
    this.previousLabPagedList = [];
  }
}
