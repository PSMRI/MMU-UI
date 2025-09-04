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

// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const commonIP = 'http://localhost';
const tmIP = 'http://localhost';
const mmuIP = 'http://localhost';
const schedulerIP = 'http://localhost';
const mmuUI_IP = 'http://localhost';
const schedulerUI_IP = 'http://localhost';
const inventoryUI_IP = 'http://localhost';
const identityIP = 'http://localhost';

const SERVER_IP = 'http://localhost';
const SWYMED_IP = 'http://localhost';
const adminIP = 'http://localhost';
const FHIRIP = 'http://localhost';

// With API MAN Configuration
// const COMMON_API_OPEN = `http://${IP}:8080/apiman-gateway/IEMR/Common/open/`;
// const COMMON_API = `http://${IP}:8080/apiman-gateway/IEMR/Common/open/`;
// const MMU_API = `http://${IP}:8080/apiman-gateway/IEMR/MMU/1.0/`;

// Without API MAN Configuration
const ADMIN_API = `${adminIP}:8082/`;
const COMMON_API_OPEN = `${commonIP}:8083/`;
const COMMON_API = `${commonIP}:8083/`;
const MMU_API = `${mmuIP}:8087/`;
const TM_API = `${tmIP}:8089/`;
const COMMON_API_OPEN_SYNC = `${SERVER_IP}:8083/`;
const SCHEDULER_API = `${schedulerIP}:8088/`;
const FHIR_API = `${FHIRIP}:8093/`;
const IDENTITY_API = `${identityIP}:8094/`;

const mmuUICasesheet = `${mmuUI_IP}:4202`;
const IOT_API = 'http://localhost:8080/ezdx-hub-connect-srv';
const sessionStorageEncKey = '';

const siteKey = '';
const captchaChallengeURL = '';
const enableCaptcha = false;

export const environment = {
  production: false,
  isMMUOfflineSync: true,
  encKey: sessionStorageEncKey,

  app: `MMU`,
  RBSTest: `RBS Test`,
  visualAcuityTest: `Visual Acuity Test`,
  haemoglobinTest: `Haemoglobin Test`,
  parentAPI: `${MMU_API}`,

  tracking: {
    platform: 'matomo',
    siteId: 3,
    trackerUrl: 'https://matomo.piramalswasthya.org/',
    trackingPlatform: 'production',
    enabled: true,
  },

  INVENTORY_URL: `${inventoryUI_IP}:4201/#/redirin?`,
  fallbackUrl: `/pharmacist/redirfallback`,
  redirInUrl: `/pharmacist/redirin`,

  TELEMEDICINE_URL: `${schedulerUI_IP}:4208/#/?`,
  fallbackMMUUrl: `/logout-tm`,
  redirInMMUUrl: `/common/tcspecialist-worklist`,
  licenseURL: `${COMMON_API}license.html`,
  getSessionExistsURL: `${COMMON_API}user/getLoginResponse`,
  extendSessionUrl: `${MMU_API}common/extend/redisSession`,
  /**
   * Login and Logout Urls
   */
  syncLoginUrl: `${COMMON_API_OPEN_SYNC}user/userAuthenticate`,
  loginUrl: `${COMMON_API_OPEN}user/userAuthenticate`,
  logoutUrl: `${COMMON_API_OPEN}user/userLogout`,
  userlogoutPreviousSessionUrl: `${COMMON_API_OPEN}user/logOutUserFromConcurrentSession`,
  syncUserlogoutPreviousSessionUrl: `${COMMON_API_OPEN_SYNC}user/logOutUserFromConcurrentSession`,

  /**
   * Security Question and Forgot password Url
   */
  getUserSecurityQuestionsAnswerUrl: `${COMMON_API_OPEN}user/forgetPassword`,
  getSecurityQuestionUrl: `${COMMON_API_OPEN}user/getsecurityquetions`,
  saveUserSecurityQuestionsAnswerUrl: `${COMMON_API_OPEN}user/saveUserSecurityQuesAns`,
  setNewPasswordUrl: `${COMMON_API_OPEN}user/setForgetPassword`,
  previousVisitDataUrl: `${MMU_API}common/getBenSymptomaticQuestionnaireDetails`,
  servicePointUrl: `${MMU_API}user/getUserVanSpDetails`,
  servicePointVillages: `${MMU_API}user/getServicepointVillages`,

  registerBeneficiaryUrl: `${MMU_API}registrar/registrarBeneficaryRegistration/`,
  updateBeneficiaryUrl: `${MMU_API}registrar/update/BeneficiaryDetails`,
  submitBeneficiaryIdentityUrl: `${MMU_API}registrar/registrarBeneficaryRegistrationNew`,
  updateBeneficiaryIdentityUrl: `${MMU_API}registrar/update/BeneficiaryUpdate`,

  registrarMasterDataUrl: `${MMU_API}registrar/registrarMasterData`,
  quickSearchUrl: `${MMU_API}registrar/quickSearch`,
  identityQuickSearchUrl: `${MMU_API}registrar/quickSearchNew`,
  advanceSearchUrl: `${MMU_API}registrar/advanceSearch`,
  advanceSearchIdentityUrl: `${MMU_API}registrar/advanceSearchNew`,
  patientRevisitSubmitToNurse: `${MMU_API}common/update/benDetailsAndSubmitToNurse`,
  identityPatientRevisitSubmitToNurseURL: `${MMU_API}registrar/create/BenReVisitToNurse`,
  /**
   * Master Data Urls
   */
  previousPhyscialactivityHistoryUrl: `${MMU_API}common/getBenPhysicalHistory`,
  previousDiabetesHistoryUrl: `${MMU_API}common/getBenPreviousDiabetesHistoryDetails`,
  previousReferredHistoryUrl: `${MMU_API}common/getBenPreviousReferralHistoryDetails`,
  getDistrictListUrl: `${MMU_API}location/get/districtMaster/`,
  getSubDistrictListUrl: `${MMU_API}location/get/districtBlockMaster/`,
  getVillageListUrl: `${MMU_API}location/get/villageMasterFromBlockID/`,
  demographicsCurrentMasterUrl: `${MMU_API}location/getLocDetailsBasedOnSpIDAndPsmID`,
  visitDetailMasterDataUrl: `${MMU_API}master/get/visitReasonAndCategories`,
  nurseMasterDataUrl: `${MMU_API}master/nurse/masterData/`,
  doctorMasterDataUrl: `${MMU_API}master/doctor/masterData/`,
  snomedCTRecordURL: `${MMU_API}snomed/getSnomedCTRecord`,
  diagnosisSnomedCTRecordUrl: `${MMU_API}snomed/getSnomedCTRecordList`,
  getDistrictTalukUrl: `${MMU_API}location/get/DistrictTalukMaster/`,
  snomedCTRecordListURL1: `${COMMON_API}snomed/getSnomedCTRecordList`,
  diagnosisSnomedCTRecordUrl1: `${COMMON_API}snomed/getSnomedCTRecordList`,
  /**
   * Lab Data Urls
   */
  getNCDScreeningIDRSDetails: `${MMU_API}NCD/getBenIdrsDetailsFrmNurse`,
  getprescribedTestDataUrl: `${MMU_API}labTechnician/get/prescribedProceduresList`,
  labSaveWork: `${MMU_API}labTechnician/save/LabTestResult`,
  getEcgAbnormalitiesMasterUrl: `${MMU_API}master/ecgAbnormalities`,

  /**
   * Worklist Urls
   */

  nurseWorklist: `${MMU_API}common/getNurseWorklistNew/`,
  labWorklist: `${MMU_API}common/getLabWorklistNew/`,
  doctorWorkList: `${MMU_API}common/getDocWorklistNew/`,
  doctorFutureWorkList: `${MMU_API}common/getDocWorkListNewFutureScheduledForTM/`,
  specialistWorkListURL: `${MMU_API}common/getTCSpecialistWorklist/`,
  specialistFutureWorkListURL: `${MMU_API}common/getTCSpecialistWorklistFutureScheduled/`,
  radiologistWorklist: `${MMU_API}common/getRadiologist-worklist-New/`,
  oncologistWorklist: `${MMU_API}common/getOncologist-worklist-New/`,
  pharmacistWorklist: `${MMU_API}common/getPharma-worklist-New/`,

  // New API
  getBeneficiaryDetail: `${MMU_API}registrar/get/benDetailsByRegIDForLeftPanelNew`,

  getCompleteBeneficiaryDetail: `${MMU_API}registrar/get/beneficiaryDetails`,

  // getBeneficiaryImage: `${MMU_API}registrar/get/beneficiaryImage`,
  // New API
  getBeneficiaryImage: `${MMU_API}registrar/getBenImage`,
  getPreviousVisitDetailsUrl: `${MMU_API}casesheet/getBeneficiaryCaseSheetHistory`,
  updateVisitStatus: `${MMU_API}doctor/updateBeneficiaryStatus`,

  // printCancerCase_sheet_url: `${mmuUICasesheet}`,
  // updateOncologistRemarksCancelUrl: `${MMU_API}oncologist/update/examinationScreen/diagnosis`,
  updateOncologistRemarksCancelUrl: `${MMU_API}CS-cancerScreening/update/examinationScreen/diagnosis`,
  //commented by NEERAJ on 06-03-2018, because modified the url
  //getStatesURL: `${COMMON_API}location/states/`,
  //getDistrictsURL: `${COMMON_API}location/districts/`,

  getStatesURL: `${MMU_API}location/get/stateMaster`,
  getDistrictsURL: `${MMU_API}location/get/districtMaster/`,
  countryId: 1,

  /**
   * NCD SCREENING API URLs
   */
  postNCDScreeningDetails: `${MMU_API}NCD/save/nurseData`,
  // getNCDScreeningVisitDetails: `${MMU_API}CS-cancerScreening/getBenDataFrmNurseToDocVisitDetailsScreen`,
  getNCDScreeningVisitDetails: `${MMU_API}NCD/getBenVisitDetailsFrmNurseNCDScreening`,
  getNCDScreeningDetails: `${MMU_API}NCD/get/nurseData`,
  updateNCDScreeningDetails: `${MMU_API}NCD/update/nurseData`,
  saveDoctorNCDScreeningDetails: `${MMU_API}NCD/save/doctorData`,
  getNCDScreeningHistoryDetails: `${MMU_API}NCD/getBenHistoryDetails`,
  getNCDSceeriningVitalDetails: `${MMU_API}NCD/getBenVitalDetailsFrmNurse`,

  updateNCDScreeningHistoryDetailsUrl: `${MMU_API}NCD/update/historyScreen`,
  updateNCDScreeningDoctorDetails: `${MMU_API}NCD/update/doctorData`,
  updateNCDVitalsDetailsUrl: `${MMU_API}NCD/update/vitalScreen`,
  updateNCDScreeningIDRSDetailsUrl: `${MMU_API}NCD/update/idrsScreen`,

  /**
   * GENERAL OPD QUICK CONSULT API URLs
   */
  saveNurseGeneralQuickConsult: `${MMU_API}genOPD-QC-quickConsult/save/nurseData`,
  saveDoctorGeneralQuickConsult: `${MMU_API}genOPD-QC-quickConsult/save/doctorData`,

  getGeneralOPDQuickConsultVisitDetails: `${MMU_API}genOPD-QC-quickConsult/getBenDataFrmNurseToDocVisitDetailsScreen`,
  getGeneralOPDQuickConsultVitalDetails: `${MMU_API}genOPD-QC-quickConsult/getBenVitalDetailsFrmNurse`,

  /**
   * ANC API URLs
   */
  saveNurseANCDetails: `${MMU_API}ANC/save/nurseData`,
  saveDoctorANCDetails: `${MMU_API}ANC/save/doctorData`,

  getANCVisitDetailsUrl: `${MMU_API}ANC/getBenVisitDetailsFrmNurseANC`,
  getANCDetailsUrl: `${MMU_API}ANC/getBenANCDetailsFrmNurseANC`,
  getANCVitalsDetailsUrl: `${MMU_API}ANC/getBenANCVitalDetailsFrmNurseANC`,
  getANCHistoryDetailsUrl: `${MMU_API}ANC/getBenANCHistoryDetails`,
  getANCExaminationDataUrl: `${MMU_API}ANC/getBenExaminationDetailsANC`,

  updateANCVisitDetailsUrl: `${MMU_API}ANC/update/visitDetailsScreen`,
  updateANCDetailsUrl: `${MMU_API}ANC/update/ANCScreen`,
  updateANCVitalsDetailsUrl: `${MMU_API}ANC/update/vitalScreen`,
  updateANCHistoryDetailsUrl: `${MMU_API}ANC/update/historyScreen`,
  updateANCExaminationDetailsUrl: `${MMU_API}ANC/update/examinationScreen`,

  /**
   * CANCER SCREENING API URLs
   */
  saveNurseCancerScreeningDetails: `${MMU_API}CS-cancerScreening/save/nurseData`,
  saveDoctorCancerScreeningDetails: `${MMU_API}CS-cancerScreening/save/doctorData`,

  getCancerScreeningVisitDetails: `${MMU_API}CS-cancerScreening/getBenDataFrmNurseToDocVisitDetailsScreen`,
  getCancerScreeningHistoryDetails: `${MMU_API}CS-cancerScreening/getBenDataFrmNurseToDocHistoryScreen`,
  getCancerScreeningVitalsDetails: `${MMU_API}CS-cancerScreening/getBenDataFrmNurseToDocVitalScreen`,
  getCancerScreeningExaminationDetails: `${MMU_API}CS-cancerScreening/getBenDataFrmNurseToDocExaminationScreen`,

  previousCancerFamilyHistoryUrl: `${MMU_API}CS-cancerScreening/getBenCancerFamilyHistory`,
  previousCancerPersonalHabitHistoryUrl: `${MMU_API}CS-cancerScreening/getBenCancerPersonalHistory`,
  previousCancerPersonalDietHistoryUrl: `${MMU_API}CS-cancerScreening/getBenCancerPersonalDietHistory`,
  previousCancerPastObstetricHistoryUrl: `${MMU_API}CS-cancerScreening/getBenCancerObstetricHistory`,

  updateCancerScreeningHistory: `${MMU_API}CS-cancerScreening/update/historyScreen`,
  updateCancerScreeningVitals: `${MMU_API}CS-cancerScreening/update/vitalScreen`,
  updateCancerScreeningExamination: `${MMU_API}CS-cancerScreening/update/examinationScreen`,

  getCancerScreeningCaseSheet: `${MMU_API}CS-cancerScreening/getBeneficiaryDataEnteredByNurseAndDoctor`,

  /**
   * GENERAL OPD API URLs
   */
  saveNurseGeneralOPDDetails: `${MMU_API}generalOPD/save/nurseData`,

  updateGeneralOPDHistoryDetailsUrl: `${MMU_API}generalOPD/update/historyScreen`,
  updateGeneralOPDVitalsDetailsUrl: `${MMU_API}generalOPD/update/vitalScreen`,
  updateGeneralOPDExaminationDetailsUrl: `${MMU_API}generalOPD/update/examinationScreen`,

  saveDoctorGeneralOPDDetails: `${MMU_API}generalOPD/save/doctorData`,

  getGeneralOPDVisitDetailsUrl: `${MMU_API}generalOPD/getBenVisitDetailsFrmNurseGOPD`,
  getGeneralOPDHistoryDetailsUrl: `${MMU_API}generalOPD/getBenHistoryDetails`,
  getGeneralOPDVitalDetailsUrl: `${MMU_API}generalOPD/getBenVitalDetailsFrmNurse`,
  getGeneralOPDExaminationDetailsUrl: `${MMU_API}generalOPD/getBenExaminationDetails`,

  /**
   * Covid API Urls
   */
  saveNurseCovidCareDetails: `${MMU_API}pandemic/covid/save/nurseData`,

  saveDoctorCovidCareDetails: `${MMU_API}pandemic/covid/save/doctorData`,

  updateCovidCareHistoryDetailsUrl: `${MMU_API}pandemic/covid/update/historyScreen`,
  updateCovidCareVitalsDetailsUrl: `${MMU_API}pandemic/covid/update/vitalScreen`,

  getCovidCareVisitDetailsUrl: `${MMU_API}pandemic/covid/getBenVisitDetailsFrmNurseCovid`,
  getCovidCareHistoryDetailsUrl: `${MMU_API}pandemic/covid/getBenCovid19HistoryDetails`,
  getCovidCareVitalDetailsUrl: `${MMU_API}pandemic/covid/getBenVitalDetailsFrmNurseCovid`,
  getCovidDoctorDetails: `${MMU_API}pandemic/covid/getBenCaseRecordFromDoctorCovid`,
  updateCovidDoctorDetails: `${MMU_API}pandemic/covid/update/doctorData`,

  /**
   * comman API for fetching state and cities
   */

  getStateName: `${COMMON_API}location/states/`,
  getDistrictName: `${COMMON_API}location/districts/`,
  getSubDistrictName: `${COMMON_API}location/taluks/`,
  getCountryName: `${MMU_API}location/get/countryMaster`,
  getCityName: `${MMU_API}location/get/countryCityMaster/`,
  /**
   * NCD Care API Urls
   */
  saveNurseNCDCareDetails: `${MMU_API}NCDCare/save/nurseData`,

  saveDoctorNCDCareDetails: `${MMU_API}NCDCare/save/doctorData`,

  updateNCDCareHistoryDetailsUrl: `${MMU_API}NCDCare/update/historyScreen`,
  updateNCDCareVitalsDetailsUrl: `${MMU_API}NCDCare/update/vitalScreen`,

  getNCDCareVisitDetailsUrl: `${MMU_API}NCDCare/getBenVisitDetailsFrmNurseNCDCare`,
  getNCDCareHistoryDetailsUrl: `${MMU_API}NCDCare/getBenNCDCareHistoryDetails`,
  getNCDCareVitalDetailsUrl: `${MMU_API}NCDCare/getBenVitalDetailsFrmNurseNCDCare`,

  /**
   * PNC Urls
   */
  savePNCNurseDetailsUrl: `${MMU_API}PNC/save/nurseData`,
  savePNCDoctorDetailsUrl: `${MMU_API}PNC/save/doctorData`,

  getPNCVisitDetailsUrl: `${MMU_API}PNC/getBenVisitDetailsFrmNursePNC`,
  getPNCDetailsUrl: `${MMU_API}PNC/getBenPNCDetailsFrmNursePNC`,
  getPNCVitalsDetailsUrl: `${MMU_API}PNC/getBenVitalDetailsFrmNurse`,
  getPNCHistoryDetailsUrl: `${MMU_API}PNC/getBenHistoryDetails`,
  getPNCExaminationDataUrl: `${MMU_API}PNC/getBenExaminationDetailsPNC`,

  updatePNCDetailsUrl: `${MMU_API}PNC/update/PNCScreen`,
  updatePNCHistoryDetailsUrl: `${MMU_API}PNC/update/historyScreen`,
  updatePNCVitalsDetailsUrl: `${MMU_API}PNC/update/vitalScreen`,
  updatePNCExaminationDetailsUrl: `${MMU_API}PNC/update/examinationScreen`,

  /*
   */
  getPreviousSignificiantFindingUrl: `${MMU_API}common/getDoctorPreviousSignificantFindings`,

  getCancerScreeningDoctorDetails: `${MMU_API}CS-cancerScreening/getBenCaseRecordFromDoctorCS`,

  getGeneralOPDQuickConsultDoctorDetails: `${MMU_API}genOPD-QC-quickConsult/getBenCaseRecordFromDoctorQuickConsult`,
  getANCDoctorDetails: `${MMU_API}ANC/getBenCaseRecordFromDoctorANC`,
  getGeneralOPDDoctorDetails: `${MMU_API}generalOPD/getBenCaseRecordFromDoctorGeneralOPD`,
  getNCDCareDoctorDetails: `${MMU_API}NCDCare/getBenCaseRecordFromDoctorNCDCare`,
  getPNCDoctorDetails: `${MMU_API}PNC/getBenCaseRecordFromDoctorPNC`,

  updateCancerScreeningDoctorDetails: `${MMU_API}CS-cancerScreening/update/doctorData`,

  updateGeneralOPDQuickConsultDoctorDetails: `${MMU_API}genOPD-QC-quickConsult/update/doctorData`,
  updateANCDoctorDetails: `${MMU_API}ANC/update/doctorData`,
  updateGeneralOPDDoctorDetails: `${MMU_API}generalOPD/update/doctorData`,
  updateNCDCareDoctorDetails: `${MMU_API}NCDCare/update/doctorData`,
  updatePNCDoctorDetails: `${MMU_API}PNC/update/doctorData`,

  // getCasesheetDataUrl: `${MMU_API}common/get/Case-sheet/printData`,

  previousPastHistoryUrl: `${MMU_API}common/getBenPastHistory`,
  previousMedicationHistoryUrl: `${MMU_API}common/getBenMedicationHistory`,
  previousTobaccoHistoryUrl: `${MMU_API}common/getBenTobaccoHistory`,
  previousAlcoholHistoryUrl: `${MMU_API}common/getBenAlcoholHistory`,
  previousAllergyHistoryUrl: `${MMU_API}common/getBenAllergyHistory`,
  previousFamilyHistoryUrl: `${MMU_API}common/getBenFamilyHistory`,
  previousPastObstetricHistoryUrl: `${MMU_API}common/getBenPastObstetricHistory`,
  previousMestrualHistoryUrl: `${MMU_API}common/getBenMenstrualHistory`,
  previousComorbidityHistoryUrl: `${MMU_API}common/getBenComorbidityConditionHistory`,

  previousImmunizationHistoryUrl: `${MMU_API}common/getBenChildVaccineHistory`,
  previousOtherVaccineHistoryUrl: `${MMU_API}common/getBenOptionalVaccineHistory`,
  previousPerinatalHistory: `${MMU_API}common/getBenPerinatalHistory`,
  previousDevelopmentHistory: `${MMU_API}common/getBenDevelopmentHistory`,
  previousFeedingHistory: `${MMU_API}common/getBenFeedingHistory`,

  /* */

  archivedReportsUrl: `${MMU_API}labTechnician/get/labResultForVisitcode`,
  previousMMUHistoryUrl: `${MMU_API}common/getBeneficiaryCaseSheetHistory`,
  previousTMHistoryUrl: `${TM_API}common/getBeneficiaryCaseSheetHistory`,
  previousMCTSHistoryUrl: `${COMMON_API}mctsOutboundHistoryController/getMctsCallHistory`,
  previous104HistoryUrl: `${COMMON_API}beneficiary/get104BenMedHistory`,
  patientMCTSCallHistoryUrl: `${COMMON_API}mctsOutboundHistoryController/getMctsCallResponse`,
  drugDeleteUrl: `${MMU_API}common/doctor/delete/prescribedMedicine`,
  newTaburl: `${mmuUICasesheet}`,
  getTMCasesheetDataUrl: `${TM_API}common/get/Case-sheet/printData`,
  getMMUCasesheetDataUrl: `${MMU_API}common/get/Case-sheet/printData`,
  getDataSYNCGroupUrl: `${MMU_API}dataSyncActivity/getSyncGroupDetails`,
  syncDataUploadUrl: `${MMU_API}dataSyncActivity/van-to-server`,
  syncDataDownloadUrl: `${MMU_API}dataSyncActivity/startMasterDownload`,
  syncDownloadProgressUrl: `${MMU_API}dataSyncActivity/checkMastersDownloadProgress`,
  getNcdScreeningVisitCountUrl: `${MMU_API}NCD/getNcdScreeningVisitCount/`,
  getNCDScreeningDoctorDetails: `${MMU_API}NCD/getBenCaseRecordFromDoctorNCDScreening`,
  getVanDetailsForMasterDownloadUrl: `${MMU_API}dataSyncActivity/getVanDetailsForMasterDownload`,

  getMasterSpecializationUrl: `${SCHEDULER_API}/specialist/masterspecialization`,
  getSpecialistUrl: `${SCHEDULER_API}/specialist/getSpecialist`,
  getAvailableSlotUrl: `${SCHEDULER_API}/schedule/getavailableSlot`,
  getSwymedMailUrl: `${SCHEDULER_API}/van/getvan`,

  updateBeneficiaryArrivalStatusUrl: `${MMU_API}tc/update/benArrivalStatus`,
  cancelBeneficiaryTCRequestUrl: `${MMU_API}tc/cancel/benTCRequest`,

  scheduleTCUrl: `${MMU_API}tc/create/benTCRequestWithVisitCode`,
  beneficiaryTCRequestStatusUrl: `${MMU_API}tc/check/benTCRequestStatus`,

  swymedUrl: `${SWYMED_IP}`,
  saveSpecialistCancerObservationUrl: `${MMU_API}CS-cancerScreening/update/doctorData`,

  getReportsMasterUrl: `${MMU_API}report/getReportMaster/`,
  getVanMasterUrl: `${MMU_API}user/getVanMaster/`,
  getReportDataUrl: `${MMU_API}report/getReportNew`,
  getServiceOnStateUrl: `${COMMON_API}service/serviceList`,
  apiVersionUrl: `${MMU_API}version`,

  //file upload
  saveFile: `${MMU_API}commonInsert/saveFiles`,
  viewFileData: `${MMU_API}common/downloadFile`,
  ioturl: '' + IOT_API,
  deviceStatusurl: IOT_API + '/api/v1/bluetooth/hub/connection_status',
  deviceBluetoothurl: IOT_API + '/api/v1/bluetooth/service_discovery',
  deviceDisconnectUrl: `${IOT_API}/api/v1/bluetooth/hub/disconnect`,
  connectdeviceBluetoothurl: IOT_API + '/api/v1/bluetooth/hub_connection',

  startWeighturl: '/api/v1/physical_tests/weight',
  startTempurl: '/api/v1/physical_tests/temperature',
  startPulseurl: '/api/v1/physical_tests/pulse_oxymetry',
  startBPurl: '/api/v1/physical_tests/blood_pressure',
  startHemoglobinurl: '/api/v1/wbpoct_tests/hemoglobin',
  startBloodGlucoseurl: '/api/v1/wbpoct_tests/blood_glucose',
  startRBSurl: '/api/v1/wbpoct_tests/blood_glucose',

  // Check availability of benIDs
  getBenIDs: `${IDENTITY_API}id/checkAvailablBenIDLocalServer`,
  generateBenID: `${MMU_API}dataSyncActivity/callCentralAPIToGenerateBenIDAndimportToLocal`,

  // Inventory Data Sync Download
  getInventorySyncData: `${MMU_API}dataSyncActivity/downloadTransactionToLocal`,
  nurseWorklistTMreferred: `${MMU_API}common/getNurseWorklistTMreferred/`,

  //fetch TM Casesheet
  getTMCasesheetData: `${MMU_API}common/get/Case-sheet/TMReferredprintData`,

  /*Load HRP Details */
  loadHRPUrl: `${MMU_API}ANC/getHRPStatus`,

  /*Doctor signature download */
  downloadSignUrl: `${COMMON_API}signature1/`,

  //calibration integration
  getCalibrationStrips: `${ADMIN_API}fetchCalibrationStrips`,

  getLanguageList: `${COMMON_API}beneficiary/getLanguageList`,

  calculateBmiStatus: `${TM_API}common/calculateBMIStatus`,

  validateSecurityQuestionAndAnswerUrl: `${COMMON_API_OPEN}user/validateSecurityQuestionAndAnswer`,
  getTransactionIdForChangePasswordUrl: `${COMMON_API_OPEN}user/getTransactionIdForChangePassword`,

  /*Covid vaccination Urls */
  vaccinationTypeAndDoseMasterUrl: `${COMMON_API}covid/master/VaccinationTypeAndDoseTaken`,
  saveCovidVaccinationDetailsUrl: `${COMMON_API}covid/saveCovidVaccinationDetails`,
  previousCovidVaccinationUrl: `${COMMON_API}covid/getCovidVaccinationDetails`,

  /* SWAASA Urls*/
  getResultStatusURL: `${COMMON_API}lungAssessment/startAssesment`,
  getAssessmentUrl: `${COMMON_API}lungAssessment/getAssesment`,
  getAssessmentIdUrl: `${COMMON_API}lungAssessment/getAssesmentDetails`,

  /* Customization APIs*/
  getAllRegistrationData: `${COMMON_API}customization/fetchAllData`,

  /** Previous Anthropometry  Urls */
  getPreviousAnthropometryUrl: `${MMU_API}anthropometryVitals/getBenHeightDetailsFrmNurse`,
  /*Health ID OTP Generation URL*/
  otpGenerationUrl: `${FHIR_API}healthID/generateOTP`,
  otpGenerationWithUIDUrl: `${FHIR_API}healthIDWithUID/generateOTP`,
  healthIdGenerationUrl: `${FHIR_API}healthID/verifyOTPAndGenerateHealthID`,
  healthIdGenerationWithUIDUrl: `${FHIR_API}healthIDWithUID/createHealthIDWithUID`,
  verifyOTPUrl: `${FHIR_API}healthIDWithUID/verifyOTP`,
  checkAndGenerateMobileOTPUrl: `${FHIR_API}healthIDWithUID/checkAndGenerateMobileOTP`,
  verifyMobileOTPUrl: `${FHIR_API}healthIDWithUID/verifyMobileOTP`,
  gethealthIdDetailsUrl: `${FHIR_API}healthID/getBenhealthID`,
  mapHealthIdUrl: `${FHIR_API}healthID/mapHealthIDToBeneficiary`,

  /*Health ID - care context Mapping*/
  careContextGenerateOtpUrl: `${FHIR_API}careContext/generateOTPForCareContext`,
  verifyOtpForMappingContextUrl: `${FHIR_API}careContext/validateOTPAndCreateCareContext`,

  /*Health ID Validation URL*/
  generateOTPForHealthIDValidation: `${FHIR_API}validate/generateOTPForHealthIDValidation`,
  verifyOTPForHealthIDValidation: `${FHIR_API}validate/verifyOTPForHealthIDValidation`,

  /* Health ID Card Generation*/
  generateOTPForHealthIDCard: `${FHIR_API}healthIDCard/generateOTP`,
  verifyOTPAndGenerateHealthCard: `${FHIR_API}healthIDCard/verifyOTPAndGenerateHealthCard`,
  updateAmritIDInMongo: `${FHIR_API}patient/data/patient/updateAmritIdMongo`,

  /*Family Tagging Urls */
  relationShipUrl: `${TM_API}registrar/registrarMasterData`,
  saveFamilyTaggingUrl: `${IDENTITY_API}family/addTag`,
  editFamilyTaggingUrl: `${IDENTITY_API}family/editFamilyTagging`,
  untagFamilyUrl: `${IDENTITY_API}family/untag`,
  familySearchUrl: `${IDENTITY_API}family/searchFamily`,
  createFamilyUrl: `${IDENTITY_API}family/createFamily`,
  getFamilyMemberUrl: `${IDENTITY_API}family/getFamilyDetails`,

  /* ABDM Mapped Facility */
  getAbdmMappedFacility: `${COMMON_API}facility/getWorklocationMappedAbdmFacility/`,
  saveAbdmFacilityIdForVisit: `${FHIR_API}facility/saveAbdmFacilityId`,

  /* Abha V3 APIs */
  requestOtpForAbhaEnroll: `${FHIR_API}abhaCreation/requestOtpForAbhaEnrollment`,
  abhaEnrollmentByAadhaar: `${FHIR_API}abhaCreation/abhaEnrollmentByAadhaar`,
  verifyMobileForAbhaAuth: `${FHIR_API}abhaCreation/verifyAuthByMobile`,
  requestOtpForLogin: `${FHIR_API}abhaLogin/abhaLoginRequestOtp`,
  verifyOtpForLogin: `${FHIR_API}abhaLogin/verifyAbhaLogin`,
  printPngCard: `${FHIR_API}abhaCreation/printAbhaCard`,
  printWebLoginPhrCard: `${FHIR_API}abhaCreation/printWebLoginPhrCard`,
  abhaExtension: `@sbx`,
  confirmAadharBio: `${FHIR_API}healthIDWithBio/confirmWithAadhaarBio`,
  generateABHAForBio: `${FHIR_API}healthIDWithBio/verifyBio`,
  generateABHAForBioMobileOTP: `${FHIR_API}healthIDWithBio/generateMobileOTP`,

  getBenIdForhealthID: `${FHIR_API}healthID/getBenIdForhealthID`,

  siteKey: siteKey,
  captchaChallengeURL: captchaChallengeURL,
  enableCaptcha: enableCaptcha,
};
