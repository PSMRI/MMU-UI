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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { AncDiagnosisComponent } from './anc-diagnosis.component';

describe('AncDiagnosisComponent', () => {
  let component: AncDiagnosisComponent;
  let fixture: ComponentFixture<AncDiagnosisComponent>;
  let doctor: any;
  let benSvc: any;
  let nurseMaster$: BehaviorSubject<any>;
  let hrp$: BehaviorSubject<any>;

  const masterData = {
    pregComplicationTypes: [
      { pregComplicationID: 1, pregComplicationType: 'None' },
      { pregComplicationID: 2, pregComplicationType: 'Other' },
      { pregComplicationID: 3, pregComplicationType: 'Hypothyroidism' },
      { pregComplicationID: 4, pregComplicationType: 'Anemia' },
    ],
  };

  const buildForm = () =>
    new FormGroup({
      gravida_G: new FormControl(null),
      duration: new FormControl(null),
      highRiskStatus: new FormControl(null),
      highRiskCondition: new FormControl(null),
      complicationOfCurrentPregnancyList: new FormControl([]),
      otherCurrPregComplication: new FormControl('keep'),
      isMaternalDeath: new FormControl(null),
      placeOfDeath: new FormControl('Home'),
      dateOfDeath: new FormControl('2024-01-01'),
      causeOfDeath: new FormControl('Bleeding'),
    });

  const create = (mode = 'new', master: any = masterData) => {
    nurseMaster$.next(master);
    fixture = TestBed.createComponent(AncDiagnosisComponent);
    component = fixture.componentInstance;
    component.generalDiagnosisForm = buildForm();
    component.caseRecordMode = mode;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    nurseMaster$ = new BehaviorSubject<any>(null);
    hrp$ = new BehaviorSubject<any>(0);
    doctor = autoSpy(DoctorService);
    benSvc = autoSpy(BeneficiaryDetailsService, {
      HRPPositiveFlag$: hrp$.asObservable(),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'B1',
            visitCode: 'VC1',
            visitID: 'V1',
            visitCategory: 'ANC',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: nurseMaster$.asObservable() },
        },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AncDiagnosisComponent, '')
      .compileComponents();
  });

  afterEach(() => fixture?.destroy());

  describe('ngOnInit', () => {
    it('resets HRP, fetches HRP details and master data', () => {
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } })
      );
      create();
      expect(benSvc.resetHRPPositive).toHaveBeenCalled();
      expect(doctor.getHRPDetails).toHaveBeenCalledWith('B1', 'VC1');
      expect(component.masterData).toBe(masterData);
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      const diff =
        component.today.getTime() - component.minimumDeathDate.getTime();
      expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('HRP flag stream overrides showHRP', () => {
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } })
      );
      create();
      // flag stream (0) subscribed after fetch -> false
      expect(component.showHRP).toBe('false');
      hrp$.next(2);
      expect(component.showHRP).toBe('true');
      hrp$.next(0);
      expect(component.showHRP).toBe('false');
    });

    it('fetchHPRPositive maps isHRP to showHRP', () => {
      create();
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } })
      );
      component.fetchHPRPositive();
      expect(component.showHRP).toBe('true');
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } })
      );
      component.fetchHPRPositive();
      expect(component.showHRP).toBe('false');
      component.showHRP = 'unchanged';
      doctor.getHRPDetails.and.returnValue(of({ statusCode: 500 }));
      component.fetchHPRPositive();
      expect(component.showHRP).toBe('unchanged');
    });

    it('keeps masterData undefined when master stream is null', () => {
      create('new', null);
      expect(component.masterData).toBeUndefined();
    });

    it('fetches and patches diagnosis in view mode', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diagnosis: {
              highRiskStatus: 'Yes',
              dateOfDeath: '2024-02-03T00:00:00.000Z',
              complicationOfCurrentPregnancyList: [
                { pregComplicationType: 'Other' },
                { pregComplicationType: 'Unknown' },
              ],
              otherCurrPregComplication: 'something',
            },
          },
        })
      );
      create('view');
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'B1',
        'V1',
        'ANC'
      );
      const v = component.generalDiagnosisForm.value;
      expect(v.highRiskStatus).toBe('Yes');
      expect(v.dateOfDeath instanceof Date).toBeTrue();
      expect(v.complicationOfCurrentPregnancyList).toEqual([
        masterData.pregComplicationTypes[1],
      ]);
      expect(v.otherCurrPregComplication).toBe('something');
      expect(component.showOtherPregnancyComplication).toBeTrue();
    });

    it('does not patch when view response lacks diagnosis', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      create('view');
      expect(component.generalDiagnosisForm.value.highRiskStatus).toBeNull();
    });
  });

  describe('after init', () => {
    beforeEach(() => create());

    it('patchComplicationOfCurrentPregnancyList drops all without master data', () => {
      component.masterData = null;
      const diagnosis: any = {
        complicationOfCurrentPregnancyList: [{ pregComplicationType: 'None' }],
      };
      component.patchComplicationOfCurrentPregnancyList(diagnosis);
      expect(diagnosis.complicationOfCurrentPregnancyList).toEqual([]);
      expect(component.showAllPregComplication).toBeTrue();
    });

    it('patchDiagnosisDetails keeps null death date', () => {
      component.patchDiagnosisDetails({
        dateOfDeath: null,
        complicationOfCurrentPregnancyList: [],
      });
      expect(component.generalDiagnosisForm.value.dateOfDeath).toBeNull();
    });

    it('exposes form getters', () => {
      component.generalDiagnosisForm.patchValue({
        highRiskStatus: 'No',
        highRiskCondition: 'c',
        complicationOfCurrentPregnancyList: [{ pregComplicationType: 'x' }],
      });
      expect(component.highRiskStatus?.value).toBe('No');
      expect(component.highRiskCondition?.value).toBe('c');
      expect(component.complicationOfCurrentPregnancyList).toEqual([
        { pregComplicationType: 'x' },
      ]);
    });

    it('checkWithDeathDetails clears death fields', () => {
      component.checkWithDeathDetails();
      const v = component.generalDiagnosisForm.value;
      expect(v.placeOfDeath).toBeNull();
      expect(v.dateOfDeath).toBeNull();
      expect(v.causeOfDeath).toBeNull();
    });

    describe('resetOtherPregnancyComplication', () => {
      it('multiple complications disable None and hide all', () => {
        component.resetOtherPregnancyComplication(
          [
            { pregComplicationType: 'Anemia' },
            { pregComplicationType: 'Other' },
          ],
          0
        );
        expect(component.showOtherPregnancyComplication).toBeTrue();
        expect(component.disableNonePregnancyComplication).toBeTrue();
        expect(component.showAllPregComplication).toBeFalse();
        expect(
          component.generalDiagnosisForm.value.otherCurrPregComplication
        ).toBe('keep');
      });

      it('single None/Nil keeps None enabled and clears other text', () => {
        component.resetOtherPregnancyComplication(
          [{ pregComplicationType: 'Nil' }],
          0
        );
        expect(component.disableNonePregnancyComplication).toBeFalse();
        expect(component.showAllPregComplication).toBeFalse();
        expect(component.showOtherPregnancyComplication).toBeFalse();
        expect(
          component.generalDiagnosisForm.value.otherCurrPregComplication
        ).toBeNull();
        component.resetOtherPregnancyComplication(
          [{ pregComplicationType: 'None' }],
          0
        );
        expect(component.disableNonePregnancyComplication).toBeFalse();
      });

      it('single real complication disables None', () => {
        component.resetOtherPregnancyComplication(
          [{ pregComplicationType: 'Anemia' }],
          { otherCurrPregComplication: 'ignored' }
        );
        expect(component.disableNonePregnancyComplication).toBeTrue();
        expect(
          component.generalDiagnosisForm.value.otherCurrPregComplication
        ).toBe('keep');
      });

      it('empty list shows all and patches other from diagnosis', () => {
        component.resetOtherPregnancyComplication([], 0);
        expect(component.disableNonePregnancyComplication).toBeFalse();
        expect(component.showAllPregComplication).toBeTrue();
        component.resetOtherPregnancyComplication(
          [{ pregComplicationType: 'Other' }],
          { otherCurrPregComplication: 'from-diag' }
        );
        expect(
          component.generalDiagnosisForm.value.otherCurrPregComplication
        ).toBe('from-diag');
      });
    });

    it('displayPositive flags hypothyroidism as HRP', () => {
      component.displayPositive([{ pregComplicationType: 'Hypothyroidism' }]);
      expect(component.complicationPregHRP).toBe('true');
      component.displayPositive([{ pregComplicationType: 'Anemia' }]);
      expect(component.complicationPregHRP).toBe('false');
    });

    it('ngOnDestroy unsubscribes master data', () => {
      const sub = component.nurseMasterDataSubscription;
      spyOn(sub, 'unsubscribe').and.callThrough();
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
      component.nurseMasterDataSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
