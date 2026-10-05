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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NullDefaultValueDirective } from './null-default-value.directive';

@Component({
  template: `<input type="text" appDefaultNull [formControl]="ctrl" />`,
})
class TestHostComponent {
  ctrl = new FormControl('initial');
}

describe('NullDefaultValueDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NullDefaultValueDirective, TestHostComponent],
      imports: [ReactiveFormsModule],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(
      By.directive(NullDefaultValueDirective)
    );
  });

  it('should create the directive', () => {
    expect(inputEl).toBeTruthy();
  });

  describe('input event - value conversion', () => {
    it('should set control value to null when input is empty', () => {
      const nativeInput = inputEl.nativeElement as HTMLInputElement;
      nativeInput.value = '';
      nativeInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.ctrl.value).toBeNull();
    });

    it('should set control value to the input value when not empty', () => {
      const nativeInput = inputEl.nativeElement as HTMLInputElement;
      nativeInput.value = 'test';
      nativeInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.ctrl.value).toBe('test');
    });

    it('should set control value for a single character', () => {
      const nativeInput = inputEl.nativeElement as HTMLInputElement;
      nativeInput.value = 'a';
      nativeInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.ctrl.value).toBe('a');
    });
  });

  describe('clipboard events', () => {
    it('should block paste', () => {
      const event = new Event('paste', { cancelable: true });
      spyOn(event, 'preventDefault');
      inputEl.nativeElement.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block copy', () => {
      const event = new Event('copy', { cancelable: true });
      spyOn(event, 'preventDefault');
      inputEl.nativeElement.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block cut', () => {
      const event = new Event('cut', { cancelable: true });
      spyOn(event, 'preventDefault');
      inputEl.nativeElement.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
