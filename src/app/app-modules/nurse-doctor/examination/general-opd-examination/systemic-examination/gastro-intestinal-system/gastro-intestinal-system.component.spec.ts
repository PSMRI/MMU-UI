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

import { GastroIntestinalSystemComponent } from './gastro-intestinal-system.component';
import { MaterialModule } from '../../../../../core/material.module';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('GastroIntestinalSystemComponent', () => {
  let component: GastroIntestinalSystemComponent;
  let fixture: ComponentFixture<GastroIntestinalSystemComponent>;
  let tracking: any;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GastroIntestinalSystemComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GastroIntestinalSystemComponent);
    component = fixture.componentInstance;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createGastroIntestinalSystemForm();
    component.gastroIntestinalSystemDataForm = form;
    fixture.detectChanges();
  });

  it('creates and loads language', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.selectLiver.map(o => o.name)).toEqual([
      'Not Palpable',
      'Just Palpable',
      'Enlarged',
    ]);
  });

  it('shows the tenderness location only when tenderness is Present', () => {
    const el: HTMLElement = fixture.nativeElement;
    const sel = '[formControlName="palpation_LocationOfTenderness"]';
    expect(el.querySelector(sel)).toBeNull();
    form.patchValue({ palpation_Tenderness: 'Present' });
    fixture.detectChanges();
    expect(el.querySelector(sel)).not.toBeNull();
  });

  it('getters return control values', () => {
    form.patchValue({
      palpation_Tenderness: 'Present',
      palpation_LocationOfTenderness: 'RIF',
    });
    expect(component.palpation_Tenderness).toBe('Present');
    expect(component.palpation_LocationOfTenderness).toBe('RIF');
  });

  it('checkWithTenderness clears the tenderness location', () => {
    form.patchValue({ palpation_LocationOfTenderness: 'RIF' });
    component.checkWithTenderness();
    expect(form.value.palpation_LocationOfTenderness).toBeNull();
  });

  it('binds the inspection input to the form', () => {
    const input = fixture.nativeElement.querySelector(
      '[formControlName="inspection"]'
    ) as HTMLInputElement;
    input.value = 'Distended';
    input.dispatchEvent(new Event('input'));
    expect(form.value.inspection).toBe('Distended');
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    component.trackFieldInteraction('Liver');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Liver',
      'Gastro-Intestinal System Examination'
    );
  });
});
