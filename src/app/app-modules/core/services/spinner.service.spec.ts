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
import { SpinnerService, SpinnerState } from './spinner.service';

describe('SpinnerService', () => {
  let service: SpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpinnerService],
    });

    service = TestBed.inject(SpinnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setLoading / getLoading', () => {
    it('should default loading to false', () => {
      expect(service.getLoading()).toBe(false);
    });

    it('should set loading to true', () => {
      service.setLoading(true);
      expect(service.getLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      service.setLoading(true);
      service.setLoading(false);
      expect(service.getLoading()).toBe(false);
    });
  });

  describe('show', () => {
    it('should emit {show: true} on first call', done => {
      service.spinnerState.subscribe((state: SpinnerState) => {
        expect(state.show).toBe(true);
        done();
      });

      service.show();
    });

    it('should add to temp array on each call', () => {
      service.show();
      service.show();
      expect(service.temp.length).toBe(2);
    });

    it('should only emit {show: true} on the first call, not subsequent calls', () => {
      const emissions: SpinnerState[] = [];
      service.spinnerState.subscribe((state: SpinnerState) => {
        emissions.push(state);
      });

      service.show();
      service.show();
      service.show();

      expect(emissions.length).toBe(1);
      expect(emissions[0].show).toBe(true);
    });
  });

  describe('hide', () => {
    it('should emit {show: false} when temp becomes empty', done => {
      service.show();

      service.spinnerState.subscribe((state: SpinnerState) => {
        if (!state.show) {
          expect(state.show).toBe(false);
          done();
        }
      });

      service.hide();
    });

    it('should not emit when temp still has items', () => {
      service.show();
      service.show();

      const emissions: SpinnerState[] = [];
      service.spinnerState.subscribe((state: SpinnerState) => {
        emissions.push(state);
      });

      service.hide();
      expect(emissions.length).toBe(0);
      expect(service.temp.length).toBe(1);
    });

    it('should not throw when called on empty temp array', () => {
      expect(() => service.hide()).not.toThrow();
    });

    it('should emit {show: false} when temp goes from 1 to 0', () => {
      service.temp = [true];
      const emissions: SpinnerState[] = [];
      service.spinnerState.subscribe((state: SpinnerState) => {
        emissions.push(state);
      });

      service.hide();
      expect(emissions.length).toBe(1);
      expect(emissions[0].show).toBe(false);
    });
  });

  describe('clear', () => {
    it('should reset temp to [false] then pop it, emitting {show: false}', done => {
      service.show();
      service.show();
      service.show();

      service.spinnerState.subscribe((state: SpinnerState) => {
        if (!state.show) {
          expect(state.show).toBe(false);
          expect(service.temp.length).toBe(0);
          done();
        }
      });

      service.clear();
    });

    it('should work when called without any prior show()', () => {
      const emissions: SpinnerState[] = [];
      service.spinnerState.subscribe((state: SpinnerState) => {
        emissions.push(state);
      });

      service.clear();

      expect(service.temp.length).toBe(0);
      expect(emissions.length).toBe(1);
      expect(emissions[0].show).toBe(false);
    });
  });
});
