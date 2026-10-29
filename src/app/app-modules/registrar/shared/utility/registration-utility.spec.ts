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

import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { RegistrationUtils } from './registration-utility';

describe('RegistrationUtils', () => {
  let utils: RegistrationUtils;

  beforeEach(() => {
    utils = new RegistrationUtils(new FormBuilder());
  });

  it('createRegistrationDetailsForm builds the three sub forms', () => {
    const form = utils.createRegistrationDetailsForm();
    expect(form instanceof FormGroup).toBeTrue();
    expect(Object.keys(form.controls)).toEqual([
      'personalDetailsForm',
      'demographicDetailsForm',
      'otherDetailsForm',
    ]);
    // stateID is required so a fresh form is invalid
    expect(form.valid).toBeFalse();
  });

  it('createPersonalDetailsForm has expected defaults', () => {
    const form = utils.createPersonalDetailsForm();
    expect(form.value.beneficiaryRegID).toBe(0);
    expect(form.value.imageChangeFlag).toBeFalse();
    expect(form.value.checked).toBeTrue();
    expect(form.value.firstName).toBeNull();
    expect(form.contains('monthlyFamilyIncome')).toBeTrue();
    expect(form.valid).toBeTrue();
  });

  it('createDemographicDetailsForm has required stateID, default country and one village', () => {
    const form = utils.createDemographicDetailsForm();
    expect(form.value.countryID).toBe(1);
    expect(form.get('stateID')?.hasError('required')).toBeTrue();
    form.patchValue({ stateID: 5 } as any);
    expect(form.valid).toBeTrue();
    const villages = form.get('villages') as FormArray;
    expect(villages.length).toBe(1);
    expect(villages.at(0).value).toEqual({ villageID: null });
  });

  it('initVillage returns a group with villageID', () => {
    const g = utils.initVillage();
    expect(g.value).toEqual({ villageID: null });
  });

  it('createOtherDetailsForm contains govID and otherGovID arrays', () => {
    const form = utils.createOtherDetailsForm();
    expect((form.get('govID') as FormArray).length).toBe(1);
    expect((form.get('otherGovID') as FormArray).length).toBe(1);
    expect(form.value.fatherName).toBeNull();
    expect(form.contains('religionOther')).toBeTrue();
  });

  it('initGovID returns a group with all ID fields null', () => {
    const g = utils.initGovID();
    expect(Object.keys(g.controls).sort()).toEqual(
      [
        'type',
        'pattern',
        'error',
        'allow',
        'benIdentityId',
        'deleted',
        'minLength',
        'maxLength',
        'idValue',
        'createdBy',
      ].sort()
    );
    Object.values(g.value).forEach(v => expect(v).toBeNull());
  });
});
