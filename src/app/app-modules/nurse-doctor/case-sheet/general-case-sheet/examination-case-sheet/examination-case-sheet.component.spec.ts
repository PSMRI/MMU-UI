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
import { ExaminationCaseSheetComponent } from './examination-case-sheet.component';

describe('ExaminationCaseSheetComponent', () => {
  let component: ExaminationCaseSheetComponent;
  let fixture: ComponentFixture<ExaminationCaseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ExaminationCaseSheetComponent],
      providers: [
        ...commonTestProviders({
          session: {
            caseSheetVisitCategory: 'General OPD',
            beneficiaryRegID: '5',
            visitID: '6',
          },
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ExaminationCaseSheetComponent);
    component = fixture.componentInstance;
    spyOn(console, 'log');
  });

  it('ngOnInit reads language and session values', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.visitCategory).toBe('General OPD');
    expect(component.beneficiaryRegID).toBe('5');
    expect(component.visitID).toBe('6');
  });

  it('maps every examination section', () => {
    component.caseSheetData = {
      nurseData: {
        examination: {
          generalExamination: 'g',
          headToToeExamination: 'h',
          cardiovascularExamination: 'c',
          respiratoryExamination: 'r',
          centralNervousExamination: 'cn',
          musculoskeletalExamination: 'm',
          genitourinaryExamination: 'gu',
          obstetricExamination: 'o',
          gastrointestinalExamination: 'gi',
        },
      },
    };
    component.ngOnChanges();
    expect(component.generalExamination).toBe('g');
    expect(component.headToToeExamination).toBe('h');
    expect(component.cardioVascularExamination).toBe('c');
    expect(component.respiratorySystemExamination).toBe('r');
    expect(component.centralNervousSystemExamination).toBe('cn');
    expect(component.musculoskeletalSystemExamination).toBe('m');
    expect(component.genitoUrinarySystemExamination).toBe('gu');
    expect(component.obstetricExamination).toBe('o');
    expect(component.gastroIntestinalExamination).toBe('gi');
    expect(component.referDetails).toBeUndefined();
  });

  it('leaves sections undefined for empty examination', () => {
    component.caseSheetData = { nurseData: { examination: {} } };
    component.ngOnChanges();
    expect(component.generalExamination).toBeUndefined();
    expect(component.gastroIntestinalExamination).toBeUndefined();
  });

  it('builds refer service list skipping empty names', () => {
    component.caseSheetData = {
      doctorData: {
        Refer: {
          refrredToAdditionalServiceList: [
            { serviceName: 'X' },
            { serviceName: '' },
            { serviceName: 'Y' },
          ],
        },
      },
    };
    component.ngOnChanges();
    expect(component.serviceList).toBe('X,Y');
  });

  it('handles doctor data without Refer and no data at all', () => {
    component.caseSheetData = { doctorData: {} };
    component.ngOnChanges();
    expect(component.referDetails).toBeUndefined();
    expect(component.serviceList).toBe('');
    component.caseSheetData = undefined;
    expect(() => component.ngOnChanges()).not.toThrow();
  });

  it('ngDoCheck refreshes language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
