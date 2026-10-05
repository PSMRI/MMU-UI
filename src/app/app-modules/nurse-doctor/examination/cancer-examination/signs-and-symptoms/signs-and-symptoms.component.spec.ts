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
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { SignsAndSymptomsComponent } from './signs-and-symptoms.component';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { MaterialModule } from '../../../../core/material.module';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('SignsAndSymptomsComponent', () => {
  let component: SignsAndSymptomsComponent;
  let fixture: ComponentFixture<SignsAndSymptomsComponent>;
  let benDetails$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    benDetails$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [SignsAndSymptomsComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SignsAndSymptomsComponent);
    component = fixture.componentInstance;
    form = new CancerUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createSignsForm();
    component.signsForm = form;
  });

  it('creates, loads language and fills the lymph node table source', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.dataSource.data.length).toBe(9);
    expect(component.female).toBeFalse();
    expect(component.female18).toBeFalse();
    expect(component.female30).toBeFalse();
  });

  it('sets female flags for a 35 year old female', () => {
    benDetails$.next({ genderName: 'Female', ageVal: 35 });
    fixture.detectChanges();
    expect(component.female).toBeTrue();
    expect(component.female18).toBeTrue();
    expect(component.female30).toBeTrue();
    expect(
      fixture.nativeElement.querySelectorAll('mat-radio-group').length
    ).toBeGreaterThan(5);
  });

  it('sets only female/female18 for a 20 year old female', () => {
    benDetails$.next({ genderName: 'female', ageVal: 20 });
    fixture.detectChanges();
    expect(component.female).toBeTrue();
    expect(component.female18).toBeTrue();
    expect(component.female30).toBeFalse();
  });

  it('treats transgender as female without age flags', () => {
    benDetails$.next({ genderName: 'Transgender', ageVal: 40 });
    fixture.detectChanges();
    expect(component.female).toBeTrue();
    expect(component.female18).toBeFalse();
    expect(component.female30).toBeFalse();
  });

  it('resets female flags when gender changes to male', () => {
    benDetails$.next({ genderName: 'Female', ageVal: 40 });
    fixture.detectChanges();
    benDetails$.next({ genderName: 'Male', ageVal: 40 });
    expect(component.female).toBeFalse();
    expect(component.female30).toBeFalse();
  });

  it('exposes getters', () => {
    expect(component.observation).toBe(form.get('observation'));
    form.patchValue({ lymphNode_Enlarged: true });
    expect(component.lymphNode_Enlarged).toBeTrue();
    expect(component.lymphNodes.length).toBe(9);
  });

  it('getLymphNodes returns controls or null', () => {
    expect(component.getLymphNodes()!.length).toBe(9);
    component.signsForm = new FormGroup({});
    expect(component.getLymphNodes()).toBeNull();
  });

  it('checkLymph resets lymph node values when not enlarged', () => {
    const nodes = form.get('lymphNodes')!;
    nodes.patchValue([{ size_Left: '<3 cm' }]);
    component.checkLymph(false);
    expect(nodes.value[0].size_Left).toBeNull();
    expect(component.dataSource.data.length).toBe(9);
  });

  it('checkLymph keeps values when enlarged', () => {
    const nodes = form.get('lymphNodes')!;
    nodes.patchValue([{ size_Left: '<3 cm' }]);
    component.checkLymph(true);
    expect(nodes.value[0].size_Left).toBe('<3 cm');
  });

  it('checkLymph sets empty data source without lymphNodes array', () => {
    component.dataSource.data = [1];
    component.signsForm = new FormGroup({});
    component.checkLymph(true);
    // MatTableDataSource normalises the null it is given to []
    expect(component.dataSource.data).toEqual([]);
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    const sub = component.beneficiaryDetailsSubs;
    spyOn(sub, 'unsubscribe').and.callThrough();
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('ngOnDestroy is safe before init', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
