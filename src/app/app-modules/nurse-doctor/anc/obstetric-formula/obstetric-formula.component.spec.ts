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
import { SimpleChange } from '@angular/core';
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
import { MasterdataService } from '../../shared/services';
import { ObstetricFormulaComponent } from './obstetric-formula.component';

describe('ObstetricFormulaComponent', () => {
  let component: ObstetricFormulaComponent;
  let fixture: ComponentFixture<ObstetricFormulaComponent>;
  let confirm: any;
  let ben$: BehaviorSubject<any>;
  let master$: BehaviorSubject<any>;
  const info = LANGUAGE_EN.alerts.info;

  const makeForm = () =>
    new FormGroup({
      gravida_G: new FormControl(null),
      termDeliveries_T: new FormControl(2),
      pretermDeliveries_P: new FormControl(1),
      livebirths_L: new FormControl(3),
      abortions_A: new FormControl(null),
      stillBirth: new FormControl(null),
      bloodGroup: new FormControl(null),
    });
  const form = () => component.obstetricFormulaForm;
  const change = { gravidaStatus: new SimpleChange(null, true, true) };

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ObstetricFormulaComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: master$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ObstetricFormulaComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    component.obstetricFormulaForm = makeForm();
    component.ngOnInit();
    component.ngDoCheck();
  });

  afterEach(() => component.beneficiaryDetailsSubscription?.unsubscribe());

  it('loads blood groups then patches beneficiary blood group', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.beneficiaryDetailsSubscription).toBeUndefined();
    master$.next({ bloodGroups: ['A+', 'B+'] });
    expect(component.selectBloodGroupType).toEqual(['A+', 'B+']);
    ben$.next({ bloodGroup: 'A+' });
    expect(form().value.bloodGroup).toBe('A+');
    expect(component.bloodGroup).toBe('A+');
    expect(component.disableBloodGroup).toBeTrue();
  });

  it("does not disable blood group for Don't Know, or patch when absent", () => {
    master$.next({ bloodGroups: [] });
    ben$.next({ bloodGroup: "Don't Know" });
    expect(form().value.bloodGroup).toBe("Don't Know");
    expect(component.disableBloodGroup).toBeFalse();
    ben$.next({});
    expect(form().value.bloodGroup).toBe("Don't Know");
  });

  it('does not patch blood group in view mode', () => {
    component.mode = 'view';
    master$.next({ bloodGroups: [] });
    ben$.next({ bloodGroup: 'O+' });
    expect(form().value.bloodGroup).toBeNull();
  });

  it('ngOnChanges resets counts for primigravida', () => {
    component.gravidaStatus = true;
    component.ngOnChanges(change);
    expect(form().value).toEqual(
      jasmine.objectContaining({
        gravida_G: 1,
        termDeliveries_T: null,
        pretermDeliveries_P: null,
        livebirths_L: null,
        abortions_A: null,
        stillBirth: null,
      })
    );
  });

  it('ngOnChanges calculates gravida when not primigravida, ignores other changes', () => {
    component.gravidaStatus = false;
    component.ngOnChanges(change);
    expect(component.gravida_G).toBe(4);
    form().patchValue({ gravida_G: 99 });
    component.ngOnChanges({});
    expect(component.gravida_G).toBe(99);
  });

  it('calculateGravida sums all pregnancies and alerts on outliers', () => {
    form().patchValue({ abortions_A: 6, stillBirth: 10 });
    component.calculateGravida('abortions_A');
    expect(component.gravida_G).toBe(20);
    component.calculateGravida('stillBirth');
    component.calculateGravida('termDeliveries_T');
    expect(confirm.alert.calls.allArgs()).toEqual([
      [info.recheckValue],
      [info.recheckValue],
    ]);
    form().patchValue({ abortions_A: 1, stillBirth: 1 });
    component.calculateGravida('abortions_A');
    component.calculateGravida('stillBirth');
    expect(confirm.alert).toHaveBeenCalledTimes(2);
    expect(component.gravida_G).toBe(6);
    expect(component.abortions_A).toBe(1);
    expect(component.stillBirth).toBe(1);
  });

  it('range checks alert only for large values', () => {
    component.checkLivingChildren(9);
    component.checkAbortions(5);
    component.checkStillBirth(9);
    expect(confirm.alert).not.toHaveBeenCalled();
    component.checkLivingChildren(10);
    component.checkAbortions(6);
    component.checkStillBirth(10);
    expect(confirm.alert.calls.allArgs()).toEqual([
      [info.recheckValue],
      [info.valueRange],
      ['value can not be greater than 9'],
    ]);
    expect(component.livebirths_L).toBe(3);
    expect(component.termDeliveries_T).toBe(2);
    expect(component.pretermDeliveries_P).toBe(1);
  });
});
