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
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { PncComponent } from './pnc.component';

describe('PncComponent', () => {
  let component: PncComponent;
  let fixture: ComponentFixture<PncComponent>;
  let doctor: any;
  let confirm: any;
  let ben$: BehaviorSubject<any>;
  let master$: BehaviorSubject<any>;

  const fields = [
    'deliveryPlace',
    'otherDeliveryPlace',
    'deliveryType',
    'deliveryComplication',
    'otherDeliveryComplication',
    'pregOutcome',
    'postNatalComplication',
    'otherPostNatalComplication',
    'gestationName',
    'birthWeightOfNewborn',
    'newBornHealthStatus',
    'dateOfDelivery',
    'dDate',
  ];
  const makeForm = () => {
    const g: any = {};
    fields.forEach(f => (g[f] = new FormControl(null)));
    return new FormGroup(g);
  };

  const masterData = () => ({
    deliveryTypes: [
      { deliveryType: 'Normal Delivery' },
      { deliveryType: 'Assisted Delivery' },
      { deliveryType: 'Cesarean Section (LSCS)' },
    ],
    deliveryPlaces: [
      { deliveryPlace: 'Home-Supervised' },
      { deliveryPlace: 'Hospital' },
    ],
    deliveryComplicationTypes: [{ deliveryComplicationType: 'None' }],
    pregOutcomes: [{ pregOutcome: 'Live Birth' }],
    postNatalComplications: [{ complicationValue: 'Fever' }],
    gestation: [{ name: 'Term' }],
    newbornHealthStatuses: [{ newBornHealthStatus: 'Healthy' }],
  });

  async function setup(mode?: string, master: any = null) {
    doctor = autoSpy(DoctorService);
    ben$ = new BehaviorSubject<any>(null);
    master$ = new BehaviorSubject<any>(master);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PncComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitID: 'v1',
            beneficiaryRegID: 'b1',
            providerServiceID: 'p1',
            userName: 'u',
            visitCode: 'c1',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: master$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PncComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    component.patientPNCDataForm = makeForm();
    component.mode = mode as any;
    spyOn(console, 'log');
  }

  afterEach(() => component?.ngOnDestroy());

  it('ngOnInit sets language, dates and waits for master data', async () => {
    await setup();
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    const diff =
      component.today.getTime() - component.minimumDeliveryDate.getTime();
    expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
    expect(component.masterData).toBeUndefined();
    master$.next({ foo: 1 });
    expect(component.masterData).toBeUndefined();
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('stores master data without patching when no mode', async () => {
    await setup(undefined, masterData());
    component.ngOnInit();
    expect(component.selectDeliveryTypes.length).toBe(3);
    expect(doctor.getPNCDetails).not.toHaveBeenCalled();
  });

  it('beneficiary details compute dob when not in a mode', async () => {
    await setup();
    component.ngOnInit();
    ben$.next({ ageVal: 30 });
    expect(component.beneficiaryAge).toBe(30);
    expect(component.dob.getFullYear()).toBe(new Date().getFullYear() - 30);
  });

  it('beneficiary details skip dob in view mode', async () => {
    await setup('view');
    component.ngOnInit();
    const dob = component.dob;
    ben$.next({ ageVal: 30 });
    expect(component.beneficiaryAge).toBe(30);
    expect(component.dob).toBe(dob);
  });

  it('patches PNC details with master data lookups in view mode', async () => {
    await setup('view');
    doctor.getPNCDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          PNCCareDetail: {
            deliveryType: 'Normal Delivery',
            deliveryPlace: 'Hospital',
            deliveryComplication: 'None',
            pregOutcome: 'Live Birth',
            postNatalComplication: 'Fever',
            gestationName: 'Term',
            newBornHealthStatus: 'Healthy',
            dateOfDelivery: '2024-02-10T00:00:00',
            birthWeightOfNewborn: 3,
          },
        },
      })
    );
    component.ngOnInit();
    master$.next(masterData());
    expect(doctor.getPNCDetails).toHaveBeenCalledWith('b1', 'v1');
    const v = component.patientPNCDataForm.value;
    expect(v.deliveryType).toEqual({ deliveryType: 'Normal Delivery' });
    expect(v.deliveryPlace).toEqual({ deliveryPlace: 'Hospital' });
    expect(v.deliveryComplication).toEqual({
      deliveryComplicationType: 'None',
    });
    expect(v.pregOutcome).toEqual({ pregOutcome: 'Live Birth' });
    expect(v.postNatalComplication).toEqual({ complicationValue: 'Fever' });
    expect(v.gestationName).toEqual({ name: 'Term' });
    expect(v.newBornHealthStatus).toEqual({ newBornHealthStatus: 'Healthy' });
    expect(v.dDate).toBe('2024-02-10T00:00:00.000Z');
    expect(v.birthWeightOfNewborn).toBe(3);
  });

  it('patchDataToFields keeps raw values when master lists are missing', async () => {
    await setup('view');
    component.masterData = { deliveryTypes: [] };
    doctor.getPNCDetails.and.returnValue(
      of({
        data: {
          PNCCareDetail: { deliveryPlace: 'Hospital', dateOfDelivery: null },
        },
      })
    );
    component.patchDataToFields('b', 'v');
    const v = component.patientPNCDataForm.value;
    expect(v.deliveryPlace).toBe('Hospital');
    expect(v.deliveryType).toBeUndefined();
    expect(v.dDate).toMatch(/^19(69|70)-/);
  });

  describe('ngOnChanges / updatePatientPNC', () => {
    it('does nothing for view or undefined mode', async () => {
      await setup('view');
      component.ngOnChanges();
      component.mode = undefined as any;
      component.ngOnChanges();
      expect(doctor.updatePNCDetails).not.toHaveBeenCalled();
    });

    it('updates with normalised delivery date and alerts success', async () => {
      await setup('update');
      component.patientPNCDataForm.patchValue({
        dDate: new Date(2024, 5, 3, 15),
      });
      component.patientPNCDataForm.markAsDirty();
      doctor.updatePNCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } })
      );
      component.ngOnChanges();
      expect(doctor.updatePNCDetails).toHaveBeenCalledWith(
        component.patientPNCDataForm,
        {
          beneficiaryRegID: 'b1',
          benVisitID: 'v1',
          providerServiceMapID: 'p1',
          modifiedBy: 'u',
          visitCode: 'c1',
        }
      );
      expect(component.patientPNCDataForm.value.dateOfDelivery).toBe(
        '2024-06-03T00:00:00.000Z'
      );
      expect(confirm.alert).toHaveBeenCalledWith('saved', 'success');
      expect(component.patientPNCDataForm.pristine).toBeTrue();
    });

    it('alerts error on failure response and on error', async () => {
      await setup('update');
      doctor.updatePNCDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.updatePatientPNC(component.patientPNCDataForm);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(component.patientPNCDataForm.value.dateOfDelivery).toBeNull();
      doctor.updatePNCDetails.and.returnValue(throwingObs('boom'));
      component.updatePatientPNC(component.patientPNCDataForm);
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  it('checkWeight alerts only for weight >= 6', async () => {
    await setup();
    component.ngOnInit();
    component.patientPNCDataForm.patchValue({ birthWeightOfNewborn: 5.9 });
    component.checkWeight();
    expect(confirm.alert).not.toHaveBeenCalled();
    component.patientPNCDataForm.patchValue({ birthWeightOfNewborn: 6 });
    component.checkWeight();
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.recheckValue
    );
  });

  it('resetOtherPlaceOfDelivery filters delivery types for home deliveries', async () => {
    await setup(undefined, masterData());
    component.ngOnInit();
    component.patientPNCDataForm.patchValue({
      deliveryPlace: { deliveryPlace: 'Home-Supervised' },
      otherDeliveryPlace: 'x',
      deliveryType: 'y',
    });
    component.resetOtherPlaceOfDelivery();
    expect(component.selectDeliveryTypes).toEqual([
      { deliveryType: 'Normal Delivery' },
    ]);
    expect(component.patientPNCDataForm.value.otherDeliveryPlace).toBeNull();
    expect(component.patientPNCDataForm.value.deliveryType).toBeNull();

    component.patientPNCDataForm.patchValue({
      deliveryPlace: { deliveryPlace: 'Home-Unsupervised' },
    });
    component.resetOtherPlaceOfDelivery();
    expect(component.selectDeliveryTypes.length).toBe(1);

    component.patientPNCDataForm.patchValue({
      deliveryPlace: { deliveryPlace: 'Hospital' },
    });
    component.resetOtherPlaceOfDelivery();
    expect(component.selectDeliveryTypes.length).toBe(3);
  });

  it('reset helpers and getters', async () => {
    await setup();
    component.patientPNCDataForm.patchValue({
      deliveryComplication: 'dc',
      otherDeliveryComplication: 'odc',
      postNatalComplication: 'pc',
      otherPostNatalComplication: 'opc',
    });
    expect(component.deliveryComplication).toBe('dc');
    expect(component.otherDeliveryComplication).toBe('odc');
    expect(component.postNatalComplication).toBe('pc');
    expect(component.otherPostNatalComplication).toBe('opc');
    component.resetOtherDeliveryComplication();
    component.resetOtherPostNatalComplication();
    expect(component.otherDeliveryComplication).toBeNull();
    expect(component.otherPostNatalComplication).toBeNull();
  });

  it('ngOnDestroy unsubscribes', async () => {
    await setup();
    component.ngOnInit();
    const a = spyOn(component.beneficiaryDetailsSubscription, 'unsubscribe');
    const b = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});
