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
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService } from '../../shared/services';
import { CaseSheetComponent } from '../../case-sheet/case-sheet.component';
import { BeneficiaryMctsCallHistoryComponent } from '../beneficiary-mcts-call-history/beneficiary-mcts-call-history.component';
import { BeneficiaryPlatformHistoryComponent } from './beneficiary-platform-history.component';

describe('BeneficiaryPlatformHistoryComponent', () => {
  let component: BeneficiaryPlatformHistoryComponent;
  let fixture: ComponentFixture<BeneficiaryPlatformHistoryComponent>;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let router: Router;

  const services = () => [
    { serviceID: 1, serviceName: '1097' },
    { serviceID: 2, serviceName: 'MMU' },
    { serviceID: 3, serviceName: '104' },
    { serviceID: 4, serviceName: 'TM' },
    { serviceID: 5, serviceName: 'ECD' },
    { serviceID: 6, serviceName: 'MCTS' },
  ];

  const loaded = (id: number) =>
    component.serviceOnState.find((s: any) => s.serviceID === id).serviceLoaded;

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    doctor.getServiceOnState.and.returnValue(
      of({ statusCode: 200, data: services() })
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BeneficiaryPlatformHistoryComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(BeneficiaryPlatformHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads language and services except 1097/ECD', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.serviceOnState).toEqual([
      { serviceID: 2, serviceName: 'MMU', serviceLoaded: false },
      { serviceID: 3, serviceName: '104', serviceLoaded: false },
      { serviceID: 4, serviceName: 'TM', serviceLoaded: false },
      { serviceID: 6, serviceName: 'MCTS', serviceLoaded: false },
    ]);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps services empty on non-200 service response', () => {
    doctor.getServiceOnState.and.returnValue(of({ statusCode: 500 }));
    component.serviceOnState = [];
    component.getServiceOnState();
    expect(component.serviceOnState).toEqual([]);
  });

  it('getServiceHistory routes to the right loader', () => {
    spyOn(component, 'getMMUHistory');
    spyOn(component, 'get104History');
    spyOn(component, 'getTMHistory');
    spyOn(component, 'getMCTSHistory');
    component.getServiceHistory(2);
    component.getServiceHistory(3);
    component.getServiceHistory(4);
    component.getServiceHistory(6);
    component.getServiceHistory(9);
    expect(component.getMMUHistory).toHaveBeenCalledTimes(1);
    expect(component.get104History).toHaveBeenCalledTimes(1);
    expect(component.getTMHistory).toHaveBeenCalledTimes(1);
    expect(component.getMCTSHistory).toHaveBeenCalledTimes(1);
  });

  describe('MMU history', () => {
    const visits = () => [
      {
        visitCode: 11,
        VisitCategory: 'General OPD',
        benFlowID: 1,
        beneficiaryRegID: 2,
      },
      { visitCode: null, VisitCategory: 'ANC' },
    ];

    it('loads history and fetches casesheet per visit with code', () => {
      doctor.getMMUHistory.and.returnValue(
        of({ statusCode: 200, data: visits() })
      );
      doctor.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { nurseData: {} } })
      );
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeTrue();
      expect(loaded(2)).toBeTrue();
      expect(loaded(3)).toBeFalse();
      expect(doctor.getMMUCasesheetData).toHaveBeenCalledOnceWith({
        VisitCategory: 'General OPD',
        benFlowID: 1,
        beneficiaryRegID: 2,
        visitCode: 11,
      });
      expect(component.dataSource.data[0].benPreviousData).toEqual({
        nurseData: {},
      });
      expect(component.filteredMMUHistory).toEqual({ nurseData: {} });
      expect(component.previousMMUHistoryPagedList.length).toBe(2);
    });

    it('ignores casesheet responses with null data', () => {
      doctor.getMMUHistory.and.returnValue(
        of({ statusCode: 200, data: visits() })
      );
      doctor.getMMUCasesheetData.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.getMMUHistory();
      expect(component.dataSource.data[0].benPreviousData).toBeUndefined();
    });

    it('does nothing on non-200 history', () => {
      doctor.getMMUHistory.and.returnValue(of({ statusCode: 500 }));
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeFalse();
      expect(loaded(2)).toBeFalse();
    });

    it('filterMMUHistory without term resets to all data', () => {
      component.dataSource.data = visits();
      component.previousMMUHistoryActivePage = 3;
      component.filterMMUHistory('');
      expect(component.filteredMMUHistory.length).toBe(2);
      expect(component.previousMMUHistoryActivePage).toBe(1);
      expect(component.previousMMUHistoryPagedList.length).toBe(2);
    });

    it('filterMMUHistory with term filters by category', () => {
      component.dataSource.data = visits();
      component.filterMMUHistory('anc');
      expect(component.filteredMMUHistory.length).toBe(1);
      expect(component.filteredMMUHistory[0].VisitCategory).toBe('ANC');
    });

    it('previousMMUHistoryPageChanged slices current page', () => {
      component.dataSource.data = [1, 2, 3, 4, 5, 6, 7];
      component.previousMMUHistoryPageChanged({ page: 2, itemsPerPage: 5 });
      expect(component.previousMMUHistoryPagedList).toEqual([6, 7]);
    });
  });

  describe('TM history', () => {
    it('loads TM history and marks service loaded', () => {
      doctor.getTMHistory.and.returnValue(
        of({
          statusCode: 200,
          data: [{ VisitCategory: 'NCD' }, { VisitCategory: 'PNC' }],
        })
      );
      component.getTMHistory();
      expect(component.hideTMFetch).toBeTrue();
      expect(loaded(4)).toBeTrue();
      expect(component.filteredTMHistory.length).toBe(2);
      expect(component.previousTMHistoryPagedList.length).toBe(2);
    });

    it('ignores non-200 TM response', () => {
      doctor.getTMHistory.and.returnValue(of({ statusCode: 500 }));
      component.getTMHistory();
      expect(component.hideTMFetch).toBeFalse();
    });

    it('filterTMHistory filters and resets', () => {
      component.historyOfTM.data = [
        { VisitCategory: 'NCD' },
        { VisitCategory: 'PNC' },
      ];
      component.filterTMHistory('pn');
      expect(component.filteredTMHistory).toEqual([{ VisitCategory: 'PNC' }]);
      expect(component.previousTMHistoryPagedList).toEqual([
        { VisitCategory: 'PNC' },
      ] as any);
      component.filterTMHistory();
      expect(component.filteredTMHistory).toBe(component.historyOfTM.data);
      expect(component.previousTMHistoryActivePage).toBe(1);
    });
  });

  describe('MCTS history', () => {
    const calls = () => [
      { mctsOutboundCall: { displayOBCallType: 'ANC Call' } },
      { mctsOutboundCall: { displayOBCallType: 'PNC Call' } },
    ];

    it('loads MCTS history', () => {
      doctor.getMCTSHistory.and.returnValue(
        of({ statusCode: 200, data: calls() })
      );
      component.getMCTSHistory();
      expect(component.hideMCTSFetch).toBeTrue();
      expect(loaded(6)).toBeTrue();
      expect(component.previousMCTSHistoryPagedList.length).toBe(2);
    });

    it('ignores non-200 MCTS response', () => {
      doctor.getMCTSHistory.and.returnValue(of({ statusCode: 500 }));
      component.getMCTSHistory();
      expect(component.hideMCTSFetch).toBeFalse();
    });

    it('filterMCTSHistory filters by call type and resets', () => {
      component.historyOfMCTS.data = calls();
      component.filterMCTSHistory('anc');
      expect(component.filteredMCTSHistory.length).toBe(1);
      expect(
        component.filteredMCTSHistory[0].mctsOutboundCall.displayOBCallType
      ).toBe('ANC Call');
      component.filterMCTSHistory('');
      expect(component.filteredMCTSHistory).toBe(component.historyOfMCTS.data);
    });

    it('getPatientMCTSCallHistory opens call dialog on success', () => {
      doctor.getPatientMCTSCallHistory.and.returnValue(
        of({ statusCode: 200, data: [{ id: 1 }] })
      );
      component.getPatientMCTSCallHistory({ callDetailID: 44 });
      expect(doctor.getPatientMCTSCallHistory).toHaveBeenCalledWith({
        callDetailID: 44,
      });
      expect(dialog.open).toHaveBeenCalledWith(
        BeneficiaryMctsCallHistoryComponent,
        {
          width: '70%',
          panelClass: 'preview-casesheet',
          data: [{ id: 1 }],
        }
      );
    });

    it('getPatientMCTSCallHistory does not open dialog on failure', () => {
      doctor.getPatientMCTSCallHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPatientMCTSCallHistory({ callDetailID: 44 });
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('showCallDetails tolerates a truthy dialog result', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(true) });
      expect(() => component.showCallDetails({})).not.toThrow();
    });
  });

  describe('104 history', () => {
    it('loads 104 history', () => {
      doctor.get104History.and.returnValue(
        of({ statusCode: 200, data: [{ diseaseSummary: 'Fever' }] })
      );
      component.get104History();
      expect(component.hide104Fetch).toBeTrue();
      expect(loaded(3)).toBeTrue();
      expect(component.previous104HistoryPagedList.length).toBe(1);
    });

    it('ignores non-200 104 response', () => {
      doctor.get104History.and.returnValue(of({ statusCode: 500 }));
      component.get104History();
      expect(component.hide104Fetch).toBeFalse();
    });

    it('filter104History filters by disease summary and resets', () => {
      component.historyOf104.data = [
        { diseaseSummary: 'Fever' },
        { diseaseSummary: 'Cough' },
      ];
      component.filter104History('COU');
      expect(component.filtered104History).toEqual([
        { diseaseSummary: 'Cough' },
      ]);
      component.filter104History();
      expect(component.filtered104History).toBe(component.historyOf104.data);
    });
  });

  describe('getVisitDetails', () => {
    const visit = {
      visitCode: 1,
      benFlowID: 2,
      VisitCategory: 'ANC',
      beneficiaryRegID: 3,
      benVisitID: 4,
    };

    it('stores visit and opens preview dialog', () => {
      component.getVisitDetails('MMU', visit, false);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.viewCasesheet
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetVisitCode',
        1
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetBenFlowID',
        2
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetVisitCategory',
        'ANC'
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetBeneficiaryRegID',
        3
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetVisitID',
        4
      );
      expect(dialog.open).toHaveBeenCalledWith(CaseSheetComponent, {
        disableClose: true,
        width: '95%',
        panelClass: 'preview-casesheet',
        data: { previous: true, serviceType: 'MMU' },
      });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('navigates to print page when printing', () => {
      component.getVisitDetails('MMU', visit, true);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.printCasesheet
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/MMU/previous',
      ]);
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.getVisitDetails('TM', visit, true);
      expect(session.setItem).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
