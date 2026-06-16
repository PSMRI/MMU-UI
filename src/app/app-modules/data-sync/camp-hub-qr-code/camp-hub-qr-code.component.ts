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

import { Component, OnInit, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import * as QRCode from 'qrcode';
import { environment } from 'src/environments/environment';

interface ConnectInfo {
  ip: string;
  port: number;
}

@Component({
  selector: 'app-camp-hub-qr-code',
  templateUrl: './camp-hub-qr-code.component.html',
  styleUrls: ['./camp-hub-qr-code.component.css'],
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

  private dialogRef: MatDialogRef<CampHubQrCodeComponent> | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private injector: Injector
  ) {
    this.dialogRef = this.injector.get(MatDialogRef, null);
  }

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

    this.http.get<ConnectInfo>(environment.campHubConnectInfoAPI).subscribe({
      next: res => {
        this.urlForm.controls.campHubUrl.setValue(
          `http://${res.ip}:${res.port}/`
        );
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
