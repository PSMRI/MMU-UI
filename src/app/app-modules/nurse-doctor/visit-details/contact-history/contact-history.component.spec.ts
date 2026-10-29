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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { ContactHistoryComponent } from './contact-history.component';

describe('ContactHistoryComponent', () => {
  let component: ContactHistoryComponent;
  let fixture: ComponentFixture<ContactHistoryComponent>;
  let master: any;
  let doctor: any;
  let nurse: any;
  let session: any;
  let nurseMaster$: BehaviorSubject<any>;
  let listen$: Subject<any>;

  const contactMaster = [
    { contactHistory: 'Close contact' },
    { contactHistory: 'Healthcare worker' },
    { contactHistory: 'None of the above' },
  ];

  beforeEach(async () => {
    nurseMaster$ = new BehaviorSubject<any>(null);
    listen$ = new Subject<any>();
    master = autoSpy(MasterdataService, { nurseMasterData$: nurseMaster$ });
    master.listen.and.returnValue(listen$.asObservable());
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ContactHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    TestBed.overrideTemplate(ContactHistoryComponent, '');
    fixture = TestBed.createComponent(ContactHistoryComponent);
    component = fixture.componentInstance;
    component.patientCovidForm = new FormGroup({
      contactStatus: new FormControl([]),
    });
    session = TestBed.inject(SessionStorageService);
    spyOn(console, 'log');
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('ngOnInit sets language and resets contact in session', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('contact', 'null');
    expect(component.contactArray).toBeUndefined();
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('maps contact history master data', () => {
    nurseMaster$.next({ covidContactHistoryMaster: contactMaster });
    expect(component.contactArray).toBe(contactMaster);
    expect(component.contactList).toEqual([
      'Close contact',
      'Healthcare worker',
      'None of the above',
    ]);
    expect(component.contactData).toEqual(component.contactList);
  });

  describe('onSymptomFilterClick (via masterdata listen)', () => {
    it('makes contact optional when all symptoms selected', () => {
      session.store.set('allSymptom', 'true');
      listen$.next('true');
      expect(component.allSymp).toBe('true');
      expect(component.contactReqiured).toBe('false');
    });

    it('makes contact required otherwise', () => {
      session.store.set('allSymptom', 'false');
      listen$.next('false');
      expect(component.contactReqiured).toBe('true');
    });
  });

  describe('contactSelected', () => {
    beforeEach(() =>
      nurseMaster$.next({ covidContactHistoryMaster: contactMaster })
    );

    it('limits to None of the above when chosen', () => {
      component.patientCovidForm.patchValue({
        contactStatus: ['None of the above'],
      });
      component.contactSelected();
      expect(component.contactData).toEqual(['None of the above']);
      expect(component.cont).toBe('false');
      expect(nurse.filter).toHaveBeenCalledWith('false');
    });

    it('excludes None of the above when other contacts chosen', () => {
      component.patientCovidForm.patchValue({
        contactStatus: ['Close contact'],
      });
      component.contactSelected();
      expect(component.contactData).toEqual([
        'Close contact',
        'Healthcare worker',
      ]);
      expect(component.cont).toBe('true');
      expect(nurse.filter).toHaveBeenCalledWith('true');
    });

    it('restores full list when nothing selected', () => {
      component.contactSelected();
      expect(component.contactData).toBe(component.contactList);
      expect(component.cont).toBe('null');
      expect(nurse.filter).toHaveBeenCalledWith('null');
    });
  });

  describe('ngOnChanges', () => {
    it('loads contact status in view mode', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidDetails: { contactStatus: ['Close contact'] } },
        })
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.contactStatus).toEqual(['Close contact']);
      expect(component.contactResponseList).toEqual(['Close contact']);
      expect(component.contactFlag).toBeTrue();
    });

    it('ignores non-200 responses', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 5000, data: null })
      );
      component.getContactDetails('b1', 'v1');
      expect(component.contactFlag).toBeFalse();
    });

    it('does not fetch outside view mode', () => {
      component.mode = 'add';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy unsubscribes', () => {
    const a = jasmine.createSpyObj('a', ['unsubscribe']);
    const b = jasmine.createSpyObj('b', ['unsubscribe']);
    component.contactHistoryMasterData = a;
    component.covidContactHistory = b;
    component.ngOnDestroy();
    expect(a.unsubscribe).toHaveBeenCalled();
    expect(b.unsubscribe).toHaveBeenCalled();
  });
});
