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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { AncDetailsComponent } from './anc-details.component';

describe('AncDetailsComponent', () => {
  let component: AncDetailsComponent;
  let fixture: ComponentFixture<AncDetailsComponent>;
  let confirm: any;
  let ben$: BehaviorSubject<any>;
  const DAY = 24 * 60 * 60 * 1000;

  const makeForm = () =>
    new FormGroup({
      lmpDate: new FormControl(null),
      duration: new FormControl(5),
      expDelDt: new FormControl(null),
      gestationalAgeOrPeriodofAmenorrhea_POA: new FormControl(null),
      trimesterNumber: new FormControl(null),
      primiGravida: new FormControl(true),
    });
  const asMoment = (d: Date) => ({ toDate: () => d });

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncDetailsComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AncDetailsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    component.patientANCDetailsForm = makeForm();
    component.ngOnInit();
    component.ngDoCheck();
  });

  afterEach(() => component.ngOnDestroy());

  it('initialises dates, language and tracks beneficiary age', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.today).toBeDefined();
    expect(component.beneficiaryAge).toBeUndefined();
    ben$.next({ ageVal: 24 });
    expect(component.beneficiaryAge).toBe(24);
  });

  it('checkupLMP with a valid date computes EDD, gestational age and trimester', () => {
    const lmp = new Date(component.today.getTime() - 70 * DAY);
    component.checkupLMP(asMoment(lmp));
    const v = component.patientANCDetailsForm.value;
    expect(v.lmpDate).toBe(lmp);
    expect(v.duration).toBeNull();
    const edd = new Date(lmp);
    edd.setDate(lmp.getDate() + 280);
    expect(v.expDelDt).toEqual(edd);
    expect(v.gestationalAgeOrPeriodofAmenorrhea_POA).toBe(10);
    expect(v.trimesterNumber).toBe(1);
    expect(confirm.alert).not.toHaveBeenCalled();
  });

  it('checkupLMP with an out-of-range date alerts and clears values', () => {
    component.patientANCDetailsForm.patchValue({
      trimesterNumber: 2,
      expDelDt: 'x',
    });
    component.checkupLMP(asMoment(new Date(Date.now() + 5 * DAY)));
    const v = component.patientANCDetailsForm.value;
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.invalidVal
    );
    expect(v.lmpDate).toBeNull();
    expect(v.expDelDt).toBeNull();
    expect(v.gestationalAgeOrPeriodofAmenorrhea_POA).toBeNull();
    expect(v.trimesterNumber).toBeNull();
  });

  it('calculateTrimester maps weeks to trimesters', () => {
    const t = (w: any) => {
      component.calculateTrimester(w);
      return component.patientANCDetailsForm.value.trimesterNumber;
    };
    expect(t(5)).toBe(1);
    expect(t(12)).toBe(2);
    expect(t(20)).toBe(2);
    expect(t(27)).toBe(3);
    expect(t(35)).toBe(3);
    expect(t(null)).toBeNull();
  });

  it('checkPeriodOfPregnancy validates range', () => {
    component.checkPeriodOfPregnancy(5);
    expect(confirm.alert).not.toHaveBeenCalled();
    expect(component.duration).toBe(5);
    component.checkPeriodOfPregnancy(10);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.invalidValue
    );
    expect(component.duration).toBeNull();
    component.checkPeriodOfPregnancy(0);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.common.invalidValueMorethan
    );
  });

  it('getters read the form', () => {
    component.patientANCDetailsForm.patchValue({
      lmpDate: 'd',
      gestationalAgeOrPeriodofAmenorrhea_POA: 8,
    });
    expect(component.primiGravida).toBeTrue();
    expect(component.lmpDate).toBe('d');
    expect(component.gestationalAgeOrPeriodofAmenorrhea_POA).toBe(8);
  });

  it('ngOnDestroy unsubscribes', () => {
    const u = spyOn(component.beneficiaryDetailsSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(u).toHaveBeenCalled();
  });
});
