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
import { FormGroup } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from 'src/testing/test-utils';
import { DiagnosisComponent } from './diagnosis.component';

describe('DiagnosisComponent', () => {
  let component: DiagnosisComponent;
  let fixture: ComponentFixture<DiagnosisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiagnosisComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DiagnosisComponent);
    component = fixture.componentInstance;
    component.generalDiagnosisForm = new FormGroup({});
    component.caseRecordMode = 'new';
  });

  afterEach(() => fixture.destroy());

  const selectors = [
    'app-general-opd-diagnosis',
    'app-anc-diagnosis',
    'app-pnc-diagnosis',
    'app-ncd-care-diagnosis',
    'app-covid-diagnosis',
    'app-ncd-screening-diagnosis',
  ];
  const rendered = () =>
    selectors.filter(s => fixture.nativeElement.querySelector(s));

  [
    ['General OPD', 'app-general-opd-diagnosis'],
    ['ANC', 'app-anc-diagnosis'],
    ['PNC', 'app-pnc-diagnosis'],
    ['NCD care', 'app-ncd-care-diagnosis'],
    ['COVID-19 Screening', 'app-covid-diagnosis'],
    ['NCD screening', 'app-ncd-screening-diagnosis'],
  ].forEach(([cat, sel]) => {
    it(`renders only ${sel} for ${cat}`, () => {
      component.visitCategory = cat;
      fixture.detectChanges();
      expect(rendered()).toEqual([sel]);
    });
  });

  it('renders no diagnosis for unknown category', () => {
    component.visitCategory = 'Cancer Screening';
    fixture.detectChanges();
    expect(rendered()).toEqual([]);
  });
});
