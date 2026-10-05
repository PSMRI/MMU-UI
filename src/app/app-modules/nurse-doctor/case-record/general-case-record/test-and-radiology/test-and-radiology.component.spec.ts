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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { DoctorService } from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../../shared/services/test-in-vitals.service';
import { ViewTestReportComponent } from './view-test-report/view-test-report.component';
import { TestAndRadiologyComponent } from './test-and-radiology.component';

describe('TestAndRadiologyComponent', () => {
  let component: TestAndRadiologyComponent;
  let fixture: ComponentFixture<TestAndRadiologyComponent>;
  let doctor: any;
  let lab: any;
  let idrs: any;
  let dialog: any;
  let vitals: TestInVitalsService;

  const labReport = (extra: any[] = []) => [
    {
      procedureID: 1,
      procedureName: environment.RBSTest,
      procedureType: 'Laboratory',
      componentList: [
        { stripsNotAvailable: true },
        { stripsNotAvailable: false },
      ],
    },
    {
      procedureID: 2,
      procedureName: 'Haemoglobin',
      procedureType: 'Laboratory',
      componentList: [],
    },
    { procedureID: 3, procedureName: 'X-Ray', procedureType: 'Radiology' },
    ...extra,
  ];
  const reportResponse = (list = labReport()) => ({
    statusCode: 200,
    data: {
      LabReport: list,
      ArchivedVisitcodeForLabResult: [{ visitCode: 9 }],
    },
  });

  const setup = async (visitCategory = 'NCD screening') => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TestAndRadiologyComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: 'B1', visitID: 'V1', visitCategory },
        }),
        TestInVitalsService,
        { provide: DoctorService, useValue: doctor },
        { provide: LabService, useValue: lab },
        { provide: IdrsscoreService, useValue: idrs },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(TestAndRadiologyComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(TestAndRadiologyComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    vitals = TestBed.inject(TestInVitalsService);
  };

  beforeEach(() => {
    doctor = autoSpy(DoctorService);
    lab = autoSpy(LabService);
    idrs = autoSpy(IdrsscoreService);
    doctor.getCaseRecordAndReferDetails.and.returnValue(of(reportResponse()));
    spyOn(console, 'log');
  });

  afterEach(() => component?.ngOnDestroy());

  describe('ngOnInit', () => {
    it('loads lab and radiology results and flags missing RBS strips (NCD screening)', async () => {
      await setup();
      component.ngOnInit();
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'B1',
        'V1',
        'NCD screening'
      );
      expect(component.labResults.length).toBe(2);
      expect(component.radiologyResults.map((r: any) => r.procedureID)).toEqual(
        [3]
      );
      expect(component.archivedResults).toEqual([{ visitCode: 9 }]);
      expect(component.filteredLabResults.data.length).toBe(2);
      expect(component.currentLabPagedList.length).toBe(2);
      expect(idrs.setReferralSuggested).toHaveBeenCalledTimes(1);
    });

    it('does not check strips outside NCD screening', async () => {
      await setup('General OPD');
      component.ngOnInit();
      expect(idrs.setReferralSuggested).not.toHaveBeenCalled();
      expect(component.labResults.length).toBe(2);
    });

    it('ignores failed responses', async () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500 })
      );
      await setup();
      component.ngOnInit();
      expect(component.labResults).toEqual([]);
    });

    it('prepends vitals RBS result when emitted', async () => {
      await setup();
      component.ngOnInit();
      vitals.setVitalsRBSValueInReports({
        visitCode: 1,
        rbsTestResult: 180,
        rbsTestRemarks: 'fasting',
        createdDate: 'd1',
      });
      expect(component.vitalsRBSResp.componentList[0].testResultValue).toBe(
        180
      );
      expect(component.labResults[0]).toBe(component.vitalsRBSResp);
      expect(component.labResults.length).toBe(3);
      expect(component.labResults[0].componentList[0].remarks).toBe('fasting');
    });

    it('ignores vitals emission without RBS result', async () => {
      await setup();
      component.ngOnInit();
      vitals.setVitalsRBSValueInReports({ visitCode: 1 });
      expect(component.vitalsRBSResp).toBeNull();
    });
  });

  it('ngDoCheck refreshes language', async () => {
    await setup();
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('checkRBSResultInVitalsUpdate', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
    });

    it('replaces existing vitals RBS entry with the new value', () => {
      component.labResults = [
        { procedureName: 'RBS Test', procedureID: null },
        { procedureName: 'Other', procedureID: 5 },
      ];
      vitals.setVitalsRBSValueInReportsInUpdate({
        rbsTestResult: 99,
        rbsTestRemarks: 'r',
        createdDate: 'd2',
      });
      expect(component.labResults.length).toBe(2);
      expect(component.labResults[0].componentList[0].testResultValue).toBe(99);
      expect(component.labResults[1].procedureID).toBe(5);
      expect(component.currentLabPagedList.length).toBe(2);
    });

    it('removes vitals RBS entry when no result', () => {
      component.labResults = [
        { procedureName: 'RBS Test', procedureID: null },
        { procedureName: 'Other', procedureID: 5 },
      ];
      component.checkRBSResultInVitalsUpdate({});
      expect(component.labResults).toEqual([
        { procedureName: 'Other', procedureID: 5 },
      ]);
      expect(component.filteredLabResults.data.length).toBe(1);
    });
  });

  describe('filtering and paging', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
    });

    it('filterProcedures filters by name and resets page', () => {
      component.currentLabActivePage = 3;
      component.filterProcedures('haem');
      expect(
        component.filteredLabResults.data.map((r: any) => r.procedureID)
      ).toEqual([2]);
      expect(component.currentLabActivePage).toBe(1);
      expect(component.currentLabPagedList.length).toBe(1);
      component.filterProcedures();
      expect(component.filteredLabResults.data.length).toBe(2);
    });

    it('currentLabPageChanged slices the page', () => {
      component.filteredLabResults.data = [1, 2, 3, 4, 5, 6, 7];
      component.currentLabPageChanged({ page: 2, itemsPerPage: 5 });
      expect(component.currentLabPagedList).toEqual([6, 7]);
    });
  });

  describe('archived results', () => {
    beforeEach(async () => {
      await setup();
    });

    it('loads archived lab/radiology reports', () => {
      doctor.getArchivedReports.and.returnValue(
        of({
          statusCode: 200,
          data: [
            { procedureName: 'Sugar', procedureType: 'Laboratory' },
            { procedureName: 'Urine', procedureType: 'Laboratory' },
            { procedureName: 'CT', procedureType: 'Radiology' },
          ],
        })
      );
      component.showArchivedTestResult({ visitCode: 'VC', date: 'D' });
      expect(doctor.getArchivedReports).toHaveBeenCalledWith({
        beneficiaryRegID: 'B1',
        visitCode: 'VC',
      });
      expect(component.archivedLabResults.length).toBe(2);
      expect(component.archivedRadiologyResults.length).toBe(1);
      expect(component.previousLabPagedList.length).toBe(2);
      expect(component.enableArchiveView).toBeTrue();
      expect(component.visitedDate).toBe('D');
      expect(component.visitCode).toBe('VC');

      component.filterArchivedProcedures('uri');
      expect(component.filteredArchivedLabResults).toEqual([
        { procedureName: 'Urine', procedureType: 'Laboratory' },
      ]);
      expect(component.previousLabActivePage).toBe(1);
      component.filterArchivedProcedures('');
      expect(component.filteredArchivedLabResults.length).toBe(2);

      component.resetArchived();
      expect(component.archivedLabResults).toEqual([]);
      expect(component.filteredArchivedLabResults).toEqual([]);
      expect(component.archivedRadiologyResults).toEqual([]);
      expect(component.visitCode).toBeNull();
      expect(component.visitedDate).toBeNull();
      expect(component.enableArchiveView).toBeFalse();
      expect(component.previousLabPagedList).toEqual([]);
    });

    it('ignores failed archived fetch', () => {
      doctor.getArchivedReports.and.returnValue(of({ statusCode: 500 }));
      component.showArchivedTestResult({ visitCode: 'VC' });
      expect(component.enableArchiveView).toBeFalse();
    });

    it('opens radiology report dialog', () => {
      const report = { id: 1 };
      component.showArchivedRadiologyTestResult(report);
      expect(dialog.open).toHaveBeenCalledWith(
        ViewTestReportComponent,
        jasmine.objectContaining({ data: report, panelClass: 'dialog-width' })
      );
    });
  });

  describe('showTestResult', () => {
    beforeEach(async () => {
      await setup();
    });

    it('opens uploaded-files dialog and downloads the chosen file', () => {
      dialog.open.and.returnValue(createDialogRefMock({ fileName: 'f.pdf' }));
      lab.viewFileContent.and.returnValue(of(new Blob(['x'])));
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:x');
      const click = spyOn(HTMLAnchorElement.prototype, 'click');
      component.showTestResult([1, 2]);
      expect(dialog.open).toHaveBeenCalledWith(
        ViewRadiologyUploadedFilesComponent,
        jasmine.objectContaining({
          width: '40%',
          data: jasmine.objectContaining({ filesDetails: [1, 2] }),
        })
      );
      expect(lab.viewFileContent).toHaveBeenCalledWith({ fileName: 'f.pdf' });
      expect(click).toHaveBeenCalled();
    });

    it('does nothing when dialog is dismissed', () => {
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.showTestResult([]);
      expect(lab.viewFileContent).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy unsubscribes test results', async () => {
    await setup();
    const s = jasmine.createSpyObj('s', ['unsubscribe']);
    component.testResultsSubscription = s;
    component.ngOnDestroy();
    expect(s.unsubscribe).toHaveBeenCalled();
    component.testResultsSubscription = null;
  });
});
