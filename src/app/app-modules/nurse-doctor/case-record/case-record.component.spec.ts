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
import { CaseRecordComponent } from './case-record.component';

describe('CaseRecordComponent', () => {
  let component: CaseRecordComponent;
  let fixture: ComponentFixture<CaseRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CaseRecordComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CaseRecordComponent);
    component = fixture.componentInstance;
    component.patientCaseRecordForm = new FormGroup({});
  });

  afterEach(() => fixture.destroy());

  const render = (cat: any) => {
    component.visitCategory = cat;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    return {
      general: el.querySelector('app-general-case-record'),
      cancer: el.querySelector('app-cancer-case-record'),
    };
  };

  [
    'General OPD',
    'ANC',
    'NCD care',
    'PNC',
    'COVID-19 Screening',
    'NCD screening',
  ].forEach(cat => {
    it(`shows general case record for "${cat}"`, () => {
      const r = render(cat);
      expect(component.showGeneralOPD).toBeTrue();
      expect(component.showCancer).toBeFalse();
      expect(r.general).not.toBeNull();
      expect(r.cancer).toBeNull();
    });
  });

  it('shows cancer case record for Cancer Screening', () => {
    const r = render('Cancer Screening');
    expect(component.showCancer).toBeTrue();
    expect(component.showGeneralOPD).toBeFalse();
    expect(r.cancer).not.toBeNull();
    expect(r.general).toBeNull();
  });

  it('shows nothing for other categories', () => {
    const r = render('FP & Contraceptive Services');
    expect(component.showCancer).toBeFalse();
    expect(component.showGeneralOPD).toBeFalse();
    expect(r.general).toBeNull();
    expect(r.cancer).toBeNull();
  });

  it('shows nothing when visit category is missing', () => {
    const r = render(undefined);
    expect(component.showGeneralOPD).toBeFalse();
    expect(r.general).toBeNull();
  });
});
