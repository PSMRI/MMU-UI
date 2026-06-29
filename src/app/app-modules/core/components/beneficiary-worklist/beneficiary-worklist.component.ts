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
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideRefreshCw,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { cardImports } from 'Common-UI/v2/ui/card';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';

/** Object keys the standard beneficiary worklist filters against. */
export const STANDARD_WORKLIST_SEARCH_KEYS = [
  'beneficiaryID',
  'benName',
  'genderName',
  'age',
  'VisitCategory',
  'benVisitNo',
  'districtName',
  'preferredPhoneNum',
  'villageName',
  'beneficiaryRegID',
  'visitDate',
  'benVisitDate',
];

/**
 * Shared presentational shell for the role worklists (pharmacist, lab,
 * nurse, doctor, …). It owns the common chrome — search toolbar, z-card +
 * z-table, client-side filtering and pagination, and the empty state.
 *
 * For the standard beneficiary columns (used by pharmacist/lab/oncologist/
 * radiologist) it renders the default cells itself — a consumer only passes
 * `data` + `currentLanguageSet` and wires `rowClick`/`refresh`/`imageClick`.
 * Screens with extra/custom columns (nurse, doctor) override `rowTemplate`
 * (and `headers`/`footerStart`). Routing, services and per-role behaviour
 * stay in the role component.
 */
@Component({
  selector: 'app-beneficiary-worklist',
  templateUrl: './beneficiary-worklist.component.html',
  host: { class: 'block' },
  imports: [
    FormsModule,
    NgFor,
    NgIf,
    NgTemplateOutlet,
    TitleCasePipe,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...cardImports,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
    ...tooltipImports,
  ],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucideRefreshCw,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
})
export class BeneficiaryWorklistComponent implements OnChanges {
  /** Full (unfiltered) list of rows; the component filters + paginates it. */
  @Input() data: any[] = [];
  /** Language set; drives the default headers, labels and image tooltip. */
  @Input() currentLanguageSet: any = null;
  /** Override the default standard headers. */
  @Input() headers: string[] | null = null;
  /** Override the default search keys. */
  @Input() searchKeys: string[] | null = null;
  /** Override the default standard cells with a custom row (context: row, sno). */
  @Input() rowTemplate: TemplateRef<{ $implicit: any; sno: number }> | null =
    null;
  /** Optional left-aligned footer content (e.g. a status legend / total). */
  @Input() footerStart: TemplateRef<unknown> | null = null;
  /** Optional extra match for derived/computed columns (e.g. visit status). */
  @Input() extraSearch: ((item: any, term: string) => boolean) | null = null;

  /** Optional label overrides (otherwise derived from currentLanguageSet). */
  @Input() searchPlaceholder?: string;
  @Input() refreshLabel?: string;
  @Input() emptyLabel?: string;
  @Input() rowsPerPageLabel?: string;

  /** Emitted when a row is clicked or activated via keyboard. */
  @Output() rowClick = new EventEmitter<any>();
  /** Emitted when the refresh button is pressed. */
  @Output() refresh = new EventEmitter<void>();
  /** Emitted by the default image cell with the row's beneficiaryRegID. */
  @Output() imageClick = new EventEmitter<any>();

  filterTerm = '';
  filteredData: any[] = [];
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

  get effectiveHeaders(): string[] {
    if (this.headers?.length) return this.headers;
    const b = this.currentLanguageSet?.bendetails;
    const c = this.currentLanguageSet?.casesheet;
    return [
      c?.serialNo,
      b?.beneficiaryID,
      b?.beneficiaryName,
      b?.gender,
      b?.age,
      b?.visitCategory,
      b?.district,
      b?.phoneNo,
      b?.visitDate,
      b?.image,
    ];
  }

  get effectiveSearchKeys(): string[] {
    return this.searchKeys?.length
      ? this.searchKeys
      : STANDARD_WORKLIST_SEARCH_KEYS;
  }

  get searchLabel(): string {
    return (
      this.searchPlaceholder ??
      this.currentLanguageSet?.common?.inTableSearch ??
      'Search'
    );
  }

  get refreshText(): string {
    return (
      this.refreshLabel ?? this.currentLanguageSet?.common?.refresh ?? 'Refresh'
    );
  }

  get emptyText(): string {
    return (
      this.emptyLabel ??
      this.currentLanguageSet?.noRecordsFound ??
      'No Records Found'
    );
  }

  get rowsPerPageText(): string {
    return (
      this.rowsPerPageLabel ??
      this.currentLanguageSet?.common?.rowsPerPage ??
      'Rows per page'
    );
  }

  get imageTooltip(): string {
    return this.currentLanguageSet?.tc?.image ?? 'View image';
  }

  ngOnChanges(changes: SimpleChanges) {
    // Re-filter only when the underlying data changes, so header/template
    // input churn (re-evaluated on change detection) doesn't reset the page.
    if (changes['data']) {
      this.applyFilter(this.filterTerm);
    }
  }

  applyFilter(term: string) {
    this.filterTerm = term;
    const t = (term || '').toLowerCase().trim();
    let list = this.data ?? [];
    if (t) {
      const keys = this.effectiveSearchKeys;
      list = list.filter(
        item =>
          keys.some(key => ('' + item[key]).toLowerCase().includes(t)) ||
          (this.extraSearch ? this.extraSearch(item, t) : false)
      );
    }
    // Serial numbers are passed to the row via context / computed for the
    // default cells, never mutated onto the parent-owned row objects.
    this.filteredData = list;
    this.currentPage = 1;
  }

  /** 1-based serial number for the row at page-index `i`. */
  serial(i: number): number {
    return (this.currentPage - 1) * this.pageSize + i + 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
  }

  get pagedList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  /** A small window of page numbers around the current page (max 5). */
  get pageNumbers(): number[] {
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  changePageSize(size: string | string[]) {
    const value = Array.isArray(size) ? size[0] : size;
    this.pageSize = Number(value);
    this.currentPage = 1;
  }
}
