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

import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { DoctorService } from '../../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardPaginatorComponent } from 'Common-UI/v2/ui/paginator';
@Component({
  selector: 'app-previous-significiant-findings',
  templateUrl: './previous-significiant-findings.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    NgIcon,
    DatePipe,
    ...cardImports,
    ...ZardTableImports,
    ZardInputDirective,
    ZardPaginatorComponent,
  ],
  viewProviders: [provideIcons({ lucideSearch })],
})
export class PreviousSignificiantFindingsComponent
  implements OnInit, OnDestroy, DoCheck
{
  current_language_set: any;
  filterTerm = '';

  displayedColumns: any = ['sno', 'significantfindings', 'captureddate'];

  constructor(
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
    private httpServiceService: HttpServiceService
  ) {}
  rowsPerPage = 5;
  activePage = 1;
  pagedList: any[] = [];
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

  previousSignificiantFindingsList: any[] = [];
  filteredPreviousSignificiantFindingsList: any[] = [];
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
