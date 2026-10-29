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

import { OncologistWorklistComponent } from './oncologist-worklist.component';
import { DoctorService } from '../shared/services/doctor.service';
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

describe('OncologistWorklistComponent', () => {
  let fixture: ComponentFixture<OncologistWorklistComponent>;
  let component: OncologistWorklistComponent;
  let doctorService: any;
  let cameraService: any;
  let benDetails: any;
  let confirmation: any;
  let session: any;
  let router: Router;
  let removeSpy: jasmine.Spy;

  const makeList = () => [
    {
      beneficiaryID: 11,
      benName: 'Kavya',
      genderName: 'Female',
      age: '30 Years',
      VisitCategory: 'Cancer Screening',
      districtName: 'Pune',
      beneficiaryRegID: 1,
      benFlowID: 5,
      benVisitID: 6,
      visitCode: 7,
      doctorFlag: 1,
      nurseFlag: 9,
      pharmacist_flag: 0,
      visitFlowStatusFlag: 'N',
      visitDate: '2024-01-02T10:00:00',
    },
    {
      beneficiaryID: 22,
      benName: 'Mohan',
      genderName: 'Male',
      beneficiaryRegID: 2,
      benFlowID: 8,
      benVisitID: 9,
      visitCode: 10,
      VisitCategory: 'NCD screening',
      visitFlowStatusFlag: 'D',
    },
  ];

  beforeEach(async () => {
    doctorService = autoSpy(DoctorService);
    doctorService.getOncologistWorklist.and.returnValue(
      of({ statusCode: 200, data: makeList() })
    );
    cameraService = autoSpy(CameraService);
    benDetails = autoSpy(BeneficiaryDetailsService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [OncologistWorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctorService },
        { provide: CameraService, useValue: cameraService },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(OncologistWorklistComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    removeSpy = spyOn(Storage.prototype, 'removeItem');
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  describe('ngOnInit / loadWorklist', () => {
    it('sets the role, clears visit data and loads the worklist', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Oncologist');
      expect(removeSpy).toHaveBeenCalledWith('visitCode');
      expect(removeSpy).toHaveBeenCalledWith('caseSheetTMFlag');
      expect(doctorService.getOncologistWorklist).toHaveBeenCalled();
      expect(component.dataSource.data.map((r: any) => r.sno)).toEqual([1, 2]);
      expect(component.filterTerm).toBeNull();
    });

    it('formats dates and fills missing fields', () => {
      const [first, second] = component.beneficiaryList;
      expect(first.visitDate).toBe('02-01-2024 10:00 AM ');
      expect(second.age).toBe('Not Available');
      expect(second.districtName).toBe('Not Available');
      expect(second.statusMessage).toBe('Not Available');
      expect(second.preferredPhoneNum).toBe('Not Available');
    });

    it('alerts and clears the table on a failed response', () => {
      doctorService.getOncologistWorklist.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.loadWorklist();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      expect(component.dataSource.data).toEqual([]);
    });

    it('alerts on HTTP error', () => {
      const err = { status: 0 };
      doctorService.getOncologistWorklist.and.returnValue(throwingObs(err));
      component.loadWorklist();
      expect(confirmation.alert).toHaveBeenCalledWith(err, 'error');
    });
  });

  describe('filterBeneficiaryList', () => {
    it('restores the full list for an empty term', () => {
      component.filteredBeneficiaryList = [];
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
    });

    it('filters on searchable fields and renumbers the table', () => {
      component.filterBeneficiaryList('MOHAN');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.dataSource.data[0].beneficiaryID).toBe(22);
      expect(component.dataSource.data[0].sno).toBe(1);
    });

    it('returns an empty list when nothing matches', () => {
      component.filterBeneficiaryList('xyz-none');
      expect(component.filteredBeneficiaryList).toEqual([]);
      expect(component.dataSource.data).toEqual([]);
    });
  });

  it('pageChanged slices the filtered list', () => {
    component.filteredBeneficiaryList = [1, 2, 3, 4];
    component.pageChanged({ page: 2, itemsPerPage: 3 });
    expect(component.pagedList as any[]).toEqual([4]);
  });

  describe('patientImageView', () => {
    it('views the image when available', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(1);
      expect(benDetails.getBeneficiaryImage).toHaveBeenCalledWith(1);
      expect(cameraService.viewImage).toHaveBeenCalledWith('img');
    });

    it('alerts when there is no image', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(1);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.imageNotFound
      );
    });
  });

  describe('loadDoctorExaminationPage', () => {
    it('stores visit details and opens the patient page for a new visit', () => {
      const ben = makeList()[0];
      component.loadDoctorExaminationPage(ben);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.confirmtoProceedFurther
      );
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 7);
      expect(session.setItem).toHaveBeenCalledWith('benFlowID', 5);
      expect(session.setItem).toHaveBeenCalledWith('visitID', 6);
      expect(session.setItem).toHaveBeenCalledWith('doctorFlag', 1);
      expect(session.setItem).toHaveBeenCalledWith('nurseFlag', 9);
      expect(session.setItem).toHaveBeenCalledWith('pharmacist_flag', 0);
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryRegID', 1);
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryID', 11);
      expect(session.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'Cancer Screening'
      );
      expect(router.navigate).toHaveBeenCalledWith(['/common/patient', 1]);
    });

    it('does not navigate when a new visit is not confirmed', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage(makeList()[0]);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(session.setItem).not.toHaveBeenCalledWith('visitID', 6);
    });

    it('opens the case sheet for a completed visit', () => {
      component.loadDoctorExaminationPage(makeList()[1]);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.consulation
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', 8);
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'NCD screening'
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetBeneficiaryRegID',
        2
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 9);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/MMU/current',
      ]);
    });

    it('does not open the case sheet when declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage(makeList()[1]);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
