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

import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DisableFormControlDirective } from './disableFormControl.directive';

@Component({
  template: `
    <form [formGroup]="form">
      <input
        formControlName="testControl"
        appDisableFormControl
        [disableFormControl]="shouldDisable" />
      <input formControlName="otherControl" />
    </form>
  `,
})
class TestHostComponent {
  shouldDisable = false;
  form = new FormGroup({
    testControl: new FormControl('initial'),
    // A sibling keeps the parent group enabled when testControl is disabled.
    otherControl: new FormControl('other'),
  });
}

describe('DisableFormControlDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DisableFormControlDirective, TestHostComponent],
      imports: [ReactiveFormsModule],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the directive', () => {
    const inputEl = fixture.debugElement.query(
      By.directive(DisableFormControlDirective)
    );
    expect(inputEl).toBeTruthy();
  });

  it('should keep the control enabled when condition is false', () => {
    component.shouldDisable = false;
    fixture.detectChanges();
    expect(component.form.controls['testControl'].enabled).toBeTrue();
  });

  it('should disable the control and set value to null when condition is true', () => {
    component.shouldDisable = true;
    fixture.detectChanges();
    expect(component.form.controls['testControl'].disabled).toBeTrue();
    expect(component.form.controls['testControl'].value).toBeNull();
  });

  it('should mark the control as touched when disabling', () => {
    component.shouldDisable = true;
    fixture.detectChanges();
    expect(component.form.controls['testControl'].touched).toBeTrue();
  });

  it('should re-enable the control when condition changes back to false', () => {
    component.shouldDisable = true;
    fixture.detectChanges();
    expect(component.form.controls['testControl'].disabled).toBeTrue();

    component.shouldDisable = false;
    fixture.detectChanges();
    expect(component.form.controls['testControl'].enabled).toBeTrue();
  });

  it('should mark the control as touched when enabling', () => {
    component.shouldDisable = false;
    fixture.detectChanges();
    component.form.controls['testControl'].markAsUntouched();

    component.shouldDisable = true;
    fixture.detectChanges();
    expect(component.form.controls['testControl'].touched).toBeTrue();
  });

  it('should keep control disabled when parent form group is disabled', () => {
    component.form.disable();
    fixture.detectChanges();

    component.shouldDisable = false;
    fixture.detectChanges();

    expect(component.form.controls['testControl'].disabled).toBeTrue();
  });

  it('should not set value to null when parent is disabled (action is disable due to parent)', () => {
    component.form.controls['testControl'].setValue('keepMe');
    component.form.disable();
    fixture.detectChanges();

    const control = component.form.controls['testControl'];
    expect(control.disabled).toBeTrue();
  });

  it('should not re-enable a lone control because its parent group becomes disabled with it', () => {
    const lone = new FormGroup({ only: new FormControl('x') });
    const directive = new DisableFormControlDirective({
      control: lone.controls.only,
    } as any);
    directive.disableFormControl = true;
    expect(lone.disabled).toBeTrue();
    directive.disableFormControl = false;
    expect(lone.controls.only.disabled).toBeTrue();
  });

  it('should do nothing when the control has no parent', () => {
    const orphan = new FormControl('x');
    const directive = new DisableFormControlDirective({
      control: orphan,
    } as any);
    directive.disableFormControl = true;
    expect(orphan.enabled).toBeTrue();
    expect(orphan.value).toBe('x');
  });
});
