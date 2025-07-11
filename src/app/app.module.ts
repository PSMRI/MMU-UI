import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { CoreModule } from './app-modules/core/core.module';
import { MaterialModule } from './app-modules/core/material.module';
import { HttpInterceptorService } from './app-modules/core/services/http-interceptor.service';
import { BrowserModule } from '@angular/platform-browser';
import { LoginComponent } from './app-modules/login/login.component';
import { ServiceComponent } from './app-modules/service/service.component';
import { ServicePointComponent } from './app-modules/service-point/service-point.component';
import { SetSecurityQuestionsComponent } from './app-modules/set-security-questions/set-security-questions.component';
import { SetPasswordComponent } from './app-modules/set-password/set-password.component';
import { TmLogoutComponent } from './app-modules/tm-logout/tm-logout.component';
import { ServicePointResolve } from './app-modules/service-point/service-point-resolve.service';
import { ServicePointService } from './app-modules/service-point/service-point.service';
import { ResetPasswordComponent } from './app-modules/reset-password/reset-password.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WebcamModule } from 'ngx-webcam';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { AudioRecordingService } from './app-modules/nurse-doctor/shared/services/audio-recording.service';
import { NgxPaginationModule } from 'ngx-pagination';
// import { SharedModule } from './app-modules/core/shared/shared/shared.module';
import { RegistrarService } from './app-modules/registrar/shared/services/registrar.service';
import { DataSYNCModule } from './app-modules/data-sync/dataSync.module';
import { SharedModule } from './app-modules/core/components/shared/shared.module';
import { CommonModule } from '@angular/common';
import { CaptchaComponent } from './app-modules/captcha/captcha.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ServiceComponent,
    ServicePointComponent,
    SetSecurityQuestionsComponent,
    SetPasswordComponent,
    ResetPasswordComponent,
    TmLogoutComponent,
    CaptchaComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    HttpClientModule,
    MaterialModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatGridListModule,
    WebcamModule,
    NgxPaginationModule,
    SharedModule,
    CoreModule.forRoot(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    HttpClient,
    ServicePointResolve,
    ServicePointService,
    RegistrarService,
    AudioRecordingService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
