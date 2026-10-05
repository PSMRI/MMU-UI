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
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ViewTestReportComponent } from './view-test-report.component';

describe('ViewTestReportComponent', () => {
  let component: ViewTestReportComponent;
  let fixture: ComponentFixture<ViewTestReportComponent>;
  const report = [
    { procedureName: 'CBC', componentName: 'Hb', testResultValue: '12' },
    { procedureName: 'RBS', componentName: 'Glucose', testResultValue: '90' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ViewTestReportComponent],
      providers: [...commonTestProviders({ dialogData: report })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewTestReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads dialog data into the table and sets language', () => {
    expect(component.data).toBe(report);
    expect(component.dataSource.data).toEqual(report);
    expect(component.displayedColumns).toEqual([
      'procedureName',
      'componentName',
      'testresult',
      'unit',
    ]);
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('exposes the dialog ref for closing', () => {
    component.matDialogRef.close();
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
