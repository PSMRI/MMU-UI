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

import { Component, OnInit, Input, OnDestroy, DoCheck } from '@angular/core';
import { MasterdataService } from '../../../../shared/services';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-nurse-musculoskeletal-system',
  templateUrl: './musculoskeletal-system.component.html',
  styleUrls: ['./musculoskeletal-system.component.css'],
})
export class MusculoskeletalSystemComponent
  implements OnInit, OnDestroy, DoCheck
{
  @Input()
  musculoSkeletalSystemDataForm!: FormGroup;

  selectTypeOfJoint: any = [];

  selectJointLaterality = [
    {
      name: 'Left',
      id: 1,
    },
    {
      name: 'Right',
      id: 2,
    },
    {
      name: 'Bilateral',
      id: 3,
    },
  ];

  selectJointAbnormality = [
    {
      name: 'Swelling',
      id: 1,
    },
    {
      name: 'Tenderness',
      id: 2,
    },
    {
      name: 'Deformity',
      id: 3,
    },
    {
      name: 'Restriction',
      id: 4,
    },
  ];

  selectUpperLimbsLaterality = [
    {
      name: 'Left',
      id: 1,
    },
    {
      name: 'Right',
      id: 2,
    },
    {
      name: 'Bilateral',
      id: 3,
    },
  ];

  selectUpperLimbsAbnormality = [
    {
      name: 'Swelling',
      id: 1,
    },
    {
      name: 'Tenderness',
      id: 2,
    },
    {
      name: 'Deformity',
      id: 3,
    },
    {
      name: 'Restriction',
      id: 4,
    },
  ];

  selectLowerLimbsLaterality = [
    {
      name: 'Left',
      id: 1,
    },
    {
      name: 'Right',
      id: 2,
    },
    {
      name: 'Bilateral',
      id: 3,
    },
  ];

  selectLowerLimbsAbnormality = [
    {
      name: 'Swelling',
      id: 1,
    },
    {
      name: 'Tenderness',
      id: 2,
    },
    {
      name: 'Deformity',
      id: 3,
    },
    {
      name: 'Restriction',
      id: 4,
    },
  ];
  languageComponent!: SetLanguageComponent;

  currentLanguageSet: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    private trackingService: AmritTrackingService
  ) {}

  ngOnInit() {
    this.getMasterData();
    this.fetchLanguageResponse();
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData) this.selectTypeOfJoint = masterData.jointTypes;
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

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(
      fieldName,
      'Musculoskeletal System Examination'
    );
  }
}
