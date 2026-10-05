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
import { of } from 'rxjs';

import { OralExaminationComponent } from './oral-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import { MaterialModule } from '../../../../core/material.module';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('OralExaminationComponent', () => {
  let component: OralExaminationComponent;
  let fixture: ComponentFixture<OralExaminationComponent>;
  let camera: any;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [OralExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OralExaminationComponent);
    component = fixture.componentInstance;
    camera = TestBed.inject(CameraService) as any;
    form = new CancerUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createOralExaminationForm();
    component.oralExaminationForm = form;
    fixture.detectChanges();
  });

  it('creates and loads language on ngDoCheck', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('exposes form control getters', () => {
    expect(component.premalignantLesions).toBe(form.get('premalignantLesions'));
    expect(component.preMalignantLesionType).toBe(
      form.get('preMalignantLesionType')
    );
    expect(component.observation).toBe(form.get('observation'));
  });

  it('shows the other lesion input when "Any other lesion" is selected', () => {
    form.patchValue({ premalignantLesions: true });
    form.patchValue({ preMalignantLesionTypeList: ['Any other lesion'] });
    fixture.detectChanges();
    expect(component.showOther).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('[formControlName="otherLesionType"]')
    ).not.toBeNull();
  });

  it('hides and clears the other lesion when it is deselected', () => {
    form.patchValue({ preMalignantLesionTypeList: ['Any other lesion'] });
    form.patchValue({ otherLesionType: 'Custom' });
    form.patchValue({ preMalignantLesionTypeList: ['Leukoplakia'] });
    expect(component.showOther).toBeFalse();
    expect(form.value.otherLesionType).toBeNull();
  });

  it('clears the other lesion when list becomes null', () => {
    form.patchValue({ otherLesionType: 'Custom' });
    component.checkWithPremalignantLesion();
    expect(form.value.preMalignantLesionTypeList).toBeNull();
    expect(form.value.otherLesionType).toBeNull();
  });

  it('annotateImage stores points with imageID 3', () => {
    camera.annotate.and.returnValue(of({ markers: [] }));
    (
      fixture.nativeElement.querySelector('#annotateOralImg') as HTMLElement
    ).click();
    expect(camera.annotate).toHaveBeenCalledWith(
      'assets/images/oralExamination.png',
      null,
      LANGUAGE_EN
    );
    expect(form.value.image).toEqual({ markers: [], imageID: 3 });
    expect(form.dirty).toBeTrue();
  });

  it('annotateImage ignores an empty result', () => {
    camera.annotate.and.returnValue(of(null));
    component.annotateImage();
    expect(form.value.image).toBeNull();
    expect(form.dirty).toBeFalse();
  });
});
