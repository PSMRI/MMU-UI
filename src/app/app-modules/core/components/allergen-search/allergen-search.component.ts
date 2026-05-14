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

import { Component, Inject, OnInit, DoCheck, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-allergen-search',
  templateUrl: './allergen-search.component.html',
  styleUrls: ['./allergen-search.component.css'],

  standalone: false,
})
export class AllergenSearchComponent implements OnInit, DoCheck {
  searchTerm!: string;
  pageCount: any;
  selectedComponentsList = [];
  placeHolderSearch: any;
  current_language_set: any;

  selectedComponent: any = null;
  selectedComponentNo: any;
  message = '';
  selectedItem: any;
  displayedColumns: any = ['ConceptID', 'term', 'empty'];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  components = new MatTableDataSource<any>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    public dialogRef: MatDialogRef<AllergenSearchComponent>
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.search(this.input.searchTerm, 0);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  selectComponentName(item: any, component: any) {
    this.selectedComponent = null;
    this.selectedComponentNo = item;
    this.selectedComponent = component;
    this.selectedItem = component;
  }
  submitComponentList() {
    const reqObj = {
      componentNo: this.selectedComponentNo,
      component: this.selectedComponent,
    };
    this.dialogRef.close(reqObj);
  }
  showProgressBar = false;
  search(term: string, pageNo: any): void {
    if (term.length > 2) {
      this.showProgressBar = true;
      this.masterdataService
        .searchDiagnosisBasedOnPageNo1(term, pageNo)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              this.showProgressBar = false;
              if (res.data && res.data.sctMaster.length > 0) {
                this.components.data = res.data.sctMaster;
                this.components.paginator = this.paginator;
              } else {
                this.message = this.current_language_set.common.noRecordFound;
              }
            } else {
              this.resetData();
              this.showProgressBar = false;
            }
          },
          err => {
            this.resetData();
            this.showProgressBar = false;
          }
        );
    }
  }

  resetData() {
    this.components.data = [];
    this.components.paginator = this.paginator;
  }
}
