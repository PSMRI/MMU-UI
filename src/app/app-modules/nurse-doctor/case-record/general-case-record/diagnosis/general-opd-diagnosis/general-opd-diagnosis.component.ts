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

import { Component, Input, OnChanges, DoCheck } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgFor, NgIf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideX } from '@ng-icons/lucide';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
@Component({
  selector: 'app-general-opd-diagnosis',
  templateUrl: './general-opd-diagnosis.component.html',
  viewProviders: [provideIcons({ lucidePlus, lucideX })],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    NgIf,
    NgIcon,
    ...cardImports,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...tooltipImports,
  ],
})
export class GeneralOpdDiagnosisComponent implements OnChanges, DoCheck {
  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;
  utils = new GeneralUtils(this.fb, this.sessionstorage);
  diagnosisSubscription: any;
  current_language_set: any;
  suggestedDiagnosisList: any = [];
  private readonly PAGE_BASE = 0;
  pageSize: number | undefined = undefined;

  private readonly BOOTSTRAP_MAX_PAGES = 3; // when first page can't scroll, prefill up to this many extra pages

  loadingMore: boolean[] = [];
  noMore: boolean[] = [];
  wantMore: boolean[] = [];
  pageByIndex: number[] = [];
  lastQueryByIndex: string[] = [];

  // Index of the diagnosis row whose suggestion panel is currently open.
  openDiagnosisIndex: number | null = null;

  // Per-row display text for the diagnosis autocomplete input. Decoupled from
  // the FormArray control (which keeps its original object/string value) so the
  // input shows the diagnosis term, mirroring the old mat-autocomplete
  // [displayWith] behaviour without changing the stored value type.
  diagnosisDisplay: string[] = [];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private masterdataService: MasterdataService
  ) {}

  ngOnChanges() {
    if (String(this.caseRecordMode) === 'view') {
      const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
      const visitID = this.sessionstorage.getItem('visitID');
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      this.getDiagnosisDetails(beneficiaryRegID, visitID, visitCategory);
    }
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
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

  get provisionalDiagnosisControls(): AbstractControl[] {
    return (
      (this.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray)
        ?.controls || []
    );
  }

  patchDiagnosisDetails(diagnosis: any) {
    this.generalDiagnosisForm.patchValue(diagnosis);
    const diagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;

    const previousArray = diagnosis.provisionalDiagnosisList;

    while (diagnosisArrayList.length < previousArray.length) {
      diagnosisArrayList.push(this.utils.initProvisionalDiagnosisList());
    }
    for (let i = 0; i < previousArray.length; i++) {
      diagnosisArrayList.at(i).patchValue({
        viewProvisionalDiagnosisProvided: previousArray[i].term,
        term: previousArray[i].term,
        conceptID: previousArray[i].conceptID,
        provisionalDiagnosis: previousArray[i].term, // <-- Add this line
      });
      // Seed the decoupled display text for view mode.
      this.diagnosisDisplay[i] = previousArray[i].term;
      diagnosisArrayList
        .at(i)
        .get('viewProvisionalDiagnosisProvided')
        ?.disable();
    }
  }

  addDiagnosis() {
    const diagnosisListFormArray = <FormArray>(
      this.generalDiagnosisForm.controls['provisionalDiagnosisList']
    );
    if (diagnosisListFormArray.length < 30) {
      diagnosisListFormArray.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis
      );
    }
  }

  deleteDiagnosis(index: any, diagnosisList?: AbstractControl<any, any>) {
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
              this.diagnosisDisplay.splice(index, 1);
            } else {
              diagnosisListForm.removeAt(index);
              diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
              this.diagnosisDisplay = [''];
            }
          }
        });
    } else if (diagnosisListForm.length > 1) {
      diagnosisListForm.removeAt(index);
      this.diagnosisDisplay.splice(index, 1);
    } else {
      diagnosisListForm.removeAt(index);
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
      this.diagnosisDisplay = [''];
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

  // Close the suggestion panel after a click on an option has had a chance to
  // commit (mousedown fires before blur).
  onDiagnosisBlur(index: number): void {
    setTimeout(() => {
      if (this.openDiagnosisIndex === index) {
        this.openDiagnosisIndex = null;
      }
    });
  }

  // Native-scroll adapter replacing appAutocompleteScroller's (nearEnd): when
  // the suggestion panel is scrolled near its bottom, fetch the next page.
  onDiagnosisPanelScroll(index: number, panelEl: HTMLElement): void {
    const nearEnd =
      panelEl.scrollTop + panelEl.clientHeight >= panelEl.scrollHeight - 24;
    if (nearEnd) {
      this.onAutoNearEnd(index);
    }
  }

  onDiagnosisSelected(selected: any, index: number) {
    // this.patientQuickConsultForm.get(['provisionalDiagnosisList', index])?.setValue(selected);
    const diagnosisFormArray = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    ) as FormArray;
    const diagnosisFormGroup = diagnosisFormArray.at(index) as FormGroup;

    // Set the nested and top-level fields
    diagnosisFormGroup.patchValue({
      provisionalDiagnosis: selected?.term || null,
      viewProvisionalDiagnosisProvided: selected?.term || null,
      conceptID: selected?.conceptID || null,
      term: selected?.term || null,
    });

    // Keep the visible input text in sync (mirrors old [displayWith]).
    this.diagnosisDisplay[index] = this.displayDiagnosis(selected);
    this.openDiagnosisIndex = null;
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
