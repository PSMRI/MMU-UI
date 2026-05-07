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
  MatDialogContent,
} from '@angular/material/dialog';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-show-commit-and-version-details',
  templateUrl: './show-commit-and-version-details.component.html',
  styleUrls: ['./show-commit-and-version-details.component.css'],
  imports: [MatDialogClose, MatIcon, CdkScrollable, MatDialogContent],
})
export class ShowCommitAndVersionDetailsComponent implements OnInit, DoCheck {
  current_language_set: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public httpServiceService: HttpServiceService,
    public dialogRef: MatDialogRef<ShowCommitAndVersionDetailsComponent>
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
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
