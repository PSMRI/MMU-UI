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
  ViewChild,
  DoCheck,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { DoctorService } from '../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { CameraService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-cancer-case-record',
  templateUrl: './cancer-case-record.component.html',
  styleUrls: ['./cancer-case-record.component.css'],
})
export class CancerCaseRecordComponent
  implements OnInit, DoCheck, AfterViewInit, OnDestroy
{
  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // Weight Graph
  weightChartData: any = [];
  weightChartLabels: any = [];

  weightChartColors: Array<any> = [
    {
      // maroon
      backgroundColor: 'rgba(128,0,0,0.2)',
      borderColor: 'maroon',
      pointBackgroundColor: 'maroon',
      pointBorderColor: 'maroon',
      pointHoverBackgroundColor: 'maroon',
      pointHoverBorderColor: 'maroon',
    },
  ];
  weightChartLegend: boolean = true;
  weightChartType: string = 'line';
  // Ends Weight Graph

  // Bp Graph
  bpChartData: any = [];
  bpChartLabels: any = [];
  bpChartColors: Array<any> = [
    {
      // blueish
      backgroundColor: 'rgba(0,140,255,0.2)',
      borderColor: 'rgba(0,10,255,0.7)',
      pointBackgroundColor: 'rgba(0,10,255,0.7)',
      pointBorderColor: 'rgba(0,10,255,0.7)',
      pointHoverBackgroundColor: 'rgba(0,10,255,0.7)',
      pointHoverBorderColor: 'rgba(0,10,255,0.7)',
    },
    {
      //pinkish
      backgroundColor: 'rgba(222,92,132,0.2)',
      borderColor: 'rgba(222,92,132,1)',
      pointBackgroundColor: 'rgba(222,92,132,1)',
      pointBorderColor: 'rgba(222,92,132,1)',
      pointHoverBackgroundColor: 'rgba(222,92,132,1)',
      pointHoverBorderColor: 'rgba(222,92,132,1)',
    },
  ];
  bpChartLegend: boolean = true;
  bpChartType: string = 'line';
  // Ends Bp Graph

  // Bg Chart
  bgChartData: any = [];
  bgChartLabels: any = [];
  bgChartColors = [
    {
      // blueish
      // blueish
      backgroundColor: 'rgba(0,140,255,0.2)',
      borderColor: 'rgba(0,10,255,0.7)',
      pointBackgroundColor: 'rgba(0,10,255,0.7)',
      pointBorderColor: 'rgba(0,10,255,0.7)',
      pointHoverBackgroundColor: 'rgba(0,10,255,0.7)',
      pointHoverBorderColor: 'rgba(0,10,255,0.7)',
    },
    {
      // grenish
      backgroundColor: 'rgba(125,200,94,0.2)',
      borderColor: 'rgba(125,200,94,0.7)',
      pointBackgroundColor: 'rgba(125,200,94,0.7)',
      pointBorderColor: 'rgba(125,200,94,0.7)',
      pointHoverBackgroundColor: 'rgba(125,200,94,0.7)',
      pointHoverBorderColor: 'rgba(125,200,94,0.7)',
    },
    {
      // pinkish
      backgroundColor: 'rgba(222,92,132,0.2)',
      borderColor: 'rgba(222,92,132,1)',
      pointBackgroundColor: 'rgba(222,92,132,1)',
      pointBorderColor: 'rgba(222,92,132,1)',
      pointHoverBackgroundColor: 'rgba(222,92,132,1)',
      pointHoverBorderColor: 'rgba(222,92,132,1)',
    },
  ];
  bgChartLegend: boolean = true;
  bgChartType: string = 'line';

  //Ends Bg Chart

  @Input()
  diagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  @Input()
  findings: any;

  @Input()
  currentVitals: any;

  @Input()
  pregnancyStatus: any;

  visitDetails: any;
  mammogramLink: any;
  female: any;
  current_language_set: any;

  displayedColumns = [
    'visitnommu',
    'date',
    'visitreasonmmu',
    'visitcategorymmu',
    'visitdetailsmmu',
    'visitcodemmu',
    'medicationmmu',
    'previewmmu',
    'printpreviewmmu',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private router: Router,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private cameraService: CameraService,
    private doctorService: DoctorService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.getBeneficiaryDetails();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
  ngAfterViewInit() {
    console.log(this.currentVitals, 'graph');
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.diagnosisSubscription) this.diagnosisSubscription.unsubscribe();
  }

  beneficiaryDetailsSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          if (beneficiary?.genderName?.toLowerCase() === 'female') {
            this.female = true;
          }
          if (beneficiary?.genderName) {
            this.getGraphData(beneficiary);
            if (String(this.caseRecordMode) === 'view') {
              const beneficiaryRegID =
                this.sessionstorage.getItem('beneficiaryRegID');
              const visitID = this.sessionstorage.getItem('visitID');
              const visitCategory =
                this.sessionstorage.getItem('visitCategory');
              if (this.sessionstorage.getItem('doctorFlag') === '9') {
                this.getDiagnosisDetails(
                  beneficiaryRegID,
                  visitID,
                  visitCategory
                );
              }
            }
          }
        }
      );
  }
  getGraphData(ben: any) {
    console.log(ben, 'ben data');

    this.doctorService
      .getCancerVitalsDetails(ben.beneficiaryRegID, ben.benVisitID)
      .subscribe((res: any) => {
        if (res.statusCode === 200 && res.data) {
          console.log('graphPloy', res);
          this.movegraphData(res.data.GraphData);
        }
      });
  }

  chartClicked(type: any) {
    let graphObject = {};
    switch (type) {
      case 'bw':
        graphObject = {
          type: type,
          lineChartOptions: this.lineChartOptions || undefined,
          chartData: this.weightChartData || undefined,
          chartLabels: this.weightChartLabels || undefined,
          chartColors: this.weightChartColors || undefined,
          chartLegend: this.weightChartLegend || undefined,
          chartType: this.weightChartType || undefined,
        };
        this.callBodyWeightGraph(graphObject);
        break;
      case 'bp':
        graphObject = {
          type: type,
          lineChartOptions: this.lineChartOptions || undefined,
          chartData: this.bpChartData || undefined,
          chartLabels: this.bpChartLabels || undefined,
          chartColors: this.bpChartColors || undefined,
          chartLegend: this.bpChartLegend || undefined,
          chartType: this.bpChartType || undefined,
        };
        this.callBloodPressureGraph(graphObject);
        break;
      case 'bg':
        graphObject = {
          type: type,
          lineChartOptions: this.lineChartOptions || undefined,
          chartData: this.bgChartData || undefined,
          chartLabels: this.bgChartLabels || undefined,
          chartColors: this.bgChartColors || undefined,
          chartLegend: this.bgChartLegend || undefined,
          chartType: this.bgChartType || undefined,
        };
        this.callBloodGlucoseGraph(graphObject);
        break;
      default:
        console.log('type', type);
        break;
    }
  }

  callBodyWeightGraph(graphData: any) {
    if (Object.keys(graphData).length === 7) {
      this.cameraService.ViewGraph(graphData);
    }
  }
  callBloodPressureGraph(graphData: any) {
    if (Object.keys(graphData).length === 7) {
      this.cameraService.ViewGraph(graphData);
    }
  }
  callBloodGlucoseGraph(graphData: any) {
    if (Object.keys(graphData).length === 7) {
      this.cameraService.ViewGraph(graphData);
    }
  }

  movegraphData(graphData: any) {
    this.plotBloodPressureGraph(graphData.bpList);
    this.plotWeightGraph(graphData.weightList);
    this.plotBloodSugarGraph(graphData.bgList);
  }

  plotBloodPressureGraph(bpList: any) {
    const systolic: any = [];
    const diastolic: any = [];

    console.log(bpList, 'bpList');
    if (bpList?.length) {
      bpList = bpList.reverse();
      const k = Object.assign([], bpList);
      k.sort(function (a: any, b: any) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return +new Date(b.date) - +new Date(a.date);
      });
      console.log(k, 'dated');
      k.forEach((element: any) => {
        if (element.date && element.avgDysBP && element.avgSysBP) {
          systolic.push(element.avgSysBP);
          diastolic.push(element.avgDysBP);
          this.bpChartLabels.push(element.date);
        }
      });
    }
    if (systolic.length && diastolic.length) {
      this.bpChartData.push({ data: systolic, label: 'Systolic BP' });
      this.bpChartData.push({ data: diastolic, label: 'Diastolic BP' });
    }
  }

  plotWeightGraph(weightList: any) {
    console.log(weightList, 'weightListCall');
    const data: any = [];
    const k = Object.assign([], weightList);
    k.sort(function (a: any, b: any) {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return +new Date(b.date) - +new Date(a.date);
    });
    console.log(k, 'dated');
    if (k?.length) {
      k.forEach((element: any) => {
        if (element.date && element.weight) {
          data.push(element.weight);
          this.weightChartLabels.push(element.date);
        }
      });
      this.weightChartData.push({ data: data, label: 'Weight' });
    }
  }

  plotBloodSugarGraph(bgList: any) {
    console.log(bgList, 'bgList....');
    const postPrandial: any = [];
    const fasting: any = [];
    const random: any = [];
    const k = Object.assign([], bgList);
    k.sort(function (a: any, b: any) {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return +new Date(b.date) - +new Date(a.date);
    });
    console.log(k, 'dated');
    if (k?.length) {
      k.forEach((element: any) => {
        if (
          element.date &&
          element.bg_2hr_pp &&
          element.bg_fasting &&
          element.bg_random
        ) {
          postPrandial.push(element.bg_2hr_pp);
          fasting.push(element.bg_fasting);
          random.push(element.bg_random);
          this.bgChartLabels.push(element.date);
        }
      });
      this.bgChartData.push({
        data: postPrandial,
        label: '2-Hr Post Prandial',
      });
      this.bgChartData.push({ data: fasting, label: 'Fasting' });
      this.bgChartData.push({ data: random, label: 'Random' });
    }
  }

  diagnosisSubscription: any;
  getDiagnosisDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.diagnosisSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res?.statusCode === 200 && res?.data?.diagnosis) {
          console.log('res.data for cancer', res.data);
          this.patchDiagnosisDetails(res.data.diagnosis);
        }
      });
  }

  patchDiagnosisDetails(diagnosis: any) {
    this.diagnosisForm.patchValue(diagnosis);
  }

  calculateBMI() {
    if (this.currentVitals !== null)
      return +(
        (this.currentVitals.weight_Kg /
          (this.currentVitals.height_cm * this.currentVitals.height_cm)) *
        10000
      ).toFixed(1);
    else return 0;
  }

  normalWaist = true;
  checkNormalWaist(patientWaist: any) {
    if (this.female && this.pregnancyStatus?.toLowerCase() !== 'yes')
      this.normalWaist = patientWaist < 80 ? true : false;
    else this.normalWaist = patientWaist < 90 ? true : false;
  }

  visitDateTime: any;
  getCaseSheetPrintData(visitDetail: any) {
    const visitDateAndTime: Date = visitDetail.createdDate;
    this.visitDateTime = new Date(visitDateAndTime).toISOString();
    this.sessionstorage.setItem('caseSheetBenFlowID', 'null');
    this.sessionstorage.setItem(
      'caseSheetVisitCategory',
      visitDetail.VisitCategory
    );
    this.sessionstorage.setItem(
      'caseSheetBeneficiaryRegID',
      visitDetail.beneficiaryRegID
    );
    this.sessionstorage.setItem('caseSheetVisitID', visitDetail.benVisitID);
    this.router.navigate(['/nurse-doctor/print']);
  }

  previousMMUHistoryRowsPerPage = 5;
  previousMMUHistoryActivePage = 1;
  rotate = true;
  historyOfMMU = [];
  filteredMMUHistory: any = [];
  hideMMUFetch: boolean = false;
  getMMUHistory() {
    this.doctorService.getMMUHistory().subscribe((data: any) => {
      console.log('data', data);

      if (data.statusCode === 200) {
        this.hideMMUFetch = true;
        console.log('dataget', data);
        this.historyOfMMU = data.data;
        this.filteredMMUHistory = data.data;
        this.previousMMUHistoryPageChanged({
          page: this.previousMMUHistoryActivePage,
          itemsPerPage: this.previousMMUHistoryRowsPerPage,
        });
      }
    });
  }
  filterMMUHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredMMUHistory = this.historyOfMMU;
    } else {
      this.filteredMMUHistory = [];
      this.historyOfMMU.forEach((item: any) => {
        const value: string = '' + item.VisitCategory;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredMMUHistory.push(item);
        }
      });
    }

    this.previousMMUHistoryActivePage = 1;
    this.previousMMUHistoryPageChanged({
      page: 1,
      itemsPerPage: this.previousMMUHistoryRowsPerPage,
    });
  }

  previousMMUHistoryPagedList = [];
  previousMMUHistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousMMUHistoryPagedList = this.filteredMMUHistory.slice(
      startItem,
      endItem
    );
    console.log('list', this.previousMMUHistoryPagedList);
  }
}
