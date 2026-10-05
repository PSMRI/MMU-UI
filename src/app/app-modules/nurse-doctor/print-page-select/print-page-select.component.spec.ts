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
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createHttpServiceMock,
} from 'src/testing/test-utils';
import { PrintPageSelectComponent } from './print-page-select.component';

describe('PrintPageSelectComponent', () => {
  let component: PrintPageSelectComponent;
  let fixture: ComponentFixture<PrintPageSelectComponent>;

  const dialogData = {
    visitCategory: 'ANC',
    printPagePreviewSelect: {
      caseSheetANC: false,
      caseSheetPNC: true,
      caseSheetHistory: false,
      caseSheetExamination: true,
      caseSheetCovidVaccinationDetails: false,
    },
  };

  const setup = async (data: any) => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatCheckboxModule],
      declarations: [PrintPageSelectComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PrintPageSelectComponent);
    component = fixture.componentInstance;
  };

  it('defaults every page to selected before init', () => {
    const c = new PrintPageSelectComponent(
      {} as MatDialogRef<PrintPageSelectComponent>,
      null,
      createHttpServiceMock() as any
    );
    expect(Object.values(c.printPagePreviewSelect).every(v => v)).toBeTrue();
  });

  it('copies visit category and page selection from dialog data and renders', async () => {
    await setup(dialogData);
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.visitCategory).toBe('ANC');
    expect(component.printPagePreviewSelect).toEqual(
      dialogData.printPagePreviewSelect
    );
    expect(component.printPagePreviewSelect).not.toBe(
      dialogData.printPagePreviewSelect
    );
    expect(
      fixture.nativeElement.querySelectorAll('mat-checkbox').length
    ).toBeGreaterThan(0);
  });

  it('keeps defaults when no dialog data is provided', async () => {
    await setup(null);
    component.ngOnInit();
    expect(component.visitCategory).toBeUndefined();
    expect(component.printPagePreviewSelect.caseSheetANC).toBeTrue();
    expect(component.printPagePreviewSelect.caseSheetHistory).toBeTrue();
  });

  it('ngDoCheck refreshes the language set', async () => {
    await setup(dialogData);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
