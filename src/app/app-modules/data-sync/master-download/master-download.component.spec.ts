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

import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { MasterDownloadComponent } from './master-download.component';
import { DataSyncService } from '../shared/service/data-sync.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  autoSpy,
  commonTestProviders,
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  throwingObs,
} from 'src/testing/test-utils';

describe('MasterDownloadComponent', () => {
  let fixture: ComponentFixture<MasterDownloadComponent>;
  let component: MasterDownloadComponent;
  let dataSync: any;
  let confirmation: any;
  let dialogRef: any;

  beforeEach(async () => {
    dataSync = autoSpy(DataSyncService);
    dataSync.getVanDetailsForMasterDownload.and.returnValue(
      of({ statusCode: 200, data: { vanID: 5, vehicalNo: 'MH12' } })
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MasterDownloadComponent],
      providers: [
        ...commonTestProviders({
          session: { dataSyncProviderServiceMapID: 9 },
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(MasterDownloadComponent, {
        set: { providers: [{ provide: DataSyncService, useValue: dataSync }] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(MasterDownloadComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  describe('getVanDetails', () => {
    it('shows van details when both vanID and vehicle number exist', () => {
      expect(component.showVanDetails).toBeTrue();
      expect(component.vanID).toBe(5);
      expect(component.vehicalNo).toBe('MH12');
    });

    it('hides details when vehicle number is missing', () => {
      dataSync.getVanDetailsForMasterDownload.and.returnValue(
        of({ statusCode: 200, data: { vanID: 5 } })
      );
      component.getVanDetails();
      expect(component.showVanDetails).toBeFalse();
      expect(component.vanID).toBe(5);
    });

    it('hides details on a non-200 response', () => {
      dataSync.getVanDetailsForMasterDownload.and.returnValue(
        of({ statusCode: 500 })
      );
      component.getVanDetails();
      expect(component.showVanDetails).toBeFalse();
    });

    it('hides details on error', () => {
      dataSync.getVanDetailsForMasterDownload.and.returnValue(throwingObs());
      component.getVanDetails();
      expect(component.showVanDetails).toBeFalse();
    });
  });

  describe('syncDownloadData', () => {
    it('does nothing when not confirmed', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.syncDownloadData();
      expect(dataSync.syncDownloadData).not.toHaveBeenCalled();
    });

    it('alerts on a failed start', () => {
      dataSync.syncDownloadData.and.returnValue(
        of({ statusCode: 500, errorMessage: 'no' })
      );
      component.syncDownloadData();
      expect(dataSync.syncDownloadData).toHaveBeenCalledWith({
        vanID: 5,
        providerServiceMapID: 9,
      });
      expect(confirmation.alert).toHaveBeenCalledWith('no', 'error');
      expect(component.showProgressBar).toBeFalse();
    });

    it('polls progress until complete', fakeAsync(() => {
      dataSync.syncDownloadData.and.returnValue(of({ statusCode: 200 }));
      dataSync.syncDownloadDataProgress.and.returnValues(
        of({ statusCode: 200, data: { percentage: 50 } }),
        of({ statusCode: 200, data: { percentage: 100, failedMasters: 'x|' } })
      );
      component.syncDownloadData();
      expect(component.showProgressBar).toBeTrue();
      tick(2000);
      expect(component.progressValue).toBe(50);
      tick(2000);
      expect(component.failedMasterList).toEqual(['x']);
      expect(component.showProgressBar).toBeFalse();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Master download finished'
      );
      tick(4000);
      expect(dataSync.syncDownloadDataProgress).toHaveBeenCalledTimes(2);
      discardPeriodicTasks();
    }));
  });

  describe('syncDownloadProgressStatus', () => {
    it('keeps a non-blank last entry', () => {
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 200, data: { percentage: 100, failedMasters: 'a|b' } })
      );
      component.syncDownloadProgressStatus();
      expect(component.failedMasterList).toEqual(['a', 'b']);
    });

    it('stops and alerts on an error response', () => {
      component.showProgressBar = true;
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 500, errorMessage: 'broken' })
      );
      component.syncDownloadProgressStatus();
      expect(component.showProgressBar).toBeFalse();
      expect(confirmation.alert).toHaveBeenCalledWith('broken', 'error');
    });
  });

  it('closeDialog closes the dialog', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
