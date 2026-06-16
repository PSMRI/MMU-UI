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
import { AuthGuard } from './app-modules/core/services/auth-guard.service';
import { LoginComponent } from './app-modules/login/login.component';
import { ServiceComponent } from './app-modules/service/service.component';
import { SetPasswordComponent } from './app-modules/set-password/set-password.component';
import { SetSecurityQuestionsComponent } from './app-modules/set-security-questions/set-security-questions.component';
import { TmLogoutComponent } from './app-modules/tm-logout/tm-logout.component';
import { ServicePointComponent } from './app-modules/service-point/service-point.component';
import { ServicePointResolve } from './app-modules/service-point/service-point-resolve.service';
import { ResetPasswordComponent } from './app-modules/reset-password/reset-password.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'logout-tm',
    component: TmLogoutComponent,
  },
  {
    path: 'set-security-questions',
    component: SetSecurityQuestionsComponent,
  },
  {
    path: 'set-password',
    component: SetPasswordComponent,
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'service',
    component: ServiceComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'servicePoint',
    component: ServicePointComponent,
    canActivate: [AuthGuard],
    resolve: {
      servicePoints: ServicePointResolve,
    },
  },
  {
    path: 'registrar',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('Common-UI/v2/registrar/registration.module').then(
        module => module.RegistrationModule
      ),
  },
  {
    path: 'nurse-doctor',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/nurse-doctor/nurse-doctor.routes').then(
        m => m.NURSE_DOCTOR_ROUTES
      ),
  },
  {
    path: 'lab',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/lab/lab.routes').then(m => m.LAB_ROUTES),
  },
  {
    path: 'pharmacist',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/pharmacist/pharmacist.routes').then(
        m => m.PHARMACIST_ROUTES
      ),
  },
  {
    path: 'datasync',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/data-sync/dataSync.routes').then(
        m => m.DATA_SYNC_ROUTES
      ),
  },
  {
    path: 'feedback',
    loadChildren: () =>
      import('Common-UI/v2/feedback/feedback.module').then(
        m => m.FeedbackModule
      ),
  },
];
