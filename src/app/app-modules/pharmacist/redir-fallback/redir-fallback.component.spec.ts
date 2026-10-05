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

import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RedirFallbackComponent } from './redir-fallback.component';
import { ConfirmationService } from '../../core/services/confirmation.service';

describe('RedirFallbackComponent', () => {
  let component: RedirFallbackComponent;
  let fixture: ComponentFixture<RedirFallbackComponent>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(waitForAsync(() => {
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', [
      'detectChanges',
    ]);

    TestBed.configureTestingModule({
      declarations: [RedirFallbackComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ConfirmationService, useValue: mockConfirmationService },
        { provide: Router, useValue: mockRouter },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RedirFallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit', () => {
    it('should alert with inventory connection error message', fakeAsync(() => {
      component.ngAfterViewInit();
      tick();
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Issues in connecting to Inventory, try again later',
        'error'
      );
    }));

    it('should navigate to /pharmacist/pharmacist-worklist', fakeAsync(() => {
      component.ngAfterViewInit();
      tick();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/pharmacist/pharmacist-worklist',
      ]);
    }));
  });
});
