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
  EventEmitter,
  Input,
  OnChanges,
  Output,
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-contact-history',
  templateUrl: './contact-history.component.html',
  styleUrls: ['./contact-history.component.css'],
})
export class ContactHistoryComponent
  implements OnInit, DoCheck, OnChanges, OnDestroy
{
  @Input()
  patientCovidForm!: FormGroup;

  @Input()
  mode!: string;
  @Output() filter: EventEmitter<any> = new EventEmitter<any>();
  question3!: string;
  TravelPlaces_flag!: boolean;
  feverCoughBreath_flag!: boolean;
  confirmedCaseCOVID_flag!: boolean;
  contactArray: any;
  contactList: any;
  contactData: any;
  cont: any;
  allSymp: any;
  contactReqiured!: string;
  contactResponseList: any;
  contactFlag: boolean = false;
  currentLanguageSet: any;
  constructor(
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private httpServices: HttpServiceService
  ) {
    this.masterdataService.listen().subscribe((m: any) => {
      console.log(m);
      this.onSymptomFilterClick(m);
    });
  }
  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('contact', 'null');
    console.log('contactvalue' + this.patientCovidForm.value);
    this.getContactHistoryMasterData();
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
      this.getContactDetails(benRegID, visitID);
    }
  }
  ngOnDestroy() {
    if (this.contactHistoryMasterData)
      this.contactHistoryMasterData.unsubscribe();

    if (this.covidContactHistory) this.covidContactHistory.unsubscribe();
  }
  covidContactHistory: any;
  getContactDetails(beneficiaryRegID: any, visitID: any) {
    this.covidContactHistory = this.doctorService
      .getVisitComplaintDetails(beneficiaryRegID, visitID)
      .subscribe((value: any) => {
        if (
          value !== null &&
          value.statusCode === 200 &&
          value?.data?.covidDetails !== null
        ) {
          console.log('contactStatus', value.data.covidDetails.contactStatus);
          this.patientCovidForm.patchValue({
            contactStatus: value.data.covidDetails.contactStatus,
          });
          this.contactResponseList = value.data.covidDetails.contactStatus;
          this.contactFlag = true;
        }
      });
  }

  contactHistoryMasterData: any;
  getContactHistoryMasterData() {
    this.contactHistoryMasterData =
      this.masterdataService.nurseMasterData$.subscribe(response => {
        if (response !== null) {
          console.log('contactmaster', response.covidContactHistoryMaster);
          this.contactArray = response.covidContactHistoryMaster;
          const selectedContact = this.contactArray.map(
            ({ contactHistory }: any) => contactHistory
          );
          this.contactData = selectedContact;
          this.contactList = selectedContact;
        }
      });
  }

  contactSelected() {
    console.log('ConsoleStaus' + this.contactStatus.length);
    if (this.contactStatus.length !== 0) {
      if (this.contactStatus.indexOf('None of the above') > -1) {
        this.sessionstorage.setItem('contact', 'false');

        this.contactData = this.contactList.filter((item: any) => {
          return item === 'None of the above';
        });
      } else {
        this.sessionstorage.setItem('contact', 'true');
        this.contactData = this.contactList.filter((item: any) => {
          return item !== 'None of the above';
        });
      }
      this.cont = this.sessionstorage.getItem('contact');
      this.nurseService.filter(this.cont);
    } else {
      this.contactData = this.contactList;
      this.sessionstorage.setItem('contact', 'null');
      this.cont = this.sessionstorage.getItem('contact');
      this.nurseService.filter(this.cont);
    }
  }

  onSymptomFilterClick(symp: any) {
    console.log('Symptom Travel' + symp);
    this.allSymp = this.sessionstorage.getItem('allSymptom');
    if (this.allSymp === 'true') {
      this.contactReqiured = 'false';
    } else {
      this.contactReqiured = 'true';
    }
  }
  get contactStatus() {
    return this.patientCovidForm.controls['contactStatus'].value;
  }
}
