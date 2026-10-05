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

import { NurseRefferedWorklistComponent } from './nurse-reffered-worklist.component';
import { NurseService } from '../../shared/services';
import {
  BeneficiaryDetailsService,
  CameraService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  autoSpy,
  commonTestProviders,
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  throwingObs,
} from 'src/testing/test-utils';

describe('NurseRefferedWorklistComponent', () => {
  let fixture: ComponentFixture<NurseRefferedWorklistComponent>;
  let component: NurseRefferedWorklistComponent;
  let nurseService: any;
  let cameraService: any;
  let benDetails: any;
  let confirmation: any;
  let session: any;
  let router: Router;
  let removeSpy: jasmine.Spy;
  let setSpy: jasmine.Spy;

  const makeList = () => [
    {
      beneficiaryID: 101,
      benName: 'Asha',
      genderName: 'Female',
      VisitCategory: 'NCD screening',
      benVisitNo: 1,
      beneficiaryRegID: 1,
      benFlowID: 10,
      benVisitID: 100,
      visitCode: 1000,
    },
    {
      beneficiaryID: 202,
      benName: 'Bala',
      genderName: 'Male',
      VisitCategory: 'General OPD',
      benVisitNo: 3,
      beneficiaryRegID: 2,
      benFlowID: 20,
      benVisitID: 200,
      visitCode: 2000,
    },
  ];

  beforeEach(async () => {
    nurseService = autoSpy(NurseService);
    nurseService.getNurseWorklistTMreferred.and.returnValue(
      of({ statusCode: 200, data: makeList() })
    );
    cameraService = autoSpy(CameraService);
    benDetails = autoSpy(BeneficiaryDetailsService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseRefferedWorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: NurseService, useValue: nurseService },
        { provide: CameraService, useValue: cameraService },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NurseRefferedWorklistComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    removeSpy = spyOn(Storage.prototype, 'removeItem');
    setSpy = spyOn(Storage.prototype, 'setItem');
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  describe('ngOnInit / loadWorklist', () => {
    it('sets the doctor role, clears visit data and loads the TM referred worklist', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Doctor');
      expect(removeSpy).toHaveBeenCalledWith('tmCaseSheet');
      expect(removeSpy).toHaveBeenCalledWith('visitCat');
      expect(removeSpy).toHaveBeenCalledWith('disableNoOnSuccessOfYes');
      expect(nurseService.getNurseWorklistTMreferred).toHaveBeenCalled();
    });

    it('keeps all rows in the table but filters the list to NCD screening', () => {
      expect(component.dataSource.data.length).toBe(2);
      expect(component.dataSource.data.map((r: any) => r.sno)).toEqual([1, 2]);
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.filteredBeneficiaryList[0].beneficiaryID).toBe(101);
      expect(component.currentPage).toBe(1);
      expect(component.filterTerm).toBeNull();
    });

    it('fills missing fields with "Not Available"', () => {
      nurseService.getNurseWorklistTMreferred.and.returnValue(
        of({ statusCode: 200, data: [{}] })
      );
      component.loadWorklist();
      const row = component.beneficiaryList[0];
      expect(row.benFlowID).toBe('Not Available');
      expect(row.genderName).toBe('Not Available');
      expect(row.isTMVisitDone).toBe('Not Available');
      expect(typeof row.visitDate).toBe('string');
    });

    it('alerts on a non-200 response', () => {
      nurseService.getNurseWorklistTMreferred.and.returnValue(
        of({ statusCode: 500, errorMessage: 'err' })
      );
      component.loadWorklist();
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
    });
  });

  describe('filterBeneficiaryList', () => {
    it('restores the full list for an empty term', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
      expect(component.dataSource.data.length).toBe(2);
    });

    it('filters on searchable fields', () => {
      component.filterBeneficiaryList('bala');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID)
      ).toEqual([202]);
    });

    it('matches visit number labels', () => {
      component.beneficiaryList = [{ benVisitNo: 1 }, { benVisitNo: 2 }];
      component.filterBeneficiaryList('first visit');
      expect(component.filteredBeneficiaryList).toEqual([
        jasmine.objectContaining({ benVisitNo: 1 }),
      ]);
      component.filterBeneficiaryList('revisit');
      expect(component.filteredBeneficiaryList).toEqual([
        jasmine.objectContaining({ benVisitNo: 2 }),
      ]);
    });
  });

  it('pageChanged slices the filtered list', () => {
    component.filteredBeneficiaryList = [1, 2, 3];
    component.pageChanged({ page: 2, itemsPerPage: 2 });
    expect(component.pagedList as any[]).toEqual([3]);
  });

  describe('patientImageView', () => {
    it('views the image when available', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({ benImage: 'b64' }));
      component.patientImageView(1);
      expect(cameraService.viewImage).toHaveBeenCalledWith('b64');
    });

    it('alerts when the image is missing', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of(null));
      component.patientImageView(1);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.imageNotFound
      );
    });
  });

  describe('loadNursePatientDetails', () => {
    it('stores details and navigates to the nurse page for specialist_flag 100', () => {
      const ben = { ...makeList()[0], specialist_flag: 100 };
      component.loadNursePatientDetails(ben);
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 1000);
      expect(session.setItem).toHaveBeenCalledWith('visitID', 100);
      expect(session.setItem).toHaveBeenCalledWith('specialist_flag', 100);
      expect(session.setItem).toHaveBeenCalledWith(
        'beneficiaryData',
        JSON.stringify(ben)
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/attendant/nurse/patient/',
        1,
      ]);
    });

    it('does not navigate when the user cancels', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.loadNursePatientDetails({
        ...makeList()[0],
        specialist_flag: 100,
      });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('opens the TM case sheet for specialist_flag 200', () => {
      nurseService.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { a: 1 } })
      );
      const ben = { ...makeList()[1], specialist_flag: 200 };
      component.loadNursePatientDetails(ben);
      expect(setSpy).toHaveBeenCalledWith('tmCaseSheet', 'true');
      expect(session.setItem).toHaveBeenCalledWith('caseSheetTMFlag', 'true');
      expect(nurseService.getTMReferredCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'General OPD',
        benFlowID: 20,
        benVisitID: 200,
        beneficiaryRegID: 2,
        visitCode: 2000,
      });
      expect(component.visitCategory).toBe('General OPD');
      expect(component.caseSheetData).toEqual({ a: 1 });
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/MMU/current',
      ]);
    });

    it('does nothing for other specialist flags', () => {
      component.loadNursePatientDetails({ specialist_flag: 1 });
      expect(confirmation.confirm).not.toHaveBeenCalled();
      expect(nurseService.getTMReferredCasesheetData).not.toHaveBeenCalled();
    });
  });

  describe('viewAndPrintCaseSheet', () => {
    it('does not fetch when neither TM flag nor specialist flag 200 is set', () => {
      spyOn(component, 'setCasesheetData');
      component.viewAndPrintCaseSheet({});
      expect(nurseService.getTMReferredCasesheetData).not.toHaveBeenCalled();
    });

    it('fetches when the specialist flag is 200', () => {
      spyOn(component, 'setCasesheetData');
      session.store.set('specialistFlag', '200');
      component.viewAndPrintCaseSheet({});
      expect(nurseService.getTMReferredCasesheetData).toHaveBeenCalled();
    });
  });

  describe('getTMReferredCasesheetData', () => {
    it('does not route when the consultation confirm is declined', () => {
      nurseService.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      confirmation.confirm.and.returnValue(of(false));
      component.getTMReferredCasesheetData({});
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.consulation
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts the error message on a failed response', () => {
      nurseService.getTMReferredCasesheetData.and.returnValue(
        of({ statusCode: 500, errorMessage: 'nope' })
      );
      component.getTMReferredCasesheetData({});
      expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
    });

    it('alerts a generic message on HTTP error', () => {
      nurseService.getTMReferredCasesheetData.and.returnValue(throwingObs());
      component.getTMReferredCasesheetData({});
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Error in fetching TM Casesheet',
        'error'
      );
    });
  });
});
