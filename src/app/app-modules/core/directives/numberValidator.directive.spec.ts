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
import { By } from '@angular/platform-browser';
import { NumberValidatorDirective } from './numberValidator.directive';

@Component({
  template: `<input type="text" allowMax="100" />`,
})
class TestHostComponent {}

describe('NumberValidatorDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: DebugElement;
  let directive: NumberValidatorDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NumberValidatorDirective, TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(
      By.directive(NumberValidatorDirective)
    );
    directive = inputEl.injector.get(NumberValidatorDirective);
  });

  it('should create the directive', () => {
    expect(directive).toBeTruthy();
  });

  it('should have allowMax set to "100"', () => {
    expect(directive.allowMax).toBe('100');
  });

  describe('validate', () => {
    it('should return true for value less than allowMax', () => {
      expect(directive.validate(50)).toBeTrue();
    });

    it('should return true for value equal to allowMax', () => {
      expect(directive.validate(100)).toBeTrue();
    });

    it('should return false for value greater than allowMax', () => {
      expect(directive.validate(101)).toBeFalse();
    });

    it('should return true for zero', () => {
      expect(directive.validate(0)).toBeTrue();
    });

    it('should return true for negative values', () => {
      expect(directive.validate(-5)).toBeTrue();
    });
  });

  describe('onFocus', () => {
    it('should store the current value as lastValue', () => {
      const event = { target: { value: '42' } };
      directive.onFocus(event);
      expect(directive.lastValue).toBe('42' as any);
    });
  });

  describe('onInput', () => {
    it('should keep valid value', () => {
      directive.lastValue = '50' as any;
      const event = { target: { value: '75' } };
      directive.onInput(event);
      expect(event.target.value).toBe('75');
    });

    it('should revert to lastValue when value exceeds allowMax', () => {
      directive.lastValue = '90' as any;
      const event = { target: { value: '150' } };
      directive.onInput(event);
      expect(event.target.value).toBe('90');
    });

    it('should update lastValue after valid input', () => {
      directive.lastValue = '10' as any;
      const event = { target: { value: '50' } };
      directive.onInput(event);
      expect(directive.lastValue).toBe('50' as any);
    });

    it('should update lastValue to the reverted value after invalid input', () => {
      directive.lastValue = '80' as any;
      const event = { target: { value: '200' } };
      directive.onInput(event);
      expect(directive.lastValue).toBe('80' as any);
    });

    it('should allow value equal to max', () => {
      directive.lastValue = '99' as any;
      const event = { target: { value: '100' } };
      directive.onInput(event);
      expect(event.target.value).toBe('100');
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
