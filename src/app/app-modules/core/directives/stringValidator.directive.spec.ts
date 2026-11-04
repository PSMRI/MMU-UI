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
import { StringValidatorDirective } from './stringValidator.directive';

@Component({
  template: `<input type="text" [allowText]="validatorType" />`,
})
class TestHostComponent {
  validatorType = 'alphabet';
}

describe('StringValidatorDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: DebugElement;
  let directive: StringValidatorDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StringValidatorDirective, TestHostComponent],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.debugElement.query(
      By.directive(StringValidatorDirective)
    );
    directive = inputEl.injector.get(StringValidatorDirective);
  });

  it('should create the directive', () => {
    expect(directive).toBeTruthy();
  });

  describe('validate', () => {
    it('should return false for null input', () => {
      directive.allowText = 'alphabet';
      expect(directive.validate(null)).toBeFalse();
    });

    it('should return false for empty string input', () => {
      directive.allowText = 'alphabet';
      expect(directive.validate('')).toBeFalse();
    });

    describe('alphabet', () => {
      beforeEach(() => {
        directive.allowText = 'alphabet';
      });

      it('should return true for alphabetic input', () => {
        expect(directive.validate('Hello')).toBeTrue();
      });

      it('should return false for input with numbers', () => {
        expect(directive.validate('Hello123')).toBeFalse();
      });

      it('should return false for input with spaces', () => {
        expect(directive.validate('Hello World')).toBeFalse();
      });
    });

    describe('alphaspace', () => {
      beforeEach(() => {
        directive.allowText = 'alphaspace';
      });

      it('should return true for alpha with spaces', () => {
        expect(directive.validate('Hello World')).toBeTrue();
      });

      it('should return false for input with numbers', () => {
        expect(directive.validate('Hello 123')).toBeFalse();
      });
    });

    describe('alphanumeric', () => {
      beforeEach(() => {
        directive.allowText = 'alphanumeric';
      });

      it('should return true for alphanumeric input', () => {
        expect(directive.validate('Hello123')).toBeTrue();
      });

      it('should return false for input with spaces', () => {
        expect(directive.validate('Hello 123')).toBeFalse();
      });

      it('should return false for input with special chars', () => {
        expect(directive.validate('Hello@123')).toBeFalse();
      });
    });

    describe('alphanumericspace', () => {
      beforeEach(() => {
        directive.allowText = 'alphanumericspace';
      });

      it('should return true for alphanumeric with spaces', () => {
        expect(directive.validate('Hello 123')).toBeTrue();
      });

      it('should return false for input with special chars', () => {
        expect(directive.validate('Hello@123')).toBeFalse();
      });
    });

    describe('number', () => {
      beforeEach(() => {
        directive.allowText = 'number';
      });

      it('should return true for numeric input', () => {
        expect(directive.validate('12345')).toBeTrue();
      });

      it('should return false for alpha input', () => {
        expect(directive.validate('abc')).toBeFalse();
      });
    });

    describe('numberslash', () => {
      beforeEach(() => {
        directive.allowText = 'numberslash';
      });

      it('should return true for numbers with slash', () => {
        expect(directive.validate('123/456')).toBeTrue();
      });

      it('should return false for alpha input', () => {
        expect(directive.validate('abc')).toBeFalse();
      });
    });

    describe('alphanumerichyphen', () => {
      beforeEach(() => {
        directive.allowText = 'alphanumerichyphen';
      });

      it('should return true for alphanumeric with hyphen', () => {
        expect(directive.validate('ABC-123/test')).toBeTrue();
      });

      it('should return false for special chars', () => {
        expect(directive.validate('ABC@123')).toBeFalse();
      });
    });

    describe('numerichyphen', () => {
      beforeEach(() => {
        directive.allowText = 'numerichyphen';
      });

      it('should return true for numbers with hyphen', () => {
        expect(directive.validate('123-456')).toBeTrue();
      });

      it('should return false for alpha input', () => {
        expect(directive.validate('abc-123')).toBeFalse();
      });
    });

    describe('decimal', () => {
      beforeEach(() => {
        directive.allowText = 'decimal';
      });

      it('should return true for integer', () => {
        expect(directive.validate('123')).toBeTrue();
      });

      it('should return true for decimal with up to 2 decimal places', () => {
        expect(directive.validate('123.45')).toBeTrue();
      });

      it('should return false for decimal with 3 decimal places', () => {
        expect(directive.validate('123.456')).toBeFalse();
      });

      it('should return true for decimal with 1 decimal place', () => {
        expect(directive.validate('1.5')).toBeTrue();
      });
    });

    describe('address', () => {
      beforeEach(() => {
        directive.allowText = 'address';
      });

      it('should return true for address text', () => {
        expect(directive.validate('123 Main St. #4')).toBeTrue();
      });

      it('should return false for special chars not in address', () => {
        expect(directive.validate('addr@home')).toBeFalse();
      });
    });

    describe('inputFieldValidator', () => {
      beforeEach(() => {
        directive.allowText = 'inputFieldValidator';
      });

      it('should return true for alphanumeric with spaces', () => {
        expect(directive.validate('Hello 123')).toBeTrue();
      });

      it('should return false for special chars', () => {
        expect(directive.validate('Hello!123')).toBeFalse();
      });
    });

    describe('textAreaValidator', () => {
      beforeEach(() => {
        directive.allowText = 'textAreaValidator';
      });

      it('should return true for text with dots and commas', () => {
        expect(directive.validate('Hello, world. 123')).toBeTrue();
      });

      it('should return false for special chars', () => {
        expect(directive.validate('Hello@world')).toBeFalse();
      });
    });

    describe('questionnaireValidator', () => {
      beforeEach(() => {
        directive.allowText = 'questionnaireValidator';
      });

      it('should return true for text with question mark', () => {
        expect(directive.validate('How are you?')).toBeTrue();
      });

      it('should return false for special chars', () => {
        expect(directive.validate('Hello@world')).toBeFalse();
      });
    });

    describe('addressValidator', () => {
      beforeEach(() => {
        directive.allowText = 'addressValidator';
      });

      it('should return true for address text', () => {
        expect(directive.validate('123, Main St. #4-5/A')).toBeTrue();
      });
    });

    describe('smsTemplateValidator', () => {
      beforeEach(() => {
        directive.allowText = 'smsTemplateValidator';
      });

      it('should return true for SMS template text', () => {
        expect(
          directive.validate(
            'Hello, your balance is $100. Call: (123) 456-7890'
          )
        ).toBeTrue();
      });
    });

    describe('itemNameSearchValidator', () => {
      beforeEach(() => {
        directive.allowText = 'itemNameSearchValidator';
      });

      it('should return true for text with percent', () => {
        expect(directive.validate('Paracetamol 50%')).toBeTrue();
      });

      it('should return false for special chars', () => {
        expect(directive.validate('item@name')).toBeFalse();
      });
    });

    describe('itemNameMasterValidator', () => {
      beforeEach(() => {
        directive.allowText = 'itemNameMasterValidator';
      });

      it('should return true for item name with allowed chars', () => {
        expect(directive.validate('Item-Name.50%(test)')).toBeTrue();
      });
    });

    describe('answerValidator', () => {
      beforeEach(() => {
        directive.allowText = 'answerValidator';
      });

      it('should return true for answer text', () => {
        expect(directive.validate('Answer 1, option-2/3')).toBeTrue();
      });
    });

    describe('usernameValidator', () => {
      beforeEach(() => {
        directive.allowText = 'usernameValidator';
      });

      it('should return true for alphanumeric username', () => {
        expect(directive.validate('user123')).toBeTrue();
      });

      it('should return false for username with special chars', () => {
        expect(directive.validate('user@123')).toBeFalse();
      });

      it('should return false for username with spaces', () => {
        expect(directive.validate('user 123')).toBeFalse();
      });
    });

    describe('default case', () => {
      it('should return false for unknown pattern code', () => {
        directive.allowText = 'unknownPattern';
        expect(directive.validate('anything')).toBeFalse();
      });
    });
  });

  describe('onFocus', () => {
    it('should store current value as lastValue', () => {
      const event = { target: { value: 'test' } };
      directive.onFocus(event);
      expect(directive.lastValue).toBe('test' as any);
    });
  });

  describe('onInput', () => {
    describe('decimal mode', () => {
      beforeEach(() => {
        directive.allowText = 'decimal';
      });

      it('should clear value for empty input', () => {
        directive.lastValue = '1' as any;
        const event = { target: { value: '', maxLength: -1 } };
        directive.onInput(event);
        expect(event.target.value).toBe('');
      });

      it('should keep valid decimal', () => {
        directive.lastValue = '1' as any;
        const event = { target: { value: '12.34', maxLength: -1 } };
        directive.onInput(event);
        expect(event.target.value).toBe('12.34');
      });

      it('should revert invalid decimal', () => {
        directive.lastValue = '12.34' as any;
        const event = { target: { value: '12.345', maxLength: -1 } };
        directive.onInput(event);
        expect(event.target.value).toBe('12.34');
      });
    });

    describe('number mode', () => {
      beforeEach(() => {
        directive.allowText = 'number';
      });

      it('should clear value when entering 0 with no length', () => {
        directive.lastValue = '' as any;
        const event = { target: { value: '0', maxLength: -1, length: 0 } };
        directive.onInput(event);
        expect(event.target.value).toBe('');
      });

      it('should allow valid number when length > 0', () => {
        directive.lastValue = '1' as any;
        const event = { target: { value: '12', maxLength: -1, length: 1 } };
        directive.onInput(event);
        expect(event.target.value).toBe('12');
      });
    });

    describe('other modes (e.g. alphabet)', () => {
      beforeEach(() => {
        directive.allowText = 'alphabet';
      });

      it('should keep valid input', () => {
        directive.lastValue = 'Hel' as any;
        const event = { target: { value: 'Hell', maxLength: -1 } };
        directive.onInput(event);
        expect(event.target.value).toBe('Hell');
      });

      it('should revert invalid input', () => {
        directive.lastValue = 'Hello' as any;
        const event = { target: { value: 'Hello1', maxLength: -1 } };
        directive.onInput(event);
        expect(event.target.value).toBe('Hello');
      });

      it('should revert if value exceeds maxlength', () => {
        directive.lastValue = 'Hel' as any;
        const event = { target: { value: 'Hello', maxLength: 3 } };
        directive.onInput(event);
        expect(event.target.value).toBe('Hel');
      });

      it('should update lastValue after input', () => {
        directive.lastValue = 'He' as any;
        const event = { target: { value: 'Hel', maxLength: -1 } };
        directive.onInput(event);
        expect(directive.lastValue).toBe('Hel' as any);
      });
    });
  });

  describe('findDelta', () => {
    it('should find inserted character', () => {
      expect(directive.findDelta('abcd', 'abc')).toBe('d');
    });

    it('should find inserted character in the middle', () => {
      expect(directive.findDelta('abXc', 'abc')).toBe('X');
    });

    it('should return empty string when no difference', () => {
      expect(directive.findDelta('abc', 'abc')).toBe('');
    });

    it('should return empty string for removal case', () => {
      expect(directive.findDelta('ab', 'abc')).toBe('');
    });
  });

  describe('isValidChar', () => {
    it('should delegate to validate', () => {
      directive.allowText = 'alphabet';
      expect(directive.isValidChar('a')).toBeTrue();
      expect(directive.isValidChar('1')).toBeFalse();
    });
  });

  describe('isValidString', () => {
    it('should return true for all valid characters', () => {
      directive.allowText = 'alphabet';
      expect(directive.isValidString('abc')).toBeTrue();
    });

    it('should return false if any character is invalid', () => {
      directive.allowText = 'alphabet';
      expect(directive.isValidString('ab1')).toBeFalse();
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
