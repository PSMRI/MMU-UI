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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { TravelHistoryComponent } from './travel-history.component';

describe('TravelHistoryComponent', () => {
  let component: TravelHistoryComponent;
  let fixture: ComponentFixture<TravelHistoryComponent>;
  let master: any;
  let nurse: any;
  let doctor: any;
  let session: any;
  let masterListen: Subject<any>;
  let nurseListen: Subject<any>;
  let nurseMasterData$: BehaviorSubject<any>;

  const recMaster = Array.from({ length: 15 }, (_, i) => ({
    CovidrecommendationID: i + 1,
    recommendation: 'R' + (i + 1),
  }));

  const buildForm = () =>
    new FormGroup({
      travelStatus: new FormControl(null),
      travelList: new FormArray([]),
      recommendation: new FormArray([]),
      suspectedStatusUI: new FormControl(null),
      modeOfTravelDomestic: new FormControl(null),
      fromStateDom: new FormControl(null),
      fromDistrictDom: new FormControl(null),
      fromSubDistrictDom: new FormControl(null),
      toStateDom: new FormControl(null),
      toDistrictDom: new FormControl(null),
      toSubDistrictDom: new FormControl(null),
      modeOfTravelInter: new FormControl(null),
      fromCountryInter: new FormControl(null),
      fromCityInter: new FormControl(null),
      toCountryInter: new FormControl(null),
      toCityInter: new FormControl(null),
    });

  beforeEach(async () => {
    masterListen = new Subject();
    nurseListen = new Subject();
    nurseMasterData$ = new BehaviorSubject<any>({
      covidRecommendationMaster: recMaster,
    });
    master = autoSpy(MasterdataService, { nurseMasterData$ });
    master.listen.and.returnValue(masterListen.asObservable());
    nurse = autoSpy(NurseService);
    nurse.listen.and.returnValue(nurseListen.asObservable());
    nurse.getCountryName.and.returnValue(
      of({ statusCode: 200, data: [{ countryID: 1 }] })
    );
    nurse.getStateName.and.returnValue(
      of({ statusCode: 200, data: [{ stateID: 2 }] })
    );
    nurse.getCityName.and.returnValue(of({ statusCode: 200, data: ['c'] }));
    nurse.getDistrictName.and.returnValue(of({ statusCode: 200, data: ['d'] }));
    nurse.getSubDistrictName.and.returnValue(
      of({ statusCode: 200, data: ['sd'] })
    );
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TravelHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'v1', beneficiaryRegID: 'b1' },
        }),
        { provide: MasterdataService, useValue: master },
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TravelHistoryComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    spyOn(console, 'log');
    component.patientCovidForm = buildForm();
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  const recs = () =>
    (component.patientCovidForm.controls['recommendation'] as FormArray).value;
  const travelList = () =>
    component.patientCovidForm.controls['travelList'] as FormArray;
  const answers = (sym: string | null, con: string | null, all?: string) => {
    session.store.set('symptom', sym);
    session.store.set('contact', con);
    if (all !== undefined) session.store.set('allSymptom', all);
  };

  it('ngOnInit loads language, masters, states and countries', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.recommendationMaster).toEqual(recMaster);
    expect(component.recommendationTemporarayList[0]).toEqual(recMaster);
    expect(component.domestictype).toEqual(['Bus', 'Flight', 'Train', 'Ship']);
    expect(component.internationaltype).toEqual(['Flight', 'Ship']);
    expect(nurse.getStateName).toHaveBeenCalledWith(1);
    expect(component.states).toEqual([{ stateID: 2 }]);
    expect(component.countries).toEqual([{ countryID: 1 }]);
  });

  it('ignores master data without recommendations and failed lookups', () => {
    component.recommendationMaster = 'keep';
    nurseMasterData$.next({});
    expect(component.recommendationMaster).toBe('keep');
    nurse.getCountryName.and.returnValue(of({ statusCode: 500 }));
    nurse.getStateName.and.returnValue(of({ statusCode: 200, data: null }));
    component.countries = [];
    component.states = [];
    component.getCountryNames();
    component.getStateNames();
    expect(component.countries).toEqual([]);
    expect(component.states).toEqual([]);
  });

  it('recomputes recommendations on symptom and contact events', () => {
    spyOn(component, 'getrecommendedtext');
    masterListen.next('sym');
    nurseListen.next('con');
    expect(component.getrecommendedtext).toHaveBeenCalledTimes(2);
  });

  describe('getrecommendedtext', () => {
    const cases: [string, string, string, string, number[]][] = [
      ['yes', 'true', 'true', 'YES', [1, 2, 3, 4, 5]],
      ['yes', 'true', 'false', 'YES', [1, 2, 3, 4, 5]],
      ['no', 'true', 'true', 'YES', [1, 2, 3, 4, 5]],
      ['no', 'false', 'true', 'YES', [6, 7, 8, 9, 10, 11]],
      ['yes', 'false', 'true', 'YES', [6, 7, 8, 9, 10, 11]],
      ['yes', 'false', 'false', 'YES', [11, 12, 13]],
      ['no', 'true', 'false', 'NO', [5, 14]],
      ['no', 'false', 'false', 'NO', [11, 15]],
    ];
    cases.forEach(([q, a1, a2, status, ids]) => {
      it(`travel=${q} symptom=${a1} contact=${a2} -> ${status} ${ids}`, () => {
        answers(a1, a2, 'false');
        component.question1 = q;
        component.getrecommendedtext();
        expect(component.suspectedStatusUI).toBe(status);
        expect(component.travelReqiured).toBe('true');
        const expected = ids.map(i => 'R' + i);
        expect(recs()).toEqual([expected]);
        expect(component.recommendationText).toBe(expected.join('\n'));
      });
    });

    it('all symptoms flag gives suspected YES with 1-5 when no question answered', () => {
      answers(null, null, 'true');
      component.question1 = undefined as any;
      component.getrecommendedtext();
      expect(component.travelReqiured).toBe('false');
      expect(component.suspectedStatusUI).toBe('YES');
      expect(recs()).toEqual([['R1', 'R2', 'R3', 'R4', 'R5']]);
    });

    it('clears recommendations when nothing matches, replacing old ones', () => {
      answers('true', 'true', 'false');
      component.question1 = 'yes';
      component.getrecommendedtext();
      component.getrecommendedtext();
      expect(recs().length).toBe(1);
      answers(null, null, 'false');
      component.question1 = undefined as any;
      component.getrecommendedtext();
      expect(recs()).toEqual([]);
      expect(component.suspectedStatusUI).toBeNull();
      expect(component.recommendationText).toBeNull();
    });
  });

  describe('travelStatuschange', () => {
    it('yes enables travel and stores flag', () => {
      answers('true', 'true', 'false');
      component.travelStatuschange('true');
      expect(session.setItem).toHaveBeenCalledWith('travelstat', 'true');
      expect(component.travelStatus).toBe('true');
      expect(component.disableTravelButton).toBeFalse();
      expect(component.travelSelected).toBeTrue();
      expect(component.question1).toBe('yes');
      expect(component.istravelStatus).toBeTrue();
      expect(recs().length).toBe(1);
    });

    it('no clears travel list and resets domestic/international fields', () => {
      travelList().push(new FormControl('Domestic'));
      travelList().push(new FormControl('International'));
      component.patientCovidForm.patchValue({
        fromStateDom: 1,
        toCityInter: 2,
      });
      component.istravelModeDomestic = true;
      component.istravelModeInternatinal = true;
      answers('false', 'false', 'false');
      component.travelStatuschange('false');
      expect(component.question1).toBe('no');
      expect(component.istravelStatus).toBeFalse();
      expect(component.istravelModeDomestic).toBeFalse();
      expect(component.istravelModeInternatinal).toBeFalse();
      expect(travelList().length).toBe(0);
      expect(component.fromStateDom).toBeNull();
      expect(component.toCityInter).toBeNull();
      expect(recs()).toEqual([['R11', 'R15']]);
    });
  });

  describe('onChange', () => {
    it('checking Domestic/International adds entries and flags', () => {
      component.onChange('Domestic', { target: { checked: true } });
      component.onChange('International', { target: { checked: true } });
      expect(travelList().value).toEqual(['Domestic', 'International']);
      expect(component.istravelModeDomestic).toBeTrue();
      expect(component.istravelModeInternatinal).toBeTrue();
    });

    it('unchecking removes the entry and resets its fields', () => {
      component.onChange('Domestic', { target: { checked: true } });
      component.onChange('International', { target: { checked: true } });
      component.patientCovidForm.patchValue({
        modeOfTravelDomestic: 'Bus',
        modeOfTravelInter: 'Ship',
      });
      component.onChange('Domestic', { target: { checked: false } });
      expect(travelList().value).toEqual(['International']);
      expect(component.istravelModeDomestic).toBeFalse();
      expect(component.modeOfTravelDomestic).toBeNull();
      component.onChange('International', { target: { checked: false } });
      expect(travelList().value).toEqual([]);
      expect(component.istravelModeInternatinal).toBeFalse();
      expect(component.modeOfTravelInter).toBeNull();
    });
  });

  describe('location lookups', () => {
    it('international cities from/to patch country and load cities', () => {
      component.getCitiesFromInter(5);
      component.getCitiesToInter(6);
      expect(nurse.getCityName).toHaveBeenCalledWith(5);
      expect(nurse.getCityName).toHaveBeenCalledWith(6);
      expect(component.fromCountryInter).toBe(5);
      expect(component.toCountryInter).toBe(6);
      expect(component.citiesFromInter).toEqual(['c']);
      expect(component.citiesToInter).toEqual(['c']);
    });

    it('domestic districts and sub-districts patch and load', () => {
      component.GetDistrictsFromDom(1);
      component.GetDistrictsToDom(2);
      component.GetSubDistrictFromDom(3);
      component.getSubDistrictToDom(4);
      expect(component.fromStateDom).toBe(1);
      expect(component.toStateDom).toBe(2);
      expect(component.fromDistrictDom).toBe(3);
      expect(component.toDistrictDom).toBe(4);
      expect(component.districtsFromDom).toEqual(['d']);
      expect(component.districtsToDom).toEqual(['d']);
      expect(component.subDistrictsFromDom).toEqual(['sd']);
      expect(component.subDistrictsToDom).toEqual(['sd']);
    });

    it('failed lookups keep previous lists', () => {
      nurse.getCityName.and.returnValue(of({ statusCode: 500 }));
      nurse.getDistrictName.and.returnValue(of({ statusCode: 500 }));
      nurse.getSubDistrictName.and.returnValue(of({ statusCode: 500 }));
      component.getCitiesFromInter(1);
      component.getCitiesToInter(1);
      component.GetDistrictsFromDom(1);
      component.GetDistrictsToDom(1);
      component.GetSubDistrictFromDom(1);
      component.getSubDistrictToDom(1);
      expect(component.citiesFromInter).toEqual([]);
      expect(component.citiesToInter).toEqual([]);
      expect(component.districtsFromDom).toEqual([]);
      expect(component.districtsToDom).toEqual([]);
      expect(component.subDistrictsFromDom).toEqual([]);
      expect(component.subDistrictsToDom).toEqual([]);
    });

    it('simple setters patch form values and handler lists', () => {
      component.traveldomesticStatuschange('Bus');
      component.travelinternationalStatuschange('Flight');
      component.CitiesFromInter('Paris');
      component.CitiesToInter('Rome');
      component.getVillage(7);
      component.getVillageTosubDistrictDom(8);
      expect(component.modeOfTravelDomestic).toBe('Bus');
      expect(component.modeOfTravelInter).toBe('Flight');
      expect(component.fromCityInter).toBe('Paris');
      expect(component.toCityInter).toBe('Rome');
      expect(component.fromSubDistrictDom).toBe(7);
      expect(component.toSubDistrictDom).toBe(8);
      expect(component.recommendation).toEqual([]);

      component.getAllCitySuccessHandelerFromInter(['a']);
      component.getAllCitySuccessHandelerToInter(['b']);
      component.getAllStatesSuccessHandeler(['s']);
      component.SetDistrictsFromDom(['df']);
      component.SetDistrictsTomDom(['dt']);
      component.getSubDistrictSuccessHandelerFromDom(['sf']);
      component.getSubDistrictSuccessHandelerToDom(['st']);
      component.getVillageSuccessHandeler(['v']);
      expect(component.citiesFromInter).toEqual(['a']);
      expect(component.citiesToInter).toEqual(['b']);
      expect(component.states).toEqual(['s']);
      expect(component.districtsFromDom).toEqual(['df']);
      expect(component.districtsToDom).toEqual(['dt']);
      expect(component.subDistrictsFromDom).toEqual(['sf']);
      expect(component.subDistrictsToDom).toEqual(['st']);
      expect(component.villages).toEqual(['v']);
    });
  });

  describe('view mode', () => {
    const details = (over: any = {}) => ({
      statusCode: 200,
      data: {
        covidDetails: {
          suspectedStatus: true,
          recommendation: [['a', 'b']],
          travelStatus: true,
          travelList: ['Domestic', 'International'],
          modeOfTravelDomestic: 'Bus',
          fromStateDom: 1,
          fromDistrictDom: 2,
          fromSubDistrictDom: 3,
          toStateDom: 4,
          toDistrictDom: 5,
          toSubDistrictDom: 6,
          modeOfTravelInter: 'Flight',
          fromCountryInter: 7,
          fromCityInter: 8,
          toCountryInter: 9,
          toCityInter: 10,
          ...over,
        },
      },
    });

    it('ngOnChanges in view mode loads and patches history', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of(details()));
      component.mode = 'VIEW';
      component.ngOnChanges();
      expect(component.readTravel).toBeTrue();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('b1', 'v1');
      expect(component.suspectedStatusUI).toBe('YES');
      expect(component.recommendationText).toBe('a\nb');
      expect(component.travelStatus).toBe('true');
      expect(component.istravelStatus).toBeTrue();
      expect(component.domtravel).toBeTrue();
      expect(component.intertravel).toBeTrue();
      expect(component.istravelModeDomestic).toBeTrue();
      expect(component.istravelModeInternatinal).toBeTrue();
      const v = component.patientCovidForm.value;
      expect(v.modeOfTravelDomestic).toBe('Bus');
      expect(v.fromStateDom).toBe(1);
      expect(v.fromDistrictDom).toBe(2);
      expect(v.fromSubDistrictDom).toBe(3);
      expect(v.toStateDom).toBe(4);
      expect(v.toDistrictDom).toBe(5);
      expect(v.toSubDistrictDom).toBe(6);
      expect(v.modeOfTravelInter).toBe('Flight');
      expect(v.fromCountryInter).toBe(7);
      expect(v.fromCityInter).toBe(8);
      expect(v.toCountryInter).toBe(9);
      expect(v.toCityInter).toBe(10);
      expect(nurse.getDistrictName).toHaveBeenCalledWith(1);
      expect(nurse.getSubDistrictName).toHaveBeenCalledWith(5);
      expect(nurse.getCityName).toHaveBeenCalledWith(9);
    });

    it('not suspected, no travel: patches NO/false and skips travel sections', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of(
          details({
            suspectedStatus: false,
            travelStatus: false,
            travelList: [],
          })
        )
      );
      component.getHistoryDetails('b', 'v');
      expect(component.suspectedStatusUI).toBe('NO');
      expect(component.travelStatus).toBe('false');
      expect(component.istravelStatus).toBeFalse();
      expect(component.domtravel).toBeFalse();
      expect(component.intertravel).toBeFalse();
    });

    it('ignores responses without covid details and non-view mode', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: {} })
      );
      component.getHistoryDetails('b', 'v');
      expect(component.covidHistoryDetails).toBeUndefined();
      doctor.getVisitComplaintDetails.calls.reset();
      component.mode = 'edit';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('travelListStatus does nothing without history', () => {
      component.covidHistoryDetails = undefined;
      component.travelListStatus();
      expect(component.formArray).toBe(travelList());
    });
  });

  it('ngOnDestroy unsubscribes open subscriptions', () => {
    const a = { unsubscribe: jasmine.createSpy('a') };
    const b = { unsubscribe: jasmine.createSpy('b') };
    component.covidHistory = a;
    component.nurseMasterDataSubscription = b;
    component.ngOnDestroy();
    expect(a.unsubscribe).toHaveBeenCalled();
    expect(b.unsubscribe).toHaveBeenCalled();
    component.covidHistory = null;
    component.nurseMasterDataSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
