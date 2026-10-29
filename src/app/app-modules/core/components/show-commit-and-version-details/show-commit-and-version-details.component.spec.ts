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
import { HttpServiceService } from '../../services/http-service.service';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ShowCommitAndVersionDetailsComponent } from './show-commit-and-version-details.component';

describe('ShowCommitAndVersionDetailsComponent', () => {
  let fixture: ComponentFixture<ShowCommitAndVersionDetailsComponent>;
  let component: ShowCommitAndVersionDetailsComponent;
  const input = {
    commitDetailsAPI: { version: '3.1.0', commit: 'abc123' },
    commitDetailsUI: { version: '3.2.0', commit: 'def456' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowCommitAndVersionDetailsComponent],
      providers: [...commonTestProviders({ dialogData: input })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ShowCommitAndVersionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('assigns the language set on init', () => {
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.input).toBe(input);
  });

  it('renders API and UI version and commit details', () => {
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('td') as NodeListOf<HTMLElement>
    ).map(td => td.textContent?.trim());
    expect(cells).toEqual(['3.1.0', '3.2.0', 'abc123', 'def456']);
  });

  it('ngDoCheck re-reads the current language', () => {
    const http: any = TestBed.inject(HttpServiceService);
    const lang = { common: { versionDetails: 'VD' } };
    http.appCurrentLanguge.next(lang);
    fixture.detectChanges();
    expect(component.current_language_set).toBe(lang);
    expect(fixture.nativeElement.querySelector('h4').textContent).toContain(
      'VD'
    );
  });
});
