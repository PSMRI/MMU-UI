import {
  HttpClient,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ServicePointResolve } from './app/app-modules/service-point/service-point-resolve.service';
import { ServicePointService } from './app/app-modules/service-point/service-point.service';
import { RegistrarService } from './app/app-modules/registrar/shared/services/registrar.service';
import { AudioRecordingService } from './app/app-modules/nurse-doctor/shared/services/audio-recording.service';
import { HttpInterceptorService } from './app/app-modules/core/services/http-interceptor.service';
import { CommonModule } from '@angular/common';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app/app.routes';
import { MatGridListModule } from '@angular/material/grid-list';
import { WebcamModule } from 'ngx-webcam';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgChartsModule } from 'ng2-charts';
import { MatChipsModule } from '@angular/material/chips';
import { TrackingModule } from 'Common-UI/v2/tracking';
import { provideZard } from 'Common-UI/v2/ui/provider';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';

// Former CoreModule.forRoot() singleton services, now provided at the app root.
import {
  ConfirmationService,
  CameraService,
  AuthService,
  SpinnerService,
  BeneficiaryDetailsService,
} from './app/app-modules/core/services';
import { AuthGuard } from './app/app-modules/core/services/auth-guard.service';
import { CommonService } from './app/app-modules/core/services/common-services.service';
import { HttpServiceService } from './app/app-modules/core/services/http-service.service';
import { InventoryService } from './app/app-modules/core/services/inventory.service';
import { IotService } from './app/app-modules/core/services/iot.service';
import { CanDeactivateGuardService } from './app/app-modules/core/services/can-deactivate-guard.service';
import { SetLanguageComponent } from './app/app-modules/core/components/set-language.component';
import { CameraDialogComponent } from './app/app-modules/core/components/camera-dialog/camera-dialog.component';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      CommonModule,
      BrowserModule,
      FormsModule,
      MatIconModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatGridListModule,
      WebcamModule,
      NgxPaginationModule,
      NgChartsModule,
      MatChipsModule,
      TrackingModule.forRoot()
    ),
    provideRouter(routes, withHashLocation()),
    // Zard custom event-manager plugins ({key} multi-key + .debounce template syntax).
    provideZard(),
    HttpClient,
    ServicePointResolve,
    ServicePointService,
    RegistrarService,
    AudioRecordingService,
    // Former CoreModule.forRoot() providers.
    ConfirmationService,
    CameraService,
    AuthGuard,
    AuthService,
    SpinnerService,
    BeneficiaryDetailsService,
    CommonService,
    InventoryService,
    SetLanguageComponent,
    CanDeactivateGuardService,
    CameraDialogComponent,
    HttpServiceService,
    IotService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
  ],
}).catch(() => {});
