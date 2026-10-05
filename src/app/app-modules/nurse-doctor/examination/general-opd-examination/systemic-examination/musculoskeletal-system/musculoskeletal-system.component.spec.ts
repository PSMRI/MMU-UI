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

import { MusculoskeletalSystemComponent } from './musculoskeletal-system.component';
import { MaterialModule } from '../../../../../core/material.module';
import { MasterdataService } from '../../../../shared/services';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('MusculoskeletalSystemComponent', () => {
  let component: MusculoskeletalSystemComponent;
  let fixture: ComponentFixture<MusculoskeletalSystemComponent>;
  let tracking: any;
  let masterData$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [MusculoskeletalSystemComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MusculoskeletalSystemComponent);
    component = fixture.componentInstance;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createMusculoSkeletalSystemForm();
    component.musculoSkeletalSystemDataForm = form;
    fixture.detectChanges();
  });

  it('creates, loads language and keeps empty joint types without master data', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.selectTypeOfJoint).toEqual([]);
  });

  it('loads joint types from nurse master data', () => {
    const jointTypes = [{ name: 'Knee', id: 1 }];
    masterData$.next({ jointTypes });
    expect(component.selectTypeOfJoint).toEqual(jointTypes);
  });

  it('exposes laterality and abnormality options', () => {
    expect(component.selectJointLaterality.length).toBe(3);
    expect(component.selectUpperLimbsAbnormality.map(o => o.name)).toContain(
      'Deformity'
    );
    expect(component.selectLowerLimbsLaterality[2].name).toBe('Bilateral');
  });

  it('binds the spine input to the form', () => {
    const input = fixture.nativeElement.querySelector(
      '[formControlName="spine"]'
    ) as HTMLInputElement;
    input.value = 'Kyphosis';
    input.dispatchEvent(new Event('input'));
    expect(form.value.spine).toBe('Kyphosis');
  });

  it('unsubscribes master data on destroy', () => {
    const sub = component.nurseMasterDataSubscription;
    spyOn(sub, 'unsubscribe').and.callThrough();
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('ngOnDestroy is safe without a subscription', () => {
    component.nurseMasterDataSubscription = undefined;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    component.trackFieldInteraction('Spine');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Spine',
      'Musculoskeletal System Examination'
    );
  });
});
