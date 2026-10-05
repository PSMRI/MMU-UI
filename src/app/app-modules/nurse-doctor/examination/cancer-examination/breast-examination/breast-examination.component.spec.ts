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
import { BehaviorSubject, of } from 'rxjs';

import { BreastExaminationComponent } from './breast-examination.component';
import { CameraService } from '../../../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { MaterialModule } from '../../../../core/material.module';
import { CancerUtils } from '../../../shared/utility/cancer-utility';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('BreastExaminationComponent', () => {
  let component: BreastExaminationComponent;
  let fixture: ComponentFixture<BreastExaminationComponent>;
  let camera: any;
  let benDetails$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    benDetails$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [BreastExaminationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: CameraService, useValue: autoSpy(CameraService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BreastExaminationComponent);
    component = fixture.componentInstance;
    camera = TestBed.inject(CameraService) as any;
    form = new CancerUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createBreastExaminationForm();
    component.breastExaminationForm = form;
  });

  it('creates with language and treats unknown gender as not female', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.female).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('[formControlName="everBreastFed"]')
    ).toBeNull();
  });

  ['FEMALE', 'transgender'].forEach(g => {
    it(`shows breast-feeding questions for ${g}`, () => {
      benDetails$.next({ genderName: g });
      fixture.detectChanges();
      expect(component.female).toBeTrue();
      expect(
        fixture.nativeElement.querySelector('[formControlName="everBreastFed"]')
      ).not.toBeNull();
    });
  });

  it('keeps female false for male beneficiaries', () => {
    benDetails$.next({ genderName: 'Male' });
    fixture.detectChanges();
    expect(component.female).toBeFalse();
  });

  it('exposes getters', () => {
    expect(component.everBreastFed).toBe(form.get('everBreastFed'));
    expect(component.lumpInBreast).toBe(form.get('lumpInBreast'));
  });

  it('checkBreastFeed resets the duration', () => {
    form.patchValue({ breastFeedingDurationGTE6months: true });
    component.checkBreastFeed();
    expect(form.value.breastFeedingDurationGTE6months).toBeNull();
  });

  it('checkLump resets lump size, shape and texture', () => {
    form.patchValue({ lumpSize: 'a', lumpShape: 'b', lumpTexture: 'c' });
    component.checkLump();
    expect(form.value.lumpSize).toBeNull();
    expect(form.value.lumpShape).toBeNull();
    expect(form.value.lumpTexture).toBeNull();
  });

  it('renders lump details when a lump is present', () => {
    fixture.detectChanges();
    form.patchValue({ lumpInBreast: true });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[formControlName="lumpSize"]')
    ).not.toBeNull();
  });

  it('annotateImage stores points with imageID 2', () => {
    fixture.detectChanges();
    camera.annotate.and.returnValue(of({ markers: [5] }));
    (
      fixture.nativeElement.querySelector('#annotateBreastImg') as HTMLElement
    ).click();
    expect(camera.annotate).toHaveBeenCalledWith(
      'assets/images/breastExamination.png',
      null,
      LANGUAGE_EN
    );
    expect(form.value.image).toEqual({ markers: [5], imageID: 2 });
    expect(form.dirty).toBeTrue();
  });

  it('annotateImage ignores an empty result', () => {
    fixture.detectChanges();
    camera.annotate.and.returnValue(of(false));
    component.annotateImage();
    expect(form.value.image).toBeNull();
  });

  it('ngOnDestroy unsubscribes a stored subscription', () => {
    fixture.detectChanges();
    // getBeneficiaryDetails never assigns beneficiarySubs (current behaviour)
    expect(component.beneficiarySubs).toBeUndefined();
    const sub = { unsubscribe: jasmine.createSpy('unsubscribe') };
    component.beneficiarySubs = sub;
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
});
