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

import { BehaviorSubject, Subject } from 'rxjs';
import { SetLanguageComponent } from './set-language.component';
import { LANGUAGE_EN } from 'src/testing/test-utils';

describe('SetLanguageComponent', () => {
  it('copies the current language object from the service', () => {
    const svc: any = {
      currentLangugae$: new BehaviorSubject<any>(LANGUAGE_EN).asObservable(),
    };
    const c = new SetLanguageComponent(svc);
    expect(c.currentLanguageObject).toBeUndefined();
    c.setLanguage();
    expect(c.currentLanguageObject).toBe(LANGUAGE_EN);
  });

  it('unsubscribes immediately so later emissions are ignored', () => {
    const subj = new BehaviorSubject<any>({ a: 1 });
    const c = new SetLanguageComponent({
      currentLangugae$: subj.asObservable(),
    } as any);
    c.setLanguage();
    subj.next({ a: 2 });
    expect(c.currentLanguageObject).toEqual({ a: 1 });
    expect(subj.observers.length).toBe(0);
  });

  it('leaves object undefined when nothing has been emitted', () => {
    const c = new SetLanguageComponent({
      currentLangugae$: new Subject<any>().asObservable(),
    } as any);
    c.setLanguage();
    expect(c.currentLanguageObject).toBeUndefined();
  });

  it('logs errors emitted by the language stream', () => {
    const spy = spyOn(console, 'error');
    const c = new SetLanguageComponent({
      currentLangugae$: {
        subscribe: (n: any, e: any, done: any) => {
          e('bad');
          done();
          return { unsubscribe: () => undefined };
        },
      },
    } as any);
    c.setLanguage();
    expect(spy).toHaveBeenCalledWith('bad');
    expect(c.currentLanguageObject).toBeUndefined();
  });
});
