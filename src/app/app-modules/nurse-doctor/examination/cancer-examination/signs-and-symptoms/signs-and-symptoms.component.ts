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

import {
  Component,
  OnInit,
  Input,
  DoCheck,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { CancerUtils } from '../../../shared/utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ZardFormImports } from '@/components/ui/form/form.imports';
import { ZardRadioImports } from '@/components/ui/radio/radio.imports';
import { ZardTableImports } from '@/components/ui/table/table.imports';
import { ZardLabelImports } from '@/components/ui/label/label.imports';
import { NgIf } from '@angular/common';
import { StringValidatorDirective } from '../../../../core/directives/stringValidator.directive';

@Component({
  selector: 'app-doctor-signs-and-symptoms',
  templateUrl: './signs-and-symptoms.component.html',
  styleUrls: ['./signs-and-symptoms.component.css'],
  imports: [
    ReactiveFormsModule,
    ZardFormImports,
    ZardRadioImports,
    ZardTableImports,
    ZardLabelImports,
    NgIf,
    StringValidatorDirective,
  ],
})
export class SignsAndSymptomsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  signsForm!: FormGroup;

  female18 = false;
  female30 = false;
  female = false;
  languageComponent!: SetLanguageComponent;

  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private beneficiaryDetailsService: BeneficiaryDetailsService
  ) {}

  ngOnInit() {
    this.getBeneficiaryDetails();
    this.fetchLanguageResponse();
    this.checkLymph(this.lymphNode_Enlarged);
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubs) this.beneficiaryDetailsSubs.unsubscribe();
  }

  beneficiaryDetailsSubs: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubs =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiaryDetails => {
          if (
            beneficiaryDetails?.genderName?.toLowerCase() === 'female' ||
            beneficiaryDetails?.genderName?.toLowerCase() === 'transgender'
          )
            this.female = true;
          else this.female = false;

          if (
            beneficiaryDetails?.genderName?.toLowerCase() === 'female' &&
            beneficiaryDetails?.ageVal >= 18
          )
            this.female18 = true;
          else this.female18 = false;

          if (
            beneficiaryDetails?.genderName?.toLowerCase() === 'female' &&
            beneficiaryDetails.ageVal >= 30
          )
            this.female30 = true;
          else this.female30 = false;
        }
      );
  }

  checkLymph(lymphNode_Enlarged: any) {
    if (!lymphNode_Enlarged) {
      this.signsForm.patchValue({
        lymphNodes: new CancerUtils(
          this.fb,
          this.sessionstorage
        ).lymphNodesArray.map(item => item),
      });
    }
  }

  get observation() {
    return this.signsForm.get('observation');
  }

  get lymphNode_Enlarged() {
    return this.signsForm.controls['lymphNode_Enlarged'].value;
  }

  get lymphNodes() {
    return this.signsForm.controls['lymphNodes'] as FormArray;
  }

  //BU40088124 12/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
