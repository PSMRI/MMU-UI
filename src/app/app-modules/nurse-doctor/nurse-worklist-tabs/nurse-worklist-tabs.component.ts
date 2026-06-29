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

import { Component, DoCheck, OnInit } from '@angular/core';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { ZardTabComponent, ZardTabGroupComponent } from 'Common-UI/v2/ui/tabs';
import { NurseWorklistComponent } from '../nurse-worklist/nurse-worklist.component';
import { NurseRefferedWorklistComponent } from './nurse-reffered-worklist/nurse-reffered-worklist.component';

@Component({
  selector: 'app-nurse-worklist-tabs',
  templateUrl: './nurse-worklist-tabs.component.html',
  host: { class: 'block' },
  imports: [
    ZardTabGroupComponent,
    ZardTabComponent,
    NurseWorklistComponent,
    NurseRefferedWorklistComponent,
  ],
})
export class NurseWorklistTabsComponent implements OnInit, DoCheck {
  currentLanguageSet: any;

  constructor(private httpServices: HttpServiceService) {}

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
}
