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
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';

import { GeneralOpdExaminationComponent } from './general-opd-examination.component';
import { DoctorService } from '../../shared/services';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('GeneralOpdExaminationComponent', () => {
  let component: GeneralOpdExaminationComponent;
  let fixture: ComponentFixture<GeneralOpdExaminationComponent>;
  let doctor: any;
  let confirm: any;
  let form: FormGroup;

  const session = {
    visitID: 'V1',
    beneficiaryRegID: 'B1',
    providerServiceID: 'P1',
    userName: 'nurse',
    beneficiaryID: 'BEN',
    sessionID: 'S1',
    benFlowID: 'F1',
    visitCode: 'VC1',
    serviceLineDetails: JSON.stringify({ vanID: 7, parkingPlaceID: 9 }),
  };

  const genControls = [
    'typeOfDangerSigns',
    'lymphnodesInvolved',
    'typeOfLymphadenopathy',
    'extentOfEdema',
    'edemaType',
  ];

  function buildForm(required = false) {
    const gen: any = {};
    genControls.forEach(
      c => (gen[c] = new FormControl(null, required ? Validators.required : []))
    );
    gen.pallor = new FormControl(null);
    return new FormGroup({
      generalExaminationForm: new FormGroup(gen),
      headToToeExaminationForm: new FormGroup({ head: new FormControl() }),
      systemicExaminationForm: new FormGroup({
        cardioVascularSystemForm: new FormGroup({ x: new FormControl() }),
        gastroIntestinalSystemForm: new FormGroup({ g: new FormControl() }),
        obstetricExaminationForANCForm: new FormGroup({
          o: new FormControl(),
        }),
      }),
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdExaminationComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralOpdExaminationComponent);
    component = fixture.componentInstance;
    doctor = TestBed.inject(DoctorService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    form = buildForm();
    component.patientExaminationForm = form;
    component.visitCategory = 'General OPD';
  });

  it('creates, loads language and extracts sub forms on init', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.generalExaminationForm).toBe(
      form.get('generalExaminationForm') as FormGroup
    );
    expect(component.headToToeExaminationForm).toBe(
      form.get('headToToeExaminationForm') as FormGroup
    );
    expect(component.systemicExaminationForm).toBe(
      form.get('systemicExaminationForm') as FormGroup
    );
  });

  it('renders the systemic panel except for NCD Care', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-nurse-general-examination')).not.toBeNull();
    expect(
      el.querySelector('app-nurse-head-to-toe-examination')
    ).not.toBeNull();
    expect(el.querySelector('app-nurse-systemic-examination')).not.toBeNull();
    component.visitCategory = 'NCD Care';
    fixture.detectChanges();
    expect(el.querySelector('app-nurse-systemic-examination')).toBeNull();
  });

  it('ngOnChanges in add mode only reloads sub forms', () => {
    component.mode = 'add';
    component.ngOnChanges();
    expect(component.generalExaminationForm).toBeTruthy();
    expect(doctor.getGeneralExamintionData).not.toHaveBeenCalled();
    expect(doctor.updatePatientExamination).not.toHaveBeenCalled();
  });

  describe('view mode', () => {
    const data = {
      generalExamination: { pallor: 'Yes' },
      headToToeExamination: { head: 'Normal' },
      cardiovascularExamination: { x: 'cv' },
      gastrointestinalExamination: { g: 'gi' },
      obstetricExamination: { o: 'ob' },
    };

    beforeEach(() => {
      component.mode = 'view';
      spyOn(console, 'log');
    });

    it('fetches data using session IDs and patches General OPD form', () => {
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.ngOnChanges();
      expect(doctor.getGeneralExamintionData).toHaveBeenCalledWith('B1', 'V1');
      expect(form.value.generalExaminationForm.pallor).toBe('Yes');
      expect(form.value.headToToeExaminationForm.head).toBe('Normal');
      expect(
        form.value.systemicExaminationForm.gastroIntestinalSystemForm.g
      ).toBe('gi');
      expect(
        form.value.systemicExaminationForm.obstetricExaminationForANCForm.o
      ).toBe('ob');
    });

    it('patches ANC data without gastro-intestinal section', () => {
      component.visitCategory = 'ANC';
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.ngOnChanges();
      expect(
        form.value.systemicExaminationForm.cardioVascularSystemForm.x
      ).toBe('cv');
      expect(
        form.value.systemicExaminationForm.obstetricExaminationForANCForm.o
      ).toBe('ob');
      expect(
        form.value.systemicExaminationForm.gastroIntestinalSystemForm.g
      ).toBeNull();
    });

    it('patches PNC data without obstetric section', () => {
      component.visitCategory = 'PNC';
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.ngOnChanges();
      expect(
        form.value.systemicExaminationForm.gastroIntestinalSystemForm.g
      ).toBe('gi');
      expect(
        form.value.systemicExaminationForm.obstetricExaminationForANCForm.o
      ).toBeNull();
    });

    it('does not patch for other categories', () => {
      component.visitCategory = 'Cancer Screening';
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 200, data })
      );
      component.ngOnChanges();
      expect(form.value.generalExaminationForm.pallor).toBeNull();
    });

    it('ignores non-200 responses', () => {
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 500, data })
      );
      component.ngOnChanges();
      expect(form.value.generalExaminationForm.pallor).toBeNull();
      expect(console.log).not.toHaveBeenCalled();
    });

    it('unsubscribes on destroy', () => {
      component.ngOnChanges();
      const sub = component.ancExaminationDataSubscription;
      spyOn(sub, 'unsubscribe');
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
    });
  });

  it('ngOnDestroy is safe without a subscription', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('update mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'update';
    });

    it('updates the examination and marks the form pristine on success', () => {
      form.markAsDirty();
      doctor.updatePatientExamination.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.ngOnChanges();
      expect(doctor.updatePatientExamination).toHaveBeenCalledWith(
        form.value,
        'General OPD',
        {
          beneficiaryRegID: 'B1',
          benVisitID: 'V1',
          providerServiceMapID: 'P1',
          modifiedBy: 'nurse',
          beneficiaryID: 'BEN',
          sessionID: 'S1',
          parkingPlaceID: 9,
          vanID: 7,
          benFlowID: 'F1',
          visitCode: 'VC1',
        }
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        'Examination updated successfully',
        'success'
      );
      expect(form.pristine).toBeTrue();
    });

    it('alerts error when response has null data', () => {
      doctor.updatePatientExamination.and.returnValue(
        of({ statusCode: 200, data: null })
      );
      component.ngOnChanges();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Error in Examination update',
        'error'
      );
    });

    it('alerts error when the call fails', () => {
      doctor.updatePatientExamination.and.returnValue(throwingObs());
      component.ngOnChanges();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Error in Examination update',
        'error'
      );
    });

    it('notifies mandatory fields and skips update when invalid', () => {
      form = buildForm(true);
      component.patientExaminationForm = form;
      component.ngOnChanges();
      const g =
        LANGUAGE_EN.ExaminationData.ANC_OPD_PNCExamination.genExamination;
      expect(confirm.notify).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mandatoryFields,
        [
          g.dangersigns,
          g.lymph,
          g.typeofLymphadenopathy,
          g.extentofEdema,
          g.typeofEdema,
        ]
      );
      expect(doctor.updatePatientExamination).not.toHaveBeenCalled();
    });
  });

  it('checkRequired returns true when there are no errors', () => {
    fixture.detectChanges();
    expect(component.checkRequired(form)).toBeTrue();
  });
});
