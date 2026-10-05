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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { PreviousDetailsComponent } from './previous-details.component';

describe('PreviousDetailsComponent', () => {
  let fixture: ComponentFixture<PreviousDetailsComponent>;
  let component: PreviousDetailsComponent;
  const rows = [
    { name: 'Paracetamol', dose: '500mg' },
    { name: 'Ibuprofen', dose: '200mg' },
  ];
  const columns = [
    { columnName: 'Name', keyName: 'name' },
    { columnName: 'Dose', keyName: 'dose' },
    { columnName: 'NoKey' },
  ];

  const create = async (dataList: any) => {
    await TestBed.configureTestingModule({
      declarations: [PreviousDetailsComponent],
      providers: [...commonTestProviders({ dialogData: { dataList } })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PreviousDetailsComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(PreviousDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('loads data and builds displayed columns from keyed columns', async () => {
    await create({ data: rows, columns });
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.dataList).toBe(rows);
    expect(component.filteredDataList.data).toEqual(rows);
    expect(component.filteredDataList.data).not.toBe(rows);
    expect(component.columnList).toBe(columns);
    expect(component.displayedColumns).toEqual(['sno', 'name', 'dose']);
  });

  it('ignores non-array data', async () => {
    await create({ data: 'oops', columns: [] });
    expect(component.dataList).toEqual([]);
    expect(component.filteredDataList.data).toEqual([]);
    expect(component.displayedColumns).toEqual(['sno']);
  });

  it('ignores null data', async () => {
    await create({ data: null, columns: [] });
    expect(component.dataList).toEqual([]);
  });

  it('throws when columns are missing (unguarded filter call)', async () => {
    await TestBed.configureTestingModule({
      declarations: [PreviousDetailsComponent],
      providers: [
        ...commonTestProviders({ dialogData: { dataList: { data: rows } } }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PreviousDetailsComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(PreviousDetailsComponent);
    component = fixture.componentInstance;
    expect(() => component.ngOnInit()).toThrowError(TypeError);
    expect(component.columnList).toEqual([]);
  });

  describe('filterPreviousData', () => {
    beforeEach(async () => create({ data: rows, columns }));

    it('restores all rows for empty term', () => {
      component.filteredDataList.data = [];
      component.filterPreviousData('');
      expect(component.filteredDataList.data).toBe(rows);
    });

    it('filters case-insensitively on any field', () => {
      component.filterPreviousData('IBU');
      expect(component.filteredDataList.data).toEqual([rows[1]]);
    });

    it('adds each matching row once', () => {
      component.filterPreviousData('mg');
      expect(component.filteredDataList.data).toEqual(rows);
    });

    it('returns empty when no match', () => {
      component.filterPreviousData('zzz');
      expect(component.filteredDataList.data).toEqual([]);
    });
  });

  it('closeDialog closes the dialog', async () => {
    await create({ data: rows, columns });
    component.closeDialog();
    expect((TestBed.inject(MatDialogRef) as any).close).toHaveBeenCalled();
  });

  it('ngDoCheck refreshes the language', async () => {
    await create({ data: rows, columns });
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
