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
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { saveAs } from 'file-saver';
import * as QRCode from 'qrcode';
import { environment } from 'src/environments/environment';
import { ConfirmationService } from '../../core/services/confirmation.service';

interface ConnectInfo {
  ip: string;
  port: 8080;
}

interface CampInfo {
  vanID: string;
  vanLabel: string;
  servicePointID: string;
  servicePointName: string;
}

interface ImportRowResult {
  rowIndex: number;
  benRegId: number | null;
  firstName: string;
  middleLastName: string;
  status: string;
  generatedId: string;
  note: string;
}

interface ImportSummary {
  csvRowCount: number;
  updated: number;
  failed: number;
  needsReview: number;
  needsReviewRows: ImportRowResult[];
  failedRows: ImportRowResult[];
}

/** Keeps a single date-range download from spanning so many days that
 * generating/transferring the CSV becomes slow enough to feel like it's
 * hanging the browser tab. */
const MAX_RANGE_DAYS = 90;

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

  // ── Download Beneficiaries (Nikshay CSV) tab ──
  today = new Date();
  isDownloadingCsv = false;
  campInfo: CampInfo | null = null;

  downloadForm = this.fb.group({
    fromDate: [null as Date | null, Validators.required],
    toDate: [null as Date | null, Validators.required],
  });

  // ── Upload Nikshay Results tab ──
  isUploadingCsv = false;
  selectedResultsFile: File | null = null;
  lastImportSummary: ImportSummary | null = null;

  uploadForm = this.fb.group({
    visitDate: [null as Date | null, Validators.required],
  });

  private dialogRef: MatDialogRef<CampHubQrCodeComponent> | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private injector: Injector,
    private sessionstorage: SessionStorageService,
    private confirmationService: ConfirmationService
  ) {
    this.dialogRef = this.injector.get(MatDialogRef, null);
  }

  close(): void {
    this.dialogRef?.close();
  }

  ngOnInit(): void {
    this.autoDetect();
    this.loadCampInfo();
  }

  private loadCampInfo(): void {
    try {
      const serviceLine = JSON.parse(
        this.sessionstorage.getItem('serviceLineDetails') ?? 'null'
      );
      const servicePointID = this.sessionstorage.getItem('servicePointID');
      const servicePointName = this.sessionstorage.getItem('servicePointName');
      this.campInfo =
        serviceLine?.vanID && servicePointID
          ? {
              vanID: serviceLine.vanID,
              vanLabel:
                serviceLine.vanNoAndType ||
                serviceLine.vehicalNo ||
                `Van ${serviceLine.vanID}`,
              servicePointID,
              servicePointName: servicePointName || `#${servicePointID}`,
            }
          : null;
    } catch {
      this.campInfo = null;
    }
  }

  autoDetect(): void {
    this.isDetecting = true;
    this.detectionFailed = false;
    this.qrDataUrl = null;

    this.http.get<ConnectInfo>(environment.campHubConnectInfoAPI).subscribe({
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

  downloadBeneficiariesCsv(): void {
    if (this.downloadForm.invalid) {
      this.downloadForm.markAllAsTouched();
      return;
    }
    if (!this.campInfo) {
      this.confirmationService.alert(
        'No active camp session found — select a van and service point first.',
        'error'
      );
      return;
    }

    const fromDate = this.downloadForm.value.fromDate as Date;
    const toDate = this.downloadForm.value.toDate as Date;
    const rangeDays =
      Math.round(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    if (rangeDays < 1) {
      this.confirmationService.alert(
        'The "From" date must be on or before the "To" date.',
        'error'
      );
      return;
    }
    if (rangeDays > MAX_RANGE_DAYS) {
      this.confirmationService.alert(
        `Please choose a range of ${MAX_RANGE_DAYS} days or fewer so the download stays quick.`,
        'warning'
      );
      return;
    }

    const params = {
      fromDate: this.formatDate(fromDate),
      toDate: this.formatDate(toDate),
      vanID: String(this.campInfo.vanID),
      servicePointID: String(this.campInfo.servicePointID),
    };

    this.isDownloadingCsv = true;
    this.http
      .get(environment.nikshayBeneficiaryCsvUrl, {
        params,
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (res: HttpResponse<Blob>) => {
          this.isDownloadingCsv = false;
          const body = res.body;
          if (!body || body.size === 0) {
            this.confirmationService.alert(
              'No beneficiaries found for the selected date range.',
              'info'
            );
            return;
          }
          const filename = this.extractFilename(
            res.headers.get('content-disposition'),
            `nikshay-beneficiaries-${params.fromDate}-to-${params.toDate}.csv`
          );
          saveAs(body, filename);
        },
        error: () => {
          this.isDownloadingCsv = false;
          this.confirmationService.alert(
            'Could not download the beneficiary CSV. Please try again.',
            'error'
          );
        },
      });
  }

  onResultsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedResultsFile = input.files?.[0] ?? null;
    this.lastImportSummary = null;
  }

  uploadResultsCsv(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }
    if (!this.campInfo) {
      this.confirmationService.alert(
        'No active camp session found — select a van and service point first.',
        'error'
      );
      return;
    }
    if (!this.selectedResultsFile) {
      this.confirmationService.alert(
        'Please choose the Nikshay results CSV file to upload.',
        'error'
      );
      return;
    }

    const visitDate = this.uploadForm.value.visitDate as Date;
    const formData = new FormData();
    formData.append('file', this.selectedResultsFile);

    const params = {
      vanID: String(this.campInfo.vanID),
      servicePointID: String(this.campInfo.servicePointID),
      visitDate: this.formatDate(visitDate),
    };

    this.isUploadingCsv = true;
    this.lastImportSummary = null;
    this.http
      .post<ImportSummary>(environment.nikshayImportResultsCsvUrl, formData, {
        params,
      })
      .subscribe({
        next: summary => {
          this.isUploadingCsv = false;
          this.lastImportSummary = summary;
          const needsAttention = summary.failed > 0 || summary.needsReview > 0;
          this.confirmationService.alert(
            `Import complete — ${summary.updated} Nikshay ID(s) updated, ` +
              `${summary.needsReview} row(s) need review, ${summary.failed} failed.`,
            needsAttention ? 'warning' : 'info'
          );
        },
        error: err => {
          this.isUploadingCsv = false;
          const message =
            typeof err?.error === 'string'
              ? err.error
              : 'Could not import the results CSV. Please try again.';
          this.confirmationService.alert(message, 'error');
        },
      });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private extractFilename(
    contentDisposition: string | null,
    fallback: string
  ): string {
    const match = contentDisposition
      ? /filename="?([^";]+)"?/i.exec(contentDisposition)
      : null;
    return match ? match[1] : fallback;
  }
}
