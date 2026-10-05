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
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { CovidVaccinationStatusComponent } from './covid-vaccination-status.component';

describe('CovidVaccinationStatusComponent', () => {
  let component: CovidVaccinationStatusComponent;
  let fixture: ComponentFixture<CovidVaccinationStatusComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let beneficiary$: BehaviorSubject<any>;

  const buildForm = () =>
    new FormGroup({
      covidVSID: new FormControl(null),
      ageGroup: new FormControl(null),
      isApplicableForVaccine: new FormControl(null),
      vaccineStatus: new FormControl(null),
      vaccineTypes: new FormControl(null),
      doseTaken: new FormControl(null),
    });
  const ctrl = (n: string) => component.covidVaccineStatusForm.controls[n];
  const masterOk = {
    statusCode: 200,
    data: { doseType: [{ id: 1 }], vaccineType: [{ id: 2 }] },
  };

  beforeEach(async () => {
    beneficiary$ = new BehaviorSubject<any>(null);
    master = autoSpy(MasterdataService);
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CovidVaccinationStatusComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'b1' } }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(CovidVaccinationStatusComponent, '');
    fixture = TestBed.createComponent(CovidVaccinationStatusComponent);
    component = fixture.componentInstance;
    component.covidVaccineStatusForm = buildForm();
    confirm = TestBed.inject(ConfirmationService);
    spyOn(console, 'log');
  });

  describe('ngOnInit', () => {
    it('resets doctor flags, sets language, loads masters without beneficiary', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(of(masterOk));
      component.ngOnInit();
      expect(doctor.enableCovidVaccinationButton).toBeFalse();
      expect(doctor.covidVaccineAgeGroup).toBeNull();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.doseTypeList).toEqual([{ id: 1 }]);
      expect(component.vaccineTypeList).toEqual([{ id: 2 }]);
      expect(master.getPreviousCovidVaccinationDetails).not.toHaveBeenCalled();
    });

    it('marks under-12 beneficiaries not applicable', () => {
      beneficiary$.next({ ageVal: 8 });
      component.ngOnInit();
      expect(ctrl('ageGroup').value).toBe('<12 years');
      expect(ctrl('isApplicableForVaccine').value).toBe(
        'Not Applicable for Vaccination'
      );
      expect(ctrl('ageGroup').disabled).toBeTrue();
      expect(ctrl('isApplicableForVaccine').disabled).toBeTrue();
      expect(doctor.covidVaccineAgeGroup).toBe('<12 years');
      expect(component.enableVaccinationStatusFields).toBeFalse();
    });

    it('marks 12+ beneficiaries applicable and loads previous details (YES)', () => {
      beneficiary$.next({ ageVal: 30 });
      master.getVaccinationTypeAndDoseMaster.and.returnValue(of(masterOk));
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            covidVSID: 5,
            vaccineStatus: 'YES',
            covidVaccineTypeID: 2,
            doseTypeID: 1,
          },
        })
      );
      component.ngOnInit();
      expect(ctrl('ageGroup').value).toBe('>=12 years');
      expect(ctrl('isApplicableForVaccine').value).toBe(
        'Applicable for Vaccination'
      );
      expect(component.enableVaccinationStatusFields).toBeTrue();
      expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
        'b1'
      );
      expect(ctrl('covidVSID').value).toBe(5);
      expect(ctrl('vaccineTypes').value).toBe(2);
      expect(ctrl('doseTaken').value).toBe(1);
      expect(component.enableVaccineTypeAndDoseTakenFlag).toBeTrue();
      expect(component.enableSaveButton).toBeTrue();
      expect(doctor.enableCovidVaccinationButton).toBeFalse();
    });

    it('loads previous details with NO status without type/dose', () => {
      beneficiary$.next({ ageVal: 30 });
      master.getVaccinationTypeAndDoseMaster.and.returnValue(of(masterOk));
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: { covidVSID: 6, vaccineStatus: 'NO' } })
      );
      component.ngOnInit();
      expect(ctrl('vaccineStatus').value).toBe('NO');
      expect(ctrl('vaccineTypes').value).toBeNull();
      expect(component.enableVaccineTypeAndDoseTakenFlag).toBeFalse();
      expect(component.enableSaveButton).toBeTrue();
    });

    it('ignores previous details without covidVSID or non-200', () => {
      beneficiary$.next({ ageVal: 30 });
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getPreviousCovidVaccinationDetails();
      expect(ctrl('covidVSID').value).toBeNull();
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 5000, data: { covidVSID: 1 } })
      );
      component.getPreviousCovidVaccinationDetails();
      expect(ctrl('covidVSID').value).toBeNull();
    });

    it('logs previous-details errors', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        throwingObs({ errorMessage: 'bad' })
      );
      component.getPreviousCovidVaccinationDetails();
      expect(console.log).toHaveBeenCalledWith('error', 'bad');
    });
  });

  describe('getVaccinationTypeAndDoseMaster', () => {
    it('ignores 200 without data', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(component.doseTypeList).toEqual([]);
    });

    it('ignores non-200', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 5000, data: masterOk.data })
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(component.vaccineTypeList).toEqual([]);
    });

    it('logs errors', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        throwingObs({ errorMessage: 'down' })
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(console.log).toHaveBeenCalledWith('error', 'down');
    });
  });

  it('ngDoCheck refreshes language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('setIsApplicable', () => {
    it('handles <12 years', () => {
      ctrl('ageGroup').setValue('<12 years');
      ctrl('vaccineStatus').setValue('YES');
      component.setIsApplicable();
      expect(ctrl('vaccineStatus').value).toBeNull();
      expect(ctrl('isApplicableForVaccine').value).toBe(
        'Not Applicable for Vaccination'
      );
      expect(component.enableVaccinationStatusFields).toBeFalse();
      expect(doctor.enableCovidVaccinationButton).toBeTrue();
      expect(doctor.covidVaccineAgeGroup).toBe('<12 years');
    });

    it('handles >=12 years', () => {
      ctrl('ageGroup').setValue('>=12 years');
      component.setIsApplicable();
      expect(ctrl('isApplicableForVaccine').value).toBe(
        'Applicable for Vaccination'
      );
      expect(component.enableVaccinationStatusFields).toBeTrue();
      expect(doctor.enableCovidVaccinationButton).toBeFalse();
      expect(component.enableSaveButton).toBeTrue();
    });
  });

  describe('enableVaccineTypeAndDoseTaken', () => {
    it('enables type/dose on YES', () => {
      ctrl('vaccineStatus').setValue('YES');
      ctrl('doseTaken').setValue(1);
      component.enableVaccineTypeAndDoseTaken();
      expect(ctrl('doseTaken').value).toBeNull();
      expect(component.enableVaccineTypeAndDoseTakenFlag).toBeTrue();
      expect(component.enableSaveButton).toBeTrue();
      expect(doctor.enableCovidVaccinationButton).toBeFalse();
    });

    it('allows save on NO', () => {
      ctrl('vaccineStatus').setValue('NO');
      component.enableVaccineTypeAndDoseTaken();
      expect(component.enableVaccineTypeAndDoseTakenFlag).toBeFalse();
      expect(component.enableSaveButton).toBeFalse();
      expect(doctor.enableCovidVaccinationButton).toBeTrue();
    });
  });

  describe('enableSaveButtonInForm', () => {
    it('enables saving when type and dose chosen', () => {
      ctrl('vaccineTypes').setValue(1);
      ctrl('doseTaken').setValue(2);
      component.enableSaveButtonInForm();
      expect(component.enableSaveButton).toBeFalse();
      expect(doctor.enableCovidVaccinationButton).toBeTrue();
    });

    it('disables saving when dose missing', () => {
      ctrl('vaccineTypes').setValue(1);
      component.enableSaveButtonInForm();
      expect(component.enableSaveButton).toBeTrue();
      expect(doctor.enableCovidVaccinationButton).toBeFalse();
    });
  });

  describe('saveBenCovidVaccinationDetails', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('alerts success and stores covidVSID', () => {
      nurse.saveBenCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: { covidVSID: 11 } })
      );
      component.covidVaccineStatusForm.markAsDirty();
      component.saveBenCovidVaccinationDetails();
      expect(nurse.saveBenCovidVaccinationDetails).toHaveBeenCalledWith(
        component.covidVaccineStatusForm
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.covidVaccinationDetailsSaved,
        'success'
      );
      expect(ctrl('covidVSID').value).toBe(11);
      expect(component.covidVaccineStatusForm.pristine).toBeTrue();
      expect(doctor.enableCovidVaccinationButton).toBeFalse();
    });

    it('alerts error message on failure status', () => {
      nurse.saveBenCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'nope' })
      );
      component.saveBenCovidVaccinationDetails();
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
    });

    it('alerts on http error', () => {
      nurse.saveBenCovidVaccinationDetails.and.returnValue(throwingObs('err'));
      component.saveBenCovidVaccinationDetails();
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
    });
  });
});
