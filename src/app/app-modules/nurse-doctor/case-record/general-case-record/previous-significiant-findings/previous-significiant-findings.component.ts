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
  DoCheck,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DoctorService } from '../../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-previous-significiant-findings',
  templateUrl: './previous-significiant-findings.component.html',
  styleUrls: ['./previous-significiant-findings.component.css'],
})
export class PreviousSignificiantFindingsComponent
  implements OnInit, OnDestroy, DoCheck
{
  current_language_set: any;

  displayedColumns: any = ['sno', 'significantfindings', 'captureddate'];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
    private httpServiceService: HttpServiceService
  ) {}
  rowsPerPage = 5;
  activePage = 1;
  pagedList = [];
  rotate = true;
  ngOnInit() {
    this.getPreviousSignificiantFindings();
  }

  ngOnDestroy() {
    if (this.previousSignificantFindingsSubs)
      this.previousSignificantFindingsSubs.unsubscribe();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredPreviousSignificiantFindingsList.slice(
      startItem,
      endItem
    );
    console.log('list', this.pagedList);
  }

  previousSignificiantFindingsList = [];
  filteredPreviousSignificiantFindingsList = [];
  previousSignificantFindingsSubs: any;
  getPreviousSignificiantFindings() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.previousSignificantFindingsSubs = this.doctorService
      .getPreviousSignificiantFindings({ beneficiaryRegID: benRegID })
      .subscribe((data: any) => {
        console.log('previousSignificantFindingsSubs', data);
        if (data.statusCode === 200) {
          if (data?.data?.findings) {
            this.previousSignificiantFindingsList = data.data.findings;
            this.filteredPreviousSignificiantFindingsList =
              this.previousSignificiantFindingsList;
            this.dataSource.data = [];
            this.dataSource.data = this.previousSignificiantFindingsList;
            this.dataSource.paginator = this.paginator;
          }
        }
      });
  }

  filterPreviousSignificiantFindingsList(searchTerm?: string) {
    if (!searchTerm)
      this.filteredPreviousSignificiantFindingsList =
        this.previousSignificiantFindingsList;
    else {
      this.filteredPreviousSignificiantFindingsList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.previousSignificiantFindingsList.forEach(item => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredPreviousSignificiantFindingsList.push(item);
            break;
          }
        }
      });
    }
  }
}
