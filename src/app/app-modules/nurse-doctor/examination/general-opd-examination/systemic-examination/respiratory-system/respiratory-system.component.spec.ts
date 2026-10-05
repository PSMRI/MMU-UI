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

import { RespiratorySystemComponent } from './respiratory-system.component';
import { MaterialModule } from '../../../../../core/material.module';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('RespiratorySystemComponent', () => {
  let component: RespiratorySystemComponent;
  let fixture: ComponentFixture<RespiratorySystemComponent>;
  let tracking: any;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [RespiratorySystemComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RespiratorySystemComponent);
    component = fixture.componentInstance;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createRespiratorySystemForm();
    component.respiratorySystemDataForm = form;
    fixture.detectChanges();
  });

  it('creates and loads the language set', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('refreshes the language set on ngDoCheck', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('binds the palpation input to the form', () => {
    const input = fixture.nativeElement.querySelector(
      '[formControlName="palpation"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = 'observed';
    input.dispatchEvent(new Event('input'));
    expect(form.value.palpation).toBe('observed');
  });

  it('exposes the selectPercussion options', () => {
    expect(component.selectPercussion.map(o => o.name)).toEqual([
      'Dull',
      'Stony Dull',
      'Resonant',
      'Hyper Resonant',
    ]);
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    component.trackFieldInteraction('Field');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Field',
      'Respiratory System Examination'
    );
  });
});
