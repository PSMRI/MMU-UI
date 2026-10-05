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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { RegistrationComponent } from './registration.component';

const GOV_MASTER = [
  { govtIdentityTypeID: 1, identityType: 'Aadhar' },
  { govtIdentityTypeID: 1, identityType: 'Aadhar-dup' },
  { govtIdentityTypeID: 3, identityType: 'PAN' },
];
const OTHER_GOV_MASTER = [
  { govtIdentityTypeID: 7, identityType: 'Ration' },
  { govtIdentityTypeID: 7, identityType: 'Ration-dup' },
];
const MASTER = {
  govIdEntityMaster: GOV_MASTER,
  otherGovIdEntityMaster: OTHER_GOV_MASTER,
  other: 'x',
};

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let registrar: any;
  let confirmation: any;
  let router: Router;
  let route: any;

  const otherDetailsStub = {
    resetForm: jasmine.createSpy('resetForm'),
    getRemovedIDs: jasmine.createSpy('getRemovedIDs').and.returnValue({
      removedGovIDs: [],
      removedOtherGovIDs: [],
    }),
  };
  const demographicStub = {
    setDemographicDefaults: jasmine.createSpy('setDemographicDefaults'),
  };
  const personalStub: any = {};

  async function setup(params: any = {}) {
    route = { snapshot: { params } };
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(MASTER),
      beneficiaryEditDetails$: new BehaviorSubject<any>(null),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegistrationComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              vanID: 11,
              parkingPlaceID: 22,
            }),
            userName: 'reg',
            servicePointID: 5,
            servicePointName: 'SP',
            providerServiceID: 99,
          },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: ActivatedRoute, useValue: route },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    (component as any).otherDetails = otherDetailsStub;
    (component as any).demographicDetails = demographicStub;
    (component as any).personalDetails = personalStub;
  }

  const personal = () => component.personalDetailsForm;
  const demo = () => component.demographicDetailsForm;
  const other = () => component.otherDetailsForm;
  const invalidate = (form: FormGroup, names: string[]) =>
    names.forEach(n => form.controls[n].setErrors({ required: true }));

  afterEach(() => {
    otherDetailsStub.resetForm.calls.reset();
    demographicStub.setDemographicDefaults.calls.reset();
    fixture.destroy();
  });

  describe('new registration mode', () => {
    beforeEach(async () => setup());

    it('initialises forms, language, master data and mode', () => {
      expect(component.beneficiaryRegistrationForm).toBeTruthy();
      expect(personal()).toBe(
        component.beneficiaryRegistrationForm.get(
          'personalDetailsForm'
        ) as FormGroup
      );
      expect(demo()).toBeTruthy();
      expect(other()).toBeTruthy();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(registrar.getRegistrationMaster).toHaveBeenCalledWith(1);
      expect(component.masterData).toEqual(MASTER);
      expect(component.govIDMaster).toEqual(GOV_MASTER);
      expect(component.otherGovIDMaster).toEqual(OTHER_GOV_MASTER);
      expect(component.patientRevisit).toBeFalse();
    });

    it('renders reset + submit buttons but no update/cancel in new mode', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('#resetButton')).not.toBeNull();
      expect(el.querySelector('#submitButton')).not.toBeNull();
      expect(el.querySelector('#saveButton')).toBeNull();
      expect(el.querySelector('#cancelButton')).toBeNull();
    });

    it('ignores null master data emissions', () => {
      component.govIDMaster = 'keep';
      registrar.registrationMasterDetails$.next(null);
      expect(component.govIDMaster).toBe('keep');
    });

    it('setStep changes the accordion step', () => {
      component.setStep(2);
      expect(component.step).toBe(2);
    });

    it('ngOnDestroy does nothing when not revisit', () => {
      component.ngOnDestroy();
      expect(registrar.clearBeneficiaryEditDetails).not.toHaveBeenCalled();
    });

    it('ngDoCheck refreshes the language set', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngAfterViewChecked triggers change detection', () => {
      const cdr = (component as any).changeDetectorRef;
      spyOn(cdr, 'detectChanges');
      component.ngAfterViewChecked();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    describe('resetBeneficiaryForm', () => {
      it('resets the form and child component state', () => {
        const govID = other().controls['govID'] as FormArray;
        govID.push(component.utils.initGovID());
        govID.push(component.utils.initGovID());
        const otherGovID = other().controls['otherGovID'] as FormArray;
        otherGovID.push(component.utils.initGovID());
        personal().patchValue({ firstName: 'A' });
        component.step = 2;
        component.resetBeneficiaryForm();
        expect(personal().value.firstName).toBeNull();
        expect(personal().value.ageUnit).toBe('Years');
        expect(personal().value.checked).toBeTrue();
        expect(govID.length).toBe(1);
        expect(otherGovID.length).toBe(1);
        expect(otherDetailsStub.resetForm).toHaveBeenCalled();
        expect(demographicStub.setDemographicDefaults).toHaveBeenCalled();
        expect(personalStub.enableMaritalStatus).toBeFalse();
        expect(personalStub.enableMarriageDetails).toBeFalse();
        expect(personalStub.isMobileNoRequired).toBeTrue();
        expect(personalStub.isOccuptionRequired).toBeTrue();
        expect(component.step).toBe(0);
      });
    });

    describe('govIDReset', () => {
      it('handles empty arrays', () => {
        (other().controls['govID'] as FormArray).clear();
        (other().controls['otherGovID'] as FormArray).clear();
        component.govIDReset();
        expect((other().controls['govID'] as FormArray).length).toBe(0);
        expect((other().controls['otherGovID'] as FormArray).length).toBe(0);
      });
    });

    describe('confirmFormReset', () => {
      it('pristine + reset=false navigates to search', () => {
        component.confirmFormReset(false);
        expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
        expect(confirmation.confirm).not.toHaveBeenCalled();
      });

      it('pristine + reset=true does nothing', () => {
        component.confirmFormReset(true);
        expect(router.navigate).not.toHaveBeenCalled();
        expect(confirmation.confirm).not.toHaveBeenCalled();
      });

      it('dirty + reset=true resets after confirmation', () => {
        component.beneficiaryRegistrationForm.markAsDirty();
        spyOn(component, 'resetBeneficiaryForm');
        component.confirmFormReset(true);
        expect(confirmation.confirm).toHaveBeenCalledWith(
          'warn',
          'Do you want to reset the entered details?'
        );
        expect(component.resetBeneficiaryForm).toHaveBeenCalled();
      });

      it('dirty + reset=true does not reset when declined', () => {
        component.beneficiaryRegistrationForm.markAsDirty();
        confirmation.confirm.and.returnValue(of(false));
        spyOn(component, 'resetBeneficiaryForm');
        component.confirmFormReset(true);
        expect(component.resetBeneficiaryForm).not.toHaveBeenCalled();
      });

      it('dirty + reset=false navigates after confirmation', () => {
        component.beneficiaryRegistrationForm.markAsDirty();
        component.confirmFormReset(false);
        expect(confirmation.confirm).toHaveBeenCalledWith(
          'info',
          LANGUAGE_EN.alerts.info.navigateFurtherAlert,
          'Yes',
          'No'
        );
        expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      });

      it('dirty + reset=false stays when declined', () => {
        component.beneficiaryRegistrationForm.markAsDirty();
        confirmation.confirm.and.returnValue(of(false));
        component.confirmFormReset(false);
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('dirty + other value does nothing', () => {
        component.beneficiaryRegistrationForm.markAsDirty();
        component.confirmFormReset('x');
        expect(confirmation.confirm).not.toHaveBeenCalled();
      });

      it('search button triggers confirmFormReset(false)', () => {
        spyOn(component, 'confirmFormReset');
        (
          fixture.nativeElement.querySelector('#moveToSearch') as HTMLElement
        ).click();
        expect(component.confirmFormReset).toHaveBeenCalledWith(false);
      });
    });

    describe('cancelBeneficiaryChanges', () => {
      it('navigates on confirm', () => {
        component.cancelBeneficiaryChanges();
        expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      });
      it('stays on decline', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.cancelBeneficiaryChanges();
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('checkValids', () => {
      it('returns true for a valid form', () => {
        demo().patchValue({ stateID: 1 });
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeTrue();
        expect(confirmation.notify).not.toHaveBeenCalled();
      });

      it('collects all personal, demographic and other messages', () => {
        const L = LANGUAGE_EN;
        personal().patchValue({
          age: 20,
          ageUnit: 'Years',
          maritalStatus: 2,
          literacyStatus: 'Literate',
        });
        invalidate(personal(), [
          'maritalStatus',
          'firstName',
          'gender',
          'phoneNo',
          'age',
          'ageAtMarriage',
          'spouseName',
          'occupationOther',
          'educationQualification',
          'lastName',
        ]);
        invalidate(demo(), [
          'districtID',
          'blockID',
          'parkingPlace',
          'zoneID',
          'servicePoint',
          'pincode',
        ]);
        invalidate(other(), [
          'emailID',
          'religionOther',
          'govID',
          'otherGovID',
          'fatherName',
          'community',
          'bankName',
        ]);
        const result = component.checkValids(
          component.beneficiaryRegistrationForm
        );
        expect(result).toBeFalse();
        const required = confirmation.notify.calls.mostRecent().args[1];
        expect(confirmation.notify.calls.mostRecent().args[0]).toBe(
          L.alerts.info.mandatoryFields
        );
        expect(required).toEqual(
          jasmine.arrayContaining([
            L.ro.personalInfo.maritalStatus,
            L.ro.personalInfo.firstName,
            L.ro.personalInfo.gender,
            L.bendetails.phoneNo,
            L.bendetails.age,
            L.ro.personalInfo.ageAtMarriage,
            L.ro.personalInfo.spouseName,
            L.ro.personalInfo.otherOccupation,
            L.ro.personalInfo.educationalQualification,
            'lastName',
            L.ro.locInfo.state,
            L.ro.locInfo.districtTownCity,
            L.ro.locInfo.taluk,
            'pincode',
            L.emailAddress,
            L.otherReligionName,
            L.otherGovtID,
            L.ro.otherInfo.fName,
            L.ro.otherInfo.community,
            'bankName',
            L.govID,
          ])
        );
        const village = (demo().controls['villages'] as FormArray).at(
          0
        ) as FormGroup;
        expect(village.controls['villageID'].disabled).toBeTrue();
      });

      it('skips age-dependent messages for children / non-years units', () => {
        personal().patchValue({ age: 5, ageUnit: 'Months', maritalStatus: 1 });
        demo().patchValue({ stateID: 1 });
        invalidate(personal(), [
          'maritalStatus',
          'ageAtMarriage',
          'spouseName',
          'educationQualification',
        ]);
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeTrue();
      });

      it('skips ageAtMarriage for unmarried(1)/7 statuses and spouse for non-2', () => {
        personal().patchValue({ age: 30, ageUnit: 'Years', maritalStatus: 7 });
        demo().patchValue({ stateID: 1 });
        invalidate(personal(), ['ageAtMarriage', 'spouseName']);
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeTrue();
        personal().patchValue({ maritalStatus: 1 });
        invalidate(personal(), ['ageAtMarriage']);
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeTrue();
      });

      it('flags govIDs shorter than max/min length', () => {
        demo().patchValue({ stateID: 1 });
        const govID = other().controls['govID'] as FormArray;
        govID.at(0).patchValue({ type: 1, idValue: '12', maxLength: 12 });
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeFalse();
        expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
          LANGUAGE_EN.govID,
        ]);
        govID.at(0).patchValue({ type: 3, idValue: '12', minLength: 10 });
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeFalse();
        govID
          .at(0)
          .patchValue({ type: 3, idValue: '1234567890', minLength: 10 });
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeTrue();
        govID
          .at(0)
          .patchValue({ type: 1, idValue: '123456789012', maxLength: 12 });
        expect(
          component.checkValids(component.beneficiaryRegistrationForm)
        ).toBeTrue();
      });
    });

    describe('postButtonCall', () => {
      it('does nothing when invalid', () => {
        spyOn(component, 'submitBeneficiaryDetails');
        spyOn(component, 'updateBeneficiarynPassToNurse');
        component.postButtonCall();
        expect(component.submitBeneficiaryDetails).not.toHaveBeenCalled();
        expect(component.updateBeneficiarynPassToNurse).not.toHaveBeenCalled();
      });

      it('submits in new mode', () => {
        spyOn(component, 'checkValids').and.returnValue(true);
        spyOn(component, 'submitBeneficiaryDetails');
        component.postButtonCall();
        expect(component.submitBeneficiaryDetails).toHaveBeenCalled();
      });

      it('updates in revisit mode', () => {
        component.patientRevisit = true;
        spyOn(component, 'checkValids').and.returnValue(true);
        spyOn(component, 'updateBeneficiarynPassToNurse');
        component.postButtonCall();
        expect(component.updateBeneficiarynPassToNurse).toHaveBeenCalled();
      });
    });

    function fillForm() {
      personal().patchValue({
        firstName: 'Ram',
        lastName: 'K',
        gender: 1,
        genderName: 'Male',
        dob: '2000-01-01T00:00:00.000Z',
        phoneNo: '9999999999',
        parentRegID: 3,
        parentRelation: 1,
        beneficiaryRegID: 55,
        benPhMapID: 'null',
      });
      demo().patchValue({ stateID: 1, stateName: 'S', districtID: 2 });
      (demo().controls['villages'] as FormArray)
        .at(0)
        .patchValue({ villageID: { districtBranchID: 9, villageName: 'V' } });
      (other().controls['govID'] as FormArray)
        .at(0)
        .patchValue({ type: 1, idValue: '1111' });
      (other().controls['otherGovID'] as FormArray)
        .at(0)
        .patchValue({ type: 7, idValue: 'R1' });
    }

    describe('submitBeneficiaryDetails', () => {
      it('submits the iEMR payload and resets on success', () => {
        fillForm();
        registrar.submitBeneficiary.and.returnValue(
          of({ statusCode: 200, data: { response: 'Saved' } })
        );
        spyOn(component, 'resetBeneficiaryForm');
        component.submitBeneficiaryDetails();
        const payload = registrar.submitBeneficiary.calls.mostRecent().args[0];
        expect(payload.firstName).toBe('Ram');
        expect(payload.dOB).toBe('2000-01-01T00:00:00.000Z');
        expect(payload.vanID).toBe(11);
        expect(payload.parkingPlaceID).toBe(22);
        expect(payload.createdBy).toBe('reg');
        expect(payload.providerServiceMapID).toBe(99);
        expect(payload.i_bendemographics.districtBranchID).toBe(9);
        expect(payload.i_bendemographics.districtBranchName).toBe('V');
        expect(payload.i_bendemographics.servicePointID).toBe(5);
        expect(payload.i_bendemographics.countryName).toBe('India');
        expect(payload.benPhoneMaps[0]).toEqual(
          jasmine.objectContaining({
            phoneNo: '9999999999',
            phoneTypeID: 1,
            vanID: 11,
            parkingPlaceID: 22,
            createdBy: 'reg',
          })
        );
        // duplicate master entries produce two identities for the same type
        expect(payload.beneficiaryIdentities.length).toBe(4);
        expect(payload.beneficiaryIdentities[0]).toEqual(
          jasmine.objectContaining({
            govtIdentityNo: '1111',
            govtIdentityTypeName: 'Aadhar',
            identityType: 'National ID',
          })
        );
        expect(payload.beneficiaryIdentities[2]).toEqual(
          jasmine.objectContaining({
            govtIdentityNo: 'R1',
            identityType: 'State ID',
          })
        );
        expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
        expect(component.resetBeneficiaryForm).toHaveBeenCalled();
      });

      it('alerts on non-200 response', () => {
        fillForm();
        registrar.submitBeneficiary.and.returnValue(of({ statusCode: 5000 }));
        component.submitBeneficiaryDetails();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.issueInSavngData,
          'error'
        );
      });
    });

    it('makePhoneTypeID returns 1 or null', () => {
      expect(component.makePhoneTypeID('123')).toBe(1);
      expect(component.makePhoneTypeID('')).toBeNull();
    });

    it('iEMRids skips entries without type/value or unmatched types', () => {
      const res = component.iEMRids(
        [
          { type: null, idValue: 'x' },
          { type: 99, idValue: 'y' },
        ],
        [
          { type: 7, idValue: null },
          { type: 55, idValue: 'z' },
        ]
      );
      expect(res).toEqual([]);
    });

    it('getBenPhMapID maps the string "null" to null', () => {
      expect(component.getBenPhMapID('null')).toBeNull();
      expect(component.getBenPhMapID(4)).toBe(4);
    });

    it('getRelationTypeForUpdate maps relation ids', () => {
      expect(component.getRelationTypeForUpdate(1, null)).toBe('Self');
      expect(component.getRelationTypeForUpdate(11, null)).toBe('Other');
      expect(component.getRelationTypeForUpdate(5, null)).toBeNull();
    });

    it('dateFormatChange returns ISO string of dob', () => {
      personal().patchValue({ dob: '2010-05-05T00:00:00.000Z' });
      expect(component.dateFormatChange()).toBe('2010-05-05T00:00:00.000Z');
    });

    describe('iEMRidsUpdate', () => {
      it('builds existing, removed and new identities with de-duplicated master', () => {
        const res = component.iEMRidsUpdate(
          [
            { type: 1, idValue: 'A', deleted: false, benIdentityId: 10 },
            { type: 3, idValue: 'N', deleted: null, benIdentityId: null },
            { type: null, idValue: 'skip' },
          ],
          [
            { type: 7, idValue: 'O', deleted: false, benIdentityId: 20 },
            { type: 7, idValue: 'ON', deleted: false, benIdentityId: null },
            { type: 8, idValue: 'X', deleted: false, benIdentityId: 21 },
            { type: 8, idValue: 'XN', deleted: false, benIdentityId: null },
          ],
          [{ type: 3, idValue: 'R', benIdentityId: 30, createdBy: 'old' }],
          [
            { type: 7, idValue: 'RO', benIdentityId: 40, createdBy: 'old2' },
            { type: 9, idValue: 'nomatch' },
          ]
        );
        expect(res.length).toBe(6);
        expect(res[0]).toEqual(
          jasmine.objectContaining({
            govtIdentityNo: 'A',
            benIdentityId: 10,
            deleted: false,
            createdBy: 'reg',
          })
        );
        expect(res[0].govtIdentityType.isGovtID).toBeTrue();
        expect(res[1].govtIdentityNo).toBe('O');
        expect(res[1].govtIdentityType.isGovtID).toBeFalse();
        expect(res[2]).toEqual(
          jasmine.objectContaining({
            govtIdentityNo: 'R',
            deleted: true,
            createdBy: 'old',
          })
        );
        expect(res[3]).toEqual(
          jasmine.objectContaining({ govtIdentityNo: 'RO', deleted: true })
        );
        expect(res[3].govtIdentityType.isGovtID).toBeFalse();
        expect(res[4]).toEqual(
          jasmine.objectContaining({
            govtIdentityNo: 'N',
            deleted: false,
            benIdentityId: undefined,
          })
        );
        expect(res[5].govtIdentityNo).toBe('ON');
      });

      it('returns undefined when nothing to send', () => {
        expect(component.iEMRidsUpdate([], [], [], [])).toBeUndefined();
      });
    });

    describe('update flows', () => {
      beforeEach(() => fillForm());

      it('updateBenDataManipulation builds the update payload', () => {
        personal().patchValue({
          educationQualification: 2,
          occupation: 3,
          income: 4,
          parentRelation: 11,
          benPhMapID: 8,
        });
        other().patchValue({ community: 5, religion: 6, emailID: 'a@b' });
        const form = component.updateBenDataManipulation();
        expect(otherDetailsStub.getRemovedIDs).toHaveBeenCalled();
        expect(form.passToNurse).toBeUndefined();
        expect(form.vanID).toBe(11);
        expect(form.benPhoneMaps[0].modifiedBy).toBe('reg');
        expect(form.benPhoneMaps[0].benPhMapID).toBe(8);
        expect(
          form.benPhoneMaps[0].benRelationshipType.benRelationshipType
        ).toBe('Other');
        expect(form.i_bendemographics.educationID).toBe(2);
        expect(form.i_bendemographics.communityID).toBe(5);
        expect(form.i_bendemographics.districtBranchID).toBe(9);
        expect(form.email).toBe('a@b');
        expect(form.lastName).toBe('K');
        expect(form.dOB).toBe('2000-01-01T00:00:00.000Z');
        expect(form.beneficiaryIdentities.length).toBe(2);
      });

      it('iEMRFormUpdate maps empty values to undefined', () => {
        personal().patchValue({ lastName: '', benPhMapID: 'null' });
        const form: any = component.iEMRFormUpdate();
        expect(form.lastName).toBeUndefined();
        expect(form.i_bendemographics.educationID).toBeUndefined();
        expect(form.benPhoneMaps[0].benPhMapID).toBeNull();
        expect(
          form.benPhoneMaps[0].benRelationshipType.benRelationshipType
        ).toBe('Self');
      });

      it('updateBeneficiarynPassToNurse success navigates', () => {
        registrar.updateBeneficiary.and.returnValue(
          of({ statusCode: 200, data: { response: 'Updated' } })
        );
        component.updateBeneficiarynPassToNurse();
        expect(
          registrar.updateBeneficiary.calls.mostRecent().args[0].passToNurse
        ).toBeTrue();
        expect(confirmation.alert).toHaveBeenCalledWith('Updated', 'success');
        expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      });

      it('updateBeneficiarynPassToNurse failure alerts error', () => {
        registrar.updateBeneficiary.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' })
        );
        component.updateBeneficiarynPassToNurse(false);
        expect(
          registrar.updateBeneficiary.calls.mostRecent().args[0].passToNurse
        ).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('updateBeneficiaryDetails success does not pass to nurse', () => {
        registrar.updateBeneficiary.and.returnValue(
          of({ statusCode: 200, data: { response: 'Updated' } })
        );
        component.updateBeneficiaryDetails();
        expect(
          registrar.updateBeneficiary.calls.mostRecent().args[0].passToNurse
        ).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      });

      it('updateBeneficiaryDetails failure alerts error', () => {
        registrar.updateBeneficiary.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'nope' })
        );
        component.updateBeneficiaryDetails();
        expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
      });

      it('updateBeneficiaryDetails skips service when invalid', () => {
        spyOn(component, 'checkValids').and.returnValue(false);
        component.updateBeneficiaryDetails();
        expect(registrar.updateBeneficiary).not.toHaveBeenCalled();
      });
    });

    describe('canDeactivate', () => {
      it('returns of(true) when pristine', done => {
        component.canDeactivate().subscribe(v => {
          expect(v).toBeTrue();
          expect(confirmation.confirm).not.toHaveBeenCalled();
          done();
        });
      });
      it('asks for confirmation when dirty', done => {
        component.beneficiaryRegistrationForm.markAsDirty();
        confirmation.confirm.and.returnValue(of(false));
        component.canDeactivate().subscribe(v => {
          expect(v).toBeFalse();
          expect(confirmation.confirm).toHaveBeenCalled();
          done();
        });
      });
    });

    it('submit button calls postButtonCall', () => {
      spyOn(component, 'postButtonCall');
      (
        fixture.nativeElement.querySelector('#submitButton') as HTMLElement
      ).click();
      expect(component.postButtonCall).toHaveBeenCalled();
    });

    it('redirectToSearch alerts asynchronously and navigates', fakeAsync(() => {
      component.redirectToSearch();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      flush();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInFetchDetails,
        'info'
      );
    }));
  });
});
