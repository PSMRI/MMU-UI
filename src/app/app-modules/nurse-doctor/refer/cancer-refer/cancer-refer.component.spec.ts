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
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService, MasterdataService } from '../../shared/services';
import { CancerReferComponent } from './cancer-refer.component';

describe('CancerReferComponent', () => {
  let component: CancerReferComponent;
  let fixture: ComponentFixture<CancerReferComponent>;
  let doctor: any;
  let master$: BehaviorSubject<any>;
  let session: any;

  const masterData = () => ({
    higherHealthCare: [
      { institutionID: 1, institutionName: 'AIIMS' },
      { institutionID: 2, institutionName: 'KEM' },
    ],
    additionalServices: [{ serviceName: 'ICTC' }, { serviceName: 'DOTS' }],
    referralReason: 'r',
    revisitDate: ['1 week'],
  });

  const makeForm = () =>
    new FormGroup({
      referredToInstituteID: new FormControl(null),
      refrredToAdditionalServiceList: new FormControl(null),
      revisitDate: new FormControl(null),
      referralReason: new FormControl(null),
    });

  async function setup(
    mode = '',
    sessionSeed: Record<string, any> = {},
    master: any = null
  ) {
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(master);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerReferComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            doctorMasterData$: master$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CancerReferComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    component.referForm = makeForm();
    component.referMode = mode;
    spyOn(console, 'log');
    component.ngOnInit();
  }

  afterEach(() => component?.ngOnDestroy());

  it('initialises language, dates and disables referral reason', async () => {
    await setup();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.tomorrow.getDate()).toBe(
      new Date(Date.now() + 86400000).getDate()
    );
    expect(component.maxSchedulerDate).toBeDefined();
    expect(component.referForm.get('referralReason')?.disabled).toBeTrue();
    expect(component.higherHealthcareCenter).toBeUndefined();
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('stores master data but does not fetch details outside view mode', async () => {
    await setup('', {}, masterData());
    expect(component.higherHealthcareCenter.length).toBe(2);
    expect(component.additionalServices.length).toBe(2);
    expect(component.referralReason).toBe('r');
    expect(component.revisitDate).toEqual(['1 week']);
    expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
  });

  it('does not fetch refer details in view mode unless doctorFlag is 9', async () => {
    await setup('view', { doctorFlag: '2' }, masterData());
    expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
  });

  it('fetches and patches refer details in view mode when doctorFlag is 9', async () => {
    await setup(
      'view',
      {
        doctorFlag: '9',
        beneficiaryRegID: 'b1',
        visitID: 'v1',
        visitCategory: 'Cancer Screening',
      },
      null
    );
    doctor.getCaseRecordAndReferDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          diagnosis: {
            revisitDate: '2024-01-01',
            referralReason: 'pain',
            refrredToAdditionalServiceList: ['ICTC', 'X'],
            referredToInstituteID: 2,
          },
        },
      })
    );
    master$.next(masterData());
    expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
      'b1',
      'v1',
      'Cancer Screening'
    );
    const v = component.referForm.getRawValue();
    expect(v.refrredToAdditionalServiceList).toEqual(['ICTC']);
    expect(v.referredToInstituteID).toBe(2);
    expect(v.revisitDate).toBe('2024-01-01');
    expect(v.referralReason).toBe('pain');
    expect(component.previousServiceList).toEqual(['ICTC', 'X'] as any);
  });

  it('getReferDetails ignores responses without diagnosis', async () => {
    await setup('', {}, masterData());
    spyOn(component, 'patchReferDetails');
    doctor.getCaseRecordAndReferDetails.and.returnValue(
      of({ statusCode: 200, data: {} })
    );
    component.getReferDetails(1, 2, 'c');
    doctor.getCaseRecordAndReferDetails.and.returnValue(of(null));
    component.getReferDetails(1, 2, 'c');
    expect(component.patchReferDetails).not.toHaveBeenCalled();
  });

  it('patchReferDetails handles missing service list and unknown institute', async () => {
    await setup('', {}, masterData());
    component.patchReferDetails({
      revisitDate: 'd',
      referralReason: 'rr',
      referredToInstituteID: 99,
    });
    const v = component.referForm.getRawValue();
    expect(v.refrredToAdditionalServiceList).toEqual([]);
    expect(v.referredToInstituteID).toBe(99);
    expect(v.referralReason).toBe('rr');
  });

  it('getters expose form controls', async () => {
    await setup();
    expect(component.RevisitDate).toBe(component.referForm.get('revisitDate'));
    expect(component.ReferralReason).toBe(
      component.referForm.get('referralReason')
    );
  });

  it('checkdate patches a timezone-normalised ISO date', async () => {
    await setup();
    const d = new Date(2024, 0, 15, 0, 0, 0);
    component.checkdate(d);
    const expected = new Date(
      d.getTime() - d.getTimezoneOffset() * 60000
    ).toISOString();
    expect(component.referForm.value.revisitDate).toBe(expected);
    expect(component.tomorrow).toBeDefined();
  });

  it('canDisable flags services previously referred', async () => {
    await setup();
    component.previousServiceList = null as any;
    expect(component.canDisable({ serviceName: 'ICTC' })).toBeFalse();
    component.previousServiceList = ['ICTC'] as any;
    const s1: any = { serviceName: 'ICTC' };
    const s2: any = { serviceName: 'DOTS' };
    expect(component.canDisable(s1)).toBeTrue();
    expect(s1.disabled).toBeTrue();
    expect(component.canDisable(s2)).toBeFalse();
    expect(s2.disabled).toBeFalse();
  });

  it('additionalservices toggles the referral reason validator', async () => {
    await setup();
    const ctrl = component.referForm.get('referralReason')!;
    component.additionalservices(['a']);
    expect(component.selectValue).toBe(1);
    expect(ctrl.enabled).toBeTrue();
    expect(ctrl.valid).toBeFalse();
    component.additionalservices([]);
    expect(ctrl.disabled).toBeTrue();
    component.selectValue = 3;
    component.additionalservices(null);
    expect(component.selectValue).toBe(3);
    expect(ctrl.enabled).toBeTrue();
  });

  it('higherhealthcarecenter toggles the referral reason validator', async () => {
    await setup();
    const ctrl = component.referForm.get('referralReason')!;
    component.higherhealthcarecenter(2);
    expect(ctrl.enabled).toBeTrue();
    ctrl.setValue('x');
    expect(ctrl.valid).toBeTrue();
    component.higherhealthcarecenter(0);
    expect(ctrl.disabled).toBeTrue();
  });

  it('ngOnDestroy unsubscribes', async () => {
    await setup('', {}, masterData());
    component.getReferDetails(1, 2, 3);
    const s1 = spyOn(component.doctorMasterDataSubscription, 'unsubscribe');
    const s2 = spyOn(component.referSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
  });
});
