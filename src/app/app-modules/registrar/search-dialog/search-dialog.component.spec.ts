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
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { CommonService } from '../../core/services/common-services.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { RegistrarService } from '../shared/services/registrar.service';
import { SearchDialogComponent } from './search-dialog.component';

const LOCATION = {
  stateMaster: [{ stateID: 1, stateName: 'S1' }],
  otherLoc: { stateID: 1, districtList: [{ districtID: 4 }] },
};

function master() {
  return {
    govIdEntityMaster: [{ govtIdentityTypeID: 1 }],
    otherGovIdEntityMaster: [{ govtIdentityTypeID: 7 }],
    genderMaster: [{ genderID: 1, genderName: 'Male' }],
  };
}

describe('SearchDialogComponent', () => {
  let component: SearchDialogComponent;
  let fixture: ComponentFixture<SearchDialogComponent>;
  let registrar: any;
  let common: any;
  let confirmation: any;
  let dialogRef: any;
  let session: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(null),
    });
    common = autoSpy(CommonService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SearchDialogComponent],
      providers: [
        ...commonTestProviders({
          session: { location: JSON.stringify(LOCATION) },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: CommonService, useValue: common },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(SearchDialogComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(SearchDialogComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    session = TestBed.inject(SessionStorageService) as any;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('initialises language, form, master request and states', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(Object.keys(component.newSearchForm.controls)).toEqual([
      'firstName',
      'lastName',
      'fatherName',
      'dob',
      'gender',
      'stateID',
      'districtID',
    ]);
    expect(component.newSearchForm.valid).toBeFalse();
    expect(registrar.getRegistrationMaster).toHaveBeenCalledWith(1);
    expect(component.states).toEqual(LOCATION.stateMaster);
    expect(component.locations).toEqual(LOCATION);
    expect(component.today).toEqual(jasmine.any(Date));
    expect(component.masterData).toBeUndefined();
  });

  it('form becomes valid with required fields', () => {
    component.newSearchForm.patchValue({
      firstName: 'A',
      gender: 1,
      stateID: 1,
      districtID: 2,
    });
    expect(component.newSearchForm.valid).toBeTrue();
  });

  it('merges gov and other gov IDs when master data arrives', () => {
    registrar.registrationMasterDetails$.next(master());
    expect(component.masterData).toBeTruthy();
    expect(component.govtIDs).toEqual([
      { govtIdentityTypeID: 1 },
      { govtIdentityTypeID: 7 },
    ]);
  });

  it('getStatesData leaves states untouched when no location is stored', () => {
    session.store.delete('location');
    component.states = 'prev';
    component.getStatesData();
    expect(component.locations).toBeNull();
    expect(component.states).toBe('prev');
  });

  it('resetBeneficiaryForm clears form and reloads states', () => {
    component.newSearchForm.patchValue({ firstName: 'x' });
    component.states = null;
    component.resetBeneficiaryForm();
    expect(component.newSearchForm.value.firstName).toBeNull();
    expect(component.states).toEqual(LOCATION.stateMaster);
  });

  describe('onStateChange', () => {
    it('does nothing without a state', () => {
      component.onStateChange();
      expect(registrar.getDistrictList).not.toHaveBeenCalled();
    });

    it('loads districts', () => {
      component.newSearchForm.patchValue({ stateID: 1 });
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ districtID: 4 }] })
      );
      component.onStateChange();
      expect(registrar.getDistrictList).toHaveBeenCalledWith(1);
      expect(component.districts).toEqual([{ districtID: 4 }]);
    });

    it('alerts and closes dialog on failure', () => {
      component.newSearchForm.patchValue({ stateID: 1 });
      registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.onStateChange();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueFetching,
        'error'
      );
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  it('getDistricts uses the common service', () => {
    common.getDistricts.and.returnValue(of([{ districtID: 9 }]));
    component.getDistricts(3);
    expect(common.getDistricts).toHaveBeenCalledWith(3);
    expect(component.districts).toEqual([{ districtID: 9 }]);
  });

  it('selectGender iterates master without matching (compares to control object)', () => {
    component.masterData = master();
    component.newSearchForm.patchValue({ gender: 1 });
    component.selectGender();
    expect(component.newSearchForm.contains('genderName')).toBeFalse();
  });

  it('selectGender assigns genderName only when genderID is the control itself', () => {
    const genderCtrl = component.newSearchForm.controls['gender'];
    component.masterData = {
      genderMaster: [
        { genderID: 2, genderName: 'Female' },
        { genderID: genderCtrl, genderName: 'Male' },
      ],
    };
    component.selectGender();
    expect((component.newSearchForm.controls as any)['genderName']).toBe(
      'Male'
    );
  });

  it('getStatesData otherLoc branch only runs for a non-primitive stored value (reads otherLoc off the raw string)', () => {
    // getStatesData checks `location.otherLoc` on the raw (unparsed) value,
    // so a plain JSON string never enters the branch. Use a String object
    // that carries otherLoc to exercise it.
    const raw: any = new String(JSON.stringify(LOCATION));
    raw.otherLoc = LOCATION.otherLoc;
    session.getItem.and.returnValue(raw);
    spyOn(component, 'onStateChange');
    component.getStatesData();
    expect(component.states).toEqual(LOCATION.stateMaster);
    // controls are overwritten with raw values (current behaviour)
    expect((component.newSearchForm.controls as any)['stateID']).toBe(1);
    expect((component.newSearchForm.controls as any)['districtID']).toBe(4);
    expect(component.onStateChange).toHaveBeenCalled();
  });

  it('getStatesData with plain JSON string skips the otherLoc defaults', () => {
    spyOn(component, 'onStateChange');
    component.getStatesData();
    expect(component.onStateChange).not.toHaveBeenCalled();
    expect(component.newSearchForm.controls['stateID'].value).toBeNull();
  });

  it('onIDCardSelected is a no-op', () => {
    expect(component.onIDCardSelected()).toBeUndefined();
  });

  it('getSearchResult closes dialog with mapped search object', () => {
    component.getSearchResult({
      firstName: 'A',
      lastName: 'B',
      fatherName: 'C',
      dob: 'D',
      gender: 1,
      stateID: 2,
      districtID: 3,
    });
    const expected = {
      firstName: 'A',
      lastName: 'B',
      fatherName: 'C',
      dob: 'D',
      genderID: 1,
      i_bendemographics: { stateID: 2, districtID: 3 },
    };
    expect(component.dataObj).toEqual(expected);
    expect(dialogRef.close).toHaveBeenCalledWith(expected);
  });

  it('AfterViewChecked runs change detection', () => {
    const cdr = (component as any).changeDetectorRef;
    spyOn(cdr, 'detectChanges');
    component.AfterViewChecked();
    expect(cdr.detectChanges).toHaveBeenCalled();
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
