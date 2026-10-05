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
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { PncCaseSheetComponent } from './pnc-case-sheet.component';

describe('PncCaseSheetComponent', () => {
  let component: PncCaseSheetComponent;
  let fixture: ComponentFixture<PncCaseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PncCaseSheetComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PncCaseSheetComponent);
    component = fixture.componentInstance;
  });

  it('ngOnInit and ngDoCheck set language', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('maps PNC care details', () => {
    component.caseSheetData = {
      nurseData: { pnc: { PNCCareDetail: { d: 1 } } },
    };
    component.ngOnChanges();
    expect(component.pNCCaseSheetData).toEqual({ d: 1 });
  });

  it('ignores data without PNC', () => {
    component.caseSheetData = {};
    component.ngOnChanges();
    expect(component.pNCCaseSheetData).toBeUndefined();
  });
});
