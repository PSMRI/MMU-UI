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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppComponent } from './app.component';
import { SpinnerService } from './app-modules/core/services';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({ selector: 'app-spinner', template: '' })
class MockSpinnerComponent {}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockSpinnerService: jasmine.SpyObj<SpinnerService>;

  beforeEach(waitForAsync(() => {
    mockSpinnerService = jasmine.createSpyObj('SpinnerService', [
      'show',
      'hide',
    ]);

    const mockTrackingService = jasmine.createSpyObj('AmritTrackingService', [
      'setUserId',
      'initializeTracker',
      'trackPageView',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent, MockSpinnerComponent],
      providers: [
        { provide: SpinnerService, useValue: mockSpinnerService },
        {
          provide: AmritTrackingService,
          useValue: mockTrackingService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have isAuthenticated set to false by default', () => {
    expect(component.isAuthenticated).toBeFalse();
  });

  it('should have showRoles set to false by default', () => {
    expect(component.showRoles).toBeFalse();
  });

  it('should allow showRoles to be set as an input', () => {
    component.showRoles = true;
    expect(component.showRoles).toBeTrue();
  });

  it('should render router-outlet', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should render app-spinner component', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-spinner')).toBeTruthy();
  });
});
