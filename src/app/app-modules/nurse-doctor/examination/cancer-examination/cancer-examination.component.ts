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
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { DoctorService } from '../../shared/services/doctor.service';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from '../../../core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Component({
  selector: 'app-cancer-examination',
  templateUrl: './cancer-examination.component.html',
  styleUrls: ['./cancer-examination.component.css'],
})
export class CancerExaminationComponent
  implements OnInit, DoCheck, OnChanges, OnDestroy
{
  @Input()
  cancerForm!: FormGroup;

  @Input()
  mode!: string;

  female = false;
  showBreastExamination = false;

  currentLanguageSet: any;
  signsForm!: FormGroup;
  oralExaminationForm!: FormGroup;
  breastExaminationForm!: FormGroup;
  abdominalExaminationForm!: FormGroup;
  gynecologicalExaminationForm!: FormGroup;

  constructor(
    private httpServiceService: HttpServiceService,
    public doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private beneficiaryDetailsService: BeneficiaryDetailsService
  ) {}

  ngOnInit() {
    this.getBeneficiaryDetails();
    this.fetchLanguageResponse();

    if (this.cancerForm?.get('signsForm')) {
      this.cancerForm.get('signsForm')!.valueChanges.subscribe(value => {
        if (value.breastEnlargement) this.showBreastExamination = true;
        else this.showBreastExamination = false;
      });
    }
    this.signsForm = this.cancerForm.get('signsForm') as FormGroup;
    this.oralExaminationForm = this.cancerForm.get(
      'oralExaminationForm'
    ) as FormGroup;
    this.breastExaminationForm = this.cancerForm.get(
      'breastExaminationForm'
    ) as FormGroup;
    this.abdominalExaminationForm = this.cancerForm.get(
      'abdominalExaminationForm'
    ) as FormGroup;
    this.gynecologicalExaminationForm = this.cancerForm.get(
      'gynecologicalExaminationForm'
    ) as FormGroup;
  }

  ngOnChanges() {
    if (String(this.mode) === 'update') this.upadteCancerExaminationDetails();

    if (String(this.mode) === 'view') this.fetchCancerExaminationDetails();
  }

  getImageCoordinates(examinationForm: any) {
    const imageCords = [];
    const image1 =
      examinationForm.controls.oralExaminationForm.controls['image'].value;
    if (image1 && examinationForm.controls.oralExaminationForm.dirty)
      imageCords.push(image1);
    const image2 =
      examinationForm.controls.abdominalExaminationForm.controls['image'].value;
    if (image2 && examinationForm.controls.abdominalExaminationForm.dirty)
      imageCords.push(image2);
    const image3 =
      examinationForm.controls.gynecologicalExaminationForm.controls['image']
        .value;
    if (image3 && examinationForm.controls.gynecologicalExaminationForm.dirty)
      imageCords.push(image3);
    const image4 =
      examinationForm.controls.breastExaminationForm.controls['image'].value;
    if (image4 && examinationForm.controls.breastExaminationForm.dirty)
      imageCords.push(image4);

    return imageCords;
  }

  updateExaminationSubs: any;
  upadteCancerExaminationDetails() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const updateDetails = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    const imageCoordinates = this.getImageCoordinates(this.cancerForm);

    this.updateExaminationSubs = this.doctorService
      .updateCancerExaminationDetails(
        this.cancerForm,
        updateDetails,
        imageCoordinates
      )
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            setTimeout(
              () =>
                this.confirmationService.alert(res.data.response, 'success'),
              0
            );
            this.cancerForm.markAsPristine();
          } else {
            setTimeout(
              () => this.confirmationService.alert(res.errorMessage, 'error'),
              0
            );
          }
        },
        err => {
          setTimeout(() => this.confirmationService.alert(err, 'error'), 0);
        }
      );
  }

  fetchExaminationDetailsSubs: any;
  fetchCancerExaminationDetails() {
    const beneficiaryRegID: any =
      this.sessionstorage.getItem('beneficiaryRegID');
    const benVisitID: any = this.sessionstorage.getItem('visitID');

    this.fetchExaminationDetailsSubs = this.doctorService
      .getCancerExaminationDetails(beneficiaryRegID, benVisitID)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.patchExaminationDetails(res.data);
          } else {
            setTimeout(
              () => this.confirmationService.alert(res.errorMessage, 'error'),
              0
            );
          }
        },
        err => {
          setTimeout(() => this.confirmationService.alert(err, 'error'), 0);
        }
      );
  }

  filterAnnotatedImageList(imageCoordinates: any, imageID: any) {
    let image;
    const temp = imageCoordinates.filter(
      (item: any) => item.imageID === imageID
    );
    if (temp.length === 1) image = temp[0];
    return image;
  }

  getMergedLymphNodeValues(apiNodes: any[]): any[] {
    const serviceLineDetailsParsed = JSON.parse(
      this.sessionstorage.getItem('serviceLineDetails')
    );
    const lymphNodesArray = (<FormArray>(
      (<FormGroup>this.cancerForm.controls['signsForm']).controls['lymphNodes']
    )).controls;

    return lymphNodesArray.map(baseNode => {
      const matches = apiNodes.filter(
        apiNode =>
          apiNode.lymphNodeName.trim().toLowerCase() ===
          baseNode.value.lymphNodeName.trim().toLowerCase()
      );

      const valid = matches.find(
        node =>
          node.size_Left !== null ||
          node.size_Right !== null ||
          node.mobility_Left !== null ||
          node.mobility_Right !== null
      );

      return {
        lymphNodeName: baseNode.value.lymphNodeName,
        size_Left: valid?.size_Left ?? null,
        mobility_Left: valid?.mobility_Left ?? null,
        size_Right: valid?.size_Right ?? null,
        mobility_Right: valid?.mobility_Right ?? null,
        vanID: valid?.vanID ?? serviceLineDetailsParsed.vanID,
        parkingPlaceID:
          valid?.parkingPlaceID ?? serviceLineDetailsParsed.parkingPlaceID,
      };
    });
  }

  patchExaminationDetails(examinationDetails: any) {
    if (examinationDetails.signsAndSymptoms) {
      const signFormDetails = Object.assign(
        {},
        examinationDetails.signsAndSymptoms,
        { lymphNodes: examinationDetails.BenCancerLymphNodeDetails }
      );
      const lymphNodesFormArray = (<FormArray>(
        (<FormGroup>this.cancerForm.controls['signsForm']).controls[
          'lymphNodes'
        ]
      )).controls;
      console.log(' signFormDetails.lymphNodes.slice()');

      // const lymphNodes = signFormDetails.lymphNodes.slice();
      const lymphNodes = this.getMergedLymphNodeValues(
        examinationDetails.BenCancerLymphNodeDetails
      );
      delete signFormDetails.lymphNodes;
      this.cancerForm.controls['signsForm'].patchValue(signFormDetails);
      console.log('lymphNodes from res', lymphNodes);

      lymphNodes.forEach((element: any) => {
        const temp = lymphNodesFormArray.filter((lymphForm: any) => {
          return (
            lymphForm.controls['lymphNodeName'].value === element.lymphNodeName
          );
        });

        if (temp.length > 0) temp[0].patchValue(element);
      });
    }

    if (examinationDetails.oralExamination) {
      const image = this.filterAnnotatedImageList(
        examinationDetails.imageCoordinates,
        3
      );
      const arr = [
        'Leukoplakia',
        'Sub muscus fibrosis',
        'Melanoplakia',
        'Erythroplakia',
        'Non healing mouth ulcer(>2 weeks)',
        'Any other lesion',
      ];

      const temp =
        examinationDetails.oralExamination.preMalignantLesionType.split(',');
      temp.pop();

      const other = temp.filter((item: any) => {
        return arr.indexOf(item) === -1;
      });

      console.log('there', other, temp);

      if (other.length > 0) {
        examinationDetails.oralExamination.otherLesionType = other[0];
        temp.push('Any other lesion');
      }
      examinationDetails.oralExamination.preMalignantLesionTypeList = temp;

      const oralExaminationFormDetails = Object.assign(
        {},
        examinationDetails.oralExamination,
        { image }
      );

      this.cancerForm.controls['oralExaminationForm'].patchValue(
        oralExaminationFormDetails
      );
    }
    if (examinationDetails.breastExamination) {
      const image = this.filterAnnotatedImageList(
        examinationDetails.imageCoordinates,
        2
      );
      const breastExaminationFormDetails = Object.assign(
        {},
        examinationDetails.breastExamination,
        { image }
      );
      this.cancerForm.controls['breastExaminationForm'].patchValue(
        breastExaminationFormDetails
      );
    }

    if (examinationDetails.abdominalExamination) {
      const image = this.filterAnnotatedImageList(
        examinationDetails.imageCoordinates,
        1
      );
      const abdominalExaminationFormDetails = Object.assign(
        {},
        examinationDetails.abdominalExamination,
        { image }
      );
      this.cancerForm.controls['abdominalExaminationForm'].patchValue(
        abdominalExaminationFormDetails
      );
    }

    if (examinationDetails.gynecologicalExamination) {
      this.doctorService.gynecologicalFiles =
        examinationDetails.gynecologicalExamination.files;
      const image = this.filterAnnotatedImageList(
        examinationDetails.imageCoordinates,
        4
      );
      const gynecologicalExaminationFormDetails = Object.assign(
        {},
        examinationDetails.gynecologicalExamination,
        { image }
      );
      const splitTypeOfLesion =
        examinationDetails.gynecologicalExamination.typeOfLesion.split(',');
      splitTypeOfLesion.pop();
      gynecologicalExaminationFormDetails.typeOfLesionList = splitTypeOfLesion;
      this.cancerForm.controls['gynecologicalExaminationForm'].patchValue(
        gynecologicalExaminationFormDetails
      );
    }
  }

  beneficiaryDetailsSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
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

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();

    if (this.fetchExaminationDetailsSubs)
      this.fetchExaminationDetailsSubs.unsubscribe();

    if (this.updateExaminationSubs) this.updateExaminationSubs.unsubscribe();
  }

  //BU40088124 12/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  //--End--
}
