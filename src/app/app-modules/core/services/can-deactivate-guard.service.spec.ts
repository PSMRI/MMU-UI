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
import { Observable, of } from 'rxjs';
import {
  CanDeactivateGuardService,
  CanComponentDeactivate,
} from './can-deactivate-guard.service';

describe('CanDeactivateGuardService', () => {
  let service: CanDeactivateGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanDeactivateGuardService],
    });
    service = TestBed.inject(CanDeactivateGuardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#canDeactivate', () => {
    it('should return true when component has no canDeactivate method', () => {
      const component = {} as CanComponentDeactivate;
      const result = service.canDeactivate(component);
      expect(result).toBe(true);
    });

    it('should call component canDeactivate when it exists and returns true', () => {
      const component: CanComponentDeactivate = {
        canDeactivate: () => true,
      };
      spyOn(component, 'canDeactivate').and.returnValue(true);
      const result = service.canDeactivate(component);
      expect(component.canDeactivate).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call component canDeactivate when it exists and returns false', () => {
      const component: CanComponentDeactivate = {
        canDeactivate: () => false,
      };
      const result = service.canDeactivate(component);
      expect(result).toBe(false);
    });

    it('should handle component canDeactivate returning an Observable<boolean>', (done: DoneFn) => {
      const component: CanComponentDeactivate = {
        canDeactivate: () => of(true),
      };
      const result = service.canDeactivate(component) as Observable<boolean>;
      result.subscribe(value => {
        expect(value).toBe(true);
        done();
      });
    });

    it('should handle component canDeactivate returning Observable<false>', (done: DoneFn) => {
      const component: CanComponentDeactivate = {
        canDeactivate: () => of(false),
      };
      const result = service.canDeactivate(component) as Observable<boolean>;
      result.subscribe(value => {
        expect(value).toBe(false);
        done();
      });
    });

    it('should handle component canDeactivate returning a Promise<boolean>', async () => {
      const component: CanComponentDeactivate = {
        canDeactivate: () => Promise.resolve(true),
      };
      const result = service.canDeactivate(component) as Promise<boolean>;
      const value = await result;
      expect(value).toBe(true);
    });

    it('should handle component canDeactivate returning a rejected Promise', async () => {
      const component: CanComponentDeactivate = {
        canDeactivate: () => Promise.resolve(false),
      };
      const result = service.canDeactivate(component) as Promise<boolean>;
      const value = await result;
      expect(value).toBe(false);
    });

    it('should return true when canDeactivate is undefined', () => {
      const component = { canDeactivate: undefined } as any;
      const result = service.canDeactivate(component);
      expect(result).toBe(true);
    });

    it('should return true when canDeactivate is null', () => {
      const component = { canDeactivate: null } as any;
      const result = service.canDeactivate(component);
      expect(result).toBe(true);
    });
  });
});
