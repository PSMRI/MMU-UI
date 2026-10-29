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

import { GeneralExaminationComponent } from './general-examination.component';
import { MaterialModule } from '../../../../core/material.module';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('GeneralExaminationComponent', () => {
  let component: GeneralExaminationComponent;
  let fixture: ComponentFixture<GeneralExaminationComponent>;
  let session: any;
  let tracking: any;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GeneralExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralExaminationComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new GeneralUtils(new FormBuilder(), {
      getItem: () => JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    } as any).createGeneralExaminationForm();
    component.generalExaminationDataForm = form;
  });

  it('creates and loads language', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.selectDangerSigns.length).toBe(13);
  });

  it('shows ANC-only fields when visiCategoryANC is ANC', () => {
    session.setItem('visiCategoryANC', 'ANC');
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.visitCategory).toBe('ANC');
    expect(component.hideForANCAndQC).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('[formControlName="quickening"]')
    ).not.toBeNull();
  });

  it('shows ANC-only fields when visitCategory is ANC', () => {
    session.setItem('visitCategory', 'ANC');
    component.ngOnChanges();
    expect(component.hideForANCAndQC).toBeTrue();
  });

  it('hides ANC-only fields for other visits', () => {
    session.setItem('visitCategory', 'General OPD');
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.hideForANCAndQC).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('[formControlName="quickening"]')
    ).toBeNull();
  });

  it('checkWithDangerSign clears danger sign types', () => {
    form.patchValue({ typeOfDangerSigns: ['Stridor'] });
    component.checkWithDangerSign();
    expect(form.value.typeOfDangerSigns).toBeNull();
  });

  it('checkWithLymphadenopathy clears lymph node fields', () => {
    form.patchValue({
      lymphnodesInvolved: ['a'],
      typeOfLymphadenopathy: ['b'],
    });
    component.checkWithLymphadenopathy();
    expect(form.value.lymphnodesInvolved).toBeNull();
    expect(form.value.typeOfLymphadenopathy).toBeNull();
  });

  it('checkWithEdema clears edema fields', () => {
    form.patchValue({ extentOfEdema: ['Foot'], edemaType: 'Pitting' });
    component.checkWithEdema();
    expect(form.value.extentOfEdema).toBeNull();
    expect(form.value.edemaType).toBeNull();
  });

  it('getters return control values', () => {
    form.patchValue({
      dangerSigns: 'Yes',
      edema: 'Yes',
      lymphadenopathy: 'No',
      typeOfDangerSigns: ['Grunt'],
      extentOfEdema: ['Leg'],
      lymphnodesInvolved: ['Axillary LN'],
      typeOfLymphadenopathy: ['Soft'],
      edemaType: 'Non Pitting',
      quickening: 'Yes',
      foetalMovements: 'Normal',
    });
    expect(component.dangerSigns).toBe('Yes');
    expect(component.edema).toBe('Yes');
    expect(component.lymphadenopathy).toBe('No');
    expect(component.typeOfDangerSigns).toEqual(['Grunt']);
    expect(component.extentOfEdema).toEqual(['Leg']);
    expect(component.lymphnodesInvolved).toEqual(['Axillary LN']);
    expect(component.typeOfLymphadenopathy).toEqual(['Soft']);
    expect(component.edemaType).toBe('Non Pitting');
    expect(component.quickening).toBe('Yes');
    expect(component.foetalmovements).toBe('Normal');
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    component.trackFieldInteraction('Pallor');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Pallor',
      'General Examination'
    );
  });
});
