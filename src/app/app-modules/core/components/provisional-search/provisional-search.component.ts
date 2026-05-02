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

import { Component, OnInit, Inject, DoCheck, ViewChild } from '@angular/core';
import { MasterdataService } from '../../../nurse-doctor/shared/services/masterdata.service';
import { SpinnerService } from '../../services/spinner.service';
import { HttpServiceService } from '../../services/http-service.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SetLanguageComponent } from '../set-language.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-provisional-search',
  templateUrl: './provisional-search.component.html',
  styleUrls: ['./provisional-search.component.css'],
})
export class ProvisionalSearchComponent implements OnInit, DoCheck {
  searchTerm: any;
  pageCount: any;
  selectedDiagnosisList: any = [];
  disableDiagnosisList: any = [];
  current_language_set: any;
  displayedColumns: any = ['ConceptID', 'term', 'empty'];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  diagnosis = new MatTableDataSource<any>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public dialogRef: MatDialogRef<ProvisionalSearchComponent>,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private spinnerService: SpinnerService
  ) {}
  placeHolderSearch: any;
  ngOnInit() {
    this.assignSelectedLanguage();
    this.search(this.input.searchTerm, 0);
    if (this.input.diagonasisType)
      this.placeHolderSearch = this.input.diagonasisType;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  selectDiagnosis(event: any, item: any) {
    if (event.checked) {
      item.selected = true;
      this.selectedDiagnosisList.push(item);
    } else {
      const index = this.selectedDiagnosisList.indexOf(item);
      this.selectedDiagnosisList.splice(index, 1);
      item.selected = false;
    }
  }

  disableSelection(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    const temp = addedDiagnosis.filter(
      (diagnosis: any) => diagnosis.conceptID === item.conceptID
    );
    if (temp.length > 0) {
      return true;
    } else {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID
      );
      const selectedDiagnosislength =
        this.input.addedDiagnosis.length +
        this.selectedDiagnosisList.length -
        1;
      if (currentSelection.length > 0) {
        return false;
      } else if (selectedDiagnosislength < 30) {
        return false;
      } else {
        return true;
      }
    }
  }

  selectedDiagnosis(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    const temp = addedDiagnosis.filter(
      (diagnosis: any) => diagnosis.conceptID === item.conceptID
    );
    if (temp.length > 0) return true;
    else {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID
      );
      if (currentSelection.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  submitDiagnosisList() {
    this.dialogRef.close(this.selectedDiagnosisList);
  }
  showProgressBar = false;
  search(term: string, pageNo: any): void {
    console.log(term);
    if (term.length > 2) {
      this.showProgressBar = true;
      this.masterdataService
        .searchDiagnosisBasedOnPageNo(term, pageNo)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              this.showProgressBar = false;
              if (res.data && res.data.sctMaster.length > 0) {
                this.showProgressBar = false;
                this.diagnosis.data = res.data.sctMaster;
                this.diagnosis.paginator = this.paginator;
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
    this.diagnosis.data = [];
    this.diagnosis.paginator = this.paginator;
  }
}
