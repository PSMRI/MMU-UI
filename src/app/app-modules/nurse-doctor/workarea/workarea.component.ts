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
  ViewContainerRef,
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
import { WorkareaValidationService } from './workarea-validation.service';
import { WorkareaSubmissionService } from './workarea-submission.service';
import { WorkareaLoaderService } from './workarea-loader.service';
import { ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { environment } from 'src/environments/environment';
import { CanComponentDeactivate } from '../../core/services/can-deactivate-guard.service';
import { OpenPreviousVisitDetailsComponent } from '../../core/components/open-previous-visit-details/open-previous-visit-details.component';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { SmsNotificationComponent } from '../sms-notification/sms-notification.component';
import { NgIf } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUserRound, lucideFileText } from '@ng-icons/lucide';
import { BeneficiaryDetailsComponent } from '../../core/components/beneficiary-details/beneficiary-details.component';
import { ZardStepperImports } from 'Common-UI/v2/ui/stepper';
import { ZardSheetComponent } from 'Common-UI/v2/ui/sheet';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardLoaderComponent } from 'Common-UI/v2/ui/loader';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
import { VisitDetailsComponent } from '../visit-details/visit-details.component';
import { TmVisitDetailsComponent } from '../tm-visit-details/tm-visit-details.component';
import { AncComponent } from '../anc/anc.component';
import { PncComponent } from '../pnc/pnc.component';
import { HistoryComponent } from '../history/history.component';
import { VitalsComponent } from '../vitals/vitals.component';
import { ExaminationComponent } from '../examination/examination.component';
import { IdrsComponent } from '../idrs/idrs.component';
import { CaseRecordComponent } from '../case-record/case-record.component';
import { QuickConsultComponent } from '../quick-consult/quick-consult.component';
import { ReferComponent } from '../refer/refer.component';

@Component({
  selector: 'app-workarea',
  templateUrl: './workarea.component.html',
  imports: [
    NgIf,
    NgIcon,
    BeneficiaryDetailsComponent,
    ReactiveFormsModule,
    ...ZardStepperImports,
    ZardSheetComponent,
    ZardButtonComponent,
    ZardLoaderComponent,
    ...tooltipImports,
    VisitDetailsComponent,
    TmVisitDetailsComponent,
    AncComponent,
    PncComponent,
    HistoryComponent,
    VitalsComponent,
    ExaminationComponent,
    IdrsComponent,
    CaseRecordComponent,
    QuickConsultComponent,
    ReferComponent,
  ],
  viewProviders: [provideIcons({ lucideUserRound, lucideFileText })],
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

  // --- Step navigation (replaces mat-horizontal-stepper; z-stepper is display-only) ---
  // `label` mirrors the original <mat-step label="..."> values, which updatePending()
  // switches on via the synthesized `previouslySelectedStep.label`.
  readonly workareaSteps: { key: string; label: string }[] = [
    { key: 'visitDetails', label: 'Visit Details' },
    { key: 'tmVisitDetails', label: 'Visit Details' },
    { key: 'anc', label: 'ANC' },
    { key: 'pnc', label: 'PNC' },
    { key: 'history', label: 'History' },
    { key: 'vitals', label: 'Vitals' },
    { key: 'examination', label: 'Examination' },
    { key: 'ncdScreening', label: 'Screening' },
    { key: 'caseRecord', label: 'Case Record' },
    { key: 'quickConsult', label: '' },
    { key: 'refer', label: 'Refer' },
  ];
  currentStep = 0;
  benSidenavOpen = false;

  get enabledSteps(): { key: string; label: string }[] {
    const shown: Record<string, boolean> = {
      visitDetails: this.showVisitDetails,
      tmVisitDetails: this.showTMVisitDetails,
      anc: this.showAnc,
      pnc: this.showPNC,
      history: this.showHistory,
      vitals: this.showVitals,
      examination: this.showExamination,
      ncdScreening: this.showNCDScreening,
      caseRecord: this.showCaseRecord,
      quickConsult: this.showQuickConsult,
      refer: this.showRefer,
    };
    return this.workareaSteps.filter(step => shown[step.key]);
  }

  get activeStepKey(): string {
    return this.enabledSteps[this.currentStep]?.key ?? '';
  }

  get isLastStep(): boolean {
    return this.currentStep >= this.enabledSteps.length - 1;
  }

  // Keys of steps that have been shown at least once. Once a step is visited it
  // stays rendered (just hidden while inactive) so its component — and the
  // data/option-lists/rows it built — survives navigation, exactly like the old
  // mat-stepper. This is what prevents duplicate FormArray rows and dead
  // dropdowns when returning to a step.
  private renderedSteps = new Set<string>();

  isStepRendered(key: string): boolean {
    return this.activeStepKey === key || this.renderedSteps.has(key);
  }

  private goToStepIndex(target: number): void {
    const steps = this.enabledSteps;
    if (target < 0 || target >= steps.length || target === this.currentStep) {
      return;
    }
    const leaving = steps[this.currentStep];
    if (leaving?.key) this.renderedSteps.add(leaving.key);
    this.currentStep = target;
    if (steps[target]?.key) this.renderedSteps.add(steps[target].key);
    // Preserve the mat-stepper (selectionChange) unsaved-changes warning for the step left.
    this.updatePending({ previouslySelectedStep: { label: leaving?.label } });
  }

  /** Jump straight to a step by clicking its label in the stepper. */
  goToStepKey(key: string): void {
    const idx = this.enabledSteps.findIndex(step => step.key === key);
    if (idx >= 0) this.goToStepIndex(idx);
  }

  nextStep(): void {
    this.goToStepIndex(this.currentStep + 1);
  }

  previousStep(): void {
    this.goToStepIndex(this.currentStep - 1);
  }

  toggleBenSidenav(): void {
    this.benSidenavOpen = !this.benSidenavOpen;
  }

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
    public router: Router,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    private changeDetectorRef: ChangeDetectorRef,
    public masterdataService: MasterdataService,
    public nurseService: NurseService,
    public confirmationService: ConfirmationService,
    public doctorService: DoctorService,
    private route: ActivatedRoute,
    public beneficiaryDetailsService: BeneficiaryDetailsService,
    private readonly mdDialog: ZardDialogService,
    private readonly viewContainerRef: ViewContainerRef,
    readonly sessionstorage: SessionStorageService,
    private idrsScoreService: IdrsscoreService,
    private languageComponent: SetLanguageComponent,
    private readonly workareaValidation: WorkareaValidationService,
    private readonly workareaSubmission: WorkareaSubmissionService,
    private readonly workareaLoader: WorkareaLoaderService
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
    return this.workareaValidation.checkMandatory(this);
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
        } else {
          // Defensive: an unmapped visit category (a master-data value MMU has no
          // flow for, or a mismatch such as a bare 'Screening' reason value reaching
          // here as a category) would otherwise fall through silently and leave a
          // blank page with no sections — the "Screening section is missing" symptom.
          // Surface a clear message instead. All supported categories are handled
          // above and never reach this branch.
          setTimeout(() =>
            this.confirmationService.alert(
              this.currentLanguageSet?.alerts?.info
                ?.visitCategoryNotSupported ||
                'This visit category is not supported. Please re-select the visit category.',
              'info'
            )
          );
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
    // NOTE: no forced changeDetectorRef.detectChanges() here. It was added during
    // the migration but hideAll() runs inside the visitCategory valueChanges
    // handler (i.e. mid change-detection). Forcing CD there while the show* flags
    // flip true->false throws ExpressionChangedAfterItHasBeenCheckedError on a
    // category *change*, aborting handleVisitType() before it rebuilds the steps
    // (stepper collapses to Visit Details, Next dies — bug [31]). The normal CD
    // pass after this handler rebuilds the stepper (Zard steps are reactive).
  }

  submitPatientMedicalDetailsForm(medicalForm: any) {
    return this.workareaSubmission.submitPatientMedicalDetailsForm(
      medicalForm,
      this
    );
  }

  removeBeneficiaryDataForNurseVisit() {
    sessionStorage.removeItem('beneficiaryGender');
    sessionStorage.removeItem('beneficiaryRegID');
    sessionStorage.removeItem('beneficiaryID');
    sessionStorage.removeItem('benFlowID');
  }

  submitDoctorDiagnosisForm() {
    return this.workareaSubmission.submitDoctorDiagnosisForm(this);
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
    return this.workareaSubmission.updateDoctorDiagnosisForm(this);
  }

  idrsChange(value: any) {
    this.enableIDRSUpdate = value;
    console.log('enableIDRSUpdate', this.enableIDRSUpdate);
  }
  /**
   * Submit Nurse Cancer Details
   */
  submitNurseCancerVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseCancerVisitDetails(
      medicalForm,
      this
    );
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
    return this.workareaSubmission.submitCancerDiagnosisForm(this);
  }

  checkNurseRequirements(medicalForm: any) {
    return this.workareaValidation.checkNurseRequirements(medicalForm, this);
  }

  checkCancerRequiredData(medicalForm: any) {
    return this.workareaValidation.checkCancerRequiredData(medicalForm, this);
  }
  submitTMPatientVisitForm(medicalForm: any) {
    return this.workareaSubmission.submitTMPatientVisitForm(medicalForm, this);
  }
  checkTMVisitDetailsRequiredData(medicalForm: any) {
    return this.workareaValidation.checkTMVisitDetailsRequiredData(
      medicalForm,
      this
    );
  }
  checkNCDScreeningRequiredData(medicalForm: any) {
    return this.workareaValidation.checkNCDScreeningRequiredData(
      medicalForm,
      this
    );
  }

  /**
   * Submit NURSE GENERAL QUICK CONSULT
   */
  submitNurseQuickConsultVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseQuickConsultVisitDetails(
      medicalForm,
      this
    );
  }

  checkQuickConsultDoctorData(patientMedicalForm: any) {
    return this.workareaValidation.checkQuickConsultDoctorData(
      patientMedicalForm,
      this
    );
  }

  /**
   * Submit DOCTOR GENERAL QUICK CONSULT
   */
  submitQuickConsultDiagnosisForm() {
    return this.workareaSubmission.submitQuickConsultDiagnosisForm(this);
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
    const dialogRef = this.mdDialog.create<SmsNotificationComponent, unknown>({
      zContent: SmsNotificationComponent,
      zWidth: '900px',
      zMaskClosable: false,
      zData: prescriptionSmsObject,
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
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
    return this.workareaSubmission.updateQuickConsultDiagnosisForm(this);
  }

  mapDoctorQuickConsultDetails() {
    return this.workareaSubmission.mapDoctorQuickConsultDetails(this);
  }
  /**
   * Submit NURSE ANC Details
   */
  submitNurseANCVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseANCVisitDetails(
      medicalForm,
      this
    );
  }

  /**
   * Submit DOCTOR ANC Details
   */
  submitANCDiagnosisForm() {
    return this.workareaSubmission.submitANCDiagnosisForm(this);
  }

  /**
   * Submit Function for NCD Care
   */
  submitNurseNCDcareVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseNCDcareVisitDetails(
      medicalForm,
      this
    );
  }

  /**
   * Submit Function for Covid
   */
  submitNurseCovidcareVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseCovidcareVisitDetails(
      medicalForm,
      this
    );
  }

  /**
   * Submit Nurse NCD Screening
   */
  submitNurseNCDScreeningVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseNCDScreeningVisitDetails(
      medicalForm,
      this
    );
  }

  submitNCDCareDiagnosisForm() {
    return this.workareaSubmission.submitNCDCareDiagnosisForm(this);
  }

  submitCovidCareDiagnosisForm() {
    return this.workareaSubmission.submitCovidCareDiagnosisForm(this);
  }
  submitNCDScreeningDiagnosisForm() {
    return this.workareaSubmission.submitNCDScreeningDiagnosisForm(this);
  }
  /**
   * Submit Function for PNC
   *
   */
  submitPatientMedicalDetailsPNC(medicalForm: any) {
    return this.workareaSubmission.submitPatientMedicalDetailsPNC(
      medicalForm,
      this
    );
  }

  /**
   * Submit Function for General OPD
   *
   */
  submitNurseGeneralOPDVisitDetails(medicalForm: any) {
    return this.workareaSubmission.submitNurseGeneralOPDVisitDetails(
      medicalForm,
      this
    );
  }

  submitGeneralOPDDiagnosisForm() {
    return this.workareaSubmission.submitGeneralOPDDiagnosisForm(this);
  }

  submitPNCDiagnosisForm() {
    return this.workareaSubmission.submitPNCDiagnosisForm(this);
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
    return prescribedDrugs;
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
    return this.workareaValidation.checkNCDScreeningHistory(historyForm, this);
  }

  checkPastObstericHistory(generalOPDHistory: any) {
    return this.workareaValidation.checkPastObstericHistory(
      generalOPDHistory,
      this
    );
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
    return this.workareaLoader.getBeneficiaryDetails(this);
  }

  visitDetailMasterDataSubscription: any;
  getVisitReasonAndCategory() {
    return this.workareaLoader.getVisitReasonAndCategory(this);
  }

  getNurseMasterData(visitCategory: string) {
    return this.workareaLoader.getNurseMasterData(visitCategory, this);
  }

  getDoctorMasterData(visitCategory: string) {
    return this.workareaLoader.getDoctorMasterData(visitCategory, this);
  }

  getVisitCategoryID(visitCategory: string) {
    return this.workareaLoader.getVisitCategoryID(visitCategory, this);
  }

  getPregnancyStatus() {
    return this.workareaLoader.getPregnancyStatus(this);
  }

  patchGravidaValue() {
    return this.workareaLoader.patchGravidaValue(this);
  }

  getCurrentVitals() {
    return this.workareaLoader.getCurrentVitals(this);
  }

  patchCancerFindings() {
    return this.workareaLoader.patchCancerFindings(this);
  }

  getANCDiagnosis() {
    return this.workareaLoader.getANCDiagnosis(this);
  }

  getPrimeGravidaStatus() {
    return this.workareaLoader.getPrimeGravidaStatus(this);
  }

  patchLMPDate() {
    return this.workareaLoader.patchLMPDate(this);
  }

  patchGeneralFinding() {
    return this.workareaLoader.patchGeneralFinding(this);
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
    this.mdDialog.create<OpenPreviousVisitDetailsComponent, unknown>({
      zContent: OpenPreviousVisitDetailsComponent,
      zWidth: '95%',
      zMaskClosable: false,
      zData: {
        previous: true,
      },
      zHideFooter: true,
      zClosable: false,
      zViewContainerRef: this.viewContainerRef,
    });
  }
  //--End--
}
