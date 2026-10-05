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
import { RouterTestingModule } from '@angular/router/testing';
import { HttpServiceService } from '../../services/http-service.service';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  createHttpServiceMock,
} from 'src/testing/test-utils';
import { AppFooterComponent } from './app-footer.component';

describe('AppFooterComponent', () => {
  let fixture: ComponentFixture<AppFooterComponent>;
  let component: AppFooterComponent;
  let http: any;

  beforeEach(async () => {
    http = createHttpServiceMock(LANGUAGE_EN);
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppFooterComponent],
      providers: [{ provide: HttpServiceService, useValue: http }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AppFooterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture?.destroy());

  it('sets language, year and polls online status every second', fakeAsync(() => {
    const onLine = spyOnProperty(navigator, 'onLine').and.returnValue(true);
    fixture.detectChanges();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(component.year).toBe(new Date().getFullYear());
    expect(component.status).toBeFalse();
    tick(1000);
    expect(component.status).toBeTrue();
    onLine.and.returnValue(false);
    tick(1000);
    expect(component.status).toBeFalse();
    discardPeriodicTasks();
  }));

  it('renders localized text when language is available', fakeAsync(() => {
    spyOnProperty(navigator, 'onLine').and.returnValue(true);
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(`${component.year} ©`);
    expect(text).toContain(LANGUAGE_EN.online);
    const dot = fixture.nativeElement.querySelector(
      'span[style*="border-radius"]'
    ) as HTMLElement;
    expect(dot).not.toBeNull();
    expect(dot.style.background).toContain('green');
    discardPeriodicTasks();
  }));

  it('renders fallback text when no language is available', fakeAsync(() => {
    http.appCurrentLanguge.next(undefined);
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    fixture.detectChanges();
    expect(component.currentLanguageSet).toBeUndefined();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Powered by: WIPRO');
    expect(text).toContain('PSMRI');
    expect(text).toContain('Offline');
    expect(
      fixture.nativeElement.querySelector('span[style*="border-radius"]')
    ).toBeNull();
    expect(text).toContain('Feedback');
    discardPeriodicTasks();
  }));

  it('ngDoCheck picks up a changed language', fakeAsync(() => {
    fixture.detectChanges();
    const other = { online: 'On', offline: 'Off' };
    http.appCurrentLanguge.next(other);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toBe(other);
    discardPeriodicTasks();
  }));
});
