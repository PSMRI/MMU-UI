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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { RegisterOtherDetailsComponent } from './register-other-details.component';

const MASTER = {
  govIdEntityMaster: [
    { govtIdentityTypeID: 1, identityType: 'Aadhar' },
    { govtIdentityTypeID: 2, identityType: 'Voter ID' },
    { govtIdentityTypeID: 3, identityType: 'Driving License' },
  ],
  otherGovIdEntityMaster: [
    { govtIdentityTypeID: 7, identityType: 'Health' },
    { govtIdentityTypeID: 8, identityType: 'Job' },
  ],
  religionMaster: [
    { religionID: 1, religionType: 'Hindu' },
    { religionID: 7, religionType: 'Other' },
  ],
  communityMaster: [
    { communityID: 1, communityType: 'General' },
    { communityID: 2, communityType: 'OBC' },
  ],
};

const REVISIT = {
  beneficiaryID: 'B1',
  fatherName: 'Dad',
  motherName: 'Mom',
  email: 'a@b.c',
  i_bendemographics: { communityID: 2, communityName: 'OBC' },
  bankName: 'SBI',
  branchName: 'Main',
  ifscCode: 'IFSC',
  accountNo: '123',
  religionId: 1,
  religion: 'Hindu',
  beneficiaryIdentities: [
    {
      govtIdentityTypeID: 1,
      govtIdentityNo: '123412341234',
      benIdentityId: 10,
      deleted: false,
      createdBy: 'u',
      govtIdentityType: { isGovtID: true },
    },
    {
      govtIdentityTypeID: 2,
      govtIdentityNo: 'OLD',
      benIdentityId: 11,
      deleted: true,
      createdBy: 'u',
      govtIdentityType: { isGovtID: true },
    },
    {
      govtIdentityTypeID: 7,
      govtIdentityNo: 'H1',
      benIdentityId: 12,
      deleted: null,
      createdBy: 'u',
      govtIdentityType: { isGovtID: false },
    },
  ],
};

describe('RegisterOtherDetailsComponent', () => {
  let component: RegisterOtherDetailsComponent;
  let fixture: ComponentFixture<RegisterOtherDetailsComponent>;
  let registrar: any;
  let confirmation: any;
  let form: FormGroup;
  let utils: RegistrationUtils;

  const govID = () => form.controls['govID'] as FormArray;
  const otherGovID = () => form.controls['otherGovID'] as FormArray;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(MASTER),
      beneficiaryEditDetails$: new BehaviorSubject<any>(null),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegisterOtherDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(RegisterOtherDetailsComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(RegisterOtherDetailsComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    utils = new RegistrationUtils(new FormBuilder());
    form = utils.createOtherDetailsForm();
    component.otherDetailsForm = form;
  });

  afterEach(() => fixture.destroy());

  describe('new registration', () => {
    beforeEach(() => fixture.detectChanges());

    it('initialises language, patterns and master data', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.patterns.length).toBe(6);
      expect(component.patterns[0].error).toBe(
        LANGUAGE_EN.common.enterDigitAadharNumber
      );
      expect(component.masterData).toEqual(MASTER);
      expect(component.govIDMaster[0]).toEqual(MASTER);
      expect(component.otherGovIDMaster[0]).toEqual(MASTER);
      expect(component.govLength).toBe(3);
      expect(component.otherGovLength).toBe(2);
      expect(component.otherGovIdList).toBe(govID());
      expect(component.revisitDataSubscription).toBeUndefined();
    });

    it('ignores null master data', () => {
      component.govLength = 99;
      registrar.registrationMasterDetails$.next(null);
      expect(component.govLength).toBe(99);
    });

    it('getGovIDControls / getOtherGovIDControls return array controls', () => {
      expect(component.getGovIDControls()).toBe(govID().controls);
      expect(component.getOtherGovIDControls()).toBe(otherGovID().controls);
    });

    it('returns null controls when arrays are missing', () => {
      component.otherDetailsForm = new FormGroup({});
      expect(component.getGovIDControls()).toBeNull();
      expect(component.getOtherGovIDControls()).toBeNull();
    });

    it('resetForm clears the local masters and reloads master data', () => {
      component.previousGovID = [1];
      component.previousOtherGovID = [7];
      component.resetForm();
      expect(component.previousGovID).toEqual([]);
      expect(component.previousOtherGovID).toEqual([]);
      expect(component.govIDMaster.length).toBe(1);
      expect(component.govLength).toBe(3);
      expect(component.otherGovLength).toBe(2);
    });

    it('ngOnDestroy unsubscribes master subscription only when not revisit', () => {
      const sub = component.masterDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    it('ngDoCheck re-applies the pattern for each selected gov ID', () => {
      govID().at(0).patchValue({ type: 2 });
      component.ngDoCheck();
      expect(govID().at(0).value.maxLength).toBe(10);
      expect(govID().at(0).value.allow).toBe('alphanumeric');
    });

    it('alerting and checkIDPattern are side-effect free', () => {
      spyOn(console, 'log');
      component.alerting('x');
      govID().at(0).patchValue({ idValue: '123', maxLength: 3 });
      component.checkIDPattern(0);
      expect(console.log).toHaveBeenCalledWith('ok');
      (console.log as jasmine.Spy).calls.reset();
      govID().at(0).patchValue({ idValue: '12', maxLength: 3 });
      component.checkIDPattern(0);
      expect(console.log).not.toHaveBeenCalledWith('ok');
    });
  });

  describe('gov ID filtering', () => {
    beforeEach(() => fixture.detectChanges());

    it('first selection removes the ID from the next list and applies pattern', () => {
      component.filtergovIDs(1, 0);
      expect(component.previousGovID).toEqual([1]);
      expect(
        component.govIDMaster[1].govIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toEqual([2, 3]);
      expect(govID().at(0).value.type).toBe(1);
      expect(govID().at(0).value.maxLength).toBe(12);
    });

    it('selection at a second index removes it from other lists', () => {
      component.filtergovIDs(1, 0);
      govID().push(utils.initGovID());
      component.filtergovIDs(2, 1);
      expect(
        component.govIDMaster[0].govIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toEqual([1, 3]);
      expect(
        component.govIDMaster[2].govIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toEqual([3]);
    });

    it('changing a selection restores the old ID to other lists and resets value', () => {
      component.filtergovIDs(1, 0);
      govID().at(0).patchValue({ idValue: '1234' });
      component.filtergovIDs(3, 0);
      expect(govID().at(0).value.idValue).toBeNull();
      expect(component.previousGovID[0]).toBe(3);
      const ids = component.govIDMaster[1].govIdEntityMaster.map(
        (g: any) => g.govtIdentityTypeID
      );
      expect(ids).toContain(1);
      expect(ids).not.toContain(3);
      expect(govID().at(0).value.minLength).toBe(8);
    });

    it('changing a selection whose previous ID is unknown pushes nothing', () => {
      component.filtergovIDs(1, 0);
      component.previousGovID[0] = 99;
      const before = component.govIDMaster[1].govIdEntityMaster.length;
      component.filtergovIDs(2, 0);
      expect(component.govIDMaster[1].govIdEntityMaster.length).toBe(
        before - 1
      );
    });

    it('other gov ID first selection and change', () => {
      component.filterOtherGovIDs(7, 0);
      expect(component.previousOtherGovID).toEqual([7]);
      expect(
        component.otherGovIDMaster[1].otherGovIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toEqual([8]);
      otherGovID().push(utils.initGovID());
      component.filterOtherGovIDs(8, 1);
      expect(
        component.otherGovIDMaster[0].otherGovIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toEqual([7]);
      otherGovID().at(0).patchValue({ idValue: 'X' });
      component.filterOtherGovIDs(8, 0);
      expect(otherGovID().at(0).value.idValue).toBeNull();
      expect(component.previousOtherGovID[0]).toBe(8);
      expect(
        component.otherGovIDMaster[1].otherGovIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toContain(7);
    });

    it('other gov ID change with unknown previous ID pushes nothing', () => {
      component.filterOtherGovIDs(7, 0);
      component.previousOtherGovID[0] = 99;
      const before =
        component.otherGovIDMaster[1].otherGovIdEntityMaster.length;
      component.filterOtherGovIDs(9, 0);
      expect(component.otherGovIDMaster[1].otherGovIdEntityMaster.length).toBe(
        before
      );
    });

    it('addPatternforGovID ignores unknown type', () => {
      component.addPatternforGovID(42, 0);
      expect(govID().at(0).value.type).toBeNull();
    });

    it('getAllowedGovChars returns allowed chars or null', () => {
      expect(component.getAllowedGovChars(1) as any).toBe('number');
      expect(component.getAllowedGovChars(3) as any).toBeUndefined();
      expect(component.getAllowedGovChars(42) as any).toBeNull();
    });
  });

  describe('addID / removeID', () => {
    beforeEach(() => fixture.detectChanges());

    it('addID pushes a new gov ID row when current one is filled', () => {
      govID().at(0).patchValue({ type: 1, idValue: 'x' });
      component.addID(1, 0);
      expect(govID().length).toBe(2);
    });

    it('addID alerts when gov ID row is incomplete', () => {
      component.addID(1, 0);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pleaseInputFieldFirst,
        'warn'
      );
      expect(govID().length).toBe(1);
    });

    it('addID for other gov IDs', () => {
      component.addID(0, 0);
      expect(confirmation.alert).toHaveBeenCalled();
      otherGovID().at(0).patchValue({ type: 7, idValue: 'y' });
      component.addID(0, 0);
      expect(otherGovID().length).toBe(2);
    });

    it('addID with unknown type does nothing', () => {
      component.addID(5, 0);
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('removeID on the only gov row clears it and restores master entry', () => {
      component.filtergovIDs(1, 0);
      govID().at(0).patchValue({ idValue: '1' });
      component.removeID(1, 0);
      expect(govID().length).toBe(1);
      expect(govID().at(0).value.type).toBeNull();
      expect(govID().at(0).value.idValue).toBeNull();
      expect(component.previousGovID).toEqual([]);
      expect(component.govIDMaster.length).toBe(1);
      expect(
        component.govIDMaster[0].govIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID
        )
      ).toEqual([2, 3, 1]);
      expect(component.removedGovIDs).toEqual([]);
    });

    it('removeID on second gov row removes it; revisit rows are tracked', () => {
      component.patientRevisit = true;
      govID().push(utils.initGovID());
      component.govIDMaster[1] = JSON.parse(JSON.stringify(MASTER));
      govID().at(1).patchValue({ type: 2, idValue: 'V', createdBy: 'u' });
      component.removeID(1, 1);
      expect(govID().length).toBe(1);
      expect(component.removedGovIDs.length).toBe(1);
      expect(component.getRemovedIDs().removedGovIDs[0].idValue).toBe('V');
    });

    it('removeID with empty type only removes/clears the row', () => {
      govID().push(utils.initGovID());
      component.removeID(1, 1);
      expect(govID().length).toBe(1);
      expect(component.govIDMaster.length).toBe(1);
    });

    it('removeID for other gov IDs (single row) clears it', () => {
      component.patientRevisit = true;
      component.filterOtherGovIDs(7, 0);
      otherGovID().at(0).patchValue({ type: 7, idValue: 'H', createdBy: 'u' });
      component.removeID(0, 0);
      expect(otherGovID().length).toBe(1);
      expect(otherGovID().at(0).value.type).toBeNull();
      expect(component.removedOtherGovIDs.length).toBe(1);
      expect(component.getRemovedIDs().removedOtherGovIDs.length).toBe(1);
    });

    it('removeID for other gov IDs removes non-first rows', () => {
      otherGovID().push(utils.initGovID());
      component.removeID(0, 1);
      expect(otherGovID().length).toBe(1);
    });

    it('removeID with unknown id type does nothing', () => {
      component.removeID(9, 0);
      expect(govID().length).toBe(1);
      expect(otherGovID().length).toBe(1);
    });
  });

  describe('revisit mode', () => {
    beforeEach(() => {
      component.patientRevisit = true;
      fixture.detectChanges();
    });

    it('loads edit details and non-deleted identities into the form', () => {
      registrar.beneficiaryEditDetails$.next(REVISIT);
      expect(component.revisitData.beneficiaryID).toBe('B1');
      expect(form.value.fatherName).toBe('Dad');
      expect(form.value.emailID).toBe('a@b.c');
      expect(form.value.community).toBe(2);
      expect(form.value.communityName).toBe('OBC');
      expect(form.value.religion).toBe(1);
      expect(form.value.religionOther).toBe('Hindu');
      expect(govID().length).toBe(1);
      expect(govID().at(0).value).toEqual(
        jasmine.objectContaining({
          type: 1,
          idValue: '123412341234',
          allow: 'number',
          benIdentityId: 10,
          deleted: false,
          createdBy: 'u',
        })
      );
      expect(otherGovID().length).toBe(1);
      expect(otherGovID().at(0).value.idValue).toBe('H1');
    });

    it('maps missing optional values to null', () => {
      registrar.beneficiaryEditDetails$.next({ beneficiaryID: 'B2' });
      expect(form.value.fatherName).toBeNull();
      expect(form.value.community).toBeNull();
      expect(form.value.religionOther).toBeNull();
      expect(govID().length).toBe(1);
    });

    it('keeps the first empty gov row when only other IDs exist', () => {
      registrar.beneficiaryEditDetails$.next({
        beneficiaryID: 'B3',
        beneficiaryIdentities: [REVISIT.beneficiaryIdentities[2]],
      });
      expect(govID().length).toBe(1);
      expect(govID().at(0).value.type).toBeNull();
      expect(otherGovID().length).toBe(1);
    });

    it('ignores edit data without beneficiaryID', () => {
      registrar.beneficiaryEditDetails$.next({ fatherName: 'x' });
      expect(component.revisitData).toBeUndefined();
    });

    it('ngOnDestroy unsubscribes revisit subscription', () => {
      const sub = component.revisitDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    it('configMasterForOthers skips loading when revisit flag flips off', () => {
      component.patientRevisit = false;
      spyOn(component, 'loadBenEditDetails');
      component.configMasterForOthers();
      registrar.beneficiaryEditDetails$.next(REVISIT);
      expect(component.revisitData.beneficiaryID).toBe('B1');
      expect(component.loadBenEditDetails).not.toHaveBeenCalled();
    });
  });

  describe('lookups', () => {
    beforeEach(() => fixture.detectChanges());

    it('getReligionName sets name, clears for Other(7)', () => {
      form.patchValue({ religion: 1 });
      component.getReligionName();
      expect(form.value.religionOther).toBe('Hindu');
      form.patchValue({ religion: 7, religionOther: 'typed' });
      component.getReligionName();
      expect(form.value.religionOther).toBeNull();
    });

    it('onCommunityChanged sets community name', () => {
      form.patchValue({ community: 2 });
      component.onCommunityChanged();
      expect(form.value.communityName).toBe('OBC');
    });
  });

  describe('checkPattern', () => {
    beforeEach(() => fixture.detectChanges());

    it('does nothing without a value', () => {
      component.checkPattern(0, { idValue: null });
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('rejects a value failing the regex', () => {
      govID().at(0).patchValue({ idValue: 'abc' });
      component.checkPattern(0, {
        idValue: 'abcdabcdabcd',
        pattern: /^\d{12}$/,
        type: 1,
        maxLength: 12,
        error: 'bad',
      });
      expect(confirmation.alert).toHaveBeenCalledWith('bad');
      expect(govID().at(0).value.idValue).toBeNull();
    });

    it('rejects a too short driving license', () => {
      component.checkPattern(0, {
        idValue: 'AB12',
        pattern: null,
        type: 3,
        minLength: 8,
        error: 'short',
      });
      expect(confirmation.alert).toHaveBeenCalledWith('short');
    });

    it('rejects wrong length for other types', () => {
      component.checkPattern(0, {
        idValue: '1234',
        type: 1,
        maxLength: 12,
        error: 'len',
      });
      expect(confirmation.alert).toHaveBeenCalledWith('len');
    });

    it('accepts valid values', () => {
      govID().at(0).patchValue({ idValue: '123412341234' });
      component.checkPattern(0, {
        idValue: '123412341234',
        pattern: /^\d{12}$/,
        type: 1,
        maxLength: 12,
      });
      component.checkPattern(0, {
        idValue: 'DL123456',
        pattern: undefined,
        type: 3,
        minLength: 8,
      });
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(govID().at(0).value.idValue).toBe('123412341234');
    });
  });
});
