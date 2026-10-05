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
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { PerinatalHistoryComponent } from './perinatal-history.component';

const CONTROLS = [
  'placeOfDelivery',
  'otherPlaceOfDelivery',
  'typeOfDelivery',
  'complicationAtBirth',
  'otherComplicationAtBirth',
  'gestation',
  'birthWeight_kg',
];

describe('PerinatalHistoryComponent', () => {
  let component: PerinatalHistoryComponent;
  let fixture: ComponentFixture<PerinatalHistoryComponent>;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let master$: BehaviorSubject<any>;
  let form: FormGroup;

  const master = {
    deliveryTypes: [
      { deliveryTypeID: 1, deliveryType: 'Normal Delivery' },
      { deliveryTypeID: 2, deliveryType: 'Assisted Delivery' },
      { deliveryTypeID: 3, deliveryType: 'Cesarean Section (LSCS)' },
    ],
    deliveryPlaces: [
      { deliveryPlaceID: 10, deliveryPlace: 'Home-Supervised' },
      { deliveryPlaceID: 11, deliveryPlace: 'Hospital' },
    ],
    deliveryComplicationTypes: [{ complicationID: 5, complicationValue: 'X' }],
  };

  async function setup(mode = 'new') {
    nurse = autoSpy(NurseService);
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PerinatalHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: '11', visitID: '22' },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PerinatalHistoryComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    spyOn(console, 'log');
    fixture = TestBed.createComponent(PerinatalHistoryComponent);
    component = fixture.componentInstance;
    const g: any = {};
    CONTROLS.forEach(c => (g[c] = new FormControl(null)));
    form = new FormGroup(g);
    component.perinatalHistoryForm = form;
    component.mode = mode;
    component.visitCategory = 'PNC';
    fixture.detectChanges();
  }

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('sets language; master data sets delivery types', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.masterData).toBeUndefined();
      master$.next(master);
      expect(component.selectDeliveryTypes).toBe(master.deliveryTypes);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngOnDestroy unsubscribes', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(of(null));
      component.getGeneralHistory('1', '2');
      const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const b = spyOn(component.generalHistorySubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(a).toHaveBeenCalled();
      expect(b).toHaveBeenCalled();
      component.nurseMasterDataSubscription = null;
      component.generalHistorySubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('checkWeight warns for >= 6 kg only', () => {
      form.patchValue({ birthWeight_kg: 3 });
      component.checkWeight(3);
      expect(confirm.alert).not.toHaveBeenCalled();
      form.patchValue({ birthWeight_kg: 6 });
      component.checkWeight(6);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue
      );
    });

    describe('resetOtherPlaceOfDelivery', () => {
      beforeEach(() => master$.next(master));

      it('home delivery restricts types and enables delivery type', () => {
        form.get('typeOfDelivery')?.disable();
        form.patchValue({
          placeOfDelivery: master.deliveryPlaces[0],
          otherPlaceOfDelivery: 'x',
        });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes).toEqual([
          master.deliveryTypes[0],
        ]);
        expect(form.value.otherPlaceOfDelivery).toBeNull();
        expect(form.get('typeOfDelivery')?.enabled).toBeTrue();
      });

      it('Home-Unsupervised also restricts', () => {
        form.patchValue({
          placeOfDelivery: { deliveryPlace: 'Home-Unsupervised' },
        });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes.length).toBe(1);
      });

      it('hospital keeps all types', () => {
        form.patchValue({ placeOfDelivery: master.deliveryPlaces[1] });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes).toBe(master.deliveryTypes);
        expect(component.placeOfDelivery).toBe(master.deliveryPlaces[1]);
      });

      it('empty place disables delivery type', () => {
        form.patchValue({ placeOfDelivery: {} });
        component.resetOtherPlaceOfDelivery();
        expect(form.get('typeOfDelivery')?.disabled).toBeTrue();
      });
    });

    it('resetOtherComplicationAtBirth clears other value', () => {
      form.patchValue({
        complicationAtBirth: 'c',
        otherComplicationAtBirth: 'o',
      });
      component.resetOtherComplicationAtBirth();
      expect(form.value.otherComplicationAtBirth).toBeNull();
      expect(component.complicationAtBirth).toBe('c');
    });

    describe('getPreviousPerinatalHistory', () => {
      const err = () => LANGUAGE_EN.alerts.info.errorFetchingHistory;
      it('opens dialog with data', () => {
        const payload = { data: [1] };
        nurse.getPreviousPerinatalHistory.and.returnValue(
          of({ data: payload })
        );
        component.getPreviousPerinatalHistory();
        expect(nurse.getPreviousPerinatalHistory).toHaveBeenCalledWith(
          '11',
          'PNC'
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: payload,
            title:
              LANGUAGE_EN.historyData.Perinatalhistorydetails
                .developmentalhistorydetails,
          },
        });
      });
      it('alerts when empty', () => {
        nurse.getPreviousPerinatalHistory.and.returnValue(
          of({ data: { data: [] } })
        );
        component.getPreviousPerinatalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
            .pastHistoryalert
        );
      });
      it('alerts when data null', () => {
        nurse.getPreviousPerinatalHistory.and.returnValue(of({ data: null }));
        component.getPreviousPerinatalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
      it('alerts on failure', () => {
        nurse.getPreviousPerinatalHistory.and.returnValue(throwingObs());
        component.getPreviousPerinatalHistory();
        expect(confirm.alert).toHaveBeenCalledWith(err(), 'error');
      });
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('maps IDs to master objects and enables delivery type', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            PerinatalHistory: {
              deliveryPlaceID: 11,
              deliveryTypeID: 1,
              complicationID: 5,
              gestation: 'Term',
            },
          },
        })
      );
      form.get('typeOfDelivery')?.disable();
      master$.next(master);
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(form.value.placeOfDelivery).toBe(master.deliveryPlaces[1]);
      expect(form.value.typeOfDelivery).toBe(master.deliveryTypes[0]);
      expect(form.value.complicationAtBirth).toBe(
        master.deliveryComplicationTypes[0]
      );
      expect(form.value.gestation).toBe('Term');
      expect(form.get('typeOfDelivery')?.enabled).toBeTrue();
    });

    it('disables delivery type when none recorded', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { PerinatalHistory: { gestation: 'P' } } })
      );
      master$.next(master);
      expect(form.value.gestation).toBe('P');
      expect(form.get('typeOfDelivery')?.disabled).toBeTrue();
    });

    it('ignores null PerinatalHistory', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { PerinatalHistory: null } })
      );
      master$.next(master);
      expect(component.perinatalHistoryData).toBeUndefined();
    });
  });
});
