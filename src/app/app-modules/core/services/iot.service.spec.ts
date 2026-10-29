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
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { IotService } from './iot.service';
import { environment } from 'src/environments/environment';

describe('IotService', () => {
  let service: IotService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IotService],
    });
    service = TestBed.inject(IotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('URL properties', () => {
    it('should set baseurl from environment', () => {
      expect(service.baseurl).toBe(environment.ioturl);
    });

    it('should set deviceStatusurl from environment', () => {
      expect(service.deviceStatusurl).toBe(environment.deviceStatusurl);
    });

    it('should set deviceBluetoothurl from environment', () => {
      expect(service.deviceBluetoothurl).toBe(environment.deviceBluetoothurl);
    });

    it('should set connectdeviceBluetoothurl from environment', () => {
      expect(service.connectdeviceBluetoothurl).toBe(
        environment.connectdeviceBluetoothurl
      );
    });

    it('should set disconnectdeviceBluetoothurl from environment', () => {
      expect(service.disconnectdeviceBluetoothurl).toBe(
        environment.deviceDisconnectUrl
      );
    });
  });

  describe('BehaviorSubject - disconnectValue', () => {
    it('should have initial disconnect value as false', () => {
      expect(service.disconnect).toBe(false);
    });

    it('should have disconnectValue$ observable', () => {
      expect(service.disconnectValue$).toBeDefined();
    });

    it('should emit initial value from disconnectValue$', (done: DoneFn) => {
      service.disconnectValue$.subscribe(val => {
        expect(val).toBe(false);
        done();
      });
    });
  });

  describe('#setBluetoothConnected', () => {
    it('should update disconnect property', () => {
      service.setBluetoothConnected(true);
      expect(service.disconnect).toBe(true);
    });

    it('should emit the new value through disconnectValue$', (done: DoneFn) => {
      let callCount = 0;
      service.disconnectValue$.subscribe(val => {
        callCount++;
        if (callCount === 2) {
          expect(val).toBe(true);
          done();
        }
      });
      service.setBluetoothConnected(true);
    });

    it('should update with false value', () => {
      service.setBluetoothConnected(true);
      service.setBluetoothConnected(false);
      expect(service.disconnect).toBe(false);
    });

    it('should accept any value type', (done: DoneFn) => {
      let callCount = 0;
      service.disconnectValue$.subscribe(val => {
        callCount++;
        if (callCount === 2) {
          expect(val).toBe('connected' as any);
          done();
        }
      });
      service.setBluetoothConnected('connected');
    });
  });

  describe('#startAPI', () => {
    it('should make a POST request with null body', () => {
      const input = '/api/v1/physical_tests/weight';
      const mockResponse = { status: 'started' };

      service.startAPI(input).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.baseurl + input);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('#statusAPI', () => {
    it('should make a GET request', () => {
      const input = '/api/v1/physical_tests/weight';
      const mockResponse = { status: 'running' };

      service.statusAPI(input).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.baseurl + input);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('#endAPI', () => {
    it('should make a PUT request with null body', () => {
      const input = '/api/v1/physical_tests/weight';
      const mockResponse = { status: 'ended' };

      service.endAPI(input).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.baseurl + input);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('#endCalibrationAPI', () => {
    it('should make a PUT request with headers in body', () => {
      const input = '/api/v1/calibration/end';
      const mockResponse = { status: 'calibration ended' };

      service.endCalibrationAPI(input).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.baseurl + input);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        headers: { 'Content-Type': ['application/json'] },
      });
      req.flush(mockResponse);
    });
  });

  describe('#getDeviceStatus', () => {
    it('should make a GET request to deviceStatusurl', () => {
      const mockResponse = { connected: true };

      service.getDeviceStatus().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.deviceStatusurl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('#getBluetoothDevice', () => {
    it('should make a GET request to deviceBluetoothurl', () => {
      const mockResponse = { devices: ['device1'] };

      service.getBluetoothDevice().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.deviceBluetoothurl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('#connectBluetoothDevice', () => {
    it('should make a POST request with device string in URL', () => {
      const deviceStr = 'device123';
      const mockResponse = { status: 'connected' };

      service.connectBluetoothDevice(deviceStr).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const expectedUrl = service.connectdeviceBluetoothurl + '/' + deviceStr;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('#disconnectBluetoothDevice', () => {
    it('should make a POST request with null body', () => {
      const mockResponse = { status: 'disconnected' };

      service.disconnectBluetoothDevice().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.disconnectdeviceBluetoothurl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('#pairExternalDevice', () => {
    it('should make a POST request with empty object body', () => {
      const url = '/api/v1/pair/device';
      const mockResponse = { paired: true };

      service.pairExternalDevice(url).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.baseurl + url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('HTTP error handling', () => {
    it('should handle error on startAPI', () => {
      const input = '/api/v1/test';

      service.startAPI(input).subscribe({
        error: error => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(service.baseurl + input);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle error on getDeviceStatus', () => {
      service.getDeviceStatus().subscribe({
        error: error => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(service.deviceStatusurl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
