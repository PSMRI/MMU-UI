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

import { AbdominalExaminationComponent } from './abdominal-examination.component';
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

describe('AbdominalExaminationComponent', () => {
  let component: AbdominalExaminationComponent;
  let fixture: ComponentFixture<AbdominalExaminationComponent>;
  let camera: any;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [AbdominalExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AbdominalExaminationComponent);
    component = fixture.componentInstance;
    camera = TestBed.inject(CameraService) as any;
    form = new CancerUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createAbdominalExaminationForm();
    component.abdominalExaminationForm = form;
    fixture.detectChanges();
  });

  it('creates and sets the language', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('exposes lymphNodes_Enlarged and observation getters', () => {
    expect(component.lymphNodes_Enlarged).toBe(form.get('lymphNodes_Enlarged'));
    expect(component.observation).toBe(form.get('observation'));
  });

  it('shows lymph node detail section only when enlarged', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lymphNodesTable')).toBeNull();
    form.patchValue({ lymphNodes_Enlarged: true });
    fixture.detectChanges();
    expect(el.querySelector('#lymphNodesTable')).not.toBeNull();
  });

  it('checkWithLymphNodes resets every lymph node field', () => {
    form.patchValue({
      lymphNode_Inguinal_Left: true,
      lymphNode_Inguinal_Right: true,
      lymphNode_ExternalIliac_Left: true,
      lymphNode_ExternalIliac_Right: true,
      lymphNode_ParaAortic_Left: true,
      lymphNode_ParaAortic_Right: true,
    });
    component.checkWithLymphNodes();
    expect(form.value.lymphNode_Inguinal_Left).toBeNull();
    expect(form.value.lymphNode_Inguinal_Right).toBeNull();
    expect(form.value.lymphNode_ExternalIliac_Left).toBeNull();
    expect(form.value.lymphNode_ExternalIliac_Right).toBeNull();
    expect(form.value.lymphNode_ParaAortic_Left).toBeNull();
    expect(form.value.lymphNode_ParaAortic_Right).toBeNull();
  });

  it('annotateImage stores the returned points with imageID 1', () => {
    camera.annotate.and.returnValue(of({ markers: [1] }));
    form.patchValue({ image: { old: true } });
    (
      fixture.nativeElement.querySelector(
        '#annotateAbdominalImg'
      ) as HTMLElement
    ).click();
    expect(camera.annotate).toHaveBeenCalledWith(
      'assets/images/abdominalExamination.png',
      { old: true },
      LANGUAGE_EN
    );
    expect(form.value.image).toEqual({ markers: [1], imageID: 1 });
    expect(form.dirty).toBeTrue();
  });

  it('annotateImage ignores an empty dialog result', () => {
    camera.annotate.and.returnValue(of(undefined));
    component.annotateImage();
    expect(form.value.image).toBeNull();
    expect(form.dirty).toBeFalse();
  });
});
