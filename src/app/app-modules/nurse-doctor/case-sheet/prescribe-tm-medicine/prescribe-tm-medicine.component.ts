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

import { Component, OnInit, Inject, ViewChild, DoCheck } from '@angular/core';
import {
  MasterdataService,
  DoctorService,
} from '../../../nurse-doctor/shared/services';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  NgForm,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/v2/registrar/services/session-storage.service';
import { NgIf, NgFor, NgClass, SlicePipe } from '@angular/common';
import { StringValidatorDirective } from '../../../core/directives/stringValidator.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideCircleCheck,
  lucideCircleX,
  lucideTrash2,
} from '@ng-icons/lucide';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardSelectImports } from 'Common-UI/v2/ui/select';
import { ZardComboboxComponent } from 'Common-UI/v2/ui/combobox';
import { ZardTableImports } from 'Common-UI/v2/ui/table';
import { ZardPaginationImports } from 'Common-UI/v2/ui/pagination';
import { tooltipImports } from 'Common-UI/v2/ui/tooltip';
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
  selector: 'app-prescribe-tm-medicine',
  templateUrl: './prescribe-tm-medicine.component.html',
  viewProviders: [
    provideIcons({ lucideX, lucideCircleCheck, lucideCircleX, lucideTrash2 }),
  ],
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    StringValidatorDirective,
    SlicePipe,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
    ...ZardSelectImports,
    ZardComboboxComponent,
    ...ZardTableImports,
    ...ZardPaginationImports,
    ...tooltipImports,
  ],
})
export class PrescribeTmMedicineComponent implements OnInit, DoCheck {
  generalUtils = new GeneralUtils(this.fb, this.sessionstorage);
  @ViewChild('prescriptionForm')
  prescriptionForm!: NgForm;

  drugPrescriptionForm!: FormGroup;
  createdBy!: string;

  pageSize = 5;
  currentPageIndex = 1;
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
  filteredDrugMaster: any = [];
  filteredDrugDoseMaster: any = [];
  subFilteredDrugMaster: any = [];
  drugMaster: any;
  drugFormMaster: any = [];
  drugDoseMaster: any;
  drugRouteMaster: any;
  drugFrequencyMaster: any;
  drugDurationMaster: any = [];
  drugDurationUnitMaster: any;
  edlMaster: any;

  beneficiaryRegID!: string;
  visitID!: string;
  visitCategory!: string;
  isStockAvalable!: string;
  tmPrescribedDrugs: any;
  tempform: any;
  tempDrugName: any;
  tempMedicineId: any = null;
  // String proxies for the number-valued duration/quantity z-selects (CVA emits
  // strings). Kept in sync via onDurationChange/onQuantityChange so the numeric
  // currentPrescription.duration / .qtyPrescribed contract is preserved, while
  // [(ngModel)] + required registers each select as a gating NgForm control.
  durationModel = '';
  quantityModel = '';
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public dialogRef: MatDialogRef<PrescribeTmMedicineComponent>,
    private masterdataService: MasterdataService,
    private fb: FormBuilder,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    this.tmPrescribedDrugs = this.input.tmPrescribedDrugs;
    this.createdBy = this.sessionstorage.getItem('userName') as string;
    this.drugPrescriptionForm = this.generalUtils.createDrugPrescriptionForm();
    this.setLimits();
    this.makeDurationMaster();
    this.getDoctorMasterData();
  }

  setLimits(pageNo = 0) {
    this.pageLimits[0] = +pageNo * +this.pageSize;
    this.pageLimits[1] = (+pageNo + 1) * +this.pageSize;
  }

  // --- Zard control adapters. The reactive form / template-driven models keep
  // their original object / number / ISO value types; these thin adapters map
  // the string-valued z-select and CVA z-combobox back onto them so the
  // submission contract is unchanged. ---

  /** Total pages for the prescribed-drugs z-pagination (1-based). */
  get totalDrugPages(): number {
    const length =
      this.drugPrescriptionForm?.controls['prescribedDrugs']?.value?.length ??
      0;
    return Math.max(1, Math.ceil(length / this.pageSize));
  }

  /** z-pagination emits a 1-based page index; setLimits() expects 0-based. */
  onPageChange(pageIndex: number) {
    this.currentPageIndex = pageIndex;
    this.setLimits(pageIndex - 1);
  }

  /** Medicine z-combobox: emits the selected itemID; reuse selectMedicineObject. */
  onMedicineChange(itemID: any) {
    if (itemID === null || itemID === undefined || itemID === '') {
      return;
    }
    const option = (this.filteredDrugMaster || []).find(
      (drug: any) => drug.itemID === itemID
    );
    if (option) {
      this.selectMedicineObject({
        isUserInput: true,
        source: { value: option },
      });
    }
  }

  /** Duration z-select: number-valued control kept as a number. */
  onDurationChange(value: number) {
    this.currentPrescription.duration = value;
  }

  /** Quantity z-select: number-valued control kept as a number. */
  onQuantityChange(value: number) {
    this.currentPrescription.qtyPrescribed = value;
  }
  makeDurationMaster() {
    let i = 1;
    while (i <= 29) {
      this.drugDurationMaster.push(i);
      i++;
    }
  }
  getDoctorMasterData() {
    const visitID: any = this.sessionstorage.getItem(
      'caseSheetVisitCategoryID'
    );
    const serviceProviderID: any =
      this.sessionstorage.getItem('providerServiceID');
    this.masterdataService
      .getDoctorMasterDataForNurse(visitID, serviceProviderID)
      .subscribe((masterData: any) => {
        if (masterData.statusCode === 200) {
          this.drugFormMaster = masterData.data.drugFormMaster;
          this.drugMaster = masterData.data.itemMaster;
          this.drugDoseMaster = masterData.data.drugDoseMaster;
          this.drugFrequencyMaster = masterData.data.drugFrequencyMaster;
          this.drugDurationUnitMaster = masterData.data.drugDurationUnitMaster;
          this.drugRouteMaster = masterData.data.routeOfAdmin;
          this.edlMaster = masterData.data.NonEdlMaster;
        }
      });
  }
  getFormValueChanged() {
    // The form z-select is [(ngModel)]-bound to currentPrescription.formName
    // (its zValue is item.itemFormName), so resolve the master object from the
    // selected name before clearing, then let getFormDetails() set formID/formName.
    const selected = (this.drugFormMaster || []).find(
      (item: any) => item.itemFormName === this.currentPrescription.formName
    );
    this.tempform = selected ?? null;
    this.clearCurrentDetails();
    this.getFormDetails();
  }
  getFormDetails() {
    this.currentPrescription['formID'] = this.tempform.itemFormID;
    this.currentPrescription['formName'] = this.tempform.itemFormName;
    this.filterDrugMaster();
    this.filterDoseMaster();
  }

  getPrescribedDrugs(): AbstractControl[] | null {
    const prescribedDrugsControl =
      this.drugPrescriptionForm.get('prescribedDrugs');
    return prescribedDrugsControl instanceof FormArray
      ? prescribedDrugsControl.controls
      : null;
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
      this.tempDrugName = null;
    } else {
      this.clearCurrentDetails();
      this.getFormDetails();
    }
  }
  displayFn(option: any): string {
    if (option) {
      return `${option.itemName} ${option.strength}${
        option.unitOfMeasurement ? option.unitOfMeasurement : ''
      }${option.quantityInHand ? '(' + option.quantityInHand + ')' : ''}`;
    } else {
      return '';
    }
  }
  selectMedicineObject(event: any) {
    const option = event.source.value;
    console.log('here', event);
    if (event.isUserInput) {
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
        const typeOfDrug = option.isEDL ? '' : '- (Non-EDL) Medicine';
        if (option.quantityInHand === 0) {
          this.confirmationService
            .confirm(
              'info ' + typeOfDrug,
              'Stock not Available, would you still like to prescribe?  ' +
                option.itemName +
                ' ' +
                option.strength +
                option.unitOfMeasurement
            )
            .subscribe(res => {
              if (!res) {
                this.tempDrugName = null;
                this.tempMedicineId = null;
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
        'Medicine is already prescribed, Please delete the previously added one to change.',
        'info'
      );
      return false;
    } else {
      return true;
    }
  }

  clearCurrentDetails() {
    this.currentPrescription = {
      id: null,
      drugID: null,
      drugName: null,
      drugStrength: null,
      drugUnit: null,
      quantity: null,
      formID: null,
      qtyPrescribed: null,
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
    this.tempDrugName = null;
    this.tempMedicineId = null;
    // Keep the string proxies in sync with the reset numeric fields.
    this.durationModel =
      this.currentPrescription.duration !== null &&
      this.currentPrescription.duration !== undefined
        ? this.currentPrescription.duration.toString()
        : '';
    this.quantityModel =
      this.currentPrescription.qtyPrescribed !== null &&
      this.currentPrescription.qtyPrescribed !== undefined
        ? this.currentPrescription.qtyPrescribed.toString()
        : '';
    this.prescriptionForm.form.markAsUntouched();
    this.isStockAvalable = '';
  }

  submitForUpload() {
    this.addMedicine();
    this.tempform = null;
    this.clearCurrentDetails();
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

  deleteMedicine(i: any, id?: null) {
    this.confirmationService
      .confirm('warn', 'Please confirm to delete.')
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
  submitPrescription() {
    console.log(this.drugPrescriptionForm);
    if (this.drugPrescriptionForm.value) {
      this.dialogRef.close(this.drugPrescriptionForm.value);
    } else {
      this.confirmationService.alert('Please prescribe the medicines');
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
