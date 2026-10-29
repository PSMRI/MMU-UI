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
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsService } from '../../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { PncDiagnosisComponent } from './pnc-diagnosis.component';

describe('PncDiagnosisComponent', () => {
  let component: PncDiagnosisComponent;
  let fixture: ComponentFixture<PncDiagnosisComponent>;
  let doctor: any;
  let master: any;
  let confirm: any;
  let beneficiary$: BehaviorSubject<any>;

  const provisional = () =>
    component.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
  const confirmatory = () =>
    component.generalDiagnosisForm.controls[
      'confirmatoryDiagnosisList'
    ] as FormArray;

  beforeEach(async () => {
    beneficiary$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService);
    master = autoSpy(MasterdataService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PncDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'PNC',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: MasterdataService, useValue: master },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PncDiagnosisComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(PncDiagnosisComponent);
    component = fixture.componentInstance;
    component.generalDiagnosisForm = new FormGroup({
      provisionalDiagnosisList: new FormArray([
        component.utils.initProvisionalDiagnosisList(),
      ]),
      confirmatoryDiagnosisList: new FormArray([
        component.utils.initConfirmatoryDiagnosisList(),
      ]),
      isMaternalDeath: new FormControl(null),
      placeOfDeath: new FormControl('Home'),
      dateOfDeath: new FormControl(null),
      causeOfDeath: new FormControl('x'),
    });
    confirm = TestBed.inject(ConfirmationService);
    component.ngOnInit();
    component.assignSelectedLanguage();
  });

  afterEach(() => component.ngOnDestroy());

  it('ngOnInit sets dates and a one-year minimum death date', () => {
    expect(component.today).toEqual(jasmine.any(Date));
    const diffDays =
      (component.today.getTime() - component.minimumDeathDate.getTime()) /
      (24 * 60 * 60 * 1000);
    expect(diffDays).toBe(365);
    expect(component.beneficiaryAge).toBeUndefined();
  });

  it('beneficiary details set age and dob year', () => {
    beneficiary$.next({ ageVal: 25 });
    expect(component.beneficiaryAge).toBe(25);
    expect(component.dob.getFullYear()).toBe(
      component.today.getFullYear() - 25
    );
  });

  it('ngDoCheck refreshes language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('control getters return form array controls or empty', () => {
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    expect(component.confirmatoryDiagnosisControls.length).toBe(1);
    expect(component.getConfirmatoryDiagnosisList()?.length).toBe(1);
    component.generalDiagnosisForm = new FormGroup({});
    expect(component.provisionalDiagnosisControls).toEqual([]);
    expect(component.confirmatoryDiagnosisControls).toEqual([]);
    expect(component.getConfirmatoryDiagnosisList()).toBeNull();
  });

  describe('ngOnChanges (view mode)', () => {
    it('fetches and patches diagnosis incl. lists and death date', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diagnosis: {
              isMaternalDeath: true,
              dateOfDeath: '2024-02-01T00:00:00.000Z',
              provisionalDiagnosisList: [
                { term: 'Fever', conceptID: 'C1' },
                { term: 'Cough', conceptID: 'C2' },
              ],
              confirmatoryDiagnosisList: [
                { term: 'Malaria', conceptID: 'C3' },
                { term: 'Typhoid', conceptID: 'C4' },
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
        'PNC'
      );
      expect(component.isMaternalDeath).toBeTrue();
      expect(
        component.generalDiagnosisForm.controls['dateOfDeath'].value
      ).toEqual(new Date('2024-02-01T00:00:00.000Z'));
      expect(provisional().length).toBe(2);
      expect(provisional().at(0).value.term).toBe('Fever');
      expect(provisional().at(1).value.provisionalDiagnosis).toBe('Cough');
      expect(
        (provisional().at(0) as FormGroup).controls[
          'viewProvisionalDiagnosisProvided'
        ].disabled
      ).toBeTrue();
      expect(confirmatory().length).toBe(2);
      expect(confirmatory().at(1).getRawValue().confirmatoryDiagnosis).toBe(
        'Typhoid'
      );
      expect(
        (confirmatory().at(0) as FormGroup).controls['confirmatoryDiagnosis']
          .disabled
      ).toBeTrue();
    });

    it('patches diagnosis without date or lists', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { diagnosis: { isMaternalDeath: false } } })
      );
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      expect(component.isMaternalDeath).toBeFalse();
      expect(provisional().length).toBe(1);
    });

    it('ignores responses without diagnosis', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500 })
      );
      component.getDiagnosisDetails('B1', 'V1', 'PNC');
      expect(component.isMaternalDeath).toBeNull();
    });

    it('does not fetch outside view mode', () => {
      component.caseRecordMode = 'new';
      component.ngOnChanges();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });
  });

  describe('provisional diagnosis rows', () => {
    it('adds rows up to 30 then alerts', () => {
      component.addProvisionalDiagnosis();
      expect(provisional().length).toBe(2);
      while (provisional().length < 30) component.addProvisionalDiagnosis();
      component.addProvisionalDiagnosis();
      expect(provisional().length).toBe(30);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis
      );
    });

    it('removes a valid row after confirmation', () => {
      component.addProvisionalDiagnosis();
      provisional().at(0).patchValue({
        conceptID: 'C',
        term: 'T',
        provisionalDiagnosis: 'T',
      });
      component.removeProvisionalDiagnosis(0, provisional().at(0));
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn
      );
      expect(provisional().length).toBe(1);
      expect(component.generalDiagnosisForm.dirty).toBeTrue();
    });

    it('resets the last valid row after confirmation', () => {
      const f: any = provisional().at(0);
      f.patchValue({ conceptID: 'C', term: 'T', provisionalDiagnosis: 'T' });
      component.removeProvisionalDiagnosis(0, f);
      expect(provisional().length).toBe(1);
      expect(f.value.term).toBeNull();
      expect(f.controls.provisionalDiagnosis.enabled).toBeTrue();
    });

    it('keeps a valid row when confirmation declined', () => {
      confirm.confirm.and.returnValue(of(false));
      const f: any = provisional().at(0);
      f.patchValue({ conceptID: 'C', term: 'T', provisionalDiagnosis: 'T' });
      component.removeProvisionalDiagnosis(0, f);
      expect(f.value.term).toBe('T');
      expect(component.generalDiagnosisForm.dirty).toBeFalse();
    });

    it('removes or resets invalid rows without confirmation', () => {
      component.addProvisionalDiagnosis();
      component.removeProvisionalDiagnosis(1, provisional().at(1));
      expect(provisional().length).toBe(1);
      const f: any = provisional().at(0);
      f.controls.provisionalDiagnosis.disable();
      component.removeProvisionalDiagnosis(0, f);
      expect(f.controls.provisionalDiagnosis.enabled).toBeTrue();
      expect(confirm.confirm).not.toHaveBeenCalled();
    });
  });

  describe('confirmatory diagnosis rows', () => {
    it('adds rows up to 30 then alerts', () => {
      while (confirmatory().length < 30) component.addConfirmatoryDiagnosis();
      component.addConfirmatoryDiagnosis();
      expect(confirmatory().length).toBe(30);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis
      );
    });

    it('removes a valid row after confirmation', () => {
      component.addConfirmatoryDiagnosis();
      confirmatory().at(0).patchValue({ conceptID: 'C', term: 'T' });
      component.removeConfirmatoryDiagnosis(0, confirmatory().at(0));
      expect(confirmatory().length).toBe(1);
      expect(component.generalDiagnosisForm.dirty).toBeTrue();
    });

    it('resets the last valid row after confirmation', () => {
      const f: any = confirmatory().at(0);
      f.patchValue({ conceptID: 'C', term: 'T' });
      f.controls.confirmatoryDiagnosis.disable();
      component.removeConfirmatoryDiagnosis(0, f);
      expect(f.value.term).toBeNull();
      expect(f.controls.confirmatoryDiagnosis.enabled).toBeTrue();
    });

    it('keeps a valid row when confirmation declined', () => {
      confirm.confirm.and.returnValue(of(false));
      const f: any = confirmatory().at(0);
      f.patchValue({ conceptID: 'C', term: 'T' });
      component.removeConfirmatoryDiagnosis(0, f);
      expect(f.value.term).toBe('T');
    });

    it('removes or resets invalid rows without confirmation', () => {
      component.addConfirmatoryDiagnosis();
      component.removeConfirmatoryDiagnosis(1, confirmatory().at(1));
      expect(confirmatory().length).toBe(1);
      const f: any = confirmatory().at(0);
      f.controls.confirmatoryDiagnosis.disable();
      component.removeConfirmatoryDiagnosis(0, f);
      expect(f.controls.confirmatoryDiagnosis.enabled).toBeTrue();
      expect(confirm.confirm).not.toHaveBeenCalled();
    });
  });

  it('checkWithDeathDetails clears death fields', () => {
    component.checkWithDeathDetails();
    const v = component.generalDiagnosisForm.value;
    expect(v.placeOfDeath).toBeNull();
    expect(v.dateOfDeath).toBeNull();
    expect(v.causeOfDeath).toBeNull();
  });

  it('validity checks require term and conceptID', () => {
    expect(
      component.checkProvisionalDiagnosisValidity({
        value: { term: 'T', conceptID: 'C' },
      })
    ).toBeFalse();
    expect(
      component.checkProvisionalDiagnosisValidity({ value: { term: 'T' } })
    ).toBeTrue();
    expect(
      component.checkConfirmatoryDiagnosisValidity({
        value: { term: 'T', conceptID: 'C' },
      })
    ).toBeFalse();
    expect(
      component.checkConfirmatoryDiagnosisValidity({ value: {} })
    ).toBeTrue();
  });

  describe('diagnosis search', () => {
    it('provisional search queries after 3 chars', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ term: 'Fever' }] } })
      );
      component.onDiagnosisInputKeyup('fev', 0);
      expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        0
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([{ term: 'Fever' }]);
      component.onDiagnosisInputKeyup('fe', 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
    });

    it('confirmatory search queries after 3 chars', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(of(null));
      component.onConfirmatoryDiagnosisInputKeyup('mal', 1);
      expect(component.suggestedConfirmatoryDiagnosisList[1]).toBeUndefined();
      component.onConfirmatoryDiagnosisInputKeyup('ma', 1);
      expect(component.suggestedConfirmatoryDiagnosisList[1]).toEqual([]);
    });
  });

  it('display helpers handle strings, objects and null', () => {
    expect(component.displayDiagnosis('abc')).toBe('abc');
    expect(component.displayDiagnosis({ term: 'T' })).toBe('T');
    expect(component.displayDiagnosis(null)).toBe('');
    expect(component.displayConfirmatoryDiagnosis('x')).toBe('x');
    expect(component.displayConfirmatoryDiagnosis({ term: 'Y' })).toBe('Y');
    expect(component.displayConfirmatoryDiagnosis(undefined)).toBe('');
  });

  it('onDiagnosisSelected patches provisional row', () => {
    const sel = { term: 'Fever', conceptID: 'C1' };
    component.onDiagnosisSelected(sel, 0);
    expect(provisional().at(0).value).toEqual({
      conceptID: 'C1',
      term: 'Fever',
      provisionalDiagnosis: 'Fever',
      viewProvisionalDiagnosisProvided: sel,
    });
    component.onDiagnosisSelected(null, 0);
    expect(provisional().at(0).value.term).toBeNull();
  });

  it('onConfirmatoryDiagnosisSelected patches confirmatory row', () => {
    component.onConfirmatoryDiagnosisSelected(
      { term: 'Malaria', conceptID: 'C9' },
      0
    );
    expect(confirmatory().at(0).value.term).toBe('Malaria');
    expect(confirmatory().at(0).value.conceptID).toBe('C9');
    component.onConfirmatoryDiagnosisSelected(undefined, 0);
    expect(confirmatory().at(0).value.conceptID).toBeNull();
  });

  it('ngOnDestroy unsubscribes beneficiary subscription', () => {
    const s = jasmine.createSpyObj('s', ['unsubscribe']);
    component.beneficiaryDetailsSubscription = s;
    component.ngOnDestroy();
    expect(s.unsubscribe).toHaveBeenCalled();
  });
});
