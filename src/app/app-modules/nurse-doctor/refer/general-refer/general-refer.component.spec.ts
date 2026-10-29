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
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { GeneralReferComponent } from './general-refer.component';

describe('GeneralReferComponent', () => {
  let component: GeneralReferComponent;
  let fixture: ComponentFixture<GeneralReferComponent>;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let suspect$: BehaviorSubject<any>;
  let referral$: BehaviorSubject<any>;
  let tmc$: BehaviorSubject<any>;

  const masterData = (
    centers: any[] = [{ institutionID: 1, institutionName: 'AIIMS' }]
  ) => ({
    higherHealthCare: centers,
    additionalServices: [{ serviceName: 'ICTC' }, { serviceName: 'DOTS' }],
    revisitDate: ['1 week'],
  });

  const makeForm = () =>
    new FormGroup({
      referredToInstituteName: new FormControl(null),
      refrredToAdditionalServiceList: new FormControl(null),
      revisitDate: new FormControl(null),
      referralReason: new FormControl(null),
    });

  async function setup(
    mode = '',
    master: any = null,
    session: Record<string, any> = { visitCategory: 'NCD screening' }
  ) {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>(master);
    suspect$ = new BehaviorSubject<any>(0);
    referral$ = new BehaviorSubject<any>(0);
    tmc$ = new BehaviorSubject<any>(0);
    idrs = autoSpy(IdrsscoreService, {
      IDRSSuspectedFlag$: suspect$,
      tmcSuggestedFlag$: tmc$,
      referralSuggestedFlag$: referral$,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralReferComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: IdrsscoreService, useValue: idrs },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            doctorMasterData$: master$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GeneralReferComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    component.referForm = makeForm();
    component.referMode = mode;
    spyOn(console, 'log');
    component.ngOnInit();
  }

  afterEach(() => {
    component?.ngOnDestroy();
    sessionStorage.removeItem('suspectFlag');
    sessionStorage.removeItem('instFlag');
  });

  it('initialises language, visit category, dates and flags', async () => {
    await setup();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.visitCategory).toBe('NCD screening');
    expect(component.showMsg).toBe(0);
    expect(sessionStorage.getItem('suspectFlag')).toBe('false');
    expect(component.referForm.get('referralReason')?.disabled).toBeTrue();
    expect(component.maxSchedulerDate).toBeDefined();
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('tracks IDRS suspected / referral / tmc flags', async () => {
    await setup();
    suspect$.next(2);
    expect(component.showMsg).toBe(2);
    expect(sessionStorage.getItem('suspectFlag')).toBe('true');
    referral$.next(0);
    expect(sessionStorage.getItem('suspectFlag')).toBe('false');
    referral$.next(1);
    expect(sessionStorage.getItem('suspectFlag')).toBe('true');
    tmc$.next(1);
    expect(component.tmcSuggested).toBe(1);
  });

  it('sets institute flag from master data', async () => {
    await setup('', masterData([]));
    expect(component.instituteFlag).toBeFalse();
    expect(sessionStorage.getItem('instFlag')).toBe('false');
    master$.next(masterData());
    expect(component.instituteFlag).toBeTrue();
    expect(sessionStorage.getItem('instFlag')).toBe('true');
    expect(component.additionalServices.length).toBe(2);
    expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
  });

  it('in view mode fetches and patches refer details', async () => {
    await setup('view', null, {
      visitCategory: 'NCD care',
      beneficiaryRegID: 'b',
      visitID: 'v',
    });
    doctor.getCaseRecordAndReferDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          Refer: {
            revisitDate: '2024-03-05T10:00:00',
            referralReason: 'why',
            refrredToAdditionalServiceList: [
              { serviceName: 'ICTC' },
              { serviceName: 'none' },
            ],
            referredToInstituteID: 1,
          },
        },
      })
    );
    master$.next(masterData());
    expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
      'b',
      'v',
      'NCD care'
    );
    const v = component.referForm.getRawValue();
    expect(v.revisitDate).toBe('2024-03-05');
    expect(v.referralReason).toBe('why');
    expect(v.refrredToAdditionalServiceList).toEqual([{ serviceName: 'ICTC' }]);
    expect(v.referredToInstituteName).toEqual({
      institutionID: 1,
      institutionName: 'AIIMS',
    });
    expect(component.healthCareReferred).toBeTrue();
  });

  it('patchReferDetails without services and with unknown institute', async () => {
    await setup('', masterData());
    component.patchReferDetails({
      revisitDate: null,
      referralReason: null,
      referredToInstituteID: 42,
      referredToInstituteName: null,
    });
    expect(
      component.referForm.getRawValue().refrredToAdditionalServiceList
    ).toEqual([]);
    expect(component.healthCareReferred).toBeFalse();
  });

  it('getReferDetails ignores empty responses', async () => {
    await setup('', masterData());
    spyOn(component, 'patchReferDetails');
    doctor.getCaseRecordAndReferDetails.and.returnValue(
      of({ statusCode: 200, data: {} })
    );
    component.getReferDetails(1, 2, 3);
    expect(component.patchReferDetails).not.toHaveBeenCalled();
  });

  it('getters, checkdate and canDisable', async () => {
    await setup();
    expect(component.RevisitDate).toBe(component.referForm.get('revisitDate'));
    expect(component.ReferralReason).toBe(
      component.referForm.get('referralReason')
    );
    const d = new Date(2024, 4, 1);
    component.checkdate(d);
    expect(component.referForm.value.revisitDate).toBe(
      new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
    );
    expect(component.canDisable({ serviceName: 'a' })).toBeFalse();
    component.previousServiceList = ['a'];
    const a: any = { serviceName: 'a' };
    const b: any = { serviceName: 'b' };
    expect(component.canDisable(a)).toBeTrue();
    expect(a.disabled).toBeTrue();
    expect(component.canDisable(b)).toBeFalse();
    expect(b.disabled).toBeFalse();
  });

  it('additionalservices / higherhealthcarecenter toggle referral reason', async () => {
    await setup();
    const ctrl = component.referForm.get('referralReason')!;
    component.additionalservices(null);
    expect(ctrl.disabled).toBeTrue();
    component.additionalservices([]);
    expect(ctrl.disabled).toBeTrue();
    component.higherhealthcarecenter(null);
    component.higherhealthcarecenter({});
    expect(ctrl.disabled).toBeTrue();
    component.additionalservices([{}, {}]);
    expect(component.selectValueService).toBe(2);
    expect(ctrl.enabled).toBeTrue();
    expect(ctrl.valid).toBeFalse();
    component.selectValueService = 0;
    component.higherhealthcarecenter({ institutionName: 'AIIMS' });
    expect(component.selectValue).toBe(1);
    expect(component.healthCareReferred).toBeTrue();
    expect(ctrl.enabled).toBeTrue();
  });

  describe('getPreviousReferralHistory', () => {
    beforeEach(async () =>
      setup('', null, { visitCategory: 'ANC', beneficiaryRegID: 'r1' })
    );

    it('opens dialog when history exists', () => {
      const data = { data: [{ a: 1 }] };
      nurse.getPreviousReferredHistory.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.getPreviousReferralHistory();
      expect(nurse.getPreviousReferredHistory).toHaveBeenCalledWith(
        'r1',
        'ANC'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.previousReferralHistoryDetails,
        },
      });
    });

    it('alerts when no history', () => {
      nurse.getPreviousReferredHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } })
      );
      component.getPreviousReferralHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.Referdetails.previousReferralhistorynotAvailable
      );
    });

    it('alerts on non-200 and on error', () => {
      nurse.getPreviousReferredHistory.and.returnValue(
        of({ statusCode: 500, data: null })
      );
      component.getPreviousReferralHistory();
      nurse.getPreviousReferredHistory.and.returnValue(throwingObs());
      component.getPreviousReferralHistory();
      expect(confirm.alert.calls.allArgs()).toEqual([
        ['Error in fetching previous history', 'error'],
        ['Error in fetching previous history', 'error'],
      ]);
    });
  });

  it('ngOnDestroy clears IDRS flags and unsubscribes', async () => {
    await setup('', masterData());
    component.getReferDetails(1, 2, 3);
    const u = spyOn(component.referSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(u).toHaveBeenCalled();
    expect(idrs.clearSuspectedArrayFlag).toHaveBeenCalled();
    expect(idrs.clearTMCSuggested).toHaveBeenCalled();
    expect(idrs.clearReferralSuggested).toHaveBeenCalled();
  });
});
