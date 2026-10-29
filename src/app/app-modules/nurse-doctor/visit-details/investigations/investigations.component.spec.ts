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
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { InvestigationsComponent } from './investigations.component';

describe('InvestigationsComponent', () => {
  let component: InvestigationsComponent;
  let fixture: ComponentFixture<InvestigationsComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let nurseMaster$: BehaviorSubject<any>;
  let rbs$: BehaviorSubject<any>;

  const rbs = {
    procedureID: 1,
    procedureName: environment.RBSTest,
    procedureType: 'Laboratory',
  };
  const hb = {
    procedureID: 2,
    procedureName: 'HB',
    procedureType: 'Laboratory',
  };
  const xray = {
    procedureID: 3,
    procedureName: 'X-Ray',
    procedureType: 'Radiology',
  };

  beforeEach(async () => {
    nurseMaster$ = new BehaviorSubject<any>(null);
    rbs$ = new BehaviorSubject<any>(null);
    master = autoSpy(MasterdataService, { nurseMasterData$: nurseMaster$ });
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService, {
      rbsTestResultCurrent$: rbs$,
      rbsTestResultFromDoctorFetch: null,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [InvestigationsComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(InvestigationsComponent, '');
    fixture = TestBed.createComponent(InvestigationsComponent);
    component = fixture.componentInstance;
    component.patientInvestigationsForm = new FormGroup({
      laboratoryList: new FormControl(null),
    });
    spyOn(console, 'log');
  });

  afterEach(() => component.ngOnDestroy());

  it('ngOnInit clears RBS, sets language and filters lab tests', () => {
    fixture.detectChanges();
    nurseMaster$.next({ procedures: [rbs, hb, xray] });
    expect(nurse.clearRbsInVitals).toHaveBeenCalled();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.selectLabTest).toEqual([rbs, hb]);
    expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
  });

  it('ignores master data without procedures', () => {
    fixture.detectChanges();
    nurseMaster$.next({});
    expect(component.selectLabTest).toBeUndefined();
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('view mode', () => {
    beforeEach(() => {
      component.mode = 'view';
    });

    it('fetches investigation and patches lab tests, flagging RBS', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            Investigation: {
              laboratoryList: [
                { procedureID: 1, procedureName: environment.RBSTest },
                { procedureID: 99, procedureName: 'Unknown' },
              ],
            },
          },
        })
      );
      fixture.detectChanges();
      nurseMaster$.next({ procedures: [rbs, hb] });
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.laboratoryList.value).toEqual([rbs]);
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
    });

    it('skips patching when investigation has no lab list', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { Investigation: {} } })
      );
      fixture.detectChanges();
      nurseMaster$.next({ procedures: [hb] });
      expect(component.laboratoryList.value).toBeNull();
    });

    it('skips when investigation is missing', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      fixture.detectChanges();
      nurseMaster$.next({ procedures: [hb] });
      expect(component.patientInvestigationDetails).toBeUndefined();
      expect(component.laboratoryList.value).toBeNull();
    });

    it('ignores non-200 responses', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 5000, data: null })
      );
      fixture.detectChanges();
      nurseMaster$.next({ procedures: [hb] });
      expect(component.patientInvestigationDetails).toBeUndefined();
    });
  });

  describe('rbsTestValidation', () => {
    it('stores RBS result when emitted', () => {
      fixture.detectChanges();
      rbs$.next(120);
      expect(component.RBSTestScore).toBe(120);
      expect(component.RBStestDone).toBeTrue();
      expect(component.rbsTestResultCurrent).toBe(120);
    });

    it('resets current result on null', () => {
      fixture.detectChanges();
      rbs$.next(120);
      rbs$.next(null);
      expect(component.rbsTestResultCurrent).toBeNull();
    });
  });

  describe('canDisable', () => {
    it('is true for RBS test when a current result exists', () => {
      component.rbsTestResultCurrent = 100;
      expect(component.canDisable(rbs)).toBeTrue();
    });

    it('is true for RBS test when doctor fetch result exists', () => {
      component.rbsTestResultCurrent = null;
      nurse.rbsTestResultFromDoctorFetch = 90;
      expect(component.canDisable(rbs)).toBeTrue();
    });

    it('is false for RBS test without any result', () => {
      component.rbsTestResultCurrent = null;
      expect(component.canDisable(rbs)).toBeFalse();
    });

    it('is false for non-RBS tests', () => {
      component.rbsTestResultCurrent = 100;
      expect(component.canDisable(hb)).toBeFalse();
    });
  });

  describe('checkTestName', () => {
    it('marks RBS selected when present', () => {
      component.checkTestName({ value: [hb, rbs] });
      expect(component.RBStestDone).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation.calls.allArgs()).toEqual([
        [false],
        [true],
      ]);
    });

    it('clears RBS selection when absent', () => {
      component.RBStestDone = true;
      component.checkTestName({ value: [hb] });
      expect(component.RBStestDone).toBeFalse();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledOnceWith(
        false
      );
    });
  });

  it('checkInvestigation is a no-op', () => {
    expect(component.checkInvestigation([])).toBeUndefined();
  });

  it('ngOnDestroy unsubscribes everything', () => {
    fixture.detectChanges();
    const subs = [1, 2, 3].map(() =>
      jasmine.createSpyObj('s', ['unsubscribe'])
    );
    component.nurseMasterDataSubscription = subs[0];
    component.getInvestigationDetails = subs[1];
    component.rbsTestResultSubscription = subs[2];
    component.ngOnDestroy();
    subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
  });
});
