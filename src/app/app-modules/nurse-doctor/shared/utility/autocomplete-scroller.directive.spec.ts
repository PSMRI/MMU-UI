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

import { Component, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AutocompleteScrollerDirective } from './autocomplete-scroller.directive';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { Subject } from 'rxjs';
import { NgZone } from '@angular/core';

describe('AutocompleteScrollerDirective', () => {
  let directive: AutocompleteScrollerDirective;
  let mockAutocomplete: any;
  let openedSubject: Subject<void>;
  let closedSubject: Subject<void>;
  let mockNgZone: jasmine.SpyObj<NgZone>;

  beforeEach(() => {
    openedSubject = new Subject<void>();
    closedSubject = new Subject<void>();

    mockAutocomplete = {
      opened: openedSubject.asObservable(),
      closed: closedSubject.asObservable(),
      panel: null,
      id: 'test-autocomplete',
    };

    mockNgZone = jasmine.createSpyObj('NgZone', ['run', 'runOutsideAngular']);
    mockNgZone.run.and.callFake((fn: any) => fn());
    mockNgZone.runOutsideAngular.and.callFake((fn: any) => fn());

    directive = new AutocompleteScrollerDirective(
      mockAutocomplete as MatAutocomplete,
      mockNgZone as any
    );
  });

  afterEach(() => {
    directive.ngOnDestroy();
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should have default threshold of 0.6', () => {
    expect(directive.threshold).toBe(0.6);
  });

  it('should allow custom threshold', () => {
    directive.threshold = 0.8;
    expect(directive.threshold).toBe(0.8);
  });

  it('should clean up subscriptions on destroy', () => {
    directive.ngAfterViewInit();
    directive.ngOnDestroy();
    openedSubject.next();
    expect(mockNgZone.runOutsideAngular).not.toHaveBeenCalled();
  });

  describe('with a panel element', () => {
    let rafQueue: FrameRequestCallback[];
    const flushRaf = () => {
      while (rafQueue.length) rafQueue.shift()!(0);
    };
    const makePanel = (
      scrollHeight: number,
      clientHeight: number,
      scrollTop: number
    ) => {
      const el: any = {
        scrollHeight,
        clientHeight,
        scrollTop,
        listener: null as any,
        addEventListener: jasmine
          .createSpy('addEventListener')
          .and.callFake((_: string, fn: any) => (el.listener = fn)),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };
      return el;
    };

    beforeEach(() => {
      rafQueue = [];
      spyOn(window, 'requestAnimationFrame').and.callFake((cb: any) => {
        rafQueue.push(cb);
        return rafQueue.length;
      });
    });

    it('emits panelReady and attaches a passive scroll listener when panel opens', () => {
      const panel = makePanel(200, 100, 0);
      mockAutocomplete.panel = { nativeElement: panel };
      const ready = jasmine.createSpy('ready');
      directive.panelReady.subscribe(ready);
      directive.ngAfterViewInit();
      openedSubject.next();
      flushRaf();
      expect(ready).toHaveBeenCalledWith(panel);
      expect(panel.addEventListener).toHaveBeenCalledWith(
        'scroll',
        jasmine.any(Function),
        { passive: true }
      );
    });

    it('emits nearEnd only past the threshold and when panel overflows', () => {
      const panel = makePanel(200, 100, 0);
      mockAutocomplete.panel = { nativeElement: panel };
      const near = jasmine.createSpy('near');
      directive.nearEnd.subscribe(near);
      directive.ngAfterViewInit();
      openedSubject.next();
      flushRaf();

      panel.listener(); // ratio 0.5 < 0.6
      expect(near).not.toHaveBeenCalled();

      panel.scrollTop = 50; // ratio 0.75
      panel.listener();
      expect(near).toHaveBeenCalledTimes(1);
      expect(mockNgZone.run).toHaveBeenCalled();

      panel.scrollHeight = 100; // no overflow
      panel.listener();
      expect(near).toHaveBeenCalledTimes(1);
    });

    it('retries until the panel exists, then gives up after max tries', () => {
      const ready = jasmine.createSpy('ready');
      directive.panelReady.subscribe(ready);
      mockAutocomplete.id = undefined;
      directive.ngAfterViewInit();
      openedSubject.next();
      // first frame + 10 retries
      flushRaf();
      expect((window.requestAnimationFrame as jasmine.Spy).calls.count()).toBe(
        11
      );
      expect(ready).not.toHaveBeenCalled();
    });

    it('falls back to finding the panel by id', () => {
      const el = document.createElement('div');
      el.id = 'test-autocomplete';
      document.body.appendChild(el);
      try {
        const ready = jasmine.createSpy('ready');
        directive.panelReady.subscribe(ready);
        directive.ngAfterViewInit();
        openedSubject.next();
        flushRaf();
        expect(ready).toHaveBeenCalledWith(el);
      } finally {
        directive.ngOnDestroy();
        document.body.removeChild(el);
      }
    });

    it('removes the scroll listener when the panel closes', () => {
      const panel = makePanel(200, 100, 0);
      mockAutocomplete.panel = { nativeElement: panel };
      directive.ngAfterViewInit();
      openedSubject.next();
      flushRaf();
      const fn = panel.listener;
      closedSubject.next();
      expect(panel.removeEventListener).toHaveBeenCalledWith('scroll', fn);
      // a second close has nothing to remove
      closedSubject.next();
      expect(panel.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('removes the scroll listener on destroy', () => {
      const panel = makePanel(200, 100, 0);
      mockAutocomplete.panel = { nativeElement: panel };
      directive.ngAfterViewInit();
      openedSubject.next();
      flushRaf();
      directive.ngOnDestroy();
      expect(panel.removeEventListener).toHaveBeenCalledTimes(1);
    });
  });
});
