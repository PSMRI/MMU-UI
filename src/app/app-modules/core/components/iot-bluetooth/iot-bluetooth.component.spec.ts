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
import { of } from 'rxjs';
import { ConfirmationService } from '../../services';
import { IotService } from '../../services/iot.service';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { IotBluetoothComponent } from './iot-bluetooth.component';

describe('IotBluetoothComponent', () => {
  let fixture: ComponentFixture<IotBluetoothComponent>;
  let component: IotBluetoothComponent;
  let iot: any;
  const connectedBody = {
    deviceConnected: true,
    bloodPressureIntro: true,
    cholUaIntro: false,
    glucometerIntro: true,
    ecgIntro: false,
    hbIntro: true,
    pulseOxIntro: true,
    urtCam1Intro: false,
    bgbenecheck: true,
  };

  beforeEach(async () => {
    iot = autoSpy(IotService);
    iot.getDeviceStatus.and.returnValue(
      of({ _body: JSON.stringify({ deviceConnected: false }) })
    );
    await TestBed.configureTestingModule({
      declarations: [IotBluetoothComponent],
      providers: [
        ...commonTestProviders(),
        { provide: IotService, useValue: iot },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(IotBluetoothComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(IotBluetoothComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('on init reports API available but device not connected', () => {
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.apiAvailable).toBeTrue();
    expect(component.deviceConnected).toBeFalse();
    expect(component.spinner).toBeFalse();
    expect(component.infoDetails.length).toBe(10);
  });

  it('getDeviceStatus configures modules when connected', () => {
    iot.getDeviceStatus.and.returnValue(
      of({ _body: JSON.stringify(connectedBody) })
    );
    component.errMsg = 'x';
    component.getDeviceStatus();
    expect(iot.setBluetoothConnected).toHaveBeenCalledWith(true);
    expect(component.deviceConnected).toBeTrue();
    expect(component.errMsg).toBeUndefined();
    expect(component.infoDetails.slice(0, 8).map(i => i.status)).toEqual([
      true,
      false,
      true,
      false,
      true,
      true,
      false,
      true,
    ]);
  });

  it('getDeviceStatus error with non-object body means API available', () => {
    iot.getDeviceStatus.and.returnValue(throwingObs({ _body: 'x' }));
    component.getDeviceStatus();
    expect(component.apiAvailable).toBeTrue();
    expect(component.errMsg).toBeUndefined();
    expect(component.spinner).toBeFalse();
  });

  it('getDeviceStatus error with object body means device not running', () => {
    iot.getDeviceStatus.and.returnValue(throwingObs({ _body: {} }));
    component.getDeviceStatus();
    expect(component.apiAvailable).toBeFalse();
    expect(component.errMsg).toBe('IOT Device is not running');
  });

  it('getBluetoothDevice lists devices', () => {
    iot.getBluetoothDevice.and.returnValue(
      of({ _body: JSON.stringify(['dev1', 'dev2']) })
    );
    component.errMsg = 'x';
    component.getBluetoothDevice();
    expect(component.bluetoothDevices).toEqual(['dev1', 'dev2']);
    expect(component.errMsg).toBeUndefined();
    expect(component.spinner).toBeFalse();
  });

  it('getBluetoothDevice error stops spinner', () => {
    iot.getBluetoothDevice.and.returnValue(throwingObs());
    component.getBluetoothDevice();
    expect(component.spinner).toBeFalse();
    expect(component.bluetoothDevices).toBeUndefined();
  });

  it('connectBluetoothDevice configures the device', () => {
    iot.connectBluetoothDevice.and.returnValue(
      of({ _body: JSON.stringify(connectedBody) })
    );
    component.connectBluetoothDevice('dev1');
    expect(iot.connectBluetoothDevice).toHaveBeenCalledWith('dev1');
    expect(component.deviceConnected).toBeTrue();
    expect(component.spinner).toBeFalse();
  });

  it('connectBluetoothDevice error stops spinner', () => {
    iot.connectBluetoothDevice.and.returnValue(throwingObs());
    component.connectBluetoothDevice('d');
    expect(component.spinner).toBeFalse();
    expect(component.deviceConnected).toBeFalse();
  });

  it('disconnectBluetoothDevice on success marks disconnected', () => {
    component.deviceConnected = true;
    iot.disconnectBluetoothDevice.and.returnValue(of({ status: 200 }));
    component.disconnectBluetoothDevice();
    expect(iot.setBluetoothConnected).toHaveBeenCalledWith(false);
    expect(component.deviceConnected).toBeFalse();
    expect(component.spinner).toBeFalse();
  });

  it('disconnectBluetoothDevice on other status records message', () => {
    iot.disconnectBluetoothDevice.and.returnValue(
      of({ status: 500, message: 'busy' })
    );
    component.disconnectBluetoothDevice();
    expect(component.errMsg).toBe('busy');
  });

  it('disconnectBluetoothDevice on error alerts', () => {
    iot.disconnectBluetoothDevice.and.returnValue(throwingObs());
    component.disconnectBluetoothDevice();
    expect(component.spinner).toBeFalse();
    expect(TestBed.inject(ConfirmationService).alert).toHaveBeenCalledWith(
      'Unable to connect to bluetooth device',
      'error'
    );
  });

  it('pairDevice sets PC on success and R on failure', () => {
    const temp: any = { pairAPI: '/pair', pairStatus: 'NP' };
    iot.pairExternalDevice.and.returnValue(of({}));
    component.pairDevice(temp);
    expect(iot.pairExternalDevice).toHaveBeenCalledWith('/pair');
    expect(temp.pairStatus).toBe('PC');
    iot.pairExternalDevice.and.returnValue(throwingObs());
    component.pairDevice(temp);
    expect(temp.pairStatus).toBe('R');
  });

  it('ngDoCheck refreshes the language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
