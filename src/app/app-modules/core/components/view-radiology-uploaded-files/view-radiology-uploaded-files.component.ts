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
import { HttpServiceService } from '../../services/http-service.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose,
} from '@angular/material/dialog';
import { SetLanguageComponent } from '../set-language.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-view-radiology-uploaded-files',
  templateUrl: './view-radiology-uploaded-files.component.html',
  styleUrls: ['./view-radiology-uploaded-files.component.css'],
  imports: [MatDialogClose, MatTooltip, MatIcon, NgIf, NgFor],
})
export class ViewRadiologyUploadedFilesComponent implements OnInit, DoCheck {
  current_language_set: any;
  fileIds = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public httpServiceService: HttpServiceService,
    private dialogRef: MatDialogRef<ViewRadiologyUploadedFilesComponent>
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    if (this.input && this.input.filesDetails !== undefined) {
      this.getFilesDetails(this.input.filesDetails);
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getFilesDetails(filesDetails: any) {
    this.fileIds = filesDetails;
  }
  openFileContent(fileID: any) {
    this.dialogRef.close(fileID);
  }
}
