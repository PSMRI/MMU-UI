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

import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DoctorService } from '../shared/services/doctor.service';
import { ActivatedRoute } from '@angular/router';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit, OnChanges {
  @Input()
  patientHistoryDataForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  mode!: string;

  @Input()
  pregnancyStatus!: string;

  @Input()
  primeGravidaStatus: any;

  showGeneralOPD = false;
  showCancer = false;

  attendant: any;

  constructor(
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService
  ) {}

  ngOnInit() {
    this.showHistoryTabs();
    this.attendant = this.route.snapshot.params['attendant'];
    this.doctorService.setCapturedHistoryByNurse(null);

    if (this.attendant !== 'nurse') this.generalHistory();
  }

  ngOnChanges() {
    this.showHistoryTabs();
  }
  showHistoryTabs() {
    if (
      this.visitCategory &&
      (this.visitCategory === 'General OPD' ||
        this.visitCategory === 'ANC' ||
        this.visitCategory === 'NCD care' ||
        this.visitCategory === 'PNC' ||
        this.visitCategory === 'COVID-19 Screening' ||
        this.visitCategory === 'NCD screening')
    ) {
      this.showGeneralOPD = true;
      this.showCancer = false;
    } else {
      this.showCancer = true;
      this.showGeneralOPD = false;
    }
  }
  generalHistory() {
    const visitID = this.sessionstorage.getItem('visitID');
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((historyresponse: any) => {
        if (
          historyresponse.statusCode === 200 &&
          historyresponse !== undefined
        ) {
          this.doctorService.setCapturedHistoryByNurse(historyresponse);
        }
      });
  }
}
