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
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { AllergenSearchComponent } from './allergen-search.component';

describe('AllergenSearchComponent', () => {
  let fixture: ComponentFixture<AllergenSearchComponent>;
  let component: AllergenSearchComponent;
  let master: any;
  let ref: any;
  const rows = [
    { conceptID: '1', term: 'Peanut' },
    { conceptID: '2', term: 'Pollen' },
  ];

  const create = async (term: string, response: any) => {
    master = autoSpy(MasterdataService);
    master.searchDiagnosisBasedOnPageNo1.and.returnValue(response);
    await TestBed.configureTestingModule({
      declarations: [AllergenSearchComponent],
      providers: [
        ...commonTestProviders({ dialogData: { searchTerm: term } }),
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AllergenSearchComponent, '')
      .compileComponents();
    ref = TestBed.inject(MatDialogRef);
    fixture = TestBed.createComponent(AllergenSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('searches the dialog term on init and fills the table', async () => {
    await create('pea', of({ statusCode: 200, data: { sctMaster: rows } }));
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(master.searchDiagnosisBasedOnPageNo1).toHaveBeenCalledWith('pea', 0);
    expect(component.components.data).toEqual(rows);
    expect(component.showProgressBar).toBeFalse();
  });

  it('does not search terms of 2 characters or less', async () => {
    await create('pe', of({ statusCode: 200 }));
    expect(master.searchDiagnosisBasedOnPageNo1).not.toHaveBeenCalled();
    expect(component.showProgressBar).toBeFalse();
  });

  it('sets no-record message when result empty', async () => {
    await create('xyz', of({ statusCode: 200, data: { sctMaster: [] } }));
    expect(component.message).toBe(LANGUAGE_EN.common.noRecordFound);
    expect(component.components.data).toEqual([]);
  });

  it('sets no-record message when data is null', async () => {
    await create('xyz', of({ statusCode: 200, data: null }));
    expect(component.message).toBe(LANGUAGE_EN.common.noRecordFound);
  });

  it('resets on non-200 status', async () => {
    await create('xyz', of({ statusCode: 5000 }));
    expect(component.components.data).toEqual([]);
    expect(component.showProgressBar).toBeFalse();
  });

  it('resets on error', async () => {
    await create('xyz', throwingObs());
    expect(component.components.data).toEqual([]);
    expect(component.showProgressBar).toBeFalse();
  });

  it('selectComponentName stores selection and submit closes with it', async () => {
    await create('pea', of({ statusCode: 200, data: { sctMaster: rows } }));
    component.selectComponentName('2', 'Pollen');
    expect(component.selectedComponentNo).toBe('2');
    expect(component.selectedComponent).toBe('Pollen');
    expect(component.selectedItem).toBe('Pollen');
    component.submitComponentList();
    expect(ref.close).toHaveBeenCalledWith({
      componentNo: '2',
      component: 'Pollen',
    });
  });

  it('ngDoCheck refreshes the language', async () => {
    await create('pe', of({}));
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
