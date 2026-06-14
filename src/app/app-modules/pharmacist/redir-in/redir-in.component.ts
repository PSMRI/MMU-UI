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

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationService } from './../../core/services/confirmation.service';

@Component({
  selector: 'app-redir-in',
  templateUrl: './redir-in.component.html',
  styleUrls: ['./redir-in.component.css'],
  standalone: false,
})
export class RedirInComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.getresponse();
  }

  getresponse() {
    let resolve;
    let language;
    this.route.queryParams.subscribe(params => {
      resolve =
        params['resolve'] === 'undefined' ? undefined : params['resolve'];
      language =
        params['currentLanguage'] === 'undefined'
          ? 'English'
          : params['currentLanguage'];
    });
    console.log('resolve', resolve);
    if (language !== undefined) sessionStorage.setItem('setLanguage', language);
    if (resolve) {
      this.confirmationService.alert('Items Dispensed', 'info');
    }
    this.router.navigate(['/pharmacist/pharmacist-worklist']);
  }

  routeToDesignation(designation: any) {
    switch (designation) {
      case 'Registrar':
        this.router.navigate(['/registrar/registration']);
        break;
      case 'Nurse':
        this.router.navigate(['/nurse-doctor/nurse-worklist']);
        break;
      case 'Doctor':
        this.router.navigate(['/nurse-doctor/doctor-worklist']);
        break;
      case 'Lab Technician':
        this.router.navigate(['/lab']);
        break;
      case 'Pharmacist':
        this.router.navigate(['/pharmacist']);
        break;
      case 'Radiologist':
        this.router.navigate(['/nurse-doctor/radiologist-worklist']);
        break;
      case 'Oncologist':
        this.router.navigate(['/nurse-doctor/oncologist-worklist']);
        break;
      default:
    }
  }
}
