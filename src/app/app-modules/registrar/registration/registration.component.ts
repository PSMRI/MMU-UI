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

import { RegisterDemographicDetailsComponent } from './register-demographic-details/register-demographic-details.component';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  AfterViewChecked,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RegisterOtherDetailsComponent } from './register-other-details/register-other-details.component';
import { RegisterPersonalDetailsComponent } from './register-personal-details/register-personal-details.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RegistrationUtils } from '../shared/utility/registration-utility';
import { CanComponentDeactivate } from '../../core/services/can-deactivate-guard.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs';
import { RegistrarService } from '../shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent
  implements
    OnInit,
    AfterViewChecked,
    OnDestroy,
    CanComponentDeactivate,
    DoCheck
{
  @ViewChild(RegisterOtherDetailsComponent)
  private otherDetails!: RegisterOtherDetailsComponent;

  @ViewChild(RegisterPersonalDetailsComponent)
  private personalDetails!: RegisterPersonalDetailsComponent;

  @ViewChild(RegisterDemographicDetailsComponent)
  private demographicDetails!: RegisterDemographicDetailsComponent;

  utils = new RegistrationUtils(this.fb);

  beneficiaryRegistrationForm!: FormGroup;
  personalDetailsForm!: FormGroup;
  demographicDetailsForm!: FormGroup;
  otherDetailsForm!: FormGroup;
  patientRevisit = false;
  postButtonText: any;
  revisitData: any;
  revisitDataSubscription: any;
  emergencyRegistration = false;
  step = 0;

  // for ID Manpulation
  masterData: any;
  masterDataSubscription: any;
  govIDMaster: any;
  otherGovIDMaster: any;
  // ENDS for ID Manpulation

  country = { id: 1, Name: 'India' };
  currentLanguageSet: any;

  constructor(
    private confirmationService: ConfirmationService,
    private registrarService: RegistrarService,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    private router: Router,
    private route: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private languageComponent: SetLanguageComponent,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
    // Initialize Registration Form
    const registrationUtils = new RegistrationUtils(this.fb);

    this.beneficiaryRegistrationForm =
      registrationUtils.createRegistrationDetailsForm();

    this.personalDetailsForm = this.beneficiaryRegistrationForm.get(
      'personalDetailsForm'
    ) as FormGroup;
    this.demographicDetailsForm = this.beneficiaryRegistrationForm.get(
      'demographicDetailsForm'
    ) as FormGroup;
    this.otherDetailsForm = this.beneficiaryRegistrationForm.get(
      'otherDetailsForm'
    ) as FormGroup;

    // Call For MAster Data which will be loaded in Sub Components
    this.callMasterDataObservable();

    // Decide To Go for Submit or Update Mode
    this.checkPatientRevisit();
  }

  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    if (this.patientRevisit && this.revisitDataSubscription) {
      this.revisitDataSubscription.unsubscribe();
      this.registrarService.clearBeneficiaryEditDetails();
    }
  }

  /**
   * Accordion Expand
   */
  setStep(index: number) {
    this.step = index;
  }

  /**
   *
   * Check Patient Revisit
   */
  checkPatientRevisit() {
    if (this.route.snapshot.params['beneficiaryID'] !== undefined) {
      this.patientRevisit = true;
      this.callBeneficiaryDataObservable(
        this.route.snapshot.params['beneficiaryID']
      );
    } else if (this.route.snapshot.params['beneficiaryID'] === undefined) {
      this.patientRevisit = false;
    }
  }

  /**
   *
   * Call Master Data Observable
   */
  callMasterDataObservable() {
    this.registrarService.getRegistrationMaster(1);
    this.loadMasterDataObservable();
  }

  /**
   *
   * Load Master Data of Id Cards as Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res: any) => {
        if (res !== null) {
          this.masterData = Object.assign({}, res);
          this.govIDMaster = Object.assign({}, res);
          this.otherGovIDMaster = Object.assign({}, res);
          this.govIDMaster = this.govIDMaster.govIdEntityMaster;
          this.otherGovIDMaster = this.otherGovIDMaster.otherGovIdEntityMaster;
        }
      });
  }

  /**
   *
   * Loading Data of Beneficiary as Observable
   */
  callBeneficiaryDataObservable(benID: any) {
    this.revisitDataSubscription =
      this.registrarService.beneficiaryEditDetails$.subscribe((res: any) => {
        if (res !== null && benID === res.beneficiaryID) {
          this.revisitData = Object.assign({}, res);
        } else {
          this.redirectToSearch();
        }
      });
  }

  /**
   *
   * Redirect to Search
   */
  redirectToSearch() {
    setTimeout(() =>
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.issueInFetchDetails,
        'info'
      )
    );
    this.router.navigate(['/registrar/search/']);
  }

  /**
   *
   * Reset Registration Form
   */
  resetBeneficiaryForm() {
    this.beneficiaryRegistrationForm.reset();
    this.setCheckBoxByDefault();
    this.ageUnitReset();
    this.govIDReset();
    this.otherDetails.resetForm();
    this.demographicDetails.setDemographicDefaults();
    this.personalDetails.enableMaritalStatus = false;
    this.personalDetails.enableMarriageDetails = false;
    this.personalDetails.isMobileNoRequired = true;
    this.personalDetails.isOccuptionRequired = true;
    this.setStep(0); //open personal details in accordian
    this.personalDetailsForm.patchValue({
      checked: true,
    });
  }

  confirmFormReset(reset: any) {
    if (this.beneficiaryRegistrationForm.dirty) {
      if (reset === true) {
        this.confirmationService
          .confirm('warn', 'Do you want to reset the entered details?')
          .subscribe(res => {
            if (res) {
              this.resetBeneficiaryForm();
            }
          });
      } else {
        if (reset === false) {
          this.confirmationService
            .confirm(
              `info`,
              this.currentLanguageSet.alerts.info.navigateFurtherAlert,
              'Yes',
              'No'
            )
            .subscribe(res => {
              if (res) {
                this.router.navigate(['/registrar/search/']);
              }
            });
        }
      }
    } else {
      if (reset === false) {
        this.router.navigate(['/registrar/search/']);
      }
    }
  }

  /**
   *
   * Gov ID Reset to 0
   */
  govIDReset() {
    const otherDetailsForm = <FormGroup>(
      this.beneficiaryRegistrationForm.controls['otherDetailsForm']
    );
    const govID = <FormArray>otherDetailsForm.controls['govID'];
    const otherGovID = <FormArray>otherDetailsForm.controls['otherGovID'];
    if (govID !== undefined && govID !== null && govID.length > 0) {
      for (let i = govID.length - 1; i > 0; i--) {
        govID.removeAt(i);
      }
    }
    if (
      otherGovID !== undefined &&
      otherGovID !== null &&
      otherGovID.length > 0
    ) {
      for (let i = otherGovID.length - 1; i > 0; i--) {
        otherGovID.removeAt(i);
      }
    }
  }

  /**
   *
   * Cancel Updation, Go Back to Search
   */
  cancelBeneficiaryChanges() {
    this.confirmationService
      .confirm(
        'info',
        'Do you want to go back? any unsaved changes will be lost'
      )
      .subscribe(res => {
        if (res) {
          this.router.navigate(['/registrar/search/']);
        }
      });
  }

  /**
   *
   * Resetting Age Unit to 'Years' by default
   */
  ageUnitReset() {
    (<FormGroup>(
      this.beneficiaryRegistrationForm.controls['personalDetailsForm']
    )).patchValue({ ageUnit: 'Years' });
  }

  setCheckBoxByDefault() {
    (<FormGroup>this.personalDetailsForm.controls['checked']).patchValue({
      checked: true,
    });
  }

  /**
   *
   * Validate component values
   */

  checkValids(registrationForm: FormGroup) {
    let valid = false;
    const required = [];

    const personalForm = <FormGroup>(
      registrationForm.controls['personalDetailsForm']
    );
    const demographicsForm = <FormGroup>(
      registrationForm.controls['demographicDetailsForm']
    );
    const otherDetailsForm = <FormGroup>(
      registrationForm.controls['otherDetailsForm']
    );
    const villgeBranch = demographicsForm.controls['villages'] as FormArray;
    (<FormGroup>villgeBranch.at(0)).controls['villageID'].enable();

    console.log('demo', demographicsForm.value);
    console.log('demo', otherDetailsForm.value);

    Object.keys(personalForm.controls).forEach(control => {
      if (!personalForm.controls[control].valid) {
        if (control === 'maritalStatus') {
          if (
            personalForm.value.age >= 12 &&
            personalForm.value.ageUnit === 'Years'
          ) {
            required.push(
              this.currentLanguageSet.ro.personalInfo.maritalStatus
            );
          }
        } else if (control === 'firstName') {
          required.push(this.currentLanguageSet.ro.personalInfo.firstName);
        } else if (control === 'gender') {
          required.push(this.currentLanguageSet.ro.personalInfo.gender);
        } else if (control === 'phoneNo') {
          required.push(this.currentLanguageSet.bendetails.phoneNo);
        } else if (control === 'age') {
          required.push(this.currentLanguageSet.bendetails.age);
        } else if (control === 'ageAtMarriage') {
          if (
            personalForm.value.age >= 12 &&
            personalForm.value.ageUnit === 'Years' &&
            personalForm.value.maritalStatus !== 1 &&
            personalForm.value.maritalStatus !== 7
          )
            required.push(
              this.currentLanguageSet.ro.personalInfo.ageAtMarriage
            );
        } else if (control === 'spouseName') {
          if (
            personalForm.value.age >= 12 &&
            personalForm.value.ageUnit === 'Years' &&
            personalForm.value.maritalStatus === 2
          )
            required.push(this.currentLanguageSet.ro.personalInfo.spouseName);
        } else if (control === 'occupationOther') {
          required.push(
            this.currentLanguageSet.ro.personalInfo.otherOccupation
          );
        } else if (control === 'educationQualification') {
          if (
            personalForm.value.literacyStatus &&
            personalForm.value.literacyStatus === 'Literate'
          )
            required.push(
              this.currentLanguageSet.ro.personalInfo.educationalQualification
            );
        } else {
          required.push(control);
        }
      }
    });
    Object.keys(demographicsForm.controls).forEach(control => {
      if (!demographicsForm.controls[control].valid) {
        if (control === 'stateID') {
          required.push(this.currentLanguageSet.ro.locInfo.state);
        } else if (control === 'districtID') {
          required.push(this.currentLanguageSet.ro.locInfo.districtTownCity);
        } else if (control === 'blockID') {
          required.push(this.currentLanguageSet.ro.locInfo.taluk);
        } else if (control === 'villageID') {
          required.push(this.currentLanguageSet.ro.locInfo.street);
        } else if (control === 'parkingPlace') {
          /* required.push('Parking Place'); */
        } else if (control === 'zoneID') {
          /*  required.push('Zone'); */
        } else if (control === 'servicePoint') {
          /* required.push('Service Point'); */
        } else {
          required.push(control);
        }
      }
    });
    let govCount = 0;
    Object.keys(otherDetailsForm.controls).forEach(control => {
      console.log(otherDetailsForm.controls[control].valid);
      if (!otherDetailsForm.controls[control].valid) {
        if (control === 'emailID') {
          required.push(this.currentLanguageSet.emailAddress);
        } else if (control === 'blockID') {
          required.push(this.currentLanguageSet.block);
        } else if (control === 'religionOther') {
          required.push(this.currentLanguageSet.otherReligionName);
        } else if (control === 'govID') {
          govCount++;
        } else if (control === 'otherGovID') {
          required.push(this.currentLanguageSet.otherGovtID);
        } else if (control === 'fatherName') {
          required.push(this.currentLanguageSet.ro.otherInfo.fName);
        } else if (control === 'community') {
          required.push(this.currentLanguageSet.ro.otherInfo.community);
        } else {
          required.push(control);
        }
      }
    });
    otherDetailsForm.value.govID.forEach((element: any) => {
      if (
        element.idValue &&
        element.type !== 3 &&
        element.idValue.length < element.maxLength
      ) {
        govCount++;
      }
      if (
        element.idValue &&
        element.type === 3 &&
        element.idValue.length < element.minLength
      ) {
        govCount++;
      }
    });
    if (govCount) {
      required.push(this.currentLanguageSet.govID);
    }
    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.mandatoryFields,
        required
      );
      (<FormGroup>villgeBranch.at(0)).controls['villageID'].disable();
      return valid;
    } else {
      return (valid = true);
    }
  }

  /**
   *
   * Post Form Button Called, Decide whether to Submit or Update
   */
  postButtonCall() {
    const valid = this.checkValids(this.beneficiaryRegistrationForm);

    if (valid) {
      if (this.patientRevisit) {
        this.updateBeneficiarynPassToNurse();
      } else if (!this.patientRevisit) {
        this.submitBeneficiaryDetails();
      }
    }
  }

  /**
   *
   * Submit Registration Form
   */
  submitBeneficiaryDetails() {
    const newDate = this.dateFormatChange();
    const valueToSend = this.beneficiaryRegistrationForm.value;
    valueToSend.personalDetailsForm.dob = newDate;
    const iEMRForm: any = this.iEMRForm();
    const phoneMaps = iEMRForm.benPhoneMaps;

    // createdBy, vanID, servicePointID
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const servicePointDetails = JSON.parse(serviceLineDetails);
    iEMRForm['vanID'] = servicePointDetails.vanID;
    iEMRForm['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    iEMRForm['createdBy'] = this.sessionstorage.getItem('userName');
    phoneMaps[0]['vanID'] = servicePointDetails.vanID;
    phoneMaps[0]['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    phoneMaps[0]['createdBy'] = this.sessionstorage.getItem('userName');

    this.registrarService.submitBeneficiary(iEMRForm).subscribe((res: any) => {
      if (res.statusCode === 200) {
        this.confirmationService.alert(res.data.response, 'success');
        this.resetBeneficiaryForm();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.issueInSavngData,
          'error'
        );
      }
    });
  }

  /**
   *
   * Update Beneficiary Form & Move the Beneficiary To Nurse Worklist
   */

  updateBeneficiarynPassToNurse(passToNurse = true) {
    const iEMRForm: any = this.updateBenDataManipulation();
    iEMRForm['passToNurse'] = passToNurse;

    this.registrarService.updateBeneficiary(iEMRForm).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.confirmationService.alert(res.data.response, 'success');
        this.router.navigate(['/registrar/search/']);
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
  }

  /**
   *
   * Update Beneficiary Form & Don't Move the Beneficiary To Nurse Worklist
   */
  updateBeneficiaryDetails(passToNurse = false) {
    const valid = this.checkValids(this.beneficiaryRegistrationForm);

    if (valid) {
      const iEMRForm: any = this.updateBenDataManipulation();
      iEMRForm['passToNurse'] = passToNurse;

      this.registrarService
        .updateBeneficiary(iEMRForm)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.confirmationService.alert(res.data.response, 'success');
            this.router.navigate(['/registrar/search/']);
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        });
    }
  }

  /**
   * creating model for update or save for edit
   */
  updateBenDataManipulation() {
    const newDate = this.dateFormatChange();
    const valueToSend = this.beneficiaryRegistrationForm.value;
    valueToSend.personalDetailsForm.dob = newDate;
    const iEMRForm: any = this.iEMRFormUpdate();
    const phoneMaps = iEMRForm.benPhoneMaps;

    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const servicePointDetails = JSON.parse(serviceLineDetails);

    iEMRForm['vanID'] = servicePointDetails.vanID;
    iEMRForm['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    iEMRForm['createdBy'] = this.sessionstorage.getItem('userName');
    phoneMaps[0]['vanID'] = servicePointDetails.vanID;
    phoneMaps[0]['parkingPlaceID'] = servicePointDetails.parkingPlaceID;
    phoneMaps[0]['modifiedBy'] = this.sessionstorage.getItem('userName');
    return iEMRForm;
  }

  /**
   * Update object for iEMR
   */

  iEMRFormUpdate() {
    const personalForm = Object.assign(
      {},
      this.beneficiaryRegistrationForm.value.personalDetailsForm
    );
    const demographicsForm = Object.assign(
      {},
      this.beneficiaryRegistrationForm.value.demographicDetailsForm
    );
    const othersForm = Object.assign(
      {},
      this.beneficiaryRegistrationForm.value.otherDetailsForm
    );
    const removedIDs = this.otherDetails.getRemovedIDs();
    const iEMRids = this.iEMRidsUpdate(
      othersForm.govID,
      othersForm.otherGovID,
      removedIDs.removedGovIDs,
      removedIDs.removedOtherGovIDs
    );
    const finalForm = {
      beneficiaryRegID: personalForm.beneficiaryRegID,
      i_bendemographics: {
        beneficiaryRegID: personalForm.beneficiaryRegID,
        educationID: personalForm.educationQualification || undefined,
        educationName: personalForm.educationQualificationName || undefined,
        i_beneficiaryeducation: {
          educationID: personalForm.educationQualification || undefined,
          educationType: personalForm.educationQualificationName || undefined,
        },
        occupationID: personalForm.occupation || undefined,
        occupationName: personalForm.occupationOther || undefined,
        communityID: othersForm.community || undefined,
        communityName: othersForm.communityName || undefined,
        m_community: {
          communityID: othersForm.community || undefined,
          communityType: othersForm.communityName || undefined,
        },
        religionID: othersForm.religion || undefined,
        religionName: othersForm.religionOther || undefined,
        addressLine1: demographicsForm.addressLine1 || undefined,
        addressLine2: demographicsForm.addressLine2 || undefined,
        addressLine3: demographicsForm.addressLine3 || undefined,
        stateID: demographicsForm.stateID,
        stateName: demographicsForm.stateName,
        m_state: {
          stateID: demographicsForm.stateID,
          stateName: demographicsForm.stateName,
          stateCode: demographicsForm.stateCode,
          countryID: demographicsForm.countryID,
        },
        districtID: demographicsForm.districtID,
        districtName: demographicsForm.districtName,
        m_district: {
          districtID: demographicsForm.districtID,
          stateID: demographicsForm.stateID,
          districtName: demographicsForm.districtName,
        },
        blockID: demographicsForm.blockID,
        blockName: demographicsForm.blockName,
        m_districtblock: {
          blockID: demographicsForm.blockID,
          districtID: demographicsForm.districtID,
          blockName: demographicsForm.blockName,
          stateID: demographicsForm.stateID,
        },
        districtBranchID:
          demographicsForm.villages[0].villageID.districtBranchID,
        districtBranchName: demographicsForm.villages[0].villageID.villageName,
        m_districtbranchmapping: {
          districtBranchID: demographicsForm.villageID,
          blockID: demographicsForm.blockID,
          villageName: demographicsForm.villageName,
        },
        pinCode: demographicsForm.pincode || undefined,
        createdBy: this.sessionstorage.getItem('userName'),
        zoneID: demographicsForm.zoneID,
        zoneName: demographicsForm.zoneName,
        parkingPlaceID: demographicsForm.parkingPlace,
        parkingPlaceName: demographicsForm.parkingPlaceName,
        servicePointID: this.sessionstorage.getItem('servicePointID'),
        servicePointName: this.sessionstorage.getItem('servicePointName'),
        habitation: demographicsForm.habitation || undefined,
        incomeStatusID: personalForm.income || undefined,
        incomeStatus: personalForm.incomeName || undefined,
        incomeStatusName: personalForm.incomeName || undefined,
        monthlyFamilyIncome: personalForm.monthlyFamilyIncome || undefined,
      },
      benPhoneMaps: [
        {
          benPhMapID: this.getBenPhMapID(personalForm.benPhMapID),
          benificiaryRegID: personalForm.beneficiaryRegID,
          parentBenRegID: personalForm.parentRegID,
          benRelationshipID: personalForm.parentRelation,
          benRelationshipType: {
            benRelationshipID: personalForm.parentRelation,
            benRelationshipType: this.getRelationTypeForUpdate(
              personalForm.parentRelation,
              personalForm.benRelationshipType
            ),
          },
          phoneNo: personalForm.phoneNo,
        },
      ],
      beneficiaryID: personalForm.beneficiaryID,
      m_title: {},
      firstName: personalForm.firstName,
      lastName: personalForm.lastName || undefined,
      genderID: personalForm.gender,
      m_gender: {
        genderID: personalForm.gender,
        genderName: personalForm.genderName,
      },
      maritalStatusID: personalForm.maritalStatus || undefined,
      maritalStatus: {
        maritalStatusID: personalForm.maritalStatus || undefined,
        status: personalForm.maritalStatusName || undefined,
      },
      dOB: personalForm.dob,
      fatherName: othersForm.fatherName || undefined,
      spouseName: personalForm.spouseName || undefined,
      changeInSelfDetails: true,
      changeInAddress: true,
      changeInContacts: true,
      changeInIdentities: true,
      changeInOtherDetails: true,
      changeInFamilyDetails: true,
      changeInAssociations: true,
      is1097: false,
      createdBy: this.sessionstorage.getItem('userName'),
      changeInBankDetails: true,
      beneficiaryIdentities: iEMRids,
      ageAtMarriage: personalForm.ageAtMarriage || undefined,
      literacyStatus: personalForm.literacyStatus || undefined,
      motherName: othersForm.motherName || undefined,
      email: othersForm.emailID || undefined,
      bankName: othersForm.bankName || undefined,
      branchName: othersForm.branchName || undefined,
      ifscCode: othersForm.ifscCode || undefined,
      accountNo: othersForm.accountNo || undefined,
      benAccountID: personalForm.benAccountID,
      benImage: personalForm.image,
      changeInBenImage: personalForm.imageChangeFlag,
      occupationId: personalForm.occupation || undefined,
      occupation: personalForm.occupationOther || undefined,
      incomeStatus: personalForm.incomeName || undefined,
      religionId: othersForm.religion || undefined,
      religion: othersForm.religionOther || undefined,
      providerServiceMapId: this.sessionstorage.getItem('providerServiceID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
    };

    return finalForm;
  }

  getBenPhMapID(benPhMapID: any) {
    if (benPhMapID === 'null') {
      return null;
    } else {
      return benPhMapID;
    }
  }
  getRelationTypeForUpdate(parentRelation: any, benRelationshipType: any) {
    if (parentRelation === 1) {
      return 'Self';
    } else if (parentRelation === 11) {
      return 'Other';
    } else {
      return null;
    }
  }

  iEMRidsUpdate(
    govID: any,
    otherGovID: any,
    removedGovID: any,
    removedOtherGovIDs: any
  ) {
    const iEMRids: any = [];
    const govArr: any = [];
    const otherGovArr: any = [];
    this.govIDMaster.filter(function (item: any) {
      const i = govArr.findIndex(
        (x: any) => x.govtIdentityTypeID === item.govtIdentityTypeID
      );
      if (i <= -1) {
        govArr.push(item);
      }
      return null;
    });

    this.otherGovIDMaster.filter(function (item: any) {
      const j = otherGovArr.findIndex(
        (x: any) => x.govtIdentityTypeID === item.govtIdentityTypeID
      );
      if (j <= -1) {
        otherGovArr.push(item);
      }
      return null;
    });

    govID.forEach((gov: any) => {
      govArr.forEach((id: any) => {
        if (
          gov.type &&
          gov.idValue &&
          gov.type === id.govtIdentityTypeID &&
          gov.deleted === false &&
          gov.benIdentityId
        ) {
          iEMRids.push({
            govtIdentityType: {
              govtIdentityTypeID: gov.type,
              identityType: id.identityType,
              isGovtID: true,
            },
            govtIdentityNo: gov.idValue,
            govtIdentityTypeID: gov.type,
            deleted: gov.deleted,
            benIdentityId: gov.benIdentityId || undefined,
            createdBy: this.sessionstorage.getItem('userName'),
          });
        }
      });
    });

    otherGovID.forEach((othergov: any) => {
      otherGovArr.forEach((id: any) => {
        if (
          othergov.type &&
          othergov.idValue &&
          othergov.deleted === false &&
          othergov.benIdentityId
        ) {
          if (othergov.type === id.govtIdentityTypeID) {
            iEMRids.push({
              govtIdentityType: {
                govtIdentityTypeID: othergov.type,
                identityType: id.identityType,
                isGovtID: false,
              },
              govtIdentityNo: othergov.idValue,
              benIdentityId: othergov.benIdentityId || undefined,
              govtIdentityTypeID: othergov.type,
              deleted: othergov.deleted,
              createdBy: this.sessionstorage.getItem('userName'),
            });
          }
        }
      });
    });

    removedGovID.forEach((element: any) => {
      govArr.forEach((id: any) => {
        if (element.type === id.govtIdentityTypeID) {
          iEMRids.push({
            govtIdentityType: {
              govtIdentityTypeID: element.type,
              identityType: id.identityType,
              isGovtID: true,
            },
            govtIdentityNo: element.idValue,
            govtIdentityTypeID: element.type,
            benIdentityId: element.benIdentityId,
            deleted: true,
            createdBy: element.createdBy,
          });
        }
      });
    });

    removedOtherGovIDs.forEach((element: any) => {
      otherGovArr.forEach((id: any) => {
        if (element.type === id.govtIdentityTypeID) {
          iEMRids.push({
            govtIdentityType: {
              govtIdentityTypeID: element.type,
              identityType: id.identityType,
              isGovtID: false,
            },
            govtIdentityNo: element.idValue,
            govtIdentityTypeID: element.type,
            benIdentityId: element.benIdentityId,
            deleted: true,
            createdBy: element.createdBy,
          });
        }
      });
    });

    govID.forEach((gov: any) => {
      govArr.forEach((id: any) => {
        if (
          gov.type &&
          gov.idValue &&
          gov.type === id.govtIdentityTypeID &&
          !gov.deleted &&
          !gov.benIdentityId
        ) {
          iEMRids.push({
            govtIdentityType: {
              govtIdentityTypeID: gov.type,
              identityType: id.identityType,
              isGovtID: true,
            },
            govtIdentityNo: gov.idValue,
            govtIdentityTypeID: gov.type,
            deleted: false,
            benIdentityId: gov.benIdentityId || undefined,
            createdBy: this.sessionstorage.getItem('userName'),
          });
        }
      });
    });

    otherGovID.forEach((othergov: any) => {
      otherGovArr.forEach((id: any) => {
        if (
          othergov.type &&
          othergov.idValue &&
          !othergov.deleted &&
          !othergov.benIdentityId
        ) {
          if (othergov.type === id.govtIdentityTypeID) {
            iEMRids.push({
              govtIdentityType: {
                govtIdentityTypeID: othergov.type,
                identityType: id.identityType,
                isGovtID: false,
              },
              govtIdentityNo: othergov.idValue,
              benIdentityId: othergov.benIdentityId || undefined,
              govtIdentityTypeID: othergov.type,
              deleted: false,
              createdBy: this.sessionstorage.getItem('userName'),
            });
          }
        }
      });
    });

    if (iEMRids.length) {
      return iEMRids;
    } else {
      return undefined;
    }
  }

  /**
   * Update object for GovtIDs
   */

  /**
   * change date format to ISO
   *
   */
  dateFormatChange() {
    const dob = new Date(
      (<FormGroup>(
        this.beneficiaryRegistrationForm.controls['personalDetailsForm']
      )).value.dob
    );
    return dob.toISOString();
  }

  iEMRForm() {
    console.log('register form', this.beneficiaryRegistrationForm);
    const personalForm = Object.assign(
      {},
      this.beneficiaryRegistrationForm.value.personalDetailsForm
    );
    const demographicsForm = Object.assign(
      {},
      this.beneficiaryRegistrationForm.value.demographicDetailsForm
    );
    const othersForm = Object.assign(
      {},
      this.beneficiaryRegistrationForm.value.otherDetailsForm
    );
    const iEMRids = this.iEMRids(othersForm.govID, othersForm.otherGovID);
    const finalForm = {
      firstName: personalForm.firstName,
      lastName: personalForm.lastName,
      dOB: personalForm.dob,
      fatherName: othersForm.fatherName,
      spouseName: personalForm.spouseName,
      motherName: othersForm.motherName,
      govtIdentityNo: null,
      govtIdentityTypeID: null,
      emergencyRegistration: false,
      titleId: null,
      benImage: personalForm.image,
      bankName: othersForm.bankName,
      branchName: othersForm.branchName,
      ifscCode: othersForm.ifscCode,
      accountNo: othersForm.accountNo,
      maritalStatusID: personalForm.maritalStatus,
      maritalStatusName: personalForm.maritalStatusName,
      ageAtMarriage: personalForm.ageAtMarriage,
      genderID: personalForm.gender,
      genderName: personalForm.genderName,
      literacyStatus: personalForm.literacyStatus,
      email: othersForm.emailID,
      providerServiceMapId: this.sessionstorage.getItem('providerServiceID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),

      i_bendemographics: {
        incomeStatusID: personalForm.income,
        incomeStatusName: personalForm.incomeName,
        monthlyFamilyIncome: personalForm.monthlyFamilyIncome,
        occupationID: personalForm.occupation,
        occupationName: personalForm.occupationOther,
        educationID: personalForm.educationQualification,
        educationName: personalForm.educationQualificationName,
        communityID: othersForm.community,
        communityName: othersForm.communityName,
        religionID: othersForm.religion,
        religionName: othersForm.religionOther,
        countryID: this.country.id,
        countryName: this.country.Name,
        stateID: demographicsForm.stateID,
        stateName: demographicsForm.stateName,
        districtID: demographicsForm.districtID,
        districtName: demographicsForm.districtName,
        blockID: demographicsForm.blockID,
        blockName: demographicsForm.blockName,
        districtBranchID:
          demographicsForm.villages[0].villageID.districtBranchID,
        districtBranchName: demographicsForm.villages[0].villageID.villageName,
        zoneID: demographicsForm.zoneID,
        zoneName: demographicsForm.zoneName,
        parkingPlaceID: demographicsForm.parkingPlace,
        parkingPlaceName: demographicsForm.parkingPlaceName,
        servicePointID: this.sessionstorage.getItem('servicePointID'),
        servicePointName: this.sessionstorage.getItem('servicePointName'),
        habitation: demographicsForm.habitation,
        pinCode: demographicsForm.pincode,
        addressLine1: demographicsForm.addressLine1,
        addressLine2: demographicsForm.addressLine2,
        addressLine3: demographicsForm.addressLine3,
      },
      benPhoneMaps: [
        {
          parentBenRegID: personalForm.parentRegID,
          phoneNo: personalForm.phoneNo,
          phoneTypeID: this.makePhoneTypeID(personalForm.phoneNo),
          benRelationshipID: personalForm.parentRelation,
        },
      ],
      beneficiaryIdentities: iEMRids,
    };
    return finalForm;
  }

  makePhoneTypeID(phoneNo: any) {
    if (phoneNo) {
      return 1;
    } else {
      return null;
    }
  }

  iEMRids(govID: any, otherGovID: any) {
    const iEMRids: any = [];

    govID.forEach((gov: any) => {
      this.govIDMaster.forEach((id: any) => {
        if (gov.type && gov.idValue) {
          if (gov.type === id.govtIdentityTypeID) {
            iEMRids.push({
              govtIdentityNo: gov.idValue,
              govtIdentityTypeID: gov.type,
              govtIdentityTypeName: id.identityType,
              identityType: 'National ID',
              issueDate: null,
              expiryDate: null,
              isVerified: null,
              identityFilePath: null,
              createdBy: this.sessionstorage.getItem('userName'),
            });
          }
        }
      });
    });

    otherGovID.forEach((othergov: any) => {
      this.otherGovIDMaster.forEach((id: any) => {
        if (othergov.type && othergov.idValue) {
          if (othergov.type === id.govtIdentityTypeID) {
            iEMRids.push({
              govtIdentityNo: othergov.idValue,
              govtIdentityTypeID: othergov.type,
              govtIdentityTypeName: id.identityType,
              identityType: 'State ID',
              issueDate: null,
              expiryDate: null,
              isVerified: null,
              identityFilePath: null,
              createdBy: this.sessionstorage.getItem('userName'),
            });
          }
        }
      });
    });
    return iEMRids;
  }

  canDeactivate(): Observable<boolean> {
    if (this.beneficiaryRegistrationForm.dirty)
      return this.confirmationService.confirm(
        `info`,
        this.currentLanguageSet.alerts.info.navigateFurtherAlert,
        'Yes',
        'No'
      );
    else {
      return of(true);
    }
  }

  //AN40085822 13/10/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  //--End--
}
