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
import { CancerHistoryCaseSheetComponent } from './cancer-history-case-sheet.component';

describe('CancerHistoryCaseSheetComponent', () => {
  let component: CancerHistoryCaseSheetComponent;
  let fixture: ComponentFixture<CancerHistoryCaseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerHistoryCaseSheetComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CancerHistoryCaseSheetComponent);
    component = fixture.componentInstance;
  });

  it('language helpers set current language', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.assignSelectedLanguage();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('maps beneficiary, family, merged personal and obstetric history', () => {
    const diet = { diet: 'veg' };
    component.caseSheetData = {
      BeneficiaryData: { name: 'b' },
      nurseData: {
        familyDiseaseHistory: ['f'],
        benPersonalDietHistory: diet,
        patientPersonalHistory: { tobacco: 'no' },
        patientObstetricHistory: { g: 1 },
      },
    };
    component.ngOnChanges();
    expect(component.beneficiaryDetails).toEqual({ name: 'b' });
    expect(component.familyDiseaseHistory).toEqual(['f']);
    expect(component.patientPersonalHistory).toEqual({
      diet: 'veg',
      tobacco: 'no',
    });
    expect(diet).toEqual({ diet: 'veg' });
    expect(component.patientObstetricHistory).toEqual({ g: 1 });
  });

  it('leaves fields unset for empty nurse data or no data', () => {
    component.caseSheetData = { nurseData: {} };
    component.ngOnChanges();
    expect(component.beneficiaryDetails).toBeUndefined();
    expect(component.familyDiseaseHistory).toBeUndefined();
    expect(component.patientPersonalHistory).toBeUndefined();
    expect(component.patientObstetricHistory).toBeUndefined();
    component.caseSheetData = null;
    expect(() => component.ngOnChanges()).not.toThrow();
  });
});
