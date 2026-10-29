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
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { NurseWorklistComponent } from './nurse-worklist.component';
import { NurseService } from '../shared/services';
import { CameraService } from '../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  autoSpy,
  commonTestProviders,
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  throwingObs,
} from 'src/testing/test-utils';

describe('NurseWorklistComponent', () => {
  let component: NurseWorklistComponent;
  let fixture: ComponentFixture<NurseWorklistComponent>;
  let nurseService: any;
  let cameraService: any;
  let benDetails: any;
  let confirmation: any;
  let session: any;
  let router: Router;

  const makeList = () => [
    {
      beneficiaryID: 111,
      benName: 'Ravi Kumar',
      genderName: 'Male',
      fatherName: 'Suresh',
      districtName: 'Pune',
      villageName: 'Baner',
      preferredPhoneNum: '9999999999',
      benVisitNo: 1,
      beneficiaryRegID: 11,
      benFlowID: 1,
      age: 30,
    },
    {
      beneficiaryID: 222,
      benName: 'Sita Devi',
      genderName: 'Female',
      fatherName: 'Ram',
      districtName: 'Nashik',
      villageName: 'Panchvati',
      preferredPhoneNum: '8888888888',
      benVisitNo: 2,
      beneficiaryRegID: 22,
      benFlowID: 2,
      age: 25,
    },
  ];

  beforeEach(async () => {
    nurseService = autoSpy(NurseService);
    nurseService.getNurseWorklist.and.returnValue(
      of({ statusCode: 200, data: makeList() })
    );
    cameraService = autoSpy(CameraService);
    benDetails = autoSpy(BeneficiaryDetailsService);

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseWorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: NurseService, useValue: nurseService },
        { provide: CameraService, useValue: cameraService },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NurseWorklistComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(Storage.prototype, 'removeItem');
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  describe('ngOnInit', () => {
    it('sets role, clears visit data, loads the worklist and resets beneficiary details', () => {
      expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Nurse');
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('visitCode');
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(
        'caseSheetTMFlag'
      );
      expect(nurseService.getNurseWorklist).toHaveBeenCalled();
      expect(benDetails.reset).toHaveBeenCalled();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('getNurseWorklist', () => {
    it('populates lists, numbers rows and clears the filter on success', () => {
      expect(component.beneficiaryList.length).toBe(2);
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
      expect(component.dataSource.data.map((d: any) => d.sno)).toEqual([1, 2]);
      expect(component.filterTerm).toBeNull();
    });

    it('fills missing fields with "Not Available"', () => {
      nurseService.getNurseWorklist.and.returnValue(
        of({ statusCode: 200, data: [{ beneficiaryID: 1 }] })
      );
      component.getNurseWorklist();
      const row = component.beneficiaryList[0];
      expect(row.genderName).toBe('Not Available');
      expect(row.age).toBe('Not Available');
      expect(row.benVisitNo).toBe('Not Available');
      expect(row.districtName).toBe('Not Available');
      expect(row.villageName).toBe('Not Available');
      expect(row.fatherName).toBe('Not Available');
      expect(row.preferredPhoneNum).toBe('Not Available');
    });

    it('alerts the error message and empties the table on a non-200 response', () => {
      nurseService.getNurseWorklist.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'failed' })
      );
      component.getNurseWorklist();
      expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
      expect(component.dataSource.data).toEqual([]);
    });

    it('alerts when data is null', () => {
      nurseService.getNurseWorklist.and.returnValue(
        of({ statusCode: 200, data: null, errorMessage: 'no data' })
      );
      component.getNurseWorklist();
      expect(confirmation.alert).toHaveBeenCalledWith('no data', 'error');
    });

    it('alerts the error on an unhandled HTTP failure', () => {
      const err = { status: 500 };
      nurseService.getNurseWorklist.and.returnValue(throwingObs(err));
      component.getNurseWorklist();
      expect(confirmation.alert).toHaveBeenCalledWith(err, 'error');
    });

    it('does not alert when the error was already handled', () => {
      nurseService.getNurseWorklist.and.returnValue(
        throwingObs({ handled: true })
      );
      confirmation.alert.calls.reset();
      component.getNurseWorklist();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('removes currentRole', () => {
      component.ngOnDestroy();
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('currentRole');
    });
  });

  describe('pageChanged', () => {
    it('slices the filtered list for the requested page', () => {
      component.filteredBeneficiaryList = [1, 2, 3, 4, 5];
      component.pageChanged({ page: 2, itemsPerPage: 2 });
      expect(component.pagedList).toEqual([3, 4]);
    });
  });

  describe('patientImageView', () => {
    it('shows the image when one is returned', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(11);
      expect(benDetails.getBeneficiaryImage).toHaveBeenCalledWith(11);
      expect(cameraService.viewImage).toHaveBeenCalledWith('img');
    });

    it('alerts image-not-found otherwise', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(11);
      expect(cameraService.viewImage).not.toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.imageNotFound
      );
    });
  });

  describe('loadNursePatientDetails', () => {
    const ben = makeList()[0];

    it('stores beneficiary details and navigates when confirmed', () => {
      component.loadNursePatientDetails(ben);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.confirmtoProceedFurther
      );
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryGender', 'Male');
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryRegID', 11);
      expect(session.setItem).toHaveBeenCalledWith('benFlowID', 1);
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryID', 111);
      expect(session.setItem).toHaveBeenCalledWith('benVisitNo', 1);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/attendant/nurse/patient/',
        11,
      ]);
    });

    it('does nothing when the user cancels', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.loadNursePatientDetails(ben);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(session.setItem).not.toHaveBeenCalledWith('benFlowID', 1);
    });
  });

  describe('filterBeneficiaryList', () => {
    it('restores the full list for an empty term', () => {
      component.filteredBeneficiaryList = [];
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
      expect(component.dataSource.data.length).toBe(2);
      expect(component.dataSource.data[1].sno).toBe(2);
    });

    it('matches on a searchable field case-insensitively', () => {
      component.filterBeneficiaryList('SITA');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].beneficiaryID).toBe(222);
      expect(component.dataSource.data[0].sno).toBe(1);
    });

    it('matches "first visit" against benVisitNo 1', () => {
      component.beneficiaryList = [{ benVisitNo: 1 }, { benVisitNo: 2 }];
      component.filterBeneficiaryList('first');
      expect(component.filteredBeneficiaryList).toEqual([
        jasmine.objectContaining({ benVisitNo: 1 }),
      ]);
    });

    it('matches "revisit" against other visit numbers', () => {
      component.beneficiaryList = [{ benVisitNo: 1 }, { benVisitNo: 2 }];
      component.filterBeneficiaryList('revisit');
      expect(component.filteredBeneficiaryList).toEqual([
        jasmine.objectContaining({ benVisitNo: 2 }),
      ]);
    });

    it('returns nothing when no field matches', () => {
      component.filterBeneficiaryList('zzz-no-match');
      expect(component.filteredBeneficiaryList).toEqual([]);
      expect(component.dataSource.data).toEqual([]);
    });
  });
});
