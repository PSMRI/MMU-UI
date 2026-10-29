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
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { DoctorService, MasterdataService } from '../../../shared/services';
import { ImmunizationHistoryComponent } from './immunization-history.component';

describe('ImmunizationHistoryComponent', () => {
  let component: ImmunizationHistoryComponent;
  let fixture: ComponentFixture<ImmunizationHistoryComponent>;
  let doctor: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  const vaccinations = [
    {
      vaccinationTime: '6 Weeks',
      vaccineName: 'OPV1',
      sctCode: 's1',
      sctTerm: 't1',
    },
    {
      vaccinationTime: 'At Birth',
      vaccineName: 'BCG',
      sctCode: null,
      sctTerm: null,
    },
    {
      vaccinationTime: '6 Weeks',
      vaccineName: 'DPT1',
      sctCode: 's2',
      sctTerm: 't2',
    },
    {
      vaccinationTime: '9 Months',
      vaccineName: 'MR',
      sctCode: 's3',
      sctTerm: 't3',
    },
    {
      vaccinationTime: '5 Years',
      vaccineName: 'DT',
      sctCode: 's4',
      sctTerm: 't4',
    },
  ];

  async function setup(mode = 'new', age: any = '1 years - 2 months') {
    doctor = autoSpy(DoctorService);
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(age === 'NULL_BEN' ? null : { age });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ImmunizationHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: '11', visitID: '22' },
        }),
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ImmunizationHistoryComponent, '')
      .compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(ImmunizationHistoryComponent);
    component = fixture.componentInstance;
    form = new FormGroup({ immunizationList: new FormArray([]) });
    component.immunizationHistoryForm = form;
    component.mode = mode;
    fixture.detectChanges();
  }

  const list = () => form.controls['immunizationList'] as FormArray;

  describe('new mode', () => {
    beforeEach(async () => setup('new'));

    it('sets language and ignores master data without vaccinations', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      master$.next({ other: 1 });
      expect(component.masterData).toBeUndefined();
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('builds age-filtered, sorted immunization groups', () => {
      master$.next({ childVaccinations: vaccinations });
      expect(component.beneficiaryAge).toBe('1 years');
      expect(component.temp.map((t: any) => t.defaultReceivingAge)).toEqual([
        'At Birth',
        '6 Weeks',
        '9 Months',
      ]);
      expect(component.temp[1].vaccines).toEqual([
        { vaccine: 'OPV1', sctCode: 's1', sctTerm: 't1', status: false },
        { vaccine: 'DPT1', sctCode: 's2', sctTerm: 't2', status: false },
      ]);
      expect(component.temp[0].vaccines[0]).toEqual({
        vaccine: 'BCG',
        sctCode: null,
        sctTerm: null,
        status: false,
      });
      expect(list().length).toBe(3);
      expect((list().at(1).get('vaccines') as FormArray).length).toBe(2);
      expect(list().at(1).value.defaultReceivingAge).toBe('6 Weeks');
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });

    it('selectAll toggles every vaccine status', () => {
      master$.next({ childVaccinations: vaccinations });
      component.selectAll({ checked: true }, 1);
      const vs = () => (list().at(1).get('vaccines') as FormArray).value;
      expect(vs().every((v: any) => v.status === true)).toBeTrue();
      expect(list().dirty).toBeTrue();
      component.selectAll({ checked: false }, 1);
      expect(vs().every((v: any) => v.status === false)).toBeTrue();
    });

    it('getAgeValue converts units', () => {
      expect(component.getAgeValue(null)).toBe(0);
      expect(component.getAgeValue('2 years')).toBe(720);
      expect(component.getAgeValue('3 Months')).toBe(90);
      expect(component.getAgeValue('2 weeks')).toBe(14);
      expect(component.getAgeValue('4 days')).toBe(0);
      expect(component.getAgeValue('Birth')).toBe(0);
    });

    it('ngOnDestroy unsubscribes', () => {
      master$.next({ childVaccinations: [] });
      const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const b = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(a).toHaveBeenCalled();
      expect(b).toHaveBeenCalled();
      component.nurseMasterDataSubscription = null;
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('beneficiary without age', () => {
    beforeEach(async () => setup('new', null));

    it('keeps only zero-age vaccinations', () => {
      master$.next({ childVaccinations: vaccinations });
      expect(component.beneficiaryAge).toBeUndefined();
      expect(component.temp.map((t: any) => t.defaultReceivingAge)).toEqual([
        'At Birth',
      ]);
    });
  });

  describe('null beneficiary', () => {
    beforeEach(async () => setup('new', 'NULL_BEN'));

    it('does not set age', () => {
      master$.next({ childVaccinations: vaccinations });
      expect(component.beneficiaryAge).toBeUndefined();
    });
  });

  describe('view mode', () => {
    beforeEach(async () => setup('view'));

    it('loads history and computes select-all flags', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            ImmunizationHistory: {
              immunizationList: [
                {
                  defaultReceivingAge: 'At Birth',
                  vaccines: [{ vaccine: 'BCG', status: true }],
                },
                {
                  defaultReceivingAge: '6 Weeks',
                  vaccines: [
                    { vaccine: 'OPV1', status: true },
                    { vaccine: 'DPT1', status: false },
                  ],
                },
              ],
            },
          },
        })
      );
      master$.next({ childVaccinations: vaccinations });
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith('11', '22');
      expect(component.checkSelectALL).toEqual([true, false]);
      expect(
        (list().at(0).get('vaccines') as FormArray).at(0).value.status
      ).toBeTrue();
    });

    it('ignores responses without immunization list', () => {
      doctor.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { ImmunizationHistory: {} } })
      );
      master$.next({ childVaccinations: vaccinations });
      expect(component.checkSelectALL).toEqual([]);
    });
  });
});
