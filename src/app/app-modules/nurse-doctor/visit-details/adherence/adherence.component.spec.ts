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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { DoctorService } from '../../shared/services';
import { AdherenceComponent } from './adherence.component';

describe('AdherenceComponent', () => {
  let component: AdherenceComponent;
  let fixture: ComponentFixture<AdherenceComponent>;
  let doctor: any;

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AdherenceComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(AdherenceComponent, '');
    fixture = TestBed.createComponent(AdherenceComponent);
    component = fixture.componentInstance;
    component.patientAdherenceForm = new FormGroup({
      toDrugs: new FormControl(null),
      drugReason: new FormControl('old drug'),
      toReferral: new FormControl(null),
      referralReason: new FormControl('old ref'),
      progress: new FormControl(null),
    });
  });

  it('ngOnInit and ngDoCheck set the language', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.adherenceProgressData).toEqual([
      'Improved',
      'Unchanged',
      'Worsened',
    ]);
  });

  it('ngOnChanges in view mode patches adherence details', () => {
    doctor.getVisitComplaintDetails.and.returnValue(
      of({
        statusCode: 200,
        data: { BenAdherence: { toDrugs: true, drugReason: 'none' } },
      })
    );
    component.mode = 'view';
    component.ngOnChanges();
    expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('b1', 'v1');
    expect(component.toDrugs).toBeTrue();
    expect(component.drugReason).toBe('none');
  });

  it('does not patch on non-200 response', () => {
    doctor.getVisitComplaintDetails.and.returnValue(
      of({ statusCode: 5000, data: { BenAdherence: { toDrugs: true } } })
    );
    component.getAdherenceDetails('b1', 'v1');
    expect(component.toDrugs).toBeNull();
  });

  it('does not patch when BenAdherence is null', () => {
    doctor.getVisitComplaintDetails.and.returnValue(
      of({ statusCode: 200, data: { BenAdherence: null } })
    );
    component.getAdherenceDetails('b1', 'v1');
    expect(component.toDrugs).toBeNull();
  });

  it('ngOnChanges outside view mode does nothing', () => {
    component.mode = 'add';
    component.ngOnChanges();
    expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
  });

  it('checkReferralDescription clears reason only when truthy', () => {
    component.checkReferralDescription(false);
    expect(component.referralReason).toBe('old ref');
    component.checkReferralDescription(true);
    expect(component.referralReason).toBeNull();
    expect(component.toReferral).toBeNull();
  });

  it('checkDrugsDescription clears reason only when truthy', () => {
    component.checkDrugsDescription(false);
    expect(component.drugReason).toBe('old drug');
    component.checkDrugsDescription(true);
    expect(component.drugReason).toBeNull();
  });
});
