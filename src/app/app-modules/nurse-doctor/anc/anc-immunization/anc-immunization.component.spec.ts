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
import { AncImmunizationComponent } from './anc-immunization.component';

describe('AncImmunizationComponent', () => {
  let component: AncImmunizationComponent;
  let fixture: ComponentFixture<AncImmunizationComponent>;
  let ben$: BehaviorSubject<any>;

  const keys = [
    'tT_1Status',
    'dateReceivedForTT_1',
    'facilityNameOfTT_1',
    'tT_2Status',
    'dateReceivedForTT_2',
    'facilityNameOfTT_2',
    'tT_3Status',
    'dateReceivedForTT_3',
    'facilityNameOfTT_3',
    'vanID',
    'parkingPlaceID',
  ];
  const makeForm = () => {
    const g: any = {};
    keys.forEach(k => (g[k] = new FormControl('x')));
    return new FormGroup(g);
  };
  const form = () => component.patientANCImmunizationForm;

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncImmunizationComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 5, parkingPlaceID: 6 }),
          },
        }),
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AncImmunizationComponent);
    component = fixture.componentInstance;
    component.patientANCImmunizationForm = makeForm();
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('beneficiary details set age and dob', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.dob).toBeUndefined();
    ben$.next({ ageVal: 25 });
    expect(component.beneficiaryAge).toBe(25);
    expect(component.dob.getFullYear()).toBe(new Date().getFullYear() - 25);
  });

  it('ngOnChanges in new mode resets form keeping van ids', () => {
    component.gravidaStatus = true;
    component.ngOnChanges({});
    expect(component.enableTTStatus_1_2).toBeTrue();
    expect(component.enableTTStatus_1_2_b).toBeFalse();
    expect(form().value.tT_1Status).toBeNull();
    expect(form().value.vanID).toBe(5);
    expect(form().value.parkingPlaceID).toBe(6);
  });

  it('ngOnChanges in view/update mode keeps values', () => {
    for (const mode of ['view', 'UPDATE']) {
      component.mode = mode;
      component.gravidaStatus = false;
      component.ngOnChanges({});
      expect(component.enableTTStatus_1_2_b).toBeTrue();
      expect(component.enableTTStatus_1_2).toBeFalse();
      expect(form().value.tT_1Status).toBe('x');
    }
    component.gravidaStatus = null;
    component.checkStatus();
    expect(component.enableTTStatus_1_2_b).toBeFalse();
    expect(component.enableTTStatus_1_2).toBeFalse();
  });

  it('checkTT_1Status clears all dependent fields', () => {
    component.checkTT_1Status('Received');
    const v = form().value;
    keys
      .filter(k => !['tT_1Status', 'vanID', 'parkingPlaceID'].includes(k))
      .forEach(k => expect(v[k]).withContext(k).toBeNull());
    expect(component.tT_1Status).toBe('x');
    expect(component.checkedTT_1Status).toBeFalse();
  });

  it('checkTT_1Date / checkTT_2Date clear later fields', () => {
    component.checkTT_2Date(null);
    expect(form().value.facilityNameOfTT_2).toBeNull();
    expect(form().value.tT_2Status).toBe('x');
    component.checkTT_1Date(null);
    expect(form().value.tT_2Status).toBeNull();
    expect(form().value.dateReceivedForTT_1).toBe('x');
  });

  it('checkTT_2Status sets TT1 min date from TT1 date or dob', () => {
    ben$.next({ ageVal: 20 });
    component.checkTT_2Status('Received');
    expect(component.tT_1Date).toBe('x');
    expect(form().value.tT_3Status).toBeNull();
    form().patchValue({ dateReceivedForTT_1: null });
    component.checkTT_2Status('Received');
    expect(component.tT_1Date).toBe(component.dob);
    component.tT_1Date = 'keep';
    component.checkTT_2Status('Not Received');
    expect(component.tT_1Date).toBe('keep');
    expect(component.tT_2Status).toBe('x');
  });

  it('checkTT_3Status picks the latest received dose date', () => {
    ben$.next({ ageVal: 20 });
    const d1 = new Date(2024, 0, 1);
    const d2 = new Date(2024, 1, 1);
    form().patchValue({
      tT_1Status: 'Received',
      dateReceivedForTT_1: d1,
      tT_2Status: 'Received',
      dateReceivedForTT_2: d2,
    });
    component.checkTT_3Status('Received');
    expect(component.tT_3Date).toBe(d2);
    expect(form().value.dateReceivedForTT_3).toBeNull();

    form().patchValue({ tT_2Status: 'Not Received' });
    component.checkTT_3Status('Received');
    expect(component.tT_3Date).toBe(d1);

    form().patchValue({ tT_1Status: 'NA' });
    component.checkTT_3Status('Received');
    expect(component.tT_3Date).toBe(component.dob);

    component.tT_3Date = 'keep';
    component.checkTT_3Status('NA');
    expect(component.tT_3Date).toBe('keep');
    expect(component.tT_3Status).toBe('x');
  });

  it('ngOnDestroy unsubscribes', () => {
    const u = spyOn(component.beneficiaryDetailsSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(u).toHaveBeenCalled();
  });
});
