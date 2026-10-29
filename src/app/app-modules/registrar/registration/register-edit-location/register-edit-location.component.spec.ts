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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegisterEditLocationComponent } from './register-edit-location.component';

const LOCATION = {
  stateMaster: [
    { stateID: 1, stateName: 'Karnataka' },
    { stateID: 2, stateName: 'Kerala' },
  ],
  otherLoc: { stateID: 1, stateName: 'Karnataka' },
};

describe('RegisterEditLocationComponent', () => {
  let component: RegisterEditLocationComponent;
  let fixture: ComponentFixture<RegisterEditLocationComponent>;
  let registrar: any;
  let confirmation: any;
  let dialogRef: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegisterEditLocationComponent],
      providers: [
        ...commonTestProviders({
          session: {
            location: JSON.stringify(LOCATION),
            servicePointID: 3,
            servicePointName: 'SP3',
          },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(RegisterEditLocationComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(RegisterEditLocationComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const form = () => component.demographicEditDetailsForm;

  it('initialises language, master from session and empties state', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.demographicsMaster).toEqual({
      ...LOCATION,
      servicePointID: 3,
      servicePointName: 'SP3',
    });
    expect(component.statesList).toEqual(LOCATION.stateMaster);
    expect(form().value.stateID).toBeNull();
    expect(form().value.stateName).toBeNull();
    expect(form().value.districtID).toBe('');
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('onStateChange', () => {
    it('loads districts and resets district selection', () => {
      form().patchValue({ stateID: 2, districtID: 9, districtName: 'x' });
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ districtID: 5, districtName: 'D' }] })
      );
      component.onStateChange();
      expect(form().value.stateName).toBe('Kerala');
      expect(registrar.getDistrictList).toHaveBeenCalledWith(2);
      expect(component.districtList).toEqual([
        { districtID: 5, districtName: 'D' },
      ]);
      expect(form().value.districtID).toBeNull();
      expect(form().value.districtName).toBeNull();
    });

    it('alerts on failure', () => {
      registrar.getDistrictList.and.returnValue(of({ statusCode: 5000 }));
      component.onStateChange();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingDemographics,
        'error'
      );
    });

    it('alerts on null response', () => {
      registrar.getDistrictList.and.returnValue(of(null));
      component.onStateChange();
      expect(confirmation.alert).toHaveBeenCalled();
    });
  });

  describe('onDistrictChange', () => {
    beforeEach(() => {
      component.districtList = [
        { districtID: 5, districtName: 'D5' },
        { districtID: 6, districtName: 'D6' },
      ];
      form().patchValue({ districtID: 6, blockID: 1 });
    });

    it('loads sub districts and resets block', () => {
      registrar.getSubDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ blockID: 7, blockName: 'B7' }] })
      );
      component.onDistrictChange();
      expect(form().value.districtName).toBe('D6');
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(6);
      expect(component.subDistrictList.length).toBe(1);
      expect(form().value.blockID).toBeNull();
    });

    it('alerts on failure', () => {
      registrar.getSubDistrictList.and.returnValue(of({ statusCode: 400 }));
      component.onDistrictChange();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingDemographics,
        'error'
      );
    });
  });

  describe('onSubDistrictChange', () => {
    beforeEach(() => {
      component.subDistrictList = [
        { blockID: 7, blockName: 'B7' },
        { blockID: 8, blockName: 'B8' },
      ];
      form().patchValue({ blockID: 7, villageID: 3 });
    });

    it('loads villages and resets village', () => {
      registrar.getVillageList.and.returnValue(
        of({
          statusCode: 200,
          data: [{ districtBranchID: 11, villageName: 'V' }],
        })
      );
      component.onSubDistrictChange();
      expect(form().value.blockName).toBe('B7');
      expect(registrar.getVillageList).toHaveBeenCalledWith(7);
      expect(component.villageList.length).toBe(1);
      expect(form().value.villageID).toBeNull();
      expect(form().value.villageName).toBeNull();
    });

    it('alerts on failure', () => {
      registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
      component.onSubDistrictChange();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingLocationDetails,
        'error'
      );
    });
  });

  it('onVillageChange sets village name', () => {
    component.villageList = [
      { districtBranchID: 11, villageName: 'V11' },
      { districtBranchID: 12, villageName: 'V12' },
    ];
    form().patchValue({ villageID: 12 });
    component.onVillageChange();
    expect(form().value.villageName).toBe('V12');
  });

  it('closeDialog closes without data', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('onSubmitEditLocation closes with the selected location', () => {
    component.villageList = [{ districtBranchID: 11, villageName: 'V11' }];
    form().patchValue({
      stateID: 1,
      stateName: 'Karnataka',
      districtID: 5,
      districtName: 'D5',
      blockID: 7,
      blockName: 'B7',
      villageID: 11,
      villageName: 'V11',
    });
    component.onSubmitEditLocation();
    const expected = {
      selectedState: [{ stateID: 1, stateName: 'Karnataka' }],
      selectedDistrict: [{ districtID: 5, districtName: 'D5' }],
      selectedBlock: [{ blockID: 7, blockName: 'B7' }],
      selectedVillage: [{ villageID: 11, villageName: 'V11' }],
      villageList: component.villageList,
    };
    expect(component.editDetails).toEqual(expected);
    expect(dialogRef.close).toHaveBeenCalledWith({
      event: 'close',
      data: expected,
    });
  });

  it('trackFieldInteraction forwards to tracking', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('state');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'state',
      'Register Edit Location'
    );
  });
});
