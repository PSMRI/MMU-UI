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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { CovidDiagnosisComponent } from './covid-diagnosis.component';
import { DoctorService } from '../../../../shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CovidDiagnosisComponent', () => {
  let component: CovidDiagnosisComponent;
  let fixture: ComponentFixture<CovidDiagnosisComponent>;
  let doctorService: any;
  let session: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CovidDiagnosisComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CovidDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CovidDiagnosisComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService) as any;
    doctorService = TestBed.inject(DoctorService) as any;
    component.generalDiagnosisForm = new FormGroup({
      doctorDiagnosis: new FormControl(null),
      specialistDiagnosis: new FormControl(null),
    });
  });

  it('enables doctor diagnosis for a non-specialist', () => {
    session.setItem('designation', 'Doctor');
    fixture.detectChanges();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.specialist).toBeFalse();
    expect(component.doctorDaignosis?.enabled).toBeTrue();
    expect(component.specialistDaignosis?.enabled).toBeTrue();
  });

  it('enables specialist diagnosis for TC Specialist', () => {
    session.setItem('designation', 'TC Specialist');
    fixture.detectChanges();
    expect(component.specialist).toBeTrue();
    expect(component.doctorDaignosis?.disabled).toBeTrue();
    expect(component.specialistDaignosis?.enabled).toBeTrue();
  });

  it('refreshes language on ngDoCheck', () => {
    fixture.detectChanges();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('fetches and patches diagnosis in view mode', () => {
    session.setItem('beneficiaryRegID', 'B1');
    session.setItem('visitID', 'V1');
    session.setItem('visitCategory', 'COVID-19 Screening');
    doctorService.getCaseRecordAndReferDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          diagnosis: { doctorDiagnonsis: 'Covid', specialistDiagnosis: 'S' },
        },
      })
    );
    fixture.detectChanges();
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    expect(doctorService.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
      'B1',
      'V1',
      'COVID-19 Screening'
    );
    expect(component.generalDiagnosisForm.get('doctorDiagnosis')?.value).toBe(
      'Covid'
    );
    expect(
      component.generalDiagnosisForm.get('specialistDiagnosis')?.value
    ).toBe('S');
  });

  it('ignores responses without diagnosis or with a non-200 status', () => {
    fixture.detectChanges();
    component.caseRecordMode = 'view';
    doctorService.getCaseRecordAndReferDetails.and.returnValue(
      of({ statusCode: 200, data: {} })
    );
    component.ngOnChanges();
    doctorService.getCaseRecordAndReferDetails.and.returnValue(
      of({ statusCode: 500, data: { diagnosis: { doctorDiagnonsis: 'X' } } })
    );
    component.ngOnChanges();
    doctorService.getCaseRecordAndReferDetails.and.returnValue(of(null));
    component.ngOnChanges();
    expect(component.generalDiagnosisForm.value.doctorDiagnosis).toBeNull();
  });

  it('does not fetch outside view mode and has no ngOnDestroy to release the subscription', () => {
    component.caseRecordMode = 'edit';
    component.ngOnChanges();
    expect(doctorService.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    expect(component.diagnosisSubscription).toBeUndefined();
    expect((component as any).ngOnDestroy).toBeUndefined();
  });
});
