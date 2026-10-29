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
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { DoctorService, MasterdataService } from '../../shared/services';
import { PatientVisitDetailsComponent } from './visit-details.component';

describe('PatientVisitDetailsComponent', () => {
  let component: PatientVisitDetailsComponent;
  let fixture: ComponentFixture<PatientVisitDetailsComponent>;
  let master: any;
  let doctor: any;
  let session: any;
  let tracking: any;
  let visitMaster$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;

  const categories = [
    { visitCategory: 'ANC' },
    { visitCategory: 'PNC' },
    { visitCategory: 'NCD screening' },
    { visitCategory: 'Cancer Screening' },
    { visitCategory: 'COVID-19 Screening' },
    { visitCategory: 'General OPD' },
  ];
  const masterData = {
    visitReasons: [{ visitReason: 'New Chief Complaint' }],
    visitCategories: categories,
  };

  const buildForm = () =>
    new FormGroup({
      visitReason: new FormControl(null),
      visitCategory: new FormControl(null),
      pregnancyStatus: new FormControl(null),
      rCHID: new FormControl(null),
      subVisitCategory: new FormControl(null),
    });

  beforeEach(async () => {
    visitMaster$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>(null);
    master = autoSpy(MasterdataService, {
      visitDetailMasterData$: visitMaster$,
    });
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PatientVisitDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: SetLanguageComponent, useValue: {} },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(PatientVisitDetailsComponent, '');
    fixture = TestBed.createComponent(PatientVisitDetailsComponent);
    component = fixture.componentInstance;
    component.patientVisitDetailsForm = buildForm();
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
    spyOn(console, 'log');
  });

  afterEach(() => component.ngOnDestroy());

  it('ngOnInit loads language and subscribes to beneficiary details', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.beneficiary).toBeUndefined();
    expect(component.beneficiaryDetailsSubscription).toBeTruthy();
  });

  it('ngDoCheck refreshes the language set', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('getBenificiaryDetails', () => {
    beforeEach(() => component.ngOnInit());

    it('hides pregnancy status for males and filters ANC/PNC for adult males', () => {
      beneficiary$.next({ genderName: 'Male', ageVal: 40 });
      visitMaster$.next(masterData);
      expect(component.beneficiaryGender).toBe('Male');
      expect(component.showPregnancyStatus).toBeFalse();
      expect(component.templateVisitReasons).toEqual(masterData.visitReasons);
      expect(
        component.templateFilterVisitCategories.map((c: any) => c.visitCategory)
      ).toEqual([
        'NCD screening',
        'Cancer Screening',
        'COVID-19 Screening',
        'General OPD',
      ]);
      expect(component.visitReason).toBe('New Chief Complaint');
      expect(component.visitCategory).toBe('NCD screening');
    });

    it('hides pregnancy status for females under 19', () => {
      beneficiary$.next({ genderName: 'Female', ageVal: 15 });
      visitMaster$.next(masterData);
      expect(component.showPregnancyStatus).toBeFalse();
      expect(component.templateFilterVisitCategories).toBe(categories);
      expect(component.visitCategory).toBeNull();
    });

    it('shows pregnancy status for adult females and keeps all categories', () => {
      beneficiary$.next({ genderName: 'Female', ageVal: 35 });
      visitMaster$.next(masterData);
      expect(component.showPregnancyStatus).toBeTrue();
      expect(component.templateFilterVisitCategories).toEqual(categories);
      expect(component.templateFilterVisitCategories).not.toBe(categories);
      expect(component.visitCategory).toBe('NCD screening');
    });

    it('does not auto-select categories in view mode', () => {
      component.mode = 'view';
      beneficiary$.next({ genderName: 'Female', ageVal: 35 });
      visitMaster$.next(masterData);
      expect(component.templateFilterVisitCategories).toBe(categories);
      expect(component.visitReason).toBeNull();
    });

    it('ignores null master data', () => {
      beneficiary$.next({ genderName: 'Female', ageVal: 35 });
      expect(component.templateNurseMasterData).toBeUndefined();
    });
  });

  describe('reasonSelected', () => {
    beforeEach(() => {
      component.templateVisitCategories = categories;
    });

    it('filters screening categories', () => {
      component.reasonSelected('Screening');
      expect(
        component.templateFilterVisitCategories.map((c: any) => c.visitCategory)
      ).toEqual(['NCD screening', 'Cancer Screening', 'COVID-19 Screening']);
    });

    it('filters COVID categories for Pandemic', () => {
      component.reasonSelected('Pandemic');
      expect(component.templateFilterVisitCategories).toEqual([
        { visitCategory: 'COVID-19 Screening' },
      ]);
    });

    it('removes ANC/PNC for males', () => {
      component.beneficiary = { genderName: 'Male', ageVal: 40 };
      component.reasonSelected('Other');
      expect(component.templateFilterVisitCategories.length).toBe(4);
    });

    it('removes ANC/PNC for children under 12', () => {
      component.beneficiary = { genderName: 'Female', ageVal: 8 };
      component.reasonSelected('Other');
      expect(
        component.templateFilterVisitCategories.some(
          (c: any) => c.visitCategory === 'ANC'
        )
      ).toBeFalse();
    });

    it('keeps a copy of all categories for adult females', () => {
      component.beneficiary = { genderName: 'Female', ageVal: 25 };
      component.reasonSelected('Other');
      expect(component.templateFilterVisitCategories).toEqual(categories);
    });
  });

  describe('checkCategoryDependent', () => {
    it('forces pregnancy status Yes for ANC', () => {
      component.patientVisitDetailsForm.patchValue({ rCHID: 'R1' });
      component.checkCategoryDependent('ANC');
      expect(session.setItem).toHaveBeenCalledWith('visiCategoryANC', 'ANC');
      expect(component.templatePregnancyStatus).toEqual(['Yes']);
      expect(component.pregnancyStatus).toBe('Yes');
      expect(component.rCHID).toBeNull();
    });

    it('resets pregnancy options for other categories', () => {
      component.patientVisitDetailsForm.patchValue({ pregnancyStatus: 'Yes' });
      component.checkCategoryDependent('PNC');
      expect(component.templatePregnancyStatus).toEqual([
        'Yes',
        'No',
        "Don't Know",
      ]);
      expect(component.pregnancyStatus).toBeNull();
    });
  });

  describe('ngOnChanges / getVisitDetails', () => {
    const cases: [string, string][] = [
      ['Cancer Screening', 'benVisitDetails'],
      ['General OPD (QC)', 'benVisitDetails'],
      ['ANC', 'ANCNurseVisitDetail'],
      ['General OPD', 'GOPDNurseVisitDetail'],
      ['NCD screening', 'NCDScreeningNurseVisitDetail'],
      ['NCD care', 'NCDCareNurseVisitDetail'],
      ['PNC', 'PNCNurseVisitDetail'],
      ['COVID-19 Screening', 'covid19NurseVisitDetail'],
    ];
    cases.forEach(([category, key]) => {
      it(`patches the form from ${key} for ${category}`, () => {
        session.store.set('visitCategory', category);
        doctor.getVisitComplaintDetails.and.returnValue(
          of({
            statusCode: 200,
            data: {
              [key]: { visitReason: 'Follow Up', rCHID: 'R9', files: [7] },
            },
          })
        );
        component.mode = 'view';
        component.ngOnChanges();
        expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith(
          'b1',
          'v1'
        );
        expect(doctor.fileIDs).toEqual([7]);
        expect(component.visitReason).toBe('Follow Up');
        expect(component.rCHID).toBe('R9');
      });
    });

    it('does nothing when response is not 200', () => {
      session.store.set('visitCategory', 'ANC');
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 5000, data: null })
      );
      component.getVisitDetails('v1', 'b1');
      expect(component.visitReason).toBeNull();
      expect(doctor.fileIDs).toBeUndefined();
    });

    it('does nothing for a null response', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of(null));
      component.getVisitDetails('v1', 'b1');
      expect(component.visitReason).toBeNull();
    });

    it('does not fetch when mode is not view', () => {
      component.mode = 'add';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy unsubscribes all subscriptions', () => {
    const subs = [1, 2, 3].map(() =>
      jasmine.createSpyObj('sub', ['unsubscribe'])
    );
    component.visitCategorySubscription = subs[0];
    component.visitDetailsSubscription = subs[1];
    component.beneficiaryDetailsSubscription = subs[2];
    component.ngOnDestroy();
    subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
  });

  it('trackFieldInteraction forwards to tracking service', () => {
    component.trackFieldInteraction('Visit Reason');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Visit Reason',
      'Visit Details'
    );
  });
});
