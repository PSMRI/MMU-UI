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
import { FormBuilder, FormGroup } from '@angular/forms';

import { ObstetricExaminationComponent } from './obstetric-examination.component';
import { MaterialModule } from '../../../../../core/material.module';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('ObstetricExaminationComponent', () => {
  let component: ObstetricExaminationComponent;
  let fixture: ComponentFixture<ObstetricExaminationComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ObstetricExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ObstetricExaminationComponent);
    component = fixture.componentInstance;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createObstetricExaminationForANCForm();
    component.obstetricExaminationForANCDataForm = form;
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  it('creates and loads language', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.selectFundalHeight.length).toBe(9);
    expect(component.selectFetalHeartRate.map(o => o.name)).toEqual([
      '<120',
      '120-160',
      '>160',
    ]);
  });

  it('shows fetal heart rate only when heart sounds are Audible', () => {
    const el: HTMLElement = fixture.nativeElement;
    const sel = '[formControlName="fetalHeartRate_BeatsPerMinute"]';
    expect(el.querySelector(sel)).toBeNull();
    form.patchValue({ fetalHeartSounds: 'Audible' });
    fixture.detectChanges();
    expect(el.querySelector(sel)).not.toBeNull();
  });

  it('resetFetalHeartRate clears the rate when Not Audible', () => {
    form.patchValue({ fetalHeartRate_BeatsPerMinute: '>160' });
    component.resetFetalHeartRate({ value: 'Not Audible' });
    expect(form.value.fetalHeartRate_BeatsPerMinute).toBeNull();
  });

  it('resetFetalHeartRate keeps the rate when Audible', () => {
    form.patchValue({ fetalHeartRate_BeatsPerMinute: '>160' });
    component.resetFetalHeartRate({ value: 'Audible' });
    expect(form.value.fetalHeartRate_BeatsPerMinute).toBe('>160');
  });

  it('getters return control values', () => {
    form.patchValue({ fetalHeartSounds: 'Audible', sfh: 24 });
    expect(component.fetalHeartSounds).toBe('Audible');
    expect(component.SFH).toBe(24);
    expect(console.log).toHaveBeenCalledWith('sfh');
  });

  it('binds the sfh input to the form', () => {
    const input = fixture.nativeElement.querySelector(
      '[formControlName="sfh"]'
    ) as HTMLInputElement;
    input.value = '30';
    input.dispatchEvent(new Event('input'));
    expect(String(form.value.sfh)).toBe('30');
  });
});
