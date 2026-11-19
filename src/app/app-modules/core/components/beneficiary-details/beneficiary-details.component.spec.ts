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

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { BeneficiaryDetailsService } from '../../services/beneficiary-details.service';
import { HttpServiceService } from '../../services/http-service.service';
import { BeneficiaryDetailsComponent } from './beneficiary-details.component';

describe('BeneficiaryDetailsComponent', () => {
  let component: BeneficiaryDetailsComponent;
  let fixture: ComponentFixture<BeneficiaryDetailsComponent>;
  let details$: BehaviorSubject<any>;

  beforeEach(waitForAsync(() => {
    details$ = new BehaviorSubject<any>(null);
    TestBed.configureTestingModule({
      imports: [BeneficiaryDetailsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { params: of({ beneficiaryRegID: '42' }) },
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
        {
          provide: HttpServiceService,
          useValue: { currentLangugae$: of({ bendetails: {}, consent: {} }) },
        },
        { provide: SessionStorageService, useValue: { getItem: () => null } },
        {
          provide: BeneficiaryDetailsService,
          useValue: {
            beneficiaryDetails$: details$,
            getBeneficiaryDetails: jasmine.createSpy('getBeneficiaryDetails'),
            getBeneficiaryImage: () => of({}),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BeneficiaryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the patient and their phone to the Consent button', () => {
    details$.next({ beneficiaryName: 'Asha', preferredPhoneNum: '9876543212' });
    fixture.detectChanges();
    expect(component.beneficiaryRegID).toBe('42');
    const button = fixture.nativeElement.querySelector('app-consent-button');
    expect(button).not.toBeNull();
  });
});
