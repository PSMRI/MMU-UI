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
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { CancerExaminationComponent } from './cancer-examination.component';
import { DoctorService } from '../../shared/services/doctor.service';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from '../../../core/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('CancerExaminationComponent', () => {
  let component: CancerExaminationComponent;
  let fixture: ComponentFixture<CancerExaminationComponent>;
  let doctor: any;
  let confirm: any;
  let benDetails$: BehaviorSubject<any>;
  let form: FormGroup;

  const session = {
    visitID: 'V1',
    beneficiaryRegID: 'B1',
    providerServiceID: 'P1',
    userName: 'doc',
    beneficiaryID: 'BEN',
    sessionID: 'S1',
    benFlowID: 'F1',
    visitCode: 'VC1',
    serviceLineDetails: JSON.stringify({ vanID: 7, parkingPlaceID: 9 }),
  };

  function lymph(name: string) {
    return new FormGroup({
      lymphNodeName: new FormControl(name),
      size_Left: new FormControl(null),
      mobility_Left: new FormControl(null),
      size_Right: new FormControl(null),
      mobility_Right: new FormControl(null),
      vanID: new FormControl(null),
      parkingPlaceID: new FormControl(null),
    });
  }

  function buildForm() {
    return new FormGroup({
      signsForm: new FormGroup({
        breastEnlargement: new FormControl(null),
        shortnessOfBreath: new FormControl(null),
        lymphNodes: new FormArray([lymph('Cervical'), lymph('Axillary')]),
      }),
      oralExaminationForm: new FormGroup({
        image: new FormControl(null),
        preMalignantLesionTypeList: new FormControl(null),
        otherLesionType: new FormControl(null),
        limitedMouthOpening: new FormControl(null),
      }),
      breastExaminationForm: new FormGroup({
        image: new FormControl(null),
        everBreastFed: new FormControl(null),
      }),
      abdominalExaminationForm: new FormGroup({
        image: new FormControl(null),
        liver: new FormControl(null),
      }),
      gynecologicalExaminationForm: new FormGroup({
        image: new FormControl(null),
        typeOfLesionList: new FormControl(null),
        uterus_Normal: new FormControl(null),
      }),
    });
  }

  beforeEach(async () => {
    benDetails$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CancerExaminationComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CancerExaminationComponent);
    component = fixture.componentInstance;
    doctor = TestBed.inject(DoctorService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    form = buildForm();
    component.cancerForm = form;
    spyOn(console, 'log');
  });

  it('creates, sets language and extracts sub forms', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.signsForm).toBe(form.get('signsForm') as FormGroup);
    expect(component.oralExaminationForm).toBe(
      form.get('oralExaminationForm') as FormGroup
    );
    expect(component.breastExaminationForm).toBe(
      form.get('breastExaminationForm') as FormGroup
    );
    expect(component.abdominalExaminationForm).toBe(
      form.get('abdominalExaminationForm') as FormGroup
    );
    expect(component.gynecologicalExaminationForm).toBe(
      form.get('gynecologicalExaminationForm') as FormGroup
    );
  });

  it('toggles breast examination with breastEnlargement', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-doctor-breast-examination')).toBeNull();
    form.get('signsForm.breastEnlargement')!.setValue(true);
    fixture.detectChanges();
    expect(component.showBreastExamination).toBeTrue();
    expect(el.querySelector('app-doctor-breast-examination')).not.toBeNull();
    form.get('signsForm.breastEnlargement')!.setValue(false);
    expect(component.showBreastExamination).toBeFalse();
  });

  it('works when the form has no signsForm', () => {
    component.cancerForm = new FormGroup({});
    fixture.detectChanges();
    expect(component.signsForm).toBeNull();
  });

  ['Female', 'Transgender'].forEach(g => {
    it(`marks ${g} beneficiaries as female and shows gynec panel`, () => {
      benDetails$.next({ genderName: g });
      fixture.detectChanges();
      expect(component.female).toBeTrue();
      expect(
        fixture.nativeElement.querySelector(
          'app-doctor-gynecological-examination'
        )
      ).not.toBeNull();
    });
  });

  it('does not mark male beneficiaries as female', () => {
    benDetails$.next({ genderName: 'Male' });
    fixture.detectChanges();
    expect(component.female).toBeFalse();
  });

  describe('getImageCoordinates', () => {
    it('returns only images from dirty forms', () => {
      ['oral', 'abdominal', 'gynecological', 'breast'].forEach(k =>
        form.get(`${k}ExaminationForm.image`)!.setValue({ id: k })
      );
      expect(component.getImageCoordinates(form)).toEqual([]);
      ['oral', 'abdominal', 'gynecological', 'breast'].forEach(k =>
        form.get(`${k}ExaminationForm`)!.markAsDirty()
      );
      expect(component.getImageCoordinates(form)).toEqual([
        { id: 'oral' },
        { id: 'abdominal' },
        { id: 'gynecological' },
        { id: 'breast' },
      ]);
    });
  });

  describe('update mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'update';
    });

    it('updates and alerts success', fakeAsync(() => {
      form.markAsDirty();
      doctor.updateCancerExaminationDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } })
      );
      component.ngOnChanges();
      expect(doctor.updateCancerExaminationDetails).toHaveBeenCalledWith(
        form,
        {
          beneficiaryRegID: 'B1',
          benVisitID: 'V1',
          providerServiceMapID: 'P1',
          modifiedBy: 'doc',
          beneficiaryID: 'BEN',
          sessionID: 'S1',
          parkingPlaceID: 9,
          vanID: 7,
          benFlowID: 'F1',
          visitCode: 'VC1',
        },
        []
      );
      expect(form.pristine).toBeTrue();
      tick();
      expect(confirm.alert).toHaveBeenCalledWith('Saved', 'success');
    }));

    it('alerts errorMessage on non-200', fakeAsync(() => {
      doctor.updateCancerExaminationDetails.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' })
      );
      component.ngOnChanges();
      tick();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    }));

    it('alerts error on failure', fakeAsync(() => {
      doctor.updateCancerExaminationDetails.and.returnValue(
        throwingObs('down')
      );
      component.ngOnChanges();
      tick();
      expect(confirm.alert).toHaveBeenCalledWith('down', 'error');
    }));
  });

  describe('view mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'view';
    });

    it('fetches details and patches the form', () => {
      doctor.getCancerExaminationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            breastExamination: { everBreastFed: true },
            imageCoordinates: [],
          },
        })
      );
      component.ngOnChanges();
      expect(doctor.getCancerExaminationDetails).toHaveBeenCalledWith(
        'B1',
        'V1'
      );
      expect(form.value.breastExaminationForm.everBreastFed).toBeTrue();
    });

    it('alerts errorMessage when data is null', fakeAsync(() => {
      doctor.getCancerExaminationDetails.and.returnValue(
        of({ statusCode: 200, data: null, errorMessage: 'none' })
      );
      component.ngOnChanges();
      tick();
      expect(confirm.alert).toHaveBeenCalledWith('none', 'error');
    }));

    it('alerts error on failure', fakeAsync(() => {
      doctor.getCancerExaminationDetails.and.returnValue(throwingObs('x'));
      component.ngOnChanges();
      tick();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    }));
  });

  it('ngOnChanges does nothing for other modes', () => {
    component.mode = 'add';
    component.ngOnChanges();
    expect(doctor.getCancerExaminationDetails).not.toHaveBeenCalled();
    expect(doctor.updateCancerExaminationDetails).not.toHaveBeenCalled();
  });

  describe('filterAnnotatedImageList', () => {
    it('returns the single matching image', () => {
      const list = [{ imageID: 1 }, { imageID: 2 }];
      expect(component.filterAnnotatedImageList(list, 2)).toEqual({
        imageID: 2,
      });
    });
    it('returns undefined when none or many match', () => {
      expect(component.filterAnnotatedImageList([], 1)).toBeUndefined();
      expect(
        component.filterAnnotatedImageList([{ imageID: 1 }, { imageID: 1 }], 1)
      ).toBeUndefined();
    });
  });

  describe('getMergedLymphNodeValues', () => {
    it('merges api values and falls back to service line ids', () => {
      const merged = component.getMergedLymphNodeValues([
        {
          lymphNodeName: ' cervical ',
          size_Left: null,
          size_Right: null,
          mobility_Left: null,
          mobility_Right: null,
        },
        {
          lymphNodeName: 'Cervical',
          size_Left: '2cm',
          size_Right: null,
          mobility_Left: 'Fixed',
          mobility_Right: null,
          vanID: 1,
          parkingPlaceID: 2,
        },
      ]);
      expect(merged).toEqual([
        {
          lymphNodeName: 'Cervical',
          size_Left: '2cm',
          mobility_Left: 'Fixed',
          size_Right: null,
          mobility_Right: null,
          vanID: 1,
          parkingPlaceID: 2,
        },
        {
          lymphNodeName: 'Axillary',
          size_Left: null,
          mobility_Left: null,
          size_Right: null,
          mobility_Right: null,
          vanID: 7,
          parkingPlaceID: 9,
        },
      ]);
    });
  });

  describe('patchExaminationDetails', () => {
    beforeEach(() => fixture.detectChanges());

    it('patches every section', () => {
      component.patchExaminationDetails({
        signsAndSymptoms: { shortnessOfBreath: true },
        BenCancerLymphNodeDetails: [
          {
            lymphNodeName: 'Axillary',
            size_Left: '1cm',
            size_Right: '2cm',
            mobility_Left: null,
            mobility_Right: null,
          },
        ],
        oralExamination: {
          preMalignantLesionType: 'Leukoplakia,Weird lesion,',
          limitedMouthOpening: 'Yes',
        },
        breastExamination: { everBreastFed: false },
        abdominalExamination: { liver: 'Normal' },
        gynecologicalExamination: {
          files: [{ fileName: 'a.png' }],
          typeOfLesion: 'Ulcer,Growth,',
          uterus_Normal: true,
        },
        imageCoordinates: [
          { imageID: 1, a: 1 },
          { imageID: 2, b: 2 },
          { imageID: 3, c: 3 },
          { imageID: 4, d: 4 },
        ],
      });
      const v = form.value;
      expect(v.signsForm.shortnessOfBreath).toBeTrue();
      expect(v.signsForm.lymphNodes[1].size_Left).toBe('1cm');
      expect(v.signsForm.lymphNodes[1].size_Right).toBe('2cm');
      expect(v.signsForm.lymphNodes[0].vanID).toBe(7);
      expect(v.oralExaminationForm.preMalignantLesionTypeList).toEqual([
        'Leukoplakia',
        'Weird lesion',
        'Any other lesion',
      ]);
      expect(v.oralExaminationForm.otherLesionType).toBe('Weird lesion');
      expect(v.oralExaminationForm.image).toEqual({ imageID: 3, c: 3 });
      expect(v.breastExaminationForm.everBreastFed).toBeFalse();
      expect(v.breastExaminationForm.image).toEqual({ imageID: 2, b: 2 });
      expect(v.abdominalExaminationForm.liver).toBe('Normal');
      expect(v.abdominalExaminationForm.image).toEqual({ imageID: 1, a: 1 });
      expect(v.gynecologicalExaminationForm.typeOfLesionList).toEqual([
        'Ulcer',
        'Growth',
      ]);
      expect(v.gynecologicalExaminationForm.image).toEqual({
        imageID: 4,
        d: 4,
      });
      expect(doctor.gynecologicalFiles).toEqual([{ fileName: 'a.png' }]);
    });

    it('does not add other lesion when all oral lesions are known', () => {
      component.patchExaminationDetails({
        oralExamination: { preMalignantLesionType: 'Melanoplakia,' },
        imageCoordinates: [],
      });
      expect(form.value.oralExaminationForm.preMalignantLesionTypeList).toEqual(
        ['Melanoplakia']
      );
      expect(form.value.oralExaminationForm.otherLesionType).toBeNull();
    });

    it('ignores lymph nodes that are not in the form', () => {
      spyOn(component, 'getMergedLymphNodeValues').and.returnValue([
        { lymphNodeName: 'Unknown', size_Left: 'x' },
      ]);
      component.patchExaminationDetails({
        signsAndSymptoms: {},
        BenCancerLymphNodeDetails: [],
      });
      expect(
        form.value.signsForm.lymphNodes.every((n: any) => n.size_Left === null)
      ).toBeTrue();
    });
  });

  it('unsubscribes all subscriptions on destroy', () => {
    fixture.detectChanges();
    component.mode = 'update';
    component.ngOnChanges();
    component.mode = 'view';
    doctor.getCancerExaminationDetails.and.returnValue(
      of({ statusCode: 200, data: {} })
    );
    component.ngOnChanges();
    const subs = [
      component.beneficiaryDetailsSubscription,
      component.fetchExaminationDetailsSubs,
      component.updateExaminationSubs,
    ];
    subs.forEach(s => spyOn(s, 'unsubscribe').and.callThrough());
    component.ngOnDestroy();
    subs.forEach(s => expect(s.unsubscribe).toHaveBeenCalled());
  });

  it('ngOnDestroy is safe with no subscriptions', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
