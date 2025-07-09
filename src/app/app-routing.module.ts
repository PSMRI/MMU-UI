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

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './app-modules/core/services/auth-guard.service';
import { LoginComponent } from './app-modules/login/login.component';
import { ServiceComponent } from './app-modules/service/service.component';
import { SetPasswordComponent } from './app-modules/set-password/set-password.component';
import { SetSecurityQuestionsComponent } from './app-modules/set-security-questions/set-security-questions.component';
import { TmLogoutComponent } from './app-modules/tm-logout/tm-logout.component';
import { ServicePointComponent } from './app-modules/service-point/service-point.component';
import { ServicePointResolve } from './app-modules/service-point/service-point-resolve.service';
import { ResetPasswordComponent } from './app-modules/reset-password/reset-password.component';

const routes: Routes = [
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
      import('Common-UI/src/registrar/registration.module').then(
        module => module.RegistrationModule
      ),
  },
  {
    path: 'nurse-doctor',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/nurse-doctor/nurse-doctor.module').then(
        module => module.NurseDoctorModule
      ),
  },
  {
    path: 'lab',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/lab/lab.module').then(module => module.LabModule),
  },
  {
    path: 'pharmacist',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/pharmacist/pharmacist.module').then(
        module => module.PharmacistModule
      ),
  },
  {
    path: 'datasync',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/data-sync/dataSync.module').then(
        module => module.DataSYNCModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
