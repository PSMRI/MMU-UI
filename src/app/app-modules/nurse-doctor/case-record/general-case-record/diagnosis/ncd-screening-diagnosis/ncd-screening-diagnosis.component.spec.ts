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
import { FormArray } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../../shared/services';
import { NcdScreeningDiagnosisComponent } from './ncd-screening-diagnosis.component';

describe('NcdScreeningDiagnosisComponent', () => {
  let component: NcdScreeningDiagnosisComponent;
  let fixture: ComponentFixture<NcdScreeningDiagnosisComponent>;
  let doctor: any;
  let master: any;
  let confirm: any;
  let enableDiag$: BehaviorSubject<any>;

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    master = autoSpy(MasterdataService);
    enableDiag$ = new BehaviorSubject<any>(false);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdScreeningDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'NCD screening',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: MasterdataService, useValue: master },
        {
          provide: NurseService,
          useValue: { enableProvisionalDiag$: enableDiag$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NcdScreeningDiagnosisComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(NcdScreeningDiagnosisComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    component.generalDiagnosisForm =
      component.utils.createNCDScreeningDiagnosisForm();
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('sets language and exposes provisional diagnosis controls', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
    expect(component.provisionalDiagnosisControls).toEqual([]);
  });

  describe('ngOnChanges', () => {
    it('does nothing outside view mode', () => {
      component.caseRecordMode = 'new';
      component.ngOnChanges();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('fetches and patches diagnosis in view mode', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diagnosis: {
              instruction: 'rest',
              provisionalDiagnosisList: [
                { term: 'Fever', conceptID: 'C1' },
                { term: 'Cough', conceptID: 'C2' },
              ],
            },
          },
        })
      );
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'B1',
        'V1',
        'NCD screening'
      );
      expect(component.generalDiagnosisForm.value.instruction).toBe('rest');
      expect(list().length).toBe(2);
      expect(list().at(1).value).toEqual({
        conceptID: 'C2',
        term: 'Cough',
        provisionalDiagnosis: 'Cough',
      });
      expect(
        list().at(0).get('viewProvisionalDiagnosisProvided')?.disabled
      ).toBeTrue();
      expect(list().at(0).getRawValue().viewProvisionalDiagnosisProvided).toBe(
        'Fever'
      );
    });

    it('ignores view response without diagnosis', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      expect(list().at(0).value.term).toBeNull();
    });
  });

  it('addDiagnosis adds rows until 30 then alerts', () => {
    for (let i = 0; i < 29; i++) component.addDiagnosis();
    expect(list().length).toBe(30);
    component.addDiagnosis();
    expect(list().length).toBe(30);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.maxDiagnosis
    );
  });

  describe('deleteDiagnosis', () => {
    const fillValid = (i: number) =>
      list()
        .at(i)
        .patchValue({
          term: 'T' + i,
          conceptID: 'C' + i,
          provisionalDiagnosis: 'T' + i,
        });

    it('removes a valid row after confirmation when multiple', () => {
      component.addDiagnosis();
      fillValid(0);
      fillValid(1);
      component.deleteDiagnosis(0, list().at(0));
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBe('T1');
    });

    it('resets the only valid row after confirmation', () => {
      fillValid(0);
      component.deleteDiagnosis(0, list().at(0));
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBeNull();
    });

    it('keeps the row when confirmation declined', () => {
      confirm.confirm.and.returnValue(of(false));
      fillValid(0);
      component.deleteDiagnosis(0, list().at(0));
      expect(list().at(0).value.term).toBe('T0');
    });

    it('removes an invalid row directly when multiple', () => {
      component.addDiagnosis();
      fillValid(0);
      component.deleteDiagnosis(1, list().at(1));
      expect(confirm.confirm).not.toHaveBeenCalled();
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBe('T0');
    });

    it('replaces the only invalid row', () => {
      const first = list().at(0);
      component.deleteDiagnosis(0, list().at(0));
      expect(list().length).toBe(1);
      expect(list().at(0)).not.toBe(first);
    });
  });

  it('checkProvisionalDiagnosisValidity requires term and conceptID', () => {
    expect(
      component.checkProvisionalDiagnosisValidity({
        value: { term: 'a', conceptID: 'b' },
      })
    ).toBeFalse();
    expect(
      component.checkProvisionalDiagnosisValidity({ value: { term: 'a' } })
    ).toBeTrue();
  });

  it('displayDiagnosis handles strings, objects and nulls', () => {
    expect(component.displayDiagnosis('abc')).toBe('abc');
    expect(component.displayDiagnosis({ term: 'Fever' })).toBe('Fever');
    expect(component.displayDiagnosis(null)).toBe('');
  });

  it('onDiagnosisSelected patches the row or clears it', () => {
    const sel = { term: 'Fever', conceptID: 'C1' };
    component.onDiagnosisSelected(sel, 0);
    expect(list().at(0).value.viewProvisionalDiagnosisProvided).toBe(sel);
    expect(list().at(0).value.conceptID).toBe('C1');
    expect(list().at(0).value.term).toBe('Fever');
    component.onDiagnosisSelected(null, 0);
    expect(list().at(0).value.term).toBeNull();
    expect(list().at(0).value.conceptID).toBeNull();
  });

  it('tracks enableProvisionalDiag stream', () => {
    expect(component.enableProvisionalDiag).toBeFalse();
    enableDiag$.next(3);
    expect(component.enableProvisionalDiag).toBeTrue();
    enableDiag$.next(0);
    expect(component.enableProvisionalDiag).toBeFalse();
  });

  it('exposes instruction and provisionalDiagnosis getters', () => {
    component.generalDiagnosisForm.patchValue({ instruction: 'rest' });
    expect(component.specialistDaignosis?.value).toBe('rest');
    // form has no top-level provisionalDiagnosis control
    expect(component.doctorDaignosis).toBeNull();
  });

  describe('diagnosis autocomplete', () => {
    const res = (items: any[]) => of({ data: { sctMaster: items } });

    it('resets state for short terms', () => {
      component.suggestedDiagnosisList[0] = [{ term: 'x' }];
      component.onDiagnosisInputKeyup('ab', 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.lastQueryByIndex[0]).toBe('');
      expect(component.pageByIndex[0]).toBe(0);
      component.onDiagnosisInputKeyup(undefined as any, 0);
      expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('fetches the first page for a new term', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 1, term: 'Fever' }])
      );
      component.onDiagnosisInputKeyup(' fev ', 0);
      expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        0
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1, term: 'Fever' },
      ]);
      expect(component.pageByIndex[0]).toBe(0);
      expect(component.loadingMore[0]).toBeFalse();
      expect(component.noMore[0]).toBeFalse();
    });

    it('re-fetches same term without resetting the list', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(res([{ id: 1 }]));
      component.onDiagnosisInputKeyup('fev', 0);
      component.onDiagnosisInputKeyup('fev', 0);
      expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(2);
      expect(component.suggestedDiagnosisList[0]).toEqual([{ id: 1 }]);
    });

    it('marks noMore for empty or missing payload', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(of(null));
      component.onDiagnosisInputKeyup('fev', 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.noMore[0]).toBeTrue();
    });

    it('appends next page with de-duplication', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValues(
        res([{ id: 1 }, { code: 'c2' }]),
        res([{ id: 1 }, { code: 'c2' }, { term: 't3' }])
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.onAutoNearEnd(0);
      expect(
        master.searchDiagnosisBasedOnPageNo.calls.mostRecent().args
      ).toEqual(['fev', 1]);
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { code: 'c2' },
        { term: 't3' },
      ]);
      expect(component.pageByIndex[0]).toBe(1);
    });

    it('append works when no previous list exists', () => {
      component.lastQueryByIndex[2] = 'abc';
      master.searchDiagnosisBasedOnPageNo.and.returnValue(res([{ id: 5 }]));
      component.onAutoNearEnd(2);
      expect(
        master.searchDiagnosisBasedOnPageNo.calls.mostRecent().args
      ).toEqual(['abc', 1]);
      expect(component.suggestedDiagnosisList[2]).toEqual([{ id: 5 }]);
    });

    it('does nothing near end without a query or when noMore', () => {
      component.onAutoNearEnd(0);
      component.lastQueryByIndex[0] = 'abc';
      component.noMore[0] = true;
      component.onAutoNearEnd(0);
      expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('queues and chains a request while loading', () => {
      const first = new Subject<any>();
      master.searchDiagnosisBasedOnPageNo.and.returnValues(
        first.asObservable(),
        res([{ id: 2 }])
      );
      component.onDiagnosisInputKeyup('fev', 0);
      expect(component.loadingMore[0]).toBeTrue();
      component.onAutoNearEnd(0);
      expect(component.wantMore[0]).toBeTrue();
      component.onDiagnosisInputKeyup('fev', 0);
      expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(1);
      first.next({ data: { sctMaster: [{ id: 1 }] } });
      first.complete();
      expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(2);
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
      expect(component.wantMore[0]).toBeFalse();
    });

    it('ignores stale results', () => {
      const first = new Subject<any>();
      master.searchDiagnosisBasedOnPageNo.and.returnValue(first.asObservable());
      component.onDiagnosisInputKeyup('fev', 0);
      component.lastQueryByIndex[0] = 'other';
      first.next({ data: { sctMaster: [{ id: 1 }] } });
      first.complete();
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.loadingMore[0]).toBeFalse();
    });

    it('logs on search error and leaves the row loading', () => {
      const err = spyOn(console, 'error');
      master.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.onDiagnosisInputKeyup('fev', 0);
      expect(err).toHaveBeenCalledWith('Error fetching diagnosis data');
      // complete() never runs after error, so loading flag is not reset
      expect(component.loadingMore[0]).toBeTrue();
    });
  });

  describe('onPanelReady', () => {
    let frames: FrameRequestCallback[];
    const panel = (scrollHeight: number, clientHeight: number) =>
      ({ scrollHeight, clientHeight }) as HTMLElement;
    const runFrames = () => {
      while (frames.length) frames.shift()!(0);
    };

    beforeEach(() => {
      frames = [];
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: any) => {
        frames.push(cb);
        return frames.length;
      });
    });

    it('does nothing when the panel already scrolls', () => {
      component.lastQueryByIndex[0] = 'fever';
      component.onPanelReady(0, panel(500, 100));
      expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('does nothing when there are no more results', () => {
      component.lastQueryByIndex[0] = 'fever';
      component.noMore[0] = true;
      component.onPanelReady(0, panel(50, 100));
      expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('does nothing without a 3+ character query', () => {
      component.lastQueryByIndex[0] = 'fe';
      component.onPanelReady(0, panel(50, 100));
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('prefetches up to 3 extra pages while not scrollable', () => {
      component.lastQueryByIndex[0] = 'fever';
      master.searchDiagnosisBasedOnPageNo.and.callFake((_: any, p: number) =>
        of({ data: { sctMaster: [{ id: p }] } })
      );
      component.onPanelReady(0, panel(50, 100));
      runFrames();
      expect(master.searchDiagnosisBasedOnPageNo.calls.allArgs()).toEqual([
        ['fever', 1],
        ['fever', 2],
        ['fever', 3],
      ]);
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
    });

    it('waits a frame while a page is loading', () => {
      component.lastQueryByIndex[0] = 'fever';
      component.loadingMore[0] = true;
      component.onPanelReady(0, panel(50, 100));
      expect(frames.length).toBe(1);
      component.loadingMore[0] = false;
      component.noMore[0] = true;
      runFrames();
      expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });
  });
});
