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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { CampHubQrCodeComponent } from './camp-hub-qr-code.component';
import { environment } from 'src/environments/environment';
import { createDialogRefMock, NO_ERRORS_SCHEMA } from 'src/testing/test-utils';

async function waitUntil(cond: () => boolean) {
  for (let i = 0; i < 100 && !cond(); i++) {
    await new Promise(r => setTimeout(r, 5));
  }
}

describe('CampHubQrCodeComponent', () => {
  let fixture: ComponentFixture<CampHubQrCodeComponent>;
  let component: CampHubQrCodeComponent;
  let httpMock: HttpTestingController;

  async function setup(providers: any[] = []) {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      declarations: [CampHubQrCodeComponent],
      providers,
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CampHubQrCodeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  describe('with a dialog ref', () => {
    let dialogRef: any;

    beforeEach(async () => {
      dialogRef = createDialogRefMock();
      await setup([{ provide: MatDialogRef, useValue: dialogRef }]);
    });

    it('auto-detects the server URL on init and generates a QR code', async () => {
      fixture.detectChanges();
      expect(component.isDetecting).toBeTrue();
      const req = httpMock.expectOne(environment.campHubConnectInfoAPI);
      expect(req.request.method).toBe('GET');
      req.flush({ ip: '10.0.0.5', port: 8080 });

      expect(component.isDetecting).toBeFalse();
      expect(component.urlForm.value.campHubUrl).toBe('http://10.0.0.5:8080/');
      expect(component.isGenerating).toBeTrue();
      await waitUntil(() => !component.isGenerating);
      expect(component.generatedUrl).toBe('http://10.0.0.5:8080/');
      expect(component.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('flags detection failure on HTTP error', () => {
      fixture.detectChanges();
      httpMock
        .expectOne(environment.campHubConnectInfoAPI)
        .flush('x', { status: 500, statusText: 'err' });
      expect(component.detectionFailed).toBeTrue();
      expect(component.isDetecting).toBeFalse();
      expect(component.qrDataUrl).toBeNull();
    });

    it('close() closes the dialog', () => {
      component.close();
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('generate() does nothing when the form is invalid', () => {
      component.urlForm.controls.campHubUrl.setValue('ftp://bad');
      component.generate();
      expect(component.isGenerating).toBeFalse();
      expect(component.qrDataUrl).toBeNull();
    });

    it('generate() trims the URL', async () => {
      component.urlForm.controls.campHubUrl.setValue('http://1.2.3.4:8080/  ');
      component.generate();
      await waitUntil(() => !component.isGenerating);
      expect(component.generatedUrl).toBe('http://1.2.3.4:8080/');
    });

    it('generate() clears the generating flag when QR creation fails', async () => {
      component.urlForm.controls.campHubUrl.setValue(
        'http://' + 'a'.repeat(4000)
      );
      component.generate();
      await waitUntil(() => !component.isGenerating);
      expect(component.isGenerating).toBeFalse();
      expect(component.qrDataUrl).toBeNull();
      expect(component.generatedUrl).toBeNull();
    });

    it('downloadQR() does nothing without a QR code', () => {
      const click = spyOn(HTMLAnchorElement.prototype, 'click');
      component.downloadQR();
      expect(click).not.toHaveBeenCalled();
    });

    it('downloadQR() clicks a download link for the QR image', () => {
      const click = spyOn(HTMLAnchorElement.prototype, 'click');
      component.qrDataUrl = 'data:image/png;base64,AAA';
      component.downloadQR();
      const anchor = click.calls.mostRecent().object as HTMLAnchorElement;
      expect(anchor.download).toBe('camp-hub-server-url.png');
      expect(anchor.href).toBe('data:image/png;base64,AAA');
    });
  });

  describe('without a dialog ref', () => {
    beforeEach(async () => setup());

    it('close() is a no-op', () => {
      expect(() => component.close()).not.toThrow();
    });
  });
});
