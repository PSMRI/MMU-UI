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

describe('RegistrationComponent (edit beneficiary mode)', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let registrar: any;
  let router: Router;
  const BEN = { beneficiaryID: '12345', firstName: 'Sita' };

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(null),
      beneficiaryEditDetails$: new BehaviorSubject<any>(BEN),
    });
    await TestBed.configureTestingModule({
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
    }).compileComponents();
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads in revisit mode with the beneficiary data copied', () => {
    expect(component.patientRevisit).toBeTrue();
    expect(component.revisitData).toEqual(BEN);
    expect(component.revisitData).not.toBe(BEN);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not set master data while master subject is null', () => {
    expect(component.masterData).toBeUndefined();
    expect(component.govIDMaster).toBeUndefined();
  });

  it('shows Update and Cancel buttons and hides Reset', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#saveButton')).not.toBeNull();
    expect(el.querySelector('#cancelButton')).not.toBeNull();
    expect(el.querySelector('#resetButton')).toBeNull();
    expect(el.querySelector('h3')?.textContent).toContain(
      LANGUAGE_EN.bendetails.edit
    );
  });

  it('update button calls updateBeneficiaryDetails', () => {
    spyOn(component, 'updateBeneficiaryDetails');
    (fixture.nativeElement.querySelector('#saveButton') as HTMLElement).click();
    expect(component.updateBeneficiaryDetails).toHaveBeenCalled();
  });

  it('cancel button calls cancelBeneficiaryChanges', () => {
    const confirmation = TestBed.inject(ConfirmationService) as any;
    (
      fixture.nativeElement.querySelector('#cancelButton') as HTMLElement
    ).click();
    expect(confirmation.confirm).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
  });

  it('ngOnDestroy unsubscribes and clears edit details', () => {
    const sub = component.revisitDataSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    expect(registrar.clearBeneficiaryEditDetails).toHaveBeenCalled();
  });

  it('ngOnDestroy skips clearing when there is no subscription', () => {
    component.revisitDataSubscription = null;
    component.ngOnDestroy();
    expect(registrar.clearBeneficiaryEditDetails).not.toHaveBeenCalled();
  });

  it('redirects if a different beneficiary is later emitted', fakeAsync(() => {
    registrar.beneficiaryEditDetails$.next({ beneficiaryID: 'other' });
    expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    flush();
  }));
});
