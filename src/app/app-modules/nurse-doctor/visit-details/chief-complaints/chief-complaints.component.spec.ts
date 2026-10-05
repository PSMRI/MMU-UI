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
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { VisitDetailUtils } from '../../shared/utility/visit-detail-utility';
import { ChiefComplaintsComponent } from './chief-complaints.component';

describe('ChiefComplaintsComponent', () => {
  let component: ChiefComplaintsComponent;
  let fixture: ComponentFixture<ChiefComplaintsComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let tracking: any;
  let nurseMasterData$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let utils: VisitDetailUtils;
  const originalOffline = environment.isMMUOfflineSync;

  const fever = { chiefComplaint: 'Fever', chiefComplaintID: 1 };
  const cough = { chiefComplaint: 'Cough', chiefComplaintID: 2 };
  const headache = { chiefComplaint: 'Headache', chiefComplaintID: 3 };
  const masterList = () => [cough, fever, headache];

  beforeEach(async () => {
    nurseMasterData$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '2 years' });
    master = autoSpy(MasterdataService, { nurseMasterData$ });
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ChiefComplaintsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitID: 'v1',
            beneficiaryRegID: 'b1',
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
    fixture = TestBed.createComponent(ChiefComplaintsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    tracking = TestBed.inject(AmritTrackingService);
    utils = new VisitDetailUtils(
      TestBed.inject(FormBuilder),
      TestBed.inject(SessionStorageService)
    );
    component.patientChiefComplaintsForm = new FormGroup({
      complaints: new FormArray([utils.createPatientChiefComplaintsForm()]),
    });
    spyOn(console, 'log');
    component.ngOnInit();
    nurseMasterData$.next({ chiefComplaintMaster: masterList() });
  });

  afterEach(() => {
    environment.isMMUOfflineSync = originalOffline;
    component.ngOnDestroy();
  });

  const complaints = () =>
    component.patientChiefComplaintsForm.controls['complaints'] as FormArray;
  const addRowAfter = (first: any) => {
    complaints().at(0).patchValue({ chiefComplaint: first });
    component.addCheifComplaint();
  };

  it('ngOnInit sets language, masters, beneficiary and clears provision', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.chiefComplaintMaster).toEqual(masterList());
    expect(component.chiefComplaintTemporarayList[0]).toEqual(masterList());
    expect(component.beneficiary).toEqual({ age: '2 years' });
    expect(nurse.clearNCDScreeningProvision).toHaveBeenCalled();
    expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    expect(component.getCheifComplaints()?.length).toBe(1);
  });

  it('getCheifComplaints returns null without complaints array', () => {
    component.patientChiefComplaintsForm = new FormGroup({});
    expect(component.getCheifComplaints()).toBeNull();
  });

  describe('view mode', () => {
    const load = (list: any[]) => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { BenChiefComplaints: list } })
      );
      component.mode = 'view';
      nurseMasterData$.next({ chiefComplaintMaster: masterList() });
    };

    it('loads complaints; fever sets NCD temp and provisional diagnosis', () => {
      load([{ chiefComplaint: 'Fever' }]);
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.benChiefComplaints).toEqual([
        { chiefComplaint: 'Fever' },
      ]);
      expect(component.dataSource.data.length).toBe(1);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('offline sync: respiratory complaint enables lung assessment', () => {
      environment.isMMUOfflineSync = true;
      load([{ chiefComplaint: 'Dry cough' }]);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(true);
    });

    it('offline sync: non-respiratory complaint keeps lung assessment off', () => {
      environment.isMMUOfflineSync = true;
      load([{ chiefComplaint: 'Headache' }]);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('empty complaints disable provision', () => {
      load([]);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });

    it('ignores non-200 or null responses', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of(null));
      component.getChiefComplaints('b', 'v');
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 500 }));
      component.getChiefComplaints('b', 'v');
      expect(nurse.setNCDTemp).not.toHaveBeenCalled();
    });
  });

  it('getSCTid patches concept id on success only', () => {
    master.getSnomedCTRecord.and.returnValue(
      of({ statusCode: 200, data: { conceptID: 'C1' } })
    );
    component.getSCTid({ chiefComplaint: 'Fever' }, 0);
    expect(master.getSnomedCTRecord).toHaveBeenCalledWith('Fever');
    expect(complaints().at(0).value.conceptID).toBe('C1');
    master.getSnomedCTRecord.and.returnValue(of({ statusCode: 500 }));
    component.getSCTid({ chiefComplaint: 'Fever' }, 0);
    expect(complaints().at(0).value.conceptID).toBe('C1');
  });

  it('onInputDuration toggles unit field', () => {
    const f = complaints().at(0);
    f.get('duration')?.enable();
    f.patchValue({ duration: 2 });
    component.onInputDuration(f);
    expect(f.get('unitOfDuration')?.enabled).toBeTrue();
    f.patchValue({ duration: null, unitOfDuration: 'Days' });
    component.onInputDuration(f);
    expect(f.get('unitOfDuration')?.disabled).toBeTrue();
    expect(f.get('unitOfDuration')?.value).toBeNull();
  });

  it('reEnterChiefComplaint enables or resets dependent fields', () => {
    const f = complaints().at(0);
    f.patchValue({ chiefComplaint: fever });
    component.reEnterChiefComplaint(f);
    expect(f.get('duration')?.enabled).toBeTrue();
    expect(f.get('description')?.enabled).toBeTrue();
    f.patchValue({ chiefComplaint: null, duration: 3, description: 'x' });
    component.reEnterChiefComplaint(f);
    expect(f.get('duration')?.disabled).toBeTrue();
    expect(f.get('description')?.disabled).toBeTrue();
    expect(f.get('duration')?.value).toBeNull();
  });

  describe('filterComplaints', () => {
    it('selects complaint, removes it from other lists and sets fever flags', () => {
      addRowAfter(cough);
      component.filterComplaints(fever, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(fever);
      expect(component.chiefComplaintTemporarayList[0]).toContain(fever);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
    });

    it('re-adds the previous selection to other lists when changed', () => {
      addRowAfter(cough);
      component.filterComplaints(fever, 0);
      component.filterComplaints(headache, 0);
      expect(component.chiefComplaintTemporarayList[1]).toContain(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(headache);
      expect(component.selectedChiefComplaintList[0]).toBe(headache);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
    });

    it('offline sync flags lung assessment for cough', () => {
      environment.isMMUOfflineSync = true;
      component.filterComplaints(cough, 0);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(true);
    });

    it('unknown complaint with no selection disables provision', () => {
      component.filterComplaints({ chiefComplaint: 'Fe' }, 0);
      expect(component.selectedChiefComplaintList.length).toBe(0);
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

  describe('removeCheifComplaint', () => {
    it('removes a row, restores complaint to other lists and resets flags', () => {
      addRowAfter(fever);
      component.filterComplaints(fever, 0);
      component.removeCheifComplaint(0, complaints().at(0));
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(complaints().length).toBe(1);
      expect(component.patientChiefComplaintsForm.dirty).toBeTrue();
      expect(component.selectedChiefComplaintList[0]).toBeNull();
      expect(component.chiefComplaintTemporarayList[1]).toContain(fever);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('resets the last remaining row instead of removing it', () => {
      const f = complaints().at(0);
      f.patchValue({ createdBy: 'x' });
      component.removeCheifComplaint(0, f);
      expect(complaints().length).toBe(1);
      expect(f.value.createdBy).toBeNull();
    });

    it('offline sync keeps lung assessment when a respiratory complaint remains', () => {
      environment.isMMUOfflineSync = true;
      addRowAfter(fever);
      complaints().at(0).patchValue({ chiefComplaint: null });
      component.filterComplaints(cough, 1);
      component.selectedChiefComplaintList[0] = fever;
      component.removeCheifComplaint(0, complaints().at(0));
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(true);
    });

    it('when not confirmed only re-publishes flags', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeCheifComplaint(0, complaints().at(0));
      expect(complaints().length).toBe(1);
      expect(nurse.setNCDTemp).not.toHaveBeenCalled();
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });
  });

  describe('validateDuration', () => {
    it('alerts and clears when duration exceeds age', () => {
      const f = complaints().at(0);
      f.get('duration')?.enable();
      f.get('unitOfDuration')?.enable();
      f.patchValue({ duration: 5, unitOfDuration: 'Years' });
      component.validateDuration(f);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge
      );
      expect(f.value.duration).toBeNull();
      expect(f.value.unitOfDuration).toBeNull();
    });

    it('accepts duration within age or incomplete input', () => {
      const f = complaints().at(0);
      f.get('duration')?.enable();
      f.get('unitOfDuration')?.enable();
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
    it('string input filters suggestions and enables fields', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: 'he' });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([headache]);
      expect(f.get('duration')?.enabled).toBeTrue();
    });

    it('object input filters by its name', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: cough });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([cough]);
      expect(f.get('description')?.enabled).toBeTrue();
    });

    it('no-match string resets the form', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: 'zzz' });
      component.suggestChiefComplaintList(f, 0);
      expect(component.suggestedChiefComplaintList[0]).toEqual([]);
      expect(f.value.chiefComplaint).toBeNull();
    });

    it('empty input disables and resets dependent fields', () => {
      const f = complaints().at(0);
      f.get('duration')?.enable();
      component.suggestedChiefComplaintList[0] = [fever];
      component.suggestChiefComplaintList(f, 0);
      expect(f.get('duration')?.disabled).toBeTrue();
      expect(f.get('unitOfDuration')?.disabled).toBeTrue();
      expect(f.get('description')?.disabled).toBeTrue();
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
      'Chief Complaints'
    );
  });

  it('ngOnDestroy unsubscribes all subscriptions', () => {
    const subs = ['a', 'b', 'c'].map(n => ({
      unsubscribe: jasmine.createSpy(n),
    }));
    component.nurseMasterDataSubscription = subs[0];
    component.getChiefComplaintDetails = subs[1];
    component.beneficiaryDetailSubscription = subs[2];
    component.ngOnDestroy();
    subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
    component.nurseMasterDataSubscription = null;
    component.getChiefComplaintDetails = null;
    component.beneficiaryDetailSubscription = null;
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
