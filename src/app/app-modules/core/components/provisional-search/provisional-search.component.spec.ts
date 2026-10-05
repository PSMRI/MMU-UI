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
import { MasterdataService } from '../../../nurse-doctor/shared/services/masterdata.service';
import { SpinnerService } from '../../services/spinner.service';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ProvisionalSearchComponent } from './provisional-search.component';

describe('ProvisionalSearchComponent', () => {
  let fixture: ComponentFixture<ProvisionalSearchComponent>;
  let component: ProvisionalSearchComponent;
  let master: any;
  const rows = [
    { conceptID: 'C1', term: 'Fever' },
    { conceptID: 'C2', term: 'Cough' },
  ];

  const create = async (
    input: any,
    response: any = of({ statusCode: 200 })
  ) => {
    master = autoSpy(MasterdataService);
    master.searchDiagnosisBasedOnPageNo.and.returnValue(response);
    await TestBed.configureTestingModule({
      declarations: [ProvisionalSearchComponent],
      providers: [
        ...commonTestProviders({ dialogData: input }),
        { provide: MasterdataService, useValue: master },
        { provide: SpinnerService, useValue: autoSpy(SpinnerService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ProvisionalSearchComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(ProvisionalSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('searches on init and sets placeholder from diagnosis type', async () => {
    await create(
      { searchTerm: 'fev', diagonasisType: 'Provisional', addedDiagnosis: [] },
      of({ statusCode: 200, data: { sctMaster: rows } })
    );
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith('fev', 0);
    expect(component.diagnosis.data).toEqual(rows);
    expect(component.placeHolderSearch).toBe('Provisional');
    expect(component.showProgressBar).toBeFalse();
  });

  it('does not search short terms nor set placeholder without type', async () => {
    await create({ searchTerm: 'fe', addedDiagnosis: [] });
    expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    expect(component.placeHolderSearch).toBeUndefined();
  });

  it('leaves table empty when result has no rows', async () => {
    await create(
      { searchTerm: 'xyz', addedDiagnosis: [] },
      of({ statusCode: 200, data: { sctMaster: [] } })
    );
    expect(component.diagnosis.data).toEqual([]);
    expect(component.showProgressBar).toBeFalse();
  });

  it('resets on non-200', async () => {
    await create(
      { searchTerm: 'xyz', addedDiagnosis: [] },
      of({ statusCode: 5000 })
    );
    expect(component.diagnosis.data).toEqual([]);
    expect(component.showProgressBar).toBeFalse();
  });

  it('resets on error', async () => {
    await create({ searchTerm: 'xyz', addedDiagnosis: [] }, throwingObs());
    expect(component.diagnosis.data).toEqual([]);
    expect(component.showProgressBar).toBeFalse();
  });

  describe('selection', () => {
    beforeEach(async () =>
      create({ searchTerm: 'ab', addedDiagnosis: [{ conceptID: 'A0' }] })
    );

    it('selectDiagnosis adds and removes items', () => {
      const a: any = { conceptID: 'C1' };
      const b: any = { conceptID: 'C2' };
      component.selectDiagnosis({ checked: true }, a);
      component.selectDiagnosis({ checked: true }, b);
      expect(a.selected).toBeTrue();
      expect(component.selectedDiagnosisList).toEqual([a, b]);
      component.selectDiagnosis({ checked: false }, a);
      expect(a.selected).toBeFalse();
      expect(component.selectedDiagnosisList).toEqual([b]);
    });

    it('selectedDiagnosis is true for already-added or currently selected', () => {
      expect(component.selectedDiagnosis({ conceptID: 'A0' })).toBeTrue();
      component.selectedDiagnosisList = [{ conceptID: 'C1' }];
      expect(component.selectedDiagnosis({ conceptID: 'C1' })).toBeTrue();
      expect(component.selectedDiagnosis({ conceptID: 'C9' })).toBeFalse();
    });

    it('disableSelection disables already-added items', () => {
      expect(component.disableSelection({ conceptID: 'A0' })).toBeTrue();
    });

    it('disableSelection keeps selected items enabled', () => {
      component.selectedDiagnosisList = [{ conceptID: 'C1' }];
      expect(component.disableSelection({ conceptID: 'C1' })).toBeFalse();
    });

    it('disableSelection allows new items under the 30 limit', () => {
      expect(component.disableSelection({ conceptID: 'C5' })).toBeFalse();
    });

    it('disableSelection blocks new items once 30 are chosen', () => {
      component.selectedDiagnosisList = Array.from({ length: 30 }, (_, i) => ({
        conceptID: 'S' + i,
      }));
      expect(component.disableSelection({ conceptID: 'C5' })).toBeTrue();
    });

    it('submitDiagnosisList closes with selected list', () => {
      component.selectedDiagnosisList = [{ conceptID: 'C1' }];
      component.submitDiagnosisList();
      expect((TestBed.inject(MatDialogRef) as any).close).toHaveBeenCalledWith([
        { conceptID: 'C1' },
      ]);
    });
  });

  it('ngDoCheck refreshes the language', async () => {
    await create({ searchTerm: '', addedDiagnosis: [] });
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
