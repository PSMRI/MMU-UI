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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';
import { NurseDoctorRoutingModule } from './nurse-doctor-routing.module';
import { DoctorService } from './shared/services/doctor.service';
import { MasterdataService, NurseService } from './shared/services';
import { WorkareaCanActivate } from './workarea/workarea-can-activate.service';
import { HttpServiceService } from '../core/services/http-service.service';
import { TestInVitalsService } from './shared/services/test-in-vitals.service';
import { IdrsscoreService } from './shared/services/idrsscore.service';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MaterialModule } from '../core/material.module';
import { NurseWorklistComponent } from './nurse-worklist/nurse-worklist.component';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { NurseWorklistTabsComponent } from './nurse-worklist-tabs/nurse-worklist-tabs.component';
import { NurseRefferedWorklistComponent } from './nurse-worklist-tabs/nurse-reffered-worklist/nurse-reffered-worklist.component';
import { WorkareaComponent } from './workarea/workarea.component';
import { VisitDetailsComponent } from './visit-details/visit-details.component';
import { PatientVisitDetailsComponent } from './visit-details/visit-details/visit-details.component';
import { CovidVaccinationStatusComponent } from './visit-details/covid-vaccination-status/covid-vaccination-status.component';
import { ChiefComplaintsComponent } from './visit-details/chief-complaints/chief-complaints.component';
import { AdherenceComponent } from './visit-details/adherence/adherence.component';
import { InvestigationsComponent } from './visit-details/investigations/investigations.component';
import { SymptomsComponent } from './visit-details/symptoms/symptoms.component';
import { ContactHistoryComponent } from './visit-details/contact-history/contact-history.component';
import { TravelHistoryComponent } from './visit-details/travel-history/travel-history.component';
import { UploadFilesComponent } from './visit-details/upload-files/upload-files.component';
import { DiseaseconfirmationComponent } from './visit-details/diseaseconfirmation/diseaseconfirmation.component';
import { AncDetailsComponent } from './anc/anc-details/anc-details.component';
import { AncComponent } from './anc/anc.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ObstetricFormulaComponent } from './anc/obstetric-formula/obstetric-formula.component';
import { AncImmunizationComponent } from './anc/anc-immunization/anc-immunization.component';
import { PncComponent } from './pnc/pnc.component';
import { DoctorWorklistComponent } from './doctor-worklist/doctor-worklist.component';
import { GeneralReferComponent } from './refer/general-refer/general-refer.component';
import { ReferComponent } from './refer/refer.component';
import { CancerReferComponent } from './refer/cancer-refer/cancer-refer.component';
import { CancerCaseRecordComponent } from './case-record/cancer-case-record/cancer-case-record.component';
import { GeneralCaseRecordComponent } from './case-record/general-case-record/general-case-record.component';
import { BeneficiaryPlatformHistoryComponent } from './case-record/beneficiary-platform-history/beneficiary-platform-history.component';
import { BeneficiaryMctsCallHistoryComponent } from './case-record/beneficiary-mcts-call-history/beneficiary-mcts-call-history.component';
import { CaseRecordComponent } from './case-record/case-record.component';
import { TestAndRadiologyComponent } from './case-record/general-case-record/test-and-radiology/test-and-radiology.component';
import { ViewTestReportComponent } from './case-record/general-case-record/test-and-radiology/view-test-report/view-test-report.component';
import { PreviousVisitDetailsComponent } from './case-record/general-case-record/previous-visit-details/previous-visit-details.component';
import { PreviousSignificiantFindingsComponent } from './case-record/general-case-record/previous-significiant-findings/previous-significiant-findings.component';
import { PrescriptionComponent } from './case-record/general-case-record/prescription/prescription.component';
import { FindingsComponent } from './case-record/general-case-record/findings/findings.component';
import { DiagnosisComponent } from './case-record/general-case-record/diagnosis/diagnosis.component';
import { GeneralOpdDiagnosisComponent } from './case-record/general-case-record/diagnosis/general-opd-diagnosis/general-opd-diagnosis.component';
import { AncDiagnosisComponent } from './case-record/general-case-record/diagnosis/anc-diagnosis/anc-diagnosis.component';
import { NcdCareDiagnosisComponent } from './case-record/general-case-record/diagnosis/ncd-care-diagnosis/ncd-care-diagnosis.component';
import { PncDiagnosisComponent } from './case-record/general-case-record/diagnosis/pnc-diagnosis/pnc-diagnosis.component';
import { CovidDiagnosisComponent } from './case-record/general-case-record/diagnosis/covid-diagnosis/covid-diagnosis.component';
import { NcdScreeningDiagnosisComponent } from './case-record/general-case-record/diagnosis/ncd-screening-diagnosis/ncd-screening-diagnosis.component';
import { LabService } from '../lab/shared/services';
import { ExaminationComponent } from './examination/examination.component';
import { SystemicExaminationComponent } from './examination/general-opd-examination/systemic-examination/systemic-examination.component';
import { GeneralOpdExaminationComponent } from './examination/general-opd-examination/general-opd-examination.component';
import { GeneralExaminationComponent } from './examination/general-opd-examination/general-examination/general-examination.component';
import { HeadToToeExaminationComponent } from './examination/general-opd-examination/head-to-toe-examination/head-to-toe-examination.component';
import { ObstetricExaminationComponent } from './examination/general-opd-examination/systemic-examination/obstetric-examination/obstetric-examination.component';
import { OralExaminationComponent } from './examination/cancer-examination/oral-examination/oral-examination.component';
import { BreastExaminationComponent } from './examination/cancer-examination/breast-examination/breast-examination.component';
import { AbdominalExaminationComponent } from './examination/cancer-examination/abdominal-examination/abdominal-examination.component';
import { GynecologicalExaminationComponent } from './examination/cancer-examination/gynecological-examination/gynecological-examination.component';
import { CancerExaminationComponent } from './examination/cancer-examination/cancer-examination.component';
import { RespiratorySystemComponent } from './examination/general-opd-examination/systemic-examination/respiratory-system/respiratory-system.component';
import { MusculoskeletalSystemComponent } from './examination/general-opd-examination/systemic-examination/musculoskeletal-system/musculoskeletal-system.component';
import { GenitoUrinarySystemComponent } from './examination/general-opd-examination/systemic-examination/genito-urinary-system/genito-urinary-system.component';
import { GastroIntestinalSystemComponent } from './examination/general-opd-examination/systemic-examination/gastro-intestinal-system/gastro-intestinal-system.component';
import { CentralNervousSystemComponent } from './examination/general-opd-examination/systemic-examination/central-nervous-system/central-nervous-system.component';
import { CardioVascularSystemComponent } from './examination/general-opd-examination/systemic-examination/cardio-vascular-system/cardio-vascular-system.component';
import { SignsAndSymptomsComponent } from './examination/cancer-examination/signs-and-symptoms/signs-and-symptoms.component';
import { VitalsComponent } from './vitals/vitals.component';
import { CancerPatientVitalsComponent } from './vitals/cancer-patient-vitals/cancer-patient-vitals.component';
import { GeneralPatientVitalsComponent } from './vitals/general-patient-vitals/general-patient-vitals.component';
import { CancerHistoryComponent } from './history/cancer-history/cancer-history.component';
import { FamilyDiseaseHistoryComponent } from './history/cancer-history/family-disease-history/family-disease-history.component';
import { HistoryComponent } from './history/history.component';
import { PersonalHistoryComponent } from './history/cancer-history/personal-history/personal-history.component';
import { ObstetricHistoryComponent } from './history/cancer-history/obstetric-history/obstetric-history.component';
import { GeneralOpdHistoryComponent } from './history/general-opd-history/general-opd-history.component';
import { PastHistoryComponent } from './history/general-opd-history/past-history/past-history.component';
import { ComorbidityConcurrentConditionsComponent } from './history/general-opd-history/comorbidity-concurrent-conditions/comorbidity-concurrent-conditions.component';
import { MedicationHistoryComponent } from './history/general-opd-history/medication-history/medication-history.component';
import { GeneralPersonalHistoryComponent } from './history/general-opd-history/personal-history/personal-history.component';
import { MenstrualHistoryComponent } from './history/general-opd-history/menstrual-history/menstrual-history.component';
import { FamilyHistoryComponent } from './history/general-opd-history/family-history/family-history.component';
import { ImmunizationHistoryComponent } from './history/general-opd-history/immunization-history/immunization-history.component';
import { PastObstericHistoryComponent } from './history/general-opd-history/past-obsteric-history/past-obsteric-history.component';
import { PerinatalHistoryComponent } from './history/general-opd-history/perinatal-history/perinatal-history.component';
import { DevelopmentHistoryComponent } from './history/general-opd-history/development-history/development-history.component';
import { FeedingHistoryComponent } from './history/general-opd-history/feeding-history/feeding-history.component';
import { OtherVaccinesComponent } from './history/general-opd-history/other-vaccines/other-vaccines.component';
import { PhysicalActivityHistoryComponent } from './history/general-opd-history/physical-activity-history/physical-activity-history.component';
import { FamilyHistoryNcdscreeningComponent } from './history/general-opd-history/family-history-ncdscreening/family-history-ncdscreening.component';
import { RadiologistWorklistComponent } from './radiologist-worklist/radiologist-worklist.component';
import { OncologistWorklistComponent } from './oncologist-worklist/oncologist-worklist.component';
import { CancerCaseSheetComponent } from './case-sheet/cancer-case-sheet/cancer-case-sheet.component';
import { GeneralCaseSheetComponent } from './case-sheet/general-case-sheet/general-case-sheet.component';
import { HistoryCaseSheetComponent } from './case-sheet/general-case-sheet/history-case-sheet/history-case-sheet.component';
import { ExaminationCaseSheetComponent } from './case-sheet/general-case-sheet/examination-case-sheet/examination-case-sheet.component';
import { AncCaseSheetComponent } from './case-sheet/general-case-sheet/anc-case-sheet/anc-case-sheet.component';
import { CaseSheetComponent } from './case-sheet/case-sheet.component';
import { PncCaseSheetComponent } from './case-sheet/general-case-sheet/pnc-case-sheet/pnc-case-sheet.component';
import { DoctorDiagnosisCaseSheetComponent } from './case-sheet/general-case-sheet/doctor-diagnosis-case-sheet/doctor-diagnosis-case-sheet.component';
import { ImageToCanvasComponent } from './case-sheet/cancer-case-sheet/image-to-canvas/image-to-canvas.component';
import { CancerDoctorDiagnosisCaseSheetComponent } from './case-sheet/cancer-case-sheet/cancer-doctor-diagnosis-case-sheet/cancer-doctor-diagnosis-case-sheet.component';
import { CancerHistoryCaseSheetComponent } from './case-sheet/cancer-case-sheet/cancer-history-case-sheet/cancer-history-case-sheet.component';
import { CancerExaminationCaseSheetComponent } from './case-sheet/cancer-case-sheet/cancer-examination-case-sheet/cancer-examination-case-sheet.component';
import { PrintPageSelectComponent } from './print-page-select/print-page-select.component';
import { PrescribeTmMedicineComponent } from './case-sheet/prescribe-tm-medicine/prescribe-tm-medicine.component';
import { TmcconfirmationComponent } from './tm-visit-details/tmcconfirmation/tmcconfirmation.component';
import { TmVisitDetailsComponent } from './tm-visit-details/tm-visit-details.component';
import { IdrsComponent } from './idrs/idrs.component';
import { QuickConsultComponent } from './quick-consult/quick-consult.component';
import { NcdScreeningComponent } from './ncd-screening/ncd-screening.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportsComponent } from './reports/reports.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { DoctorInvestigationsComponent } from './case-record/general-case-record/doctor-investigations/doctor-investigations.component';
import { SharedModule } from '../core/components/shared/shared.module';
import { SmsNotificationComponent } from './sms-notification/sms-notification.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';

@NgModule({
  imports: [
    CommonModule,
    NurseDoctorRoutingModule,
    CoreModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    HttpClientModule,
    MaterialModule,
    MatTableModule,
    MatChipsModule,
    MatDatepickerModule,
    NgxPaginationModule,
    SharedModule,
    MatChipsModule,
    MatToolbarModule,
  ],
  declarations: [
    NurseWorklistComponent,
    PrintPageSelectComponent,
    QuickConsultComponent,
    CancerExaminationComponent,
    GynecologicalExaminationComponent,
    AbdominalExaminationComponent,
    BreastExaminationComponent,
    OralExaminationComponent,
    SignsAndSymptomsComponent,
    ObstetricExaminationComponent,
    GenitoUrinarySystemComponent,
    CentralNervousSystemComponent,
    MusculoskeletalSystemComponent,
    RespiratorySystemComponent,
    GastroIntestinalSystemComponent,
    CardioVascularSystemComponent,
    SystemicExaminationComponent,
    HeadToToeExaminationComponent,
    GeneralExaminationComponent,
    GeneralOpdExaminationComponent,
    CancerPatientVitalsComponent,
    GeneralPatientVitalsComponent,
    MedicationHistoryComponent,
    DevelopmentHistoryComponent,
    FeedingHistoryComponent,
    OtherVaccinesComponent,
    ImmunizationHistoryComponent,
    PastObstericHistoryComponent,
    PerinatalHistoryComponent,
    MenstrualHistoryComponent,
    FamilyHistoryComponent,
    ComorbidityConcurrentConditionsComponent,
    GeneralPersonalHistoryComponent,
    PastHistoryComponent,
    GeneralOpdHistoryComponent,
    CancerHistoryComponent,
    ObstetricHistoryComponent,
    FamilyDiseaseHistoryComponent,
    PersonalHistoryComponent,
    DoctorWorklistComponent,
    AncComponent,
    AncDetailsComponent,
    AncImmunizationComponent,
    ObstetricFormulaComponent,
    VisitDetailsComponent,
    PatientVisitDetailsComponent,
    ChiefComplaintsComponent,
    AdherenceComponent,
    InvestigationsComponent,
    UploadFilesComponent,
    HistoryComponent,
    ExaminationComponent,
    CaseRecordComponent,
    VitalsComponent,
    PncComponent,
    NcdScreeningComponent,
    DashboardComponent,
    WorkareaComponent,
    CancerCaseRecordComponent,
    GeneralCaseRecordComponent,
    CancerReferComponent,
    GeneralReferComponent,
    CancerCaseSheetComponent,
    GeneralCaseSheetComponent,
    ReferComponent,
    PrintPageSelectComponent,
    PreviousVisitDetailsComponent,
    FindingsComponent,
    DiagnosisComponent,
    PrescriptionComponent,
    DoctorInvestigationsComponent,
    TestAndRadiologyComponent,
    RadiologistWorklistComponent,
    OncologistWorklistComponent,
    GeneralOpdDiagnosisComponent,
    AncDiagnosisComponent,
    CaseSheetComponent,
    NcdCareDiagnosisComponent,
    PncDiagnosisComponent,
    PreviousSignificiantFindingsComponent,
    ViewTestReportComponent,
    HistoryCaseSheetComponent,
    ExaminationCaseSheetComponent,
    AncCaseSheetComponent,
    PncCaseSheetComponent,
    DoctorDiagnosisCaseSheetComponent,
    ImageToCanvasComponent,
    CancerDoctorDiagnosisCaseSheetComponent,
    CancerHistoryCaseSheetComponent,
    CancerExaminationCaseSheetComponent,
    BeneficiaryMctsCallHistoryComponent,
    BeneficiaryPlatformHistoryComponent,
    ReportsComponent,
    TravelHistoryComponent,
    ContactHistoryComponent,
    SymptomsComponent,
    CovidDiagnosisComponent,
    IdrsComponent,
    PhysicalActivityHistoryComponent,
    FamilyHistoryNcdscreeningComponent,
    NcdScreeningDiagnosisComponent,
    NurseWorklistTabsComponent,
    NurseRefferedWorklistComponent,
    DiseaseconfirmationComponent,
    TmcconfirmationComponent,
    TmVisitDetailsComponent,
    PrescribeTmMedicineComponent,
    CovidVaccinationStatusComponent,
    SmsNotificationComponent,
  ],

  providers: [
    NurseService,
    DoctorService,
    MasterdataService,
    WorkareaCanActivate,
    HttpServiceService,
    IdrsscoreService,
    TestInVitalsService,
    LabService,
  ],
})
export class NurseDoctorModule {}
