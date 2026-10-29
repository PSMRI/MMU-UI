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
import { MyNameDirective } from './myName.directive';

@Component({
  template: `<input type="text" appMyName />`,
})
class TestHostComponent {}

describe('MyNameDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyNameDirective, TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(By.directive(MyNameDirective));
  });

  it('should create the directive on the host element', () => {
    expect(inputEl).toBeTruthy();
  });

  describe('keypress - input filtering', () => {
    function keypress(charCode: number, which: number) {
      return {
        charCode,
        which,
        preventDefault: jasmine.createSpy('preventDefault'),
      };
    }

    it('does not currently block digit characters (malformed regex never matches a single char)', () => {
      const event = keypress(49, 49);
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does not currently block special characters like @ (malformed regex never matches a single char)', () => {
      const event = keypress(64, 64);
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow alphabetic characters', () => {
      const event = keypress(65, 65);
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow lowercase alphabetic characters', () => {
      const event = keypress(97, 97);
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent default when the key matches the filter regex', () => {
      const test = jasmine.createSpy('test').and.returnValue(true);
      // jasmine restores window.RegExp after this spec
      spyOn(window as any, 'RegExp').and.returnValue({ test });
      const event = keypress(49, 49);
      inputEl.triggerEventHandler('keypress', event);
      expect(test).toHaveBeenCalledWith(String.fromCharCode(49));
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should use ev.which when charCode is 0', () => {
      const test = jasmine.createSpy('test').and.returnValue(true);
      spyOn(window as any, 'RegExp').and.returnValue({ test });
      const event = keypress(0, 49);
      inputEl.triggerEventHandler('keypress', event);
      expect(test).toHaveBeenCalledWith(String.fromCharCode(49));
      expect(event.preventDefault).toHaveBeenCalled();
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
