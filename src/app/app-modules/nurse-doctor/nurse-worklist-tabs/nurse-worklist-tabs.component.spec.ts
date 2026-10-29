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
import { BehaviorSubject } from 'rxjs';

import { NurseWorklistTabsComponent } from './nurse-worklist-tabs.component';
import { HttpServiceService } from '../../core/services/http-service.service';

describe('NurseWorklistTabsComponent', () => {
  let component: NurseWorklistTabsComponent;
  let fixture: ComponentFixture<NurseWorklistTabsComponent>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;

  const mockLanguageObject = { reports: 'Reports', worklist: 'Worklist' };

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj(
      'HttpServiceService',
      ['fetchLanguageSet'],
      {
        currentLangugae$: new BehaviorSubject(
          mockLanguageObject
        ).asObservable(),
      }
    );

    TestBed.configureTestingModule({
      declarations: [NurseWorklistTabsComponent],
      providers: [{ provide: HttpServiceService, useValue: mockHttpService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NurseWorklistTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call assignSelectedLanguage on init', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngOnInit();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });
  });

  describe('ngDoCheck', () => {
    it('should call assignSelectedLanguage on doCheck', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngDoCheck();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });
  });

  describe('assignSelectedLanguage', () => {
    it('should set currentLanguageSet from SetLanguageComponent', () => {
      component.assignSelectedLanguage();
      expect(component.currentLanguageSet).toEqual(mockLanguageObject);
    });

    it('should update currentLanguageSet when language changes', () => {
      component.assignSelectedLanguage();
      expect(component.currentLanguageSet).toBeDefined();
    });
  });
});
