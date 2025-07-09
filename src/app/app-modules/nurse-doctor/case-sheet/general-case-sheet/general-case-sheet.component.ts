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

import { Component, OnInit, Input, OnDestroy, DoCheck } from '@angular/core';
import { DoctorService } from '../../shared/services/doctor.service';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrescribeTmMedicineComponent } from '../prescribe-tm-medicine/prescribe-tm-medicine.component';
import { NurseService } from '../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { PrintPageSelectComponent } from '../../print-page-select/print-page-select.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-case-sheet',
  templateUrl: './general-case-sheet.component.html',
  styleUrls: ['./general-case-sheet.component.css'],
})
export class GeneralCaseSheetComponent implements OnInit, OnDestroy, DoCheck {
  @Input()
  previous: any;

  @Input()
  serviceType: any;

  caseSheetData: any;
  visitCategory: any;
  hideBack: boolean = false;

  printPagePreviewSelect = {
    caseSheetANC: true,
    caseSheetPNC: true,
    caseSheetHistory: true,
    caseSheetExamination: true,
    caseSheetCovidVaccinationDetails: true,
  };
  enablePrescriptionButton: boolean = false;
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    private location: Location,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.dataStore = this.route.snapshot.params['printablePage'] || 'previous';
    let caseSheetRequest;
    const caseSheetTMFlag: any = this.sessionstorage.getItem('caseSheetTMFlag');
    const specialistFlag = this.sessionstorage.getItem('specialistFlag');

    if (
      (caseSheetTMFlag !== null && caseSheetTMFlag === true) ||
      (specialistFlag !== null && parseInt(specialistFlag) === 200)
    ) {
      if (caseSheetTMFlag === true) {
        this.enablePrescriptionButton = true;
      }
      this.visitCategory = this.sessionstorage.getItem(
        'caseSheetVisitCategory'
      );

      caseSheetRequest = {
        VisitCategory: this.sessionstorage.getItem('caseSheetVisitCategory'),
        benFlowID: this.sessionstorage.getItem('caseSheetBenFlowID'),
        benVisitID: this.sessionstorage.getItem('caseSheetVisitID'),
        beneficiaryRegID: this.sessionstorage.getItem(
          'caseSheetBeneficiaryRegID'
        ),
        visitCode: this.sessionstorage.getItem('caseSheetVisitCode'),
      };
      this.getTMReferredCasesheetData(caseSheetRequest);
    } else {
      if (this.dataStore === 'current') {
        this.visitCategory = this.sessionstorage.getItem(
          'caseSheetVisitCategory'
        );
        caseSheetRequest = {
          VisitCategory: this.sessionstorage.getItem('caseSheetVisitCategory'),
          benFlowID: this.sessionstorage.getItem('caseSheetBenFlowID'),
          benVisitID: this.sessionstorage.getItem('caseSheetVisitID'),
          beneficiaryRegID: this.sessionstorage.getItem(
            'caseSheetBeneficiaryRegID'
          ),
          visitCode: this.sessionstorage.getItem('visitCode'),
        };
        this.getCasesheetData(caseSheetRequest);
      }
      if (this.dataStore === 'previous') {
        this.hideBack = true;

        this.visitCategory = this.sessionstorage.getItem(
          'previousCaseSheetVisitCategory'
        );
        caseSheetRequest = {
          VisitCategory: this.sessionstorage.getItem(
            'previousCaseSheetVisitCategory'
          ),
          benFlowID: this.sessionstorage.getItem('previousCaseSheetBenFlowID'),
          beneficiaryRegID: this.sessionstorage.getItem(
            'previousCaseSheetBeneficiaryRegID'
          ),
          visitCode: this.sessionstorage.getItem('previousCaseSheetVisitCode'),
        };
        this.getCasesheetData(caseSheetRequest);
      }
    }
  }

  dataStore: any;
  ngOnDestroy() {
    if (this.casesheetSubs) this.casesheetSubs.unsubscribe();
  }

  casesheetSubs: any;
  hideSelectQC: boolean = false;

  getTMReferredCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.nurseService
      .getTMReferredCasesheetData(caseSheetRequest)
      .subscribe(
        (res: any) => {
          if (res && res.statusCode === 200 && res.data) {
            this.caseSheetData = res.data;
          } else {
            this.confirmationService
              .alert(res.errorMessage, 'error')
              .afterClosed();
            if (res) {
              this.goBack();
            }
          }
        },
        err => {
          this.confirmationService
            .alert('Error in fetching TM Casesheet', 'error')
            .afterClosed();
          this.goBack();
        }
      );
  }

  getCasesheetData(caseSheetRequest: any) {
    if (this.visitCategory === 'General OPD (QC)' || this.previous) {
      this.hideSelectQC = true;
    }
    if (this.serviceType === 'TM') {
      this.getTMCasesheetData(caseSheetRequest);
    }
    if (this.serviceType === 'MMU') {
      this.getMMUCasesheetData(caseSheetRequest);
    }
  }
  getMMUCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.doctorService
      .getMMUCasesheetData(caseSheetRequest)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          this.caseSheetData = res.data;
          console.log(
            'caseSheetData',
            JSON.stringify(this.caseSheetData, null, 4)
          );
        }
      });
  }
  getTMCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.doctorService
      .getTMCasesheetData(caseSheetRequest)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          this.caseSheetData = res.data;
          console.log(
            'caseSheetData',
            JSON.stringify(this.caseSheetData, null, 4)
          );
        }
      });
  }

  selectPrintPage() {
    const matDialogRef: MatDialogRef<PrintPageSelectComponent> =
      this.dialog.open(PrintPageSelectComponent, {
        width: '420px',
        disableClose: false,
        data: {
          printPagePreviewSelect: this.printPagePreviewSelect,
          visitCategory: this.visitCategory,
        },
      });

    matDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.printPagePreviewSelect.caseSheetANC = result.caseSheetANC;
        this.printPagePreviewSelect.caseSheetPNC = result.caseSheetPNC;
        this.printPagePreviewSelect.caseSheetExamination =
          result.caseSheetExamination;
        this.printPagePreviewSelect.caseSheetHistory = result.caseSheetHistory;
        this.printPagePreviewSelect.caseSheetCovidVaccinationDetails =
          result.caseSheetCovidVaccinationDetails;
      }
    });
  }

  downloadCasesheet() {
    window.print();
  }

  goBack() {
    this.location.back();
  }

  goBackVisitDet() {
    this.confirmationService.alert('Error in fetching TM Casesheet', 'error');
    this.location.back();
  }

  goToTop() {
    window.scrollTo(0, 0);
  }
  prescribeTMMedicine() {
    if (
      this.caseSheetData !== undefined &&
      this.caseSheetData !== null &&
      this.caseSheetData.doctorData.prescription.length > 0
    ) {
      const dialogRef = this.dialog.open(PrescribeTmMedicineComponent, {
        data: {
          height: '560px',
          weight: '680px',
          disableClose: true,
          tmPrescribedDrugs: this.caseSheetData.doctorData.prescription,
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.doctorService.prescribedDrugData = result.prescribedDrugs;
        } else {
          console.log('No prescribed drugs');
        }
      });
    } else {
      this.confirmationService.alert(
        'There is no prescribed drugs from TM specialist'
      );
      console.log('There is no prescribed drugs from TM specialist');
    }
  }

  // AV40085804 13/10/2021 Integrating Multilingual Functionality -----Start-----
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  // -----End------
}
