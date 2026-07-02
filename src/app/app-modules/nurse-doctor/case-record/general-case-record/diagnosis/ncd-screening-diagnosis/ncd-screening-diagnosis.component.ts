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
  OnChanges,
  DoCheck,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  DoctorService,
  NurseService,
  MasterdataService,
} from 'src/app/app-modules/nurse-doctor/shared/services';
import { GeneralUtils } from 'src/app/app-modules/nurse-doctor/shared/utility';
import { NgIf, NgFor } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideCheck,
  lucidePlus,
  lucideX,
} from '@ng-icons/lucide';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
@Component({
  selector: 'app-ncd-screening-diagnosis',
  templateUrl: './ncd-screening-diagnosis.component.html',
  viewProviders: [
    provideIcons({ lucideSearch, lucideCheck, lucidePlus, lucideX }),
  ],
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    NgIcon,
    ...ZardFormImports,
    ZardInputDirective,
    ZardButtonComponent,
    ...tooltipImports,
  ],
})
export class NcdScreeningDiagnosisComponent
  implements OnInit, OnChanges, DoCheck, AfterViewInit
{
  utils = new GeneralUtils(this.fb, this.sessionstorage);

  @ViewChildren('diagnosisInput')
  diagnosisInputs!: QueryList<ElementRef<HTMLInputElement>>;

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

  // Inline combobox panel state (replaces the mat-autocomplete overlay).
  openIndex: number | null = null;
  activeIndex: number[] = [];
  private readonly NEAR_END_THRESHOLD = 0.6; // matches AutocompleteScrollerDirective

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
    this.syncInputDisplay();
  }

  ngAfterViewInit() {
    this.syncInputDisplay();
    // Re-sync when rows are added/removed so text follows the FormArray.
    this.diagnosisInputs.changes.subscribe(() => this.syncInputDisplay());
  }

  /**
   * Reflects each row's committed diagnosis (the FormControl value) into its
   * input's visible text — the decoupled display mat-autocomplete gave us via
   * [displayWith]. Skips the input the user is actively typing in so it stays
   * uncontrolled while editing, and never mutates the stored (object) value.
   */
  private syncInputDisplay() {
    if (!this.diagnosisInputs) return;
    const list = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    ) as FormArray;
    this.diagnosisInputs.forEach((ref, i) => {
      const el = ref.nativeElement;
      if (document.activeElement === el) return;
      const value = list?.at(i)?.get('viewProvisionalDiagnosisProvided')?.value;
      const text = this.displayDiagnosis(value);
      if (el.value !== text) {
        el.value = text;
      }
    });
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

    while (generalArray.length < previousArray.length) {
      generalArray.push(this.utils.initProvisionalDiagnosisList());
    }
    for (let i = 0; i < previousArray.length; i++) {
      generalArray.at(i).patchValue({
        viewProvisionalDiagnosisProvided: previousArray[i].term,
        term: previousArray[i].term,
        conceptID: previousArray[i].conceptID,
        provisionalDiagnosis: previousArray[i].term, // <-- Add this line
      });
      generalArray.at(i).get('viewProvisionalDiagnosisProvided')?.disable();
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

  // ---- Inline combobox panel adapters (replace mat-autocomplete overlay) ----

  // True when the panel has something to show (options or a status row).
  hasPanelContent(index: number): boolean {
    return (
      (this.suggestedDiagnosisList[index]?.length ?? 0) > 0 ||
      !!this.loadingMore[index] ||
      !!this.noMore[index]
    );
  }

  // Highlights the same option mat-autocomplete's displayWith would show.
  isDiagnosisSelected(diag: any, index: number): boolean {
    const selected = this.generalDiagnosisForm.get('provisionalDiagnosisList')
      ?.value?.[index];
    return (
      !!diag &&
      !!selected &&
      (diag.conceptID ?? null) === (selected.conceptID ?? null) &&
      (diag.term ?? null) === (selected.term ?? null)
    );
  }

  openPanel(index: number) {
    this.openIndex = index;
    this.activeIndex[index] = this.suggestedDiagnosisList[index]?.length
      ? 0
      : -1;
    // Mirror the directive's panelReady bootstrap once the panel is live.
    setTimeout(() => {
      const panelEl = document.getElementById(`diagnosis-listbox-${index}`);
      if (panelEl) {
        this.onPanelReady(index, panelEl);
      }
    });
  }

  closePanelDeferred(index: number) {
    // Defer so an option's mousedown selection commits before we close.
    setTimeout(() => {
      if (this.openIndex === index) {
        this.openIndex = null;
      }
    }, 150);
  }

  onOptionMousedown(event: Event, diag: any, index: number) {
    // mousedown (not click) so selection commits before the input's blur.
    event.preventDefault();
    this.onDiagnosisSelected(diag, index);
    this.writeRowDisplay(index);
    this.openIndex = null;
  }

  // Writes the committed term into a specific row's input, even while focused
  // (syncInputDisplay skips the focused input to protect in-progress typing).
  private writeRowDisplay(index: number) {
    const ref = this.diagnosisInputs?.get(index);
    const list = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList'
    ) as FormArray;
    const value = list
      ?.at(index)
      ?.get('viewProvisionalDiagnosisProvided')?.value;
    if (ref) {
      ref.nativeElement.value = this.displayDiagnosis(value);
    }
  }

  onInputKeydown(event: KeyboardEvent, index: number) {
    const options = this.suggestedDiagnosisList[index] ?? [];
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.openIndex !== index) {
          this.openPanel(index);
          return;
        }
        if (options.length) {
          this.activeIndex[index] =
            ((this.activeIndex[index] ?? -1) + 1) % options.length;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.openIndex !== index) {
          this.openPanel(index);
          return;
        }
        if (options.length) {
          this.activeIndex[index] =
            ((this.activeIndex[index] ?? 0) - 1 + options.length) %
            options.length;
        }
        break;
      case 'Enter': {
        const active = this.activeIndex[index] ?? -1;
        if (
          this.openIndex === index &&
          active >= 0 &&
          active < options.length
        ) {
          event.preventDefault();
          this.onDiagnosisSelected(options[active], index);
          this.writeRowDisplay(index);
          this.openIndex = null;
        }
        break;
      }
      case 'Escape':
        if (this.openIndex === index) {
          event.preventDefault();
          this.openIndex = null;
        }
        break;
    }
  }

  // Replaces AutocompleteScrollerDirective: fire nearEnd at the threshold.
  onPanelScroll(event: Event, index: number) {
    const panelEl = event.target as HTMLElement;
    if (panelEl.scrollHeight <= panelEl.clientHeight) return;
    const ratio =
      (panelEl.scrollTop + panelEl.clientHeight) / panelEl.scrollHeight;
    if (ratio >= this.NEAR_END_THRESHOLD) {
      this.onAutoNearEnd(index);
    }
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
