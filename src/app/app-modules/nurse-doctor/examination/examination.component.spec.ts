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

import { ExaminationComponent } from './examination.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('ExaminationComponent', () => {
  let component: ExaminationComponent;
  let fixture: ComponentFixture<ExaminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExaminationComponent);
    component = fixture.componentInstance;
    component.patientExaminationDataForm = new FormGroup({});
    component.examinationMode = 'add';
  });

  it('creates and loads the language set on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.languageComponent).toBeDefined();
  });

  it('refreshes the language set on ngDoCheck', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  ['General OPD', 'ANC', 'PNC'].forEach(cat => {
    it(`shows the general OPD examination for ${cat}`, () => {
      component.visitCategory = cat;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.showGeneralOPD).toBeTrue();
      expect(component.showCancer).toBeFalse();
      const el: HTMLElement = fixture.nativeElement;
      expect(
        el.querySelector('app-nurse-general-opd-examination')
      ).not.toBeNull();
      expect(el.querySelector('app-cancer-examination')).toBeNull();
    });
  });

  it('shows the cancer examination for Cancer Screening', () => {
    component.visitCategory = 'Cancer Screening';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.showGeneralOPD).toBeFalse();
    expect(component.showCancer).toBeTrue();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-cancer-examination')).not.toBeNull();
    expect(el.querySelector('app-nurse-general-opd-examination')).toBeNull();
  });

  it('hides both examinations for other categories', () => {
    component.visitCategory = 'NCD Screening';
    component.ngOnChanges();
    expect(component.showGeneralOPD).toBeFalse();
    expect(component.showCancer).toBeFalse();
  });

  it('leaves flags untouched when no visit category is set', () => {
    component.showGeneralOPD = true;
    component.showCancer = true;
    component.visitCategory = '';
    component.ngOnChanges();
    expect(component.showGeneralOPD).toBeTrue();
    expect(component.showCancer).toBeTrue();
  });
});
