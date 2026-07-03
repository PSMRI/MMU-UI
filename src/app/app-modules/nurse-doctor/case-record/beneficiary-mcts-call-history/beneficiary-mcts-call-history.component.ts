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

import { Component, OnInit, Inject, DoCheck } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
} from '@angular/material/dialog';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideSearch } from '@ng-icons/lucide';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardPaginatorComponent } from 'Common-UI/v2/ui/paginator';

@Component({
  selector: 'app-beneficiary-mcts-call-history',
  templateUrl: './beneficiary-mcts-call-history.component.html',
  standalone: true,
  imports: [
    MatDialogClose,
    NgIf,
    NgFor,
    FormsModule,
    NgIcon,
    ...cardImports,
    ...ZardTableImports,
    ZardInputDirective,
    ZardButtonComponent,
    ZardPaginatorComponent,
  ],
  viewProviders: [provideIcons({ lucideX, lucideSearch })],
})
export class BeneficiaryMctsCallHistoryComponent implements OnInit, DoCheck {
  current_language_set: any;
  filterTerm = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<BeneficiaryMctsCallHistoryComponent>,
    private httpServiceService: HttpServiceService
  ) {}

  callDetails: any = [];
  filteredCallDetails: any = [];
  callDetailsRowsPerPage = 5;
  callDetailsPagedList: any = [];

  ngOnInit() {
    this.callDetails = this.data;
    this.filteredCallDetails = this.data;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  filterCallHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredCallDetails = this.callDetails;
    } else {
      this.filteredCallDetails = [];
      this.callDetails.forEach((item: any) => {
        const value: string = '' + item.questionnaireDetail.question;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredCallDetails.push(item);
        }
      });
    }
  }
}
