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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { DataSyncService } from './../shared/service/data-sync.service';
import { WorkareaComponent } from './workarea.component';

describe('WorkareaComponent', () => {
  let component: WorkareaComponent;
  let fixture: ComponentFixture<WorkareaComponent>;
  let dataSyncService: jasmine.SpyObj<DataSyncService>;
  let confirmationService: jasmine.SpyObj<ConfirmationService>;

  const syncResponse = (data: any) => ({
    data,
    statusCode: 200,
    errorMessage: 'Success',
    status: 'Success',
  });

  beforeEach(async () => {
    dataSyncService = jasmine.createSpyObj('DataSyncService', [
      'syncDiagnosticDocuments',
      'getDataSYNCGroup',
    ]);
    dataSyncService.getDataSYNCGroup.and.returnValue(of({ data: [] }) as any);
    confirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);

    await TestBed.configureTestingModule({
      declarations: [WorkareaComponent],
      providers: [
        FormBuilder,
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
        { provide: DataSyncService, useValue: dataSyncService },
        { provide: ConfirmationService, useValue: confirmationService },
        {
          provide: HttpServiceService,
          useValue: { currentLangugae$: new BehaviorSubject<any>({}) },
        },
        {
          provide: SessionStorageService,
          useValue: { getItem: () => null, setItem: () => undefined },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('startDocumentSync', () => {
    it('shows one popup without "see details below" when every document fails', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of(
          syncResponse({
            response: 'Data sync completed with failures',
            status: 'failed',
            totalRecords: 3,
            successfulRecords: 0,
            failedRecords: 3,
            failureReasons: [
              'documentId 28: sha256 mismatch on receipt',
              'documentId 29: sha256 mismatch on receipt',
              'documentId 30: sha256 mismatch on receipt',
            ],
          })
        ) as any
      );

      component.startDocumentSync();

      expect(confirmationService.alert).toHaveBeenCalledTimes(1);
      const [message, type] = confirmationService.alert.calls.mostRecent().args;
      expect(type).toBe('error');
      expect(message).toBe(
        'Data sync completed with failures. 3 of 3 documents not uploaded.'
      );
      expect(message).not.toMatch(/below/i);
      expect(component.documentSyncInProgress).toBeFalse();
      expect(component.documentSyncResult?.documents).toEqual([
        {
          documentId: '28',
          name: 'Document ID: 28',
          uploaded: false,
          reason: 'sha256 mismatch on receipt',
        },
        {
          documentId: '29',
          name: 'Document ID: 29',
          uploaded: false,
          reason: 'sha256 mismatch on receipt',
        },
        {
          documentId: '30',
          name: 'Document ID: 30',
          uploaded: false,
          reason: 'sha256 mismatch on receipt',
        },
      ]);
      expect(component.documentSyncResult?.unlistedUploaded).toBe(0);
    });

    it('labels server-listed documents by documentId, ignoring file names for now', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of(
          syncResponse({
            response: 'Data sync completed with failures',
            status: 'partial',
            totalRecords: 2,
            successfulRecords: 1,
            failedRecords: 1,
            documents: [
              { documentId: 28, documentName: 'xray.pdf', status: 'uploaded' },
              {
                documentId: 29,
                fileName: 'cbc.jpg',
                status: 'FAILED',
                reason: 'sha256 mismatch on receipt',
              },
            ],
          })
        ) as any
      );

      component.startDocumentSync();

      expect(confirmationService.alert).toHaveBeenCalledOnceWith(
        'Data sync completed with failures. 1 of 2 documents uploaded, 1 not uploaded.',
        'warn'
      );
      expect(component.documentSyncResult?.documents).toEqual([
        {
          documentId: 28,
          name: 'Document ID: 28',
          uploaded: true,
          reason: null,
        },
        {
          documentId: 29,
          name: 'Document ID: 29',
          uploaded: false,
          reason: 'sha256 mismatch on receipt',
        },
      ]);
      expect(component.documentSyncResult?.unlistedUploaded).toBe(0);
    });

    it('counts uploaded documents the server did not list individually', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of(
          syncResponse({
            response: 'Data sync completed with failures',
            status: 'partial',
            totalRecords: 3,
            successfulRecords: 2,
            failedRecords: 1,
            failureReasons: ['documentId 30: sha256 mismatch on receipt'],
          })
        ) as any
      );

      component.startDocumentSync();

      expect(component.documentSyncResult?.documents.length).toBe(1);
      expect(component.documentSyncResult?.unlistedUploaded).toBe(2);
    });

    it('keeps a failure reason that has no documentId', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of(
          syncResponse({
            status: 'failed',
            totalRecords: 1,
            successfulRecords: 0,
            failedRecords: 1,
            failureReasons: ['Connection failed: timeout'],
          })
        ) as any
      );

      component.startDocumentSync();

      expect(component.documentSyncResult?.documents).toEqual([
        {
          documentId: null,
          name: 'Document ID: -',
          uploaded: false,
          reason: 'Connection failed: timeout',
        },
      ]);
    });

    it('shows a single success popup when all documents upload', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of(
          syncResponse({
            response: 'Data successfully synced',
            status: 'success',
            totalRecords: 2,
            successfulRecords: 2,
            failedRecords: 0,
          })
        ) as any
      );

      component.startDocumentSync();

      expect(confirmationService.alert).toHaveBeenCalledOnceWith(
        'Data successfully synced. 2 of 2 documents uploaded.',
        'success'
      );
      expect(component.documentSyncResult?.unlistedUploaded).toBe(2);
    });

    it('shows an info popup when nothing was pending', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of(syncResponse({ response: 'No documents to sync' })) as any
      );

      component.startDocumentSync();

      expect(confirmationService.alert).toHaveBeenCalledOnceWith(
        'No documents to sync',
        'info'
      );
      expect(component.documentSyncResult).toBeNull();
    });

    it('shows the error message when the call itself fails', () => {
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'Van database down' }) as any
      );
      component.startDocumentSync();
      expect(confirmationService.alert).toHaveBeenCalledOnceWith(
        'Van database down',
        'error'
      );

      confirmationService.alert.calls.reset();
      dataSyncService.syncDiagnosticDocuments.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );
      component.startDocumentSync();
      expect(confirmationService.alert).toHaveBeenCalledOnceWith(
        'Network error',
        'error'
      );
      expect(component.documentSyncInProgress).toBeFalse();
    });
  });
});
