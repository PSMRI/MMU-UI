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
import { MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from '../../services/http-service.service';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { CommonDialogComponent } from './common-dialog.component';

describe('CommonDialogComponent', () => {
  let fixture: ComponentFixture<CommonDialogComponent>;
  let component: CommonDialogComponent;
  let ref: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonDialogComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CommonDialogComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(CommonDialogComponent);
    component = fixture.componentInstance;
    ref = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('assigns the language on init and on ngDoCheck', () => {
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    const http: any = TestBed.inject(HttpServiceService);
    const lang = { x: 1 };
    http.appCurrentLanguge.next(lang);
    component.ngDoCheck();
    expect(component.current_language_set).toBe(lang);
  });

  it('Confirm emits cancelEvent with null', () => {
    const emitted: any[] = [];
    component.cancelEvent.subscribe(v => emitted.push(v));
    component.Confirm();
    expect(emitted).toEqual([null]);
  });

  it('updateTimer counts down and closes with timeout at zero', fakeAsync(() => {
    component.updateTimer(2);
    expect(component.timer).toBe(2);
    tick(1000);
    expect(component.minutes).toBe(2 / 60);
    expect(component.seconds).toBe(2);
    expect(component.timer).toBe(1);
    tick(1000);
    expect(component.timer).toBe(0);
    expect(ref.close).not.toHaveBeenCalled();
    tick(1000);
    expect(ref.close).toHaveBeenCalledWith({ action: 'timeout' });
    tick(3000);
    expect(ref.close).toHaveBeenCalledTimes(1);
  }));

  it('updateTimer does nothing for zero or missing timer', fakeAsync(() => {
    component.updateTimer(0);
    expect(component.intervalRef).toBeUndefined();
    component.updateTimer(undefined);
    expect(component.intervalRef).toBeUndefined();
    tick(2000);
    expect(ref.close).not.toHaveBeenCalled();
  }));

  it('stopTimer clears interval and closes with remaining time', fakeAsync(() => {
    component.updateTimer(10);
    tick(3000);
    component.stopTimer();
    expect(ref.close).toHaveBeenCalledWith({
      action: 'cancel',
      remainingTime: 7,
    });
    tick(5000);
    expect(component.timer).toBe(7);
  }));

  it('continueSession clears interval and closes with continue', fakeAsync(() => {
    component.updateTimer(5);
    tick(1000);
    component.continueSession();
    expect(ref.close).toHaveBeenCalledWith({ action: 'continue' });
    tick(2000);
    expect(component.timer).toBe(4);
    discardPeriodicTasks();
  }));
});
