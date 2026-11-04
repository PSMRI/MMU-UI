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
import { CaptchaComponent } from './captcha.component';
import { CaptchaService } from '../captcha-service/captcha.service';
import { environment } from 'src/environments/environment';
import { NO_ERRORS_SCHEMA } from 'src/testing/test-utils';

describe('CaptchaComponent', () => {
  let component: CaptchaComponent;
  let fixture: ComponentFixture<CaptchaComponent>;
  let captchaService: { loadScript: jasmine.Spy };
  let turnstileMock: any;
  let hadTurnstile: boolean;
  let previousTurnstile: any;

  beforeEach(async () => {
    hadTurnstile = 'turnstile' in window;
    previousTurnstile = (window as any).turnstile;
    turnstileMock = {
      render: jasmine.createSpy('render').and.returnValue('widget-1'),
      reset: jasmine.createSpy('reset'),
      remove: jasmine.createSpy('remove'),
    };
    (window as any).turnstile = turnstileMock;
    captchaService = {
      loadScript: jasmine.createSpy('loadScript').and.resolveTo(undefined),
    };

    await TestBed.configureTestingModule({
      declarations: [CaptchaComponent],
      providers: [{ provide: CaptchaService, useValue: captchaService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CaptchaComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (hadTurnstile) (window as any).turnstile = previousTurnstile;
    else delete (window as any).turnstile;
  });

  it('loads the script and renders the widget into the container', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await component.ngAfterViewInit();
    expect(captchaService.loadScript).toHaveBeenCalled();
    expect(turnstileMock.render).toHaveBeenCalledTimes(1);
    const [el, opts] = turnstileMock.render.calls.mostRecent().args;
    expect(el.id).toBe('cf-turnstile');
    expect(opts.sitekey).toBe(environment.siteKey);
    expect(opts.theme).toBe('light');
  });

  it('emits the token from the widget callback', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const emitted: string[] = [];
    component.tokenResolved.subscribe(t => emitted.push(t));
    turnstileMock.render.calls.mostRecent().args[1].callback('tok-123');
    expect(emitted).toEqual(['tok-123']);
  });

  it('does not render when the container is missing', async () => {
    component.captchaRef = undefined as any;
    await component.ngAfterViewInit();
    expect(turnstileMock.render).not.toHaveBeenCalled();
  });

  it('swallows script loading errors', async () => {
    captchaService.loadScript.and.rejectWith(new Error('fail'));
    fixture.detectChanges();
    await expectAsync(component.ngAfterViewInit()).toBeResolved();
    expect(turnstileMock.render).not.toHaveBeenCalled();
  });

  it('reset() and ngOnDestroy() act on the rendered widget', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    component.reset();
    expect(turnstileMock.reset).toHaveBeenCalledWith('widget-1');
    component.ngOnDestroy();
    expect(turnstileMock.remove).toHaveBeenCalledWith('widget-1');
  });

  it('reset() and ngOnDestroy() do nothing before a widget exists', () => {
    component.reset();
    component.ngOnDestroy();
    expect(turnstileMock.reset).not.toHaveBeenCalled();
    expect(turnstileMock.remove).not.toHaveBeenCalled();
  });

  it('ngOnDestroy() skips removal when turnstile has no remove()', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    delete turnstileMock.remove;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
