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
import {
  FormControl,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MyEmailDirective } from './myEmail.directive';

@Component({
  template: `<input type="text" appValidateEmail [formControl]="emailCtrl" />`,
})
class TestHostComponent {
  emailCtrl = new FormControl('');
}

describe('MyEmailDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: DebugElement;
  let directive: MyEmailDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyEmailDirective, TestHostComponent],
      imports: [ReactiveFormsModule, FormsModule],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(By.directive(MyEmailDirective));
    directive = inputEl.injector.get(MyEmailDirective);
  });

  it('should create the directive', () => {
    expect(directive).toBeTruthy();
  });

  describe('validate', () => {
    it('should return null for empty string', () => {
      const control = new FormControl('');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return null for null value', () => {
      const control = new FormControl(null);
      expect(directive.validate(control)).toBeNull();
    });

    it('should return null for valid .com email', () => {
      const control = new FormControl('user@example.com');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return null for valid .org email', () => {
      const control = new FormControl('test.user@company.org');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return null for valid .in email', () => {
      const control = new FormControl('user@domain.in');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return null for valid .co.in email', () => {
      const control = new FormControl('user@domain.co.in');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return null for valid .COM email (uppercase)', () => {
      const control = new FormControl('user@domain.COM');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return { valid: false } for invalid email without @', () => {
      const control = new FormControl('userexample.com');
      expect(directive.validate(control)).toEqual({ valid: false });
    });

    it('should return { valid: false } for email with invalid TLD', () => {
      const control = new FormControl('user@example.xyz');
      expect(directive.validate(control)).toEqual({ valid: false });
    });

    it('should return { valid: false } for email with no domain', () => {
      const control = new FormControl('user@.com');
      expect(directive.validate(control)).toEqual({ valid: false });
    });

    it('should return { valid: false } for email with special chars in local part', () => {
      const control = new FormControl('us!er@domain.com');
      expect(directive.validate(control)).toEqual({ valid: false });
    });

    it('should allow underscores and dots in local part', () => {
      const control = new FormControl('user_name.test@domain.com');
      expect(directive.validate(control)).toBeNull();
    });

    it('should return { valid: false } for email with spaces', () => {
      const control = new FormControl('user @domain.com');
      expect(directive.validate(control)).toEqual({ valid: false });
    });
  });

  describe('clipboard events', () => {
    it('should block paste', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
      };
      inputEl.triggerEventHandler('paste', event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block copy', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
      };
      inputEl.triggerEventHandler('copy', event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block cut', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
      };
      inputEl.triggerEventHandler('cut', event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
