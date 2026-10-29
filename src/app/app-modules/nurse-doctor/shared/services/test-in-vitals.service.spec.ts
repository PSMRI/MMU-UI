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
import { TestInVitalsService } from './test-in-vitals.service';

describe('TestInVitalsService', () => {
  let service: TestInVitalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestInVitalsService],
    });
    service = TestBed.inject(TestInVitalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null vitalRBSTest', () => {
      expect(service.vitalRBSTest).toBeNull();
    });

    it('should have null vitalRBSTestUpdate', () => {
      expect(service.vitalRBSTestUpdate).toBeNull();
    });
  });

  describe('setVitalsRBSValueInReports', () => {
    it('should set the RBS value and emit through observable', done => {
      service.vitalRBSTestResult$.subscribe(val => {
        if (val === 150) {
          expect(service.vitalRBSTest).toBe(150);
          done();
        }
      });
      service.setVitalsRBSValueInReports(150);
    });
  });

  describe('clearVitalsRBSValueInReports', () => {
    it('should reset RBS value to 0', () => {
      service.setVitalsRBSValueInReports(150);
      service.clearVitalsRBSValueInReports();
      expect(service.vitalRBSTest).toBe(0);
      let val: any;
      service.vitalRBSTestResult$.subscribe(v => (val = v));
      expect(val).toBe(0);
    });
  });

  describe('setVitalsRBSValueInReportsInUpdate', () => {
    it('should set the update RBS value and emit', done => {
      service.vitalRBSTestResultInUpdate$.subscribe(val => {
        if (val === 200) {
          expect(service.vitalRBSTestUpdate).toBe(200);
          done();
        }
      });
      service.setVitalsRBSValueInReportsInUpdate(200);
    });
  });

  describe('clearVitalsRBSValueInReportsInUpdate', () => {
    it('should reset update RBS value to 0', () => {
      service.setVitalsRBSValueInReportsInUpdate(200);
      service.clearVitalsRBSValueInReportsInUpdate();
      expect(service.vitalRBSTestUpdate).toBe(0);
      let val: any;
      service.vitalRBSTestResultInUpdate$.subscribe(v => (val = v));
      expect(val).toBe(0);
    });
  });
});
