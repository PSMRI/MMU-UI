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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ViewRadiologyUploadedFilesComponent } from './view-radiology-uploaded-files.component';

describe('ViewRadiologyUploadedFilesComponent', () => {
  let fixture: ComponentFixture<ViewRadiologyUploadedFilesComponent>;
  let component: ViewRadiologyUploadedFilesComponent;

  const create = async (data: any) => {
    await TestBed.configureTestingModule({
      declarations: [ViewRadiologyUploadedFilesComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideProvider(MAT_DIALOG_DATA, { useValue: data })
      .compileComponents();
    fixture = TestBed.createComponent(ViewRadiologyUploadedFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('lists the files passed in and closes with the clicked file', async () => {
    const files = [
      { fileName: 'xray.png', id: 1 },
      { fileName: 'scan.pdf', id: 2 },
    ];
    await create({ filesDetails: files });
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.fileIds).toEqual(files as any);
    const rows = fixture.nativeElement.querySelectorAll('tr.list-style');
    expect(rows.length).toBe(2);
    expect(rows[1].textContent).toContain('scan.pdf');
    (rows[1].querySelectorAll('td')[1] as HTMLElement).click();
    const ref: any = TestBed.inject(MatDialogRef);
    expect(ref.close).toHaveBeenCalledWith(files[1]);
  });

  it('shows no-records message when first file id is null', async () => {
    await create({ filesDetails: [null] });
    expect(fixture.nativeElement.querySelector('tr.list-style')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      LANGUAGE_EN.noRecordsFound
    );
  });

  it('keeps empty file list when no filesDetails are provided', async () => {
    await create({});
    expect(component.fileIds).toEqual([]);
  });

  it('tolerates null dialog input', async () => {
    await create(null);
    expect(component.fileIds).toEqual([]);
  });

  it('getFilesDetails assigns directly', async () => {
    await create({});
    component.getFilesDetails([{ fileName: 'a' }]);
    expect(component.fileIds).toEqual([{ fileName: 'a' }] as any);
  });
});
