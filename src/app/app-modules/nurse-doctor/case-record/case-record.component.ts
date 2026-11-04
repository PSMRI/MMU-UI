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

import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgIf } from '@angular/common';
import { CancerCaseRecordComponent } from './cancer-case-record/cancer-case-record.component';
import { GeneralCaseRecordComponent } from './general-case-record/general-case-record.component';

@Component({
  selector: 'app-case-record',
  templateUrl: './case-record.component.html',
  imports: [NgIf, CancerCaseRecordComponent, GeneralCaseRecordComponent],
})
export class CaseRecordComponent implements OnInit {
  @Input()
  patientCaseRecordForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  caseRecordMode!: string;

  @Input()
  findings: any;

  @Input()
  currentVitals: any;

  @Input()
  pregnancyStatus: any;

  showGeneralOPD: boolean = false;
  showCancer: boolean = false;

  constructor() {}

  ngOnInit() {
    if (this.visitCategory) {
      console.log('case record', this.visitCategory);
      this.showGeneralOPD =
        this.visitCategory === 'General OPD' ||
        this.visitCategory === 'ANC' ||
        this.visitCategory === 'NCD care' ||
        this.visitCategory === 'PNC' ||
        this.visitCategory === 'COVID-19 Screening' ||
        this.visitCategory === 'NCD screening'
          ? true
          : false;
      this.showCancer =
        this.visitCategory === 'Cancer Screening' ? true : false;
    }
  }
}
