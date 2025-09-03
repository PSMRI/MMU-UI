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
  Input,
  DoCheck,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ValidationUtils } from '../../shared/utility/validation-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';

import { VisitDetailUtils } from '../../shared/utility/visit-detail-utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-patient-chief-complaints',
  templateUrl: './chief-complaints.component.html',
  styleUrls: ['./chief-complaints.component.css'],
})
export class ChiefComplaintsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  patientChiefComplaintsForm!: FormGroup;

  @Input()
  mode!: string;

  formUtility: any;

  complaintDuration = ['Hours', 'Days', 'Weeks', 'Months', 'Years'];

  benChiefComplaints: any;

  chiefComplaintMaster: any;
  chiefComplaintTemporarayList: any = [];
  selectedChiefComplaintList: any = [];
  suggestedChiefComplaintList: any[] = [];
  currentLanguageSet: any;
  enableLungAssessment = false;
  enableProvisionalDiag = false;
  displayedColumns: any = [
    'chiefComplaint',
    'duration',
    'unitOfDuration',
    'description',
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private nurseService: NurseService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService
  ) {
    this.formUtility = new VisitDetailUtils(this.fb, this.sessionstorage);
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getNurseMasterData();
    this.getBeneficiaryDetails();
    this.enableLungAssessment = false;
    this.enableProvisionalDiag = false;
    this.nurseService.clearNCDScreeningProvision();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getCheifComplaints(): AbstractControl[] | null {
    const chiefComplaintsControl =
      this.patientChiefComplaintsForm.get('complaints');
    return chiefComplaintsControl instanceof FormArray
      ? chiefComplaintsControl.controls
      : null;
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe(data => {
        if (data?.chiefComplaintMaster) {
          this.chiefComplaintMaster = data.chiefComplaintMaster.slice();
          this.chiefComplaintTemporarayList[0] =
            this.chiefComplaintMaster.slice();

          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getChiefComplaints(benRegID, visitID);
          }
        }
      });
  }

  getChiefComplaintDetails: any;
  getChiefComplaints(benRegID: any, visitID: any) {
    this.getChiefComplaintDetails = this.doctorService
      .getVisitComplaintDetails(benRegID, visitID)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          const visitComplaintDetail = value.data;
          if (visitComplaintDetail)
            this.benChiefComplaints = visitComplaintDetail.BenChiefComplaints;
          this.dataSource.data = [];
          this.dataSource.data = visitComplaintDetail.BenChiefComplaints;
          this.dataSource.paginator = this.paginator;
          let flag = false;
          this.enableLungAssessment = false;
          this.enableProvisionalDiag = false;
          if (
            this.benChiefComplaints !== undefined &&
            this.benChiefComplaints.length > 0
          ) {
            for (let i = 0; i < this.benChiefComplaints.length; i++) {
              this.enableProvisionalDiag = true;
              if (
                this.benChiefComplaints[i]?.chiefComplaint?.toLowerCase() ===
                'fever'
              ) {
                flag = true;
                break;
              }
              if (environment.isMMUOfflineSync) {
                if (
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('fever') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('cough') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('congestion') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('breathing problems') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('asthma') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('copd') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('influenza') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('pneumonia') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('tuberculosis') ||
                  this.benChiefComplaints[i]?.chiefComplaint
                    ?.toLowerCase()
                    .includes('lung cancer')
                ) {
                  this.enableLungAssessment = true;
                  break;
                }
              }
            }
          }
          if (flag) this.nurseService.setNCDTemp(true);
          else this.nurseService.setNCDTemp(false);

          if (this.enableLungAssessment)
            this.nurseService.setEnableLAssessment(true);
          else this.nurseService.setEnableLAssessment(false);

          if (this.enableProvisionalDiag)
            this.nurseService.setNCDScreeningProvision(true);
          else this.nurseService.setNCDScreeningProvision(false);
        }
      });
  }

  getSCTid(event: any, index: any) {
    this.masterdataService.getSnomedCTRecord(event.chiefComplaint).subscribe(
      (res: any) => {
        if (res && res.statusCode === 200) {
          this.loadConceptID(res.data, index);
        }
      },
      error => {}
    );
  }

  onInputDuration(complaintForm: AbstractControl) {
    if (complaintForm.value.duration) {
      complaintForm.get('unitOfDuration')?.enable();
    } else {
      complaintForm.get('unitOfDuration')?.disable();
      complaintForm.get('unitOfDuration')?.reset();
    }
  }

  reEnterChiefComplaint(complaintForm: AbstractControl) {
    if (complaintForm.value.chiefComplaint) {
      complaintForm.get('duration')?.enable();
      complaintForm.get('description')?.enable();
    } else {
      complaintForm.get('duration')?.disable();
      complaintForm.get('duration')?.reset();
      complaintForm.get('unitOfDuration')?.disable();
      complaintForm.get('unitOfDuration')?.reset();
      complaintForm.get('description')?.disable();
      complaintForm.get('description')?.reset();
    }
  }

  loadConceptID(data: any, index: any) {
    const id = <FormArray>(
      this.patientChiefComplaintsForm.controls['complaints']
    );
    id.at(index).patchValue({
      conceptID: data.conceptID,
    });
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.getChiefComplaintDetails)
      this.getChiefComplaintDetails.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }

  beneficiaryDetailSubscription: any;
  beneficiary: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        beneficiary => {
          this.beneficiary = beneficiary;
        }
      );
  }

  filterComplaints(chiefComplaintValue: any, i: any) {
    this.suggestChiefComplaintList(
      this.fb.group({ chiefComplaint: chiefComplaintValue }),
      i
    );
    const arr = this.chiefComplaintMaster.filter((item: any) => {
      return item.chiefComplaint === chiefComplaintValue.chiefComplaint;
    });

    if (this.selectedChiefComplaintList?.[i]) {
      this.chiefComplaintTemporarayList.map((item: any, t: any) => {
        if (t !== i) {
          item.push(this.selectedChiefComplaintList[i]);
          this.sortChiefComplaintList(item);
        }
      });
    }

    if (arr.length > 0) {
      this.chiefComplaintTemporarayList.map((item: any, t: any) => {
        const index = item.indexOf(arr[0]);
        if (index !== -1 && t !== i) item.splice(index, 1);
      });
      this.selectedChiefComplaintList[i] = arr[0];
    }
    this.enableLungAssessment = false;
    this.enableProvisionalDiag = false;
    let flag = false;
    if (
      this.selectedChiefComplaintList !== null &&
      this.selectedChiefComplaintList !== undefined &&
      this.selectedChiefComplaintList.length > 0
    ) {
      this.selectedChiefComplaintList.forEach((val: any) => {
        this.enableProvisionalDiag = true;
        if (val?.chiefComplaint?.toLowerCase() === 'fever') flag = true;
        if (environment.isMMUOfflineSync) {
          if (
            val?.chiefComplaint?.toLowerCase().includes('fever') ||
            val?.chiefComplaint?.toLowerCase().includes('cough') ||
            val?.chiefComplaint?.toLowerCase().includes('congestion') ||
            val?.chiefComplaint
              ?.toLowerCase()
              .includes('breathing difficulty') ||
            val?.chiefComplaint?.toLowerCase().includes('asthma') ||
            val?.chiefComplaint?.toLowerCase().includes('copd') ||
            val?.chiefComplaint?.toLowerCase().includes('influenza') ||
            val?.chiefComplaint?.toLowerCase().includes('pneumonia') ||
            val?.chiefComplaint?.toLowerCase().includes('tuberculosis') ||
            val?.chiefComplaint?.toLowerCase().includes('lung cancer')
          )
            this.enableLungAssessment = true;
        }
      });
    }
    if (flag) this.nurseService.setNCDTemp(true);
    else this.nurseService.setNCDTemp(false);
    if (this.enableLungAssessment) this.nurseService.setEnableLAssessment(true);
    else this.nurseService.setEnableLAssessment(false);
    if (this.enableProvisionalDiag)
      this.nurseService.setNCDScreeningProvision(true);
    else this.nurseService.setNCDScreeningProvision(false);
  }

  addCheifComplaint() {
    const complaintFormArray = <FormArray>(
      this.patientChiefComplaintsForm.controls['complaints']
    );
    const complaintFormArrayValue = complaintFormArray.value;
    const temp = this.chiefComplaintMaster.filter((item: any) => {
      const arr = complaintFormArrayValue.filter((value: any) => {
        return value.chiefComplaint.chiefComplaint === item.chiefComplaint;
      });
      const flag = arr.length === 0 ? true : false;
      return flag;
    });
    if (temp.length > 0) {
      this.chiefComplaintTemporarayList.push(temp);
    }
    complaintFormArray.push(
      this.formUtility.createPatientChiefComplaintsForm()
    );
  }

  removeCheifComplaint(i: number, complaintForm: AbstractControl) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe(result => {
        if (result) {
          const complaintFormArray = <FormArray>(
            this.patientChiefComplaintsForm.controls['complaints']
          );
          this.patientChiefComplaintsForm.markAsDirty();

          let arr: any = [];
          if (complaintForm.value.chiefComplaint) {
            arr = this.chiefComplaintMaster.filter((item: any) => {
              return (
                item.chiefComplaint ===
                complaintForm.value.chiefComplaint.chiefComplaint
              );
            });
          }
          if (arr.length > 0) {
            this.chiefComplaintTemporarayList.forEach(
              (element: any, t: any) => {
                if (t !== i) element.push(arr[0]);

                this.sortChiefComplaintList(element);
              }
            );
          }
          if (this.selectedChiefComplaintList[i])
            this.selectedChiefComplaintList[i] = null;

          if (complaintFormArray.length === 1 && complaintForm)
            complaintForm.reset();
          else complaintFormArray.removeAt(i);
          let flag = false;
          this.enableLungAssessment = false;
          this.enableProvisionalDiag = false;
          if (
            this.selectedChiefComplaintList !== null &&
            this.selectedChiefComplaintList !== undefined &&
            this.selectedChiefComplaintList.length > 0
          ) {
            this.selectedChiefComplaintList.forEach((val: any) => {
              this.enableProvisionalDiag = true;
              if (val?.chiefComplaint?.toLowerCase() === 'fever') flag = true;
              if (environment.isMMUOfflineSync) {
                if (
                  val?.chiefComplaint?.toLowerCase().includes('fever') ||
                  val?.chiefComplaint?.toLowerCase().includes('cough') ||
                  val?.chiefComplaint?.toLowerCase().includes('congestion') ||
                  val?.chiefComplaint
                    ?.toLowerCase()
                    .includes('breathing problems') ||
                  val?.chiefComplaint?.toLowerCase().includes('asthma') ||
                  val?.chiefComplaint?.toLowerCase().includes('copd') ||
                  val?.chiefComplaint?.toLowerCase().includes('influenza') ||
                  val?.chiefComplaint?.toLowerCase().includes('pneumonia') ||
                  val?.chiefComplaint?.toLowerCase().includes('tuberculosis') ||
                  val?.chiefComplaint?.toLowerCase().includes('lung cancer')
                )
                  this.enableLungAssessment = true;
              }
            });
          }
          if (flag) this.nurseService.setNCDTemp(true);
          else this.nurseService.setNCDTemp(false);
        }
        if (this.enableLungAssessment)
          this.nurseService.setEnableLAssessment(true);
        else this.nurseService.setEnableLAssessment(false);
        if (this.enableProvisionalDiag)
          this.nurseService.setNCDScreeningProvision(true);
        else this.nurseService.setNCDScreeningProvision(false);
      });
  }

  validateDuration(formGroup: AbstractControl, event?: Event) {
    let duration = null;
    let durationUnit = null;
    let flag = true;

    if (formGroup.value.duration) duration = formGroup.value.duration;

    if (formGroup.value.unitOfDuration)
      durationUnit = formGroup.value.unitOfDuration;

    if (duration !== null && durationUnit !== null)
      flag = new ValidationUtils().validateDuration(
        duration,
        durationUnit,
        this.beneficiary.age
      );

    if (!flag) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.durationGreaterThanAge
      );
      formGroup.patchValue({ duration: null, unitOfDuration: null });
    }
  }

  displayChiefComplaint(complaint: any) {
    return complaint?.chiefComplaint;
  }

  suggestChiefComplaintList(complaintForm: AbstractControl, i: number) {
    const complaint = complaintForm.value.chiefComplaint;
    console.log('complaintForm' + complaintForm);
    console.log('complaint' + complaint);
    console.log('i', i);

    if (typeof complaint === 'string') {
      if (
        this.chiefComplaintTemporarayList !== undefined &&
        this.chiefComplaintTemporarayList !== null
      ) {
        this.suggestedChiefComplaintList[i] = this.chiefComplaintTemporarayList[
          i
        ].filter(
          (compl: any) =>
            compl.chiefComplaint
              .toLowerCase()
              .indexOf(complaint.toLowerCase().trim()) >= 0
        );
        if (complaint) {
          complaintForm.get('duration')?.enable();
          complaintForm.get('description')?.enable();
        }
      }
    } else if (typeof complaint === 'object' && complaint) {
      if (
        this.chiefComplaintTemporarayList !== undefined &&
        this.chiefComplaintTemporarayList !== null
      ) {
        this.suggestedChiefComplaintList[i] = this.chiefComplaintTemporarayList[
          i
        ].filter(
          (compl: any) =>
            compl.chiefComplaint
              .toLowerCase()
              .indexOf(complaint.chiefComplaint.toLowerCase().trim()) >= 0
        );
        if (complaint) {
          complaintForm.get('duration')?.enable();
          complaintForm.get('description')?.enable();
        }
      }
    } else {
      complaintForm.get('duration')?.disable();
      complaintForm.get('duration')?.reset();
      complaintForm.get('unitOfDuration')?.disable();
      complaintForm.get('unitOfDuration')?.reset();
      complaintForm.get('description')?.disable();
      complaintForm.get('description')?.reset();
    }

    if (this.suggestedChiefComplaintList[i].length === 0) complaintForm.reset();
  }

  sortChiefComplaintList(complaintList: any) {
    complaintList.sort((a: any, b: any) => {
      if (a.chiefComplaint === b.chiefComplaint) return 0;
      if (a.chiefComplaint < b.chiefComplaint) return -1;
      else return 1;
    });
  }

  checkComplaintFormValidity(complaintForm: any) {
    const temp = complaintForm.value;
    if (temp.chiefComplaint && temp.duration && temp.unitOfDuration) {
      return false;
    } else {
      return true;
    }
  }

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(fieldName, 'Chief Complaints');
  }
}
