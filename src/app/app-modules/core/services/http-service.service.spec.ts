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

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { HttpServiceService } from './http-service.service';
import { environment } from 'src/environments/environment';

describe('HttpServiceService', () => {
  let service: HttpServiceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('appLanguage');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpServiceService],
    });

    service = TestBed.inject(HttpServiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('appLanguage');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize language as null when localStorage has no appLanguage', () => {
      expect(service.language).toBeNull();
    });

    it('should initialize language from localStorage when available', () => {
      const langData = { english: 'Hello' };
      localStorage.setItem('appLanguage', JSON.stringify(langData));
      const http = TestBed.inject(HttpClient);
      const fresh = new HttpServiceService(http, http);
      expect(fresh.language).toEqual(langData);
    });
  });

  describe('listen and filter', () => {
    it('should emit values through the _listners Subject', done => {
      service.listen().subscribe(value => {
        expect(value).toBe('testFilter');
        done();
      });

      service.filter('testFilter');
    });

    it('should emit multiple filter values in order', () => {
      const received: string[] = [];
      service.listen().subscribe(value => {
        received.push(value);
      });

      service.filter('first');
      service.filter('second');
      service.filter('third');

      expect(received).toEqual(['first', 'second', 'third']);
    });
  });

  describe('fetchLanguageSet', () => {
    it('should make a GET request to the language list URL', () => {
      service.fetchLanguageSet().subscribe((res: any) => {
        expect(res).toEqual({ data: ['en', 'hi'] });
      });

      const req = httpMock.expectOne(environment.getLanguageList);
      expect(req.request.method).toBe('GET');
      req.flush({ data: ['en', 'hi'] });
    });
  });

  describe('getLanguage', () => {
    it('should make a GET request to the provided URL', () => {
      const url = 'https://example.com/language/en.json';

      service.getLanguage(url).subscribe((res: any) => {
        expect(res).toEqual({ greeting: 'Hello' });
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ greeting: 'Hello' });
    });
  });

  describe('getCurrentLanguage', () => {
    it('should update the language property', () => {
      const langData = { greeting: 'Namaste' };
      service.getCurrentLanguage(langData);
      expect(service.language).toEqual(langData);
    });

    it('should save language to localStorage', () => {
      const langData = { greeting: 'Hello' };
      service.getCurrentLanguage(langData);
      expect(localStorage.getItem('appLanguage')).toBe(
        JSON.stringify(langData)
      );
    });

    it('should emit the new language on appCurrentLanguge BehaviorSubject', done => {
      const langData = { greeting: 'Hola' };

      // Skip the initial emission (which is null or stored value)
      let emissionCount = 0;
      service.currentLangugae$.subscribe(lang => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(lang).toEqual(langData);
          done();
        }
      });

      service.getCurrentLanguage(langData);
    });

    it('should make the language available via currentLangugae$ observable', done => {
      const langData = { key: 'value' };
      service.getCurrentLanguage(langData);

      service.currentLangugae$.subscribe(lang => {
        expect(lang).toEqual(langData);
        done();
      });
    });
  });
});
