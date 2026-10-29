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
import { NO_ERRORS_SCHEMA, Injector } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { CaseSheetComponent } from './case-sheet.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('CaseSheetComponent', () => {
  let component: CaseSheetComponent;
  let fixture: ComponentFixture<CaseSheetComponent>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;
  let mockInjector: jasmine.SpyObj<Injector>;
  let mockActivatedRoute: any;

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj('HttpServiceService', [], {
      currentLangugae$: new BehaviorSubject<any>({ test: 'language' }),
    });
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);
    mockActivatedRoute = {
      snapshot: {
        params: {
          printablePage: 'current',
          serviceType: '2',
        },
      },
    };
    mockInjector = jasmine.createSpyObj('Injector', ['get']);
    mockInjector.get.and.returnValue(null);

    TestBed.configureTestingModule({
      declarations: [CaseSheetComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaseSheetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set serviceType from route params', () => {
      fixture.detectChanges();
      expect(component.serviceType).toBe('2');
    });

    it('should call fetchLanguageResponse', () => {
      spyOn(component, 'fetchLanguageResponse');
      component.ngOnInit();
      expect(component.fetchLanguageResponse).toHaveBeenCalled();
    });

    it('should call caseSheetCategory', () => {
      spyOn(component, 'caseSheetCategory');
      component.ngOnInit();
      expect(component.caseSheetCategory).toHaveBeenCalled();
    });

    it('should set previous and serviceType from dialog data when present', () => {
      mockInjector.get.and.returnValue({
        previous: true,
        serviceType: '5',
      });
      (component as any).injector = mockInjector;
      fixture.detectChanges();
      expect(mockInjector.get).toHaveBeenCalledWith(MAT_DIALOG_DATA, null);
      expect(component.previous).toBeTrue();
      expect(component.serviceType).toBe('5');
    });

    it('should not set previous or serviceType when dialog data is null', () => {
      mockInjector.get.and.returnValue(null);
      (component as any).injector = mockInjector;
      fixture.detectChanges();
      expect(component.previous).toBeUndefined();
      expect(component.serviceType).toBe('2');
    });
  });

  describe('caseSheetCategory', () => {
    it('should set CancerScreening true when type is Cancer Screening (current dataStore)', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'Cancer Screening';
        return null;
      });
      component.caseSheetCategory();
      expect(component.CancerScreening).toBeTrue();
    });

    it('should set General true for General OPD (current dataStore)', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'General OPD';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should set General true for General OPD (QC)', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'General OPD (QC)';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should set General true for NCD care', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'NCD care';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should set General true for PNC', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'PNC';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should set General true for ANC', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'ANC';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should set General true for COVID-19 Screening', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'COVID-19 Screening';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should set General true for NCD screening', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'NCD screening';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should reset all flags for unknown type', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'caseSheetVisitCategory') return 'Unknown Type';
        return null;
      });
      component.caseSheetCategory();
      expect(component.QC).toBeFalse();
      expect(component.CancerScreening).toBeFalse();
      expect(component.General).toBeFalse();
    });

    it('should default to previous when printablePage is not set', () => {
      mockActivatedRoute.snapshot.params = {};
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'previousCaseSheetVisitCategory') return 'ANC';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should use previousCaseSheetVisitCategory when dataStore is previous and previous is true', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'previous';
      component.previous = true;
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'previousCaseSheetVisitCategory') return 'Cancer Screening';
        return null;
      });
      component.caseSheetCategory();
      expect(component.CancerScreening).toBeTrue();
    });

    it('should use previousCaseSheetVisitCategory when dataStore is previous and previous is falsy', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'previous';
      component.previous = undefined;
      mockSessionStorage.getItem.and.callFake((key: string) => {
        if (key === 'previousCaseSheetVisitCategory') return 'General OPD';
        return null;
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });

    it('should not set any boolean when type is undefined/null', () => {
      mockActivatedRoute.snapshot.params['printablePage'] = 'current';
      mockSessionStorage.getItem.and.returnValue(null);
      component.QC = false;
      component.General = false;
      component.CancerScreening = false;
      component.caseSheetCategory();
      expect(component.QC).toBeFalse();
      expect(component.General).toBeFalse();
      expect(component.CancerScreening).toBeFalse();
    });
  });

  describe('ngDoCheck', () => {
    it('should call fetchLanguageResponse', () => {
      spyOn(component, 'fetchLanguageResponse');
      component.ngDoCheck();
      expect(component.fetchLanguageResponse).toHaveBeenCalled();
    });
  });

  describe('fetchLanguageResponse', () => {
    it('should set currentLanguageSet from the language service', () => {
      component.fetchLanguageResponse();
      expect(component.currentLanguageSet).toEqual({ test: 'language' });
    });
  });
});
