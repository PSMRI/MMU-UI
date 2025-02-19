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
  ViewChild,
  OnDestroy,
  ViewEncapsulation,
  DoCheck,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  NgForm,
  AbstractControl,
} from '@angular/forms';
import { MasterdataService, DoctorService } from '../../../shared/services';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { PageEvent } from '@angular/material/paginator';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
interface prescribe {
  id: any;
  drugID: any;
  drugName: any;
  drugStrength: any;
  drugUnit: any;
  quantity: any;
  route: any;
  formID: any;
  formName: any;
  qtyPrescribed: any;
  dose: any;
  frequency: any;
  duration: any;
  unit: any;
  instructions: any;
  isEDL: boolean;
  sctCode: any;
  sctTerm: any;
}
@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PrescriptionComponent implements OnInit, OnDestroy, DoCheck {
  generalUtils = new GeneralUtils(this.fb, this.sessionstorage);
  @ViewChild('prescriptionForm')
  prescriptionForm!: NgForm;

  @Input()
  drugPrescriptionForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  createdBy: any;

  pageSize = 5;
  pageEvent!: PageEvent;
  pageLimits: any = [];
  currentPrescription: prescribe = {
    id: null,
    drugID: null,
    drugName: null,
    drugStrength: null,
    drugUnit: null,
    qtyPrescribed: null,
    quantity: null,
    formID: null,
    formName: null,
    route: null,
    dose: null,
    frequency: null,
    duration: null,
    unit: null,
    instructions: null,
    isEDL: false,
    sctCode: null,
    sctTerm: null,
  };

  tempDrugName: any;
  tempform: any;

  filteredDrugMaster: any = [];
  filteredDrugDoseMaster: any = [];
  subFilteredDrugMaster: any = [];
  drugMaster: any;
  drugFormMaster: any;
  drugDoseMaster: any;
  drugRouteMaster: any;
  drugFrequencyMaster: any;
  drugDurationMaster: any = [];
  drugDurationUnitMaster: any;
  edlMaster: any;

  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  isStockAvalable!: string;
  current_language_set: any;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
    private httpServiceService: HttpServiceService
  ) {}

  getPrescribedDrugs(): AbstractControl[] | null {
    const prescribedDrugsControl =
      this.drugPrescriptionForm.get('prescribedDrugs');
    return prescribedDrugsControl instanceof FormArray
      ? prescribedDrugsControl.controls
      : null;
  }

  ngOnInit() {
    this.createdBy = this.sessionstorage.getItem('userName');
    this.setLimits();
    this.makeDurationMaster();
    this.getDoctorMasterData();
  }

  ngOnDestroy() {
    if (this.doctorMasterDataSubscription) {
      this.doctorMasterDataSubscription.unsubscribe();
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  makeDurationMaster() {
    let i = 1;
    while (i <= 29) {
      this.drugDurationMaster.push(i);
      i++;
    }
  }

  displayFn(option: any) {
    return option
      ? `${option.itemName} ${option.strength}${
          option.unitOfMeasurement ? option.unitOfMeasurement : ''
        }${option.quantityInHand ? '(' + option.quantityInHand + ')' : ''}`
      : '';
  }

  getFormValueChanged() {
    this.clearCurrentDetails();
    this.getFormDetails();
  }
  getFormDetails() {
    console.log('form ID values', this.currentPrescription.formID);
    this.drugFormMaster.filter((item: any) => {
      if (item.itemFormName === this.currentPrescription.formName)
        this.currentPrescription.formID = item.itemFormID;
    });
    this.filterDrugMaster();
    this.filterDoseMaster();
  }

  filterDrugMaster() {
    const drugMasterCopy = Object.assign([], this.drugMaster);
    this.filteredDrugMaster = [];
    drugMasterCopy.forEach((element: any) => {
      if (this.currentPrescription.formID === element.itemFormID) {
        element['isEDL'] = true;
        this.filteredDrugMaster.push(element);
      }
    });
    const drugMasterCopyEdl = Object.assign([], this.edlMaster);
    drugMasterCopyEdl.forEach((element: any) => {
      if (this.currentPrescription.formID === element.itemFormID) {
        element['quantityInHand'] = 0;
        this.filteredDrugMaster.push(element);
      }
    });
    this.subFilteredDrugMaster = this.filteredDrugMaster;
  }
  filterDoseMaster() {
    const drugDoseMasterCopy = Object.assign([], this.drugDoseMaster);
    this.filteredDrugDoseMaster = [];
    drugDoseMasterCopy.forEach((element: any) => {
      if (this.currentPrescription.formID === element.itemFormID) {
        this.filteredDrugDoseMaster.push(element);
      }
    });
  }

  filterMedicine(medicine: any) {
    console.log('here');

    if (medicine) {
      this.subFilteredDrugMaster = this.filteredDrugMaster.filter(
        (drug: any) => {
          return drug.itemName.toLowerCase().startsWith(medicine.toLowerCase());
        }
      );
    } else {
      this.subFilteredDrugMaster = this.filteredDrugMaster;
    }
  }
  reEnterMedicine() {
    if (this.tempDrugName && this.currentPrescription.drugID) {
      this.tempDrugName = {
        id: this.currentPrescription.id,
        itemName: this.currentPrescription.drugName,
        itemID: this.currentPrescription.drugID,
        quantityInHand: this.currentPrescription.quantity,
        sctCode: this.currentPrescription.sctCode,
        sctTerm: this.currentPrescription.sctTerm,
        strength: this.currentPrescription.drugStrength,
        unitOfMeasurement: this.currentPrescription.drugUnit,
      };
    } else if (this.tempDrugName && !this.currentPrescription.drugID) {
      this.tempDrugName = '';
    } else {
      this.clearCurrentDetails();
      this.getFormDetails();
    }
  }

  selectMedicineObject(event: any) {
    const option = event.option.value;
    console.log('here', event);
    if (option) {
      if (this.checkNotIssued(option.itemID)) {
        this.currentPrescription['id'] = option.id;
        this.currentPrescription['drugName'] = option.itemName;
        this.currentPrescription['drugID'] = option.itemID;
        this.currentPrescription['quantity'] = option.quantityInHand;
        this.currentPrescription['sctCode'] = option.sctCode;
        this.currentPrescription['sctTerm'] = option.sctTerm;
        this.currentPrescription['drugStrength'] = option.strength;
        this.currentPrescription['drugUnit'] = option.unitOfMeasurement;
        this.currentPrescription['isEDL'] = option.isEDL;
        const typeOfDrug = option.isEDL
          ? ''
          : this.current_language_set.nonEDLMedicine;
        if (option.quantityInHand === 0) {
          this.confirmationService
            .confirm(
              'info ' + typeOfDrug,
              this.current_language_set.stockNotAvailableWouldYouPrescribe +
                ' ' +
                option.itemName +
                ' ' +
                option.strength +
                option.unitOfMeasurement
            )
            .subscribe(res => {
              if (!res) {
                this.tempDrugName = '';
                this.currentPrescription['id'] = '';
                this.currentPrescription['drugName'] = '';
                this.currentPrescription['drugID'] = '';
                this.currentPrescription['quantity'] = '';
                this.currentPrescription['sctCode'] = '';
                this.currentPrescription['sctTerm'] = '';
                this.currentPrescription['drugStrength'] = '';
                this.currentPrescription['drugUnit'] = '';
                this.isStockAvalable = '';
              } else {
                this.isStockAvalable = 'warn';
              }
            });
        } else {
          this.isStockAvalable = 'primary';
        }
      }
    }
  }

  checkNotIssued(itemID: any) {
    const medicineValue =
      this.drugPrescriptionForm.controls['prescribedDrugs'].value;
    const filteredExisting = medicineValue.filter(
      (meds: any) => meds.drugID === itemID
    );
    if (filteredExisting.length > 0) {
      this.reEnterMedicine();
      this.confirmationService.alert(
        this.current_language_set.alerts.info.medicinePrescribe,
        'info'
      );
      return false;
    } else {
      return true;
    }
  }

  clearCurrentDetails() {
    this.tempDrugName = null;
    this.currentPrescription.dose = null;
    this.currentPrescription.frequency = null;
    this.currentPrescription.duration = null;
    this.currentPrescription.unit = null;
    this.currentPrescription.qtyPrescribed = null;
    this.currentPrescription.route = null;
    this.currentPrescription.instructions = null;
    this.prescriptionForm.form.markAsUntouched();
    this.isStockAvalable = '';
  }
  clearCurrentaddDetails() {
    this.tempDrugName = null;
    this.currentPrescription.dose = null;
    this.currentPrescription.frequency = null;
    this.currentPrescription.duration = null;
    this.currentPrescription.unit = null;
    this.currentPrescription.qtyPrescribed = null;
    this.currentPrescription.route = null;
    this.currentPrescription.instructions = null;
    this.currentPrescription.formName = null;
    this.currentPrescription.drugID = null;
    this.currentPrescription.formID = null;

    this.prescriptionForm.form.markAsUntouched();
    this.isStockAvalable = '';
  }

  submitForUpload() {
    this.addMedicine();
    this.tempform = null;
    this.clearCurrentaddDetails();
  }

  addMedicine() {
    const medicine: FormArray = <FormArray>(
      this.drugPrescriptionForm.controls['prescribedDrugs']
    );
    medicine.insert(
      0,
      this.generalUtils.initMedicineWithData({
        ...this.currentPrescription,
        createdBy: this.createdBy,
      })
    );
    console.log(medicine.value, 'frrr');
  }

  setLimits(pageNo = 0) {
    this.pageLimits[0] = +pageNo * +this.pageSize;
    this.pageLimits[1] = (+pageNo + 1) * +this.pageSize;
  }

  deleteMedicine(i: any, id?: null) {
    this.confirmationService
      .confirm('warn', this.current_language_set.alerts.info.confirmDelete)
      .subscribe(res => {
        if (res && id) {
          this.deleteMedicineBackend(i, id);
        } else if (res && !id) {
          this.deleteMedicineUI(i);
        }
      });
  }

  deleteMedicineUI(i: any) {
    const prescribedDrugs = <FormArray>(
      this.drugPrescriptionForm.controls['prescribedDrugs']
    );
    prescribedDrugs.removeAt(i);
  }
  deleteMedicineBackend(index: any, id: any) {
    this.doctorService.deleteMedicine(id).subscribe((res: any) => {
      if (res.statusCode === 200) {
        this.deleteMedicineUI(index);
      }
    });
  }

  prescriptionSubscription: any;
  getPrescriptionDetails(
    beneficiaryRegID: any,
    visitID: any,
    visitCategory: any
  ) {
    this.prescriptionSubscription = this.doctorService
      .getCaseRecordAndReferDetails(beneficiaryRegID, visitID, visitCategory)
      .subscribe((res: any) => {
        if (res?.statusCode === 200 && res?.data?.prescription) {
          const prescription = res.data.prescription;
          this.patchPrescriptionDetails(prescription);
        }
      });
  }
  patchPrescriptionDetails(prescription: any) {
    console.log(prescription, 'herrrrrrr');
    const medicine: FormArray = <FormArray>(
      this.drugPrescriptionForm.controls['prescribedDrugs']
    );
    prescription.forEach((element: any) => {
      medicine.insert(
        0,
        this.generalUtils.initMedicineWithData(element, element.id)
      );
    });
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe(masterData => {
        if (masterData) {
          this.drugFormMaster = masterData.drugFormMaster;
          this.drugMaster = masterData.itemMaster;
          this.drugDoseMaster = masterData.drugDoseMaster;
          this.drugFrequencyMaster = masterData.drugFrequencyMaster;
          this.drugDurationUnitMaster = masterData.drugDurationUnitMaster;
          this.drugRouteMaster = masterData.routeOfAdmin;
          this.edlMaster = masterData.NonEdlMaster;

          if (String(this.caseRecordMode) === 'view') {
            this.beneficiaryRegID =
              this.sessionstorage.getItem('beneficiaryRegID');
            this.visitID = this.sessionstorage.getItem('visitID');
            this.visitCategory = this.sessionstorage.getItem('visitCategory');
            this.getPrescriptionDetails(
              this.beneficiaryRegID,
              this.visitID,
              this.visitCategory
            );
          }
        }
      });
  }

  editMedicine(i: any, id: any) {
    const prescribedDrugs = <FormArray>(
      this.drugPrescriptionForm.controls['prescribedDrugs']
    );
    this.currentPrescription.formName =
      prescribedDrugs.controls[i].value.formName;
    this.getFormDetails();
    this.tempDrugName = prescribedDrugs.controls[i].value.drugName;
    this.currentPrescription.id = prescribedDrugs.controls[i].value.id;
    this.currentPrescription.drugName =
      prescribedDrugs.controls[i].value.drugName;
    this.currentPrescription.drugID = prescribedDrugs.controls[i].value.drugID;
    this.currentPrescription.quantity =
      prescribedDrugs.controls[i].value.quantity;
    this.currentPrescription.sctCode =
      prescribedDrugs.controls[i].value.sctCode;
    this.currentPrescription.sctTerm =
      prescribedDrugs.controls[i].value.sctTerm;
    this.currentPrescription.drugStrength =
      prescribedDrugs.controls[i].value.drugStrength;
    this.currentPrescription.drugUnit =
      prescribedDrugs.controls[i].value.drugUnit;
    this.reEnterMedicine();
    const itemMedicine = this.subFilteredDrugMaster.filter((drug: any) => {
      if (
        drug.itemName.toLowerCase() === this.tempDrugName.itemName.toLowerCase()
      ) {
        return drug;
      }
    });
    console.log('PARTH*****' + itemMedicine[0]);
    this.setMedicineObject(itemMedicine[0]);
    this.currentPrescription.dose = prescribedDrugs.controls[i].value.dose;
    this.currentPrescription.frequency =
      prescribedDrugs.controls[i].value.frequency;
    this.currentPrescription.duration =
      prescribedDrugs.controls[i].value.duration;
    this.currentPrescription.unit = prescribedDrugs.controls[i].value.unit;
    this.currentPrescription.qtyPrescribed =
      prescribedDrugs.controls[i].value.qtyPrescribed;
    this.currentPrescription.route = prescribedDrugs.controls[i].value.route;
    this.currentPrescription.instructions =
      prescribedDrugs.controls[i].value.instructions;
    if (id) {
      this.deleteMedicineBackend(i, id);
    } else if (!id) {
      this.deleteMedicineUI(i);
    }
  }

  setMedicineObject(option: any) {
    if (
      option?.id &&
      option?.itemName &&
      option?.itemID &&
      option?.quantityInHand &&
      option?.sctCode &&
      option?.strength &&
      option?.unitOfMeasurement &&
      option?.isEDL
    ) {
      this.currentPrescription['id'] = option.id;
      this.currentPrescription['drugName'] = option.itemName;
      this.currentPrescription['drugID'] = option.itemID;
      this.currentPrescription['quantity'] = option.quantityInHand;
      this.currentPrescription['sctCode'] = option.sctCode;
      this.currentPrescription['sctTerm'] = option.sctTerm;
      this.currentPrescription['drugStrength'] = option.strength;
      this.currentPrescription['drugUnit'] = option.unitOfMeasurement;
      this.currentPrescription['isEDL'] = option.isEDL;
    }

    option.isEDL ? '' : this.current_language_set.nonEDLMedicine;
    if (option.quantityInHand === 0) {
      this.isStockAvalable = 'warn';
    } else {
      this.isStockAvalable = 'primary';
    }
  }
}
