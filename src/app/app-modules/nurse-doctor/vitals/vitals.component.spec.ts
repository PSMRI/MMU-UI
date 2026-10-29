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

import { VitalsComponent } from './vitals.component';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('VitalsComponent', () => {
  let component: VitalsComponent;
  let fixture: ComponentFixture<VitalsComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [VitalsComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(VitalsComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    component.patientVitalsDataForm = new FormGroup({});
    component.visitCategory = '';
    component.vitalsMode = '';
    component.pregnancyStatus = '';
    fixture.detectChanges();
  });

  it('creates with language set and no child rendered', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(
      component.languageComponent instanceof SetLanguageComponent
    ).toBeTrue();
    expect(component.showGeneralOPD).toBeFalse();
    expect(component.showCancer).toBeFalse();
    expect(el.querySelector('app-nurse-cancer-patient-vitals')).toBeNull();
    expect(el.querySelector('app-nurse-general-patient-vitals')).toBeNull();
  });

  it('ngOnInit and ngDoCheck fetch language', () => {
    spyOn(component, 'fetchLanguageResponse');
    component.ngOnInit();
    component.ngDoCheck();
    expect(component.fetchLanguageResponse).toHaveBeenCalledTimes(2);
  });

  it('shows cancer vitals for Cancer Screening', () => {
    component.visitCategory = 'Cancer Screening';
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.showCancer).toBeTrue();
    expect(component.showGeneralOPD).toBeFalse();
    expect(el.querySelector('app-nurse-cancer-patient-vitals')).not.toBeNull();
    expect(el.querySelector('app-nurse-general-patient-vitals')).toBeNull();
  });

  ['General OPD', 'ANC', 'PNC', 'NCD screening'].forEach(cat => {
    it(`shows general vitals for ${cat}`, () => {
      component.visitCategory = cat;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.showCancer).toBeFalse();
      expect(component.showGeneralOPD).toBeTrue();
      expect(
        el.querySelector('app-nurse-general-patient-vitals')
      ).not.toBeNull();
    });
  });

  it('leaves flags untouched when visitCategory is empty', () => {
    component.showCancer = true;
    component.visitCategory = '';
    component.ngOnChanges();
    expect(component.showCancer).toBeTrue();
    expect(component.showGeneralOPD).toBeFalse();
  });
});
