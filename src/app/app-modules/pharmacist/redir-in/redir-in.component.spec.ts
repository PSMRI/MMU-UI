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
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RedirInComponent } from './redir-in.component';
import { ConfirmationService } from '../../core/services/confirmation.service';

describe('RedirInComponent', () => {
  let component: RedirInComponent;
  let fixture: ComponentFixture<RedirInComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;

  function createComponent(queryParams: any) {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
      'confirm',
    ]);

    TestBed.configureTestingModule({
      declarations: [RedirInComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of(queryParams) },
        },
        { provide: ConfirmationService, useValue: mockConfirmationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RedirInComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('with resolve=true and currentLanguage=English', () => {
    beforeEach(waitForAsync(() => {
      createComponent({ resolve: 'true', currentLanguage: 'English' });
      fixture.detectChanges();
    }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set setLanguage in sessionStorage to English', () => {
      expect(sessionStorage.getItem('setLanguage')).toBe('English');
    });

    it('should call confirmationService.alert with Items Dispensed', () => {
      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'Items Dispensed',
        'info'
      );
    });

    it('should navigate to /pharmacist/pharmacist-worklist', () => {
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/pharmacist/pharmacist-worklist',
      ]);
    });
  });

  describe('with resolve=undefined', () => {
    beforeEach(waitForAsync(() => {
      createComponent({ resolve: 'undefined', currentLanguage: 'Hindi' });
      fixture.detectChanges();
    }));

    it('should not call confirmationService.alert when resolve is undefined', () => {
      expect(mockConfirmationService.alert).not.toHaveBeenCalled();
    });

    it('should set setLanguage in sessionStorage to Hindi', () => {
      expect(sessionStorage.getItem('setLanguage')).toBe('Hindi');
    });

    it('should still navigate to /pharmacist/pharmacist-worklist', () => {
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/pharmacist/pharmacist-worklist',
      ]);
    });
  });

  describe('with currentLanguage=undefined', () => {
    beforeEach(waitForAsync(() => {
      createComponent({ resolve: 'false', currentLanguage: 'undefined' });
      fixture.detectChanges();
    }));

    it('should default language to English when currentLanguage is "undefined"', () => {
      expect(sessionStorage.getItem('setLanguage')).toBe('English');
    });
  });

  describe('routeToDesignation', () => {
    beforeEach(waitForAsync(() => {
      createComponent({ resolve: 'undefined', currentLanguage: 'English' });
      fixture.detectChanges();
    }));

    it('should navigate to /registrar/registration for Registrar', () => {
      component.routeToDesignation('Registrar');
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/registrar/registration',
      ]);
    });

    it('should navigate to /nurse-doctor/nurse-worklist for Nurse', () => {
      component.routeToDesignation('Nurse');
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });

    it('should navigate to /nurse-doctor/doctor-worklist for Doctor', () => {
      component.routeToDesignation('Doctor');
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
    });

    it('should navigate to /lab for Lab Technician', () => {
      component.routeToDesignation('Lab Technician');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/lab']);
    });

    it('should navigate to /pharmacist for Pharmacist', () => {
      component.routeToDesignation('Pharmacist');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/pharmacist']);
    });

    it('should navigate to /nurse-doctor/radiologist-worklist for Radiologist', () => {
      component.routeToDesignation('Radiologist');
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/radiologist-worklist',
      ]);
    });

    it('should navigate to /nurse-doctor/oncologist-worklist for Oncologist', () => {
      component.routeToDesignation('Oncologist');
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/oncologist-worklist',
      ]);
    });

    it('should not navigate for an unknown designation', () => {
      mockRouter.navigate.calls.reset();
      component.routeToDesignation('Unknown');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});
