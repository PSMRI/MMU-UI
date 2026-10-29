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
import { DoctorService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { OpenPreviousVisitDetailsComponent } from './open-previous-visit-details.component';

describe('OpenPreviousVisitDetailsComponent', () => {
  let fixture: ComponentFixture<OpenPreviousVisitDetailsComponent>;
  let component: OpenPreviousVisitDetailsComponent;
  let doctor: any;
  let confirm: any;
  const visits = [
    {
      VisitCategory: 'General OPD',
      benFlowID: 1,
      beneficiaryRegID: 11,
      visitCode: 101,
    },
    {
      VisitCategory: 'ANC',
      benFlowID: 2,
      beneficiaryRegID: 11,
      visitCode: null,
    },
    {
      VisitCategory: 'NCD care',
      benFlowID: 3,
      beneficiaryRegID: 11,
      visitCode: 103,
    },
  ];

  const create = (history: any) => {
    doctor.getMMUHistory.and.returnValue(history);
    fixture = TestBed.createComponent(OpenPreviousVisitDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      declarations: [OpenPreviousVisitDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(OpenPreviousVisitDetailsComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService);
  });

  afterEach(() => fixture.destroy());

  it('loads history and fetches casesheet for visits with a visit code', () => {
    doctor.getMMUCasesheetData.and.callFake((req: any) =>
      of({ statusCode: 200, data: { code: req.visitCode } })
    );
    create(of({ statusCode: 200, data: visits.map(v => ({ ...v })) }));
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(doctor.getMMUCasesheetData).toHaveBeenCalledTimes(2);
    expect(doctor.getMMUCasesheetData).toHaveBeenCalledWith({
      VisitCategory: 'General OPD',
      benFlowID: 1,
      beneficiaryRegID: 11,
      visitCode: 101,
    });
    expect(component.previousVisitData[0].benPreviousData).toEqual({
      code: 101,
    });
    expect(component.previousVisitData[1].benPreviousData).toBeUndefined();
    expect(component.filteredHistory).toEqual({ code: 103 });
    expect(component.previousHistoryPagedList.length).toBe(3);
  });

  it('ignores casesheet responses that are not 200 or have null data', () => {
    doctor.getMMUCasesheetData.and.returnValues(
      of({ statusCode: 500, data: {} }),
      of({ statusCode: 200, data: null })
    );
    create(of({ statusCode: 200, data: visits.map(v => ({ ...v })) }));
    expect(component.previousVisitData[0].benPreviousData).toBeUndefined();
    expect(component.previousVisitData[2].benPreviousData).toBeUndefined();
    expect(component.filteredHistory).toEqual([]);
  });

  it('alerts when history status is not 200', () => {
    create(of({ statusCode: 5000 }));
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.unableToLoadData,
      'error'
    );
    expect(component.previousVisitData).toEqual([]);
  });

  it('alerts when history request errors', () => {
    create(throwingObs());
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.unableToLoadData,
      'error'
    );
  });

  it('pages at most 5 visits', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      VisitCategory: 'V' + i,
    }));
    create(of({ statusCode: 200, data: many }));
    expect(component.previousHistoryPagedList).toEqual(many.slice(0, 5));
  });

  describe('filterHistory', () => {
    beforeEach(() =>
      create(of({ statusCode: 200, data: visits.map(v => ({ ...v })) }))
    );

    it('returns all visits for empty term and resets the page', () => {
      component.previousHistoryActivePage = 3;
      component.filterHistory();
      expect(component.filteredHistory).toBe(component.previousVisitData);
      expect(component.previousHistoryActivePage).toBe(1);
    });

    it('filters on visit category case-insensitively', () => {
      component.filterHistory('ncd');
      expect(
        component.filteredHistory.map((v: any) => v.VisitCategory)
      ).toEqual(['NCD care']);
    });

    it('re-appends visits to the paged list on every call (current behaviour)', () => {
      const before = component.previousHistoryPagedList.length;
      component.filterHistory('anc');
      expect(component.previousHistoryPagedList.length).toBe(before + 3);
    });
  });
});
