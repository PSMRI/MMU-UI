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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TmLogoutComponent } from './tm-logout.component';
import {
  commonTestProviders,
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('TmLogoutComponent', () => {
  let fixture: ComponentFixture<TmLogoutComponent>;
  let router: Router;
  let clearSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TmLogoutComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    clearSpy = spyOn(Storage.prototype, 'clear');
    fixture = TestBed.createComponent(TmLogoutComponent);
    fixture.detectChanges();
  });

  it('clears session storage and navigates to login on init', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
