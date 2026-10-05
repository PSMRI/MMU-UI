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
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { RegistrationComponent } from './registration.component';

describe('RegistrationComponent (edit with wrong/missing beneficiary)', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let registrar: any;
  let router: Router;
  let confirmation: any;

  function setup(editData: any) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(null),
      beneficiaryEditDetails$: new BehaviorSubject<any>(editData),
    });
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegistrationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { beneficiaryID: '12345' } } },
        },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    confirmation = TestBed.inject(ConfirmationService) as any;
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  afterEach(() => fixture.destroy());

  it('redirects to search with an info alert when no data is available', fakeAsync(() => {
    setup(null);
    fixture.detectChanges();
    expect(component.patientRevisit).toBeTrue();
    expect(component.revisitData).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    flush();
    expect(confirmation.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.issueInFetchDetails,
      'info'
    );
  }));

  it('redirects when the stored beneficiary does not match the route id', fakeAsync(() => {
    setup({ beneficiaryID: '999' });
    fixture.detectChanges();
    expect(component.revisitData).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    flush();
  }));

  it('clears edit details on destroy', fakeAsync(() => {
    setup(null);
    fixture.detectChanges();
    flush();
    component.ngOnDestroy();
    expect(registrar.clearBeneficiaryEditDetails).toHaveBeenCalled();
  }));
});
