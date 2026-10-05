import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { VisitDetailsComponent } from './visit-details.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('VisitDetailsComponent', () => {
  let component: VisitDetailsComponent;
  let fixture: ComponentFixture<VisitDetailsComponent>;
  let mockHttpService: jasmine.SpyObj<HttpServiceService>;
  let mockSessionStorage: jasmine.SpyObj<SessionStorageService>;

  function buildParentForm(): FormGroup {
    return new FormGroup({
      patientVisitDetailsForm: new FormGroup({
        visitCategory: new FormControl(''),
      }),
      covidVaccineStatusForm: new FormGroup({}),
      patientChiefComplaintsForm: new FormGroup({}),
      patientAdherenceForm: new FormGroup({}),
      patientInvestigationsForm: new FormGroup({}),
      patientCovidForm: new FormGroup({}),
      patientFileUploadDetailsForm: new FormGroup({}),
      patientDiseaseForm: new FormGroup({}),
    });
  }

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj('HttpServiceService', [], {
      currentLangugae$: new BehaviorSubject<any>({ test: 'language' }),
    });
    mockSessionStorage = jasmine.createSpyObj('SessionStorageService', [
      'getItem',
      'setItem',
    ]);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [VisitDetailsComponent],
      providers: [
        { provide: HttpServiceService, useValue: mockHttpService },
        { provide: SessionStorageService, useValue: mockSessionStorage },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitDetailsComponent);
    component = fixture.componentInstance;
    component.patientVisitDataForm = buildParentForm();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should extract all sub-forms from the parent form', () => {
      expect(component.patientVisitDetailsForm).toBeTruthy();
      expect(component.covidVaccineStatusForm).toBeTruthy();
      expect(component.patientChiefComplaintsForm).toBeTruthy();
      expect(component.patientAdherenceForm).toBeTruthy();
      expect(component.patientInvestigationsForm).toBeTruthy();
      expect(component.patientCovidForm).toBeTruthy();
      expect(component.patientFileUploadDetailsForm).toBeTruthy();
      expect(component.patientDiseaseForm).toBeTruthy();
    });

    it('should call assignSelectedLanguage', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngOnInit();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });

    it('should call getVisitCategory', () => {
      spyOn(component, 'getVisitCategory');
      component.ngOnInit();
      expect(component.getVisitCategory).toHaveBeenCalled();
    });
  });

  describe('getVisitCategory', () => {
    it('should subscribe to visitCategory valueChanges and call conditionCheck on value change', () => {
      spyOn(component, 'conditionCheck');
      const visitCategoryControl = (
        component.patientVisitDataForm.get(
          'patientVisitDetailsForm'
        ) as FormGroup
      ).controls['visitCategory'];

      visitCategoryControl.setValue('ANC');

      expect(component.visitCategory).toBe('ANC');
      expect(component.conditionCheck).toHaveBeenCalled();
    });

    it('should not call conditionCheck when visitCategory is empty/null', () => {
      spyOn(component, 'conditionCheck');
      const visitCategoryControl = (
        component.patientVisitDataForm.get(
          'patientVisitDetailsForm'
        ) as FormGroup
      ).controls['visitCategory'];

      visitCategoryControl.setValue('');

      expect(component.conditionCheck).not.toHaveBeenCalled();
    });
  });

  describe('conditionCheck', () => {
    it('should call hideAllTab when mode is falsy', () => {
      component.mode = '';
      spyOn(component, 'hideAllTab');
      component.visitCategory = 'ANC';
      component.conditionCheck();
      expect(component.hideAllTab).toHaveBeenCalled();
    });

    it('should not call hideAllTab when mode is set', () => {
      component.mode = 'view';
      spyOn(component, 'hideAllTab');
      component.visitCategory = 'ANC';
      component.conditionCheck();
      expect(component.hideAllTab).not.toHaveBeenCalled();
    });

    it('should set sessionStorage with visitCategory', () => {
      component.visitCategory = 'ANC';
      component.conditionCheck();
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'visiCategoryANC',
        'ANC'
      );
    });

    it('should set flags for NCD screening', () => {
      component.visitCategory = 'NCD screening';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.enableFileSelection).toBeTrue();
      expect(component.showNcdScreeningVisit).toBeTrue();
      expect(component.hideAll).toBeFalse();
    });

    it('should set hideAll false for Cancer Screening', () => {
      component.visitCategory = 'Cancer Screening';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.hideAll).toBeFalse();
    });

    it('should set hideAll false for General OPD (QC)', () => {
      component.visitCategory = 'General OPD (QC)';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.hideAll).toBeFalse();
    });

    it('should show ANC visit when visitCategory is ANC', () => {
      component.visitCategory = 'ANC';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.showANCVisit).toBeTrue();
    });

    it('should show NCD care when visitCategory is NCD care', () => {
      component.visitCategory = 'NCD care';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.showNCDCare).toBeTrue();
    });

    it('should show PNC when visitCategory is PNC', () => {
      component.visitCategory = 'PNC';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.showPNC).toBeTrue();
    });

    it('should show PNC when visitCategory is General OPD', () => {
      component.visitCategory = 'General OPD';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.showPNC).toBeTrue();
    });

    it('should show COVID when visitCategory is COVID-19 Screening', () => {
      component.visitCategory = 'COVID-19 Screening';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.showCOVID).toBeTrue();
    });

    it('should set hideAll false for unknown category', () => {
      component.visitCategory = 'Unknown Category';
      component.mode = 'view';
      component.conditionCheck();
      expect(component.hideAll).toBeFalse();
    });
  });

  describe('hideAllTab', () => {
    it('should reset all visibility flags', () => {
      component.hideAll = true;
      component.showANCVisit = true;
      component.showNCDCare = true;
      component.showPNC = true;
      component.showCOVID = true;
      component.showNcdScreeningVisit = true;

      component.hideAllTab();

      expect(component.hideAll).toBeFalse();
      expect(component.showANCVisit).toBeFalse();
      expect(component.showNCDCare).toBeFalse();
      expect(component.showPNC).toBeFalse();
      expect(component.showCOVID).toBeFalse();
      expect(component.showNcdScreeningVisit).toBeFalse();
    });
  });

  describe('ngDoCheck', () => {
    it('should call assignSelectedLanguage', () => {
      spyOn(component, 'assignSelectedLanguage');
      component.ngDoCheck();
      expect(component.assignSelectedLanguage).toHaveBeenCalled();
    });
  });

  describe('assignSelectedLanguage', () => {
    it('should set current_language_set from the language service', () => {
      component.assignSelectedLanguage();
      expect(component.current_language_set).toEqual({ test: 'language' });
    });
  });
});
