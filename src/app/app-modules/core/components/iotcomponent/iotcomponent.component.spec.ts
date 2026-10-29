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
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmationService } from '../../services';
import { IotService } from '../../services/iot.service';
import { CalibrationComponent } from '../calibration/calibration.component';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { IotcomponentComponent } from './iotcomponent.component';

describe('IotcomponentComponent', () => {
  let fixture: ComponentFixture<IotcomponentComponent>;
  let component: IotcomponentComponent;
  let iot: any;
  let ref: any;
  let dialog: any;
  let confirm: any;
  let data: any;

  const calibProcedure = {
    value: {
      calibrationStartAPI: '/calib/start',
      calibrationStatusAPI: '/calib/{cs_code}/status',
      calibrationEndAPI: '/calib/end',
    },
  };

  const create = () => {
    fixture = TestBed.createComponent(IotcomponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    data = { startAPI: '/api/bp', output: undefined, procedure: undefined };
    iot = autoSpy(IotService, {}, { status: 500, message: 'nope' });
    await TestBed.configureTestingModule({
      declarations: [IotcomponentComponent],
      providers: [
        ...commonTestProviders({ session: { providerServiceID: 4 } }),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: IotService, useValue: iot },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(IotcomponentComponent, '')
      .compileComponents();
    ref = TestBed.inject(MatDialogRef);
    dialog = TestBed.inject(MatDialog);
    confirm = TestBed.inject(ConfirmationService);
  });

  afterEach(() => fixture?.destroy());

  describe('without calibration', () => {
    it('starts the device API on init and sets language', () => {
      create();
      expect(component.current_language_set).toBe(LANGUAGE_EN);
      expect(iot.startAPI).toHaveBeenCalledWith('/api/bp');
      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.errorMsg).toBe('nope');
    });

    it('polls status after 202 and closes with body when no output mapping', () => {
      iot.startAPI.and.returnValue(
        of({ status: 202, _body: { message: 'go' } })
      );
      iot.statusAPI.and.returnValue(of({ status: 200, _body: { sys: 120 } }));
      create();
      expect(component.progressMsg).toBe('go');
      expect(iot.statusAPI).toHaveBeenCalledWith('/api/bp/status');
      expect(ref.close).toHaveBeenCalledWith({ sys: 120 });
    });

    it('maps output keys when output list given', () => {
      data.output = ['sys', 'dia'];
      iot.startAPI.and.returnValue(
        of({ status: 202, _body: { message: 'go' } })
      );
      iot.statusAPI.and.returnValue(
        of({ status: 200, _body: { sys: 120, dia: 80, x: 1 } })
      );
      create();
      expect(ref.close).toHaveBeenCalledWith([120, 80]);
    });

    it('re-polls every 5s on 206 then stops on other status', fakeAsync(() => {
      iot.startAPI.and.returnValue(
        of({ status: 202, _body: { message: 'go' } })
      );
      iot.statusAPI.and.returnValues(
        of({ status: 206, _body: { message: 'measuring' } }),
        of({ status: 500, message: 'failed' })
      );
      create();
      expect(component.progressMsg).toBe('measuring');
      tick(5000);
      expect(iot.statusAPI).toHaveBeenCalledTimes(2);
      expect(component.errorMsg).toBe('failed');
    }));

    it('getstatus error with non-object body reads its message', () => {
      create();
      iot.statusAPI.and.returnValue(throwingObs({ _body: 'text' }));
      component.getstatus();
      expect(component.errorMsg).toBeUndefined();
    });

    it('getstatus error with object body reports device not running', () => {
      create();
      iot.statusAPI.and.returnValue(throwingObs({ _body: {} }));
      component.getstatus();
      expect(component.errorMsg).toBe('Bluetooth Device is not running');
    });

    it('start error with string body and message reads body message', () => {
      create();
      iot.startAPI.and.returnValue(throwingObs({ _body: 'x', message: 'm' }));
      component.errorMsg = 'old';
      component.start();
      expect(component.errorMsg).toBeUndefined();
    });

    it('start error without message reports device not running', () => {
      create();
      iot.startAPI.and.returnValue(throwingObs({ _body: 'x' }));
      component.start();
      expect(component.errorMsg).toBe('Bluetooth Device is not running');
    });

    it('start reports services not functional when service throws', () => {
      create();
      iot.startAPI.and.throwError('down');
      component.start();
      expect(component.errorMsg).toBe('Services are not functional');
    });

    it('stop without polling just closes', () => {
      create();
      component.stop();
      expect(iot.endAPI).not.toHaveBeenCalled();
      expect(ref.close).toHaveBeenCalledWith();
    });

    it('stop while polling ends the API and records errors', () => {
      create();
      component.statuscall = 1;
      component.stop();
      expect(iot.endAPI).toHaveBeenCalledWith('/api/bp');
      expect(component.errorMsg).toBe('nope');
      expect(ref.close).toHaveBeenCalled();
    });

    it('stop while polling with 202 keeps error untouched', () => {
      create();
      component.errorMsg = undefined;
      component.statuscall = 1;
      iot.endAPI.and.returnValue(of({ status: 202 }));
      component.stop();
      expect(component.errorMsg).toBeUndefined();
    });
  });

  describe('with calibration', () => {
    beforeEach(() => {
      data.procedure = calibProcedure;
    });

    const openWith = (result: any) =>
      dialog.open.and.returnValue(createDialogRefMock(result));

    it('opens calibration dialog and starts calibration with chosen strip', () => {
      openWith('STRIP1');
      iot.startAPI.and.returnValue(
        of({ status: 202, _body: { message: 'insert strip' } })
      );
      create();
      expect(dialog.open).toHaveBeenCalledWith(CalibrationComponent, {
        width: '600px',
        disableClose: true,
        data: { providerServiceMapID: 4 },
      });
      expect(component.stripCode).toBe('STRIP1');
      expect(component.msgCalibration).toBeTrue();
      expect(iot.startAPI).toHaveBeenCalledWith('/calib/start');
      expect(component.progressMsg).toBe('insert strip');
      expect(component.startedCalibration).toBeTrue();
      expect(component.stripShowMsg).toBeTrue();
    });

    it('closes when calibration dialog returns null', () => {
      openWith(null);
      create();
      expect(ref.close).toHaveBeenCalled();
      expect(iot.startAPI).not.toHaveBeenCalled();
    });

    it('does nothing when calibration dialog is dismissed with undefined', () => {
      openWith(undefined);
      create();
      expect(component.stripCode).toBeUndefined();
      expect(ref.close).not.toHaveBeenCalled();
    });

    it('calibStart records non-202 message', () => {
      openWith('S');
      create();
      expect(component.errorMsg).toBe('nope');
    });

    it('calibStart error handling', () => {
      openWith(undefined);
      create();
      iot.startAPI.and.returnValue(throwingObs({ _body: {} }));
      component.calibStart();
      expect(component.errorMsg).toBe('Bluetooth Device is not running');
      iot.startAPI.and.returnValue(throwingObs({ _body: 'x' }));
      component.calibStart();
      expect(component.errorMsg).toBeUndefined();
      iot.startAPI.and.throwError('x');
      component.calibStart();
      expect(component.errorMsg).toBe('Services are not functional');
    });

    describe('getCalibStatus', () => {
      beforeEach(() => {
        openWith(undefined);
        create();
        component.stripCode = 'S9';
      });

      it('on success asks to continue and starts measurement when confirmed', () => {
        iot.statusAPI.and.returnValue(
          of({ status: 200, _body: { message: 'ok' } })
        );
        const startSpy = spyOn(component, 'start');
        component.getCalibStatus();
        expect(iot.statusAPI).toHaveBeenCalledWith('/calib/S9/status');
        expect(component.statusCalibration).toBeTrue();
        expect(component.progressMsg).toBe('ok');
        expect(confirm.confirmCalibration).toHaveBeenCalledWith(
          'success',
          LANGUAGE_EN.calibrationTestSuccess
        );
        expect(startSpy).toHaveBeenCalled();
      });

      it('on 202 closes dialog when not confirmed', () => {
        iot.statusAPI.and.returnValue(
          of({ status: 202, _body: { message: 'ok' } })
        );
        confirm.confirmCalibration.and.returnValue(of(false));
        component.getCalibStatus();
        expect(ref.close).toHaveBeenCalled();
      });

      it('on 206 polls again after 5s', fakeAsync(() => {
        iot.statusAPI.and.returnValues(
          of({ status: 206, _body: { message: 'wait' } }),
          of({ status: 400, message: 'bad strip' })
        );
        component.getCalibStatus();
        expect(component.progressMsg).toBe('wait');
        tick(5000);
        expect(component.errorMsg).toBe('bad strip');
        expect(component.stripShowMsg).toBeFalse();
      }));

      it('handles errors', () => {
        iot.statusAPI.and.returnValue(throwingObs({ _body: {} }));
        component.getCalibStatus();
        expect(component.errorMsg).toBe('Bluetooth Device is not running');
        iot.statusAPI.and.returnValue(throwingObs({ _body: 'x' }));
        component.getCalibStatus();
        expect(component.errorMsg).toBeUndefined();
        expect(component.statusCalibration).toBeTrue();
      });
    });

    describe('calibStop', () => {
      beforeEach(() => {
        openWith(undefined);
        create();
        component.msgCalibration = true;
      });

      [undefined, 5].forEach(statuscall => {
        describe(`with statuscall=${statuscall}`, () => {
          beforeEach(() => (component.statuscall = statuscall));

          it('marks stopped on 200', () => {
            iot.endCalibrationAPI.and.returnValue(of({ status: 200 }));
            component.stop();
            expect(iot.endCalibrationAPI).toHaveBeenCalledWith('/calib/end');
            expect(component.stoppedCalibration).toBeTrue();
            expect(ref.close).toHaveBeenCalled();
          });

          it('closes with error message on failure status', () => {
            iot.endCalibrationAPI.and.returnValue(
              of({ status: 500, message: 'e' })
            );
            component.calibStop();
            expect(component.errorMsg).toBe('e');
            expect(ref.close).toHaveBeenCalledWith('e');
          });

          it('handles errors', () => {
            iot.endCalibrationAPI.and.returnValue(throwingObs({ _body: {} }));
            component.calibStop();
            expect(component.errorMsg).toBe('Bluetooth Device is not running');
            iot.endCalibrationAPI.and.returnValue(throwingObs({ _body: 'x' }));
            component.calibStop();
            expect(component.errorMsg).toBeUndefined();
          });
        });
      });
    });
  });

  it('ngDoCheck refreshes the language', () => {
    create();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
