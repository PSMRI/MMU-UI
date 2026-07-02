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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NgIf, NgFor } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { cardImports } from 'Common-UI/v2/ui/card';
@Component({
  selector: 'app-view-test-report',
  templateUrl: './view-test-report.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgIcon,
    ZardButtonComponent,
    ...ZardTableImports,
    ...cardImports,
  ],
  viewProviders: [provideIcons({ lucideX })],
})
export class ViewTestReportComponent implements OnInit, DoCheck {
  current_language_set: any;

  displayedColumns: any = [
    'procedureName',
    'componentName',
    'testresult',
    'unit',
  ];

  dataSource: { data: any[] } = { data: [] };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public matDialogRef: MatDialogRef<ViewTestReportComponent>,
    private httpServiceService: HttpServiceService
  ) {}

  ngOnInit() {
    console.log('data', this.data);
    this.dataSource.data = this.data;
    console.log('this.testReport ', this.dataSource.data);
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
}
