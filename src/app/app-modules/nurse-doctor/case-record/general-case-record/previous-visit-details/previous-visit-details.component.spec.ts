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
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService } from '../../../shared/services';
import { CameraService } from '../../../../core/services/camera.service';
import { PreviousVisitDetailsComponent } from './previous-visit-details.component';

describe('PreviousVisitDetailsComponent', () => {
  let component: PreviousVisitDetailsComponent;
  let fixture: ComponentFixture<PreviousVisitDetailsComponent>;
  let doctor: any;
  let camera: any;
  let session: any;
  let router: Router;

  const graphData = () => ({
    bpList: [
      { date: '2024-01-01', avgSysBP: 120, avgDysBP: 80 },
      { date: '2024-03-01', avgSysBP: 140, avgDysBP: 90 },
      { date: '2024-02-01', avgSysBP: 0, avgDysBP: 85 },
    ],
    weightList: [
      { date: '2024-01-01', weight: 60 },
      { date: '2024-02-01', weight: 61 },
      { date: '2024-03-01' },
    ],
    bgList: [
      { date: '2024-01-01', bg_2hr_pp: 150, bg_fasting: 95, bg_random: 120 },
      { date: '2024-02-01', bg_2hr_pp: 160, bg_fasting: 99, bg_random: 130 },
      { date: '2024-03-01', bg_fasting: 99 },
    ],
  });

  const create = (resp: any) => {
    doctor.getCaseRecordAndReferDetails.and.returnValue(of(resp));
    fixture = TestBed.createComponent(PreviousVisitDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    camera = autoSpy(CameraService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PreviousVisitDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 1,
            visitID: 2,
            visitCategory: 'NCD care',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => fixture.destroy());

  it('loads graph data from case record and plots all graphs newest first', () => {
    create({ statusCode: 200, data: { GraphData: graphData() } });
    expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
      1,
      2,
      'NCD care'
    );
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.bpChartLabels).toEqual(['2024-03-01', '2024-01-01']);
    expect(component.bpChartData).toEqual([
      { data: [140, 120], label: 'Systolic BP' },
      { data: [90, 80], label: 'Diastolic BP' },
    ]);
    expect(component.weightChartData).toEqual([
      { data: [61, 60], label: 'Weight' },
    ]);
    expect(component.weightChartLabels).toEqual(['2024-02-01', '2024-01-01']);
    expect(component.bgChartLabels).toEqual(['2024-02-01', '2024-01-01']);
    expect(component.bgChartData).toEqual([
      { data: [160, 150], label: '2-Hr Post Prandial' },
      { data: [99, 95], label: 'Fasting' },
      { data: [130, 120], label: 'Random' },
    ]);
    expect(fixture.nativeElement.querySelectorAll('.no_records').length).toBe(
      0
    );
  });

  it('shows no-record placeholders when there is no graph data', () => {
    create({ statusCode: 200, data: {} });
    expect(component.bpChartData).toEqual([]);
    expect(component.weightChartData).toEqual([]);
    expect(component.bgChartData).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.no_records').length).toBe(
      3
    );
  });

  it('plots nothing for empty lists', () => {
    create({ statusCode: 200, data: {} });
    component.plotGraphs({ bpList: [], weightList: [], bgList: [] });
    expect(component.bpChartData).toEqual([]);
    expect(component.weightChartData).toEqual([]);
    expect(component.bgChartData).toEqual([]);
  });

  describe('after load', () => {
    beforeEach(() => create({ statusCode: 200, data: {} }));

    it('calculateBMI returns BMI or 0 without vitals', () => {
      expect(component.calculateBMI()).toBe(0);
      component.currentVitals = { weight_Kg: 81, height_cm: 180 };
      expect(component.calculateBMI()).toBe(25);
    });

    it('getCaseSheetPrintData stores visit and navigates to print', () => {
      component.getCaseSheetPrintData({
        createdDate: '2024-05-06T07:08:09.000Z',
        visitCategory: 'ANC',
        beneficiaryRegID: 3,
        benVisitID: 4,
      });
      expect(component.visitDateTime).toBe('2024-05-06T07:08:09.000Z');
      expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', '');
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'ANC'
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetBeneficiaryRegID',
        3
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 4);
      expect(router.navigate).toHaveBeenCalledWith(['/nurse-doctor/print']);
    });

    ['bw', 'bp', 'bg'].forEach(type => {
      it(`chartClicked('${type}') opens a graph with 7 properties`, () => {
        component.chartClicked(type);
        expect(camera.ViewGraph).toHaveBeenCalledTimes(1);
        const arg = camera.ViewGraph.calls.mostRecent().args[0];
        expect(arg.type).toBe(type);
        expect(Object.keys(arg).length).toBe(7);
        expect(arg.chartType).toBe('line');
        expect(arg.lineChartOptions).toBe(component.lineChartOptions);
      });
    });

    it('chartClicked ignores unknown types', () => {
      component.chartClicked('xx');
      expect(camera.ViewGraph).not.toHaveBeenCalled();
    });

    it('graph callers skip incomplete objects', () => {
      component.callBodyWeightGraph({});
      component.callBloodPressureGraph({ a: 1 });
      component.callBloodGlucoseGraph({ a: 1, b: 2 });
      expect(camera.ViewGraph).not.toHaveBeenCalled();
    });
  });
});
