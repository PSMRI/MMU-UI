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
import { MatDialogRef } from '@angular/material/dialog';
import { FormArray } from '@angular/forms';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
} from '../../../nurse-doctor/shared/services';
import { PrescribeTmMedicineComponent } from './prescribe-tm-medicine.component';

describe('PrescribeTmMedicineComponent', () => {
  let component: PrescribeTmMedicineComponent;
  let fixture: ComponentFixture<PrescribeTmMedicineComponent>;
  let master: any;
  let doctor: any;
  let confirm: any;
  let dialogRef: any;

  const masterData = {
    drugFormMaster: [{ itemFormID: 1, itemFormName: 'Tablet' }],
    itemMaster: [
      { itemID: 10, itemName: 'Paracetamol', itemFormID: 1, quantityInHand: 5 },
      { itemID: 11, itemName: 'Syrup', itemFormID: 2 },
    ],
    drugDoseMaster: [
      { itemFormID: 1, dose: '1' },
      { itemFormID: 2, dose: '5ml' },
    ],
    drugFrequencyMaster: ['OD'],
    drugDurationUnitMaster: ['Day'],
    routeOfAdmin: ['Oral'],
    NonEdlMaster: [
      { itemID: 20, itemName: 'Pantoprazole', itemFormID: 1 },
      { itemID: 21, itemName: 'Other', itemFormID: 3 },
    ],
  };

  beforeEach(async () => {
    master = autoSpy(MasterdataService);
    doctor = autoSpy(DoctorService);
    master.getDoctorMasterDataForNurse.and.returnValue(
      of({ statusCode: 200, data: masterData })
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PrescribeTmMedicineComponent],
      providers: [
        ...commonTestProviders({
          session: {
            userName: 'nurse1',
            caseSheetVisitCategoryID: '4',
            providerServiceID: '7',
            serviceLineDetails: JSON.stringify({ vanID: 3, parkingPlaceID: 9 }),
          },
          dialogData: { tmPrescribedDrugs: [{ drugID: 99 }] },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PrescribeTmMedicineComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(PrescribeTmMedicineComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    spyOn(console, 'log');
    component.ngOnInit();
    component.prescriptionForm = {
      form: { markAsUntouched: jasmine.createSpy('markAsUntouched') },
    } as any;
  });

  const drugs = () =>
    component.drugPrescriptionForm.controls['prescribedDrugs'] as FormArray;

  it('ngOnInit initialises form, limits, durations and masters', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.tmPrescribedDrugs).toEqual([{ drugID: 99 }]);
    expect(component.createdBy).toBe('nurse1');
    expect(component.drugPrescriptionForm.value).toEqual({
      vanID: 3,
      parkingPlaceID: 9,
      prescribedDrugs: [],
    });
    expect(component.pageLimits).toEqual([0, 5]);
    expect(component.drugDurationMaster.length).toBe(29);
    expect(component.drugDurationMaster[28]).toBe(29);
    expect(master.getDoctorMasterDataForNurse).toHaveBeenCalledWith('4', '7');
    expect(component.drugFormMaster).toBe(masterData.drugFormMaster);
    expect(component.drugRouteMaster).toEqual(['Oral']);
    expect(component.edlMaster).toBe(masterData.NonEdlMaster);
  });

  it('keeps masters empty on non-200', () => {
    component.drugFormMaster = [];
    master.getDoctorMasterDataForNurse.and.returnValue(of({ statusCode: 500 }));
    component.getDoctorMasterData();
    expect(component.drugFormMaster).toEqual([]);
  });

  it('setLimits computes page window', () => {
    component.setLimits(2);
    expect(component.pageLimits).toEqual([10, 15]);
  });

  it('getFormValueChanged filters drugs and doses by form', () => {
    component.tempform = { itemFormID: 1, itemFormName: 'Tablet' };
    component.getFormValueChanged();
    expect(component.currentPrescription.formID).toBe(1);
    expect(component.currentPrescription.formName).toBe('Tablet');
    expect(component.filteredDrugMaster.map((d: any) => d.itemID)).toEqual([
      10, 20,
    ]);
    expect(component.filteredDrugMaster[0].isEDL).toBeTrue();
    expect(component.filteredDrugMaster[1].quantityInHand).toBe(0);
    expect(component.subFilteredDrugMaster).toBe(component.filteredDrugMaster);
    expect(component.filteredDrugDoseMaster).toEqual([
      { itemFormID: 1, dose: '1' },
    ]);
    expect(component.prescriptionForm.form.markAsUntouched).toHaveBeenCalled();
  });

  it('filterMedicine filters by prefix, case-insensitive, and resets on empty', () => {
    component.filteredDrugMaster = [
      { itemName: 'Paracetamol' },
      { itemName: 'Pantoprazole' },
      { itemName: 'Aspirin' },
    ];
    component.filterMedicine('PARA');
    expect(component.subFilteredDrugMaster).toEqual([
      { itemName: 'Paracetamol' },
    ]);
    component.filterMedicine('');
    expect(component.subFilteredDrugMaster).toBe(component.filteredDrugMaster);
  });

  describe('reEnterMedicine', () => {
    it('restores the selected drug object when a drug is selected', () => {
      component.tempDrugName = 'typed';
      Object.assign(component.currentPrescription, {
        id: 1,
        drugName: 'Para',
        drugID: 10,
        quantity: 4,
        sctCode: 's',
        sctTerm: 't',
        drugStrength: '500',
        drugUnit: 'mg',
      });
      component.reEnterMedicine();
      expect(component.tempDrugName).toEqual({
        id: 1,
        itemName: 'Para',
        itemID: 10,
        quantityInHand: 4,
        sctCode: 's',
        sctTerm: 't',
        strength: '500',
        unitOfMeasurement: 'mg',
      });
    });

    it('clears typed text when no drug selected', () => {
      component.tempDrugName = 'typed';
      component.reEnterMedicine();
      expect(component.tempDrugName).toBeNull();
    });

    it('resets details and refilters when nothing typed', () => {
      component.tempform = { itemFormID: 1, itemFormName: 'Tablet' };
      component.tempDrugName = null;
      component.reEnterMedicine();
      expect(component.currentPrescription.formID).toBe(1);
      expect(component.filteredDrugMaster.length).toBe(2);
    });
  });

  it('displayFn formats options', () => {
    expect(
      component.displayFn({
        itemName: 'Para',
        strength: '500',
        unitOfMeasurement: 'mg',
        quantityInHand: 3,
      })
    ).toBe('Para 500mg(3)');
    expect(component.displayFn({ itemName: 'X', strength: '1' })).toBe('X 1');
    expect(component.displayFn(null)).toBe('');
  });

  describe('selectMedicineObject', () => {
    const opt = (over: any = {}) => ({
      id: 1,
      itemName: 'Para',
      itemID: 10,
      quantityInHand: 5,
      sctCode: 's',
      sctTerm: 't',
      strength: '500',
      unitOfMeasurement: 'mg',
      isEDL: true,
      ...over,
    });

    it('ignores non-user input', () => {
      component.selectMedicineObject({
        source: { value: opt() },
        isUserInput: false,
      });
      expect(component.currentPrescription.drugID).toBeNull();
    });

    it('selects an in-stock drug as primary', () => {
      component.selectMedicineObject({
        source: { value: opt() },
        isUserInput: true,
      });
      expect(component.currentPrescription.drugID).toBe(10);
      expect(component.currentPrescription.drugName).toBe('Para');
      expect(component.currentPrescription.isEDL).toBeTrue();
      expect(component.isStockAvalable).toBe('primary');
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('asks to confirm out-of-stock non-EDL drug; accepted -> warn', () => {
      component.selectMedicineObject({
        source: { value: opt({ quantityInHand: 0, isEDL: false }) },
        isUserInput: true,
      });
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info - (Non-EDL) Medicine',
        'Stock not Available, would you still like to prescribe?  Para 500mg'
      );
      expect(component.isStockAvalable).toBe('warn');
      expect(component.currentPrescription.drugID).toBe(10);
    });

    it('out-of-stock declined clears the selection', () => {
      confirm.confirm.and.returnValue(of(false));
      component.tempDrugName = 'x';
      component.selectMedicineObject({
        source: { value: opt({ quantityInHand: 0 }) },
        isUserInput: true,
      });
      expect(confirm.confirm.calls.mostRecent().args[0]).toBe('info ');
      expect(component.tempDrugName).toBeNull();
      expect(component.currentPrescription.drugID).toBe('');
      expect(component.isStockAvalable).toBe('');
    });

    it('alerts when drug already prescribed', () => {
      component.currentPrescription.drugStrength = '500';
      component.currentPrescription.drugID = 10;
      component.addMedicine();
      component.currentPrescription.drugID = null;
      spyOn(component, 'reEnterMedicine');
      component.selectMedicineObject({
        source: { value: opt() },
        isUserInput: true,
      });
      expect(component.reEnterMedicine).toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Medicine is already prescribed, Please delete the previously added one to change.',
        'info'
      );
      expect(component.currentPrescription.drugID).toBeNull();
    });
  });

  it('submitForUpload adds medicine with createdBy and clears', () => {
    Object.assign(component.currentPrescription, {
      drugID: 10,
      drugName: 'Para',
      drugStrength: '500',
      drugUnit: 'mg',
      duration: 3,
      unit: 'Day',
    });
    component.tempform = { itemFormID: 1 };
    component.submitForUpload();
    expect(drugs().length).toBe(1);
    expect(drugs().at(0).value.drugStrength).toBe('500mg');
    expect(drugs().at(0).value.createdBy).toBe('nurse1');
    expect(drugs().at(0).value.durationView).toBe('3 Day');
    expect(component.tempform).toBeNull();
    expect(component.currentPrescription.drugID).toBeNull();
    expect(component.getPrescribedDrugs()?.length).toBe(1);
  });

  it('getPrescribedDrugs returns null when control is not an array', () => {
    component.drugPrescriptionForm.removeControl('prescribedDrugs');
    expect(component.getPrescribedDrugs()).toBeNull();
  });

  describe('deleteMedicine', () => {
    beforeEach(() => {
      component.currentPrescription.drugID = 1;
      component.addMedicine();
      component.currentPrescription.drugID = 2;
      component.addMedicine();
    });

    it('removes in UI when no id', () => {
      component.deleteMedicine(0);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        'Please confirm to delete.'
      );
      expect(drugs().length).toBe(1);
      expect(drugs().at(0).value.drugID).toBe(1);
      expect(doctor.deleteMedicine).not.toHaveBeenCalled();
    });

    it('deletes in backend then UI when id given', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 200 }));
      component.deleteMedicine(1, 55 as any);
      expect(doctor.deleteMedicine).toHaveBeenCalledWith(55);
      expect(drugs().length).toBe(1);
    });

    it('keeps row when backend fails', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 500 }));
      component.deleteMedicine(1, 55 as any);
      expect(drugs().length).toBe(2);
    });

    it('does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.deleteMedicine(0, 55 as any);
      component.deleteMedicine(0);
      expect(drugs().length).toBe(2);
    });
  });

  it('submitPrescription closes dialog with form value', () => {
    component.submitPrescription();
    expect(dialogRef.close).toHaveBeenCalledWith(
      component.drugPrescriptionForm.value
    );
  });

  it('submitPrescription alerts when there is no value', () => {
    component.drugPrescriptionForm = { value: null } as any;
    component.submitPrescription();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(confirm.alert).toHaveBeenCalledWith(
      'Please prescribe the medicines'
    );
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
