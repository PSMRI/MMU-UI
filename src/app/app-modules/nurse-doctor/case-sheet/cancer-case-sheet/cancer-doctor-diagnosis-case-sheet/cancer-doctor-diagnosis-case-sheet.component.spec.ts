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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { MasterdataService } from '../../../shared/services';
import { CancerDoctorDiagnosisCaseSheetComponent } from './cancer-doctor-diagnosis-case-sheet.component';

describe('CancerDoctorDiagnosisCaseSheetComponent', () => {
  let component: CancerDoctorDiagnosisCaseSheetComponent;
  let fixture: ComponentFixture<CancerDoctorDiagnosisCaseSheetComponent>;
  let master: any;

  const setup = async (session: Record<string, any> = {}) => {
    master = autoSpy(MasterdataService);
    master.getVaccinationTypeAndDoseMaster.and.returnValue(
      of({ statusCode: 200, data: null })
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerDoctorDiagnosisCaseSheetComponent],
      providers: [
        ...commonTestProviders({
          session: { caseSheetBeneficiaryRegID: '42', ...session },
        }),
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CancerDoctorDiagnosisCaseSheetComponent);
    component = fixture.componentInstance;
    spyOn(console, 'log');
  };

  describe('ngOnInit', () => {
    it('sets date and language, doctor sign off by default', async () => {
      await setup();
      component.ngOnInit();
      const t = new Date();
      expect(component.date).toBe(
        t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear()
      );
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.enableDoctorSign).toBeFalse();
    });

    it('enables doctor sign for TM flag', async () => {
      await setup({ caseSheetTMFlag: 'true' });
      component.ngOnInit();
      expect(component.enableDoctorSign).toBeTrue();
    });

    it('enables doctor sign for specialist flag 200', async () => {
      await setup({ specialistFlag: '200' });
      component.ngOnInit();
      expect(component.enableDoctorSign).toBeTrue();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(async () => setup());

    it('does nothing without data', () => {
      component.ngOnChanges();
      expect(component.beneficiaryDetails).toBeUndefined();
    });

    it('formats dates and maps vitals, diagnosis, service point', () => {
      component.caseSheetData = {
        BeneficiaryData: {
          serviceDate: '2024-01-02T03:04:05',
          consultationDate: '2024-11-12T13:14:15',
          ageVal: 5,
        },
        nurseData: {
          benVisitDetail: { serviceProviderName: 'SP' },
          currentVitals: { bp: 1 },
        },
        doctorData: { diagnosis: { d: 1 } },
      };
      component.ngOnChanges();
      expect(component.servicePointName).toBe('SP');
      expect(component.beneficiaryDetails.serviceDate).toBe(
        '02/01/2024 03:04:05'
      );
      expect(component.beneficiaryDetails.consultationDate).toBe(
        '12/11/2024 13:14:15'
      );
      expect(component.currentVitals).toEqual({ bp: 1 });
      expect(component.caseSheetDiagnosisData).toEqual({ d: 1 });
      expect(master.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });

    it('skips optional sections and fetches vaccination for adults', () => {
      component.caseSheetData = {
        BeneficiaryData: { ageVal: 30 },
        nurseData: { benVisitDetail: {} },
      };
      component.ngOnChanges();
      expect(component.currentVitals).toBeUndefined();
      expect(component.caseSheetDiagnosisData).toBeUndefined();
      expect(master.getVaccinationTypeAndDoseMaster).toHaveBeenCalled();
    });
  });

  describe('covid vaccination', () => {
    beforeEach(async () => {
      await setup();
      component.beneficiaryDetails = { ageVal: 20 };
    });

    it('loads masters and previous vaccination with filtered types', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({
          statusCode: 200,
          data: {
            doseType: [{ covidDoseTypeID: 1 }, { covidDoseTypeID: 2 }],
            vaccineType: [{ covidVaccineTypeID: 7 }],
          },
        })
      );
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidVSID: 1, doseTypeID: 1, covidVaccineTypeID: 7 },
        })
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
        '42'
      );
      expect(component.covidVaccineDetails.doseTypeID).toEqual([
        { covidDoseTypeID: 1 },
      ]);
      expect(component.covidVaccineDetails.covidVaccineTypeID).toEqual([
        { covidVaccineTypeID: 7 },
      ]);
    });

    it('stores data without type ids; ignores missing covidVSID and non-200', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: { covidVSID: 1 } })
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toEqual({ covidVSID: 1 });
      component.covidVaccineDetails = undefined;
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getPreviousCovidVaccinationDetails([], []);
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 500 })
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toBeUndefined();

      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 500 })
      );
      master.getPreviousCovidVaccinationDetails.calls.reset();
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getPreviousCovidVaccinationDetails).not.toHaveBeenCalled();
    });

    it('logs errors from both calls', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        throwingObs({ errorMessage: 'm' })
      );
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        throwingObs({ errorMessage: 'p' })
      );
      component.getVaccinationTypeAndDoseMaster();
      component.getPreviousCovidVaccinationDetails([], []);
      expect(console.log).toHaveBeenCalledWith('error', 'm');
      expect(console.log).toHaveBeenCalledWith('error', 'p');
    });
  });

  it('padLeft and language helpers', async () => {
    await setup();
    expect(String(component.padLeft.apply(3 as any))).toBe('03');
    component.assignSelectedLanguage();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
