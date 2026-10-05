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
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';

import { WorkareaComponent } from './workarea.component';
import { DataSyncService } from '../shared/service/data-sync.service';
import { DataSyncUtils } from '../shared/utility/data-sync-utility';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  autoSpy,
  commonTestProviders,
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  throwingObs,
} from 'src/testing/test-utils';

describe('DataSync WorkareaComponent', () => {
  let fixture: ComponentFixture<WorkareaComponent>;
  let component: WorkareaComponent;
  let dataSync: any;
  let confirmation: any;
  let session: any;
  let router: Router;

  const groups = () => [
    { syncTableGroupID: 1, syncTableGroupName: 'A' },
    { syncTableGroupID: 2, syncTableGroupName: 'B' },
  ];

  async function create(sessionSeed: Record<string, any>) {
    dataSync = autoSpy(DataSyncService);
    dataSync.getDataSYNCGroup.and.returnValue(
      of({ statusCode: 200, data: groups() })
    );
    await TestBed.configureTestingModule({
      // MatSelectModule supplies the value accessor for formControlName="benID_Range"
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule],
      declarations: [WorkareaComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: DataSyncService, useValue: dataSync },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  }

  describe('without a server key', () => {
    beforeEach(async () => create({}));

    it('redirects to the sync login', () => {
      expect(router.navigate).toHaveBeenCalledWith(['datasync/sync-login']);
      expect(dataSync.getDataSYNCGroup).not.toHaveBeenCalled();
      expect(component.generateBenIDForm.contains('benID_Range')).toBeTrue();
    });
  });

  describe('with a server key', () => {
    beforeEach(async () =>
      create({
        serverKey: 'k',
        serviceLineDetails: JSON.stringify({ vanID: 7 }),
        dataSyncProviderServiceMapID: 13,
      })
    );

    it('loads sync groups with sync flags reset', () => {
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.syncTableGroupList.length).toBe(2);
      expect(component.syncTableGroupList[0]).toEqual(
        jasmine.objectContaining({ benDetailSynced: false, visitSynced: false })
      );
    });

    it('ignores a non-200 group response', () => {
      component.syncTableGroupList = [];
      dataSync.getDataSYNCGroup.and.returnValue(of({ statusCode: 500 }));
      component.getDataSYNCGroup();
      expect(component.syncTableGroupList).toEqual([]);
    });

    it('ngOnDestroy removes the server key', () => {
      spyOn(Storage.prototype, 'removeItem');
      component.ngOnDestroy();
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('serverKey');
    });

    describe('syncDownloadData', () => {
      it('does nothing when not confirmed', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.syncDownloadData();
        expect(confirmation.confirm).toHaveBeenCalledWith(
          'info',
          'Confirm to download data'
        );
        expect(dataSync.syncDownloadData).not.toHaveBeenCalled();
      });

      it('alerts the error on a non-200 response', () => {
        dataSync.syncDownloadData.and.returnValue(
          of({ statusCode: 500, errorMessage: 'bad' })
        );
        component.syncDownloadData();
        expect(dataSync.syncDownloadData).toHaveBeenCalledWith({
          vanID: 7,
          providerServiceMapID: 13,
        });
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(component.showProgressBar).toBeFalse();
      });

      it('polls progress until 100% and lists failed masters', fakeAsync(() => {
        dataSync.syncDownloadData.and.returnValue(of({ statusCode: 200 }));
        dataSync.syncDownloadDataProgress.and.returnValues(
          of({ statusCode: 200, data: { percentage: 40 } }),
          of({
            statusCode: 200,
            data: { percentage: 100, failedMasters: 'm1|m2| ' },
          })
        );
        component.syncDownloadData();
        expect(component.showProgressBar).toBeTrue();
        expect(component.canDeactivate()).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith('Download in progress');

        tick(2000);
        expect(component.progressValue).toBe(40);
        expect(component.showProgressBar).toBeTrue();

        tick(2000);
        expect(component.progressValue).toBe(100);
        expect(component.failedMasterList).toEqual(['m1', 'm2']);
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'Master download finished'
        );
        expect(component.canDeactivate()).toBeTrue();

        tick(4000);
        expect(dataSync.syncDownloadDataProgress).toHaveBeenCalledTimes(2);
        discardPeriodicTasks();
      }));
    });

    describe('syncDownloadProgressStatus', () => {
      it('keeps the last failed master when it is not blank', () => {
        dataSync.syncDownloadDataProgress.and.returnValue(
          of({
            statusCode: 200,
            data: { percentage: 100, failedMasters: 'm1|m2' },
          })
        );
        component.syncDownloadProgressStatus();
        expect(component.failedMasterList).toEqual(['m1', 'm2']);
      });

      it('ignores responses without data', () => {
        dataSync.syncDownloadDataProgress.and.returnValue(
          of({ statusCode: 200 })
        );
        component.progressValue = 5;
        component.syncDownloadProgressStatus();
        expect(component.progressValue).toBe(5);
      });
    });

    describe('syncGroups', () => {
      it('updates statuses and alerts success', () => {
        dataSync.syncAllGroups.and.returnValue(
          of({
            statusCode: 200,
            data: {
              response: 'done',
              groupsProgress: [{ syncTableGroupID: 1, status: 'completed' }],
            },
          })
        );
        component.syncGroups();
        expect(component.syncTableGroupList[0].status).toBe('success');
        expect(component.syncTableGroupList[1].status).toBe('pending');
        expect(confirmation.alert).toHaveBeenCalledWith('done', 'success');
        expect(component.showTable).toBeTrue();
        expect(component.displaySyncBool).toBeFalse();
      });

      it('alerts success without progress info', () => {
        dataSync.syncAllGroups.and.returnValue(
          of({ statusCode: 200, data: { response: 'ok' } })
        );
        component.syncGroups();
        expect(component.syncTableGroupList[0].status).toBeUndefined();
        expect(confirmation.alert).toHaveBeenCalledWith('ok', 'success');
      });

      it('alerts an error and still updates statuses on failure', () => {
        dataSync.syncAllGroups.and.returnValue(
          of({
            statusCode: 500,
            data: {
              response: 'partial fail',
              groupsProgress: [
                { syncTableGroupID: 1, status: 'failed' },
                { syncTableGroupID: 2, status: 'partial' },
              ],
            },
          })
        );
        component.syncGroups();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'partial fail',
          'error'
        );
        expect(component.syncTableGroupList.map((g: any) => g.status)).toEqual([
          'failed',
          'partial',
        ]);
      });

      it('alerts an error without progress info', () => {
        dataSync.syncAllGroups.and.returnValue(
          of({ statusCode: 500, data: { response: 'nope' } })
        );
        component.syncGroups();
        expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
        expect(component.showTable).toBeTrue();
      });

      it('alerts the error message on HTTP failure', () => {
        dataSync.syncAllGroups.and.returnValue(
          throwingObs({ message: 'down' })
        );
        component.syncGroups();
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
        expect(component.showTable).toBeFalse();
      });

      it('falls back to a generic error message', () => {
        dataSync.syncAllGroups.and.returnValue(throwingObs({}));
        component.syncGroups();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'An error occurred',
          'error'
        );
      });
    });

    it('updateGroupStatus maps unknown statuses to pending', () => {
      component.updateGroupStatus([{ syncTableGroupID: 1, status: 'weird' }]);
      expect(component.syncTableGroupList[0].status).toBe('pending');
    });

    describe('checkBenIDAvailability', () => {
      it('stores the available count', () => {
        dataSync.checkBenIDAvailability.and.returnValue(
          of({ data: { response: 42 } })
        );
        component.checkBenIDAvailability();
        expect(component.benID_Count).toBe(42);
      });

      it('alerts when nothing is returned', () => {
        dataSync.checkBenIDAvailability.and.returnValue(of(null));
        component.checkBenIDAvailability();
        expect(confirmation.alert).toHaveBeenCalledWith(
          'No benID available. Generate benIDs'
        );
      });
    });

    describe('generateBenID', () => {
      it('refuses when more than 5000 benIDs are available', () => {
        component.benID_Count = 6000;
        component.generateBenID('10');
        expect(dataSync.generateBenIDs).not.toHaveBeenCalled();
        expect(confirmation.alert).toHaveBeenCalledWith(
          "Couldn't able to generate benIDs, count should be less than 5000"
        );
      });

      it('generates benIDs, refreshes the count and resets the range', () => {
        component.benID_Count = 10;
        component.generateBenIDForm.controls['benID_Range'].setValue('25');
        expect(component.benIDsRange).toBe('25');
        dataSync.checkBenIDAvailability.and.returnValue(
          of({ data: { response: 35 } })
        );
        component.generateBenID('25');
        expect(dataSync.generateBenIDs).toHaveBeenCalledWith({
          vanID: 7,
          benIDRequired: 25,
        });
        expect(component.benID_Count).toBe(35);
        expect(component.benIDsRange).toBeNull();
      });

      it('does nothing further on an empty response', () => {
        component.benID_Count = 10;
        dataSync.generateBenIDs.and.returnValue(of(null));
        component.generateBenID('5');
        expect(dataSync.checkBenIDAvailability).not.toHaveBeenCalled();
      });
    });

    describe('inventorySyncDataDownload', () => {
      it('requests the download for the van and alerts on failure', () => {
        dataSync.inventorySyncDownloadData.and.returnValue(
          of({ statusCode: 500, errorMessage: 'inv fail' })
        );
        component.inventorySyncDataDownload();
        expect(dataSync.inventorySyncDownloadData).toHaveBeenCalledWith({
          vanID: 7,
        });
        expect(confirmation.alert).toHaveBeenCalledWith('inv fail', 'error');
      });

      it('does not alert on success', () => {
        dataSync.inventorySyncDownloadData.and.returnValue(
          of({ statusCode: 200 })
        );
        component.inventorySyncDataDownload();
        expect(confirmation.alert).not.toHaveBeenCalled();
      });

      it('does nothing when not confirmed', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.inventorySyncDataDownload();
        expect(dataSync.inventorySyncDownloadData).not.toHaveBeenCalled();
      });

      it('sends an undefined vanID when no service line is stored', () => {
        session.store.delete('serviceLineDetails');
        component.inventorySyncDataDownload();
        expect(dataSync.inventorySyncDownloadData).toHaveBeenCalledWith({
          vanID: undefined,
        });
      });
    });
  });

  it('DataSyncUtils builds the wrapper form', () => {
    const form = new DataSyncUtils(new FormBuilder()).GenerateBenIDsForm();
    expect(form.get('generateBenIDForm.benID_Range')).toBeTruthy();
  });
});
