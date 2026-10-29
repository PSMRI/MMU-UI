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

import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler.service';

describe('GlobalErrorHandler', () => {
  let service: GlobalErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler],
    });
    service = TestBed.inject(GlobalErrorHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should implement ErrorHandler', () => {
    expect(service instanceof GlobalErrorHandler).toBeTruthy();
    expect(typeof service.handleError).toBe('function');
  });

  describe('#handleError', () => {
    it('should log the error to console', () => {
      const consoleSpy = spyOn(console, 'log');
      const testError = new Error('Test error');

      try {
        service.handleError(testError);
      } catch (e) {
        // expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(testError);
    });

    it('should re-throw the error after logging', () => {
      spyOn(console, 'log');
      const testError = new Error('Test error message');

      expect(() => service.handleError(testError)).toThrowError(
        'Test error message'
      );
    });

    it('should handle errors with different messages', () => {
      spyOn(console, 'log');
      const testError = new Error('Another error');

      expect(() => service.handleError(testError)).toThrowError(
        'Another error'
      );
    });

    it('should log and re-throw TypeError', () => {
      const consoleSpy = spyOn(console, 'log');
      const typeError = new TypeError('Type mismatch');

      expect(() => service.handleError(typeError)).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(typeError);
    });

    it('should log and re-throw RangeError', () => {
      const consoleSpy = spyOn(console, 'log');
      const rangeError = new RangeError('Out of range');

      expect(() => service.handleError(rangeError)).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(rangeError);
    });

    it('should log the exact error object passed in', () => {
      const consoleSpy = spyOn(console, 'log');
      const error = new Error('specific');

      try {
        service.handleError(error);
      } catch (e) {
        // expected
      }

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.calls.first().args[0]).toBe(error);
    });
  });
});
