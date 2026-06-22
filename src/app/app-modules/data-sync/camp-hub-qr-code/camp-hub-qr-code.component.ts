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

import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideWifi,
  lucideDownload,
  lucideRefreshCw,
  lucideQrCode,
  lucideCircleCheck,
  lucideInfo,
  lucideLoaderCircle,
} from '@ng-icons/lucide';
import * as QRCode from 'qrcode';
import { environment } from 'src/environments/environment';
import { ZardButtonComponent } from 'Common-UI/v2/ui/button';
import { ZardInputDirective } from 'Common-UI/v2/ui/input';
import { ZardFormImports } from 'Common-UI/v2/ui/form';
import { ZardDialogRef } from 'Common-UI/v2/ui/dialog';

interface ConnectInfo {
  ip: string;
  port: 8080;
}

@Component({
  selector: 'app-camp-hub-qr-code',
  standalone: true,
  templateUrl: './camp-hub-qr-code.component.html',
  styleUrls: ['./camp-hub-qr-code.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputDirective,
    ...ZardFormImports,
  ],
  viewProviders: [
    provideIcons({
      lucideWifi,
      lucideDownload,
      lucideRefreshCw,
      lucideQrCode,
      lucideCircleCheck,
      lucideInfo,
      lucideLoaderCircle,
    }),
  ],
})
export class CampHubQrCodeComponent implements OnInit {
  isDetecting = false;
  detectionFailed = false;
  isGenerating = false;
  qrDataUrl: string | null = null;
  generatedUrl: string | null = null;

  urlForm = this.fb.group({
    campHubUrl: [
      '',
      [Validators.required, Validators.pattern(/^https?:\/\/.+/)],
    ],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    @Optional()
    private readonly dialogRef: ZardDialogRef<CampHubQrCodeComponent>
  ) {}

  close(): void {
    this.dialogRef?.close();
  }

  ngOnInit(): void {
    this.autoDetect();
  }

  autoDetect(): void {
    this.isDetecting = true;
    this.detectionFailed = false;
    this.qrDataUrl = null;

    // Short timeout so a slow/unreachable endpoint falls back to manual entry
    // quickly (the original had no timeout — it relied on a fast network error).
    this.http
      .get<ConnectInfo>(environment.campHubConnectInfoAPI)
      .pipe(timeout(2500))
      .subscribe({
        next: res => {
          this.urlForm.controls.campHubUrl.setValue(`http://${res.ip}:8080/`);
          this.isDetecting = false;
          this.generate();
        },
        error: () => {
          this.detectionFailed = true;
          this.isDetecting = false;
        },
      });
  }

  generate(): void {
    if (this.urlForm.invalid) return;
    const url = (this.urlForm.value.campHubUrl ?? '').trim();
    this.isGenerating = true;
    this.qrDataUrl = null;

    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((dataUrl: string) => {
        this.generatedUrl = url;
        this.qrDataUrl = dataUrl;
        this.isGenerating = false;
      })
      .catch(() => {
        this.isGenerating = false;
      });
  }

  downloadQR(): void {
    if (!this.qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'camp-hub-server-url.png';
    link.href = this.qrDataUrl;
    link.click();
  }
}
