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
import {
  FormGroup,
  FormBuilder,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { NgIf } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSidenavContainer, MatSidenav } from '@angular/material/sidenav';
import { BeneficiaryDetailsComponent } from '../../core/components/beneficiary-details/beneficiary-details.component';
import {
  MatStepper,
  MatStep,
  MatStepLabel,
  MatStepperNext,
  MatStepperPrevious,
} from '@angular/material/stepper';
import { VisitDetailsComponent } from '../visit-details/visit-details.component';
import { TmVisitDetailsComponent } from '../tm-visit-details/tm-visit-details.component';
import { MatHint } from '@angular/material/select';
import { AncComponent } from '../anc/anc.component';
import { PncComponent } from '../pnc/pnc.component';
import { HistoryComponent } from '../history/history.component';
import { VitalsComponent } from '../vitals/vitals.component';
import { ExaminationComponent } from '../examination/examination.component';
import { IdrsComponent } from '../idrs/idrs.component';
import { CaseRecordComponent } from '../case-record/case-record.component';
import { QuickConsultComponent } from '../quick-consult/quick-consult.component';
import { ReferComponent } from '../refer/refer.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { WorkareaBeneficiaryInfoComponent } from './components/workarea-beneficiary-info/workarea-beneficiary-info.component';
import {
  LucideAngularModule,
  UserCircle,
  ClipboardList,
  Loader2,
} from 'lucide-angular';

import { WorkareaFormService } from '../shared/services/workarea-form.service';

@Component({
  selector: 'app-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.css'],
  imports: [
    NgIf,
    WorkareaBeneficiaryInfoComponent,
    LucideAngularModule,
    MatProgressSpinner,
    MatSidenavContainer,
    MatSidenav,
    BeneficiaryDetailsComponent,
    ReactiveFormsModule,
    MatStepper,
    MatStep,
    MatStepLabel,
    VisitDetailsComponent,
    MatStepperNext,
    TmVisitDetailsComponent,
    MatHint,
    AncComponent,
    MatStepperPrevious,
    PncComponent,
    HistoryComponent,
    VitalsComponent,
    ExaminationComponent,
    IdrsComponent,
    CaseRecordComponent,
    QuickConsultComponent,
    ReferComponent,
    MatIcon,
    MatTooltip,
  ],
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
    private languageComponent: SetLanguageComponent,
    private workareaFormService: WorkareaFormService
  ) {}
  isSpecialist = false;
  doctorUpdateAndTCSubmit: any;
  tmcDisable = false;
  doctorSignatureFlag = false;

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

    this.doctorService
      .checkUsersignatureExist(this.sessionstorage.getItem('userID'))
      .subscribe((res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          this.doctorSignatureFlag = res.data.signStatus;
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
    this.workareaFormService.removeBeneficiaryDataForNurseVisit();
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
    this.workareaFormService.removeBeneficiaryDataForDoctorVisit();
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

    const prescribedDrugs = this.getLabandPrescriptionData();

    if (visitCategory === 'Cancer Screening') {
      if (this.checkCancerRequiredData(this.patientMedicalForm)) {
        this.doctorService
          .saveSpecialistCancerObservation(
            this.patientMedicalForm,
            otherDetails,
            this.doctorSignatureFlag
          )
          .subscribe(
            (res: any) => {
              if (res.statusCode === 200 && res.data !== null) {
                this.patientMedicalForm.reset();
                this.confirmationService.alert(res.data.message, 'success');
                // if (prescribedDrugs.length > 0) {
                //   const prescriptionSmsObject = this.SMSObjectCreation(
                //     [],
                //     prescribedDrugs,
                //     res.data.prescribedDrugIDs
                //   );
                //   this.sendPrescriptionSms(prescriptionSmsObject);
                // }
                this.confirmationService.alert(res.data.message, 'success');
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
            this.schedulerData,
            this.doctorSignatureFlag
          )
          .subscribe(
            (res: any) => {
              if (res.statusCode === 200 && res.data !== null) {
                this.patientMedicalForm.reset();
                sessionStorage.removeItem('instFlag');
                sessionStorage.removeItem('suspectFlag');

                // if (prescribedDrugs.length > 0) {
                //   const prescriptionSmsObject = this.SMSObjectCreation(
                //     [],
                //     prescribedDrugs,
                //     res.data.prescribedDrugIDs
                //   );
                //   this.sendPrescriptionSms(prescriptionSmsObject);
                // } else {
                this.confirmationService.alert(res.data.message, 'success');
                if (this.isSpecialist) {
                  this.router.navigate(['/common/tcspecialist-worklist']);
                } else {
                  this.router.navigate(['/nurse-doctor/doctor-worklist']);
                }
                // }
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
            this.schedulerData,
            this.doctorSignatureFlag
          )
          .subscribe(
            (res: any) => {
              if (res.statusCode === 200 && res.data !== null) {
                this.patientMedicalForm.reset();

                // if (prescribedDrugs.length > 0) {
                //   const prescriptionSmsObject = this.SMSObjectCreation(
                //     [],
                //     prescribedDrugs,
                //     res.data.prescribedDrugIDs
                //   );
                //   this.sendPrescriptionSms(prescriptionSmsObject);
                // } else {
                this.confirmationService.alert(res.data.message, 'success');
                if (this.isSpecialist) {
                  this.router.navigate(['/common/tcspecialist-worklist']);
                } else {
                  this.router.navigate(['/nurse-doctor/doctor-worklist']);
                }
                // }
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
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              this.confirmationService.alert(res.data.message, 'success');
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
    return this.workareaFormService.checkNurseRequirements(
      medicalForm,
      this.visitCategory,
      this.attendantType,
      this.beneficiaryAge,
      this.ncdTemperature,
      this.enableLungAssessment,
      this.rbsPresent,
      this.heamoglobinPresent,
      this.diabetesSelected,
      this.currentLanguageSet
    );
  }

  checkCancerRequiredData(medicalForm: any) {
    return this.workareaFormService.checkCancerRequiredData(
      medicalForm,
      this.visitCategory,
      this.attendantType,
      this.currentLanguageSet
    );
  }
  submitTMPatientVisitForm(medicalForm: any) {
    if (this.checkTMVisitDetailsRequiredData(medicalForm)) {
      this.workareaFormService
        .submitTMPatientVisitForm(medicalForm, this.schedulerData)
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.doctorService.prescribedDrugData = null;
            this.workareaFormService.handleSubmissionSuccess(res, true);
          },
          err => {
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }
  checkTMVisitDetailsRequiredData(medicalForm: any) {
    return this.workareaFormService.checkTMVisitDetailsRequiredData(
      medicalForm,
      this.currentLanguageSet
    );
  }
  checkNCDScreeningRequiredData(medicalForm: any) {
    return this.workareaFormService.checkNCDScreeningRequiredData(
      medicalForm,
      this.visitCategory,
      this.attendantType,
      this.beneficiaryAge,
      this.ncdTemperature,
      this.enableLungAssessment,
      this.rbsPresent,
      this.diabetesSelected,
      this.visualAcuityPresent,
      this.visualAcuityMandatory,
      this.enableProvisionalDiag,
      this.currentLanguageSet
    );
  }

  /**
   * Submit NURSE GENERAL QUICK CONSULT
   */
  submitNurseQuickConsultVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.workareaFormService
        .submitNurseQuickConsultVisitDetails(medicalForm)
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res);
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  /**
   * Submit NURSE GENERAL OPD
   */
  submitNurseGeneralOPDVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.workareaFormService
        .submitNurseGeneralOPDVisitDetails(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res);
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

    // For quick consult doctor flow, ensure at least one prescription exists
    if (this.attendantType === 'doctor') {
      try {
        const quickConsultCaseRecordForm = <FormGroup>(
          this.patientMedicalForm.controls['patientCaseRecordForm']
        );
        const prescription =
          quickConsultCaseRecordForm && quickConsultCaseRecordForm.controls
            ? quickConsultCaseRecordForm.controls['drugPrescriptionForm']
            : null;
        if (prescription) {
          let prescribedDrugs =
            prescription.value && prescription.value.prescribedDrugs
              ? prescription.value.prescribedDrugs
              : [];
          prescribedDrugs = prescribedDrugs.filter((d: any) => !!d.createdBy);
          if (!prescribedDrugs || prescribedDrugs.length === 0) {
            required.push(
              this.currentLanguageSet?.Prescription?.prescriptionRequired ||
                'Please add at least one prescription'
            );
          }
        }
      } catch (err) {
        console.warn(
          'Error validating quick consult prescription presence',
          err
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

      patientQuickConsultFormValue.labTestOrders = labTestOrders;
      patientQuickConsultFormValue.test = undefined;
      patientQuickConsultFormValue.radiology = undefined;
      patientQuickConsultFormValue.refer = this.doctorService.postGeneralRefer(
        this.patientReferForm,
        otherQcDetails
      );

      this.doctorService
        .postQuickConsultDetails(
          { quickConsultation: patientQuickConsultFormValue },
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              // if (prescribedDrugs.length > 0) {
              //   const prescriptionSmsObject = this.SMSObjectCreation(
              //     [],
              //     prescribedDrugs,
              //     res.data.prescribedDrugIDs
              //   );
              //   this.sendPrescriptionSms(prescriptionSmsObject);
              // } else {
              this.confirmationService.alert(res.data.message, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
              // }
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

  SMSObjectCreation(
    diagnosisList: any,
    prescriptions: any,
    prescribedDrugIDs: any
  ) {
    return {
      diagnosisProvided: diagnosisList?.map((d: any) => d.term).join(', '),
      prescribedDrugs: prescriptions?.map((p: any, index: number) => ({
        beneficiaryRegID: this.beneficiaryRegID,
        prescribedDrugID: prescribedDrugIDs[index],
        drugName: p.drugName,
        dosage: `${p.dose} (${p.drugStrength})`,
        frequency: p.frequency,
        noOfDays: p.duration,
      })),
    };
  }

  sendPrescriptionSms(prescriptionSmsObject: any) {
    const dialogRef = this.mdDialog.open(SmsNotificationComponent, {
      width: '900px',
      disableClose: true,
      data: prescriptionSmsObject,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (this.isSpecialist) {
        this.router.navigate(['/common/tcspecialist-worklist']);
      } else {
        this.router.navigate(['/nurse-doctor/doctor-worklist']);
      }
    });
  }

  updateQuickConsultDiagnosisForm() {
    const patientQuickConsultDetails = this.mapDoctorQuickConsultDetails();
    const prescribedDrugs = patientQuickConsultDetails.prescription || [];
    this.doctorService
      .updateQuickConsultDetails(
        { quickConsultation: patientQuickConsultDetails },
        this.schedulerData,
        this.isSpecialist,
        this.doctorSignatureFlag
      )
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.patientMedicalForm.reset();
            // if (prescribedDrugs.length > 0) {
            //   const prescriptionSmsObject = this.SMSObjectCreation(
            //     [],
            //     prescribedDrugs,
            //     res.data.prescribedDrugIDs
            //   );
            //   this.sendPrescriptionSms(prescriptionSmsObject);
            // } else {
            this.confirmationService.alert(res.data.message, 'success');
            if (this.isSpecialist) {
              this.router.navigate(['/common/tcspecialist-worklist']);
            } else {
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
            }
            // }
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

    return patientQuickConsultDetails;
  }
  /**
   * Submit NURSE ANC Details
   */
  submitNurseANCVisitDetails(medicalForm: any) {
    if (this.checkNurseRequirements(medicalForm)) {
      this.workareaFormService
        .submitNurseANCVisitDetails(
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
      this.workareaFormService
        .submitANCDiagnosisForm(
          this.patientMedicalForm,
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res, true);
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
      this.workareaFormService
        .submitNurseCovidcareVisitDetails(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res);
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
      this.workareaFormService
        .submitNurseNCDScreeningVisitDetails(medicalForm, this.visitCategory)
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res);
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
      const prescribedDrugs = this.getLabandPrescriptionData();

      this.doctorService
        .postDoctorNCDCareDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              // if (prescribedDrugs.length > 0) {
              //   const prescriptionSmsObject = this.SMSObjectCreation(
              //     JSON.parse(
              //       JSON.stringify(
              //         (
              //           patientVisitForm.get(
              //             'generalDiagnosisForm.provisionalDiagnosisList'
              //           ) as FormArray
              //         ).value
              //       )
              //     ),
              //     prescribedDrugs,
              //     res.data.prescribedDrugIDs
              //   );
              //   this.sendPrescriptionSms(prescriptionSmsObject);
              // } else {
              this.confirmationService.alert(res.data.message, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
              // }
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

      const prescribedDrugs = this.getLabandPrescriptionData();

      this.doctorService
        .postDoctorNCDScreeningDetails(
          this.patientMedicalForm,
          temp,
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.patientMedicalForm.reset();
              this.removeBeneficiaryDataForDoctorVisit();
              sessionStorage.removeItem('instFlag');
              sessionStorage.removeItem('suspectFlag');
              // if (prescribedDrugs.length > 0) {
              //   const prescriptionSmsObject = this.SMSObjectCreation(
              //     JSON.parse(
              //       JSON.stringify(
              //         (
              //           patientVisitForm.get(
              //             'generalDiagnosisForm.provisionalDiagnosisList'
              //           ) as FormArray
              //         ).value
              //       )
              //     ),
              //     prescribedDrugs,
              //     res.data.prescribedDrugIDs
              //   );
              //   this.sendPrescriptionSms(prescriptionSmsObject);
              // } else {
              this.confirmationService.alert(res.data.message, 'success');
              this.router.navigate(['/nurse-doctor/doctor-worklist']);
              // }
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
      this.workareaFormService
        .submitPatientMedicalDetailsPNC(
          medicalForm,
          this.visitCategory,
          this.beneficiary
        )
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res);
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
      this.workareaFormService
        .submitDoctorGeneralOPDDetails(
          this.patientMedicalForm,
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res, true);
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
      this.workareaFormService
        .submitPNCDiagnosisForm(
          this.patientMedicalForm,
          this.schedulerData,
          this.doctorSignatureFlag
        )
        .subscribe(
          res => {
            this.patientMedicalForm.reset();
            this.workareaFormService.handleSubmissionSuccess(res, true);
          },
          err => {
            this.resetSpinnerandEnableTheSubmitButton();
            this.confirmationService.alert(err, 'error');
          }
        );
    }
  }

  getLabandPrescriptionData() {
    return this.workareaFormService.getLabandPrescriptionData(
      this.patientMedicalForm
    );
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
    this.workareaFormService.warnIfFormDirty(
      event,
      this.patientMedicalForm,
      this.newLookupMode,
      this.currentLanguageSet,
      this.doctorService
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
