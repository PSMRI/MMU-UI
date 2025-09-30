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
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
  MasterdataService,
} from 'src/app/app-modules/nurse-doctor/shared/services';
import { GeneralUtils } from 'src/app/app-modules/nurse-doctor/shared/utility';
@Component({
  selector: 'app-ncd-screening-diagnosis',
  templateUrl: './ncd-screening-diagnosis.component.html',
  styleUrls: ['./ncd-screening-diagnosis.component.css'],
})
export class NcdScreeningDiagnosisComponent
  implements OnInit, OnChanges, DoCheck
{
  utils = new GeneralUtils(this.fb, this.sessionstorage);

  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  diagnosisSubscription: any;
  designation!: string;
  specialist!: boolean;
  doctorDiagnosis: any;
  current_language_set: any;
  enableProvisionalDiag!: boolean;
  suggestedDiagnosisList: any = [];
  private readonly PAGE_BASE = 0;
  pageSize: number | undefined = undefined;

  private readonly BOOTSTRAP_MAX_PAGES = 3; // when first page can't scroll, prefill up to this many extra pages

  loadingMore: boolean[] = [];
  noMore: boolean[] = [];
  wantMore: boolean[] = [];
  pageByIndex: number[] = [];
  lastQueryByIndex: string[] = [];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private masterdataService: MasterdataService
  ) {}

  ngOnInit() {
    console.log('caseRecordMode', this.caseRecordMode);
    console.log('doctorDiagnosis', this.doctorDiagnosis);
    this.nurseService.enableProvisionalDiag$.subscribe(response => {
      if (response) {
        this.enableProvisionalDiag = true;
      } else {
        this.enableProvisionalDiag = false;
      }
    });
  }
  get specialistDaignosis() {
    return this.generalDiagnosisForm.get('instruction');
  }

  get doctorDaignosis() {
    return this.generalDiagnosisForm.get('provisionalDiagnosis');
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  get provisionalDiagnosisControls(): AbstractControl[] {
    return (
      (this.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray)
        ?.controls || []
    );
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
  ngOnChanges() {
    if (String(this.caseRecordMode) === 'view') {
      const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
      const visitID = this.sessionstorage.getItem('visitID');
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
    }
  }

  getDiagnosisDetails(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    this.diagnosisSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res?.statusCode === 200 && res?.data?.diagnosis) {
          this.patchDiagnosisDetails(res.data.diagnosis);
        }
      });
  }

  patchDiagnosisDetails(diagnosis: any) {
    this.generalDiagnosisForm.patchValue(diagnosis);
    const generalArray = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;

    const previousArray = diagnosis.provisionalDiagnosisList;
    let j = 0;
    if (
      previousArray !== undefined &&
      previousArray !== null &&
      previousArray.length > 0
    ) {
      previousArray.forEach((i: any) => {
        generalArray.at(j).patchValue({
          conceptID: i.conceptID,
          term: i.term,
          provisionalDiagnosis: i.term,
          viewProvisionalDiagnosisProvided: i.term,
        });
        (<FormGroup>generalArray.at(j)).controls[
          'viewProvisionalDiagnosisProvided'
        ].disable();
        if (generalArray.length < previousArray.length) {
          this.addDiagnosis();
        }
        j++;
      });
    }
  }

  addDiagnosis() {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (diagnosisListForm.length < 30) {
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis
      );
    }
  }

  deleteDiagnosis(index: any, diagnosisList: AbstractControl<any, any>) {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (!diagnosisListForm.at(index).invalid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe(result => {
          if (result) {
            const diagnosisListForm = this.generalDiagnosisForm.controls[
              'provisionalDiagnosisList'
            ] as FormArray;
            if (diagnosisListForm.length > 1) {
              diagnosisListForm.removeAt(index);
            } else {
              diagnosisListForm.removeAt(index);
              diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
            }
          }
        });
    } else if (diagnosisListForm.length > 1) {
      diagnosisListForm.removeAt(index);
    } else {
      diagnosisListForm.removeAt(index);
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    }
  }

  checkProvisionalDiagnosisValidity(diagnosis: any) {
    const tempDiagnosis = diagnosis.value;
    if (tempDiagnosis.conceptID && tempDiagnosis.term) {
      return false;
    } else {
      return true;
    }
  }

  onDiagnosisInputKeyup(value: string, index: number) {
    const term = (value || '').trim();

    if (term.length >= 3) {
      if (this.lastQueryByIndex[index] !== term) {
        this.lastQueryByIndex[index] = term;
        this.pageByIndex[index] = 0; // logical 0th page
        this.noMore[index] = false;
        this.wantMore[index] = false;
        this.suggestedDiagnosisList[index] = [];
      }
      this.fetchPage(index, false);
    } else {
      this.lastQueryByIndex[index] = '';
      this.pageByIndex[index] = 0;
      this.noMore[index] = false;
      this.wantMore[index] = false;
      this.suggestedDiagnosisList[index] = [];
    }
  }

  displayDiagnosis(diagnosis: any): string {
    return typeof diagnosis === 'string' ? diagnosis : diagnosis?.term || '';
  }

  onDiagnosisSelected(selected: any, index: number) {
    // this.patientQuickConsultForm.get(['provisionalDiagnosisList', index])?.setValue(selected);
    const diagnosisFormArray = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    ) as FormArray;
    const diagnosisFormGroup = diagnosisFormArray.at(index) as FormGroup;

    // Set the nested and top-level fields
    diagnosisFormGroup.patchValue({
      viewProvisionalDiagnosisProvided: selected,
      conceptID: selected?.conceptID || null,
      term: selected?.term || null,
    });
  }

  onPanelReady(index: number, panelEl: HTMLElement) {
    if (panelEl.scrollHeight <= panelEl.clientHeight && !this.noMore[index]) {
      this.bootstrapUntilScrollable(index, panelEl);
    }
  }

  onAutoNearEnd(index: number) {
    if (!this.loadingMore[index] && !this.noMore[index]) {
      this.fetchPage(index, true);
    } else if (this.loadingMore[index]) {
      this.wantMore[index] = true;
    }
  }

  private bootstrapUntilScrollable(rowIndex: number, panelEl: HTMLElement) {
    let fetched = 0;

    const tryFill = () => {
      const scrollable = panelEl.scrollHeight > panelEl.clientHeight;
      if (
        scrollable ||
        this.noMore[rowIndex] ||
        fetched >= this.BOOTSTRAP_MAX_PAGES
      )
        return;

      if (this.loadingMore[rowIndex]) {
        requestAnimationFrame(tryFill);
        return;
      }

      fetched++;
      this.fetchPage(rowIndex, true);

      requestAnimationFrame(tryFill);
    };

    if (this.lastQueryByIndex[rowIndex]?.length >= 3) {
      tryFill();
    }
  }

  private fetchPage(index: number, append = false) {
    const term = this.lastQueryByIndex[index];
    if (!term) return;

    const nextLogical = (this.pageByIndex[index] ?? 0) + (append ? 1 : 0);
    const pageAtReq = nextLogical + this.PAGE_BASE;

    if (this.loadingMore[index]) return;
    this.loadingMore[index] = true;

    const termAtReq = term;

    this.masterdataService
      .searchDiagnosisBasedOnPageNo(termAtReq, pageAtReq)
      .subscribe({
        next: (results: any) => {
          if (this.lastQueryByIndex[index] !== termAtReq) return;

          const list = results?.data?.sctMaster ?? [];

          if (append) {
            const existing = new Set(
              (this.suggestedDiagnosisList[index] ?? []).map(
                (d: any) => d.id ?? d.code ?? d.term
              )
            );
            this.suggestedDiagnosisList[index] = [
              ...(this.suggestedDiagnosisList[index] ?? []),
              ...list.filter(
                (d: any) => !existing.has(d.id ?? d.code ?? d.term)
              ),
            ];
          } else {
            this.suggestedDiagnosisList[index] = list;
          }

          this.pageByIndex[index] = nextLogical;
          if (!list.length) {
            this.noMore[index] = true;
          }
        },
        error: () => {
          console.error('Error fetching diagnosis data');
        },
        complete: () => {
          const wantChain = this.wantMore[index] && !this.noMore[index];
          this.loadingMore[index] = false;
          this.wantMore[index] = false;

          if (wantChain) this.fetchPage(index, true);
        },
      });
  }
}
