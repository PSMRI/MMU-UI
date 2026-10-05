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

import { InventoryService } from './inventory.service';
import { ConfirmationService } from './confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockSessionStorageService: jasmine.SpyObj<SessionStorageService>;
  let mockDocument: any;

  beforeEach(() => {
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', [
      'alert',
    ]);
    mockSessionStorageService = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
    ]);
    mockDocument = {
      location: {
        protocol: 'https:',
        host: 'localhost:4202',
        pathname: '/mmuui-v1.0/',
      },
    };

    // Constructed directly: overriding DOCUMENT in TestBed breaks Angular's
    // own DOM services (e.g. this._doc.querySelectorAll is not a function).
    service = new InventoryService(
      mockDocument,
      mockConfirmationService,
      mockSessionStorageService
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#getParentAPI', () => {
    it('should return environment.parentAPI', () => {
      expect(service.getParentAPI()).toBe(environment.parentAPI);
    });
  });

  describe('#getAuthKey', () => {
    it('should return key when isAuthenticated is set', () => {
      spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
        if (key === 'isAuthenticated') return 'true';
        if (key === 'key') return 'authKey123';
        return null;
      });
      expect(service.getAuthKey()).toBe('authKey123');
    });

    it('should return undefined when isAuthenticated is not set', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      expect(service.getAuthKey()).toBeUndefined();
    });

    it('should return undefined when isAuthenticated is falsy', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      expect(service.getAuthKey()).toBeUndefined();
    });
  });

  describe('#getFacilityID', () => {
    it('should return facilityID when it exists in session storage', () => {
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'facilityID') return 'facility123';
        return null;
      });
      expect(service.getFacilityID()).toBe('facility123');
    });

    it('should return undefined when facilityID is not in session storage', () => {
      mockSessionStorageService.getItem.and.returnValue(null);
      expect(service.getFacilityID()).toBeUndefined();
    });
  });

  describe('#getProtocol', () => {
    it('should return the document location protocol', () => {
      expect(service.getProtocol()).toBe('https:');
    });
  });

  describe('#getHost', () => {
    it('should return host + pathname', () => {
      expect(service.getHost()).toBe('localhost:4202/mmuui-v1.0/');
    });
  });

  describe('#getVanID', () => {
    it('should parse serviceLineDetails and return vanID', () => {
      const serviceLineDetails = JSON.stringify({
        vanID: 42,
        parkingPlaceID: 7,
      });
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return serviceLineDetails;
        return null;
      });
      expect(service.getVanID()).toBe(42);
    });
  });

  describe('#getppID', () => {
    it('should parse serviceLineDetails and return parkingPlaceID', () => {
      const serviceLineDetails = JSON.stringify({
        vanID: 42,
        parkingPlaceID: 7,
      });
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'serviceLineDetails') return serviceLineDetails;
        return null;
      });
      expect(service.getppID()).toBe(7);
    });
  });

  describe('#getServiceDetails', () => {
    it('should return serviceName from session storage', () => {
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'serviceName') return 'MMU';
        return null;
      });
      expect(service.getServiceDetails()).toBe('MMU');
    });

    it('should return null when serviceName is not set', () => {
      mockSessionStorageService.getItem.and.returnValue(null);
      expect(service.getServiceDetails()).toBeNull();
    });
  });

  describe('#moveToInventory', () => {
    let originalHref: string;

    beforeEach(() => {
      originalHref = window.location.href;
    });

    it('should call confirmationService.alert when authKey is missing', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'facilityID') return 'facility123';
        if (key === 'serviceLineDetails')
          return JSON.stringify({ vanID: 1, parkingPlaceID: 2 });
        if (key === 'serviceName') return 'MMU';
        return null;
      });

      service.moveToInventory('ben1', 'visit1', 'flow1', 'en', 'reg1');

      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No Facility mapped, Can not connect to Inventory',
        'error'
      );
    });

    it('should call confirmationService.alert when facilityID is missing', () => {
      spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
        if (key === 'isAuthenticated') return 'true';
        if (key === 'key') return 'authKey123';
        return null;
      });
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'facilityID') return null;
        if (key === 'serviceLineDetails')
          return JSON.stringify({ vanID: 1, parkingPlaceID: 2 });
        if (key === 'serviceName') return 'MMU';
        return null;
      });

      service.moveToInventory('ben1', 'visit1', 'flow1', 'en', 'reg1');

      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No Facility mapped, Can not connect to Inventory',
        'error'
      );
    });

    it('should construct inventory URL and set window.location.href when all data present', () => {
      spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
        if (key === 'isAuthenticated') return 'true';
        if (key === 'key') return 'authKey123';
        return null;
      });
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'facilityID') return 'facility123';
        if (key === 'serviceLineDetails')
          return JSON.stringify({ vanID: 1, parkingPlaceID: 2 });
        if (key === 'serviceName') return 'MMU';
        return null;
      });

      // Point the inventory URL at an in-page fragment so the real
      // window.location.href assignment cannot reload the Karma page.
      const originalUrl = environment.INVENTORY_URL;
      // Absolute same-document URL (a bare '#...' would resolve against <base href>).
      (environment as any).INVENTORY_URL =
        window.location.href.split('#')[0] + '#inventory-test?';
      try {
        service.moveToInventory('ben1', 'visit1', 'flow1', 'en', 'reg1');

        expect(service.inventoryUrl).toContain('#inventory-test?');
        expect(service.inventoryUrl).toContain('protocol=https:');
        expect(service.inventoryUrl).toContain('user=authKey123');
        expect(service.inventoryUrl).toContain('facility=facility123');
        expect(service.inventoryUrl).toContain('ben=ben1');
        expect(service.inventoryUrl).toContain('visit=visit1');
        expect(service.inventoryUrl).toContain('flow=flow1');
        expect(service.inventoryUrl).toContain('reg=reg1');
        expect(service.inventoryUrl).toContain('vanID=1');
        expect(service.inventoryUrl).toContain('ppID=2');
        expect(service.inventoryUrl).toContain('serviceName=MMU');
        expect(service.inventoryUrl).toContain('currentLanguage=en');
        expect(window.location.hash).toContain('#inventory-test');
        expect(mockConfirmationService.alert).not.toHaveBeenCalled();
      } finally {
        (environment as any).INVENTORY_URL = originalUrl;
        history.replaceState(null, '', originalHref);
      }
    });

    it('should show error alert when protocol is missing', () => {
      spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
        if (key === 'isAuthenticated') return 'true';
        if (key === 'key') return 'authKey123';
        return null;
      });
      mockSessionStorageService.getItem.and.callFake((key: string) => {
        if (key === 'facilityID') return 'facility123';
        if (key === 'serviceLineDetails')
          return JSON.stringify({ vanID: 1, parkingPlaceID: 2 });
        if (key === 'serviceName') return 'MMU';
        return null;
      });

      // Make protocol falsy
      mockDocument.location.protocol = '';

      service.moveToInventory('ben1', 'visit1', 'flow1', 'en', 'reg1');

      expect(mockConfirmationService.alert).toHaveBeenCalledWith(
        'No Facility mapped, Can not connect to Inventory',
        'error'
      );
    });
  });
});
