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

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';


import { CameraService } from '../../../../core/services/camera.service';
import { CameraServiceStub } from '../../../../core/mocks/camera-service-stub';

import { CancerUtils } from '../../../shared/utility';

import { GynecologicalExaminationComponent } from './gynecological-examination.component';

describe('GynecologicalExaminationComponent', () => {
  let component: GynecologicalExaminationComponent;
  let fixture: ComponentFixture<GynecologicalExaminationComponent>;
  let debugElement: any;
  let fb: any;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        MaterialModule,
        GynecologicalExaminationComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: CameraService, useClass: CameraServiceStub }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GynecologicalExaminationComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;

    fb = debugElement.injector.get(FormBuilder);
    component.gynecologicalExaminationForm = new CancerUtils(
      fb
    ).createGynecologicalExaminationForm();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show RTI/STI suffered (if reports available)', () => {
    debugElement = fixture.debugElement.query(By.css('#rTIOrSTIDetail'));
    expect(debugElement).toBeFalsy();
  });

  it('should not show select file', () => {
    debugElement = fixture.debugElement.query(By.css('#files'));
    expect(debugElement).toBeFalsy();
  });

  it('should show RTI/STI suffered (if reports available) when suffered from any RTI/STI is true', () => {
    component.gynecologicalExaminationForm.patchValue({
      sufferedFromRTIOrSTI: true,
    });
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.css('#rTIOrSTIDetail'));
    expect(debugElement).toBeTruthy();
  });

  it('should show select file when suffered from any RTI/STI is true', () => {
    component.gynecologicalExaminationForm.patchValue({
      sufferedFromRTIOrSTI: true,
    });
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.css('#files'));
    expect(debugElement).toBeTruthy();
  });

  it('should call annotateImage when image is clicked', () => {
    spyOn(component, 'annotateImage');
    debugElement = fixture.debugElement.query(
      By.css('#annotateGynecologicalImg')
    );
    debugElement.triggerEventHandler('click', null);
    expect(component.annotateImage).toHaveBeenCalled();
  });
});
