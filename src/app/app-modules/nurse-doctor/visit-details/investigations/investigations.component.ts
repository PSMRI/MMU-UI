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
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgFor } from '@angular/common';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';

@Component({
  selector: 'app-patient-investigations',
  templateUrl: './investigations.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    ...ZardFormImports,
    ...ZardSelectImports,
  ],
})
export class InvestigationsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  patientInvestigationsForm!: FormGroup;

  @Input()
  mode!: string;

  patientInvestigationDetails: any;
  selectLabTest: any;
  currentLanguageSet: any;
  rbsTestResultSubscription!: Subscription;
  RBSTestScore!: number;
  RBStestDone: boolean = false;
  rbsTestResultCurrent: any;

  /**
   * z-select is string-valued, but the `laboratoryList` form control stores the
   * full array of selected procedure OBJECTS (the API payload reads it directly).
   * This local model keys each option by its stringified procedureID so the
   * string-valued select can drive an object-valued control (adapter pattern).
   */
  selectedLabIds: string[] = [];
  private laboratoryListSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private nurseService: NurseService
  ) {}

  ngOnInit() {
    this.nurseService.clearRbsInVitals();
    this.assignSelectedLanguage();
    this.getNurseMasterData();
    this.rbsTestValidation();

    // Keep the string-id model in sync when the object-valued control is
    // patched externally (view-mode checkLabTest, RBS auto-selection).
    this.syncSelectedIdsFromControl();
    this.laboratoryListSubscription =
      this.laboratoryList.valueChanges.subscribe(() => {
        this.syncSelectedIdsFromControl();
      });
  }

  private syncSelectedIdsFromControl() {
    const selectedObjects = this.laboratoryList.value;
    const ids = Array.isArray(selectedObjects)
      ? selectedObjects.map((item: any) => String(item.procedureID))
      : [];
    // Assign a new reference only when the set actually changed, to avoid a
    // ngModel/valueChanges feedback loop.
    if (
      ids.length !== this.selectedLabIds.length ||
      ids.some(id => !this.selectedLabIds.includes(id))
    ) {
      this.selectedLabIds = ids;
    }
  }

  onLaboratorySelectionChange(selectedIds: string | string[]) {
    const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
    // Resolve the selected id strings back to the full procedure objects so
    // the form control keeps storing objects (its stored value type).
    const selectedObjects = (this.selectLabTest || []).filter((item: any) =>
      ids.includes(String(item.procedureID))
    );
    this.laboratoryList.setValue(selectedObjects);
    this.checkTestName(selectedObjects);
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

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(masterData => {
        if (masterData && masterData.procedures) {
          this.selectLabTest = masterData.procedures.filter((item: any) => {
            return item.procedureType === 'Laboratory';
          });

          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getInvestigation(benRegID, visitID);
          }
        }
      });
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.getInvestigationDetails)
      this.getInvestigationDetails.unsubscribe();
    if (this.rbsTestResultSubscription) {
      this.rbsTestResultSubscription.unsubscribe();
    }
    if (this.laboratoryListSubscription) {
      this.laboratoryListSubscription.unsubscribe();
    }
  }

  getInvestigationDetails: any;
  getInvestigation(benRegID: any, visitID: any) {
    this.getInvestigationDetails = this.doctorService
      .getVisitComplaintDetails(benRegID, visitID)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          const visitComplaintDetail = value.data;
          this.patientInvestigationDetails = value.data.Investigation;
          this.checkLabTest();
        }
      });
  }

  checkLabTest() {
    const formArray = this.patientInvestigationsForm.controls[
      'laboratoryList'
    ] as FormArray;
    const result = [];
    if (this.patientInvestigationDetails) {
      const temp = this.patientInvestigationDetails.laboratoryList;
      if (temp) {
        for (let i = 0; i < temp.length; i++) {
          const testType = this.selectLabTest.filter((item: any) => {
            return item.procedureID === temp[i].procedureID;
          });
          if (testType.length > 0) {
            result.push(testType[0]);
          }
        }
        const k = formArray;
        k.patchValue(result);

        temp.forEach((element: any) => {
          if (element.procedureName === environment.RBSTest) {
            this.nurseService.setRbsSelectedInInvestigation(true);
          }
        });
      }
    }
  }

  checkInvestigation(laboratoryList: any) {}

  get laboratoryList() {
    return this.patientInvestigationsForm.controls['laboratoryList'];
  }

  rbsTestValidation() {
    this.rbsTestResultSubscription =
      this.nurseService.rbsTestResultCurrent$.subscribe(response => {
        if (response !== undefined && response !== null) {
          this.RBSTestScore = response;
          this.RBStestDone = true;
          this.rbsTestResultCurrent = response;
        } else {
          this.rbsTestResultCurrent = null;
        }
      });
  }

  canDisable(test: any) {
    if (
      ((this.rbsTestResultCurrent !== null &&
        this.rbsTestResultCurrent !== undefined) ||
        this.nurseService.rbsTestResultFromDoctorFetch !== null) &&
      test.procedureName === environment.RBSTest
    ) {
      return true;
    }
    return false;
  }

  checkTestName(selectedTests: any) {
    console.log('testName', selectedTests);
    this.RBStestDone = false;
    const item = selectedTests;
    let oneSelected = 0;
    this.nurseService.setRbsSelectedInInvestigation(false);
    item.forEach((element: any) => {
      if (element.procedureName === environment.RBSTest) {
        this.RBStestDone = true;
        this.nurseService.setRbsSelectedInInvestigation(true);
        oneSelected++;
      }
    });
  }
}
