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

import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DOCUMENT } from '@angular/common';
import { of } from 'rxjs';
import { CameraService } from './camera.service';
import { CameraDialogComponent } from '../components/camera-dialog/camera-dialog.component';

describe('CameraService', () => {
  let service: CameraService;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CameraDialogComponent>>;
  let mockComponentInstance: any;

  beforeEach(() => {
    mockComponentInstance = {
      capture: false,
      imageCode: false,
      annotate: false,
      current_language_set: null,
      availablePoints: null,
      graph: null,
    };

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of('result'));
    mockDialogRef.componentInstance = mockComponentInstance;

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockDialog.open.and.returnValue(mockDialogRef);

    TestBed.configureTestingModule({
      providers: [
        CameraService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    service = TestBed.inject(CameraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#capture', () => {
    it('should open dialog with CameraDialogComponent', () => {
      service.capture();
      expect(mockDialog.open).toHaveBeenCalledWith(
        CameraDialogComponent,
        jasmine.any(Object)
      );
    });

    it('should set capture to true on component instance', () => {
      service.capture();
      expect(mockComponentInstance.capture).toBe(true);
    });

    it('should set imageCode to false on component instance', () => {
      service.capture();
      expect(mockComponentInstance.imageCode).toBe(false);
    });

    it('should return the afterClosed observable', (done: DoneFn) => {
      service.capture().subscribe(result => {
        expect(result).toBe('result');
        done();
      });
    });

    it('should accept optional titleAlign parameter', () => {
      service.capture('left');
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should use center as default titleAlign', () => {
      service.capture();
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('#viewImage', () => {
    it('should open dialog with CameraDialogComponent', () => {
      service.viewImage('testCode');
      expect(mockDialog.open).toHaveBeenCalledWith(
        CameraDialogComponent,
        jasmine.any(Object)
      );
    });

    it('should set capture to false on component instance', () => {
      service.viewImage('testCode');
      expect(mockComponentInstance.capture).toBe(false);
    });

    it('should set imageCode to the provided benImageCode', () => {
      service.viewImage('imageCode123');
      expect(mockComponentInstance.imageCode).toBe('imageCode123');
    });

    it('should accept optional titleAlign parameter', () => {
      service.viewImage('testCode', 'left');
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should return void', () => {
      const result = service.viewImage('testCode');
      expect(result).toBeUndefined();
    });
  });

  describe('#annotate', () => {
    it('should open dialog with 80% width', () => {
      service.annotate('imageData', [], 'en');
      expect(mockDialog.open).toHaveBeenCalledWith(CameraDialogComponent, {
        width: '80%',
      });
    });

    it('should set capture to false', () => {
      service.annotate('imageData', [], 'en');
      expect(mockComponentInstance.capture).toBe(false);
    });

    it('should set imageCode to false', () => {
      service.annotate('imageData', [], 'en');
      expect(mockComponentInstance.imageCode).toBe(false);
    });

    it('should set annotate to the provided image', () => {
      service.annotate('base64image', [], 'en');
      expect(mockComponentInstance.annotate).toBe('base64image');
    });

    it('should set current_language_set to the provided language', () => {
      const langSet = { currentLanguage: 'English' };
      service.annotate('imageData', [], langSet);
      expect(mockComponentInstance.current_language_set).toBe(langSet);
    });

    it('should set availablePoints to the provided points', () => {
      const points = [{ x: 10, y: 20 }];
      service.annotate('imageData', points, 'en');
      expect(mockComponentInstance.availablePoints).toEqual(points);
    });

    it('should return the afterClosed observable', (done: DoneFn) => {
      service.annotate('imageData', [], 'en').subscribe(result => {
        expect(result).toBe('result');
        done();
      });
    });

    it('should accept optional titleAlign parameter', () => {
      service.annotate('imageData', [], 'en', 'left');
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('#ViewGraph', () => {
    it('should open dialog with 80% width', () => {
      service.ViewGraph({ data: 'graphData' });
      expect(mockDialog.open).toHaveBeenCalledWith(CameraDialogComponent, {
        width: '80%',
      });
    });

    it('should set capture to false', () => {
      service.ViewGraph({});
      expect(mockComponentInstance.capture).toBe(false);
    });

    it('should set imageCode to false', () => {
      service.ViewGraph({});
      expect(mockComponentInstance.imageCode).toBe(false);
    });

    it('should set annotate to false', () => {
      service.ViewGraph({});
      expect(mockComponentInstance.annotate).toBe(false);
    });

    it('should set availablePoints to false', () => {
      service.ViewGraph({});
      expect(mockComponentInstance.availablePoints).toBe(false);
    });

    it('should set graph to the provided graph data', () => {
      const graphData = { series: [1, 2, 3] };
      service.ViewGraph(graphData);
      expect(mockComponentInstance.graph).toBe(graphData);
    });

    it('should return void', () => {
      const result = service.ViewGraph({});
      expect(result).toBeUndefined();
    });
  });
});
