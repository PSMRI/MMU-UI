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
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { DoctorService, MasterdataService } from '../../../shared/services';
import { PrescriptionComponent } from './prescription.component';

describe('PrescriptionComponent', () => {
  let component: PrescriptionComponent;
  let fixture: ComponentFixture<PrescriptionComponent>;
  let doctor: any;
  let master$: BehaviorSubject<any>;
  let confirm: any;
  let tracking: any;

  const masterData = () => ({
    drugFormMaster: [
      { itemFormID: 1, itemFormName: 'Tablet' },
      { itemFormID: 2, itemFormName: 'Syrup' },
    ],
    itemMaster: [
      {
        id: 10,
        itemID: 100,
        itemName: 'Paracetamol',
        itemFormID: 1,
        strength: '500',
        unitOfMeasurement: 'mg',
        quantityInHand: 20,
        sctCode: 'S1',
        sctTerm: 'T1',
      },
      {
        id: 11,
        itemID: 101,
        itemName: 'Cough Syrup',
        itemFormID: 2,
        strength: '5',
        unitOfMeasurement: 'ml',
        quantityInHand: 3,
      },
    ],
    NonEdlMaster: [
      { itemID: 200, itemName: 'Pantoprazole', itemFormID: 1, strength: '40' },
    ],
    drugDoseMaster: [
      { itemFormID: 1, drugDose: '1 tab' },
      { itemFormID: 2, drugDose: '5 ml' },
    ],
    drugFrequencyMaster: [{ frequency: 'OD' }],
    drugDurationUnitMaster: [{ drugDuration: 'Days' }],
    routeOfAdmin: [{ routeName: 'Oral' }],
  });

  const drugForm = (drugs: any[] = []) =>
    new FormBuilder().group({
      prescribedDrugs: new FormBuilder().array(
        drugs.map(d => new FormBuilder().group(d))
      ),
    });

  const drugsArray = () =>
    component.drugPrescriptionForm.get('prescribedDrugs') as FormArray;

  const create = (
    mode = 'new',
    form: FormGroup = drugForm(),
    data: any = null
  ) => {
    master$.next(data);
    fixture = TestBed.createComponent(PrescriptionComponent);
    component = fixture.componentInstance;
    component.caseRecordMode = mode;
    component.drugPrescriptionForm = form;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule],
      declarations: [PrescriptionComponent],
      providers: [
        ...commonTestProviders({
          session: {
            userName: 'drUser',
            beneficiaryRegID: 5,
            visitID: 6,
            visitCategory: 'General OPD',
            serviceLineDetails: JSON.stringify({
              vanID: 7,
              parkingPlaceID: 8,
            }),
          },
        }),
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { doctorMasterData$: master$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      // The full template needs the whole Material form-field/autocomplete stack;
      // keep the #prescriptionForm ViewChild and the prescribed-drug list markup.
      .overrideTemplate(
        PrescriptionComponent,
        `<form #prescriptionForm="ngForm"></form>
        <div *ngFor="let drug of getPrescribedDrugs(); let j = index">
          <ng-container *ngIf="j >= pageLimits[0] && j < pageLimits[1]">
            <legend>
              {{ drug.value.drugName }} {{ drug.value.drugStrength }}
              {{ drug.value.isEDL ? '' : current_language_set?.nonEDLMedicine }}
            </legend>
          </ng-container>
        </div>`
      )
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService);
    tracking = TestBed.inject(AmritTrackingService);
  });

  afterEach(() => fixture?.destroy());

  describe('initialisation', () => {
    it('sets user, page limits, duration master and language', () => {
      create();
      expect(component.createdBy).toBe('drUser');
      expect(component.pageLimits).toEqual([0, 5]);
      expect(component.drugDurationMaster.length).toBe(29);
      expect(component.drugDurationMaster[0]).toBe(1);
      expect(component.drugDurationMaster[28]).toBe(29);
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('does nothing with masters while master data is null', () => {
      create();
      expect(component.drugMaster).toBeUndefined();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('assigns masters without fetching in new mode', () => {
      create('new', drugForm(), masterData());
      expect(component.drugFormMaster.length).toBe(2);
      expect(component.drugMaster.length).toBe(2);
      expect(component.drugRouteMaster).toEqual([{ routeName: 'Oral' }]);
      expect(component.edlMaster.length).toBe(1);
      expect(component.drugFrequencyMaster).toEqual([{ frequency: 'OD' }]);
      expect(component.drugDurationUnitMaster).toEqual([
        { drugDuration: 'Days' },
      ]);
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('fetches and patches prescription in view mode', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            prescription: [
              {
                id: 1,
                drugID: 100,
                drugName: 'Paracetamol',
                drugStrength: '500',
                drugUnit: 'mg',
                duration: 3,
                unit: 'Days',
              },
              { id: 2, drugID: 101, drugName: 'Syrup', drugStrength: '5' },
            ],
          },
        })
      );
      create('view', drugForm(), masterData());
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        5,
        6,
        'General OPD'
      );
      const arr = drugsArray();
      expect(arr.length).toBe(2);
      // inserted at 0 each time, so order is reversed
      expect(arr.at(0).value.id).toBe(2);
      expect(arr.at(0).value.drugStrength).toBe('5');
      expect(arr.at(1).value.drugStrength).toBe('500mg');
      expect(arr.at(1).value.durationView).toBe('3 Days');
      expect(arr.at(1).value.vanID).toBe(7);
      expect(arr.at(1).value.parkingPlaceID).toBe(8);
    });

    it('ignores view-mode responses without prescription', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      create('view', drugForm(), masterData());
      expect(drugsArray().length).toBe(0);
    });

    it('unsubscribes master data on destroy', () => {
      create();
      const sub = component.doctorMasterDataSubscription;
      spyOn(sub, 'unsubscribe').and.callThrough();
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
    });

    it('ngOnDestroy tolerates missing subscription', () => {
      create();
      component.doctorMasterDataSubscription.unsubscribe();
      component.doctorMasterDataSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('helpers', () => {
    beforeEach(() => create('new', drugForm(), masterData()));

    it('getPrescribedDrugs returns controls or null', () => {
      expect(component.getPrescribedDrugs()).toEqual([]);
      component.drugPrescriptionForm = new FormGroup({});
      expect(component.getPrescribedDrugs()).toBeNull();
    });

    it('displayFn formats options', () => {
      expect(component.displayFn(null)).toBe('');
      expect(
        component.displayFn({
          itemName: 'Para',
          strength: '500',
          unitOfMeasurement: 'mg',
          quantityInHand: 4,
        })
      ).toBe('Para 500mg(4)');
      expect(component.displayFn({ itemName: 'X', strength: '1' })).toBe('X 1');
    });

    it('trackFieldInteraction delegates to tracking service', () => {
      component.trackFieldInteraction('Form');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Form',
        'Prescription'
      );
    });

    it('setLimits computes the page window', () => {
      component.setLimits(2);
      expect(component.pageLimits).toEqual([10, 15]);
      component.setLimits();
      expect(component.pageLimits).toEqual([0, 5]);
    });
  });

  describe('form / drug filtering', () => {
    beforeEach(() => create('new', drugForm(), masterData()));

    it('getFormValueChanged resets details and filters by form', () => {
      component.tempDrugName = 'old';
      component.currentPrescription.dose = '2';
      component.isStockAvalable = 'primary';
      component.currentPrescription.formName = 'Tablet';
      component.getFormValueChanged();
      expect(component.tempDrugName).toBeNull();
      expect(component.currentPrescription.dose).toBeNull();
      expect(component.isStockAvalable).toBe('');
      expect(component.currentPrescription.formID).toBe(1);
      expect(component.filteredDrugMaster.map((d: any) => d.itemName)).toEqual([
        'Paracetamol',
        'Pantoprazole',
      ]);
      expect(component.filteredDrugMaster[0].isEDL).toBeTrue();
      expect(component.filteredDrugMaster[1].quantityInHand).toBe(0);
      expect(component.subFilteredDrugMaster).toBe(
        component.filteredDrugMaster
      );
      expect(component.filteredDrugDoseMaster).toEqual([
        { itemFormID: 1, drugDose: '1 tab' },
      ]);
    });

    it('filterMedicine narrows by prefix, case-insensitive', () => {
      component.currentPrescription.formName = 'Tablet';
      component.getFormDetails();
      component.filterMedicine('PAN');
      expect(
        component.subFilteredDrugMaster.map((d: any) => d.itemName)
      ).toEqual(['Pantoprazole']);
      component.filterMedicine('');
      expect(component.subFilteredDrugMaster.length).toBe(2);
    });
  });

  describe('reEnterMedicine', () => {
    beforeEach(() => create('new', drugForm(), masterData()));

    it('restores selected drug object when a drug is chosen', () => {
      component.tempDrugName = 'typed';
      Object.assign(component.currentPrescription, {
        id: 1,
        drugID: 100,
        drugName: 'Paracetamol',
        quantity: 20,
        sctCode: 'S',
        sctTerm: 'T',
        drugStrength: '500',
        drugUnit: 'mg',
      });
      component.reEnterMedicine();
      expect(component.tempDrugName).toEqual({
        id: 1,
        itemName: 'Paracetamol',
        itemID: 100,
        quantityInHand: 20,
        sctCode: 'S',
        sctTerm: 'T',
        strength: '500',
        unitOfMeasurement: 'mg',
      });
    });

    it('clears typed text when no drug is chosen', () => {
      component.tempDrugName = 'typed';
      component.currentPrescription.drugID = null;
      component.reEnterMedicine();
      expect(component.tempDrugName).toBe('');
    });

    it('resets and re-filters when nothing typed', () => {
      component.tempDrugName = '';
      component.currentPrescription.formName = 'Syrup';
      component.reEnterMedicine();
      expect(component.tempDrugName).toBeNull();
      expect(component.currentPrescription.formID).toBe(2);
      expect(component.filteredDrugMaster.length).toBe(1);
    });
  });

  describe('selectMedicineObject', () => {
    const option = (over: any = {}) => ({
      option: {
        value: {
          id: 10,
          itemID: 100,
          itemName: 'Paracetamol',
          quantityInHand: 20,
          sctCode: 'S1',
          sctTerm: 'T1',
          strength: '500',
          unitOfMeasurement: 'mg',
          isEDL: true,
          ...over,
        },
      },
    });

    beforeEach(() => create('new', drugForm(), masterData()));

    it('ignores empty selection', () => {
      component.selectMedicineObject({ option: { value: null } });
      expect(component.currentPrescription.drugID).toBeNull();
    });

    it('fills details and marks stock available', () => {
      component.selectMedicineObject(option());
      expect(component.currentPrescription.drugID).toBe(100);
      expect(component.currentPrescription.drugName).toBe('Paracetamol');
      expect(component.currentPrescription.drugUnit).toBe('mg');
      expect(component.currentPrescription.isEDL).toBeTrue();
      expect(component.isStockAvalable).toBe('primary');
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('asks confirmation for zero stock and keeps drug on yes', () => {
      component.selectMedicineObject(
        option({ quantityInHand: 0, isEDL: false })
      );
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info ' + LANGUAGE_EN.nonEDLMedicine,
        LANGUAGE_EN.stockNotAvailableWouldYouPrescribe + ' Paracetamol 500mg'
      );
      expect(component.isStockAvalable).toBe('warn');
      expect(component.currentPrescription.drugID).toBe(100);
    });

    it('clears drug for zero stock EDL item when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.tempDrugName = 'Para';
      component.selectMedicineObject(option({ quantityInHand: 0 }));
      expect(confirm.confirm.calls.mostRecent().args[0]).toBe('info ');
      expect(component.tempDrugName).toBe('');
      expect(component.currentPrescription.drugID).toBe('');
      expect(component.currentPrescription.drugName).toBe('');
      expect(component.isStockAvalable).toBe('');
    });

    it('alerts when drug is already prescribed', () => {
      component.drugPrescriptionForm = drugForm([{ drugID: 100 }]);
      component.tempDrugName = null;
      component.currentPrescription.formName = 'Tablet';
      component.selectMedicineObject(option());
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.medicinePrescribe,
        'info'
      );
      expect(component.currentPrescription.drugID).toBeNull();
    });
  });

  describe('add / clear', () => {
    beforeEach(() => create('new', drugForm(), masterData()));

    it('submitForUpload inserts medicine and resets all fields', () => {
      Object.assign(component.currentPrescription, {
        drugID: 100,
        drugName: 'Paracetamol',
        drugStrength: '500',
        drugUnit: 'mg',
        formName: 'Tablet',
        formID: 1,
        dose: '1 tab',
        duration: 2,
        unit: 'Days',
      });
      component.tempform = 'x';
      component.submitForUpload();
      const arr = drugsArray();
      expect(arr.length).toBe(1);
      expect(arr.at(0).value.drugName).toBe('Paracetamol');
      expect(arr.at(0).value.drugStrength).toBe('500mg');
      expect(arr.at(0).value.createdBy).toBe('drUser');
      expect(arr.at(0).value.id).toBeNull();
      expect(component.tempform).toBeNull();
      expect(component.currentPrescription.formName).toBeNull();
      expect(component.currentPrescription.drugID).toBeNull();
      expect(component.currentPrescription.formID).toBeNull();
      expect(component.currentPrescription.dose).toBeNull();
      expect(component.isStockAvalable).toBe('');
    });

    it('renders added medicine in the list', () => {
      component.drugPrescriptionForm = drugForm([
        {
          id: 1,
          drugName: 'Paracetamol',
          drugStrength: '500mg',
          isEDL: false,
          createdBy: 'x',
          formName: 'Tablet',
          dose: '',
          frequency: '',
          durationView: '',
          qtyPrescribed: '',
          route: '',
          instructions: '',
        },
      ]);
      fixture.detectChanges();
      const legend: HTMLElement = fixture.nativeElement.querySelector('legend');
      expect(legend.textContent).toContain('Paracetamol');
      expect(legend.textContent).toContain(LANGUAGE_EN.nonEDLMedicine);
    });
  });

  describe('delete', () => {
    beforeEach(() =>
      create(
        'new',
        drugForm([
          { id: null, drugID: 1 },
          { id: 9, drugID: 2 },
        ]),
        masterData()
      )
    );

    it('removes UI-only medicine after confirm', () => {
      component.deleteMedicine(0);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.confirmDelete
      );
      expect(drugsArray().length).toBe(1);
      expect(drugsArray().at(0).value.id).toBe(9);
      expect(doctor.deleteMedicine).not.toHaveBeenCalled();
    });

    it('deletes saved medicine through backend', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 200 }));
      component.deleteMedicine(1, 9 as any);
      expect(doctor.deleteMedicine).toHaveBeenCalledWith(9);
      expect(drugsArray().length).toBe(1);
      expect(drugsArray().at(0).value.drugID).toBe(1);
    });

    it('keeps medicine when backend delete fails', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 500 }));
      component.deleteMedicineBackend(1, 9);
      expect(drugsArray().length).toBe(2);
    });

    it('does nothing when delete not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.deleteMedicine(0);
      expect(drugsArray().length).toBe(2);
    });
  });

  describe('editMedicine', () => {
    const row = (over: any = {}) => ({
      id: null,
      drugID: 100,
      drugName: 'Paracetamol',
      formName: 'Tablet',
      quantity: 20,
      sctCode: 'S1',
      sctTerm: 'T1',
      drugStrength: '500',
      drugUnit: 'mg',
      dose: '1 tab',
      frequency: 'OD',
      duration: 3,
      unit: 'Days',
      qtyPrescribed: 6,
      route: 'Oral',
      instructions: 'after food',
      ...over,
    });

    it('loads row into current prescription and removes it from UI', () => {
      const data = masterData();
      Object.assign(data.itemMaster[0], { isEDL: true });
      create('new', drugForm([row()]), data);
      component.editMedicine(0, null);
      const cp = component.currentPrescription;
      expect(cp.formID).toBe(1);
      expect(cp.drugID).toBe(100);
      expect(cp.dose).toBe('1 tab');
      expect(cp.frequency).toBe('OD');
      expect(cp.duration).toBe(3);
      expect(cp.unit).toBe('Days');
      expect(cp.qtyPrescribed).toBe(6);
      expect(cp.route).toBe('Oral');
      expect(cp.instructions).toBe('after food');
      expect(cp.isEDL).toBeTrue();
      expect(component.tempDrugName.itemName).toBe('Paracetamol');
      expect(component.isStockAvalable).toBe('primary');
      expect(drugsArray().length).toBe(0);
    });

    it('deletes saved row through backend while editing', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 200 }));
      create('new', drugForm([row({ id: 4 })]), masterData());
      component.editMedicine(0, 4);
      expect(doctor.deleteMedicine).toHaveBeenCalledWith(4);
      expect(drugsArray().length).toBe(0);
    });
  });

  describe('setMedicineObject', () => {
    beforeEach(() => create('new', drugForm(), masterData()));

    it('copies a complete option and flags available stock', () => {
      component.setMedicineObject({
        id: 1,
        itemName: 'A',
        itemID: 2,
        quantityInHand: 3,
        sctCode: 'S',
        sctTerm: 'T',
        strength: '5',
        unitOfMeasurement: 'mg',
        isEDL: true,
      });
      expect(component.currentPrescription.drugName).toBe('A');
      expect(component.currentPrescription.drugID).toBe(2);
      expect(component.isStockAvalable).toBe('primary');
    });

    it('does not copy incomplete option and flags missing stock', () => {
      component.setMedicineObject({
        itemName: 'B',
        quantityInHand: 0,
        isEDL: false,
      });
      expect(component.currentPrescription.drugName).toBeNull();
      expect(component.isStockAvalable).toBe('warn');
    });
  });
});
