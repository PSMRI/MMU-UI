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
import { MyPasswordDirective } from './myPassword.directive';

@Component({
  template: `<input type="password" appMyPassword /><br /><span
      class="hint"></span>`,
})
class TestHostComponent {}

describe('MyPasswordDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyPasswordDirective, TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(By.directive(MyPasswordDirective));
  });

  it('should create the directive on the host element', () => {
    expect(inputEl).toBeTruthy();
  });

  describe('keyup - password validation feedback', () => {
    function triggerKeyup(value: string): void {
      const el = inputEl.nativeElement as HTMLInputElement;
      el.value = value;
      inputEl.triggerEventHandler('keyup', {
        target: el,
      });
    }

    it('should show "Strong Password" and green border for a strong password', () => {
      triggerKeyup('Abcdef12');
      const el = inputEl.nativeElement as HTMLInputElement;
      const hint = (el.nextSibling as any).nextElementSibling as HTMLElement;
      expect(hint.textContent).toBe('Strong Password');
      expect(el.style.border).toBe('2px solid green');
    });

    it('should show "Strong Password" for a 12-char valid password', () => {
      triggerKeyup('Abcdefgh1234');
      const el = inputEl.nativeElement as HTMLInputElement;
      const hint = (el.nextSibling as any).nextElementSibling as HTMLElement;
      expect(hint.textContent).toBe('Strong Password');
      expect(el.style.border).toBe('2px solid green');
    });

    it('should treat a 7-char password as invalid (the regex already enforces 8-12 chars)', () => {
      triggerKeyup('Abcdefg');
      const el = inputEl.nativeElement as HTMLInputElement;
      const hint = (el.nextSibling as any).nextElementSibling as HTMLElement;
      expect(hint.textContent).toContain(
        'password should be 8-12 characters long'
      );
      expect(el.style.border).toBe('2px solid red');
    });

    it('should show "Weak Password" and yellow border when the validator reports weak', () => {
      const directive = inputEl.injector.get(MyPasswordDirective);
      const validator = spyOn(
        directive as any,
        'passwordValidator'
      ).and.returnValue(0);
      triggerKeyup('Abcdefg');
      const el = inputEl.nativeElement as HTMLInputElement;
      const hint = (el.nextSibling as any).nextElementSibling as HTMLElement;
      expect(validator).toHaveBeenCalledWith('Abcdefg');
      expect(hint.textContent).toBe('Weak Password');
      expect(el.style.border).toBe('2px solid yellow');
    });

    it('should show error message and red border for invalid password', () => {
      triggerKeyup('123');
      const el = inputEl.nativeElement as HTMLInputElement;
      const hint = (el.nextSibling as any).nextElementSibling as HTMLElement;
      expect(hint.textContent).toContain(
        'password should be 8-12 characters long'
      );
      expect(el.style.border).toBe('2px solid red');
    });

    it('should show error when password starts with a number', () => {
      triggerKeyup('1abcdefg');
      const el = inputEl.nativeElement as HTMLInputElement;
      const hint = (el.nextSibling as any).nextElementSibling as HTMLElement;
      expect(hint.textContent).toContain(
        'password should be 8-12 characters long'
      );
      expect(el.style.border).toBe('2px solid red');
    });

    it('should show error for empty password', () => {
      triggerKeyup('');
      const el = inputEl.nativeElement as HTMLInputElement;
      expect(el.style.border).toBe('2px solid red');
    });
  });

  describe('keypress - whitespace prevention', () => {
    it('should prevent space characters', () => {
      const event = {
        charCode: 32,
        which: 32,
        preventDefault: jasmine.createSpy('preventDefault'),
      };
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow normal characters', () => {
      const event = {
        charCode: 65,
        which: 65,
        preventDefault: jasmine.createSpy('preventDefault'),
      };
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should use ev.which when charCode is 0', () => {
      const event = {
        charCode: 0,
        which: 65,
        preventDefault: jasmine.createSpy('preventDefault'),
      };
      inputEl.triggerEventHandler('keypress', event);
      expect(event.preventDefault).not.toHaveBeenCalled();
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
