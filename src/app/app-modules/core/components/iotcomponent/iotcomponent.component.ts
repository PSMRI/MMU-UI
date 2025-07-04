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

import { Component, OnInit, Inject, DoCheck } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ConfirmationService } from '../../services';
import { HttpServiceService } from '../../services/http-service.service';
import { IotService } from '../../services/iot.service';
import { SetLanguageComponent } from '../set-language.component';
import { CalibrationComponent } from '../calibration/calibration.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-iotcomponent',
  templateUrl: './iotcomponent.component.html',
  styleUrls: ['./iotcomponent.component.css'],
})
export class IotcomponentComponent implements OnInit, DoCheck {
  errorMsg: any;
  progressMsg: any;
  statuscall: any;
  startAPI: any;
  output: any;
  current_language_set: any;
  procedure: any;
  stripCode: any;
  msgCalibration: boolean = false;
  startedCalibration: boolean = false;
  stoppedCalibration: boolean = false;
  statusCalibration: boolean = false;
  stripShowMsg: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public httpServiceService: HttpServiceService,
    public dialogRef: MatDialogRef<IotcomponentComponent>,
    public service: IotService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.msgCalibration = false;
    this.startedCalibration = false;
    this.stripShowMsg = false;
    this.statusCalibration = false;
    this.stoppedCalibration = false;
    this.errorMsg = undefined;
    console.log('input', this.input);
    this.startAPI = this.input['startAPI'];
    this.output = this.input['output'];
    this.procedure = this.input['procedure'];
    const providerServiceMapID =
      this.sessionstorage.getItem('providerServiceID');
    //SH20094090,calibration integration,09-06-2021
    if (
      this.procedure !== undefined &&
      this.procedure.value !== undefined &&
      this.procedure.value.calibrationStartAPI !== undefined &&
      this.procedure.value.calibrationStartAPI !== null
    ) {
      const dialogRef = this.dialog.open(CalibrationComponent, {
        width: '600px',
        disableClose: true,
        data: { providerServiceMapID: providerServiceMapID },
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('calibration', result);
        if (result !== null) {
          this.stripCode = result;
          this.msgCalibration = true;
          this.calibStart();
        } else if (result === null) this.dialogRef.close();
      });
    } else this.start();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  //SH20094090,calibration integration,09-06-2021
  calibStart() {
    try {
      this.service.startAPI(this.procedure.value.calibrationStartAPI).subscribe(
        (res: any) => {
          console.log('dfasdas', res);
          if (res.status === 202) {
            this.progressMsg = res['_body']['message'];
            this.startedCalibration = true;
            this.stripShowMsg = true;
          } else {
            this.errorMsg = res['message'];
          }
        },
        err => {
          if (typeof err['_body'] !== 'object') {
            this.errorMsg = err['_body']['message'];
          } else {
            this.errorMsg = 'Bluetooth Device is not running';
          }
        }
      );
    } catch (e) {
      this.errorMsg = 'Services are not functional';
    }
  }
  //SH20094090,calibration integration,09-06-2021
  getCalibStatus() {
    const statusAPI = this.procedure.value.calibrationStatusAPI.replace(
      '{cs_code}',
      this.stripCode
    );
    this.service.statusAPI(statusAPI).subscribe(
      (res: any) => {
        console.log('dfasdas', res);
        if (res.status === 202 || res.status === 200) {
          this.stripShowMsg = false;
          this.statusCalibration = true;
          this.progressMsg = res['_body']['message'];
          clearTimeout(this.statuscall);
          this.confirmationService
            .confirmCalibration(
              'success',
              this.current_language_set.calibrationTestSuccess
            )
            .subscribe(res => {
              if (res === true) {
                this.start();
              } else this.dialogRef.close();
            });
        } else if (res.status === 206) {
          this.stripShowMsg = false;
          this.statusCalibration = true;
          this.progressMsg = res['_body']['message'];
          this.statuscall = setTimeout(() => {
            this.getCalibStatus();
          }, 5000);
        } else {
          this.stripShowMsg = false;
          this.statusCalibration = true;
          clearTimeout(this.statuscall);
          this.errorMsg = res['message'];
        }
      },
      err => {
        this.stripShowMsg = false;
        this.statusCalibration = true;
        if (typeof err['_body'] !== 'object') {
          this.errorMsg = err['_body']['message'];
        } else {
          this.errorMsg = 'Bluetooth Device is not running';
        }
      }
    );
  }
  start() {
    this.msgCalibration = false;
    this.startedCalibration = false;
    this.stripShowMsg = false;
    this.statusCalibration = false;
    this.stoppedCalibration = false;
    this.progressMsg = undefined;
    try {
      this.service.startAPI(this.startAPI).subscribe(
        (res: any) => {
          console.log('dfasdas', res);
          if (res.status === 202) {
            this.progressMsg = res['_body']['message'];
            this.getstatus();
          } else {
            this.errorMsg = res['message'];
          }
        },
        err => {
          if (
            typeof err['_body'] !== 'object' &&
            err['message'] !== undefined
          ) {
            this.errorMsg = err['_body']['message'];
          } else {
            this.errorMsg = 'Bluetooth Device is not running';
          }
        }
      );
    } catch (e) {
      this.errorMsg = 'Services are not functional';
    }
  }

  getstatus() {
    this.service.statusAPI(this.startAPI + '/status').subscribe(
      (res: any) => {
        console.log('dfasdas', res);
        if (res.status === 200) {
          clearTimeout(this.statuscall);

          if (this.output === undefined) {
            this.dialogRef.close(res['_body']);
          } else {
            this.closeOperation(res['_body']);
          }
        } else if (res.status === 206) {
          this.progressMsg = res['_body']['message'];
          this.statuscall = setTimeout(() => {
            this.getstatus();
          }, 5000);
        } else {
          clearTimeout(this.statuscall);
          this.errorMsg = res['message'];
        }
      },
      err => {
        if (typeof err['_body'] !== 'object') {
          this.errorMsg = err['_body']['message'];
        } else {
          this.errorMsg = 'Bluetooth Device is not running';
        }
      }
    );
  }

  stop() {
    if (this.msgCalibration) this.calibStop();
    else {
      if (this.statuscall !== undefined) {
        clearTimeout(this.statuscall);
        this.service.endAPI(this.startAPI).subscribe((res: any) => {
          console.log('dfasdas', res);
          if (res.status === 202) {
            //do something
          } else {
            this.errorMsg = res['message'];
          }
        });
      }
      this.dialogRef.close();
    }
  }
  //SH20094090,calibration integration,09-06-2021
  calibStop() {
    if (this.statuscall !== undefined) {
      clearTimeout(this.statuscall);
      this.service
        .endCalibrationAPI(this.procedure.value.calibrationEndAPI)
        .subscribe(
          (res: any) => {
            console.log('dfasdas', res);
            if (res.status === 202 || res.status === 200) {
              //do something
              this.stoppedCalibration = true;
              this.dialogRef.close();
            } else {
              this.errorMsg = res['message'];
              this.dialogRef.close(this.errorMsg);
            }
          },
          err => {
            if (typeof err['_body'] !== 'object') {
              this.errorMsg = err['_body']['message'];
            } else {
              this.errorMsg = 'Bluetooth Device is not running';
            }
          }
        );
    } else {
      this.service
        .endCalibrationAPI(this.procedure.value.calibrationEndAPI)
        .subscribe(
          (res: any) => {
            console.log('dfasdas', res);
            if (res.status === 202 || res.status === 200) {
              //do something
              this.stoppedCalibration = true;
              this.dialogRef.close();
            } else {
              this.errorMsg = res['message'];
              this.dialogRef.close(this.errorMsg);
            }
          },
          err => {
            if (typeof err['_body'] !== 'object') {
              this.errorMsg = err['_body']['message'];
            } else {
              this.errorMsg = 'Bluetooth Device is not running';
            }
          }
        );
    }
    this.dialogRef.close();
  }
  closeOperation(input: any) {
    const result: any = [];
    this.output.forEach((element: any) => {
      result.push(input[element]);
    });
    this.dialogRef.close(result);
  }
}
