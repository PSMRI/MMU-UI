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
import { CancerExaminationCaseSheetComponent } from './cancer-examination-case-sheet.component';

describe('CancerExaminationCaseSheetComponent', () => {
  let component: CancerExaminationCaseSheetComponent;
  let fixture: ComponentFixture<CancerExaminationCaseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerExaminationCaseSheetComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CancerExaminationCaseSheetComponent);
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

  it('maps nurse examination data, image annotations and formats revisit date', () => {
    component.caseSheetData = {
      BeneficiaryData: { name: 'b' },
      nurseData: {
        signsAndSymptoms: 's',
        BenCancerLymphNodeDetails: 'l',
        oralExamination: 'o',
        breastExamination: 'br',
        abdominalExamination: 'a',
        gynecologicalExamination: 'g',
      },
      ImageAnnotatedData: [{ imageID: 1 }, { imageID: 2, markers: [] }],
      doctorData: { diagnosis: { revisitDate: '2024-07-08T00:00:00' } },
    };
    component.ngOnChanges();
    const t = new Date();
    expect(component.date).toBe(
      t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear()
    );
    expect(component.beneficiaryDetails).toEqual({ name: 'b' });
    expect(component.signsAndSymptoms).toBe('s');
    expect(component.BenCancerLymphNodeDetails).toBe('l');
    expect(component.oralExamination).toBe('o');
    expect(component.breastExamination).toBe('br');
    expect(component.abdominalExamination).toBe('a');
    expect(component.gynecologicalExamination).toBe('g');
    expect(component.diagnosisdetails.revisitDate).toBe('08/07/2024');
    expect(component.getImageAnnotation(2)).toEqual({
      imageID: 2,
      markers: [],
    });
    expect(component.getImageAnnotation(9)).toBeNull();
  });

  it('keeps valid or missing revisit dates; no data sets only date', () => {
    component.caseSheetData = {
      nurseData: {},
      doctorData: { diagnosis: { revisitDate: '01/02/2024' } },
    };
    component.ngOnChanges();
    expect(component.beneficiaryDetails).toBeUndefined();
    expect(component.diagnosisdetails.revisitDate).toBe('01/02/2024');

    component.caseSheetData = { nurseData: {}, doctorData: { diagnosis: {} } };
    component.ngOnChanges();
    expect(component.diagnosisdetails).toEqual({});

    component.caseSheetData = null;
    component.diagnosisdetails = 'prev';
    component.ngOnChanges();
    expect(component.diagnosisdetails).toBe('prev');
    expect(component.date).toBeDefined();
  });

  it('padLeft pads single digits', () => {
    expect(String(component.padLeft.apply(4 as any))).toBe('04');
  });
});
