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
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService, MasterdataService } from '../shared/services';
import { TmVisitDetailsComponent } from './tm-visit-details.component';

describe('TmVisitDetailsComponent', () => {
  let component: TmVisitDetailsComponent;
  let fixture: ComponentFixture<TmVisitDetailsComponent>;
  let doctor: any;
  let session: any;
  let router: any;

  const makeForm = () =>
    new FormGroup({
      patientVisitDetailsForm: new FormGroup({
        visitCategory: new FormControl(null),
        visitReason: new FormControl(null),
        subVisitCategory: new FormControl(null),
      }),
      tmcConfirmationForm: new FormGroup({
        tmcConfirmed: new FormControl(false),
      }),
    });

  const benData = { VisitCategory: 'NCD screening', VisitReason: 'Screening' };

  async function setup(
    seed: Record<string, any>,
    preg: any = { statusCode: 200, data: null }
  ) {
    doctor = autoSpy(DoctorService);
    doctor.getPregVisitComplaintDetails.and.returnValue(of(preg));
    router = {
      url: '/nurse-doctor/attendant/nurse',
      navigate: jasmine.createSpy('navigate'),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TmVisitDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitCategory: 'NCD screening',
            visitID: 'v1',
            beneficiaryRegID: 'b1',
            beneficiaryData: JSON.stringify(benData),
            ...seed,
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TmVisitDetailsComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    component.patientVisitForm = makeForm();
    component.ngOnInit();
  }

  afterEach(() => {
    sessionStorage.removeItem('selectTMC');
    sessionStorage.removeItem('specialist_flag');
    sessionStorage.removeItem('beneficiaryData');
  });

  it('patches visit details from beneficiary data and pregnancy status', async () => {
    await setup(
      {},
      {
        statusCode: 200,
        data: { NCDScreeningNurseVisitDetail: { subVisitCategory: 'sub' } },
      }
    );
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.visitCategory).toBe('NCD screening');
    expect(doctor.getPregVisitComplaintDetails).toHaveBeenCalledWith(
      'b1',
      'v1',
      'NCD screening'
    );
    expect(component.patientVisitDetailsForm.value).toEqual({
      visitCategory: 'NCD screening',
      visitReason: 'Screening',
      subVisitCategory: 'sub',
    });
    expect(component.tmcConfirmationForm.value.tmcConfirmed).toBeFalse();
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('marks TMC confirmed when selectTMC is set', async () => {
    const rm = spyOn(sessionStorage, 'removeItem').and.callThrough();
    await setup({ selectTMC: true });
    expect(component.tmcConfirmationForm.value.tmcConfirmed).toBeTrue();
    expect(rm).toHaveBeenCalledWith('selectTMC');
  });

  it('ignores null / non-200 pregnancy responses', async () => {
    await setup({}, null);
    expect(component.patientVisitDetailsForm.value.subVisitCategory).toBeNull();
    doctor.getPregVisitComplaintDetails.and.returnValue(
      of({ statusCode: 500 })
    );
    component.getPregnancyStatus();
    expect(component.patientVisitDetailsForm.value.subVisitCategory).toBeNull();
  });

  it('getVisitDetails skips patch when no beneficiary data', async () => {
    await setup({});
    session.store.set('beneficiaryData', 'null');
    component.patientVisitForm = makeForm();
    component.getVisitDetails();
    expect(component.beneficiaryData).toBeNull();
    expect(
      component.patientVisitForm.get('patientVisitDetailsForm')?.value
        .visitCategory
    ).toBeNull();
  });

  it('ngOnDestroy on print page keeps TMC selection', async () => {
    await setup({});
    router.url = '/nurse-doctor/print/MMU/current';
    doctor.prescribedDrugData = 'x';
    component.ngOnDestroy();
    expect(session.setItem).toHaveBeenCalledWith('selectTMC', 'true');
    expect(doctor.prescribedDrugData).toBe('x');
  });

  it('ngOnDestroy elsewhere clears data and unsubscribes', async () => {
    await setup({});
    const rm = spyOn(sessionStorage, 'removeItem').and.callThrough();
    const u = spyOn(component.visitDetailsPregSubscription, 'unsubscribe');
    doctor.prescribedDrugData = 'x';
    component.ngOnDestroy();
    expect(rm).toHaveBeenCalledWith('specialist_flag');
    expect(rm).toHaveBeenCalledWith('beneficiaryData');
    expect(u).toHaveBeenCalled();
    expect(doctor.prescribedDrugData).toBeNull();
    component.visitDetailsPregSubscription = null;
    component.ngOnDestroy();
    expect(doctor.prescribedDrugData).toBeNull();
  });

  it('conditionCheck stores category and resets hideAll', async () => {
    await setup({});
    component.hideAll = true;
    component.conditionCheck();
    expect(session.setItem).toHaveBeenCalledWith(
      'visiCategoryANC',
      'NCD screening'
    );
    expect(component.hideAll).toBeFalse();
    component.hideAll = true;
    component.visitCategory = 'ANC';
    component.mode = 'view';
    component.conditionCheck();
    expect(component.hideAll).toBeFalse();
  });
});
