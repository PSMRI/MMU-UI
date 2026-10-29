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
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { FindingsComponent } from './findings.component';

describe('FindingsComponent', () => {
  let component: FindingsComponent;
  let fixture: ComponentFixture<FindingsComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let tracking: any;
  let nurseMasterData$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  const originalOffline = environment.isMMUOfflineSync;

  const fever = { chiefComplaint: 'Fever', chiefComplaintID: 1 };
  const cough = { chiefComplaint: 'Cough', chiefComplaintID: 2 };
  const headache = { chiefComplaint: 'Headache', chiefComplaintID: 3 };
  const masterList = () => [cough, fever, headache];

  const row = (fb: FormBuilder) =>
    fb.group({
      chiefComplaint: null,
      chiefComplaintID: null,
      duration: null,
      conceptID: null,
      unitOfDuration: null,
      description: null,
    });

  beforeEach(async () => {
    nurseMasterData$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '2 years' });
    master = autoSpy(MasterdataService, { nurseMasterData$ });
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FindingsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitID: 'v1',
            beneficiaryRegID: 'b1',
            visitCategory: 'General OPD',
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
          },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(FindingsComponent, '');
    fixture = TestBed.createComponent(FindingsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    tracking = TestBed.inject(AmritTrackingService);
    const fb = TestBed.inject(FormBuilder);
    component.generalFindingsForm = new FormGroup({
      complaints: new FormArray([row(fb)]),
      clinicalObservation: new FormControl(null),
    });
    spyOn(console, 'log');
    component.ngOnInit();
    component.assignSelectedLanguage();
    nurseMasterData$.next({ chiefComplaintMaster: masterList() });
  });

  afterEach(() => {
    environment.isMMUOfflineSync = originalOffline;
  });

  const complaints = () =>
    component.generalFindingsForm.controls['complaints'] as FormArray;
  const addRowAfter = (first: any) => {
    complaints().at(0).patchValue({ chiefComplaint: first });
    component.addCheifComplaint();
  };
  const pick = (value: any) => ({ option: { value } });

  it('ngOnInit loads masters and beneficiary and clears provision', () => {
    expect(component.chiefComplaintMaster).toEqual(masterList());
    expect(component.chiefComplaintTemporarayList[0]).toEqual(masterList());
    expect(component.beneficiary).toEqual({ age: '2 years' });
    expect(nurse.clearNCDScreeningProvision).toHaveBeenCalled();
    expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    expect(component.getComplaints()?.length).toBe(1);
  });

  it('getComplaints / getComplaintsList return null without arrays', () => {
    expect(component.getComplaintsList()).toBeNull();
    component.generalFindingsForm = new FormGroup({
      complaint: new FormArray([]),
    });
    expect(component.getComplaints()).toBeNull();
    expect(component.getComplaintsList()).toEqual([]);
  });

  it('ngDoCheck refreshes language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('view mode', () => {
    it('loads findings, fills the table and removes used complaints', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            findings: {
              complaints: [
                { chiefComplaint: 'Fever' },
                { chiefComplaint: 'Xyz' },
              ],
              clinicalObservation: 'obs',
            },
          },
        })
      );
      component.caseRecordMode = 'view';
      nurseMasterData$.next({ chiefComplaintMaster: masterList() });
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'b1',
        'v1',
        'General OPD'
      );
      expect(component.complaintList.length).toBe(2);
      expect(component.dataSource.data.length).toBe(2);
      expect(component.chiefComplaintMaster).toEqual([cough, headache]);
      expect(component.chiefComplaintTemporarayList[0]).toEqual([
        cough,
        headache,
      ]);
      expect(component.generalFindingsForm.value.clinicalObservation).toBe(
        'obs'
      );
    });

    it('ignores responses without findings', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getFindingDetails('b1', 'v1', 'x');
      doctor.getCaseRecordAndReferDetails.and.returnValue(of(null));
      component.getFindingDetails('b1', 'v1', 'x');
      expect(component.complaintList).toEqual([]);
    });
  });

  it('ignores null master data', () => {
    component.chiefComplaintMaster = 'unchanged';
    nurseMasterData$.next(null);
    expect(component.chiefComplaintMaster).toBe('unchanged');
  });

  describe('getSCTid', () => {
    it('patches concept id on success only', () => {
      master.getSnomedCTRecord.and.returnValue(
        of({ statusCode: 200, data: { conceptID: 'C1' } })
      );
      component.getSCTid(pick(fever), 0);
      expect(master.getSnomedCTRecord).toHaveBeenCalledWith('Fever');
      expect(complaints().at(0).value.conceptID).toBe('C1');
      master.getSnomedCTRecord.and.returnValue(of({ statusCode: 500 }));
      component.getSCTid(pick(fever), 0);
      expect(complaints().at(0).value.conceptID).toBe('C1');
    });

    it('swallows errors', () => {
      master.getSnomedCTRecord.and.returnValue(throwingObs());
      component.getSCTid(pick(fever), 0);
      expect(complaints().at(0).value.conceptID).toBeNull();
    });
  });

  describe('filterComplaints', () => {
    it('selects complaint, removes it from other lists and sets fever flags', () => {
      addRowAfter(cough);
      component.filterComplaints(pick(fever), 0);
      expect(component.selectedChiefComplaintList[0]).toBe(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(fever);
      expect(component.chiefComplaintTemporarayList[0]).toContain(fever);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('re-adds the previous selection to other lists when changed', () => {
      addRowAfter(cough);
      component.filterComplaints(pick(fever), 0);
      component.filterComplaints(pick(headache), 0);
      expect(component.chiefComplaintTemporarayList[1]).toContain(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(headache);
      expect(component.selectedChiefComplaintList[0]).toBe(headache);
    });

    it('unknown complaint leaves selection empty', () => {
      component.filterComplaints(pick({ chiefComplaint: 'Fe' }), 0);
      expect(component.selectedChiefComplaintList.length).toBe(0);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });
  });

  describe('setTempvalidation', () => {
    it('fever complaint sets NCD temp and lung assessment', () => {
      complaints().at(0).patchValue({ chiefComplaint: fever });
      component.setTempvalidation();
      expect(component.enableProvisionalDiag).toBeTrue();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(true);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('offline sync flags respiratory complaints', () => {
      environment.isMMUOfflineSync = true;
      complaints()
        .at(0)
        .patchValue({ chiefComplaint: { chiefComplaint: 'Dry Cough' } });
      component.setTempvalidation();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
    });

    it('offline sync ignores non-respiratory complaints', () => {
      environment.isMMUOfflineSync = true;
      complaints().at(0).patchValue({ chiefComplaint: headache });
      component.setTempvalidation();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('online mode does not flag cough', () => {
      environment.isMMUOfflineSync = false;
      complaints().at(0).patchValue({ chiefComplaint: cough });
      component.setTempvalidation();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
    });

    it('handles an empty complaints array', () => {
      complaints().clear();
      component.setTempvalidation();
      expect(component.enableProvisionalDiag).toBeFalse();
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });
  });

  it('addCheifComplaint adds a row with a list excluding chosen complaints', () => {
    complaints().at(0).patchValue({ chiefComplaint: fever });
    component.addCheifComplaint();
    expect(complaints().length).toBe(2);
    expect(component.chiefComplaintTemporarayList[1]).toEqual([
      cough,
      headache,
    ]);
  });

  it('addCheifComplaint does not add a list when every complaint is used', () => {
    component.chiefComplaintMaster = [fever];
    complaints().at(0).patchValue({ chiefComplaint: fever });
    component.addCheifComplaint();
    expect(complaints().length).toBe(2);
    expect(component.chiefComplaintTemporarayList.length).toBe(1);
  });

  describe('removeCheifComplaint', () => {
    it('removes a row and restores complaint to other lists', () => {
      addRowAfter(fever);
      component.filterComplaints(pick(fever), 0);
      component.suggestedChiefComplaintList[0] = [fever];
      component.removeCheifComplaint(0, complaints().at(0));
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(complaints().length).toBe(1);
      expect(component.generalFindingsForm.dirty).toBeTrue();
      expect(component.selectedChiefComplaintList[0]).toBeNull();
      expect(component.suggestedChiefComplaintList[0]).toBeNull();
      expect(component.chiefComplaintTemporarayList[1]).toContain(fever);
    });

    it('resets the last remaining row instead of removing it', () => {
      const f = complaints().at(0);
      f.patchValue({ description: 'x' });
      component.removeCheifComplaint(0, f);
      expect(complaints().length).toBe(1);
      expect(f.value.description).toBeNull();
    });

    it('does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      addRowAfter(fever);
      component.removeCheifComplaint(0, complaints().at(0));
      expect(complaints().length).toBe(2);
      expect(component.generalFindingsForm.dirty).toBeFalse();
    });
  });

  describe('validateDuration', () => {
    it('alerts and clears when duration exceeds age', () => {
      const f = complaints().at(0);
      f.patchValue({ duration: 5, unitOfDuration: 'Years' });
      component.validateDuration(f);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.DurationAge
      );
      expect(f.value.duration).toBeNull();
      expect(f.value.unitOfDuration).toBeNull();
    });

    it('accepts duration within age or incomplete input', () => {
      const f = complaints().at(0);
      f.patchValue({ duration: 3, unitOfDuration: 'Days' });
      component.validateDuration(f);
      f.patchValue({ duration: 3, unitOfDuration: null });
      component.validateDuration(f);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(f.value.duration).toBe(3);
    });
  });

  it('displayChiefComplaint returns name or undefined', () => {
    expect(component.displayChiefComplaint(fever)).toBe('Fever');
    expect(component.displayChiefComplaint(null)).toBeUndefined();
  });

  describe('suggestChiefComplaintList', () => {
    it('string input filters suggestions', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: 'he' });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([headache]);
      expect(f.value.chiefComplaint).toBe('he');
    });

    it('object input filters by its name', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: cough });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([cough]);
    });

    it('no-match string resets the form', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: 'zzz', description: 'd' });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([]);
      expect(f.value.chiefComplaint).toBeNull();
      expect(f.value.description).toBeNull();
    });

    it('null temp list skips filtering', () => {
      const f = complaints().at(0);
      component.chiefComplaintTemporarayList = null;
      component.suggestedChiefComplaintList[0] = [fever];
      f.patchValue({ chiefComplaint: 'he' });
      component.suggestChiefComplaintList(f, 0);
      f.patchValue({ chiefComplaint: fever });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([fever]);
    });
  });

  it('sortChiefComplaintList sorts by name', () => {
    const list = [headache, fever, cough, { ...fever }];
    component.sortChiefComplaintList(list);
    expect(list.map(x => x.chiefComplaint)).toEqual([
      'Cough',
      'Fever',
      'Fever',
      'Headache',
    ]);
  });

  it('checkComplaintFormValidity is false only when all fields filled', () => {
    expect(
      component.checkComplaintFormValidity({
        value: { chiefComplaint: fever, duration: 2, unitOfDuration: 'Days' },
      })
    ).toBeFalse();
    expect(
      component.checkComplaintFormValidity({
        value: { chiefComplaint: fever, duration: 2 },
      })
    ).toBeTrue();
  });

  it('trackFieldInteraction forwards to tracking service', () => {
    component.trackFieldInteraction('duration');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'duration',
      'Findings'
    );
  });

  it('ngOnDestroy unsubscribes subscriptions', () => {
    const a = jasmine.createSpyObj('a', ['unsubscribe']);
    const b = jasmine.createSpyObj('b', ['unsubscribe']);
    component.doctorMasterDataSubscription = a;
    component.beneficiaryDetailSubscription = b;
    component.ngOnDestroy();
    expect(a.unsubscribe).toHaveBeenCalled();
    expect(b.unsubscribe).toHaveBeenCalled();
  });
});
