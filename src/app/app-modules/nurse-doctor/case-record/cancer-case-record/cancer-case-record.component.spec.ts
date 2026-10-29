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
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { CameraService } from 'src/app/app-modules/core/services';
import { DoctorService } from '../../shared/services';
import { CancerCaseRecordComponent } from './cancer-case-record.component';

describe('CancerCaseRecordComponent', () => {
  let component: CancerCaseRecordComponent;
  let fixture: ComponentFixture<CancerCaseRecordComponent>;
  let doctor: any;
  let camera: any;
  let ben$: BehaviorSubject<any>;
  let session: any;
  let router: Router;

  const vitals = { weight_Kg: 64, height_cm: 160 };
  const diagnosisForm = () =>
    new FormGroup({
      provisionalDiagnosisPrimaryDoctor: new FormControl(null),
      remarks: new FormControl(null),
      provisionalDiagnosisOncologist: new FormControl(null),
    });

  const setup = async (
    opts: {
      ben?: any;
      mode?: string;
      sessionData?: Record<string, any>;
    } = {}
  ) => {
    ben$ = new BehaviorSubject<any>(opts.ben ?? null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerCaseRecordComponent],
      providers: [
        ...commonTestProviders({ session: opts.sessionData }),
        { provide: DoctorService, useValue: doctor },
        { provide: CameraService, useValue: camera },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CancerCaseRecordComponent);
    component = fixture.componentInstance;
    component.diagnosisForm = diagnosisForm();
    component.caseRecordMode = opts.mode ?? 'new';
    component.currentVitals = vitals;
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  };

  beforeEach(() => {
    doctor = autoSpy(DoctorService);
    camera = autoSpy(CameraService);
  });

  afterEach(() => fixture?.destroy());

  describe('with no beneficiary', () => {
    beforeEach(async () => setup());

    it('sets language and fetches nothing', () => {
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.female).toBeUndefined();
      expect(doctor.getCancerVitalsDetails).not.toHaveBeenCalled();
    });

    it('calculateBMI computes BMI or 0 without vitals', () => {
      expect(component.calculateBMI()).toBe(25);
      component.currentVitals = null;
      expect(component.calculateBMI()).toBe(0);
    });

    it('checkNormalWaist uses 90cm cutoff for non-female', () => {
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeTrue();
      component.checkNormalWaist(95);
      expect(component.normalWaist).toBeFalse();
    });

    it('checkNormalWaist uses 80cm cutoff for non-pregnant female', () => {
      component.female = true;
      component.pregnancyStatus = 'No';
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeFalse();
      component.checkNormalWaist(75);
      expect(component.normalWaist).toBeTrue();
      component.pregnancyStatus = 'Yes';
      component.checkNormalWaist(85);
      expect(component.normalWaist).toBeTrue();
    });

    it('patchDiagnosisDetails patches the form', () => {
      component.patchDiagnosisDetails({ remarks: 'r1' });
      expect(component.diagnosisForm.value.remarks).toBe('r1');
    });

    it('getDiagnosisDetails patches when diagnosis present', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { diagnosis: { provisionalDiagnosisOncologist: 'CA' } },
        })
      );
      component.getDiagnosisDetails(1, 2, 'Cancer Screening');
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        1,
        2,
        'Cancer Screening'
      );
      expect(component.diagnosisForm.value.provisionalDiagnosisOncologist).toBe(
        'CA'
      );
    });

    it('getDiagnosisDetails ignores response without diagnosis', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getDiagnosisDetails(1, 2, 'x');
      expect(component.diagnosisForm.value.remarks).toBeNull();
    });

    it('getCaseSheetPrintData stores details and navigates', () => {
      component.getCaseSheetPrintData({
        createdDate: '2024-01-02T00:00:00.000Z',
        VisitCategory: 'Cancer Screening',
        beneficiaryRegID: 5,
        benVisitID: 6,
      });
      expect(component.visitDateTime).toBe('2024-01-02T00:00:00.000Z');
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetBenFlowID',
        'null'
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'Cancer Screening'
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetBeneficiaryRegID',
        5
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 6);
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/print']);
    });

    it('renders findings section only when findings present', () => {
      expect(fixture.nativeElement.textContent).not.toContain('history-text');
      component.findings = { briefHistory: 'history-text' };
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('history-text');
    });

    it('ngOnDestroy unsubscribes subscriptions', () => {
      component.getDiagnosisDetails(1, 2, 'x');
      const s1 = component.beneficiaryDetailsSubscription;
      const s2 = component.diagnosisSubscription;
      spyOn(s1, 'unsubscribe').and.callThrough();
      spyOn(s2, 'unsubscribe').and.callThrough();
      component.ngOnDestroy();
      expect(s1.unsubscribe).toHaveBeenCalled();
      expect(s2.unsubscribe).toHaveBeenCalled();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      component.beneficiaryDetailsSubscription.unsubscribe();
      component.beneficiaryDetailsSubscription = null;
      component.diagnosisSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('graphs', () => {
    beforeEach(async () => setup());

    it('plots BP, weight and glucose graphs newest first', () => {
      component.movegraphData({
        bpList: [
          { date: '2024-01-01', avgSysBP: 120, avgDysBP: 80 },
          { date: '2024-02-01', avgSysBP: 130, avgDysBP: 85 },
          { date: '2024-03-01', avgSysBP: null, avgDysBP: 70 },
        ],
        weightList: [
          { date: '2024-01-01', weight: 60 },
          { date: '2024-02-01', weight: 62 },
          { date: '2024-03-01', weight: null },
        ],
        bgList: [
          {
            date: '2024-01-01',
            bg_2hr_pp: 140,
            bg_fasting: 90,
            bg_random: 110,
          },
          { date: '2024-02-01', bg_2hr_pp: 150 },
        ],
      });
      expect(component.bpChartLabels).toEqual(['2024-02-01', '2024-01-01']);
      expect(component.bpChartData).toEqual([
        { data: [130, 120], label: 'Systolic BP' },
        { data: [85, 80], label: 'Diastolic BP' },
      ]);
      expect(component.weightChartData).toEqual([
        { data: [62, 60], label: 'Weight' },
      ]);
      expect(component.weightChartLabels).toEqual(['2024-02-01', '2024-01-01']);
      expect(component.bgChartLabels).toEqual(['2024-01-01']);
      expect(component.bgChartData).toEqual([
        { data: [140], label: '2-Hr Post Prandial' },
        { data: [90], label: 'Fasting' },
        { data: [110], label: 'Random' },
      ]);
    });

    it('adds no series for empty lists', () => {
      component.movegraphData({ bpList: [], weightList: [], bgList: [] });
      expect(component.bpChartData).toEqual([]);
      expect(component.weightChartData).toEqual([]);
      expect(component.bgChartData).toEqual([]);
    });

    it('chartClicked opens the matching graph', () => {
      component.weightChartData = [{ data: [1] }];
      component.chartClicked('bw');
      expect(camera.ViewGraph).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'bw',
          chartData: [{ data: [1] }],
          chartType: 'line',
          chartColors: component.weightChartColors,
        })
      );
      component.chartClicked('bp');
      expect(camera.ViewGraph.calls.mostRecent().args[0].type).toBe('bp');
      expect(camera.ViewGraph.calls.mostRecent().args[0].chartColors).toBe(
        component.bpChartColors
      );
      component.chartClicked('bg');
      expect(camera.ViewGraph.calls.mostRecent().args[0].type).toBe('bg');
      expect(camera.ViewGraph).toHaveBeenCalledTimes(3);
      component.chartClicked('unknown');
      expect(camera.ViewGraph).toHaveBeenCalledTimes(3);
    });

    it('graph callers skip incomplete graph objects', () => {
      component.callBodyWeightGraph({ type: 'bw' });
      component.callBloodPressureGraph({});
      component.callBloodGlucoseGraph({ a: 1 });
      expect(camera.ViewGraph).not.toHaveBeenCalled();
    });
  });

  describe('MMU history', () => {
    beforeEach(async () => setup());

    it('loads history on 200', () => {
      doctor.getMMUHistory.and.returnValue(
        of({
          statusCode: 200,
          data: [{ VisitCategory: 'Cancer' }, { VisitCategory: 'ANC' }],
        })
      );
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeTrue();
      expect(component.previousMMUHistoryPagedList.length).toBe(2);
    });

    it('ignores non-200 history', () => {
      doctor.getMMUHistory.and.returnValue(of({ statusCode: 500 }));
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeFalse();
    });

    it('filterMMUHistory filters by category and resets', () => {
      component.historyOfMMU = [
        { VisitCategory: 'Cancer' },
        { VisitCategory: 'ANC' },
      ] as any;
      component.previousMMUHistoryActivePage = 2;
      component.filterMMUHistory('canc');
      expect(component.filteredMMUHistory).toEqual([
        { VisitCategory: 'Cancer' },
      ]);
      expect(component.previousMMUHistoryActivePage).toBe(1);
      expect(component.previousMMUHistoryPagedList).toEqual([
        { VisitCategory: 'Cancer' },
      ] as any);
      component.filterMMUHistory();
      expect(component.filteredMMUHistory.length).toBe(2);
    });
  });

  describe('with female beneficiary', () => {
    const ben = { genderName: 'Female', beneficiaryRegID: 3, benVisitID: 4 };

    it('fetches graph data and plots it', async () => {
      doctor.getCancerVitalsDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            GraphData: {
              bpList: [],
              weightList: [{ date: '2024-01-01', weight: 50 }],
              bgList: [],
            },
          },
        })
      );
      await setup({ ben });
      expect(component.female).toBeTrue();
      expect(doctor.getCancerVitalsDetails).toHaveBeenCalledWith(3, 4);
      expect(component.weightChartData).toEqual([
        { data: [50], label: 'Weight' },
      ]);
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('skips plotting when graph response is not 200', async () => {
      doctor.getCancerVitalsDetails.and.returnValue(of({ statusCode: 500 }));
      await setup({ ben: { genderName: 'Male', beneficiaryRegID: 3 } });
      expect(component.female).toBeUndefined();
      expect(component.weightChartData).toEqual([]);
    });

    it('fetches diagnosis in view mode when doctorFlag is 9', async () => {
      doctor.getCancerVitalsDetails.and.returnValue(of({ statusCode: 500 }));
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { diagnosis: { remarks: 'seen' } } })
      );
      await setup({
        ben,
        mode: 'view',
        sessionData: {
          beneficiaryRegID: 3,
          visitID: 4,
          visitCategory: 'Cancer Screening',
          doctorFlag: '9',
        },
      });
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        3,
        4,
        'Cancer Screening'
      );
      expect(component.diagnosisForm.value.remarks).toBe('seen');
    });

    it('does not fetch diagnosis in view mode for other doctor flags', async () => {
      doctor.getCancerVitalsDetails.and.returnValue(of({ statusCode: 500 }));
      await setup({ ben, mode: 'view', sessionData: { doctorFlag: '1' } });
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });
  });
});
