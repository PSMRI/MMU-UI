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

import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WorkareaComponent } from './workarea/workarea.component';
import { CanDeactivateGuardService } from '../core/services/can-deactivate-guard.service';
import { DataSyncLoginComponent } from '../core/components/data-sync-login/data-sync-login.component';
import { DataSyncService } from './shared/service/data-sync.service';
import { MasterDownloadComponent } from './master-download/master-download.component';

export const DATA_SYNC_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    providers: [DataSyncService, MasterDownloadComponent],
    children: [
      {
        path: '',
        redirectTo: 'sync-login',
        pathMatch: 'full',
      },
      {
        path: 'workarea',
        component: WorkareaComponent,
        canDeactivate: [CanDeactivateGuardService],
      },
      {
        path: 'sync-login',
        component: DataSyncLoginComponent,
      },
    ],
  },
];
