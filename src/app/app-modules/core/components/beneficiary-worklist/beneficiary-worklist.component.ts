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
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
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

/**
 * Shared presentational shell for the role worklists (pharmacist, lab,
 * nurse, doctor, …). It owns the common chrome — search toolbar, z-card +
 * z-table, client-side filtering and pagination, and the empty state — so
 * each role's worklist is a thin wrapper that supplies its columns, data,
 * row cells and click handler. Routing, services and per-role behaviour
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
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...cardImports,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...ZardSelectImports,
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
  /** Column header labels (also drives the empty-row colspan). */
  @Input() headers: string[] = [];
  /** Object keys the search box filters on. */
  @Input() searchKeys: string[] = [];
  /** Renders the <td> cells for one row; context `$implicit` is the row. */
  @Input() rowTemplate!: TemplateRef<{ $implicit: any }>;
  /** Optional left-aligned footer content (e.g. a status legend / total). */
  @Input() footerStart: TemplateRef<unknown> | null = null;
  /** Optional extra match for derived/computed columns (e.g. visit status). */
  @Input() extraSearch: ((item: any, term: string) => boolean) | null = null;

  @Input() searchPlaceholder = 'Search';
  @Input() refreshLabel = 'Refresh';
  @Input() emptyLabel = 'No Records Found';
  @Input() rowsPerPageLabel = 'Rows per page';

  /** Emitted when a row is clicked or activated via keyboard. */
  @Output() rowClick = new EventEmitter<any>();
  /** Emitted when the refresh button is pressed. */
  @Output() refresh = new EventEmitter<void>();

  filterTerm = '';
  filteredData: any[] = [];
  pageSizeOptions = [5, 10, 20];
  pageSize = 5;
  currentPage = 1;

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
      list = list.filter(
        item =>
          this.searchKeys.some(key =>
            ('' + item[key]).toLowerCase().includes(t)
          ) || (this.extraSearch ? this.extraSearch(item, t) : false)
      );
    }
    list.forEach((item, index) => (item.sno = index + 1));
    this.filteredData = list;
    this.currentPage = 1;
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
