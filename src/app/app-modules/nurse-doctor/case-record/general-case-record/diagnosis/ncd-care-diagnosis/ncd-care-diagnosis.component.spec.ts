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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { NcdCareDiagnosisComponent } from './ncd-care-diagnosis.component';

describe('NcdCareDiagnosisComponent', () => {
  let component: NcdCareDiagnosisComponent;
  let fixture: ComponentFixture<NcdCareDiagnosisComponent>;
  let doctor: any;
  let search: jasmine.Spy;
  let master$: BehaviorSubject<any>;
  let confirm: any;
  let routeParams: any;

  const masterData = () => ({
    ncdCareConditions: ['Diabetes', 'Hypertension', 'Other'],
    ncdCareTypes: [
      { ncdCareTypeID: 1, ncdCareType: 'Screening' },
      { ncdCareTypeID: 2, ncdCareType: 'Follow-up' },
    ],
  });

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;

  const create = (mode = 'new', data: any = masterData()) => {
    master$.next(data);
    fixture = TestBed.createComponent(NcdCareDiagnosisComponent);
    component = fixture.componentInstance;
    component.generalDiagnosisForm =
      component.utils.createNCDCareDiagnosisForm();
    component.caseRecordMode = mode;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    routeParams = { attendant: 'doctor' };
    master$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService);
    search = jasmine
      .createSpy('searchDiagnosisBasedOnPageNo')
      .and.returnValue(of({ data: { sctMaster: [] } }));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdCareDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'NCD care',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: {
            doctorMasterData$: master$.asObservable(),
            searchDiagnosisBasedOnPageNo: search,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get params() {
                return routeParams;
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NcdCareDiagnosisComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService);
  });

  afterEach(() => fixture?.destroy());

  describe('ngOnInit', () => {
    it('loads master lists and enables NCD condition for doctor', () => {
      create();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.ncdCareConditions).toEqual(
        masterData().ncdCareConditions
      );
      expect(component.ncdCareTypes.length).toBe(2);
      expect(component.attendantType).toBe('doctor');
      expect(component.enableNCDCondition).toBeTrue();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('keeps NCD condition disabled for nurse', () => {
      routeParams = { attendant: 'nurse' };
      create();
      expect(component.enableNCDCondition).toBeFalse();
    });

    it('ignores null master data and partial master data', () => {
      create('view', null);
      expect(component.ncdCareConditions).toBeUndefined();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
      master$.next({});
      expect(component.ncdCareTypes).toBeUndefined();
    });

    it('fetches and patches diagnosis in view mode', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diagnosis: {
              ncdScreeningConditionArray: ['Diabetes', 'Other'],
              ncdScreeningConditionOther: 'Thyroid',
              ncdCareType: 'Follow-up',
              ncdComplication: 'none',
              provisionalDiagnosisList: [
                { term: 'DM', conceptID: 'C1' },
                { term: 'HTN', conceptID: 'C2' },
              ],
            },
          },
        })
      );
      create('view');
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'B1',
        'V1',
        'NCD care'
      );
      const v = component.generalDiagnosisForm.value;
      expect(component.temp).toEqual(['Diabetes', 'Other']);
      expect(component.isNcdScreeningConditionOther).toBeTrue();
      expect(v.ncdCareType).toEqual({
        ncdCareTypeID: 2,
        ncdCareType: 'Follow-up',
      });
      expect(v.ncdScreeningConditionOther).toBe('Thyroid');
      expect(list().length).toBe(2);
      expect(list().at(1).value.term).toBe('HTN');
      expect(
        list().at(0).get('viewProvisionalDiagnosisProvided')?.disabled
      ).toBeTrue();
    });

    it('patches diagnosis without provisional list or known care type', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { diagnosis: { ncdCareType: 'Unknown', ncdComplication: 'x' } },
        })
      );
      create('view');
      const v = component.generalDiagnosisForm.value;
      expect(v.ncdCareType).toBe('Unknown');
      expect(v.ncdComplication).toBe('x');
      expect(component.isNcdScreeningConditionOther).toBeFalse();
      expect(component.temp).toEqual([]);
      expect(list().length).toBe(1);
    });

    it('ignores view response without diagnosis', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500 })
      );
      create('view');
      expect(component.generalDiagnosisForm.value.ncdComplication).toBeNull();
    });
  });

  describe('after init', () => {
    beforeEach(() => create());

    it('exposes provisional diagnosis controls', () => {
      expect(component.provisionalDiagnosisControls.length).toBe(1);
      component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
      expect(component.provisionalDiagnosisControls).toEqual([]);
    });

    it('patchProvisionalDiagnosisDetails skips empty first diagnosis', () => {
      component.patchProvisionalDiagnosisDetails([{ term: '', conceptID: '' }]);
      expect(list().at(0).value.term).toBeNull();
    });

    it('addDiagnosis adds up to 30 then alerts', () => {
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

      it('keeps the row when declined', () => {
        confirm.confirm.and.returnValue(of(false));
        fillValid(0);
        component.deleteDiagnosis(0, list().at(0));
        expect(list().at(0).value.term).toBe('T0');
      });

      it('removes invalid rows directly', () => {
        component.addDiagnosis();
        fillValid(0);
        component.deleteDiagnosis(1, list().at(1));
        expect(confirm.confirm).not.toHaveBeenCalled();
        expect(list().length).toBe(1);
        const only = list().at(0);
        list().at(0).reset();
        component.deleteDiagnosis(0, only);
        expect(list().length).toBe(1);
        expect(list().at(0)).not.toBe(only);
      });
    });

    it('checkProvisionalDiagnosisValidity requires term and conceptID', () => {
      expect(
        component.checkProvisionalDiagnosisValidity({
          value: { term: 'a', conceptID: 'b' },
        })
      ).toBeFalse();
      expect(
        component.checkProvisionalDiagnosisValidity({
          value: { conceptID: 'b' },
        })
      ).toBeTrue();
    });

    it('changeNcdScreeningCondition toggles Other and stores the array', () => {
      component.changeNcdScreeningCondition(null, {
        value: ['Diabetes', 'Other'],
      });
      expect(component.isNcdScreeningConditionOther).toBeTrue();
      expect(component.temp).toEqual(['Diabetes', 'Other']);
      component.generalDiagnosisForm.patchValue({
        ncdScreeningConditionOther: 'x',
      });
      component.changeNcdScreeningCondition(null, { value: ['Diabetes'] });
      expect(component.isNcdScreeningConditionOther).toBeFalse();
      expect(
        component.generalDiagnosisForm.value.ncdScreeningConditionOther
      ).toBeNull();
      expect(
        component.generalDiagnosisForm.value.ncdScreeningConditionArray
      ).toEqual(['Diabetes']);
      component.changeNcdScreeningCondition(null, { value: null });
      expect(component.isNcdScreeningConditionOther).toBeFalse();
      expect(component.temp).toBeNull();
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
    });

    describe('diagnosis autocomplete', () => {
      const res = (items: any[]) => of({ data: { sctMaster: items } });

      it('resets state for short terms', () => {
        component.suggestedDiagnosisList[0] = [{ term: 'x' }];
        component.onDiagnosisInputKeyup('ab', 0);
        expect(component.suggestedDiagnosisList[0]).toEqual([]);
        expect(component.lastQueryByIndex[0]).toBe('');
        component.onDiagnosisInputKeyup(undefined as any, 0);
        expect(search).not.toHaveBeenCalled();
      });

      it('fetches first page and re-fetches the same term without reset', () => {
        search.and.returnValue(res([{ id: 1 }]));
        component.onDiagnosisInputKeyup(' fev ', 0);
        expect(search).toHaveBeenCalledWith('fev', 0);
        expect(component.suggestedDiagnosisList[0]).toEqual([{ id: 1 }]);
        component.onDiagnosisInputKeyup('fev', 0);
        expect(search).toHaveBeenCalledTimes(2);
        expect(component.noMore[0]).toBeFalse();
      });

      it('marks noMore for missing payload', () => {
        search.and.returnValue(of(null));
        component.onDiagnosisInputKeyup('fev', 0);
        expect(component.suggestedDiagnosisList[0]).toEqual([]);
        expect(component.noMore[0]).toBeTrue();
      });

      it('appends next page with de-duplication', () => {
        search.and.returnValues(
          res([{ id: 1 }, { code: 'c2' }]),
          res([{ id: 1 }, { code: 'c2' }, { term: 't3' }])
        );
        component.onDiagnosisInputKeyup('fev', 0);
        component.onAutoNearEnd(0);
        expect(search.calls.mostRecent().args).toEqual(['fev', 1]);
        expect(component.suggestedDiagnosisList[0]).toEqual([
          { id: 1 },
          { code: 'c2' },
          { term: 't3' },
        ]);
        expect(component.pageByIndex[0]).toBe(1);
      });

      it('append works when no previous list exists', () => {
        component.lastQueryByIndex[2] = 'abc';
        search.and.returnValue(res([{ id: 5 }]));
        component.onAutoNearEnd(2);
        expect(component.suggestedDiagnosisList[2]).toEqual([{ id: 5 }]);
      });

      it('does nothing near end without a query or when noMore', () => {
        component.onAutoNearEnd(0);
        component.lastQueryByIndex[0] = 'abc';
        component.noMore[0] = true;
        component.onAutoNearEnd(0);
        expect(search).not.toHaveBeenCalled();
      });

      it('queues and chains a request while loading', () => {
        const first = new Subject<any>();
        search.and.returnValues(first.asObservable(), res([{ id: 2 }]));
        component.onDiagnosisInputKeyup('fev', 0);
        component.onAutoNearEnd(0);
        expect(component.wantMore[0]).toBeTrue();
        component.onDiagnosisInputKeyup('fev', 0);
        expect(search).toHaveBeenCalledTimes(1);
        first.next({ data: { sctMaster: [{ id: 1 }] } });
        first.complete();
        expect(search).toHaveBeenCalledTimes(2);
        expect(component.suggestedDiagnosisList[0]).toEqual([
          { id: 1 },
          { id: 2 },
        ]);
      });

      it('ignores stale results', () => {
        const first = new Subject<any>();
        search.and.returnValue(first.asObservable());
        component.onDiagnosisInputKeyup('fev', 0);
        component.lastQueryByIndex[0] = 'other';
        first.next({ data: { sctMaster: [{ id: 1 }] } });
        first.complete();
        expect(component.suggestedDiagnosisList[0]).toEqual([]);
        expect(component.loadingMore[0]).toBeFalse();
      });

      it('logs on search error', () => {
        const err = spyOn(console, 'error');
        search.and.returnValue(throwingObs());
        component.onDiagnosisInputKeyup('fev', 0);
        expect(err).toHaveBeenCalledWith('Error fetching diagnosis data');
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

      it('skips scrollable panels, exhausted rows and short queries', () => {
        component.lastQueryByIndex[0] = 'fever';
        component.onPanelReady(0, panel(500, 100));
        component.noMore[1] = true;
        component.lastQueryByIndex[1] = 'fever';
        component.onPanelReady(1, panel(50, 100));
        component.lastQueryByIndex[2] = 'fe';
        component.onPanelReady(2, panel(50, 100));
        expect(search).not.toHaveBeenCalled();
      });

      it('prefetches up to 3 extra pages while not scrollable', () => {
        component.lastQueryByIndex[0] = 'fever';
        search.and.callFake((_: any, p: number) =>
          of({ data: { sctMaster: [{ id: p }] } })
        );
        component.onPanelReady(0, panel(50, 100));
        runFrames();
        expect(search.calls.allArgs()).toEqual([
          ['fever', 1],
          ['fever', 2],
          ['fever', 3],
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
        expect(search).not.toHaveBeenCalled();
      });
    });
  });
});
