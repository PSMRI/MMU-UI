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
} from 'src/testing/test-utils';
import { DoctorService } from '../../../shared/services';
import { HistoryCaseSheetComponent } from './history-case-sheet.component';

describe('HistoryCaseSheetComponent', () => {
  let component: HistoryCaseSheetComponent;
  let fixture: ComponentFixture<HistoryCaseSheetComponent>;
  let doctor: any;

  const setup = async (session: Record<string, any> = {}) => {
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HistoryCaseSheetComponent],
      providers: [
        ...commonTestProviders({
          session: { caseSheetVisitCategory: 'General OPD', ...session },
        }),
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HistoryCaseSheetComponent);
    component = fixture.componentInstance;
    spyOn(console, 'log');
  };

  const services = [
    { serviceName: 'A' },
    { serviceName: null },
    { serviceName: 'B' },
  ];

  describe('ngOnInit', () => {
    it('sets language and visit category without TC flag', async () => {
      await setup();
      component.ngOnInit();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('General OPD');
      expect(component.enableTCReferredMMUData).toBeFalse();
      expect(doctor.getMMUCasesheetData).not.toHaveBeenCalled();
    });

    it('requests MMU data when caseSheetTMFlag is "true"', async () => {
      await setup({
        caseSheetTMFlag: 'true',
        caseSheetBenFlowID: 'f',
        caseSheetVisitID: 'v',
        caseSheetBeneficiaryRegID: 'r',
        caseSheetVisitCode: 'c',
      });
      component.ngOnInit();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalledWith({
        VisitCategory: 'General OPD',
        benFlowID: 'f',
        benVisitID: 'v',
        beneficiaryRegID: 'r',
        visitCode: 'c',
      });
      expect(component.enableTCReferredMMUData).toBeTrue();
    });

    it('requests MMU data when specialistFlag is 200', async () => {
      await setup({ specialistFlag: '200' });
      component.ngOnInit();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalled();
    });
  });

  describe('getMMUCasesheetDataInTCReferred', () => {
    beforeEach(async () => setup());

    it('builds comma-separated service list and refer details', () => {
      doctor.getMMUCasesheetData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            doctorData: { Refer: { refrredToAdditionalServiceList: services } },
          },
        })
      );
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.mmuServiceList).toBe('A,B');
      expect(component.mmuCaseSheetData.referDetails).toEqual({
        refrredToAdditionalServiceList: services,
      });
    });

    it('handles missing Refer and missing doctorData', () => {
      doctor.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { doctorData: {} } })
      );
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.mmuServiceList).toBe('');
      expect(component.mmuCaseSheetData.referDetails).toBeUndefined();

      doctor.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.mmuCaseSheetData).toEqual({});
    });

    it('ignores non-200', () => {
      doctor.getMMUCasesheetData.and.returnValue(of({ statusCode: 500 }));
      component.getMMUCasesheetDataInTCReferred({});
      expect(component.mmuCaseSheetData).toBeUndefined();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(async () => setup());

    const fullHistory = () => ({
      PastHistory: { pastIllness: ['pi'], pastSurgery: ['ps'] },
      FamilyHistory: { f: 1 },
      PhysicalActivityHistory: { p: 1 },
      childOptionalVaccineHistory: { childOptionalVaccineList: ['cv'] },
      ComorbidityConditions: { comorbidityConcurrentConditionsList: ['cc'] },
      MedicationHistory: { medicationHistoryList: ['mh'] },
      FemaleObstetricHistory: { fo: 1 },
      DevelopmentHistory: { d: 1 },
      FeedingHistory: { fe: 1 },
      MenstrualHistory: { m: 1 },
      PerinatalHistory: { pe: 1 },
      PersonalHistory: { pers: 1 },
      ImmunizationHistory: { im: 1 },
    });

    it('maps every history section, ANC details and refer info', () => {
      component.caseSheetData = {
        BeneficiaryData: { name: 'x' },
        nurseData: { history: fullHistory(), anc: { ANCCareDetail: { a: 1 } } },
        doctorData: {
          Refer: {
            refrredToAdditionalServiceList: services,
            revisitDate: '2024-02-03T00:00:00',
          },
        },
      };
      component.ngOnChanges();
      expect(component.beneficiary).toEqual({ name: 'x' });
      expect(component.ANCDetailsAndFormula).toEqual({ a: 1 });
      expect(component.pastIllnessList).toEqual(['pi']);
      expect(component.pastSurgeryList).toEqual(['ps']);
      expect(component.familyHistory).toEqual({ f: 1 });
      expect(component.previousPhysicalList).toEqual({ p: 1 });
      expect(component.childOptionalVaccineList).toEqual(['cv']);
      expect(component.comorbidConditionList).toEqual(['cc']);
      expect(component.medicationHistoryList).toEqual(['mh']);
      expect(component.femaleObstetricHistory).toEqual({ fo: 1 });
      expect(component.developmentalHistory).toEqual({ d: 1 });
      expect(component.feedingHistory).toEqual({ fe: 1 });
      expect(component.menstrualHistory).toEqual({ m: 1 });
      expect(component.perinatalHistory).toEqual({ pe: 1 });
      expect(component.personalHistory).toEqual({ pers: 1 });
      expect(component.immunizationHistory).toEqual({ im: 1 });
      expect(component.serviceList).toBe('A,B');
      expect(component.referDetails.revisitDate).toBe('03/02/2024');
      expect(component.caseSheetData.referDetails).toBe(component.referDetails);
    });

    it('leaves sections unset when history is empty and keeps valid revisit date', () => {
      component.caseSheetData = {
        BeneficiaryData: {},
        nurseData: { history: {} },
        doctorData: { Refer: { revisitDate: '05/06/2024' } },
      };
      component.ngOnChanges();
      expect(component.pastIllnessList).toBeUndefined();
      expect(component.ANCDetailsAndFormula).toBeUndefined();
      expect(component.immunizationHistory).toBeUndefined();
      expect(component.referDetails.revisitDate).toBe('05/06/2024');
    });

    it('skips everything without beneficiary or doctor data', () => {
      component.caseSheetData = { nurseData: { history: fullHistory() } };
      component.ngOnChanges();
      expect(component.beneficiary).toBeUndefined();
      expect(component.referDetails).toBeUndefined();

      component.caseSheetData = {
        BeneficiaryData: {},
        nurseData: {},
        doctorData: {},
      };
      component.ngOnChanges();
      expect(component.generalhistory).toBeUndefined();
      expect(component.caseSheetData.referDetails).toBeUndefined();
    });
  });

  it('padLeft pads to two digits', async () => {
    await setup();
    expect(String(component.padLeft.apply(7 as any))).toBe('07');
    expect(String(component.padLeft.apply(12 as any))).toBe('12');
  });

  it('ngDoCheck refreshes language', async () => {
    await setup();
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
