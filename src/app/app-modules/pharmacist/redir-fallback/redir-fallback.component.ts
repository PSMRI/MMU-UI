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
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ConfirmationService } from './../../core/services/confirmation.service';
import { Router, Route } from '@angular/router';

@Component({
  selector: 'app-redir-fallback',
  templateUrl: './redir-fallback.component.html',
  styleUrls: ['./redir-fallback.component.css'],

  standalone: false,
})
export class RedirFallbackComponent implements AfterViewInit {
  constructor(
    private confirmationService: ConfirmationService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    Promise.resolve(null).then(() => {
      this.confirmationService.alert(
        'Issues in connecting to Inventory, try again later',
        'error'
      );
      this.router.navigate(['/pharmacist/pharmacist-worklist']);
    });
  }
}
