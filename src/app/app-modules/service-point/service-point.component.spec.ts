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
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  autoSpy,
  throwingObs,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';
import { ServicePointComponent } from './service-point.component';
import { ServicePointService } from './service-point.service';
import { RegistrarService } from '../registrar/shared/services/registrar.service';
import { SetLanguageComponent } from '../core/components/set-language.component';
import { ConfirmationService } from '../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

const VAN_SP = [
  {
    vanID: 1,
    vanSession: 1,
    vanNoAndType: 'KA01 - Mobile',
    servicePointID: 10,
    servicePointName: 'Alpha',
    facilityID: 99,
  },
  {
    vanID: 1,
    vanSession: 1,
    vanNoAndType: 'KA01 - Mobile',
    servicePointID: 10,
    servicePointName: 'Alpha',
    facilityID: 99,
  },
  {
    vanID: 1,
    vanSession: 1,
    vanNoAndType: 'KA01 - Mobile',
    servicePointID: 11,
    servicePointName: 'Beta',
    facilityID: 99,
  },
  {
    vanID: 2,
    vanSession: 3,
    vanNoAndType: 'KA02',
    servicePointID: 20,
    servicePointName: 'Gamma',
  },
  {
    vanID: 2,
    vanSession: '3',
    vanNoAndType: 'KA02',
    servicePointID: 21,
    servicePointName: 'Delta',
  },
  {
    vanID: 3,
    vanSession: 2,
    vanNoAndType: 'KA03 - Bus',
    servicePointID: 30,
    servicePointName: 'Eps',
  },
];

describe('ServicePointComponent', () => {
  let component: ServicePointComponent;
  let fixture: ComponentFixture<ServicePointComponent>;
  let routeData: BehaviorSubject<any>;
  let spService: any;
  let registrar: any;
  let confirmation: any;
  let session: any;
  let tracking: any;
  let router: Router;

  async function setup(data: any) {
    routeData = new BehaviorSubject<any>(data);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ServicePointComponent],
      providers: [
        ...commonTestProviders({
          session: {
            providerServiceID: 101,
            userID: 7,
            designation: 'Nurse',
          },
        }),
        { provide: ActivatedRoute, useValue: { data: routeData } },
        {
          provide: ServicePointService,
          useValue: autoSpy(ServicePointService),
        },
        { provide: RegistrarService, useValue: autoSpy(RegistrarService) },
        { provide: SetLanguageComponent, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ServicePointComponent, '')
      .compileComponents();
    spService = TestBed.inject(ServicePointService) as any;
    registrar = TestBed.inject(RegistrarService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ServicePointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const ok = (d: any = { UserVanSpDetails: VAN_SP }) => ({
    servicePoints: { statusCode: 200, data: d },
  });

  describe('init / getServicePoint', () => {
    it('loads van service point details from the resolver', async () => {
      await setup(ok());
      expect(component.serviceProviderId).toBe(101);
      expect(component.userId).toBe(7);
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
      expect(component.vanServicepointDetails).toBe(VAN_SP);
    });

    it('ignores 200 without UserVanSpDetails', async () => {
      await setup(ok({}));
      expect(component.vanServicepointDetails).toBeUndefined();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('alerts on 200 with null data and returns to service', async () => {
      await setup({
        servicePoints: { statusCode: 200, data: null, errorMessage: 'none' },
      });
      expect(confirmation.alert).toHaveBeenCalledWith('none', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('alerts on 5002 without navigating', async () => {
      await setup({
        servicePoints: { statusCode: 5002, errorMessage: 'session' },
      });
      expect(confirmation.alert).toHaveBeenCalledWith('session', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts on route data error', async () => {
      await setup(ok());
      (TestBed.inject(ActivatedRoute) as any).data = throwingObs('bad');
      component.getServicePoint();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('ngDoCheck refreshes language', async () => {
      await setup(ok());
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    });
  });

  describe('van / service point filtering', () => {
    beforeEach(async () => {
      await setup(ok());
    });

    it('filterVansList keeps matching session plus full-day vans, de-duplicated', () => {
      component.servicePointForm.controls.sessionID.setValue(1 as any);
      component.servicePointForm.controls.vanID.setValue(5 as any);
      component.filterVansList();
      expect(session.setItem).toHaveBeenCalledWith('sessionID', 1);
      expect(component.vansList.map((v: any) => v.vanID)).toEqual([1, 2]);
      expect(component.servicePointForm.controls.vanID.value).toBeNull();
      expect(component.servicePointsList).toEqual([]);
    });

    it('filterVansList without session or details', () => {
      component.vanServicepointDetails = undefined;
      component.filterVansList();
      expect(session.setItem).not.toHaveBeenCalledWith(
        'sessionID',
        jasmine.anything()
      );
      expect(component.vansList).toEqual([]);
    });

    it('filterServicePointsList filters by van and session, stores details', () => {
      component.servicePointForm.controls.sessionID.setValue(1 as any);
      component.filterVansList();
      component.servicePointForm.controls.vanID.setValue(1 as any);
      component.filterServicePointsList();
      expect(session.setItem).toHaveBeenCalledWith('vanType', 'Mobile');
      expect(session.setItem).toHaveBeenCalledWith(
        'serviceLineDetails',
        JSON.stringify(VAN_SP[0])
      );
      expect(session.setItem).toHaveBeenCalledWith('facilityID', 99);
      expect(component.isDisabled).toBeFalse();
      expect(
        component.servicePointsList.map((s: any) => s.servicePointID)
      ).toEqual([10, 11]);
      expect(component.filteredServicePoints.length).toBe(2);
    });

    it('filterServicePointsList handles string full-day session and no facility', () => {
      component.servicePointForm.controls.sessionID.setValue(1 as any);
      component.filterVansList();
      component.servicePointForm.controls.vanID.setValue(2 as any);
      component.filterServicePointsList();
      expect(session.setItem).not.toHaveBeenCalledWith(
        'facilityID',
        jasmine.anything()
      );
      expect(session.setItem).not.toHaveBeenCalledWith(
        'vanType',
        jasmine.anything()
      );
      expect(
        component.servicePointsList.map((s: any) => s.servicePointID)
      ).toEqual([21]);
    });

    it('filterServicePointsList with no details leaves list empty', () => {
      component.vansList = [{ vanID: 4, vanNoAndType: 'X - Y' }];
      component.vanServicepointDetails = undefined;
      component.servicePointsList = [];
      component.servicePointForm.controls.vanID.setValue(4 as any);
      component.filterServicePointsList();
      expect(component.filteredServicePoints).toEqual([]);
    });

    it('filterServicePointVan filters by name prefix or resets', () => {
      component.servicePointsList = VAN_SP.slice(2);
      component.filterServicePointVan('ga');
      expect(
        component.filteredServicePoints.map((s: any) => s.servicePointName)
      ).toEqual(['Gamma']);
      component.filterServicePointVan('');
      expect(component.filteredServicePoints.length).toBe(4);
    });
  });

  describe('routeToDesignation', () => {
    beforeEach(async () => {
      await setup(ok());
    });

    const cases: [string, string][] = [
      ['Registrar', '/registrar/search'],
      ['Nurse', '/nurse-doctor/nurse-worklist'],
      ['Doctor', '/nurse-doctor/doctor-worklist'],
      ['Lab Technician', '/lab'],
      ['Pharmacist', '/pharmacist'],
      ['Radiologist', '/nurse-doctor/radiologist-worklist'],
      ['Oncologist', '/nurse-doctor/oncologist-worklist'],
    ];
    cases.forEach(([d, url]) =>
      it(`routes ${d} to ${url}`, () => {
        component.routeToDesignation(d);
        expect(router.navigate).toHaveBeenCalledWith([url]);
      })
    );

    it('does not route unknown designations', () => {
      component.routeToDesignation('Janitor');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('goToWorkList uses stored designation', () => {
      component.goToWorkList();
      expect(component.designation).toBe('Nurse');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });
  });

  describe('demographics', () => {
    const userDetails = (districtList: any[]) => ({
      userDetails: {
        stateID: 1,
        stateName: 'Karnataka',
        districtList,
        blockList: [{ blockId: 55 }],
      },
      stateMaster: [{ stateID: 1, stateName: 'Karnataka' }],
    });

    beforeEach(async () => {
      await setup(ok());
      component.servicePointsList = VAN_SP.slice(2, 4);
    });

    it('getDemographics fetches and saves location for a matching service point', () => {
      const data = userDetails([{ districtID: 5, districtName: 'Mysore' }]);
      spService.getMMUDemographics.and.returnValue(
        of({ statusCode: 200, data })
      );
      registrar.getSubDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ blockID: 9 }] })
      );
      component.servicePointForm.controls.servicePointName.setValue('Beta');
      component.getDemographics();
      expect(session.setItem).toHaveBeenCalledWith('servicePointID', 11);
      expect(session.setItem).toHaveBeenCalledWith('servicePointName', 'Beta');
      expect(spService.getMMUDemographics).toHaveBeenCalledWith(11, 101);
      expect(session.setItem).toHaveBeenCalledWith(
        'location',
        JSON.stringify(data)
      );
      expect(component.statesList).toEqual(data.stateMaster);
      expect(component.servicePointForm.controls.stateID.value).toBe(1 as any);
      expect(component.servicePointForm.controls.districtID.value).toBe(
        5 as any
      );
      expect(component.servicePointForm.controls.districtName.value).toBe(
        'Mysore'
      );
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(5);
      expect(component.subDistrictList).toEqual([{ blockID: 9 }]);
    });

    it('getDemographics alerts location issue on non-200', () => {
      spService.getMMUDemographics.and.returnValue(of({ statusCode: 500 }));
      component.servicePointForm.controls.servicePointName.setValue('Beta');
      component.getDemographics();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Issues in getting your location, Please try to re-login.',
        'error'
      );
    });

    it('getDemographics resets location when no service point matches', () => {
      component.statesList = [1];
      component.servicePointForm.controls.stateID.setValue(3 as any);
      component.servicePointForm.controls.servicePointName.setValue('Nope');
      component.getDemographics();
      expect(spService.getMMUDemographics).not.toHaveBeenCalled();
      expect(component.statesList).toEqual([]);
      expect(component.servicePointForm.controls.stateID.value).toBeNull();
    });

    it('saveDemographicsToStorage keeps multiple districts without auto-select', () => {
      const list = [{ districtID: 5 }, { districtID: 6 }];
      component.saveDemographicsToStorage(userDetails(list));
      expect(component.districtList).toBe(list);
      expect(registrar.getSubDistrictList).not.toHaveBeenCalled();
    });

    it('saveDemographicsToStorage alerts when userDetails missing', () => {
      component.saveDemographicsToStorage({});
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingLocationDetails,
        'error'
      );
    });

    it('saveDemographicsToStorage alerts location issue when data missing', () => {
      spyOn(component, 'locationGathetingIssues');
      component.saveDemographicsToStorage(null);
      expect(component.locationGathetingIssues).toHaveBeenCalled();
    });
  });

  describe('location masters', () => {
    beforeEach(async () => {
      await setup(ok());
    });

    it('fetchDistricts success and failure', () => {
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [1] })
      );
      component.fetchDistricts(1);
      expect(registrar.getDistrictList).toHaveBeenCalledWith(1);
      expect(component.districtList).toEqual([1]);
      registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.fetchDistricts(1);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingDemographics,
        'error'
      );
    });

    it('fetchDistrictsOnStateSelection sets state name and districts', () => {
      component.statesList = [
        { stateID: 1, stateName: 'A' },
        { stateID: 2, stateName: 'B' },
      ];
      component.servicePointForm.controls.blockID.setValue(4 as any);
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [9] })
      );
      component.fetchDistrictsOnStateSelection(2);
      expect(component.servicePointForm.controls.stateName.value).toBe('B');
      expect(component.districtList).toEqual([9]);
      expect(component.servicePointForm.controls.blockID.value).toBeNull();
    });

    it('fetchDistrictsOnStateSelection alerts on failure without state', () => {
      registrar.getDistrictList.and.returnValue(of(null));
      component.fetchDistrictsOnStateSelection(null);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesInFetchingDemographics,
        'error'
      );
    });

    it('fetchSubDistrictsOnDistrictSelection sets district name; ignores failure', () => {
      component.districtList = [
        { districtID: 5, districtName: 'M' },
        { districtID: 6, districtName: 'N' },
      ];
      registrar.getSubDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.fetchSubDistrictsOnDistrictSelection(6);
      expect(component.servicePointForm.controls.districtName.value).toBe('N');
      expect(component.subDistrictList).toEqual([]);
      component.fetchSubDistrictsOnDistrictSelection(null);
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(null);
    });

    it('getVillageMaster loads villages or alerts', () => {
      registrar.getVillageList.and.returnValue(
        of({ statusCode: 200, data: [1, 2] })
      );
      component.getVillageMaster({
        userDetails: { blockList: [{ blockId: 55 }] },
      });
      expect(registrar.getVillageList).toHaveBeenCalledWith(55);
      expect(component.villageList).toEqual([1, 2]);
      registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
      component.getVillageMaster(null);
      expect(registrar.getVillageList).toHaveBeenCalledWith(undefined);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesinfetchingLocation,
        'error'
      );
    });

    it('onSubDistrictChange sets block name and villages', () => {
      component.subDistrictList = [
        { blockID: 3, blockName: 'Blk' },
        { blockID: 4, blockName: 'Other' },
      ];
      registrar.getVillageList.and.returnValue(
        of({ statusCode: 200, data: [7] })
      );
      component.onSubDistrictChange(3);
      expect(component.servicePointForm.controls.blockName.value).toBe('Blk');
      expect(component.villageList).toEqual([7]);
      registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
      component.onSubDistrictChange(null);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issuesinfetchingLocation,
        'error'
      );
    });

    it('onDistrictBranchSelection sets village name', () => {
      component.villageList = [
        { districtBranchID: 1, villageName: 'V1' },
        { districtBranchID: 2, villageName: 'V2' },
      ];
      component.onDistrictBranchSelection(2);
      expect(component.servicePointForm.controls.villageName.value).toBe('V2');
      component.onDistrictBranchSelection(null);
      expect(component.servicePointForm.controls.villageName.value).toBe('V2');
    });

    it('saveLocationDataToStorage stores the form location and routes', () => {
      component.servicePointForm.patchValue({
        stateID: 1 as any,
        stateName: 'S',
        districtID: 2 as any,
        districtName: 'D',
        blockID: 3 as any,
        blockName: 'B',
        districtBranchID: 4 as any,
        villageName: 'V',
      });
      component.saveLocationDataToStorage();
      expect(JSON.parse(session.store.get('locationData'))).toEqual({
        stateID: 1,
        stateName: 'S',
        districtID: 2,
        districtName: 'D',
        blockName: 'B',
        blockID: 3,
        subDistrictID: 4,
        villageName: 'V',
      });
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });

    it('trackFieldInteraction forwards to tracking service', () => {
      component.trackFieldInteraction('Van');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Van',
        'Service Point'
      );
    });
  });
});
