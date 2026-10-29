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
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services';
import { GeneralOpdHistoryComponent } from './general-opd-history.component';

describe('GeneralOpdHistoryComponent', () => {
  let component: GeneralOpdHistoryComponent;
  let fixture: ComponentFixture<GeneralOpdHistoryComponent>;
  let doctor: any;
  let benSvc: any;
  let confirm: any;
  let session: any;
  let ben$: BehaviorSubject<any>;

  const sections = [
    'pastHistory',
    'comorbidityHistory',
    'medicationHistory',
    'personalHistory',
    'familyHistory',
    'menstrualHistory',
    'perinatalHistory',
    'pastObstericHistory',
    'immunizationHistory',
    'otherVaccines',
    'feedingHistory',
    'developmentHistory',
    'physicalActivityHistory',
  ];
  const makeForm = () => {
    const g: any = {};
    sections.forEach(s => (g[s] = new FormGroup({})));
    return new FormGroup(g);
  };
  const expectedTemp = {
    beneficiaryRegID: 'b1',
    benVisitID: 'v1',
    providerServiceMapID: 'p1',
    createdBy: 'nurse1',
    modifiedBy: 'nurse1',
    beneficiaryID: 'bid',
    sessionID: 's1',
    parkingPlaceID: 8,
    vanID: 7,
    benFlowID: 'f1',
    visitCode: 'vc',
  };

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    ben$ = new BehaviorSubject<any>(null);
    benSvc = autoSpy(BeneficiaryDetailsService, {
      beneficiaryDetails$: ben$.asObservable(),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({ vanID: 7, parkingPlaceID: 8 }),
            beneficiaryRegID: 'b1',
            visitID: 'v1',
            providerServiceID: 'p1',
            userName: 'nurse1',
            beneficiaryID: 'bid',
            sessionID: 's1',
            benFlowID: 'f1',
            visitCode: 'vc',
            visitCategory: 'General OPD',
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GeneralOpdHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    component.nurseGeneralHistoryForm = makeForm();
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('ngOnInit wires sub forms and language', () => {
    sections.forEach(s =>
      expect((component as any)[s]).toBe(
        component.nurseGeneralHistoryForm.get(s)
      )
    );
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('beneficiary details decide obstetric history visibility', () => {
    ben$.next({ genderName: 'Female', ageVal: 25 });
    expect(component.beneficiary.ageVal).toBe(25);
    expect(component.showObstetricHistory).toBeTrue();
    ben$.next({ genderName: 'Male', ageVal: 25 });
    expect(component.showObstetricHistory).toBeFalse();
    ben$.next({ genderName: 'Female', ageVal: 10 });
    expect(component.showObstetricHistory).toBeFalse();
  });

  it('canShowObstetricHistory handles primigravida and missing beneficiary', () => {
    component.primiGravida = true;
    component.showObstetricHistory = true;
    component.canShowObstetricHistory();
    expect(component.showObstetricHistory).toBeFalse();
    component.primiGravida = false;
    component.visitCategory = 'PNC';
    component.canShowObstetricHistory();
    expect(component.showObstetricHistory).toBeTrue();
    component.visitCategory = 'ANC';
    component.showObstetricHistory = false;
    component.canShowObstetricHistory();
    expect(component.showObstetricHistory).toBeTrue();
  });

  it('ngOnChanges re-evaluates obstetric history on pregnancy / primigravida change', () => {
    spyOn(component, 'canShowObstetricHistory');
    component.ngOnChanges({ pregnancyStatus: {} });
    component.ngOnChanges({ primiGravida: {} });
    component.ngOnChanges({ mode: {} });
    expect(component.canShowObstetricHistory).toHaveBeenCalledTimes(2);
    expect(doctor.updateGeneralHistory).not.toHaveBeenCalled();
  });

  describe('update mode', () => {
    beforeEach(() => {
      ben$.next({ genderName: 'Female', ageVal: 30 });
      component.mode = 'update';
    });

    it('updates general history and refreshes HRP for ANC (positive)', () => {
      component.visitCategory = 'ANC';
      component.nurseGeneralHistoryForm.markAsDirty();
      doctor.updateGeneralHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } })
      );
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } })
      );
      component.ngOnChanges({ mode: {} });
      expect(doctor.updateGeneralHistory).toHaveBeenCalledWith(
        component.nurseGeneralHistoryForm,
        expectedTemp,
        30
      );
      expect(doctor.getHRPDetails).toHaveBeenCalledWith('b1', 'vc');
      expect(benSvc.setHRPPositive).toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith('saved', 'success');
      expect(component.nurseGeneralHistoryForm.pristine).toBeTrue();
    });

    it('resets HRP when not HRP and ignores empty HRP response', () => {
      component.visitCategory = 'ANC';
      doctor.updateGeneralHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } })
      );
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } })
      );
      component.updatePatientGeneralHistory(component.nurseGeneralHistoryForm);
      expect(benSvc.resetHRPPositive).toHaveBeenCalled();
      doctor.getHRPDetails.and.returnValue(of(null));
      component.getHRPDetails();
      expect(benSvc.resetHRPPositive).toHaveBeenCalledTimes(1);
      expect(benSvc.setHRPPositive).not.toHaveBeenCalled();
    });

    it('does not fetch HRP for non-ANC; alerts errors', () => {
      component.visitCategory = 'General OPD';
      doctor.updateGeneralHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } })
      );
      component.updatePatientGeneralHistory(component.nurseGeneralHistoryForm);
      expect(doctor.getHRPDetails).not.toHaveBeenCalled();
      doctor.updateGeneralHistory.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.updatePatientGeneralHistory(component.nurseGeneralHistoryForm);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      doctor.updateGeneralHistory.and.returnValue(throwingObs('boom'));
      component.updatePatientGeneralHistory(component.nurseGeneralHistoryForm);
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });

    it('uses NCD screening history update for NCD screening visits', () => {
      session.store.set('visitCategory', 'NCD screening');
      component.nurseGeneralHistoryForm.markAsDirty();
      doctor.updateNCDScreeningHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'ncd saved' } })
      );
      component.ngOnChanges({ mode: {} });
      expect(doctor.updateGeneralHistory).not.toHaveBeenCalled();
      expect(doctor.updateNCDScreeningHistory).toHaveBeenCalledWith(
        component.nurseGeneralHistoryForm,
        expectedTemp,
        30
      );
      expect(confirm.alert).toHaveBeenCalledWith('ncd saved', 'success');
      expect(component.nurseGeneralHistoryForm.pristine).toBeTrue();
    });

    it('NCD screening history update alerts errors', () => {
      doctor.updateNCDScreeningHistory.and.returnValue(
        of({ statusCode: 500, errorMessage: 'no' })
      );
      component.updatePatientNCDScreeningHistory(
        component.nurseGeneralHistoryForm
      );
      doctor.updateNCDScreeningHistory.and.returnValue(throwingObs('err'));
      component.updatePatientNCDScreeningHistory(
        component.nurseGeneralHistoryForm
      );
      expect(confirm.alert.calls.allArgs()).toEqual([
        ['no', 'error'],
        ['err', 'error'],
      ]);
    });
  });
});
