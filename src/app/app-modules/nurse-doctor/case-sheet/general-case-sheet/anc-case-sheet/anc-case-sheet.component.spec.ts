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
import { AncCaseSheetComponent } from './anc-case-sheet.component';

describe('AncCaseSheetComponent', () => {
  let component: AncCaseSheetComponent;
  let fixture: ComponentFixture<AncCaseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncCaseSheetComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AncCaseSheetComponent);
    component = fixture.componentInstance;
  });

  it('ngOnInit and ngDoCheck set language', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('maps ANC care details and immunization', () => {
    component.caseSheetData = {
      nurseData: {
        anc: { ANCCareDetail: { lmp: 1 }, ANCWomenVaccineDetails: [{ v: 1 }] },
      },
    };
    component.ngOnChanges();
    expect(component.aNCDetailsAndFormula).toEqual({ lmp: 1 });
    expect(component.aNCImmunization).toEqual([{ v: 1 }]);
  });

  it('ignores data without ANC', () => {
    component.caseSheetData = { nurseData: {} };
    component.ngOnChanges();
    expect(component.aNCDetailsAndFormula).toBeUndefined();
  });
});
