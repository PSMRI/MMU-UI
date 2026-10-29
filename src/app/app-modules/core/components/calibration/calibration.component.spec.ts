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
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { ConfirmationService } from '../../services';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { CalibrationComponent } from './calibration.component';

describe('CalibrationComponent', () => {
  let fixture: ComponentFixture<CalibrationComponent>;
  let component: CalibrationComponent;
  let master: any;
  let confirm: any;
  let ref: any;
  const strips = [
    { sno: 1, stripCode: 'AB12', expiryDate: '2000-01-01' },
    { sno: 2, stripCode: 'CD34', expiryDate: '2999-01-01' },
  ];

  const create = (response: any) => {
    master.fetchCalibrationStrips.and.returnValue(response);
    fixture = TestBed.createComponent(CalibrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    master = autoSpy(MasterdataService);
    await TestBed.configureTestingModule({
      declarations: [CalibrationComponent],
      providers: [
        ...commonTestProviders({ dialogData: { providerServiceMapID: 9 } }),
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CalibrationComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService);
    ref = TestBed.inject(MatDialogRef);
  });

  afterEach(() => fixture.destroy());

  it('loads strips for the provider on init', () => {
    create(of({ statusCode: 200, data: { calibrationData: strips } }));
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(master.fetchCalibrationStrips).toHaveBeenCalledWith(9, 0);
    expect(component.components.data).toEqual(strips);
    expect(component.dataList).toEqual(strips as any);
  });

  it('sets no-record message when list empty', () => {
    create(of({ statusCode: 200, data: { calibrationData: [] } }));
    expect(component.message).toBe(LANGUAGE_EN.common.noRecordFound);
    expect(component.components.data).toEqual([]);
  });

  it('sets no-record message when data missing', () => {
    create(of({ statusCode: 200, data: null }));
    expect(component.message).toBe(LANGUAGE_EN.common.noRecordFound);
  });

  it('resets data on non-200 status', () => {
    create(of({ statusCode: 5000 }));
    expect(component.components.data).toEqual([]);
    expect(component.message).toBe('');
  });

  it('resets data on error', () => {
    create(throwingObs());
    expect(component.components.data).toEqual([]);
  });

  describe('goToLink', () => {
    beforeEach(() =>
      create(of({ statusCode: 200, data: { calibrationData: strips } }))
    );

    it('warns about expired strip and closes on confirm', () => {
      component.goToLink(strips[0]);
      expect(confirm.confirmCalibration).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.coreComponents.selectedCalibrationStripIs
      );
      expect(ref.close).toHaveBeenCalledWith('AB12');
    });

    it('does not close expired strip when declined', () => {
      confirm.confirmCalibration.and.returnValue(of(false));
      component.goToLink(strips[0]);
      expect(ref.close).not.toHaveBeenCalled();
    });

    it('asks to proceed for valid strip and closes on confirm', () => {
      component.goToLink(strips[1]);
      expect(confirm.confirmCalibration).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.coreComponents
          .doYouWantToProceedWithSelectedCalibrationStrip
      );
      expect(ref.close).toHaveBeenCalledWith('CD34');
    });

    it('treats a strip without expiry as valid; declined keeps dialog open', () => {
      confirm.confirmCalibration.and.returnValue(of(false));
      component.goToLink({ stripCode: 'X' });
      expect(confirm.confirmCalibration).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.coreComponents
          .doYouWantToProceedWithSelectedCalibrationStrip
      );
      expect(ref.close).not.toHaveBeenCalled();
    });

    it('close() closes with null', () => {
      component.close();
      expect(ref.close).toHaveBeenCalledWith(null);
    });
  });

  describe('filterPreviousData', () => {
    beforeEach(() =>
      create(of({ statusCode: 200, data: { calibrationData: strips } }))
    );

    it('restores the full list for an empty term', () => {
      component.components.data = [];
      component.filterPreviousData('');
      expect(component.components.data).toEqual(strips);
    });

    it('filters case-insensitively across all fields', () => {
      component.filterPreviousData('cd3');
      expect(component.components.data).toEqual([strips[1]]);
    });

    it('matches each item only once', () => {
      component.filterPreviousData('01-01');
      expect(component.components.data.length).toBe(2);
    });

    it('returns no items when nothing matches', () => {
      component.filterPreviousData('zzz');
      expect(component.components.data).toEqual([]);
    });
  });

  it('ngDoCheck refreshes the language', () => {
    create(of({ statusCode: 200, data: { calibrationData: strips } }));
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
