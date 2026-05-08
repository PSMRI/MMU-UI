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

import { Component, OnInit, Input, OnChanges, DoCheck } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DoctorService } from '../../shared/services';
import { SetLanguageComponent } from '@/app-modules/core/components/set-language.component';
import { HttpServiceService } from '@/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ZardFormImports, ZardSelectImports, ZardRadioImports } from 'zard-ui';
import { NullDefaultValueDirective } from '@/app-modules/core/directives/null-default-value.directive';
import { StringValidatorDirective } from '@/app-modules/core/directives/stringValidator.directive';

import { MatRadioModule } from '@angular/material/radio';
import { ZardInputDirective } from '@/components/ui/input/input.directive';

@Component({
  selector: 'app-patient-adherence',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardFormImports,
    ZardSelectImports,
    ZardRadioImports,
    NullDefaultValueDirective,
    StringValidatorDirective,
    ZardInputDirective,
    LucideAngularModule,
  ],
  templateUrl: './adherence.component.html',
  styleUrls: ['./adherence.component.css'],
})
export class AdherenceComponent implements OnInit, DoCheck, OnChanges {
  @Input()
  patientAdherenceForm!: FormGroup;

  @Input()
  mode!: string;

  adherenceProgressData = ['Improved', 'Unchanged', 'Worsened'];
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }
  /*
   * JA354063 - Multilingual Changes added on 13/10/21
   */
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  // Ends
  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getAdherenceDetails(benRegID, visitID);
    }
  }

  getAdherenceDetails(beneficiaryRegID: any, visitID: any) {
    this.doctorService
      .getVisitComplaintDetails(beneficiaryRegID, visitID)
      .subscribe((value: any) => {
        if (
          value !== null &&
          value.statusCode === 200 &&
          value?.data?.BenAdherence !== null
        )
          this.patientAdherenceForm.patchValue(value.data.BenAdherence);
      });
  }

  checkReferralDescription(toReferral: any) {
    if (toReferral) {
      this.patientAdherenceForm.patchValue({ referralReason: null });
    }
  }

  checkDrugsDescription(toDrugs: any) {
    if (toDrugs) {
      this.patientAdherenceForm.patchValue({ drugReason: null });
    }
  }

  get drugReason() {
    return this.patientAdherenceForm.controls['drugReason'].value;
  }

  get referralReason() {
    return this.patientAdherenceForm.controls['referralReason'].value;
  }

  get toDrugs() {
    return this.patientAdherenceForm.controls['toDrugs'].value;
  }

  get toReferral() {
    return this.patientAdherenceForm.controls['toReferral'].value;
  }
}
