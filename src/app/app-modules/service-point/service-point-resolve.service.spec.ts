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
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { of, EMPTY } from 'rxjs';
import { ServicePointResolve } from './service-point-resolve.service';
import { ServicePointService } from './service-point.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('ServicePointResolve', () => {
  let service: ServicePointResolve;
  let mockServicePointService: jasmine.SpyObj<ServicePointService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;
  let mockRoute: ActivatedRouteSnapshot;

  beforeEach(() => {
    mockServicePointService = jasmine.createSpyObj('ServicePointService', [
      'getServicePoints',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);
    mockRoute = {} as ActivatedRouteSnapshot;

    TestBed.configureTestingModule({
      providers: [
        ServicePointResolve,
        { provide: ServicePointService, useValue: mockServicePointService },
        { provide: Router, useValue: mockRouter },
        {
          provide: SessionStorageService,
          useValue: mockSessionStorageService,
        },
      ],
    });
    service = TestBed.inject(ServicePointResolve);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#resolve', () => {
    it('should get providerServiceID from session storage', () => {
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(
        of({ data: [] })
      );

      service.resolve(mockRoute);

      expect(mockSessionStorageService.getItem).toHaveBeenCalledWith(
        'providerServiceID'
      );
    });

    it('should call getServicePoints with the providerServiceID', () => {
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(
        of({ data: [] })
      );

      service.resolve(mockRoute);

      expect(mockServicePointService.getServicePoints).toHaveBeenCalledWith(
        'provider123'
      );
    });

    it('should return the response when it is truthy', (done: DoneFn) => {
      const mockResponse = {
        data: [{ servicePointID: 1, servicePointName: 'SP1' }],
      };
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(
        of(mockResponse)
      );

      service.resolve(mockRoute).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should navigate to /service when response is falsy (null)', (done: DoneFn) => {
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(of(null as any));

      service.resolve(mockRoute).subscribe(result => {
        expect(result).toBeNull();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/service']);
        done();
      });
    });

    it('should navigate to /service when response is falsy (undefined)', (done: DoneFn) => {
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(
        of(undefined as any)
      );

      service.resolve(mockRoute).subscribe(result => {
        expect(result).toBeNull();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/service']);
        done();
      });
    });

    it('should navigate to /service when response is empty string', (done: DoneFn) => {
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(of('' as any));

      service.resolve(mockRoute).subscribe(result => {
        expect(result).toBeNull();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/service']);
        done();
      });
    });

    it('should not navigate when response is truthy', (done: DoneFn) => {
      const mockResponse = { data: 'test' };
      mockSessionStorageService.getItem.and.returnValue('provider123');
      mockServicePointService.getServicePoints.and.returnValue(
        of(mockResponse)
      );

      service.resolve(mockRoute).subscribe(() => {
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle null providerServiceID from session storage', () => {
      mockSessionStorageService.getItem.and.returnValue(null);
      mockServicePointService.getServicePoints.and.returnValue(
        of({ data: [] })
      );

      service.resolve(mockRoute).subscribe();

      expect(mockServicePointService.getServicePoints).toHaveBeenCalledWith(
        null as any
      );
    });

    it('should return response with service point data', (done: DoneFn) => {
      const mockResponse = {
        data: [
          {
            servicePointID: 1,
            servicePointName: 'Service Point 1',
            vanID: 100,
          },
          {
            servicePointID: 2,
            servicePointName: 'Service Point 2',
            vanID: 101,
          },
        ],
      };
      mockSessionStorageService.getItem.and.returnValue('providerXYZ');
      mockServicePointService.getServicePoints.and.returnValue(
        of(mockResponse)
      );

      service.resolve(mockRoute).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.data.length).toBe(2);
        done();
      });
    });
  });
});
