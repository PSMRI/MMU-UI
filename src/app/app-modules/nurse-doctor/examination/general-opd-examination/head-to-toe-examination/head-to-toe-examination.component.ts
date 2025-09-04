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

import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-nurse-head-to-toe-examination',
  templateUrl: './head-to-toe-examination.component.html',
  styleUrls: ['./head-to-toe-examination.component.css'],
})
export class HeadToToeExaminationComponent implements OnInit, DoCheck {
  @Input()
  headToToeExaminationDataForm!: FormGroup;
  languageComponent!: SetLanguageComponent;

  currentLanguageSet: any;

  constructor(private httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }
  checkWithHeadToToe() {
    this.headToToeExaminationDataForm.patchValue({ head: null });
    this.headToToeExaminationDataForm.patchValue({ eyes: null });
    this.headToToeExaminationDataForm.patchValue({ ears: null });
    this.headToToeExaminationDataForm.patchValue({ nose: null });
    this.headToToeExaminationDataForm.patchValue({ oralCavity: null });
    this.headToToeExaminationDataForm.patchValue({ throat: null });
    this.headToToeExaminationDataForm.patchValue({ breastAndNipples: null });
    this.headToToeExaminationDataForm.patchValue({ trunk: null });
    this.headToToeExaminationDataForm.patchValue({ upperLimbs: null });
    this.headToToeExaminationDataForm.patchValue({ lowerLimbs: null });
    this.headToToeExaminationDataForm.patchValue({ skin: null });
    this.headToToeExaminationDataForm.patchValue({ hair: null });
    this.headToToeExaminationDataForm.patchValue({ nails: null });
  }
  get headtoToeExam() {
    return this.headToToeExaminationDataForm.controls['headtoToeExam'].value;
  }

  get head() {
    return this.headToToeExaminationDataForm.controls['head'].value;
  }
  get eyes() {
    return this.headToToeExaminationDataForm.controls['eyes'].value;
  }
  get ears() {
    return this.headToToeExaminationDataForm.controls['ears'].value;
  }
  get nose() {
    return this.headToToeExaminationDataForm.controls['nose'].value;
  }
  get oralCavity() {
    return this.headToToeExaminationDataForm.controls['oralCavity'].value;
  }
  get throat() {
    return this.headToToeExaminationDataForm.controls['throat'].value;
  }
  get breastAndNipples() {
    return this.headToToeExaminationDataForm.controls['breastAndNipples'].value;
  }
  get trunk() {
    return this.headToToeExaminationDataForm.controls['trunk'].value;
  }
  get upperLimbs() {
    return this.headToToeExaminationDataForm.controls['upperLimbs'].value;
  }
  get lowerLimbs() {
    return this.headToToeExaminationDataForm.controls['lowerLimbs'].value;
  }
  get skin() {
    return this.headToToeExaminationDataForm.controls['skin'].value;
  }
  get hair() {
    return this.headToToeExaminationDataForm.controls['hair'].value;
  }
  get nails() {
    return this.headToToeExaminationDataForm.controls['nails'].value;
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
