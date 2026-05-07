import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
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
import { AppRoutingModule } from './app/app-routing.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { WebcamModule } from 'ngx-webcam';
import { NgxPaginationModule } from 'ngx-pagination';
import { CoreModule } from './app/app-modules/core/core.module';
import { MatChipsModule } from '@angular/material/chips';
import { TrackingModule } from 'Common-UI/src/tracking';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(CommonModule, BrowserModule, FormsModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, AppRoutingModule, MatGridListModule, WebcamModule, NgxPaginationModule, CoreModule.forRoot(), MatChipsModule, TrackingModule.forRoot()),
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
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
    ]
})
  .catch(err => console.error(err));
