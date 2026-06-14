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
  ViewChild,
  ElementRef,
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CameraService } from '../../../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-doctor-breast-examination',
  templateUrl: './breast-examination.component.html',
  styleUrls: ['./breast-examination.component.css'],
  standalone: false,
})
export class BreastExaminationComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  breastExaminationForm!: FormGroup;

  @ViewChild('breastsImage')
  private breastsImage!: ElementRef;

  female = false;
  imagePoints: any;
  languageComponent!: SetLanguageComponent;

  currentLanguageSet: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private cameraService: CameraService
  ) {}

  ngOnInit() {
    this.getBeneficiaryDetails();
    this.fetchLanguageResponse();
  }

  ngOnDestroy() {
    if (this.beneficiarySubs) this.beneficiarySubs.unsubscribe();
  }

  beneficiarySubs: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
      beneficiaryDetails => {
        if (
          beneficiaryDetails?.genderName?.toLowerCase() === 'female' ||
          beneficiaryDetails?.genderName?.toLowerCase() === 'transgender'
        )
          this.female = true;
      }
    );
  }

  checkBreastFeed() {
    this.breastExaminationForm.patchValue({
      breastFeedingDurationGTE6months: null,
    });
  }

  checkLump() {
    this.breastExaminationForm.patchValue({ lumpSize: null });
    this.breastExaminationForm.patchValue({ lumpShape: null });
    this.breastExaminationForm.patchValue({ lumpTexture: null });
  }

  get everBreastFed() {
    return this.breastExaminationForm.get('everBreastFed');
  }

  get lumpInBreast() {
    return this.breastExaminationForm.get('lumpInBreast');
  }

  annotateImage() {
    this.cameraService
      .annotate(
        this.breastsImage.nativeElement.attributes.src.nodeValue,
        this.breastExaminationForm.controls['image'].value,
        this.currentLanguageSet
      )
      .subscribe(result => {
        if (result) {
          this.imagePoints = result;
          this.imagePoints.imageID = 2;
          this.breastExaminationForm.patchValue({ image: this.imagePoints });
          this.breastExaminationForm.markAsDirty();
        }
      });
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
