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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { BeneficiaryDetailsService } from '../../services/beneficiary-details.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsComponent } from './beneficiary-details.component';

describe('BeneficiaryDetailsComponent', () => {
  let fixture: ComponentFixture<BeneficiaryDetailsComponent>;
  let component: BeneficiaryDetailsComponent;
  let params: Subject<any>;
  let details$: BehaviorSubject<any>;
  let benService: any;

  beforeEach(async () => {
    params = new Subject<any>();
    details$ = new BehaviorSubject<any>(null);
    benService = {
      beneficiaryDetails$: details$.asObservable(),
      getBeneficiaryDetails: jasmine.createSpy('getBeneficiaryDetails'),
      getBeneficiaryImage: jasmine
        .createSpy('getBeneficiaryImage')
        .and.returnValue(of({})),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BeneficiaryDetailsComponent],
      providers: [
        ...commonTestProviders({ session: { benFlowID: '77' } }),
        { provide: ActivatedRoute, useValue: { params } },
        { provide: BeneficiaryDetailsService, useValue: benService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(BeneficiaryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('initialises language and date', () => {
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.today instanceof Date).toBeTrue();
    const ss: any = TestBed.inject(SessionStorageService);
    expect(ss.getItem).toHaveBeenCalledWith('benFlowID');
  });

  it('fetches details and image for the route beneficiary', () => {
    params.next({ beneficiaryRegID: '123' });
    expect(benService.getBeneficiaryDetails).toHaveBeenCalledWith('123', '77');
    expect(benService.getBeneficiaryImage).toHaveBeenCalledWith('123');
    expect(component.beneficiary).toBeUndefined();
  });

  it('stores beneficiary, service date and image', () => {
    details$.next({
      beneficiaryName: 'Ravi',
      fatherName: 'Mohan',
      lastName: 'K',
      preferredPhoneNum: '999',
      serviceDate: '2024-01-02',
    });
    benService.getBeneficiaryImage.and.returnValue(
      of({ benImage: 'data:image/png;base64,xx' })
    );
    params.next({ beneficiaryRegID: '1' });
    fixture.detectChanges();
    expect(component.beneficiary.beneficiaryName).toBe('Ravi');
    expect(component.today).toBe('2024-01-02');
    expect(component.beneficiary.benImage).toBe('data:image/png;base64,xx');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img[alt="Patient"]')).not.toBeNull();
    expect(el.textContent).toContain('Mohan');
    expect(el.textContent).toContain('999');
  });

  it('keeps today when no service date and default avatar when no image', () => {
    details$.next({ beneficiaryName: 'A' });
    params.next({ beneficiaryRegID: '1' });
    fixture.detectChanges();
    expect(component.today instanceof Date).toBeTrue();
    expect(
      fixture.nativeElement.querySelector('img[alt="DefaultPatient"]')
    ).not.toBeNull();
  });

  it('ngOnDestroy unsubscribes from the details stream', () => {
    params.next({ beneficiaryRegID: '1' });
    const sub = component.beneficiaryDetailsSubscription;
    spyOn(sub, 'unsubscribe').and.callThrough();
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('ngOnDestroy is safe without subscription', () => {
    component.beneficiaryDetailsSubscription = undefined;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
