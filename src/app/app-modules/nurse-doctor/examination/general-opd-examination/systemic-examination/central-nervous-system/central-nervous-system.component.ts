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
  selector: 'app-nurse-central-nervous-system',
  templateUrl: './central-nervous-system.component.html',
  styleUrls: ['./central-nervous-system.component.css'],
})
export class CentralNervousSystemComponent implements OnInit, DoCheck {
  @Input()
  centralNervousSystemDataForm!: FormGroup;

  selectHandedness = [
    {
      name: 'No',
      id: 1,
    },
    {
      name: 'Right Handed',
      id: 2,
    },
    {
      name: 'Left Handed',
      id: 3,
    },
  ];
  languageComponent!: SetLanguageComponent;

  currentLanguageSet: any;

  constructor(private httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.fetchLanguageResponse();
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
