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

import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgIf } from '@angular/common';
import { GeneralOpdDiagnosisComponent } from './general-opd-diagnosis/general-opd-diagnosis.component';
import { AncDiagnosisComponent } from './anc-diagnosis/anc-diagnosis.component';
import { PncDiagnosisComponent } from './pnc-diagnosis/pnc-diagnosis.component';
import { NcdCareDiagnosisComponent } from './ncd-care-diagnosis/ncd-care-diagnosis.component';
import { CovidDiagnosisComponent } from './covid-diagnosis/covid-diagnosis.component';
import { NcdScreeningDiagnosisComponent } from './ncd-screening-diagnosis/ncd-screening-diagnosis.component';
@Component({
  selector: 'app-diagnosis',
  templateUrl: './diagnosis.component.html',
  styleUrls: ['./diagnosis.component.css'],
  standalone: true,
  imports: [
    NgIf,
    GeneralOpdDiagnosisComponent,
    AncDiagnosisComponent,
    PncDiagnosisComponent,
    NcdCareDiagnosisComponent,
    CovidDiagnosisComponent,
    NcdScreeningDiagnosisComponent,
  ],
})
export class DiagnosisComponent {
  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  caseRecordMode!: string;
  constructor() {}
}
