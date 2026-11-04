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
  Component,
  OnInit,
  Output,
  EventEmitter,
  DoCheck,
} from '@angular/core';
import { ZardDialogRef } from 'Common-UI/v2/ui/dialog';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import {
  NgIf,
  NgClass,
  NgFor,
  TitleCasePipe,
  NgTemplateOutlet,
} from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StringValidatorDirective } from '../../directives/stringValidator.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideInfo,
  lucideCircleCheck,
  lucideTriangleAlert,
  lucideCircleX,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardRadioComponent } from 'Common-UI/v2/ui/radio';
import { ZardRadioGroupComponent } from 'Common-UI/v2/ui/radio-group';

@Component({
  selector: 'app-common-dialog',
  standalone: true,
  templateUrl: './common-dialog.component.html',
  imports: [
    NgIf,
    NgClass,
    NgFor,
    TitleCasePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    FormsModule,
    StringValidatorDirective,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ZardRadioComponent,
    ZardRadioGroupComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideInfo,
      lucideCircleCheck,
      lucideTriangleAlert,
      lucideCircleX,
      lucideChevronRight,
    }),
  ],
})
export class CommonDialogComponent implements OnInit, DoCheck {
  @Output() cancelEvent = new EventEmitter();

  public title!: string;
  public message!: string;
  public status!: string;
  public btnOkText?: string;
  public btnCancelText?: string;
  public alert!: boolean;
  public confirmAlert!: boolean;
  public remarks!: boolean;
  public capture!: boolean;
  public editRemarks!: boolean;
  public comments!: string;
  public notify!: boolean;
  public mandatories: any;
  public alertError: any;

  // Choose from Radio Button
  public choice!: boolean;
  public values: any;
  public selectedValue: any;
  // Choose from Radio Button Ends

  // selectable

  public choiceSelect!: boolean;
  public options: any;
  public selectedOption: any;
  confirmcalibration!: boolean;
  current_language_set: any;
  confirmHealthID = false;
  alertFetsenseMessage: any;
  confirmCBAC: any;
  cbacData: any;
  confirmCareContext: any;

  constructor(
    public dialogRef: ZardDialogRef<CommonDialogComponent>,
    public httpServiceService: HttpServiceService
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  Confirm() {
    this.cancelEvent.emit(null);
  }

  statusIcon(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'success':
        return 'lucideCircleCheck';
      case 'warn':
      case 'warning':
        return 'lucideTriangleAlert';
      case 'error':
      case 'fail':
        return 'lucideCircleX';
      default:
        return 'lucideInfo';
    }
  }

  statusColor(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'success':
        return 'text-success';
      case 'warn':
      case 'warning':
        return 'text-warning';
      case 'error':
      case 'fail':
        return 'text-destructive';
      default:
        return 'text-info';
    }
  }

  sessionTimeout: any;
  minutes!: number;
  seconds!: number;
  timer!: number;

  intervalRef: any;

  updateTimer(timer: any) {
    this.timer = timer;

    if (timer && timer > 0) {
      this.intervalRef = setInterval(() => {
        if (timer === 0) {
          clearInterval(this.intervalRef);
          this.dialogRef.close({ action: 'timeout' });
        } else {
          this.minutes = timer / 60;
          this.seconds = timer % 60;
          timer--;
          this.timer = timer;
        }
      }, 1000);
    }
  }

  stopTimer() {
    clearInterval(this.intervalRef);
    this.dialogRef.close({ action: 'cancel', remainingTime: this.timer });
  }

  continueSession() {
    clearInterval(this.intervalRef);
    this.dialogRef.close({ action: 'continue' });
  }
}
