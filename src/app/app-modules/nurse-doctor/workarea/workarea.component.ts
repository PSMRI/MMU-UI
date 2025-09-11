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
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  DoCheck,
  OnDestroy,
  AfterViewChecked,
  AfterViewInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import {
  NurseService,
  DoctorService,
  MasterdataService,
} from '../shared/services';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import {
  CancerUtils,
  GeneralUtils,
  QuickConsultUtils,
  VisitDetailUtils,
  NCDScreeningUtils,
} from '../shared/utility';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { Observable, Subscription, of } from 'rxjs';
import { HttpServiceService } from '../../core/services/http-service.service';
import { IdrsscoreService } from '../shared/services/idrsscore.service';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { CanComponentDeactivate } from '../../core/services/can-deactivate-guard.service';
import { OpenPreviousVisitDetailsComponent } from '../../core/components/open-previous-visit-details/open-previous-visit-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SmsNotificationComponent } from '../sms-notification/sms-notification.component';

@Component({
  selector: 'app-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.css'],
})
export class WorkareaComponent
  implements
    OnInit,
    CanComponentDeactivate,
    DoCheck,
    OnDestroy,
    AfterViewChecked,
    AfterViewInit
{
  @ViewChild('sidenav')
  sidenav: any;

  visitMode: any;
  ancMode: any;
  pncMode: any;
  vitalsMode: any;
  historyMode: any;
  examinationMode: any;
  caseRecordMode: any;
  referMode: any;
  ncdScreeningMode: any;
  quickConsultMode: any;
  newLookupMode = false;

  visitCategory: any;
  visitCategoryList: any;

  findings: any;
  currentVitals: any;
  imageCords: Array<any> = [];
  pregnancyStatus: any;
  primeGravidaStatus: any;
  beneficiary: any;
  beneficiaryRegID: any;
  visitID: any;

  showHistory = false;
  showVitals = false;
  showQuickConsult = false;
  showAnc = false;
  showExamination = false;
  showNCDScreening = false;
  showPNC = false;
  showCaseRecord = false;
  showRefer = false;
  showVisitDetails = true;
  showTMVisitDetails = false;

  doctorFlag: any;
  nurseFlag: any;

  patientMedicalForm!: FormGroup;

  tm = false;
  schedulerData: any;
  attendantType: any;
  enableIDRSUpdate = true;
  visualAcuityMandatory!: number;
  diabetesSelected!: number;
  rbsPresent: any = 0;
  visualAcuityPresent: any = 0;
  heamoglobinPresent: any = 0;
  ncdTemperature = false;
  specialistFlag: any;
  dontEnableComponent = false;
  beneficiaryAge: any;
  currentLanguageSet: any;
  tmcSubmitSubscription!: Subscription;
  rbsPresentSubscription!: Subscription;
  visualAcuitySubscription!: Subscription;
  hemoglobinSubscription!: Subscription;
  diabetesSubscription!: Subscription;
  visualAcuityMandatorySubscription!: Subscription;
  ncdTempSubscription!: Subscription;
  enableVitalsButtonSubscription!: Subscription;
  enableUpdateButtonInVitals = false;
  enableCovidVaccinationSaveButton = false;
  disableSubmitButton = false;
  showProgressBar = false;
  enableLungAssessment = false;
  enableProvisionalDiag = false;
  patientVisitForm!: FormGroup;
  patientANCForm!: FormGroup;
  patientPNCForm!: FormGroup;
  patientReferForm!: FormGroup;
  patientCaseRecordForm!: FormGroup;
  patientExaminationForm!: FormGroup;
  patientVitalsForm!: FormGroup;
  patientHistoryForm!: FormGroup;
  patientQuickConsultForm!: FormGroup;
  idrsScreeningForm!: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    private changeDetectorRef: ChangeDetectorRef,
    private masterdataService: MasterdataService,
    private nurseService: NurseService,
    private confirmationService: ConfirmationService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private mdDialog: MatDialog,
    readonly sessionstorage: SessionStorageService,
    private idrsScoreService: IdrsscoreService,
    private languageComponent: SetLanguageComponent
  ) {}
  isSpecialist = false;
  doctorUpdateAndTCSubmit: any;
  tmcDisable = false;
  ngOnInit() {
    this.enableUpdateButtonInVitals = false;
    this.enableCovidVaccinationSaveButton = false;
    this.enableLungAssessment = false;
    this.fetchLanguageResponse();
    this.tmcSubmitSubscription =
      this.idrsScoreService.tmcSubmitDisable$.subscribe(
        response => (this.tmcDisable = response)
      );
    const attendant = this.route.snapshot.params['attendant'];
    this.attendantType = this.route.snapshot.params['attendant'];
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    this.specialistFlag = this.sessionstorage.getItem('specialist_flag');
    this.rbsPresentSubscription =
      this.idrsScoreService.rBSPresentFlag$.subscribe(
        response => (this.rbsPresent = response)
      );
    this.visualAcuitySubscription =
      this.idrsScoreService.visualAcuityPresentFlag$.subscribe(
        response => (this.visualAcuityPresent = response)
      );
    this.hemoglobinSubscription =
      this.idrsScoreService.heamoglobinPresentFlag$.subscribe(
        response => (this.heamoglobinPresent = response)
      );
    this.diabetesSubscription =
      this.idrsScoreService.diabetesSelectedFlag$.subscribe(
        response => (this.diabetesSelected = response)
      ); // to check is pateint diabetics
    this.visualAcuityMandatorySubscription =
      this.idrsScoreService.VisualAcuityTestMandatoryFlag$.subscribe(
        response => (this.visualAcuityMandatory = response)
      ); // if rbs test value > 200
    let disableFlag = this.visitCategory ? true : false;
    if (attendant === 'tcspecialist') {
      this.doctorUpdateAndTCSubmit = this.currentLanguageSet.common.submit;
      this.isSpecialist = true;
    } else {
      this.doctorUpdateAndTCSubmit = this.currentLanguageSet.common.update;
      this.isSpecialist = false;
    }
    if (this.specialistFlag === '100') disableFlag = true;
    this.patientMedicalForm = this.fb.group({
      patientVisitForm: new VisitDetailUtils(
        this.fb,
        this.sessionstorage
      ).createPatientVisitForm(disableFlag),
    });
    this.patientVisitForm = this.patientMedicalForm.get(
      'patientVisitForm'
    ) as FormGroup;

    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitID = this.sessionstorage.getItem('visitID');
    this.nurseFlag = this.sessionstorage.getItem('nurseFlag');
    this.doctorFlag = this.sessionstorage.getItem('doctorFlag');
    this.setVitalsUpdateButtonValue();
    this.getBeneficiaryDetails();
    this.getVisitReasonAndCategory();
    this.getVisitType();
    this.ncdTemperature = false;
    this.enableProvisionalDiag = false;
    this.nurseService.clearMessage();
    this.ncdTempSubscription = this.nurseService.ncdTemp$.subscribe(response =>
      response === undefined
        ? (this.ncdTemperature = false)
        : (this.ncdTemperature = response)
    );

    this.nurseService.enableLAssessment$.subscribe(response => {
      if (response === true) {
        this.enableLungAssessment = true;
      } else {
        this.enableLungAssessment = false;
      }
    });

    this.nurseService.enableProvisionalDiag$.subscribe(response => {
      if (response === true) {
        this.enableProvisionalDiag = true;
      } else {
        this.enableProvisionalDiag = false;
      }
    });
  }

  setVitalsUpdateButtonValue() {
    this.enableVitalsButtonSubscription =
      this.doctorService.enableVitalsUpdateButton$.subscribe((response: any) =>
        response === undefined
          ? (this.enableUpdateButtonInVitals = false)
          : (this.enableUpdateButtonInVitals = response)
      );
  }

  checkMandatory() {
    if (this.visitCategory === null || this.visitCategory === undefined) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.proceedFurther
      );
    }
    if (
      this.nurseService.fileData !== undefined &&
      this.nurseService.fileData.length > 0
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.common.kindlyuploadthefiles
      );
      this.nurseService.fileData = null;
    }
  }

  getVisitType() {
    if (this.specialistFlag === '100') {
      this.showOnlyTMReferred();
    } else if (this.visitCategory) {
      this.handleVisitType(this.visitCategory, 'view');
      this.newLookupMode = false;
    } else {
      this.newLookupMode = true;
      const fG: FormGroup = <FormGroup>(
        this.patientMedicalForm.controls['patientVisitForm']
      );
      (<FormGroup>fG.controls['patientVisitDetailsForm']).controls[
        'visitCategory'
      ].valueChanges.subscribe(categoryValue => {
        if (categoryValue) {
          console.log(categoryValue, 'categoryValue');
          this.masterdataService.reset();
          this.visitCategory = categoryValue;
          this.getNurseMasterData(categoryValue);
          this.handleVisitType(categoryValue);
        }
      });
    }
  }

  handleVisitType(categoryValue: any, mode?: string) {
    if (categoryValue) {
      this.hideAll();

      if (this.specialistFlag !== '100') {
        if (categoryValue === 'General OPD (QC)') {
          if (mode) {
            this.patientMedicalForm.addControl(
              'patientQuickConsultForm',
              new QuickConsultUtils(
                this.fb,
                this.sessionstorage
              ).createQuickConsultForm()
            );
            this.patientQuickConsultForm = this.patientMedicalForm.get(
              'patientQuickConsultForm'
            ) as FormGroup;
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.visitMode = new String(mode);
            this.showQuickConsult = true;
            this.showRefer = true;
            this.quickConsultMode = new String(mode);
            this.referMode = new String(mode);
          } else {
            this.patientMedicalForm.addControl(
              'patientVitalsForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createGeneralVitalDetailsForm()
            );
            this.patientVitalsForm = this.patientMedicalForm.get(
              'patientVitalsForm'
            ) as FormGroup;
            this.showVitals = true;
          }
        } else if (categoryValue === 'Cancer Screening') {
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new CancerUtils(
              this.fb,
              this.sessionstorage
            ).createNurseCancerHistoryForm()
          );
          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new CancerUtils(
              this.fb,
              this.sessionstorage
            ).createNurseCancerPatientVitalsForm()
          );
          this.patientMedicalForm.addControl(
            'patientExaminationForm',
            new CancerUtils(
              this.fb,
              this.sessionstorage
            ).createCancerExaminationForm()
          );
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;
          this.patientExaminationForm = this.patientMedicalForm.get(
            'patientExaminationForm'
          ) as FormGroup;

          this.getCurrentVitals();

          this.showHistory = true;
          this.showVitals = true;
          this.showExamination = true;

          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerDiagnosisForm()
            );
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.patchCancerFindings();

            this.visitMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);
            this.examinationMode = new String(mode);

            this.showCaseRecord = true;
            this.showRefer = true;
          }

          if (mode) {
            this.referMode = new String(mode);
            this.caseRecordMode = new String(mode);
          }
        } else if (categoryValue === 'General OPD') {
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralHistoryForm(false)
          );
          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralVitalDetailsForm()
          );
          this.patientMedicalForm.addControl(
            'patientExaminationForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createPatientExaminationForm()
          );
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;
          this.patientExaminationForm = this.patientMedicalForm.get(
            'patientExaminationForm'
          ) as FormGroup;

          this.getCurrentVitals();

          this.showHistory = true;
          this.showVitals = true;
          this.showExamination = true;

          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createGeneralCaseRecord()
            );

            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.patchGeneralFinding();

            this.visitMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);
            this.examinationMode = new String(mode);

            this.showCaseRecord = true;
            this.showRefer = true;
          }

          if (mode) {
            this.referMode = new String(mode);
            this.caseRecordMode = new String(mode);
          }
        } else if (categoryValue === 'NCD screening') {
          //removed for WDF
          // this.patientMedicalForm.addControl('NCDScreeningForm', new NCDScreeningUtils(this.fb,this.sessionstorage).createNCDScreeningForm());

          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralVitalDetailsForm()
          );
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createNCDScreeningHistoryForm()
          );
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.getCurrentVitals();
          this.showNCDScreening = true;
          this.showHistory = true;
          this.showVitals = true;

          this.patientMedicalForm.addControl(
            'idrsScreeningForm',
            new NCDScreeningUtils(this.fb, this.sessionstorage).createIDRSForm()
          );
          this.idrsScreeningForm = this.patientMedicalForm.get(
            'idrsScreeningForm'
          ) as FormGroup;

          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createNCDScreeningCaseRecord()
            );

            this.patchGeneralFinding();
            this.showCaseRecord = true;
            this.visitMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);
            this.caseRecordMode = new String(mode);
            // this.ncdScreeningMode = new String(mode);
            this.ncdScreeningMode = new String(mode);
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;
            this.showRefer = true;
            this.referMode = new String(mode);
          }
        } else if (categoryValue === 'PNC') {
          this.patientMedicalForm.addControl(
            'patientPNCForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createPatientPNCForm()
          );
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralHistoryForm()
          );
          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralVitalDetailsForm()
          );
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;
          this.patientMedicalForm.addControl(
            'patientExaminationForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createPatientExaminationForm()
          );
          this.patientPNCForm = this.patientMedicalForm.get(
            'patientPNCForm'
          ) as FormGroup;
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;
          this.patientExaminationForm = this.patientMedicalForm.get(
            'patientExaminationForm'
          ) as FormGroup;

          this.getCurrentVitals();

          this.showPNC = true;
          this.showHistory = true;
          this.showVitals = true;
          this.showExamination = true;

          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createPNCCaseRecord()
            );
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.patchGeneralFinding();

            this.visitMode = new String(mode);
            this.pncMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);
            this.examinationMode = new String(mode);

            this.showCaseRecord = true;
            this.showRefer = true;
          }

          if (mode) {
            this.referMode = new String(mode);
            this.caseRecordMode = new String(mode);
          }
        } else if (categoryValue === 'ANC') {
          this.patientMedicalForm.addControl(
            'patientANCForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createPatientANCForm()
          );
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralHistoryForm()
          );
          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralVitalDetailsForm()
          );
          this.patientMedicalForm.addControl(
            'patientExaminationForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createPatientExaminationForm()
          );
          this.patientANCForm = this.patientMedicalForm.get(
            'patientANCForm'
          ) as FormGroup;
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;
          this.patientExaminationForm = this.patientMedicalForm.get(
            'patientExaminationForm'
          ) as FormGroup;

          this.getCurrentVitals();
          this.patchLMPDate();
          this.getPrimeGravidaStatus();
          this.patchGravidaValue();

          this.showAnc = true;
          this.showHistory = true;
          this.showVitals = true;
          this.showExamination = true;
          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createANCCaseRecord()
            );
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.patchGeneralFinding();
            this.getANCDiagnosis();

            this.visitMode = new String(mode);
            this.ancMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);
            this.examinationMode = new String(mode);

            this.showCaseRecord = true;
            this.showRefer = true;
          }

          if (mode) {
            this.referMode = new String(mode);
            this.caseRecordMode = new String(mode);
          }
        } else if (categoryValue === 'NCD care') {
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralHistoryForm(false)
          );
          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralVitalDetailsForm()
          );
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;

          this.getCurrentVitals();

          this.showHistory = true;
          this.showVitals = true;

          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createNCDCareCaseRecord()
            );
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.patchGeneralFinding();

            this.visitMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);

            this.showCaseRecord = true;
            this.showRefer = true;
          }

          if (mode) {
            this.referMode = new String(mode);
            this.caseRecordMode = new String(mode);
          }
        } else if (categoryValue === 'COVID-19 Screening') {
          this.patientMedicalForm.addControl(
            'patientHistoryForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralHistoryForm(false)
          );
          this.patientMedicalForm.addControl(
            'patientVitalsForm',
            new GeneralUtils(
              this.fb,
              this.sessionstorage
            ).createGeneralVitalDetailsForm()
          );
          this.patientHistoryForm = this.patientMedicalForm.get(
            'patientHistoryForm'
          ) as FormGroup;
          this.patientVitalsForm = this.patientMedicalForm.get(
            'patientVitalsForm'
          ) as FormGroup;

          this.getCurrentVitals();

          this.showHistory = true;
          this.showVitals = true;

          if (mode) {
            this.patientMedicalForm.addControl(
              'patientCaseRecordForm',
              new GeneralUtils(
                this.fb,
                this.sessionstorage
              ).createCovidCareCaseRecord()
            );
            this.patientMedicalForm.addControl(
              'patientReferForm',
              new CancerUtils(
                this.fb,
                this.sessionstorage
              ).createCancerReferForm()
            );
            this.patientCaseRecordForm = this.patientMedicalForm.get(
              'patientCaseRecordForm'
            ) as FormGroup;
            this.patientReferForm = this.patientMedicalForm.get(
              'patientReferForm'
            ) as FormGroup;

            this.patchGeneralFinding();

            this.visitMode = new String(mode);
            this.vitalsMode = new String(mode);
            this.historyMode = new String(mode);

            this.showCaseRecord = true;
            this.showRefer = true;
          }

          if (mode) {
            this.referMode = new String(mode);
            this.caseRecordMode = new String(mode);
          }
        }
      } else if (this.specialistFlag === '100') {
        this.showOnlyTMReferred();
      }
    }
  }

  showOnlyTMReferred() {
    this.showVisitDetails = false;
    this.showTMVisitDetails = true;
    this.showQuickConsult = false;
    this.showNCDScreening = false;
    this.showAnc = false;
    this.showHistory = false;
    this.showVitals = false;
    this.showExamination = false;
    this.showPNC = false;
    this.showCaseRecord = false;
    this.showRefer = false;
  }

  hideAll() {
    this.patientMedicalForm.removeControl('patientHistoryForm');
    this.patientMedicalForm.removeControl('patientVitalsForm');
    this.patientMedicalForm.removeControl('patientExaminationForm');
    this.patientMedicalForm.removeControl('patientANCForm');
    this.patientMedicalForm.removeControl('patientCaseRecordForm');
    this.patientMedicalForm.removeControl('patientReferForm');
    this.patientMedicalForm.removeControl('NCDScreeningForm');
    this.patientMedicalForm.removeControl('idrsScreeningForm');
    this.showQuickConsult = false;
    this.showNCDScreening = false;
    this.showAnc = false;
    this.showHistory = false;
    this.showVitals = false;
    this.showExamination = false;
    this.showPNC = false;
    this.showCaseRecord = false;
    this.showRefer = false;

    if (this.attendantType === 'nurse') {
      this.changeDetectorRef.detectChanges();
    }
  }

  submitPatientMedicalDetailsForm(medicalForm: any) {
    this.disableSubmitButton = true;
    this.showProgressBar = true;

    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const serviceID = this.sessionstorage.getItem('serviceID');
    const createdBy = this.sessionstorage.getItem('userName');
    const benVisitDetails = {
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      serviceID: serviceID,
      createdBy: createdBy,
    };
    const temp = {
      beneficiaryRegID: '' + this.sessionstorage.getItem('beneficiaryRegID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };
    if (this.visitCategory === 'Cancer Screening')
      this.submitNurseCancerVisitDetails(medicalForm);

    if (this.visitCategory === 'NCD screening')
      this.submitNurseNCDScreeningVisitDetails(medicalForm);

    if (this.visitCategory === 'General OPD (QC)')
      this.submitNurseQuickConsultVisitDetails(medicalForm);

    if (this.visitCategory === 'ANC')
      this.submitNurseANCVisitDetails(medicalForm);

    if (this.visitCategory === 'PNC')
      this.submitPatientMedicalDetailsPNC(medicalForm);

    if (this.visitCategory === 'General OPD')
      this.submitNurseGeneralOPDVisitDetails(medicalForm);

    if (this.visitCategory === 'NCD care')
      this.submitNurseNCDcareVisitDetails(medicalForm);

    if (this.visitCategory === 'COVID-19 Screening')
      this.submitNurseCovidcareVisitDetails(medicalForm);
  }

  removeBeneficiaryDataForNurseVisit() {
    sessionStorage.removeItem('beneficiaryGender');
    sessionStorage.removeItem('beneficiaryRegID');
    sessionStorage.removeItem('beneficiaryID');
    sessionStorage.removeItem('benFlowID');
  }

  submitDoctorDiagnosisForm() {
    this.disableSubmitButton = true;
    // this.showProgressBar = true;

    if (this.visitCategory === 'Cancer Screening')
      this.submitCancerDiagnosisForm();

    if (this.visitCategory === 'General OPD (QC)')
      this.submitQuickConsultDiagnosisForm();

    if (this.visitCategory === 'ANC') this.submitANCDiagnosisForm();

    if (this.visitCategory === 'PNC') this.submitPNCDiagnosisForm();

    if (this.visitCategory === 'General OPD')
      this.submitGeneralOPDDiagnosisForm();

    if (this.visitCategory === 'NCD care') this.submitNCDCareDiagnosisForm();

    if (this.visitCategory === 'COVID-19 Screening')
      this.submitCovidCareDiagnosisForm();

    if (this.visitCategory === 'NCD screening')
      this.submitNCDScreeningDiagnosisForm();
  }

  removeBeneficiaryDataForDoctorVisit() {
    sessionStorage.removeItem('visitCode');
    sessionStorage.removeItem('beneficiaryGender');
    sessionStorage.removeItem('benFlowID');
    sessionStorage.removeItem('visitCategory');
    sessionStorage.removeItem('beneficiaryRegID');
    sessionStorage.removeItem('visitID');
    sessionStorage.removeItem('beneficiaryID');
    sessionStorage.removeItem('doctorFlag');
    sessionStorage.removeItem('nurseFlag');
    sessionStorage.removeItem('pharmacist_flag');
    sessionStorage.removeItem('caseSheetTMFlag');
  }

  updateDoctorDiagnosisForm() {
    this.disableSubmitButton = true;
    this.showProgressBar = true;
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    const visitCategory = this.sessionstorage.getItem('visitCategory');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const otherDetails = {
      beneficiaryRegID: this.beneficiaryRegID,
      benVisitID: this.visitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      visitCode: this.sessionstorage.getItem('visitCode'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      isSpecialist: this.isSpecialist,
    };

    if (visitCategory === 'Cancer Screening') {
      if (this.checkCancerRequiredData(this.patientMedicalForm)) {
        this.doctorService
          .saveSpecialistCancerObservation(
            this.patientMedicalForm,
            otherDetails
          )
          .subscribe(
            (res: any) => {
              if (res.statusCode === 200 && res.data !== null) {
                this.patientMedicalForm.reset();
                this.confirmationService.alert(res.data.response, 'success');
                if (this.isSpecialist) {
                  this.router.navigate(['/common/tcspecialist-worklist']);
                } else {
                  this.router.navigate(['/nurse-doctor/doctor-worklist']);
                }
              } else {
                this.resetSpinnerandEnableTheSubmitButton();
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            },
            err => {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(err, 'error');
            }
          );
      }
    } else if (visitCategory === 'NCD screening') {
      if (this.checkNCDScreeningRequiredData(this.patientMedicalForm)) {
        this.doctorService
          .updateDoctorDiagnosisDetails(
            this.patientMedicalForm,
            visitCategory,
            otherDetails,
            this.schedulerData
          )
          .subscribe(
            (res: any) => {
              if (res.statusCode === 200 && res.data !== null) {
                this.patientMedicalForm.reset();
                sessionStorage.removeItem('instFlag');
                sessionStorage.removeItem('suspectFlag');
                this.confirmationService.alert(res.data.response, 'success');
                if (this.isSpecialist) {
                  this.router.navigate(['/common/tcspecialist-worklist']);
                } else {
                  this.router.navigate(['/nurse-doctor/doctor-worklist']);
                }
              } else {
                this.resetSpinnerandEnableTheSubmitButton();
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            },
            err => {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(err, 'error');
            }
          );
      }
    } else {
      if (this.checkNurseRequirements(this.patientMedicalForm)) {
        this.doctorService
          .updateDoctorDiagnosisDetails(
            this.patientMedicalForm,
            visitCategory,
            otherDetails,
            this.schedulerData
          )
          .subscribe(
            (res: any) => {
              if (res.statusCode === 200 && res.data !== null) {
                this.patientMedicalForm.reset();
                this.confirmationService.alert(res.data.response, 'success');
                if (this.isSpecialist) {
                  this.router.navigate(['/common/tcspecialist-worklist']);
                } else {
                  this.router.navigate(['/nurse-doctor/doctor-worklist']);
                }
              } else {
                this.resetSpinnerandEnableTheSubmitButton();
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            },
            err => {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(err, 'error');
            }
          );
      }
    }
  }
  idrsChange(value: any) {
    this.enableIDRSUpdate = value;
    console.log('enableIDRSUpdate', this.enableIDRSUpdate);
  }
  /**
   * Submit Nurse Cancer Details
   */
  submitNurseCancerVisitDetails(medicalForm: any) {
    if (this.checkCancerRequiredData(medicalForm)) {
      // check if the form is valid
      const imageCoordiantes = this.getImageCoordinates(medicalForm);
      this.showProgressBar = false;

      this.confirmationService
        .confirm(
          `info`,
          this.currentLanguageSet.alerts.info.doctorVisit,
          'Yes',
          'No'
        )
        .subscribe(result => {
          if (result !== undefined && result !== null)
            this.nurseService
              .postNurseCancerVisitForm(medicalForm, imageCoordiantes, result)
              .subscribe(
                (res: any) => {
                  if (res.statusCode === 200 && res.data !== null) {
                    this.patientMedicalForm.reset();
                    this.removeBeneficiaryDataForNurseVisit();
                    this.confirmationService.alert(
                      res.data.response,
                      'success'
                    );
                    this.router.navigate(['/nurse-doctor/nurse-worklist']);
                  } else if (res.statusCode === 9999) {
                    this.patientMedicalForm.reset();
                    this.removeBeneficiaryDataForNurseVisit();
                    this.confirmationService.alert(res.errorMessage, 'info');
                    this.router.navigate(['/nurse-doctor/nurse-worklist']);
                  } else {
                    this.resetSpinnerandEnableTheSubmitButton();
                    this.confirmationService.alert(res.errorMessage, 'error');
                  }
                },
                err => {
                  this.resetSpinnerandEnableTheSubmitButton();
                  this.confirmationService.alert(err, 'error');
                }
              );
        });
    }
  }

  resetSpinnerandEnableTheSubmitButton() {
    this.disableSubmitButton = false;
    this.showProgressBar = false;
  }

  getImageCoordinates(patientMedicalForm: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const imageCords = [];
    const image1 = (<FormGroup>(
      (<FormGroup>patientMedicalForm.controls.patientExaminationForm).controls[
        'oralExaminationForm'
      ]
    )).controls['image'].value;
    if (image1)
      imageCords.push(
        Object.assign(image1, {
          vanID: JSON.parse(serviceLineDetails).vanID,
          parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
        })
      );
    const image2 = (<FormGroup>(
      (<FormGroup>patientMedicalForm.controls.patientExaminationForm).controls[
        'abdominalExaminationForm'
      ]
    )).controls['image'].value;
    if (image2)
      imageCords.push(
        Object.assign(image2, {
          vanID: JSON.parse(serviceLineDetails).vanID,
          parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
        })
      );
    const image3 = (<FormGroup>(
      (<FormGroup>patientMedicalForm.controls.patientExaminationForm).controls[
        'gynecologicalExaminationForm'
      ]
    )).controls['image'].value;
    if (image3)
      imageCords.push(
        Object.assign(image3, {
          vanID: JSON.parse(serviceLineDetails).vanID,
          parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
        })
      );
    const image4 = (<FormGroup>(
      (<FormGroup>patientMedicalForm.controls.patientExaminationForm).controls[
        'breastExaminationForm'
      ]
    )).controls['image'].value;
    if (image4)
      imageCords.push(
        Object.assign(image4, {
          vanID: JSON.parse(serviceLineDetails).vanID,
          parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
        })
      );

    return imageCords;
  }

  /**
   * Submit Doctor Cancer Details
   */
  submitCancerDiagnosisForm() {
    if (this.checkCancerRequiredData(this.patientMedicalForm)) {
      // check if the form is valid
      this.doctorService
        .postDoctorCancerVisitDetails(
          this.patientMedicalForm,
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  checkNurseRequirements(medicalForm: any) {
    const vitalsForm = <FormGroup>medicalForm.controls['patientVitalsForm'];
    const examinationForm = <FormGroup>(
      this.patientMedicalForm.controls['patientExaminationForm']
    );
    const pncForm = <FormGroup>(
      this.patientMedicalForm.controls['patientPNCForm']
    );
    const ancForm = <FormGroup>(
      this.patientMedicalForm.controls['patientANCForm']
    );
    const covidForm = <FormGroup>medicalForm.controls['patientVisitForm'];
    const covidForm2 = <FormGroup>covidForm.controls['patientCovidForm'];
    const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
    const historyForm = <FormGroup>medicalForm.controls['patientHistoryForm'];

    const required = [];

    if (environment.isMMUOfflineSync) {
      if (
        this.enableLungAssessment === true &&
        this.beneficiaryAge >= 18 &&
        this.nurseService.isAssessmentDone === false
      ) {
        required.push('Please perform Lung Assessment');
      }
    }

    console.log('pncForm', pncForm);

    if (this.visitCategory === 'PNC') {
      if (pncForm.controls['deliveryPlace'].errors) {
        required.push(this.currentLanguageSet.pncData.placeofDelivery);
      }
      if (pncForm.controls['deliveryType'].errors) {
        required.push(this.currentLanguageSet.pncData.typeofDelivery);
      }
    }

    if (this.visitCategory === 'ANC') {
      const ancdetailsForm = <FormGroup>(
        ancForm.controls['patientANCDetailsForm']
      );
      const ANCVitalsForm = <FormGroup>(
        medicalForm.controls['patientVitalsForm']
      );
      console.log('ANCCaseRecordForm', ANCVitalsForm);
      if (ancdetailsForm.controls['primiGravida'].errors) {
        required.push(
          this.currentLanguageSet.ancData.ancDataDetails.primiGravida
        );
      }
      if (ancdetailsForm.controls['lmpDate'].errors) {
        required.push(
          this.currentLanguageSet.ancData.ancDataDetails.lastMenstrualPeriod
        );
      }

      if (this.attendantType === 'doctor') {
        const ANCCaseRecordForm = <FormGroup>(
          medicalForm.controls['patientCaseRecordForm']
        );
        if (this.rbsPresent > 0) {
          let investigationCount = 0;
          const labTestArray =
            ANCCaseRecordForm.controls['generalDoctorInvestigationForm'].value
              .labTest;
          if (
            labTestArray !== undefined &&
            labTestArray !== null &&
            labTestArray.length > 0
          ) {
            labTestArray.forEach((element: any) => {
              if (
                element.procedureName !== null &&
                element.procedureName.toLowerCase() ===
                  environment.RBSTest.toLowerCase()
              ) {
                investigationCount++;
              }
            });
          }

          if (
            investigationCount === 0 &&
            ANCVitalsForm.controls['rbsTestResult'].value === null
          ) {
            required.push(
              this.currentLanguageSet.pleaseSelectRBSTestInInvestigation
            );
          }
        }
        if (this.heamoglobinPresent > 0) {
          let investigationCount = 0;
          const labTestArray =
            ANCCaseRecordForm.controls['generalDoctorInvestigationForm'].value
              .labTest;
          if (
            labTestArray !== null &&
            labTestArray !== undefined &&
            labTestArray.length > 0
          ) {
            labTestArray.forEach((element: any) => {
              if (
                element.procedureName !== null &&
                element.procedureName.toLowerCase() ===
                  environment.haemoglobinTest.toLowerCase()
              ) {
                investigationCount++;
              }
            });
          }

          if (investigationCount === 0) {
            required.push(
              this.currentLanguageSet.pleaseSelectHeamoglobinTestInInvestigation
            );
          }
        }
      }
    }

    if (this.visitCategory !== 'General OPD (QC)') {
      const pregForm = <FormGroup>medicalForm.controls['patientHistoryForm'];
      const pregForm1 = <FormGroup>pregForm.controls['pastObstericHistory'];
      const pregForm2 = <FormGroup>(
        pregForm1.controls['pastObstericHistoryList']
      );
      if (this.attendantType === 'nurse') {
        if (pregForm2.controls) {
          const score1 = Number(pregForm2.controls['length']);
          for (let i = 0; i < score1; i++) {
            const pregForm3 = <FormGroup>pregForm2.controls[i];
            if (
              pregForm3.controls['pregOutcome'].value &&
              pregForm3.controls['pregOutcome'].value.pregOutcome === 'Abortion'
            ) {
              if (
                pregForm3.controls['abortionType'].value &&
                pregForm3.controls['abortionType'].value.complicationValue ===
                  'Induced' &&
                pregForm3.controls['typeofFacility'].errors
              ) {
                required.push(
                  this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .typeofFacility +
                    '-' +
                    this.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
              if (pregForm3.controls['postAbortionComplication'].errors) {
                required.push(
                  this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .complicationPostAbortion +
                    '-' +
                    this.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
              if (pregForm3.controls['abortionType'].errors) {
                required.push(
                  this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .typeOfAbortion +
                    '-' +
                    this.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
              if (pregForm3.controls['pregDuration'].errors) {
                required.push(
                  this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                    .noOfcompletedWeeks +
                    '-' +
                    this.currentLanguageSet.historyData.opdNCDPNCHistory
                      .obstetric.orderofPregnancy +
                    ' ' +
                    pregForm3.value.pregOrder
                );
              }
            }
          }
        }
      }
    }

    if (this.visitCategory === 'COVID-19 Screening') {
      const historyForm = <FormGroup>(
        this.patientMedicalForm.controls['patientHistoryForm']
      );
      console.log('HistoryForm', historyForm);
      const historyForm2 = <FormGroup>(
        historyForm.controls['comorbidityHistory']
      );
      const historyForm3 = <FormArray>(
        historyForm2.controls['comorbidityConcurrentConditionsList']
      );
      const historyForm4 = <FormGroup>historyForm3.controls[0];
      if (historyForm4.controls['comorbidConditions'].errors) {
        required.push(
          this.currentLanguageSet.historyData.ancHistory
            .combordityANC_OPD_NCD_PNC.comorbidConditions
        );
      }
      if (covidForm2.controls['contactStatus'].errors) {
        required.push(this.currentLanguageSet.contactHistory);
      }

      if (covidForm2.controls['travelStatus'].errors) {
        required.push(this.currentLanguageSet.covid.travelHistory);
      }
      if (covidForm2.controls['symptom'].errors) {
        required.push(
          this.currentLanguageSet.ExaminationData.cancerScreeningExamination
            .symptoms.symptoms
        );
      }
    }
    if (
      this.visitCategory === 'General OPD' &&
      this.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      const diagForm2 = <FormArray>(
        diagForm1.controls['provisionalDiagnosisList']
      );
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (diagForm3.controls['provisionalDiagnosis'].errors) {
        required.push(
          this.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              this.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }
    }
    if (this.visitCategory === 'PNC' && this.attendantType === 'doctor') {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      const diagForm2 = <FormArray>(
        diagForm1.controls['provisionalDiagnosisList']
      );
      const diagForm3 = <FormGroup>diagForm2.controls[0];

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              this.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }

      const confirmatorydiagForm = <FormArray>(
        diagForm1.controls['confirmatoryDiagnosisList']
      );

      confirmatorydiagForm.value.filter((item: any) => {
        if (
          item.confirmatoryDiagnosis &&
          (item.conceptID === null ||
            item.conceptID === undefined ||
            item.conceptID === '')
        )
          required.push(
            this.currentLanguageSet.confirmatoryDiagnosisIsNotValid
          );
      });
    }
    if (
      this.visitCategory === 'Cancer Screening' &&
      this.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['diagnosisForm'];
      if (diagForm1.controls['provisionalDiagnosisPrimaryDoctor'].errors) {
        required.push(
          this.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }
    }
    if (
      this.visitCategory === 'COVID-19 Screening' &&
      this.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      console.log('diag', diagForm1);
      if (diagForm1.controls['doctorDiagnosis'].errors) {
        required.push(this.currentLanguageSet.doctorDiagnosis);
      }
    }

    if (this.visitCategory !== 'General OPD (QC)') {
      const personalHistory = historyForm.controls['personalHistory'];
      const allergyList = personalHistory.value.allergicList;

      let snomedTermNotMapped = false;

      if (allergyList.length > 0) {
        for (let i = 0; i < allergyList.length; i++) {
          if (allergyList[i].allergyType !== null) {
            if (
              allergyList[i].snomedCode === null &&
              allergyList[i].snomedTerm !== null
            ) {
              snomedTermNotMapped = true;
            } else if (
              allergyList[i].snomedCode !== null &&
              allergyList[i].snomedTerm === null
            ) {
              snomedTermNotMapped = true;
            }
          }
        }
      }

      if (snomedTermNotMapped) {
        required.push(this.currentLanguageSet.allergyNameIsNotValid);
      }
    }
    if (vitalsForm !== undefined && vitalsForm !== null) {
      if (vitalsForm.controls['systolicBP_1stReading'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .systolicBP
        );
      }
      if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .diastolicBP
        );
      }

      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      }
      if (vitalsForm.controls['temperature'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .temperature
        );
      }
      if (vitalsForm.controls['pulseRate'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .pulseRate
        );
      }
    }
    if (this.visitCategory === 'NCD care') {
      const diagnosisForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      if (diagnosisForm !== undefined) {
        const diagnosisForm1 = <FormGroup>(
          diagnosisForm.controls['generalDiagnosisForm']
        );
        if (diagnosisForm1 !== undefined) {
          const temp =
            diagnosisForm1.controls['ncdScreeningConditionArray'].value;
          if (diagnosisForm1.controls['ncdScreeningConditionArray'].errors) {
            required.push(this.currentLanguageSet.casesheet.ncdCondition);
          }
          let flag = false;
          if (temp !== undefined && temp !== null && temp.length > 0) {
            temp.forEach((element: any) => {
              if (element === 'Other') flag = true;
            });
          }

          console.log(
            diagnosisForm1.controls['ncdScreeningConditionOther'].value
          );
          if (
            flag &&
            diagnosisForm1.controls['ncdScreeningConditionOther'].value === null
          )
            required.push(this.currentLanguageSet.nCDConditionOther);
        }
      }
    }
    console.log('referForm', referForm);
    if (this.attendantType === 'doctor') {
      const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
      if (
        referForm.controls['referredToInstituteName'].value === null &&
        sessionStorage.getItem('instFlag') === 'true' &&
        sessionStorage.getItem('suspectFlag') === 'true'
      ) {
        required.push(
          'this.currentLanguageSet.Referdetails.higherhealthcarecenter'
        );
      }

      if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
        if (
          referForm.controls['refrredToAdditionalServiceList'].value.length > 0
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(this.currentLanguageSet.Referdetails.referralReason);
          }
        } else if (
          referForm.controls['referredToInstituteName'].value !== null
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(this.currentLanguageSet.Referdetails.referralReason);
          }
        }
      } else if (referForm.controls['referredToInstituteName'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }
    console.log(examinationForm, 'examinationForm');
    if (examinationForm !== undefined && examinationForm !== null) {
      const generalExaminationForm = <FormGroup>(
        examinationForm.controls['generalExaminationForm']
      );
      if (generalExaminationForm.controls['typeOfDangerSigns'].errors) {
        required.push(
          this.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.dangersigns
        );
      }
      if (generalExaminationForm.controls['lymphnodesInvolved'].errors) {
        required.push(
          this.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.lymph
        );
      }
      if (generalExaminationForm.controls['typeOfLymphadenopathy'].errors) {
        required.push(
          this.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.typeofLymphadenopathy
        );
      }
      if (generalExaminationForm.controls['extentOfEdema'].errors) {
        required.push(
          this.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.extentofEdema
        );
      }
      if (generalExaminationForm.controls['edemaType'].errors) {
        required.push(
          this.currentLanguageSet.ExaminationData.ANC_OPD_PNCExamination
            .genExamination.typeofEdema
        );
      }
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      this.resetSpinnerandEnableTheSubmitButton();
      return 0;
    } else {
      return 1;
    }
  }

  checkCancerRequiredData(medicalForm: any) {
    const vitalsForm = <FormGroup>medicalForm.controls['patientVitalsForm'];
    const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
    const required = [];

    if (vitalsForm !== undefined && vitalsForm !== null) {
      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight
        );
      }
      if (vitalsForm.controls['systolicBP_1stReading'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .systolicBP
        );
      }
      if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .diastolicBP
        );
      }
    }

    if (
      this.visitCategory === 'Cancer Screening' &&
      this.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      if (diagForm.controls['provisionalDiagnosisPrimaryDoctor'].errors) {
        required.push(
          this.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }
    }

    if (this.attendantType === 'doctor') {
      if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
        if (
          referForm.controls['refrredToAdditionalServiceList'].value.length > 0
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(this.currentLanguageSet.Referdetails.referralReason);
          }
        } else if (referForm.controls['referredToInstituteID'].value !== null) {
          if (referForm.controls['referralReason'].errors) {
            required.push(this.currentLanguageSet.Referdetails.referralReason);
          }
        }
      } else if (referForm.controls['referredToInstituteID'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      this.resetSpinnerandEnableTheSubmitButton();
      return false;
    } else {
      return true;
    }
  }
  submitTMPatientVisitForm(medicalForm: any) {
    if (this.checkTMVisitDetailsRequiredData(medicalForm)) {
      const tmVisitForm = <FormGroup>medicalForm.controls['patientVisitForm'];
      const tmPatientVisitDetails = <FormGroup>(
        tmVisitForm.controls['tmcConfirmationForm'].value
      );
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };
      console.log(
        'TM Patient Visit Details',
        JSON.stringify(tmPatientVisitDetails)
      );
      this.doctorService
        .postTMReferedNurseDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.doctorService.prescribedDrugData = null;
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }
  checkTMVisitDetailsRequiredData(medicalForm: any) {
    const required = [];
    const tmVisitForm = <FormGroup>medicalForm.controls['patientVisitForm'];
    const tmVisitForm2 = <FormGroup>tmVisitForm.controls['tmcConfirmationForm'];
    if (tmVisitForm2.controls['refrredToAdditionalServiceList'].errors) {
      required.push(this.currentLanguageSet.Referdetails.referredtoinstitute);
    }
    console.log('tmVisitForm2', tmVisitForm2);
    if (
      tmVisitForm2.value !== undefined &&
      tmVisitForm2.value.isTMCConfirmed !== undefined &&
      tmVisitForm2.value.isTMCConfirmed === true
    )
      tmVisitForm2.patchValue({ refrredToAdditionalServiceList: null });
    if (tmVisitForm2.controls['tmcConfirmed'].errors) {
      required.push(this.currentLanguageSet.tmcConfirmed);
    }
    console.log('tmVisitForm2', tmVisitForm2);
    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return false;
    } else {
      return true;
    }
  }
  checkNCDScreeningRequiredData(medicalForm: any) {
    //WDF requirement
    // let NCDScreeningForm = <FormGroup>medicalForm.controls['NCDScreeningForm'];
    const NCDScreeningForm = <FormGroup>(
      medicalForm.controls['patientVitalsForm']
    );
    const ncdIDRSScreeningForm = <FormGroup>(
      medicalForm.controls['idrsScreeningForm']
    );
    const required = [];

    if (environment.isMMUOfflineSync) {
      if (
        this.enableLungAssessment === true &&
        this.beneficiaryAge >= 18 &&
        this.nurseService.isAssessmentDone === false
      ) {
        required.push('Please perform Lung Assessment');
      }
    }

    let count = 0;
    const physicalActivityMandatory = <FormGroup>(
      medicalForm.controls['patientHistoryForm'].controls[
        'physicalActivityHistory'
      ]
    );
    if (
      this.attendantType === 'nurse' &&
      this.diabetesSelected === 1 &&
      NCDScreeningForm.controls['rbsCheckBox'].value === true &&
      NCDScreeningForm.controls['rbsTestResult'].value === null
    ) {
      required.push('Please perform RBS Test under Vitals');
    }
    if (this.beneficiary.ageVal >= 30) {
      const familyDiseaseList =
        medicalForm.controls.patientHistoryForm.controls.familyHistory.controls
          .familyDiseaseList.value;
      familyDiseaseList.forEach((element: any) => {
        if (
          element.diseaseType !== null &&
          element.deleted === false &&
          element.diseaseType.diseaseType === 'Diabetes Mellitus'
        ) {
          count++;
        }
      });
      if (count === 0) {
        required.push(
          this.currentLanguageSet.pleaseSelectDiabetesMellitusInFamilyHistory
        );
      }
      if (physicalActivityMandatory.controls['activityType'].errors) {
        required.push(this.currentLanguageSet.physicalActivity);
      }
    }
    let familyMember = 0;
    const familyDiseasesList =
      medicalForm.controls.patientHistoryForm.controls.familyHistory.controls
        .familyDiseaseList.value;
    let familyDiseasesLength = familyDiseasesList.length;
    for (let element = 0; element < familyDiseasesList.length; element++) {
      if (
        familyDiseasesList[element].diseaseType !== null &&
        familyDiseasesList[element].deleted === false
      ) {
        if (
          familyDiseasesList[element].familyMembers !== null &&
          familyDiseasesList[element].familyMembers.length > 0
        ) {
          familyMember++;
        }
      } else {
        familyDiseasesLength--;
      }
    }
    if (familyMember !== familyDiseasesLength) {
      required.push(this.currentLanguageSet.familyMemberInFamilyHistory);
    }
    if (ncdIDRSScreeningForm.controls['requiredList'].value !== null) {
      const ar = ncdIDRSScreeningForm.controls['requiredList'].value;
      for (let i = 0; i < ar.length; i++) {
        if (ar[i] !== 'Hypertension') {
          required.push(ar[i]);
        }
      }
    }

    //WDF requirement -> to check whether RBS test is prescribed or not
    if (this.attendantType === 'doctor') {
      const NCDScreeningCaseRecordForm = <FormGroup>(
        medicalForm.controls['patientCaseRecordForm']
      );
      if (this.rbsPresent > 0 && this.diabetesSelected > 0) {
        let investigationCount = 0;
        const labTestArray =
          NCDScreeningCaseRecordForm.controls['generalDoctorInvestigationForm']
            .value.labTest;
        if (
          labTestArray !== undefined &&
          labTestArray !== null &&
          labTestArray.length > 0
        ) {
          labTestArray.forEach((element: any) => {
            if (
              element.procedureName !== null &&
              element.procedureName.toLowerCase() ===
                environment.RBSTest.toLowerCase()
            ) {
              investigationCount++;
            }
          });
        }

        if (
          investigationCount === 0 &&
          this.diabetesSelected === 1 &&
          NCDScreeningForm.controls['rbsCheckBox'].value === true &&
          NCDScreeningForm.controls['rbsTestResult'].value === null
        ) {
          required.push('Please select RBS Test under Vitals or Investigation');
        }
        if (
          investigationCount === 0 &&
          this.diabetesSelected === 1 &&
          NCDScreeningForm.controls['rbsCheckBox'].value === false &&
          NCDScreeningForm.controls['rbsTestResult'].value === null
        ) {
          required.push('Please select RBS Test under Investigation');
        }
      }
      if (this.visualAcuityPresent > 0 && this.visualAcuityMandatory > 0) {
        let investigationVisualCount = 0;
        const labTestArray =
          NCDScreeningCaseRecordForm.controls['generalDoctorInvestigationForm']
            .value.labTest;
        if (
          labTestArray !== null &&
          labTestArray !== undefined &&
          labTestArray.length > 0
        ) {
          labTestArray.forEach((element: any) => {
            if (
              element.procedureName !== null &&
              element.procedureName.toLowerCase() ===
                environment.visualAcuityTest.toLowerCase()
            ) {
              investigationVisualCount++;
            }
          });
        }

        if (investigationVisualCount === 0) {
          required.push(
            this.currentLanguageSet.pleaseSelectVisualAcuityTestInInvestigation
          );
        }
      }
    }
    //WDF requirement
    if (NCDScreeningForm.controls['height_cm'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .height
      );
    }
    if (NCDScreeningForm.controls['weight_Kg'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
          .weight
      );
    }
    if (NCDScreeningForm.controls['waistCircumference_cm'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.vitalsCancerscreening_QC
          .waistCircumference
      );
    }
    console.log('ncdTemp', this.ncdTemperature);
    if (
      NCDScreeningForm.controls['temperature'].errors &&
      this.ncdTemperature === true
    ) {
      required.push(
        this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .temperature
      );
    }
    if (NCDScreeningForm.controls['pulseRate'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .pulseRate
      );
    }
    if (NCDScreeningForm.controls['systolicBP_1stReading'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .systolicBP
      );
    }
    if (NCDScreeningForm.controls['diastolicBP_1stReading'].errors) {
      required.push(
        this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
          .diastolicBP
      );
    }
    if (this.attendantType === 'doctor') {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );
      const diagForm1 = <FormGroup>diagForm.controls['generalDiagnosisForm'];
      const diagForm2 = <FormArray>(
        diagForm1.controls['provisionalDiagnosisList']
      );
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (
        diagForm3.controls['provisionalDiagnosis'].errors &&
        this.enableProvisionalDiag === true
      ) {
        required.push(
          this.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              this.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }
    }

    if (this.attendantType === 'doctor') {
      const referForm = <FormGroup>medicalForm.controls['patientReferForm'];
      if (
        referForm.controls['referredToInstituteName'].value === null &&
        sessionStorage.getItem('instFlag') === 'true' &&
        sessionStorage.getItem('suspectFlag') === 'true'
      ) {
        required.push(
          this.currentLanguageSet.Referdetails.higherhealthcarecenter
        );
      }
      if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
        if (
          referForm.controls['refrredToAdditionalServiceList'].value.length > 0
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(this.currentLanguageSet.Referdetails.referralReason);
          }
        } else if (
          referForm.controls['referredToInstituteName'].value !== null
        ) {
          if (referForm.controls['referralReason'].errors) {
            required.push(this.currentLanguageSet.Referdetails.referralReason);
          }
        }
      } else if (referForm.controls['referredToInstituteName'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      this.resetSpinnerandEnableTheSubmitButton();
      return false;
    } else {
      return true;
    }
  }

  /**
   * Submit NURSE GENERAL QUICK CONSULT
   */
  submitNurseQuickConsultVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.nurseService.postNurseGeneralQCVisitForm(medicalForm).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.patientMedicalForm.reset();
            this.removeBeneficiaryDataForNurseVisit();
            this.confirmationService.alert(res.data.response, 'success');
            this.router.navigate(['/nurse-doctor/nurse-worklist']);
          } else {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        err => {
          this.resetSpinnerandEnableTheSubmitButton();
          this.confirmationService.alert(err, 'error');
        }
      );
    }
  }

  checkQuickConsultDoctorData(patientMedicalForm: any) {
    const form = <FormGroup>(
      this.patientMedicalForm.controls['patientQuickConsultForm']
    );

    const referForm = <FormGroup>(
      patientMedicalForm.controls['patientReferForm']
    );

    const required = [];

    if (form.controls['chiefComplaintList'].errors) {
      required.push(
        this.currentLanguageSet.nurseData.chiefComplaintsDetails.chiefComplaints
      );
    }
    if (form.controls['clinicalObservation'].errors) {
      required.push(this.currentLanguageSet.casesheet.clinicalObs);
    }
    if (form.controls['provisionalDiagnosisList'].errors) {
      required.push(
        this.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
      );
    }
    if (
      this.visitCategory === 'General OPD (QC)' &&
      this.attendantType === 'doctor'
    ) {
      const diagForm = <FormGroup>(
        this.patientMedicalForm.controls['patientQuickConsultForm']
      );
      const diagForm2 = <FormArray>(
        diagForm.controls['provisionalDiagnosisList']
      );
      console.log('diagForm2', diagForm2);
      const diagForm3 = <FormGroup>diagForm2.controls[0];
      if (diagForm3.controls['provisionalDiagnosis'].errors) {
        required.push(
          this.currentLanguageSet.DiagnosisDetails.provisionaldiagnosis
        );
      }

      if (!diagForm3.controls['provisionalDiagnosis'].errors) {
        diagForm2.value.filter((item: any) => {
          if (
            item.provisionalDiagnosis &&
            (item.conceptID === null ||
              item.conceptID === undefined ||
              item.conceptID === '')
          )
            required.push(
              this.currentLanguageSet.provisionalDiagnosisIsNotValid
            );
        });
      }
    }

    if (referForm.controls['refrredToAdditionalServiceList'].value !== null) {
      if (
        referForm.controls['refrredToAdditionalServiceList'].value.length > 0
      ) {
        if (referForm.controls['referralReason'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      } else if (referForm.controls['referredToInstituteName'].value !== null) {
        if (referForm.controls['referralReason'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      }
    } else if (referForm.controls['referredToInstituteName'].value !== null) {
      if (this.visitCategory === 'FP & Contraceptive Services') {
        if (referForm.controls['referralReasonList'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      } else {
        if (referForm.controls['referralReason'].errors) {
          required.push(this.currentLanguageSet.Referdetails.referralReason);
        }
      }
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      this.resetSpinnerandEnableTheSubmitButton();
      return 0;
    } else {
      return 1;
    }
  }

  /**
   * Submit DOCTOR GENERAL QUICK CONSULT
   */
  submitQuickConsultDiagnosisForm() {
    const otherQcDetails = {
      beneficiaryRegID: this.beneficiaryRegID,
      benVisitID: this.visitID,
      visitCode: this.sessionstorage.getItem('visitCode'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
    };

    const valid = this.checkQuickConsultDoctorData(this.patientMedicalForm);
    if (valid) {
      const patientQuickConsultForm = <FormGroup>(
        this.patientMedicalForm.controls['patientQuickConsultForm']
      );
      const patientQuickConsultFormValue = JSON.parse(
        JSON.stringify(patientQuickConsultForm.value)
      );
      console.log(patientQuickConsultFormValue, 'formValue');
      const chiefComplaintList =
        patientQuickConsultFormValue.chiefComplaintList;
      chiefComplaintList.forEach((element: any) => {
        if (element.chiefComplaint) {
          element.chiefComplaintID = element.chiefComplaint.chiefComplaintID;
          element.chiefComplaint = element.chiefComplaint.chiefComplaint;
        }
      });

      let prescribedDrugs =
        patientQuickConsultFormValue.prescription.prescribedDrugs;
      prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);
      patientQuickConsultFormValue.prescription = prescribedDrugs;

      console.log('prescription:', patientQuickConsultFormValue.prescription);

      let labTestOrders = [];
      if (
        patientQuickConsultFormValue.test !== null &&
        patientQuickConsultFormValue.radiology !== null
      ) {
        labTestOrders = patientQuickConsultFormValue.test.concat(
          patientQuickConsultFormValue.radiology
        );
      } else if (patientQuickConsultFormValue.test !== null) {
        labTestOrders = Object.assign([], patientQuickConsultFormValue.test);
      } else {
        labTestOrders = Object.assign(
          [],
          patientQuickConsultFormValue.radiology
        );
      }
      console.log('labTestOrders:', labTestOrders);

      patientQuickConsultFormValue.labTestOrders = labTestOrders;
      patientQuickConsultFormValue.test = undefined;
      patientQuickConsultFormValue.radiology = undefined;
      patientQuickConsultFormValue.refer = this.doctorService.postGeneralRefer(
        this.patientReferForm,
        otherQcDetails
      );
      console.log(
        'patientQuickConsultFormValue:',
        patientQuickConsultFormValue
      );

      if (labTestOrders.length === 0 && prescribedDrugs.length > 0) {
        const prescriptionSmsObject = this.SMSObjectCreation(
          patientQuickConsultFormValue.provisionalDiagnosisList,
          patientQuickConsultFormValue.prescription
        );

        this.sendPrescriptionSms(prescriptionSmsObject);
      }

      this.doctorService
        .postQuickConsultDetails(
          { quickConsultation: patientQuickConsultFormValue },
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  SMSObjectCreation(diagnosisList: any, prescriptions: any) {
    return {
      beneficiaryRegID: this.beneficiaryRegID,
      prescription: [
        {
          prescriptionID: 'RX' + new Date().getTime(), // unique ID
          diagnosisProvided: diagnosisList.map((d: any) => d.term).join(', '),
          remarks: 'Please follow the prescribed dosage and stay hydrated.',
          prescribedDrugs: prescriptions.map((p: any) => ({
            drugName: p.drugName,
            dosage: `${p.dose} (${p.drugStrength})`,
            frequency: p.frequency,
            noOfDays: p.duration,
          })),
        },
      ],
    };
  }

  sendPrescriptionSms(prescriptionSmsObject: any) {
    const dialogRef = this.mdDialog.open(SmsNotificationComponent, {
      width: '900px',
      disableClose: true,
      data: prescriptionSmsObject,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ SMS flow completed');
      } else {
        console.log('❌ SMS canceled');
      }
    });
  }

  updateQuickConsultDiagnosisForm() {
    const patientQuickConsultDetails = this.mapDoctorQuickConsultDetails();

    this.doctorService
      .updateQuickConsultDetails(
        { quickConsultation: patientQuickConsultDetails },
        this.schedulerData,
        this.isSpecialist
      )
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.patientMedicalForm.reset();
            this.confirmationService.alert(res.data.response, 'success');
            if (this.isSpecialist) {
              this.router.navigate(['/common/tcspecialist-worklist']);
            } else {
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            }
          } else {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        err => {
          this.resetSpinnerandEnableTheSubmitButton();
          this.confirmationService.alert(err, 'error');
        }
      );
  }

  mapDoctorQuickConsultDetails() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const otherQcDetails = {
      beneficiaryRegID: this.beneficiaryRegID,
      benVisitID: this.visitID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      visitCode: this.sessionstorage.getItem('visitCode'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      isSpecialist: this.isSpecialist,
    };
    const patientQuickConsultForm = <FormGroup>(
      this.patientMedicalForm.controls['patientQuickConsultForm']
    );
    const patientQuickConsultDetails = JSON.parse(
      JSON.stringify(patientQuickConsultForm.value)
    );
    let prescribedDrugs =
      patientQuickConsultDetails.prescription.prescribedDrugs;
    prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);
    patientQuickConsultDetails.prescription = prescribedDrugs;

    const chiefComplaintList = patientQuickConsultDetails.chiefComplaintList;
    chiefComplaintList.forEach((element: any) => {
      if (element.chiefComplaint) {
        element.chiefComplaintID = element.chiefComplaint.chiefComplaintID;
        element.chiefComplaint = element.chiefComplaint.chiefComplaint;
      }
    });

    let labTestOrders = [];
    if (
      patientQuickConsultDetails.test !== null &&
      patientQuickConsultDetails.radiology !== null
    ) {
      labTestOrders = patientQuickConsultDetails.test.concat(
        patientQuickConsultDetails.radiology
      );
    } else if (patientQuickConsultDetails.test !== null) {
      labTestOrders = Object.assign([], patientQuickConsultDetails.test);
    } else {
      labTestOrders = Object.assign([], patientQuickConsultDetails.radiology);
    }
    labTestOrders = labTestOrders.filter((test: any) => !test.disabled);

    patientQuickConsultDetails.labTestOrders = labTestOrders;
    patientQuickConsultDetails.chiefComplaintList = chiefComplaintList;
    patientQuickConsultDetails.prescribedDrugs = prescribedDrugs;
    patientQuickConsultDetails.test = undefined;
    patientQuickConsultDetails.radiology = undefined;
    this.patientReferForm = this.patientMedicalForm.get(
      'patientReferForm'
    ) as FormGroup;
    patientQuickConsultDetails.refer = this.doctorService.postGeneralRefer(
      this.patientReferForm,
      otherQcDetails
    );

    if (labTestOrders.length === 0 && prescribedDrugs.length > 0) {
      const prescriptionSmsObject = this.SMSObjectCreation(
        patientQuickConsultDetails.diagnosisList,
        patientQuickConsultDetails.prescribedDrugs
      );
      this.sendPrescriptionSms(prescriptionSmsObject);
    }
    return patientQuickConsultDetails;
  }
  /**
   * Submit NURSE ANC Details
   */
  submitNurseANCVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.nurseService
        .postNurseANCVisitForm(
          medicalForm,
          null,
          this.visitCategory,
          this.beneficiary.ageVal
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForNurseVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  /**
   * Submit DOCTOR ANC Details
   */
  submitANCDiagnosisForm() {
    if (this.checkNurseRequirements(this.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };
      this.getLabandPrescriptionData();

      this.doctorService
        .postDoctorANCDetails(this.patientMedicalForm, temp, this.schedulerData)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  /**
   * Submit Function for NCD Care
   */
  submitNurseNCDcareVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.nurseService
        .postNurseNCDCareVisitForm(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForNurseVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  /**
   * Submit Function for Covid
   */
  submitNurseCovidcareVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.nurseService
        .postNurseCovidCareVisitForm(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForNurseVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  /**
   * Submit Nurse NCD Screening
   */
  submitNurseNCDScreeningVisitDetails(medicalForm: any) {
    if (this.checkNCDScreeningRequiredData(medicalForm)) {
      this.nurseService
        .postNCDScreeningForm(medicalForm, this.visitCategory)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForNurseVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  submitNCDCareDiagnosisForm() {
    if (this.checkNurseRequirements(this.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };

      const patientVisitForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );

      let prescribedDrugs = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'drugPrescriptionForm.prescribedDrugs'
            ) as FormArray
          ).value
        )
      );

      prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);

      console.log('prescription:', prescribedDrugs);

      let labTestOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.labTest'
            ) as FormArray
          ).value
        )
      );
      let radiologyOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.radiologyTest'
            ) as FormArray
          ).value
        )
      );

      labTestOrders = labTestOrders.filter((test: any) => !test.disabled);
      radiologyOrders = radiologyOrders.filter((test: any) => !test.disabled);

      labTestOrders = labTestOrders.concat(radiologyOrders);
      console.log('labTestOrders:', labTestOrders);

      if (
        labTestOrders.length === 0 &&
        prescribedDrugs.length > 0 &&
        this.attendantType === 'doctor'
      ) {
        const prescriptionSmsObject = this.SMSObjectCreation(
          JSON.parse(
            JSON.stringify(
              (
                patientVisitForm.get(
                  'generalDiagnosisForm.provisionalDiagnosisList'
                ) as FormArray
              ).value
            )
          ),
          prescribedDrugs
        );
        this.sendPrescriptionSms(prescriptionSmsObject);
      }
      this.doctorService
        .postDoctorNCDCareDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  submitCovidCareDiagnosisForm() {
    if (this.checkNurseRequirements(this.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };

      const patientVisitForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );

      let prescribedDrugs = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'drugPrescriptionForm.prescribedDrugs'
            ) as FormArray
          ).value
        )
      );

      prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);

      console.log('prescription:', prescribedDrugs);

      let labTestOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.labTest'
            ) as FormArray
          ).value
        )
      );
      let radiologyOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.radiologyTest'
            ) as FormArray
          ).value
        )
      );

      labTestOrders = labTestOrders.filter((test: any) => !test.disabled);
      radiologyOrders = radiologyOrders.filter((test: any) => !test.disabled);

      labTestOrders = labTestOrders.concat(radiologyOrders);
      console.log('labTestOrders:', labTestOrders);

      if (
        labTestOrders.length === 0 &&
        prescribedDrugs.length > 0 &&
        this.attendantType === 'doctor'
      ) {
        const prescriptionSmsObject = this.SMSObjectCreation(
          JSON.parse(
            JSON.stringify(
              (
                patientVisitForm.get(
                  'generalDiagnosisForm.provisionalDiagnosisList'
                ) as FormArray
              ).value
            )
          ),
          prescribedDrugs
        );
        this.sendPrescriptionSms(prescriptionSmsObject);
      }

      this.doctorService
        .postDoctorCovidCareDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }
  submitNCDScreeningDiagnosisForm() {
    if (this.checkNCDScreeningRequiredData(this.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };

      const patientVisitForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );

      let prescribedDrugs = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'drugPrescriptionForm.prescribedDrugs'
            ) as FormArray
          ).value
        )
      );

      prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);

      console.log('prescription:', prescribedDrugs);

      let labTestOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.labTest'
            ) as FormArray
          ).value
        )
      );
      let radiologyOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.radiologyTest'
            ) as FormArray
          ).value
        )
      );

      labTestOrders = labTestOrders.filter((test: any) => !test.disabled);
      radiologyOrders = radiologyOrders.filter((test: any) => !test.disabled);

      labTestOrders = labTestOrders.concat(radiologyOrders);
      console.log('labTestOrders:', labTestOrders);

      if (
        labTestOrders.length === 0 &&
        prescribedDrugs.length > 0 &&
        this.attendantType === 'doctor'
      ) {
        const prescriptionSmsObject = this.SMSObjectCreation(
          JSON.parse(
            JSON.stringify(
              (
                patientVisitForm.get(
                  'generalDiagnosisForm.provisionalDiagnosisList'
                ) as FormArray
              ).value
            )
          ),
          prescribedDrugs
        );
        this.sendPrescriptionSms(prescriptionSmsObject);
      }
      this.doctorService
        .postDoctorNCDScreeningDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              sessionStorage.removeItem('instFlag');
              sessionStorage.removeItem('suspectFlag');
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }
  /**
   * Submit Function for PNC
   *
   */
  submitPatientMedicalDetailsPNC(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.nurseService
        .postNursePNCVisitForm(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForNurseVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  /**
   * Submit Function for General OPD
   *
   */
  submitNurseGeneralOPDVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.nurseService
        .postNurseGeneralOPDVisitForm(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForNurseVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/nurse-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  submitGeneralOPDDiagnosisForm() {
    if (this.checkNurseRequirements(this.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };

      console.log('This is Patient medical form:');
      console.log(this.patientMedicalForm);
      console.log('THis is Scheduler data here');
      console.log(this.schedulerData);

      // const patientVisitForm = <FormGroup>(
      //   this.patientMedicalForm.controls['patientVisitForm']
      // );
      const patientVisitForm = <FormGroup>(
        this.patientMedicalForm.controls['patientCaseRecordForm']
      );

      let prescribedDrugs = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'drugPrescriptionForm.prescribedDrugs'
            ) as FormArray
          ).value
        )
      );

      prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);

      console.log('prescription:', prescribedDrugs);

      let labTestOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.labTest'
            ) as FormArray
          ).value
        )
      );
      let radiologyOrders = JSON.parse(
        JSON.stringify(
          (
            patientVisitForm.get(
              'generalDoctorInvestigationForm.radiologyTest'
            ) as FormArray
          ).value
        )
      );

      labTestOrders = labTestOrders.filter((test: any) => !test.disabled);
      radiologyOrders = radiologyOrders.filter((test: any) => !test.disabled);

      labTestOrders = labTestOrders.concat(radiologyOrders);
      console.log('labTestOrders:', labTestOrders);

      if (
        labTestOrders.length === 0 &&
        prescribedDrugs.length > 0 &&
        this.attendantType === 'doctor'
      ) {
        const prescriptionSmsObject = this.SMSObjectCreation(
          JSON.parse(
            JSON.stringify(
              (
                patientVisitForm.get(
                  'generalDiagnosisForm.provisionalDiagnosisList'
                ) as FormArray
              ).value
            )
          ),
          prescribedDrugs
        );
        this.sendPrescriptionSms(prescriptionSmsObject);
      }

      this.doctorService
        .postDoctorGeneralOPDDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  submitPNCDiagnosisForm() {
    if (this.checkNurseRequirements(this.patientMedicalForm)) {
      const temp = {
        beneficiaryRegID: this.beneficiaryRegID,
        benVisitID: this.visitID,
        visitCode: this.sessionstorage.getItem('visitCode'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        createdBy: this.sessionstorage.getItem('userName'),
      };

      this.getLabandPrescriptionData();
      this.doctorService
        .postDoctorPNCDetails(this.patientMedicalForm, temp, this.schedulerData)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.response, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            } else {
              this.resetSpinnerandEnableTheSubmitButton();
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  getLabandPrescriptionData() {
    const patientVisitForm = <FormGroup>(
      this.patientMedicalForm.controls['patientCaseRecordForm']
    );

    let prescribedDrugs = JSON.parse(
      JSON.stringify(
        (
          patientVisitForm.get(
            'drugPrescriptionForm.prescribedDrugs'
          ) as FormArray
        ).value
      )
    );

    prescribedDrugs = prescribedDrugs.filter((item: any) => !!item.createdBy);

    console.log('prescription:', prescribedDrugs);

    let labTestOrders = JSON.parse(
      JSON.stringify(
        (
          patientVisitForm.get(
            'generalDoctorInvestigationForm.labTest'
          ) as FormArray
        ).value
      )
    );
    let radiologyOrders = JSON.parse(
      JSON.stringify(
        (
          patientVisitForm.get(
            'generalDoctorInvestigationForm.radiologyTest'
          ) as FormArray
        ).value
      )
    );

    labTestOrders = labTestOrders.filter((test: any) => !test.disabled);
    radiologyOrders = radiologyOrders.filter((test: any) => !test.disabled);

    labTestOrders = labTestOrders.concat(radiologyOrders);
    console.log('labTestOrders:', labTestOrders);

    if (
      labTestOrders.length === 0 &&
      prescribedDrugs.length > 0 &&
      this.attendantType === 'doctor'
    ) {
      const prescriptionSmsObject = this.SMSObjectCreation(
        JSON.parse(
          JSON.stringify(
            (
              patientVisitForm.get(
                'generalDiagnosisForm.provisionalDiagnosisList'
              ) as FormArray
            ).value
          )
        ),
        prescribedDrugs
      );
      this.sendPrescriptionSms(prescriptionSmsObject);
    }
  }

  /**
   * update patient data
   */
  updatePatientVitals() {
    this.vitalsMode = new String('update');
  }

  updatePatientHistory() {
    if (this.visitCategory !== 'Cancer Screening') {
      if (this.visitCategory === 'NCD screening') {
        if (this.checkNCDScreeningHistory(this.patientMedicalForm))
          this.historyMode = new String('update');
      } else {
        if (this.checkPastObstericHistory(this.patientMedicalForm))
          this.historyMode = new String('update');
      }
    } else {
      this.historyMode = new String('update');
    }
  }
  checkNCDScreeningHistory(historyForm: any) {
    const required = [];

    let count = 0;
    const familyDiseaseList =
      historyForm.controls.patientHistoryForm.controls.familyHistory.controls
        .familyDiseaseList.value;
    familyDiseaseList.forEach((element: any) => {
      if (
        element.diseaseType !== null &&
        element.deleted === false &&
        element.diseaseType.diseaseType === 'Diabetes Mellitus'
      ) {
        count++;
      }
    });
    if (this.beneficiaryAge < 30) {
      count++;
    }

    if (count === 0) {
      required.push(
        this.currentLanguageSet.pleaseSelectDiabetesMellitusInFamilyHistory
      );
    }
    let familyMember = 0;
    const familyDiseasesList =
      historyForm.controls.patientHistoryForm.controls.familyHistory.controls
        .familyDiseaseList.value;
    let familyDiseasesLength = familyDiseasesList.length;
    for (let element = 0; element < familyDiseasesList.length; element++) {
      if (
        familyDiseasesList[element].diseaseType !== null &&
        familyDiseasesList[element].deleted === false
      ) {
        if (
          familyDiseasesList[element].familyMembers !== null &&
          familyDiseasesList[element].familyMembers.length > 0
        ) {
          familyMember++;
        }
      } else {
        familyDiseasesLength--;
      }
    }
    if (familyMember !== familyDiseasesLength) {
      required.push(this.currentLanguageSet.familyMemberInFamilyHistory);
    }

    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return 0;
    } else {
      return 1;
    }
  }

  checkPastObstericHistory(generalOPDHistory: any) {
    const vitalsForm = <FormGroup>(
      generalOPDHistory.controls['patientHistoryForm']
    );
    const pregForm1 = <FormGroup>vitalsForm.controls['pastObstericHistory'];
    const pregForm2 = <FormGroup>pregForm1.controls['pastObstericHistoryList'];
    const historyForm = <FormGroup>(
      generalOPDHistory.controls['patientHistoryForm']
    );
    const required = [];
    if (pregForm2.controls) {
      const score1 = Number(pregForm2.controls['length']);
      for (let i = 0; i < score1; i++) {
        const pregForm3 = <FormGroup>pregForm2.controls[i];
        if (
          pregForm3.controls['pregOutcome'].value &&
          pregForm3.controls['pregOutcome'].value.pregOutcome === 'Abortion'
        ) {
          if (
            pregForm3.controls['abortionType'].value &&
            pregForm3.controls['abortionType'].value.complicationValue ===
              'Induced' &&
            pregForm3.controls['typeofFacility'].errors
          ) {
            required.push(
              this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .typeofFacility +
                '-' +
                this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
          if (pregForm3.controls['postAbortionComplication'].errors) {
            required.push(
              this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .complicationPostAbortion +
                '-' +
                this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
          if (pregForm3.controls['abortionType'].errors) {
            required.push(
              this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .typeOfAbortion +
                '-' +
                this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
          if (pregForm3.controls['pregDuration'].errors) {
            required.push(
              this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                .noOfcompletedWeeks +
                '-' +
                this.currentLanguageSet.historyData.opdNCDPNCHistory.obstetric
                  .orderofPregnancy +
                ' ' +
                pregForm3.value.pregOrder
            );
          }
        }
      }
    }
    const personalHistory = historyForm.controls['personalHistory'];
    const allergyList = personalHistory.value.allergicList;

    let snomedTermNotMapped = false;

    if (allergyList.length > 0) {
      for (let i = 0; i < allergyList.length; i++) {
        if (allergyList[i].allergyType !== null) {
          if (
            allergyList[i].snomedCode === null &&
            allergyList[i].snomedTerm !== null
          ) {
            snomedTermNotMapped = true;
          } else if (
            allergyList[i].snomedCode !== null &&
            allergyList[i].snomedTerm === null
          ) {
            snomedTermNotMapped = true;
          }
        }
      }
    }

    if (snomedTermNotMapped) {
      required.push(this.currentLanguageSet.allergyNameIsNotValid);
    }
    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      return 0;
    } else {
      return 1;
    }
  }

  updatePatientExamination() {
    this.examinationMode = new String('update');
  }

  updatePatientANC() {
    this.ancMode = new String('update');
  }

  updatePatientPNC() {
    this.pncMode = new String('update');
  }

  updatePatientNcdScreening() {
    const required = [];
    const ncdIDRSScreeningForm = <FormGroup>(
      this.patientMedicalForm.controls['idrsScreeningForm']
    );
    if (ncdIDRSScreeningForm.controls['requiredList'].value !== null) {
      const ar = ncdIDRSScreeningForm.controls['requiredList'].value;
      for (let i = 0; i < ar.length; i++) {
        if (ar[i] !== 'Hypertension') {
          required.push(ar[i]);
        }
      }
    }
    console.log('req', required);
    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
    } else this.ncdScreeningMode = new String('update');
  }

  ngOnDestroy() {
    if (this.visitDetailMasterDataSubscription)
      this.visitDetailMasterDataSubscription.unsubscribe();
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.tmcSubmitSubscription) this.tmcSubmitSubscription.unsubscribe();
    if (this.rbsPresentSubscription) this.rbsPresentSubscription.unsubscribe();
    if (this.visualAcuitySubscription)
      this.visualAcuitySubscription.unsubscribe();
    if (this.hemoglobinSubscription) this.hemoglobinSubscription.unsubscribe();
    if (this.diabetesSubscription) this.diabetesSubscription.unsubscribe();
    if (this.visualAcuityMandatorySubscription)
      this.visualAcuityMandatorySubscription.unsubscribe();
    if (this.ncdTempSubscription) this.ncdTempSubscription.unsubscribe();
    if (this.enableVitalsButtonSubscription)
      this.enableVitalsButtonSubscription.unsubscribe();

    this.doctorService.clearCache();
    this.masterdataService.reset();
  }

  beneficiaryDetailsSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          if (beneficiary) {
            this.beneficiary = beneficiary;
            this.beneficiaryAge = beneficiary.ageVal;
            console.log('beneficiary', beneficiary);
          }
        }
      );
  }

  visitDetailMasterDataSubscription: any;
  getVisitReasonAndCategory() {
    this.masterdataService.getVisitDetailMasterData();
    this.visitDetailMasterDataSubscription =
      this.masterdataService.visitDetailMasterData$.subscribe(visitDetails => {
        if (visitDetails) {
          this.visitCategoryList = visitDetails.visitCategories;
          console.log('Visit Details Master Data', visitDetails);

          if (this.visitCategory) {
            this.getNurseMasterData(this.visitCategory);
            this.getDoctorMasterData(this.visitCategory);
          }
        }
      });
  }

  getNurseMasterData(visitCategory: string) {
    const visitID = this.getVisitCategoryID(visitCategory);
    const serviceProviderID = this.sessionstorage.getItem('providerServiceID');

    if (visitID)
      this.masterdataService.getNurseMasterData(visitID, serviceProviderID);
  }

  getDoctorMasterData(visitCategory: string) {
    const visitID = this.getVisitCategoryID(visitCategory);
    const serviceProviderID = this.sessionstorage.getItem('providerServiceID');

    if (visitID)
      this.masterdataService.getDoctorMasterData(visitID, serviceProviderID);
  }

  getVisitCategoryID(visitCategory: string) {
    if (visitCategory && this.visitCategoryList) {
      const temp = this.visitCategoryList.filter((category: any) => {
        return category.visitCategory === visitCategory;
      });
      if (temp.length > 0) return temp[0].visitCategoryID;
    }
    return null;
  }

  getPregnancyStatus() {
    const pg = <FormGroup>this.patientMedicalForm.controls['patientVisitForm'];
    pg.controls['patientVisitDetailsForm'].valueChanges.subscribe(value => {
      if (value.pregnancyStatus) {
        this.pregnancyStatus = value.pregnancyStatus;
      } else {
        this.pregnancyStatus = null;
      }
    });
  }

  patchGravidaValue() {
    const af = this.patientMedicalForm.controls['patientANCForm'] as FormGroup;
    const pof = (<FormGroup>(
      this.patientMedicalForm.controls['patientHistoryForm']
    )).controls['pastObstericHistory'] as FormGroup;

    (<FormGroup>af.controls['obstetricFormulaForm']).controls[
      'gravida_G'
    ].valueChanges.subscribe(value => {
      if (pof && value && value > 1)
        pof.controls['totalNoOfPreg'].setValue(value);
    });
  }

  getCurrentVitals() {
    this.patientMedicalForm.controls[
      'patientVitalsForm'
    ].valueChanges.subscribe(value => {
      if (value) {
        this.currentVitals = value;
      }
    });
  }

  patchCancerFindings() {
    this.patientMedicalForm.valueChanges.subscribe(
      (patientMedicalForm: any) => {
        this.findings = {
          briefHistory:
            patientMedicalForm.patientExaminationForm.signsForm.observation,
          oralExamination:
            patientMedicalForm.patientExaminationForm.oralExaminationForm
              .observation,
          abdominalExamination:
            patientMedicalForm.patientExaminationForm.abdominalExaminationForm
              .observation,
          gynecologicalExamination:
            patientMedicalForm.patientExaminationForm
              .gynecologicalExaminationForm.observation,
        };
      }
    );
  }

  getANCDiagnosis() {
    const ANCForm = <FormGroup>(
      this.patientMedicalForm.controls['patientANCForm']
    );
    const CaseRecordForm = <FormGroup>(
      this.patientMedicalForm.controls['patientCaseRecordForm']
    );

    ANCForm.controls['obstetricFormulaForm'].valueChanges.subscribe(value => {
      CaseRecordForm.controls['generalDiagnosisForm'].patchValue(value);
    });
    ANCForm.controls['patientANCDetailsForm'].valueChanges.subscribe(value => {
      CaseRecordForm.controls['generalDiagnosisForm'].patchValue(value);
    });
  }

  getPrimeGravidaStatus() {
    const ANCForm = <FormGroup>(
      this.patientMedicalForm.controls['patientANCForm']
    );
    (<FormGroup>ANCForm.controls['patientANCDetailsForm']).controls[
      'primiGravida'
    ].valueChanges.subscribe(value => {
      this.primeGravidaStatus = value;
    });
  }

  patchLMPDate() {
    const patientANCDetailsForm = (<FormGroup>(
      this.patientMedicalForm.controls['patientANCForm']
    )).controls['patientANCDetailsForm'];
    const menstrualHistoryForm = (<FormGroup>(
      this.patientMedicalForm.controls['patientHistoryForm']
    )).controls['menstrualHistory'];

    patientANCDetailsForm.valueChanges.subscribe(value => {
      if (value.lmpDate) {
        const temp = new Date(value.lmpDate);
        menstrualHistoryForm.patchValue({ lMPDate: temp });
      }
    });
  }

  patchGeneralFinding() {
    const patientChiefComplaintsForm = (<FormGroup>(
      this.patientMedicalForm.controls['patientVisitForm']
    )).controls['patientChiefComplaintsForm'];

    patientChiefComplaintsForm.valueChanges.subscribe(value => {
      this.findings = value;
    });
  }

  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
  }

  lableName: any;
  updatePending(event: any) {
    let dirty = false;
    let changedForm: any;

    console.log('eventlabel', event.previouslySelectedStep.label);

    if (!this.newLookupMode) {
      const ancForm = <FormGroup>(
        this.patientMedicalForm.controls['patientANCForm']
      );
      const historyForm = <FormGroup>(
        this.patientMedicalForm.controls['patientHistoryForm']
      );
      const vitalsForm = <FormGroup>(
        this.patientMedicalForm.controls['patientVitalsForm']
      );
      const examinationForm = <FormGroup>(
        this.patientMedicalForm.controls['patientExaminationForm']
      );
      const IDRSForm = <FormGroup>(
        this.patientMedicalForm.controls['idrsScreeningForm']
      );
      const patientVisitFormDet = <FormGroup>(
        this.patientMedicalForm.controls['patientVisitForm']
      );
      const covidVaccinationForm =
        patientVisitFormDet.controls['covidVaccineStatusForm'];

      switch (event.previouslySelectedStep.label) {
        case 'ANC':
          if (ancForm.dirty) {
            this.lableName = event.previouslySelectedStep.label;
            dirty = true;
            changedForm = ancForm;
          }
          break;

        case 'History':
          if (historyForm.dirty) {
            this.lableName = event.previouslySelectedStep.label;
            dirty = true;
            changedForm = historyForm;
          }
          break;

        case 'Vitals':
          if (vitalsForm.dirty || this.enableUpdateButtonInVitals) {
            this.lableName = event.previouslySelectedStep.label;
            dirty = true;
            changedForm = vitalsForm;
          }
          break;

        case 'Examination':
          if (examinationForm.dirty) {
            this.lableName = event.previouslySelectedStep.label;
            dirty = true;
            changedForm = examinationForm;
          }
          break;

        case 'Screening':
          if (this.enableIDRSUpdate === false) {
            this.lableName = event.previouslySelectedStep.label;
            dirty = true;
            changedForm = IDRSForm;
          }
          break;

        case 'Visit Details':
          this.lableName = this.currentLanguageSet.covidVaccinationStatus;
          if (
            this.doctorService.covidVaccineAgeGroup === '>=12 years' &&
            (covidVaccinationForm.dirty === true ||
              this.doctorService.enableCovidVaccinationButton === true)
          ) {
            dirty = true;
            changedForm = covidVaccinationForm;
          }
          break;

        default:
          dirty = false;
          break;
      }
    } else {
      const patientVisitFormDet = <FormGroup>(
        this.patientMedicalForm.controls['patientVisitForm']
      );
      const covidVaccinationForm =
        patientVisitFormDet.controls['covidVaccineStatusForm'];

      switch (event.previouslySelectedStep.label) {
        case 'Visit Details':
          this.lableName = this.currentLanguageSet.covidVaccinationStatus;
          if (
            this.doctorService.covidVaccineAgeGroup === '>=12 years' &&
            (covidVaccinationForm.dirty === true ||
              this.doctorService.enableCovidVaccinationButton === true)
          ) {
            dirty = true;
            changedForm = covidVaccinationForm;
          }
          break;

        default:
          dirty = false;
          break;
      }
    }

    if (dirty)
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.dontForget +
          ' ' +
          this.lableName +
          ' ' +
          this.currentLanguageSet.alerts.info.changes
      );
  }

  sideNavModeChange(sidenav: any) {
    const deviceHeight = window.screen.height;
    const deviceWidth = window.screen.width;
    if (deviceWidth < 700) sidenav.mode = 'over';
    else sidenav.mode = 'side';
    sidenav.toggle();
  }

  canDeactivate(): Observable<boolean> {
    console.log('deactivate called');
    if (this.sessionstorage.getItem('caseSheetTMFlag') === 'true') {
      return of(true);
    } else if (
      (sessionStorage.length > 0 && this.patientMedicalForm.dirty) ||
      this.enableUpdateButtonInVitals
    )
      return this.confirmationService.confirm(
        `info`,
        this.currentLanguageSet.alerts.info.navigateFurtherAlert,
        'Yes',
        'No'
      );
    else return of(true);
  }

  preventSubmitOnEnter(event: Event) {
    event.preventDefault();
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
    if (
      this.currentLanguageSet !== undefined &&
      this.currentLanguageSet !== null
    ) {
      this.setValues();
    }
  }

  setValues() {
    const attendant = this.route.snapshot.params['attendant'];
    if (attendant === 'tcspecialist') {
      this.doctorUpdateAndTCSubmit = this.currentLanguageSet.common.submit;
      this.isSpecialist = true;
    } else {
      this.doctorUpdateAndTCSubmit = this.currentLanguageSet.common.update;
      this.isSpecialist = false;
    }
  }

  openBenPreviousisitDetails() {
    this.mdDialog.open(OpenPreviousVisitDetailsComponent, {
      disableClose: true,
      width: '100%',
      height: 'auto',
      maxWidth: '90vw',
      panelClass: 'preview-casesheet',
      data: {
        previous: true,
      },
    });
  }
  //--End--
}
