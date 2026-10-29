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

import { SystemicExaminationComponent } from './systemic-examination.component';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('SystemicExaminationComponent', () => {
  let component: SystemicExaminationComponent;
  let fixture: ComponentFixture<SystemicExaminationComponent>;
  let tracking: any;
  let form: FormGroup;
  const serviceLineDetails = JSON.stringify({ vanID: 1, parkingPlaceID: 2 });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SystemicExaminationComponent],
      providers: [...commonTestProviders({ session: { serviceLineDetails } })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemicExaminationComponent);
    component = fixture.componentInstance;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => serviceLineDetails,
    } as any).createSystemicExaminationForm();
    component.systemicExaminationDataForm = form;
  });

  function expectSubForms() {
    expect(component.gastroIntestinalSystemForm).toBe(
      form.get('gastroIntestinalSystemForm') as FormGroup
    );
    expect(component.cardioVascularSystemForm).toBe(
      form.get('cardioVascularSystemForm') as FormGroup
    );
    expect(component.respiratorySystemForm).toBe(
      form.get('respiratorySystemForm') as FormGroup
    );
    expect(component.centralNervousSystemForm).toBe(
      form.get('centralNervousSystemForm') as FormGroup
    );
    expect(component.musculoSkeletalSystemForm).toBe(
      form.get('musculoSkeletalSystemForm') as FormGroup
    );
    expect(component.genitoUrinarySystemForm).toBe(
      form.get('genitoUrinarySystemForm') as FormGroup
    );
  }

  it('ANC init adds the obstetric form and renders it', () => {
    component.visitCategory = 'ANC';
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.displayANC).toBeTrue();
    expect(component.displayGeneral).toBeFalse();
    expect(form.get('obstetricExaminationForANCForm')).toBeTruthy();
    expect(component.obstetricExaminationForANCForm).toBe(
      form.get('obstetricExaminationForANCForm') as FormGroup
    );
    expect(form.value.obstetricExaminationForANCForm.vanID).toBe(1);
    expectSubForms();
    const el: HTMLElement = fixture.nativeElement;
    expect(
      el.querySelector('app-nurse-anc-obstetric-examination')
    ).not.toBeNull();
    expect(el.querySelector('app-nurse-gastro-intestinal-system')).toBeNull();
  });

  ['General OPD', 'PNC'].forEach(cat => {
    it(`${cat} init shows the general systems`, () => {
      component.visitCategory = cat;
      fixture.detectChanges();
      expect(component.displayANC).toBeFalse();
      expect(component.displayGeneral).toBeTrue();
      expect(component.obstetricExaminationForANCForm).toBeNull();
      expectSubForms();
      const el: HTMLElement = fixture.nativeElement;
      expect(
        el.querySelector('app-nurse-gastro-intestinal-system')
      ).not.toBeNull();
      expect(
        el.querySelector('app-nurse-genito-urinary-system')
      ).not.toBeNull();
    });
  });

  it('other categories show neither section', () => {
    component.visitCategory = 'NCD Care';
    fixture.detectChanges();
    expect(component.displayANC).toBeFalse();
    expect(component.displayGeneral).toBeFalse();
  });

  it('ngOnChanges adds obstetric form for ANC', () => {
    component.visitCategory = 'ANC';
    component.ngOnChanges();
    expect(component.displayANC).toBeTrue();
    expect(form.get('obstetricExaminationForANCForm')).toBeTruthy();
    expect(component.obstetricExaminationForANCForm).toBeTruthy();
  });

  it('ngOnChanges removes obstetric form and shows general for PNC', () => {
    component.visitCategory = 'ANC';
    component.ngOnChanges();
    component.visitCategory = 'PNC';
    component.ngOnChanges();
    expect(component.displayANC).toBeFalse();
    expect(component.displayGeneral).toBeTrue();
    expect(form.get('obstetricExaminationForANCForm')).toBeNull();
  });

  it('ngOnChanges for General OPD sets displayGeneral', () => {
    component.visitCategory = 'General OPD';
    component.ngOnChanges();
    expect(component.displayGeneral).toBeTrue();
  });

  it('ngOnChanges for other categories leaves displayGeneral unset', () => {
    component.visitCategory = 'Cancer Screening';
    component.ngOnChanges();
    expect(component.displayANC).toBeFalse();
    expect(component.displayGeneral).toBeFalsy();
    expectSubForms();
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    component.trackFieldInteraction('Spine');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Spine',
      'Systemic Examination'
    );
  });
});
