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
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';
import { ServiceComponent } from './service.component';
import { SetLanguageComponent } from '../core/components/set-language.component';
import { ConfirmationService } from '../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

const SERVICES = [
  {
    providerServiceID: 101,
    serviceName: 'MMU',
    serviceID: 2,
    apimanClientKey: 'api-key',
  },
];

function loginData(overrides: any = {}) {
  return {
    designation: { designationName: 'Nurse' },
    previlegeObj: [
      {
        serviceName: 'MMU',
        roles: [
          {
            serviceRoleScreenMappings: [
              { screen: { screenName: 'Registrar' } },
              { screen: { screenName: 'Nurse' } },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('ServiceComponent', () => {
  let component: ServiceComponent;
  let fixture: ComponentFixture<ServiceComponent>;
  let session: any;
  let confirmation: any;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ServiceComponent],
      providers: [
        ...commonTestProviders({
          session: {
            services: JSON.stringify(SERVICES),
            fullName: 'Nurse One',
          },
        }),
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    session = TestBed.inject(SessionStorageService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('loads services, name and language on init and renders them', () => {
    expect(component.servicesList).toEqual(SERVICES);
    expect(component.fullName).toBe('Nurse One');
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nurse One');
    expect(text).toContain('MMU');
  });

  it('ngDoCheck refreshes the language set', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
  });

  describe('selectService', () => {
    it('stores service details and routes to servicePoint when designation matches a role', () => {
      session.store.set('loginDataResponse', JSON.stringify(loginData()));
      fixture.nativeElement.querySelector('.circle').click();
      expect(session.setItem).toHaveBeenCalledWith('providerServiceID', 101);
      expect(session.setItem).toHaveBeenCalledWith('serviceName', 'MMU');
      expect(session.setItem).toHaveBeenCalledWith('serviceID', 2);
      expect(sessionStorage.getItem('apimanClientKey')).toBe('api-key');
      expect(session.setItem).toHaveBeenCalledWith(
        'role',
        JSON.stringify(['Registrar', 'Nurse'])
      );
      expect(session.setItem).toHaveBeenCalledWith('designation', 'Nurse');
      expect(router.navigate).toHaveBeenCalledWith(['/servicePoint']);
    });

    it('alerts when designation is not one of the roles', () => {
      session.store.set(
        'loginDataResponse',
        JSON.stringify(
          loginData({ designation: { designationName: 'Doctor' } })
        )
      );
      component.selectService(SERVICES[0]);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapDesignation,
        'error'
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts when no designation is mapped', () => {
      session.store.set(
        'loginDataResponse',
        JSON.stringify(loginData({ designation: null }))
      );
      component.selectService(SERVICES[0]);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapDesignation,
        'error'
      );
    });

    it('does nothing when login data has no privileges', () => {
      spyOn(component, 'checkMappedRoleForService');
      session.store.set(
        'loginDataResponse',
        JSON.stringify(loginData({ previlegeObj: null }))
      );
      component.selectService(SERVICES[0]);
      component.checkRoleAndDesingnationMappedForservice(null, SERVICES[0]);
      expect(component.checkMappedRoleForService).not.toHaveBeenCalled();
    });
  });

  describe('checkMappedRoleForService', () => {
    it('alerts when roles missing', () => {
      component.checkMappedRoleForService({});
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error'
      );
    });

    it('alerts when roles empty', () => {
      component.checkMappedRoleForService({ roles: [] });
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error'
      );
    });

    it('alerts when roles have no screen mappings', () => {
      spyOn(component, 'checkMappedDesignation');
      component.checkMappedRoleForService({
        roles: [{ serviceRoleScreenMappings: [] }],
      });
      expect(component.roleArray).toEqual([]);
      expect(component.checkMappedDesignation).not.toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error'
      );
    });
  });

  it('routeToDesignation always navigates to servicePoint', () => {
    component.routeToDesignation('Doctor');
    expect(router.navigate).toHaveBeenCalledWith(['/servicePoint']);
  });
});
