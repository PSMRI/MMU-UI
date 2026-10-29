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

import { HeadToToeExaminationComponent } from './head-to-toe-examination.component';
import { MaterialModule } from '../../../../core/material.module';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('HeadToToeExaminationComponent', () => {
  let component: HeadToToeExaminationComponent;
  let fixture: ComponentFixture<HeadToToeExaminationComponent>;
  let tracking: any;
  let form: FormGroup;

  const fields = [
    'head',
    'eyes',
    'ears',
    'nose',
    'oralCavity',
    'throat',
    'breastAndNipples',
    'trunk',
    'upperLimbs',
    'lowerLimbs',
    'skin',
    'hair',
    'nails',
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [HeadToToeExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadToToeExaminationComponent);
    component = fixture.componentInstance;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createHeadToToeExaminationForm();
    component.headToToeExaminationDataForm = form;
    fixture.detectChanges();
  });

  it('creates and loads language', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('shows the detail fields only when exam is Abnormal', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[formControlName="head"]')).toBeNull();
    form.patchValue({ headtoToeExam: 'Abnormal' });
    fixture.detectChanges();
    fields.forEach(f =>
      expect(el.querySelector(`[formControlName="${f}"]`))
        .withContext(f)
        .not.toBeNull()
    );
  });

  it('getters return the control values', () => {
    const patch: any = { headtoToeExam: 'Abnormal' };
    fields.forEach(f => (patch[f] = `${f}-val`));
    form.patchValue(patch);
    expect(component.headtoToeExam).toBe('Abnormal');
    fields.forEach(f =>
      expect((component as any)[f])
        .withContext(f)
        .toBe(`${f}-val`)
    );
  });

  it('checkWithHeadToToe clears every detail field', () => {
    const patch: any = {};
    fields.forEach(f => (patch[f] = 'x'));
    form.patchValue(patch);
    component.checkWithHeadToToe();
    fields.forEach(f => expect(form.value[f]).withContext(f).toBeNull());
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    component.trackFieldInteraction('Head');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Head',
      'Head To Toe Examination'
    );
  });
});
