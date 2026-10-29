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
import { MatDialog } from '@angular/material/dialog';
import { SimpleChange } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { PastObstericHistoryComponent } from './past-obsteric-history.component';

describe('PastObstericHistoryComponent', () => {
  let component: PastObstericHistoryComponent;
  let fixture: ComponentFixture<PastObstericHistoryComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let master$: BehaviorSubject<any>;

  const masterData = () => ({
    pregComplicationTypes: [
      { pregComplicationType: 'Anaemia' },
      { pregComplicationType: 'Other' },
    ],
    pregDuration: [{ durationType: 'Full Term' }],
    deliveryTypes: [
      { deliveryType: 'Normal Delivery' },
      { deliveryType: 'Assisted Delivery' },
      { deliveryType: 'Cesarean Section (LSCS)' },
    ],
    deliveryPlaces: [
      { deliveryPlace: 'Home-Supervised' },
      { deliveryPlace: 'Health Facility' },
    ],
    deliveryComplicationTypes: [{ deliveryComplicationType: 'PPH' }],
    postpartumComplicationTypes: [{ postpartumComplicationType: 'Sepsis' }],
    pregOutcomes: [
      { pregOutcome: 'Live Birth' },
      { pregOutcome: 'Abortion' },
      { pregOutcome: 'Stillbirth' },
    ],
    newBornComplications: [{ complicationValue: 'Jaundice' }],
    typeOfAbortion: [{ complicationValue: 'Induced' }],
    serviceFacilities: [{ facilityName: 'PHC' }],
    postAbortionComplications: [
      { complicationValue: 'Bleeding' },
      { complicationValue: 'None' },
    ],
  });

  const makeForm = () =>
    new FormGroup({
      totalNoOfPreg: new FormControl<any>(null),
      vanID: new FormControl<any>(7),
      parkingPlaceID: new FormControl<any>(8),
      complicationPregList: new FormArray<any>([]),
      pastObstericHistoryList: new FormArray<any>([]),
    });

  const rows = () =>
    component.pastObstericHistoryForm.controls[
      'pastObstericHistoryList'
    ] as FormArray;
  const compl = () =>
    component.pastObstericHistoryForm.controls[
      'complicationPregList'
    ] as FormArray;

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [PastObstericHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitID: 'v1',
            beneficiaryRegID: 'b1',
            serviceLineDetails: JSON.stringify({
              vanID: 7,
              parkingPlaceID: 8,
            }),
          },
        }),
        FormBuilder,
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: master$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PastObstericHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    component.pastObstericHistoryForm = makeForm();
    spyOn(console, 'log');
  });

  describe('initialisation', () => {
    it('renders, sets language and loads master data', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(fixture.nativeElement.textContent).toBeDefined();
      master$.next(masterData());
      expect(component.masterData.pregOutcomes.length).toBe(3);
      expect(component.selectDeliveryTypes.length).toBe(3);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('list getters return controls or null', () => {
      fixture.detectChanges();
      expect(component.getComplicationPregList()).toEqual([]);
      expect(component.getPastObstericHistoryList()).toEqual([]);
      const saved = component.pastObstericHistoryForm;
      component.pastObstericHistoryForm = new FormGroup({});
      expect(component.getComplicationPregList()).toBeNull();
      expect(component.getPastObstericHistoryList()).toBeNull();
      component.pastObstericHistoryForm = saved;
    });

    it('ngOnChanges builds constraints per existing row', () => {
      rows().push(component.formUtility.initPastObstericHistory(1));
      rows().push(component.formUtility.initPastObstericHistory(2));
      component.ngOnChanges({
        pastObstericHistoryForm: new SimpleChange(null, {}, true),
      });
      expect(component.complicationOptionConstraints.length).toBe(2);
      expect(
        component.complicationOptionConstraints[0].showAllPregComplication
      ).toBeTrue();
      component.ngOnChanges({ mode: new SimpleChange(null, 'view', true) });
      expect(component.complicationOptionConstraints.length).toBe(2);
    });
  });

  describe('total number of pregnancies', () => {
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
    });

    it('creates complication checkboxes for non-ANC visits', () => {
      component.visitCategory = 'General OPD';
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
      expect(compl().length).toBe(3);
      expect(component.totalNoOfPreg).toBe(3);
    });

    it('creates one less checkbox for ANC visits and ignores zero', () => {
      component.visitCategory = 'ANC';
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
      expect(compl().length).toBe(2);
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 0 });
      expect(compl().length).toBe(2);
    });

    it('shrinking removes checkboxes and the matching pregnancy rows', () => {
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
      component.togglePastObstericHistory({ checked: true }, 3);
      component.togglePastObstericHistory({ checked: true }, 1);
      expect(rows().length).toBe(2);
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 1 });
      expect(compl().length).toBe(1);
      expect(rows().length).toBe(1);
      expect(rows().at(0).value.pregOrder).toBe(1);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(component.pastObstericHistoryForm.dirty).toBeTrue();
    });

    it('checkTotalPregnancy alerts only for zero in ANC/PNC', () => {
      component.visitCategory = 'ANC';
      component.checkTotalPregnancy(0);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.totalNumberOfPastPregnancyFor + ' ',
        'ANC',
        ' ' + LANGUAGE_EN.cannotBeZero
      );
      component.visitCategory = 'PNC';
      component.checkTotalPregnancy(0);
      component.checkTotalPregnancy(2);
      component.visitCategory = 'General OPD';
      component.checkTotalPregnancy(0);
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('toggle / remove', () => {
    beforeEach(() => fixture.detectChanges());

    it('toggle on adds row and constraint; toggle off for unknown order does nothing', () => {
      component.togglePastObstericHistory({ checked: true }, 2);
      expect(rows().length).toBe(1);
      expect(rows().at(0).value.pregOrder).toBe(2);
      expect(component.complicationOptionConstraints.length).toBe(1);
      component.togglePastObstericHistory({ checked: false }, 5);
      expect(confirm.confirm).not.toHaveBeenCalled();
      expect(component.findPastObstericHistory(2)).toBe(0);
      expect(component.findPastObstericHistory(5)).toBe(-1);
    });

    it('toggle off removes row and saved history entry', () => {
      component.pastObstericHistoryData = {
        femaleObstetricHistoryList: [{ pregOrder: 1 }, { pregOrder: 2 }],
      };
      component.togglePastObstericHistory({ checked: true }, 1);
      component.togglePastObstericHistory({ checked: false }, 1);
      expect(rows().length).toBe(0);
      expect(
        component.pastObstericHistoryData.femaleObstetricHistoryList
      ).toEqual([{ pregOrder: 2 }]);
    });

    it('toggle off without saved history still removes row', () => {
      component.pastObstericHistoryData = {};
      component.togglePastObstericHistory({ checked: true }, 1);
      component.togglePastObstericHistory({ checked: false }, 1);
      expect(rows().length).toBe(0);
    });

    it('cancelled remove re-checks the pregnancy checkbox', () => {
      compl().push(new FormGroup({ value: new FormControl<any>(false) }));
      component.togglePastObstericHistory({ checked: true }, 1);
      component.complicationOptionConstraints.push({});
      confirm.confirm.and.returnValue(of(false));
      component.removePastObstericHistory(0, {}, 1);
      expect(rows().length).toBe(1);
      expect(compl().at(0).value.value).toBeTrue();
      expect(component.complicationOptionConstraints.length).toBe(1);
    });
  });

  describe('complication helpers', () => {
    let row: FormGroup;
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(masterData());
      component.togglePastObstericHistory({ checked: true }, 1);
      row = rows().at(0) as FormGroup;
    });

    const c = () => component.complicationOptionConstraints[0];

    it('resetOtherPregnancyComplication', () => {
      row.patchValue({
        pregComplicationList: [
          { pregComplicationType: 'Other' },
          { pregComplicationType: 'Anaemia' },
        ],
        otherPregComplication: 'x',
      });
      component.resetOtherPregnancyComplication(row, 0);
      expect(c().showOtherPregnancyComplication).toBeTrue();
      expect(c().disableNonePregnancyComplication).toBeTrue();
      expect(c().showAllPregComplication).toBeFalse();
      expect(row.value.otherPregComplication).toBe('x');

      row.patchValue({
        pregComplicationList: [{ pregComplicationType: 'None' }],
      });
      component.resetOtherPregnancyComplication(row, 0);
      expect(c().disableNonePregnancyComplication).toBeFalse();
      expect(row.value.otherPregComplication).toBeNull();

      row.patchValue({
        pregComplicationList: [{ pregComplicationType: 'Nil' }],
      });
      component.resetOtherPregnancyComplication(row, 0);
      expect(c().disableNonePregnancyComplication).toBeFalse();

      row.patchValue({
        pregComplicationList: [{ pregComplicationType: 'Anaemia' }],
      });
      component.resetOtherPregnancyComplication(row, 0);
      expect(c().disableNonePregnancyComplication).toBeTrue();

      row.patchValue({ pregComplicationList: [] });
      component.resetOtherPregnancyComplication(row, 0);
      expect(c().disableNonePregnancyComplication).toBeFalse();
      expect(c().showAllPregComplication).toBeTrue();
    });

    it('resetOtherDeliveryComplication', () => {
      row.patchValue({
        deliveryComplicationList: [
          { deliveryComplicationType: 'Other' },
          { deliveryComplicationType: 'PPH' },
        ],
        otherDeliveryComplication: 'x',
      });
      component.resetOtherDeliveryComplication(row, 0);
      expect(c().showOtherDeliveryComplication).toBeTrue();
      expect(c().disableNoneDeliveryComplication).toBeTrue();
      expect(c().showAllDeliveryComplication).toBeFalse();
      expect(row.value.otherDeliveryComplication).toBe('x');

      row.patchValue({
        deliveryComplicationList: [{ deliveryComplicationType: 'None' }],
      });
      component.resetOtherDeliveryComplication(row, 0);
      expect(c().disableNoneDeliveryComplication).toBeFalse();
      expect(row.value.otherDeliveryComplication).toBeNull();

      row.patchValue({
        deliveryComplicationList: [{ deliveryComplicationType: 'Nil' }],
      });
      component.resetOtherDeliveryComplication(row, 0);
      expect(c().disableNoneDeliveryComplication).toBeFalse();

      row.patchValue({
        deliveryComplicationList: [{ deliveryComplicationType: 'PPH' }],
      });
      component.resetOtherDeliveryComplication(row, 0);
      expect(c().disableNoneDeliveryComplication).toBeTrue();

      row.patchValue({ deliveryComplicationList: [] });
      component.resetOtherDeliveryComplication(row, 0);
      expect(c().showAllDeliveryComplication).toBeTrue();
    });

    it('resetOtherPostpartumComplicationType', () => {
      row.patchValue({
        postpartumComplicationList: [
          { postpartumComplicationType: 'Other' },
          { postpartumComplicationType: 'Sepsis' },
        ],
        otherPostpartumCompType: 'x',
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().showOtherPostpartumComplication).toBeTrue();
      expect(c().disableNonePostpartumComplication).toBeTrue();
      expect(row.value.otherPostpartumCompType).toBe('x');

      row.patchValue({
        postpartumComplicationList: [{ postpartumComplicationType: 'None' }],
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().disableNonePostpartumComplication).toBeFalse();
      expect(row.value.otherPostpartumCompType).toBeNull();

      row.patchValue({
        postpartumComplicationList: [{ postpartumComplicationType: 'Nil' }],
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().disableNonePostpartumComplication).toBeFalse();

      row.patchValue({
        postpartumComplicationList: [{ postpartumComplicationType: 'Sepsis' }],
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().disableNonePostpartumComplication).toBeTrue();

      row.patchValue({ postpartumComplicationList: [] });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().showAllPostpartumComplication).toBeTrue();
    });

    it('resetPostComplicationType', () => {
      row.patchValue({
        postAbortionComplication: [
          { complicationValue: 'Bleeding' },
          { complicationValue: 'Fever' },
        ],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeTrue();
      expect(c().showAllPostComplication).toBeFalse();
      row.patchValue({
        postAbortionComplication: [{ complicationValue: 'None' }],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeFalse();
      row.patchValue({
        postAbortionComplication: [{ complicationValue: 'Nil' }],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeFalse();
      row.patchValue({
        postAbortionComplication: [{ complicationValue: 'Bleeding' }],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeTrue();
      row.patchValue({ postAbortionComplication: [] });
      component.resetPostComplicationType(row, 0);
      expect(c().showAllPostComplication).toBeTrue();
    });

    it('resetOtherDeliveryPlace filters delivery types for home deliveries', () => {
      row.patchValue({ deliveryPlace: { deliveryPlace: 'Home-Supervised' } });
      component.resetOtherDeliveryPlace(row);
      expect(
        component.selectDeliveryTypes.map((d: any) => d.deliveryType)
      ).toEqual(['Normal Delivery']);
      row.patchValue({ deliveryPlace: { deliveryPlace: 'Home-Unsupervised' } });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes.length).toBe(1);
      row.patchValue({
        deliveryPlace: { deliveryPlace: 'Other' },
        otherDeliveryPlace: 'x',
      });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes.length).toBe(3);
      expect(row.value.otherDeliveryPlace).toBeNull();
      row.patchValue({
        deliveryPlace: { deliveryPlace: 'Health Facility' },
        otherDeliveryPlace: 'y',
      });
      component.resetOtherDeliveryPlace(row);
      expect(row.value.otherDeliveryPlace).toBe('y');
    });

    it('resetOtherNewBornComplications clears other text only for Other', () => {
      row.patchValue({
        newBornComplication: { complicationValue: 'Jaundice' },
        otherNewBornComplication: 'x',
      });
      component.resetOtherNewBornComplications(row);
      expect(row.value.otherNewBornComplication).toBe('x');
      row.patchValue({ newBornComplication: { complicationValue: 'Other' } });
      component.resetOtherNewBornComplications(row);
      expect(row.value.otherNewBornComplication).toBeNull();
    });

    it('trackComplication returns value or undefined', () => {
      expect(component.trackComplication({ value: 3 }, 0)).toBe(3);
      expect(component.trackComplication(null, 0)).toBeUndefined();
    });

    it('checkPregnancyOutcome clears fields for abortion and stillbirth', () => {
      row.patchValue({
        pregOutcome: { pregOutcome: 'Abortion' },
        deliveryPlace: { deliveryPlace: 'PHC' },
        newBornComplication: { complicationValue: 'Jaundice' },
      });
      component.checkPregnancyOutcome(row);
      expect(row.value.deliveryPlace).toBeNull();
      expect(row.value.newBornComplication).toBeNull();

      row.patchValue({
        pregOutcome: { pregOutcome: 'Stillbirth' },
        deliveryPlace: { deliveryPlace: 'PHC' },
        congenitalAnomalies: 'x',
      });
      component.checkPregnancyOutcome(row);
      expect(row.value.congenitalAnomalies).toBeNull();
      expect(row.value.deliveryPlace).toEqual({ deliveryPlace: 'PHC' });

      row.patchValue({
        pregOutcome: { pregOutcome: 'Live Birth' },
        congenitalAnomalies: 'y',
      });
      component.checkPregnancyOutcome(row);
      expect(row.value.congenitalAnomalies).toBe('y');
    });

    it('onAbortionType clears facility unless induced', () => {
      row.patchValue({ typeofFacility: { facilityName: 'PHC' } });
      component.onAbortionType(row, 'Induced');
      expect(row.value.typeofFacility).toEqual({ facilityName: 'PHC' });
      component.onAbortionType(row, 'Spontaneous');
      expect(row.value.typeofFacility).toBeNull();
    });

    it('checkDurationType validates 4..24 weeks', () => {
      row.patchValue({ pregDuration: 30 });
      component.checkDurationType(row);
      expect(row.value.pregDuration).toBeNull();
      row.patchValue({ pregDuration: 2 });
      component.checkDurationType(row);
      expect(row.value.pregDuration).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pregnancyRange
      );
      row.patchValue({ pregDuration: 12 });
      component.checkDurationType(row);
      expect(row.value.pregDuration).toBe(12);
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('previous history', () => {
    beforeEach(() => fixture.detectChanges());

    it('opens dialog when data exists', () => {
      component.visitCategory = 'ANC';
      const data = { data: [{}] };
      nurse.getPreviousObstetricHistory.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.getPreviousObstetricHistory();
      expect(nurse.getPreviousObstetricHistory).toHaveBeenCalledWith(
        'b1',
        'ANC'
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.obstetrichistory.previousobstetrichistory,
        },
      });
    });

    it('alerts on empty, failure and error', () => {
      nurse.getPreviousObstetricHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } })
      );
      component.getPreviousObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot
      );
      nurse.getPreviousObstetricHistory.and.returnValue(
        of({ statusCode: 500 })
      );
      component.getPreviousObstetricHistory();
      nurse.getPreviousObstetricHistory.and.returnValue(throwingObs());
      component.getPreviousObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error'
      );
      expect(confirm.alert).toHaveBeenCalledTimes(3);
    });
  });

  describe('view mode', () => {
    it('loads obstetric history and patches rows', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            FemaleObstetricHistory: {
              totalNoOfPreg: 3,
              femaleObstetricHistoryList: [
                {
                  pregOrder: 1,
                  pregComplicationList: [{ pregComplicationType: 'Anaemia' }],
                  durationType: 'Full Term',
                  deliveryType: 'Normal Delivery',
                  deliveryPlace: 'Health Facility',
                  deliveryComplicationList: [
                    { deliveryComplicationType: 'PPH' },
                  ],
                  postpartumComplicationList: [
                    { postpartumComplicationType: 'Sepsis' },
                  ],
                  pregOutcome: 'Live Birth',
                  newBornComplication: 'Jaundice',
                },
                {
                  pregOrder: 2,
                  pregComplicationList: [],
                  deliveryComplicationList: [],
                  postpartumComplicationList: [],
                  pregOutcome: 'Abortion',
                  typeOfAbortionValue: 'Induced',
                  serviceFacilityValue: 'PHC',
                  postAbortionComplication: [{ complicationValue: 'Bleeding' }],
                },
                {
                  pregOrder: 5,
                  pregComplicationList: [],
                  deliveryComplicationList: [],
                  postpartumComplicationList: [],
                  pregOutcome: 'Abortion',
                  postAbortionComplication: [],
                },
                { pregOrder: null },
              ],
            },
          },
        })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next(masterData());
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.pastObstericHistoryForm.value.totalNoOfPreg).toBe(3);
      expect(compl().length).toBe(3);
      expect(rows().length).toBe(3);
      const r0 = rows().at(0).value;
      expect(r0.pregComplicationList).toEqual([
        { pregComplicationType: 'Anaemia' },
      ]);
      expect(r0.deliveryType).toEqual({ deliveryType: 'Normal Delivery' });
      expect(r0.pregOutcome).toEqual({ pregOutcome: 'Live Birth' });
      expect(r0.newBornComplication).toEqual({ complicationValue: 'Jaundice' });
      const r1 = rows().at(1).value;
      expect(r1.abortionType).toEqual({ complicationValue: 'Induced' });
      expect(r1.typeofFacility).toEqual({ facilityName: 'PHC' });
      expect(r1.postAbortionComplication).toEqual([
        { complicationValue: 'Bleeding' },
      ]);
      expect(compl().at(0).value.value).toBeTrue();
      expect(compl().at(1).value.value).toBeTrue();
      expect(compl().at(2).value.value).toBeNull();
      const c = component.complicationOptionConstraints;
      expect(c[1].disableNonePostComplication).toBeTrue();
      expect(c[2].showAllPostComplication).toBeTrue();
    });

    it('handles zero total and abortion without post-abortion list', () => {
      component.pastObstericHistoryData = {
        totalNoOfPreg: 0,
        femaleObstetricHistoryList: [
          {
            pregOrder: 1,
            pregComplicationList: [],
            deliveryComplicationList: [],
            postpartumComplicationList: [],
            pregOutcome: 'Abortion',
            postAbortionComplication: null,
          },
        ],
      };
      fixture.detectChanges();
      component.masterData = masterData();
      expect(() => component.handlePastObstetricHistoryData()).toThrow();
      expect(rows().length).toBe(1);
      expect(component.pastObstericHistoryForm.value.totalNoOfPreg).toBeNull();
    });

    it('ignores empty or failed history', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.mode = 'view';
      fixture.detectChanges();
      master$.next(masterData());
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('b1', 'v1');
      expect(component.pastObstericHistoryData).toBeUndefined();
      expect(rows().length).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes, clears arrays and resets form with van details', () => {
      fixture.detectChanges();
      component.getGeneralHistory('b1', 'v1');
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 2 });
      component.togglePastObstericHistory({ checked: true }, 1);
      const subs = [
        component.nurseMasterDataSubscription,
        component.totalNoofPregChangeSubs,
        component.generalHistorySubscription,
      ];
      subs.forEach(s => spyOn(s, 'unsubscribe').and.callThrough());
      component.ngOnDestroy();
      subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
      expect(rows().length).toBe(0);
      expect(compl().length).toBe(0);
      expect(component.pastObstericHistoryForm.value.vanID).toBe(7);
      expect(component.pastObstericHistoryForm.value.parkingPlaceID).toBe(8);
      expect(component.pastObstericHistoryForm.value.totalNoOfPreg).toBeNull();
    });

    it('skips reset when no service line details and no subscriptions', () => {
      session.removeItem('serviceLineDetails');
      component.pastObstericHistoryForm.patchValue({ vanID: 99 });
      component.ngOnDestroy();
      expect(component.pastObstericHistoryForm.value.vanID).toBe(99);
    });
  });
});
