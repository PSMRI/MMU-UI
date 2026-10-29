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

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IdrsscoreService } from './idrsscore.service';

describe('IdrsscoreService', () => {
  let service: IdrsscoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IdrsscoreService],
    });
    service = TestBed.inject(IdrsscoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listen and filter', () => {
    it('should emit value through listen when filter is called', done => {
      service.listen().subscribe(val => {
        expect(val).toBe('test');
        done();
      });
      service.filter('test');
    });
  });

  describe('setdymmyvalue', () => {
    it('should emit disease through dummyValue$', done => {
      service.dummyValue$.subscribe(val => {
        if (val === 'diabetes') {
          expect(val).toBe('diabetes');
          done();
        }
      });
      service.setdymmyvalue('diabetes');
    });
  });

  describe('IDRS Family Score', () => {
    it('should set and emit family score', done => {
      service.IDRSFamilyScore$.subscribe(val => {
        if (val === 30) {
          expect(val).toBe(30);
          expect(service.IRDSscore).toBe(30);
          done();
        }
      });
      service.setIDRSFamilyScore(30);
    });
  });

  describe('setConfirmedDisease', () => {
    it('should set and emit confirmed value', done => {
      service.confirmed$.subscribe(val => {
        if (val === false) {
          expect(val).toBe(false);
          done();
        }
      });
      service.setConfirmedDisease(false);
    });
  });

  describe('clearMessage', () => {
    it('should reset family, waist, and physical activity scores to 0', () => {
      service.setIDRSFamilyScore(30);
      service.setIDRSScoreWaist(20);
      service.setIRDSscorePhysicalActivity(10);
      service.clearMessage();

      let familyScore: any;
      service.IDRSFamilyScore$.subscribe(v => (familyScore = v));
      expect(familyScore).toBe(0);

      let waistScore: any;
      service.IDRSWaistScore$.subscribe(v => (waistScore = v));
      expect(waistScore).toBe(0);

      let activityScore: any;
      service.IDRSPhysicalActivityScore$.subscribe(v => (activityScore = v));
      expect(activityScore).toBe(0);
    });
  });

  describe('IDRS Waist Score', () => {
    it('should set and emit waist score', done => {
      service.IDRSWaistScore$.subscribe(val => {
        if (val === 20) {
          expect(service.IRDSscoreWaist).toBe(20);
          done();
        }
      });
      service.setIDRSScoreWaist(20);
    });
  });

  describe('IDRS Physical Activity Score', () => {
    it('should set and emit physical activity score', done => {
      service.IDRSPhysicalActivityScore$.subscribe(val => {
        if (val === 15) {
          expect(service.IRDSscorePhysicalActivity).toBe(15);
          done();
        }
      });
      service.setIRDSscorePhysicalActivity(15);
    });
  });

  describe('IDRS Score Flag', () => {
    it('should set flag to 1', () => {
      service.setIDRSScoreFlag();
      expect(service.IDRSScoreFlag).toBe(1);
      let flagVal: any;
      service.IDRSScoreFlagCheck$.subscribe(v => (flagVal = v));
      expect(flagVal).toBe(1);
    });

    it('should clear flag to 0', () => {
      service.setIDRSScoreFlag();
      service.clearScoreFlag();
      expect(service.IDRSScoreFlag).toBe(0);
    });
  });

  describe('Suspected Array', () => {
    it('should set suspected flag', () => {
      service.setSuspectedArrayValue();
      expect(service.IDRSSuspected).toBe(1);
    });

    it('should clear suspected flag', () => {
      service.setSuspectedArrayValue();
      service.clearSuspectedArrayFlag();
      expect(service.IDRSSuspected).toBe(0);
    });
  });

  describe('Diabetes Selected', () => {
    it('should set diabetes selected', () => {
      service.setDiabetesSelected();
      expect(service.diabetesSelected).toBe(1);
    });

    it('should clear diabetes selected', () => {
      service.setDiabetesSelected();
      service.clearDiabetesSelected();
      expect(service.diabetesSelected).toBe(0);
    });
  });

  describe('Visual Acuity Test Mandatory', () => {
    it('should set mandatory flag', () => {
      service.setVisualAcuityTestMandatoryFlag();
      expect(service.VisualAcuityTestMandatory).toBe(1);
    });

    it('should clear mandatory flag', () => {
      service.setVisualAcuityTestMandatoryFlag();
      service.clearVisualAcuityTestMandatoryFlag();
      expect(service.VisualAcuityTestMandatory).toBe(0);
    });
  });

  describe('Systolic BP', () => {
    it('should set systolic bp', () => {
      service.setSystolicBp(120);
      expect(service.systolicBp).toBe(120);
    });

    it('should clear systolic bp to 0', () => {
      service.setSystolicBp(120);
      service.clearSystolicBp();
      expect(service.systolicBp).toBe(0);
    });
  });

  describe('Diastolic BP', () => {
    it('should set diastolic bp', () => {
      service.setDiastolicBp(80);
      expect(service.diastolicBp).toBe(80);
    });

    it('should clear diastolic bp to 0', () => {
      service.setDiastolicBp(80);
      service.clearDiastolicBp();
      expect(service.diastolicBp).toBe(0);
    });
  });

  describe('Master Present Flags', () => {
    it('should set rBS present flag', () => {
      service.rBSPresentInMaster();
      expect(service.rBSPresent).toBe(1);
    });

    it('should set visual acuity present flag', () => {
      service.visualAcuityPresentInMaster();
      expect(service.visualAcuityPresent).toBe(1);
    });

    it('should set haemoglobin present flag', () => {
      service.haemoglobinPresentInMaster();
      expect(service.heamoglobinPresent).toBe(1);
    });
  });

  describe('TMC Suggested', () => {
    it('should set TMC suggested', () => {
      service.setTMCSuggested();
      expect(service.tmcSuggested).toBe(1);
    });

    it('should clear TMC suggested', () => {
      service.setTMCSuggested();
      service.clearTMCSuggested();
      let val: any;
      service.tmcSuggestedFlag$.subscribe(v => (val = v));
      expect(val).toBe(0);
    });
  });

  describe('Referral Suggested', () => {
    it('should set referral suggested', () => {
      service.setReferralSuggested();
      expect(service.referralSuggested).toBe(1);
    });

    it('should clear referral suggested', () => {
      service.setReferralSuggested();
      service.clearReferralSuggested();
      expect(service.referralSuggested).toBe(0);
    });
  });

  describe('Diseases Selected/Unchecked', () => {
    it('should set diseases selected', done => {
      service.visitDiseases$.subscribe(val => {
        if (val === 'Diabetes') {
          expect(val).toBe('Diabetes');
          done();
        }
      });
      service.setDiseasesSelected('Diabetes');
    });

    it('should clear diseases selected', () => {
      service.setDiseasesSelected('Diabetes');
      service.clearDiseaseSelected();
      let val: any;
      service.visitDiseases$.subscribe(v => (val = v));
      expect(val).toBeNull();
    });

    it('should set unchecked diseases', done => {
      service.uncheckedDiseases$.subscribe(val => {
        if (val === 'Hypertension') {
          expect(val).toBe('Hypertension');
          done();
        }
      });
      service.setUnchecked('Hypertension');
    });

    it('should clear unchecked diseases', () => {
      service.setUnchecked('Hypertension');
      service.clearUnchecked();
      let val: any;
      service.uncheckedDiseases$.subscribe(v => (val = v));
      expect(val).toBeNull();
    });
  });

  describe('TMC Submit Disable', () => {
    it('should set TMC submit disable flag', () => {
      service.setTMCSubmit(false);
      let val: any;
      service.tmcSubmitDisable$.subscribe(v => (val = v));
      expect(val).toBe(false);
    });
  });

  describe('Hypertension Selected', () => {
    it('should set hypertension selected', () => {
      service.setHypertensionSelected();
      expect(service.hypertensionSelected).toBe(1);
    });

    it('should clear hypertension selected', () => {
      service.setHypertensionSelected();
      service.clearHypertensionSelected();
      expect(service.hypertensionSelected).toBe(0);
    });
  });

  describe('Confirmed Diabetic Selected', () => {
    it('should set confirmed diabetic selected', () => {
      service.setConfirmedDiabeticSelected();
      expect(service.confirmedDiabeticSelected).toBe(1);
    });

    it('should clear confirmed diabetic selected', () => {
      service.setConfirmedDiabeticSelected();
      service.clearConfirmedDiabeticSelected();
      expect(service.confirmedDiabeticSelected).toBe(0);
    });
  });

  describe('boolean flags', () => {
    it('should have isHypertensionConfirmed as false by default', () => {
      expect(service.isHypertensionConfirmed).toBeFalse();
    });

    it('should have isDiabeticsConfirmed as false by default', () => {
      expect(service.isDiabeticsConfirmed).toBeFalse();
    });
  });
});
