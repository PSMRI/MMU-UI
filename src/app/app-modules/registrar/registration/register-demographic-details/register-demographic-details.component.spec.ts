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
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from './../../../core/services/confirmation.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { RegisterEditLocationComponent } from '../register-edit-location/register-edit-location.component';
import { RegisterDemographicDetailsComponent } from './register-demographic-details.component';

const LOCATION_DATA = {
  stateID: 1,
  stateName: 'Karnataka',
  districtID: 10,
  districtName: 'Bangalore',
  blockID: 100,
  blockName: 'North',
  subDistrictID: 1000,
  villageName: 'Hebbal',
};
const LOCATION = {
  stateMaster: [
    { stateID: 1, stateName: 'Karnataka' },
    { stateID: 2, stateName: 'Kerala' },
  ],
  villageMaster: [{ districtBranchID: 1000, villageName: 'Hebbal' }],
  otherLoc: {
    blockID: 100,
    blockName: 'North',
    zoneID: 5,
    zoneName: 'Zone5',
    parkingPlaceID: 6,
    parkingPlaceName: 'PP6',
  },
};
const DISTRICTS = [
  { districtID: 10, districtName: 'Bangalore' },
  { districtID: 11, districtName: 'Mysore' },
];
const BLOCKS = [
  { blockID: 100, blockName: 'North' },
  { blockID: 101, blockName: 'South' },
];
const VILLAGES = [
  { districtBranchID: 1000, villageName: 'Hebbal' },
  { districtBranchID: 1001, villageName: 'Yelahanka' },
];
const ok = (data: any) => of({ statusCode: 200, data });
const fail = () => of({ statusCode: 5000 });

const EDIT = {
  beneficiaryID: 'B1',
  i_bendemographics: {
    habitation: 'H',
    addressLine1: 'A1',
    addressLine2: 'A2',
    addressLine3: 'A3',
    pinCode: '560001',
    m_state: { stateID: 2, stateName: 'Kerala', stateCode: 'KL' },
    m_district: { districtID: 20, districtName: 'Kochi' },
    m_districtblock: { blockID: 200, blockName: 'B200' },
    m_districtbranchmapping: { districtBranchID: 2000, villageName: 'V2000' },
    zoneID: 3,
    zoneName: 'Z3',
    parkingPlaceID: 4,
    parkingPlaceName: 'P4',
    servicePointID: 7,
    servicePointName: 'SP7',
  },
};

describe('RegisterDemographicDetailsComponent', () => {
  let component: RegisterDemographicDetailsComponent;
  let fixture: ComponentFixture<RegisterDemographicDetailsComponent>;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let router: Router;
  let form: FormGroup;

  const village0 = () =>
    (form.controls['villages'] as FormArray).at(0) as FormGroup;

  function setup(
    opts: { revisit?: boolean; session?: Record<string, any> } = {}
  ) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>({ m: 1 }),
      beneficiaryEditDetails$: new BehaviorSubject<any>(null),
    });
    registrar.getDistrictList.and.returnValue(ok(DISTRICTS));
    registrar.getSubDistrictList.and.returnValue(ok(BLOCKS));
    registrar.getVillageList.and.returnValue(ok(VILLAGES));
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegisterDemographicDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: opts.session ?? {
            locationData: JSON.stringify(LOCATION_DATA),
            location: JSON.stringify(LOCATION),
            servicePointID: 8,
            servicePointName: 'SP8',
          },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideTemplate(RegisterDemographicDetailsComponent, '');
    fixture = TestBed.createComponent(RegisterDemographicDetailsComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    form = new RegistrationUtils(
      new FormBuilder()
    ).createDemographicDetailsForm();
    component.demographicDetailsForm = form;
    component.patientRevisit = !!opts.revisit;
  }

  afterEach(() => fixture.destroy());

  describe('new registration', () => {
    beforeEach(() => {
      setup();
      fixture.detectChanges();
    });

    it('loads language, master, location and cascades state/district/block/village', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.demographicsEditText).toBe(
        LANGUAGE_EN.bendetails.editLocation
      );
      expect(component.masterData).toEqual({ m: 1 });
      expect(component.locationData).toEqual(LOCATION_DATA);
      expect(component.statesList).toEqual(LOCATION.stateMaster);
      expect(component.zonesList).toEqual([{ zoneID: 5, zoneName: 'Zone5' }]);
      expect(component.parkingPlaceList).toEqual([
        { parkingPlaceID: 6, parkingPlaceName: 'PP6' },
      ]);
      expect(component.servicePointList).toEqual([
        { servicePointID: 8, servicePointName: 'SP8' },
      ]);
      expect(registrar.getDistrictList).toHaveBeenCalledWith(1);
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(10);
      expect(registrar.getVillageList).toHaveBeenCalledWith(100);
      expect(form.value).toEqual(
        jasmine.objectContaining({
          stateID: 1,
          stateName: 'Karnataka',
          districtID: 10,
          districtName: 'Bangalore',
          blockID: 100,
          blockName: 'North',
          zoneID: 5,
          parkingPlace: 6,
          servicePoint: 8,
          servicePointName: 'SP8',
        })
      );
      expect(village0().value.villageID).toEqual({
        districtBranchID: 1000,
        villageName: 'Hebbal',
      });
      expect(component.villageList).toEqual(VILLAGES);
      expect(component.subFilteredVillageMaster[0]).toEqual(VILLAGES);
      expect(component.disableDistrict).toBeFalse();
      expect(component.demographicsVillageList).toBe(form.controls['villages']);
    });

    it('getDemographicsVillageList returns controls or null', () => {
      expect(component.getDemographicsVillageList()).toBe(
        (form.controls['villages'] as FormArray).controls
      );
      component.demographicDetailsForm = new FormGroup({});
      expect(component.getDemographicsVillageList()).toBeNull();
    });

    it('ngOnDestroy unsubscribes master', () => {
      const sub = component.masterDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    it('ignores null master data', () => {
      registrar.registrationMasterDetails$.next(null);
      expect(component.masterData).toEqual({ m: 1 });
    });

    it('ngDoCheck switches text depending on edit state', () => {
      component.demographicsEditEnabled = true;
      component.ngDoCheck();
      expect(component.demographicsEditText).toBe(
        LANGUAGE_EN.common.restoreDefault
      );
      component.demographicsEditEnabled = false;
      component.ngDoCheck();
      expect(component.demographicsEditText).toBe(
        LANGUAGE_EN.bendetails.editLocation
      );
    });

    it('setDemographicDefaults re-enables village and reloads location', () => {
      village0().controls['villageID'].disable();
      component.disableState = false;
      component.setDemographicDefaults();
      expect(village0().controls['villageID'].enabled).toBeTrue();
      expect(component.disableState).toBeTrue();
      expect(registrar.getDistrictList).toHaveBeenCalledTimes(2);
    });

    it('locationErrors alerts and navigates to search', () => {
      component.locationErrors();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesinfetchingLocation,
        'error'
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('chooseLocations and displayVillage', () => {
      expect(component.chooseLocations()).toEqual([{ id: 3, name: 'State' }]);
      expect(component.displayVillage({ villageName: 'X' })).toBe('X');
      expect(component.displayVillage(null)).toBeNull();
    });

    describe('change handlers', () => {
      it('onStateChange loads districts and empties dependents', () => {
        form.patchValue({ stateID: 2 });
        component.onStateChange();
        expect(form.value.stateName).toBe('Kerala');
        expect(component.districtList).toEqual(DISTRICTS);
        expect(form.value.districtID).toBeNull();
        expect(form.value.blockID).toBeNull();
      });

      it('onStateChange alerts on failure', () => {
        registrar.getDistrictList.and.returnValue(fail());
        component.onStateChange();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.issuesInFetchingDemographics,
          'error'
        );
      });

      it('onDistrictChange loads sub districts', () => {
        form.patchValue({ districtID: 11 });
        component.onDistrictChange();
        expect(form.value.districtName).toBe('Mysore');
        expect(component.subDistrictList).toEqual(BLOCKS);
        expect(form.value.blockID).toBeNull();
      });

      it('onDistrictChange alerts on failure', () => {
        registrar.getSubDistrictList.and.returnValue(fail());
        component.onDistrictChange();
        expect(confirmation.alert).toHaveBeenCalled();
      });

      it('onSubDistrictChange loads villages', () => {
        form.patchValue({ blockID: 101 });
        component.onSubDistrictChange();
        expect(form.value.blockName).toBe('South');
        expect(component.subFilteredVillageMaster).toEqual(VILLAGES);
      });

      it('onSubDistrictChange alerts on failure', () => {
        registrar.getVillageList.and.returnValue(of(null));
        component.onSubDistrictChange();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.issuesinfetchingLocation,
          'error'
        );
      });

      it('updateDistrictName by name fetches sub districts', () => {
        component.updateDistrictName('Mysore');
        expect(form.value.districtID).toBe(11);
        expect(registrar.getSubDistrictList).toHaveBeenCalledWith(11);
        expect(form.value.blockID).toBeNull();
      });

      it('fetchSubDistrictsOnDistrictSelection alerts on failure', () => {
        registrar.getSubDistrictList.and.returnValue(fail());
        component.fetchSubDistrictsOnDistrictSelection();
        expect(confirmation.alert).toHaveBeenCalled();
      });

      it('update*Name ignore null values', () => {
        form.patchValue({ stateName: 'keep', districtName: 'keep' });
        component.updateStateName(null);
        component.updateDistrictName(undefined);
        expect(form.value.stateName).toBe('keep');
        expect(form.value.districtName).toBe('keep');
      });

      it('onChangeVillage populates district/taluk', () => {
        registrar.getDistrictTalukList.and.returnValue(
          ok([
            {
              districtID: 11,
              districtName: 'Mysore',
              blockID: 101,
              blockName: 'South',
            },
          ])
        );
        component.onChangeVillage({ districtBranchID: 1000 });
        expect(registrar.getDistrictTalukList).toHaveBeenCalledWith(1000);
        expect(form.value.districtID).toBe(11);
        expect(form.value.blockName).toBe('South');
        expect(component.DistrictTalukList.length).toBe(1);
      });

      it('onChangeVillage alerts on failure', () => {
        registrar.getDistrictTalukList.and.returnValue(fail());
        component.onChangeVillage({ districtBranchID: 1 });
        expect(confirmation.alert).toHaveBeenCalled();
      });
    });

    describe('village suggestions', () => {
      beforeEach(() => {
        component.subFilteredVillageMaster = [VILLAGES];
      });

      it('string value matching a village enables district', () => {
        const g = new FormBuilder().group({ villageID: 'Hebbal' });
        component.suggestedVillageList(g, 0);
        expect(component.suggestedvillageList[0]).toEqual([VILLAGES[0]]);
        expect(component.disableDistrict).toBeFalse();
        expect(component.disableSubDistrict).toBeFalse();
      });

      it('partial string disables district and empties selections', () => {
        form.patchValue({ districtID: 10, blockID: 100 });
        const g = new FormBuilder().group({ villageID: 'heb' });
        component.suggestedVillageList(g, 0);
        expect(component.disableDistrict).toBeTrue();
        expect(component.disableSubDistrict).toBeTrue();
        expect(form.value.districtID).toBeNull();
        expect(g.value.villageID).toBe('heb');
      });

      it('no matches resets the village control', () => {
        const g = new FormBuilder().group({ villageID: 'zzz' });
        component.suggestedVillageList(g, 0);
        expect(component.suggestedvillageList[0]).toEqual([]);
        expect(g.value.villageID).toBeNull();
      });

      it('string without a filtered master uses existing suggestions', () => {
        component.subFilteredVillageMaster = [];
        component.suggestedvillageList[0] = [VILLAGES[1]];
        const g = new FormBuilder().group({ villageID: 'Yelahanka' });
        component.suggestedVillageList(g, 0);
        expect(component.disableDistrict).toBeFalse();
      });

      it('object value in the list still empties district (compares name to object - current behaviour)', () => {
        form.patchValue({ districtID: 10, blockID: 100 });
        const g = new FormBuilder().group({ villageID: VILLAGES[1] });
        component.disableDistrict = true;
        component.suggestedVillageList(g, 0);
        expect(component.suggestedvillageList[0]).toEqual([VILLAGES[1]]);
        // found is always false for object values, so district/block are cleared
        expect(component.disableDistrict).toBeTrue();
        expect(form.value.districtID).toBeNull();
        expect(form.value.blockID).toBeNull();
      });

      it('object value not in the list empties district', () => {
        form.patchValue({ districtID: 10 });
        const g = new FormBuilder().group({
          villageID: { districtBranchID: 9, villageName: 'Hebbal' },
        });
        component.suggestedVillageList(g, 0);
        expect(form.value.districtID).toBeNull();
      });

      it('object value without filtered master keeps suggestions', () => {
        component.subFilteredVillageMaster = null;
        component.suggestedvillageList[0] = [VILLAGES[0]];
        const g = new FormBuilder().group({ villageID: VILLAGES[0] });
        component.suggestedVillageList(g, 0);
        expect(component.disableSubDistrict).toBeFalse();
      });

      it('filterVillage stores the selected village', () => {
        component.filterVillage({ villageName: 'Yelahanka' }, 0);
        expect(component.selectedvillageList[0]).toEqual(VILLAGES[1]);
        // second call exercises the previous-selection branch
        component.filterVillage({ villageName: 'Hebbal' }, 0);
        expect(component.selectedvillageList[0]).toEqual(VILLAGES[0]);
      });

      it('filterVillage with unknown name keeps previous selection', () => {
        component.selectedvillageList[0] = VILLAGES[0];
        component.suggestedvillageList[0] = [];
        component.subFilteredVillageMaster = [];
        component.filterVillage({ villageName: 'Nowhere' }, 0);
        expect(component.selectedvillageList[0]).toEqual(VILLAGES[0]);
      });

      it('sortVillageList sorts by villageName', () => {
        const list = [
          { villageName: 'b' },
          { villageName: 'a' },
          { villageName: 'a' },
          { villageName: 'c' },
        ];
        component.sortVillageList(list);
        expect(list.map(v => v.villageName)).toEqual(['a', 'a', 'b', 'c']);
      });
    });

    it('updateVillageName iterates the village list', () => {
      component.villageList = VILLAGES;
      village0().patchValue({ villageID: { districtBranchID: 1001 } });
      expect(() => component.updateVillageName()).not.toThrow();
      // form has no top-level villageID control, so value is unchanged
      expect(village0().value.villageID).toEqual({ districtBranchID: 1001 });
    });

    describe('confirmEditDemographics (legacy choice dialog)', () => {
      it('checked + state choice enables state editing', () => {
        confirmation.choice.and.returnValue(of(3));
        component.confirmEditDemographics({ checked: true });
        expect(confirmation.choice).toHaveBeenCalledWith('Edit Location', [
          { id: 3, name: 'State' },
        ]);
        expect(component.demographicsEditEnabled).toBeTrue();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.common.restoreDefault
        );
        expect(component.disableState).toBeFalse();
        expect(form.value.stateID).toBeNull();
        expect(component.districtList).toEqual([]);
      });

      it('checked + cancelled choice restores', () => {
        confirmation.choice.and.returnValue(of(null));
        component.confirmEditDemographics({ checked: true });
        expect(component.demographicsEditEnabled).toBeFalse();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.bendetails.editLocation
        );
      });

      it('unchecked + confirm restores defaults', () => {
        spyOn(component, 'setDemographicDefaults');
        component.confirmEditDemographics({ checked: false });
        expect(component.demographicsEditEnabled).toBeFalse();
        expect(component.setDemographicDefaults).toHaveBeenCalled();
      });

      it('unchecked + decline keeps editing', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.confirmEditDemographics({ checked: false });
        expect(component.demographicsEditEnabled).toBeTrue();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.common.restoreDefault
        );
      });

      it('neither checked nor unchecked does nothing', () => {
        component.confirmEditDemographics({});
        expect(confirmation.choice).not.toHaveBeenCalled();
        expect(confirmation.confirm).not.toHaveBeenCalled();
      });
    });

    describe('editReConfig', () => {
      it('1 enables up to taluk', () => {
        component.editReConfig(1);
        expect(component.disableSubDistrict).toBeFalse();
        expect(component.villageList).toEqual([]);
        expect(registrar.getSubDistrictList).toHaveBeenCalledTimes(2);
      });
      it('2 enables up to district', () => {
        component.editReConfig(2);
        expect(component.disableDistrict).toBeFalse();
        expect(component.subDistrictList).toEqual([]);
        expect(registrar.getDistrictList).toHaveBeenCalledTimes(2);
      });
      it('unknown request does nothing', () => {
        component.disableState = true;
        component.editReConfig(99);
        expect(component.disableState).toBeTrue();
      });
    });

    describe('confirmEditDemographicsNew (edit location dialog)', () => {
      const RESULT = {
        data: {
          villageList: VILLAGES,
          selectedVillage: [{ villageID: 1001, villageName: 'Yelahanka' }],
          selectedDistrict: [{ districtID: 11, districtName: 'Mysore' }],
          selectedBlock: [{ blockID: 101, blockName: 'South' }],
          selectedState: [{ stateID: 2, stateName: 'Kerala' }],
        },
      };

      it('applies the selected location from the dialog', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(RESULT) });
        component.confirmEditDemographicsNew({ checked: true });
        expect(dialog.open).toHaveBeenCalledWith(RegisterEditLocationComponent);
        expect(component.demographicsEditEnabled).toBeTrue();
        expect(component.villageList).toEqual(VILLAGES);
        expect(component.suggestedvillageList[0]).toEqual(
          RESULT.data.selectedVillage
        );
        expect(village0().getRawValue().villageID).toEqual({
          districtBranchID: 1001,
          villageName: 'Yelahanka',
        });
        expect(village0().controls['villageID'].disabled).toBeTrue();
        expect(form.value).toEqual(
          jasmine.objectContaining({
            stateID: 2,
            stateName: 'Kerala',
            districtID: 11,
            blockID: 101,
            blockName: 'South',
          })
        );
        expect(component.disableDistrict).toBeTrue();
        expect(component.disableSubDistrict).toBeTrue();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.common.restoreDefault
        );
      });

      it('dialog closed without data restores and re-enables village (new mode)', () => {
        dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
        village0().controls['villageID'].disable();
        component.confirmEditDemographicsNew({ checked: true });
        expect(component.demographicsEditEnabled).toBeFalse();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.bendetails.editLocation
        );
        expect(village0().controls['villageID'].enabled).toBeTrue();
      });

      it('unchecked + confirm resets flags and defaults', () => {
        spyOn(component, 'setDemographicDefaults');
        component.disableVillage = true;
        component.confirmEditDemographicsNew({ checked: false });
        expect(component.disableVillage).toBeFalse();
        expect(component.disableDistrict).toBeFalse();
        expect(component.setDemographicDefaults).toHaveBeenCalled();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.bendetails.editLocation
        );
      });

      it('unchecked + decline keeps edit enabled', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.confirmEditDemographicsNew({ checked: false });
        expect(component.demographicsEditEnabled).toBeTrue();
      });

      it('no checked flag does nothing', () => {
        component.confirmEditDemographicsNew({});
        expect(dialog.open).not.toHaveBeenCalled();
        expect(confirmation.confirm).not.toHaveBeenCalled();
      });
    });
  });

  describe('new registration load failures', () => {
    it('alerts when districts fail to load', () => {
      setup();
      registrar.getDistrictList.and.returnValue(fail());
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingDemographics,
        'error'
      );
      expect(registrar.getSubDistrictList).not.toHaveBeenCalled();
    });

    it('alerts when sub districts fail to load', () => {
      setup();
      registrar.getSubDistrictList.and.returnValue(fail());
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalled();
      expect(registrar.getVillageList).not.toHaveBeenCalled();
    });

    it('alerts when villages fail to load', () => {
      setup();
      registrar.getVillageList.and.returnValue(fail());
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesinfetchingLocation,
        'error'
      );
    });
  });

  describe('new registration without full location', () => {
    it('uses only state master when otherLoc is missing', () => {
      setup({
        session: {
          locationData: JSON.stringify(LOCATION_DATA),
          location: JSON.stringify({ stateMaster: LOCATION.stateMaster }),
          servicePointID: 8,
          servicePointName: 'SP8',
        },
      });
      fixture.detectChanges();
      expect(component.statesList).toEqual(LOCATION.stateMaster);
      expect(component.districtList).toEqual([]);
      expect(component.subDistrictList).toEqual([]);
      expect(component.villageList).toEqual([]);
      expect(form.value.stateID).toBeNull();
      expect(form.value.servicePoint).toBe(8);
      expect(registrar.getDistrictList).not.toHaveBeenCalled();
    });

    it('does nothing when no state master exists', () => {
      setup({
        session: {
          locationData: JSON.stringify(LOCATION_DATA),
          location: JSON.stringify({}),
        },
      });
      fixture.detectChanges();
      expect(component.statesList).toBeUndefined();
      expect(component.servicePointList).toBeUndefined();
    });

    it('falls back to default edit text when language lacks it', () => {
      setup();
      spyOn(component, 'fetchLanguageResponse').and.callFake(() => {
        component.currentLanguageSet = {
          ...LANGUAGE_EN,
          bendetails: { ...LANGUAGE_EN.bendetails, editLocation: '' },
        };
      });
      component.ngOnInit();
      expect(component.demographicsEditText).toBe('Edit Location');
    });
  });

  describe('revisit (edit) mode', () => {
    beforeEach(() => {
      setup({ revisit: true });
      fixture.detectChanges();
    });

    it('does not load location until edit data arrives', () => {
      expect(registrar.getDistrictList).not.toHaveBeenCalled();
      expect(component.revisitData).toBeUndefined();
    });

    it('populates the form from beneficiary edit details', () => {
      registrar.beneficiaryEditDetails$.next(EDIT);
      expect(component.revisitData).toEqual(EDIT);
      expect(component.disableSubDistrict).toBeTrue();
      expect(component.statesList).toEqual(LOCATION.stateMaster);
      expect(component.districtList).toEqual([
        { districtID: 20, districtName: 'Kochi' },
      ]);
      expect(component.subDistrictList).toEqual([
        { blockID: 200, blockName: 'B200' },
      ]);
      expect(component.suggestedvillageList[0]).toEqual([
        { districtBranchID: 2000, villageName: 'V2000' },
      ]);
      expect(component.zonesList).toEqual([{ zoneID: 3, zoneName: 'Z3' }]);
      expect(component.parkingPlaceList).toEqual([
        { parkingPlaceID: 4, parkingPlaceName: 'P4' },
      ]);
      expect(component.servicePointList).toEqual([
        { servicePointID: 7, servicePointName: 'SP7' },
      ]);
      expect(village0().controls['villageID'].disabled).toBeTrue();
      expect(village0().getRawValue().villageID).toEqual({
        districtBranchID: 2000,
        villageName: 'V2000',
      });
      expect(form.value).toEqual(
        jasmine.objectContaining({
          habitation: 'H',
          addressLine1: 'A1',
          addressLine2: 'A2',
          addressLine3: 'A3',
          pincode: '560001',
          stateID: 2,
          stateCode: 'KL',
          districtID: 20,
          blockID: 200,
          zoneID: 3,
          parkingPlace: 4,
          servicePoint: 7,
        })
      );
    });

    it('maps missing demographics to null', () => {
      form.patchValue({ habitation: 'x', stateID: 9, zoneID: 9 });
      registrar.beneficiaryEditDetails$.next({ beneficiaryID: 'B2' });
      expect(form.value.habitation).toBeNull();
      expect(form.value.stateID).toBeNull();
      expect(form.value.zoneID).toBeNull();
      expect(component.districtList).toEqual([
        { districtID: null, districtName: null },
      ]);
    });

    it('keeps statesList when location has no state master', () => {
      (component as any).sessionstorage.store.set(
        'location',
        JSON.stringify({})
      );
      component.statesList = 'prev';
      registrar.beneficiaryEditDetails$.next(EDIT);
      expect(component.statesList).toBe('prev');
    });

    it('ignores edit data without a beneficiaryID', () => {
      registrar.beneficiaryEditDetails$.next({ i_bendemographics: {} });
      expect(component.revisitData).toBeUndefined();
    });

    it('skips defaults if revisit flag is turned off before data arrives', () => {
      component.patientRevisit = false;
      spyOn(component, 'loadBenEditDetails');
      registrar.beneficiaryEditDetails$.next(EDIT);
      expect(component.revisitData).toEqual(EDIT);
      expect(component.loadBenEditDetails).not.toHaveBeenCalled();
    });

    it('dialog closed without data does not touch village in revisit mode', () => {
      registrar.beneficiaryEditDetails$.next(EDIT);
      dialog.open.and.returnValue({ afterClosed: () => of(null) });
      component.confirmEditDemographicsNew({ checked: true });
      expect(village0().controls['villageID'].disabled).toBeTrue();
      expect(component.demographicsEditEnabled).toBeFalse();
    });

    it('ngOnDestroy unsubscribes revisit subscription', () => {
      const sub = component.revisitDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    it('loadLocalMasterForDemographic is a no-op in revisit mode', () => {
      component.statesList = undefined;
      component.loadLocalMasterForDemographic();
      expect(component.statesList).toBeUndefined();
    });
  });
});
