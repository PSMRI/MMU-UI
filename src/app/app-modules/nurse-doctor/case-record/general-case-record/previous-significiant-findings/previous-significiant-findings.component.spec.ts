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
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { DoctorService } from '../../../shared/services';
import { PreviousSignificiantFindingsComponent } from './previous-significiant-findings.component';

describe('PreviousSignificiantFindingsComponent', () => {
  let component: PreviousSignificiantFindingsComponent;
  let fixture: ComponentFixture<PreviousSignificiantFindingsComponent>;
  let doctor: any;

  const findings = () => [
    { significantFindings: 'Hypertension', captureDate: '2024-01-01' },
    { significantFindings: 'Diabetes', captureDate: '2024-02-01' },
    { significantFindings: 'Asthma', captureDate: '2024-03-01' },
  ];

  const create = (resp: any) => {
    doctor.getPreviousSignificiantFindings.and.returnValue(of(resp));
    fixture = TestBed.createComponent(PreviousSignificiantFindingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PreviousSignificiantFindingsComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 77 } }),
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => fixture.destroy());

  it('loads findings for the beneficiary', () => {
    create({ statusCode: 200, data: { findings: findings() } });
    expect(doctor.getPreviousSignificiantFindings).toHaveBeenCalledWith({
      beneficiaryRegID: 77,
    });
    expect(component.previousSignificiantFindingsList.length).toBe(3);
    expect(component.filteredPreviousSignificiantFindingsList).toBe(
      component.previousSignificiantFindingsList
    );
    expect(component.dataSource.data.length).toBe(3);
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('keeps list empty when response has no findings', () => {
    create({ statusCode: 200, data: null });
    expect(component.previousSignificiantFindingsList).toEqual([]);
    expect(component.dataSource.data).toEqual([]);
  });

  it('keeps list empty on non-200', () => {
    create({ statusCode: 500, data: { findings: findings() } });
    expect(component.previousSignificiantFindingsList).toEqual([]);
  });

  it('filters findings by any field, case-insensitive', () => {
    create({ statusCode: 200, data: { findings: findings() } });
    component.filterPreviousSignificiantFindingsList('DIAB');
    expect(component.filteredPreviousSignificiantFindingsList).toEqual([
      findings()[1],
    ] as any);
    component.filterPreviousSignificiantFindingsList('2024-03');
    expect(component.filteredPreviousSignificiantFindingsList).toEqual([
      findings()[2],
    ] as any);
    // current behaviour: search empties the table data source
    expect(component.dataSource.data).toEqual([]);
  });

  it('restores full list for empty search term', () => {
    create({ statusCode: 200, data: { findings: findings() } });
    component.filterPreviousSignificiantFindingsList('asthma');
    component.filterPreviousSignificiantFindingsList('');
    expect(component.filteredPreviousSignificiantFindingsList.length).toBe(3);
  });

  it('pageChanged slices filtered list', () => {
    create({ statusCode: 200, data: { findings: findings() } });
    component.pageChanged({ page: 2, itemsPerPage: 2 });
    expect(component.pagedList).toEqual([findings()[2]] as any);
  });

  it('unsubscribes on destroy', () => {
    create({ statusCode: 200, data: null });
    const sub = component.previousSignificantFindingsSubs;
    spyOn(sub, 'unsubscribe').and.callThrough();
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
    component.previousSignificantFindingsSubs = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
