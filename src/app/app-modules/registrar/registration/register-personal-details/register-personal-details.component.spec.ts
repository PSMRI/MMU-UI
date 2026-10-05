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
import * as moment from 'moment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CameraService } from '../../../core/services/camera.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { RegisterPersonalDetailsComponent } from './register-personal-details.component';

const MARITAL = [
  { maritalStatusID: 1, status: 'Unmarried' },
  { maritalStatusID: 2, status: 'Married' },
  { maritalStatusID: 5, status: 'Widow' },
  { maritalStatusID: 6, status: 'Widower' },
  { maritalStatusID: 7, status: 'NA' },
];
const MASTER = {
  maritalStatusMaster: MARITAL,
  genderMaster: [
    { genderID: 1, genderName: 'Male' },
    { genderID: 2, genderName: 'Female' },
    { genderID: 3, genderName: 'Transgender' },
  ],
  incomeMaster: [
    { incomeStatusID: 1, incomeStatus: 'APL' },
    { incomeStatusID: 2, incomeStatus: 'BPL' },
  ],
  occupationMaster: [
    { occupationID: 1, occupationType: 'Farmer' },
    { occupationID: 7, occupationType: 'Other' },
  ],
  qualificationMaster: [
    { educationID: 1, educationType: 'Primary' },
    { educationID: 2, educationType: 'Graduate' },
  ],
};

function revisit(over: any = {}) {
  return {
    beneficiaryID: 'B1',
    beneficiaryRegID: 77,
    firstName: 'Ram',
    lastName: 'K',
    benAccountID: 4,
    dOB: '1990-01-01T00:00:00.000Z',
    benPhoneMaps: [
      {
        phoneNo: '9876543210',
        parentBenRegID: 70,
        benRelationshipID: 1,
        benPhMapID: 3,
        benRelationshipType: { benRelationshipType: 'Self' },
      },
    ],
    m_gender: { genderID: 1, genderName: 'Male' },
    maritalStatus: { maritalStatusID: 2, status: 'Married' },
    spouseName: 'Sita',
    ageAtMarriage: 20,
    literacyStatus: 'Literate',
    i_bendemographics: {
      incomeStatus: 'BPL',
      i_beneficiaryeducation: { educationID: 2, educationType: 'Graduate' },
      occupationID: 1,
      occupationName: 'Farmer',
    },
    monthlyFamilyIncome: 1000,
    ...over,
  };
}

describe('RegisterPersonalDetailsComponent', () => {
  let component: RegisterPersonalDetailsComponent;
  let fixture: ComponentFixture<RegisterPersonalDetailsComponent>;
  let registrar: any;
  let confirmation: any;
  let camera: any;
  let benDetails: any;
  let tracking: any;
  let form: FormGroup;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(null),
      beneficiaryEditDetails$: new BehaviorSubject<any>(null),
    });
    camera = {
      capture: jasmine.createSpy('capture').and.returnValue(of('img')),
    };
    benDetails = autoSpy(BeneficiaryDetailsService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegisterPersonalDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
        { provide: CameraService, useValue: camera },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(RegisterPersonalDetailsComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(RegisterPersonalDetailsComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
    form = new RegistrationUtils(new FormBuilder()).createPersonalDetailsForm();
    component.personalDetailsForm = form;
  });

  afterEach(() => fixture.destroy());

  describe('ngOnInit (new registration)', () => {
    beforeEach(() => fixture.detectChanges());

    it('sets defaults, limits, language and calendar config', () => {
      expect(component.isMobileNoRequired).toBeTrue();
      expect(component.isOccuptionRequired).toBeTrue();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(form.value.ageUnit).toBe('Years');
      expect(form.value.checked).toBeTrue();
      expect(component.today).toEqual(jasmine.any(Date));
      expect(
        component.today.getFullYear() - component.minDate.getFullYear()
      ).toBe(121);
      expect(component.bsConfig).toEqual({
        containerClass: 'theme-dark-blue',
        dateInputFormat: 'DD/MM/YYYY',
        showWeekNumbers: false,
      });
      expect(component.masterData).toBeUndefined();
    });

    it('stores master data but does not load edit data when not revisit', () => {
      registrar.registrationMasterDetails$.next(MASTER);
      expect(component.masterData).toBe(MASTER);
      expect(component.revisitDataSubscription).toBeUndefined();
    });

    it('ngOnDestroy unsubscribes master subscription', () => {
      const sub = component.masterDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('revisit mode', () => {
    beforeEach(() => {
      component.patientRevisit = true;
      spyOn(component, 'dobChangeByCalender');
      fixture.detectChanges();
    });

    it('loads beneficiary edit data once master and edit data exist', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({ benImage: 'IMG' }));
      registrar.beneficiaryEditDetails$.next(revisit());
      registrar.registrationMasterDetails$.next(MASTER);
      expect(component.revisitData.beneficiaryID).toBe('B1');
      expect(form.value.firstName).toBe('Ram');
      expect(form.value.phoneNo).toBe('9876543210');
      expect(form.value.parentRegID).toBe('70');
      expect(form.value.parentRelation).toBe('1');
      expect(form.value.benPhMapID).toBe('3');
      expect(form.value.benRelationshipType).toBe('Self');
      expect(form.value.gender).toBe(1);
      expect(form.value.maritalStatus).toBe(2);
      expect(form.value.maritalStatusName).toBe('Married');
      expect(form.value.income).toBe(2);
      expect(form.value.incomeName).toBe('BPL');
      expect(form.value.educationQualification).toBe(2);
      expect(form.value.occupationOther).toBe('Farmer');
      expect(form.value.image).toBe('IMG');
      expect(component.enableMarriageDetails).toBeTrue();
      expect(component._parentBenRegID).toBe('70');
      expect(component.dobChangeByCalender).toHaveBeenCalledWith(undefined);
      expect(benDetails.getBeneficiaryImage).toHaveBeenCalledWith(77);
      // male: widow(5) filtered out
      expect(
        component.maritalStatusMaster.map((m: any) => m.maritalStatusID)
      ).toEqual([1, 2, 6, 7]);
    });

    it('ignores edit data without beneficiaryID', () => {
      registrar.beneficiaryEditDetails$.next({ foo: 1 });
      registrar.registrationMasterDetails$.next(MASTER);
      expect(component.revisitData).toBeUndefined();
    });

    it('ngOnDestroy unsubscribes both subscriptions', () => {
      registrar.registrationMasterDetails$.next(MASTER);
      const sub = component.revisitDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
      expect(component.masterDataSubscription.closed).toBeTrue();
    });
  });

  describe('pushEditingDatatoForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.masterData = MASTER;
    });

    it('clears marriage details for unmarried beneficiaries and handles empty phone maps', () => {
      spyOn(component, 'dobChangeByCalender');
      component.pushEditingDatatoForm(
        revisit({
          benPhoneMaps: [],
          maritalStatus: { maritalStatusID: 1, status: 'Unmarried' },
          spouseName: 'X',
          ageAtMarriage: 18,
          i_bendemographics: {},
          literacyStatus: null,
        })
      );
      expect(form.value.phoneNo).toBeNull();
      expect(form.value.parentRegID).toBe('null');
      expect(form.value.benRelationshipType).toBe('null');
      expect(form.value.income).toBeNull();
      expect(form.value.educationQualification).toBeNull();
      expect(form.value.occupation).toBeNull();
      expect(component.enableMarriageDetails).toBeFalse();
      expect(form.value.spouseName).toBeNull();
      expect(form.value.ageAtMarriage).toBeNull();
      expect(component._parentBenRegID).toBe('null');
    });

    it('status 7 also disables marriage details; missing marital status name becomes "null"', () => {
      spyOn(component, 'dobChangeByCalender');
      component.pushEditingDatatoForm(
        revisit({ maritalStatus: { maritalStatusID: 7 } })
      );
      expect(component.enableMarriageDetails).toBeFalse();
      expect(form.value.maritalStatusName).toBe('null');
    });

    it('currently throws because dobChangeByCalender(undefined) dereferences undefined', () => {
      // documents app bug: (dobval || dobval.length === 10) with dobval undefined
      expect(() => component.pushEditingDatatoForm(revisit())).toThrowError(
        TypeError
      );
    });
  });

  describe('validateMaritalStatusMaster', () => {
    beforeEach(() => (component.masterData = MASTER));
    it('transgender gets full list', () => {
      component.validateMaritalStatusMaster({ m_gender: { genderID: 3 } });
      expect(component.maritalStatusMaster).toBe(MARITAL);
    });
    it('female excludes widower(6)', () => {
      component.validateMaritalStatusMaster({ m_gender: { genderID: 2 } });
      expect(
        component.maritalStatusMaster.map((m: any) => m.maritalStatusID)
      ).toEqual([1, 2, 5, 7]);
    });
    it('unknown gender gives empty list', () => {
      component.validateMaritalStatusMaster({ m_gender: { genderID: 9 } });
      expect(component.maritalStatusMaster).toEqual([]);
    });
  });

  describe('getBenImage', () => {
    beforeEach(() => (component.revisitData = { beneficiaryRegID: 5 }));
    it('does not patch without image', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({}));
      component.getBenImage();
      expect(form.value.image).toBeNull();
    });
    it('handles null response', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of(null));
      component.getBenImage();
      expect(form.value.image).toBeNull();
    });
  });

  it('getPhoneMaps returns first phone or null', () => {
    expect(component.getPhoneMaps([{ phoneNo: '1' }])).toBe('1');
    expect(component.getPhoneMaps([])).toBeNull();
    expect(component.getPhoneMaps(null)).toBeNull();
  });

  describe('captureImage', () => {
    it('patches image in new mode without change flag', () => {
      component.captureImage();
      expect(form.value.image).toBe('img');
      expect(form.value.imageChangeFlag).toBeFalse();
    });
    it('sets change flag in revisit mode', () => {
      component.patientRevisit = true;
      component.captureImage();
      expect(form.value.imageChangeFlag).toBeTrue();
      expect(form.value.image).toBe('img');
    });
    it('does nothing when capture is cancelled', () => {
      camera.capture.and.returnValue(of(null));
      component.captureImage();
      expect(form.value.image).toBeNull();
    });
  });

  it('checkbox handlers toggle the required flags', () => {
    component.checkMobileNoIsRequired({ checked: false });
    expect(component.isMobileNoRequired).toBeFalse();
    component.checkMobileNoIsRequired({ checked: true });
    expect(component.isMobileNoRequired).toBeTrue();
    component.checkOccuptionsRequired({ checked: false });
    expect(component.isOccuptionRequired).toBeFalse();
    component.checkOccuptionsRequired({ checked: true });
    expect(component.isOccuptionRequired).toBeTrue();
    component.checkFingerPrintIsRequired({ checked: false });
    expect(component.isFingerPrintRequired).toBeFalse();
    component.checkFingerPrintIsRequired({ checked: true });
    expect(component.isFingerPrintRequired).toBeTrue();
  });

  describe('onGenderSelected', () => {
    beforeEach(() => (component.masterData = MASTER));

    it('male sets gender name and filters widow', () => {
      form.patchValue({ gender: 1 });
      component.onGenderSelected();
      expect(form.value.genderName).toBe('Male');
      expect(component.maritalStatusMaster.length).toBe(4);
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });

    it('transgender confirmed gets full marital list', () => {
      form.patchValue({ gender: 3 });
      component.onGenderSelected();
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        'You have selected Transgender, please confirm'
      );
      expect(component.maritalStatusMaster).toBe(MARITAL);
      expect(form.value.genderName).toBe('Transgender');
    });

    it('transgender declined clears gender', () => {
      confirmation.confirm.and.returnValue(of(false));
      form.patchValue({ gender: 3 });
      component.onGenderSelected();
      expect(form.value.gender).toBeNull();
      expect(form.value.genderName).toBeNull();
    });

    it('transgender confirm error is swallowed', () => {
      confirmation.confirm.and.returnValue(throwingObs());
      form.patchValue({ gender: 3 });
      component.onGenderSelected();
      expect(form.value.gender).toBe(3);
    });
  });

  describe('changeLiteracyStatus', () => {
    it('resets education qualification when Literate', () => {
      form.patchValue({
        literacyStatus: 'Literate',
        educationQualification: 2,
      });
      component.changeLiteracyStatus();
      expect(form.value.educationQualification).toBeNull();
    });
    it('leaves it for Illiterate', () => {
      form.patchValue({
        literacyStatus: 'Illiterate',
        educationQualification: 2,
      });
      component.changeLiteracyStatus();
      expect(form.value.educationQualification).toBe(2);
    });
  });

  describe('getParentDetails', () => {
    it('sets parent from search results', () => {
      registrar.identityQuickSearch.and.returnValue(
        of([{ benPhoneMaps: [{ parentBenRegID: 42 }] }])
      );
      form.patchValue({ phoneNo: '9876543210' });
      component.getParentDetails();
      expect(registrar.identityQuickSearch).toHaveBeenCalledWith({
        beneficiaryRegID: null,
        beneficiaryID: null,
        phoneNo: '9876543210',
      });
      expect(form.value.parentRegID).toBe(42);
      expect(form.value.parentRelation).toBe(11);
    });

    it('sets self relation when no results (new mode)', () => {
      registrar.identityQuickSearch.and.returnValue(of([]));
      form.patchValue({ phoneNo: '9876543210' });
      component.getParentDetails();
      expect(form.value.parentRegID).toBeNull();
      expect(form.value.parentRelation).toBe(1);
    });

    it('uses own regID as parent when no results in revisit mode', () => {
      component.patientRevisit = true;
      registrar.identityQuickSearch.and.returnValue(of([{ benPhoneMaps: [] }]));
      form.patchValue({ phoneNo: '9876543210', beneficiaryRegID: 88 });
      component.getParentDetails();
      expect(form.value.parentRegID).toBe(88);
      expect(form.value.parentRelation).toBe(1);
    });

    it('alerts and clears on search error', () => {
      registrar.identityQuickSearch.and.returnValue(throwingObs('err'));
      form.patchValue({ phoneNo: '9876543210' });
      component.getParentDetails();
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
      expect(form.value.phoneNo).toBeNull();
      expect(form.value.parentRelation).toBe(1);
    });

    it('clears when phone number is not 10 digits (new mode)', () => {
      form.patchValue({ phoneNo: '123', parentRegID: 5, parentRelation: 1 });
      component.getParentDetails();
      expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
      expect(form.value.parentRegID).toBeNull();
      expect(form.value.parentRelation).toBeNull();
      expect(form.value.phoneNo).toBeNull();
    });

    it('restores saved parent when phone invalid in revisit mode', () => {
      component.patientRevisit = true;
      component._parentBenRegID = '70';
      form.patchValue({ phoneNo: null });
      component.getParentDetails();
      expect(form.value.parentRegID).toBe('70');
      expect(form.value.parentRelation).toBeNull();
    });
  });

  describe('age handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onAgeEntered rejects ages over the limit', () => {
      form.patchValue({ age: 150, ageUnit: 'Years' });
      component.onAgeEntered();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.ageRestriction,
        'info'
      );
      expect(form.value.age).toBeNull();
    });

    it('onAgeEntered computes dob and enables marital status for adults', () => {
      form.patchValue({ age: 30, ageUnit: 'Years' });
      component.onAgeEntered();
      const years = moment().diff(moment(form.value.dob), 'years');
      expect(years).toBe(30);
      expect(component.enableMaritalStatus).toBeTrue();
    });

    it('onAgeEntered with child age disables and clears marital status', () => {
      form.patchValue({
        age: 5,
        ageUnit: 'Years',
        maritalStatus: 2,
        maritalStatusName: 'Married',
        spouseName: 'S',
      });
      component.onAgeEntered();
      expect(component.enableMaritalStatus).toBeFalse();
      expect(form.value.maritalStatus).toBeNull();
      expect(form.value.spouseName).toBeNull();
      expect(component.enableMarriageDetails).toBeFalse();
    });

    it('onAgeEntered with no age only re-evaluates eligibility', () => {
      form.patchValue({ age: null, dob: null });
      component.onAgeEntered();
      expect(form.value.dob).toBeNull();
      expect(component.enableMaritalStatus).toBeFalse();
    });

    it('onAgeUnitEntered only recalculates when age is set', () => {
      spyOn(component, 'onAgeEntered');
      form.patchValue({ age: null });
      component.onAgeUnitEntered();
      expect(component.onAgeEntered).not.toHaveBeenCalled();
      form.patchValue({ age: 3 });
      component.onAgeUnitEntered();
      expect(component.onAgeEntered).toHaveBeenCalled();
    });
  });

  describe('dobChangeByCalender', () => {
    beforeEach(() => fixture.detectChanges());

    it('sets age in years', () => {
      component.dateForCalendar = moment()
        .subtract(25, 'years')
        .subtract(10, 'days')
        .toDate();
      component.dobChangeByCalender('x');
      expect(form.value.age).toBe(25);
      expect(form.value.ageUnit).toBe('Years');
      expect(component.enableMaritalStatus).toBeTrue();
    });

    it('sets age in months', () => {
      component.dateForCalendar = moment()
        .subtract(3, 'months')
        .subtract(5, 'days')
        .toDate();
      component.dobChangeByCalender('x');
      expect(form.value.ageUnit).toBe('Months');
      expect(form.value.age).toBeGreaterThan(0);
    });

    it('sets age in days', () => {
      component.dateForCalendar = moment().subtract(5, 'days').toDate();
      component.dobChangeByCalender('x');
      expect(form.value.ageUnit).toBe('Days');
      expect(form.value.age).toBeGreaterThan(0);
    });

    it('today is 1 day', () => {
      component.dateForCalendar = new Date();
      component.dobChangeByCalender('x');
      expect(form.value.age).toBe(1);
      expect(form.value.ageUnit).toBe('Days');
    });

    it('invalid date string clears dob and alerts', () => {
      component.dateForCalendar = null;
      form.patchValue({ dob: new Date() });
      component.dobChangeByCalender('Invalid date');
      expect(form.value.dob).toBeNull();
      expect(component.dateForCalendar).toBeNull();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.invalidData,
        'info'
      );
    });

    it('otherwise clears age', () => {
      component.dateForCalendar = null;
      form.patchValue({ age: 5 });
      component.dobChangeByCalender('x');
      expect(form.value.age).toBeNull();
    });
  });

  describe('clearMaritalStatus', () => {
    it('does nothing when already null', () => {
      component.enableMarriageDetails = true;
      component.clearMaritalStatus();
      expect(component.enableMarriageDetails).toBeTrue();
    });
  });

  it('onIncomeChanged sets income name', () => {
    component.masterData = MASTER;
    form.patchValue({ income: 1 });
    component.onIncomeChanged();
    expect(form.value.incomeName).toBe('APL');
  });

  describe('onMaritalStatusChanged', () => {
    beforeEach(() => (component.masterData = MASTER));

    it('married enables marriage details and spouse mandatory', () => {
      form.patchValue({ maritalStatus: 2, spouseName: 'S', ageAtMarriage: 20 });
      component.onMaritalStatusChanged();
      expect(component.enableMarriageDetails).toBeTrue();
      expect(component.enableSpouseMandatory).toBeTrue();
      expect(form.value.maritalStatusName).toBe('Married');
      expect(form.value.spouseName).toBeNull();
      expect(form.value.ageAtMarriage).toBeNull();
    });

    it('unmarried disables marriage details', () => {
      form.patchValue({ maritalStatus: 1 });
      component.onMaritalStatusChanged();
      expect(component.enableMarriageDetails).toBeFalse();
      expect(component.enableSpouseMandatory).toBeFalse();
      expect(form.value.maritalStatusName).toBe('Unmarried');
    });

    it('status 7 disables marriage details', () => {
      form.patchValue({ maritalStatus: 7 });
      component.onMaritalStatusChanged();
      expect(component.enableMarriageDetails).toBeFalse();
    });

    it('widow enables marriage details without spouse mandatory', () => {
      form.patchValue({ maritalStatus: 5 });
      component.onMaritalStatusChanged();
      expect(component.enableMarriageDetails).toBeTrue();
      expect(component.enableSpouseMandatory).toBeFalse();
    });
  });

  describe('checkAgeAtMarriage', () => {
    beforeEach(() => fixture.detectChanges());
    const info = () => LANGUAGE_EN.alerts.info;
    const ageMsg = () => `${info().marriageAge} 12 ${info().years}`;

    it('no-op when ageAtMarriage null', () => {
      component.checkAgeAtMarriage();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('requires age first', () => {
      form.patchValue({ ageAtMarriage: 20, age: null });
      component.checkAgeAtMarriage();
      expect(confirmation.alert).toHaveBeenCalled();
      expect(form.value.ageAtMarriage).toBeNull();
    });

    it('requires Years unit', () => {
      form.patchValue({ ageAtMarriage: 20, age: 30, ageUnit: 'Months' });
      component.checkAgeAtMarriage();
      expect(confirmation.alert).toHaveBeenCalledWith(ageMsg(), 'info');
      expect(form.value.ageAtMarriage).toBeNull();
    });

    it('rejects when age below marriage age', () => {
      form.patchValue({ ageAtMarriage: 20, age: 10, ageUnit: 'Years' });
      component.checkAgeAtMarriage();
      expect(confirmation.alert).toHaveBeenCalledWith(ageMsg(), 'info');
    });

    it('rejects ageAtMarriage below 12', () => {
      form.patchValue({ ageAtMarriage: 10, age: 30, ageUnit: 'Years' });
      component.checkAgeAtMarriage();
      expect(confirmation.alert).toHaveBeenCalledWith(ageMsg(), 'info');
      expect(form.value.ageAtMarriage).toBeNull();
    });

    it('rejects ageAtMarriage greater than age', () => {
      form.patchValue({ ageAtMarriage: 40, age: 30, ageUnit: 'Years' });
      component.checkAgeAtMarriage();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.common.marriageatageismorethantheactualage,
        'info'
      );
      expect(form.value.ageAtMarriage).toBeNull();
    });

    it('accepts a valid ageAtMarriage', () => {
      form.patchValue({ ageAtMarriage: 20, age: 30, ageUnit: 'Years' });
      component.checkAgeAtMarriage();
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(form.value.ageAtMarriage).toBe(20);
    });
  });

  describe('getOccupationName', () => {
    beforeEach(() => (component.masterData = MASTER));
    it('sets occupation name for known occupation', () => {
      form.patchValue({ occupation: 1 });
      component.getOccupationName();
      expect(form.value.occupationOther).toBe('Farmer');
    });
    it('clears for "Other" (7)', () => {
      form.patchValue({ occupation: 7, occupationOther: 'typed' });
      component.getOccupationName();
      expect(form.value.occupationOther).toBeNull();
    });
  });

  it('onEducationQualificationChanged sets name', () => {
    component.masterData = MASTER;
    form.patchValue({ educationQualification: 1 });
    component.onEducationQualificationChanged();
    expect(form.value.educationQualificationName).toBe('Primary');
  });

  it('onScrollEvent hides the datepicker', () => {
    const hide = jasmine.createSpy('hide');
    component.datepicker = { hide } as any;
    component.onScrollEvent();
    expect(hide).toHaveBeenCalled();
  });

  it('AfterViewChecked runs change detection', () => {
    const cdr = (component as any).changeDetectorRef;
    spyOn(cdr, 'detectChanges');
    component.AfterViewChecked();
    expect(cdr.detectChanges).toHaveBeenCalled();
  });

  it('trackFieldInteraction forwards to tracking service', () => {
    component.trackFieldInteraction('firstName');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'firstName',
      'Register Personal Details'
    );
  });
});
