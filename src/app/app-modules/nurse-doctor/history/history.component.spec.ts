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
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService } from '../shared/services/doctor.service';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let doctor: any;
  let route: any;

  async function setup(
    attendant: string,
    response: any = { statusCode: 200, data: {} }
  ) {
    doctor = autoSpy(DoctorService);
    doctor.getGeneralHistoryDetails.and.returnValue(of(response));
    doctor.setCapturedHistoryByNurse.and.returnValue(undefined);
    route = { snapshot: { params: { attendant } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: '100', beneficiaryRegID: '200' },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    component.patientHistoryDataForm = new FormGroup({});
    component.visitCategory = 'General OPD';
    component.ngOnInit();
  }

  describe('as nurse', () => {
    beforeEach(async () => setup('nurse'));

    it('clears captured history and does not fetch it', () => {
      expect(component.attendant).toBe('nurse');
      expect(doctor.setCapturedHistoryByNurse).toHaveBeenCalledWith(null);
      expect(doctor.getGeneralHistoryDetails).not.toHaveBeenCalled();
      expect(component.showGeneralOPD).toBeTrue();
    });

    [
      'General OPD',
      'ANC',
      'NCD care',
      'PNC',
      'COVID-19 Screening',
      'NCD screening',
    ].forEach(cat =>
      it(`ngOnChanges shows general OPD tabs for ${cat}`, () => {
        component.visitCategory = cat;
        component.ngOnChanges();
        expect(component.showGeneralOPD).toBeTrue();
        expect(component.showCancer).toBeFalse();
      })
    );

    ['Cancer Screening', '', undefined as any].forEach(cat =>
      it(`shows cancer tabs for "${cat}"`, () => {
        component.visitCategory = cat;
        component.showHistoryTabs();
        expect(component.showCancer).toBeTrue();
        expect(component.showGeneralOPD).toBeFalse();
      })
    );
  });

  describe('as doctor', () => {
    it('fetches history with session ids and stores it on 200', async () => {
      const resp = { statusCode: 200, data: { x: 1 } };
      await setup('doctor', resp);
      const session = TestBed.inject(SessionStorageService) as any;
      expect(session.getItem).toHaveBeenCalledWith('visitID');
      expect(doctor.getGeneralHistoryDetails).toHaveBeenCalledWith(
        '200',
        '100'
      );
      expect(doctor.setCapturedHistoryByNurse).toHaveBeenCalledWith(resp);
    });

    it('does not store history on non-200', async () => {
      await setup('doctor', { statusCode: 5000 });
      expect(doctor.setCapturedHistoryByNurse.calls.allArgs()).toEqual([
        [null],
      ]);
    });
  });
});
