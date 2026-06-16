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

import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as QRCode from 'qrcode';

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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.autoDetect();
  }

  autoDetect(): void {
    this.isDetecting = true;
    this.detectionFailed = false;

    this.detectNetworkIP()
      .then(ip => {
        this.urlForm.controls.campHubUrl.setValue(`http://${ip}/`);
        this.isDetecting = false;
      })
      .catch(() => {
        this.detectionFailed = true;
        this.isDetecting = false;
      });
  }

  private detectNetworkIP(): Promise<string> {
    const host = window.location.hostname;

    // Already accessed via network IP — use it directly
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return Promise.resolve(host);
    }

    return new Promise<string>((resolve, reject) => {
      let settled = false;

      const done = (ip: string) => {
        if (settled) return;
        settled = true;
        resolve(ip);
      };
      const fail = () => {
        if (settled) return;
        this.probeNetworks()
          .then(ip => {
            if (!settled) {
              settled = true;
              resolve(ip);
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              reject();
            }
          });
      };

      // Try WebRTC first — works on some browsers without mDNS obfuscation
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        const ips = new Set<string>();

        pc.onicecandidate = ev => {
          if (!ev.candidate) {
            pc.close();
            const real = [...ips].find(
              ip => !ip.startsWith('127.') && !ip.startsWith('169.254.')
            );
            real ? done(real) : fail();
            return;
          }
          const m = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/.exec(
            ev.candidate.candidate
          );
          if (m) ips.add(m[1]);
        };

        pc.createOffer()
          .then(o => pc.setLocalDescription(o))
          .catch(() => {
            pc.close();
            fail();
          });

        // Fall through to network probe after 3 s if WebRTC stalls
        setTimeout(() => {
          if (!settled) fail();
        }, 3000);
      } catch {
        fail();
      }
    });
  }

  // Fires no-cors fetch requests across common private subnets.
  // The first IP that responds (TCP connection succeeds) is this device.
  // window.location.port is probed first — it is guaranteed open since the
  // browser is already connected to it, which fixes detection on Windows where
  // Chrome's mDNS obfuscation defeats WebRTC and Firewall blocks other ports.
  private probeNetworks(): Promise<string> {
    const subnets = [
      '192.168.0',
      '192.168.1',
      '192.168.43',
      '10.42.0',
      '172.20.10',
      '192.168.137',
      '192.168.2',
      '192.168.3',
      '192.168.10',
      '192.168.100',
      '10.0.0',
      '10.0.1',
      '10.1.0',
    ];
    const appPort = window.location.port || '80';
    const ports = [appPort, '8087', '8083', '4202'].filter(
      (p, i, arr) => arr.indexOf(p) === i
    );
    const priority = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30, 50, 100, 101,
      105, 110, 150, 200, 254,
    ];
    const prioritySet = new Set(priority);

    const probe = (ip: string): Promise<string> =>
      this.firstResolved(ports.map(p => this.probeIP(ip, p).then(() => ip)));

    const stage1 = subnets.flatMap(s => priority.map(h => probe(`${s}.${h}`)));

    return this.firstResolved(stage1).catch(() => {
      const rest: number[] = [];
      for (let h = 1; h <= 254; h++) {
        if (!prioritySet.has(h)) rest.push(h);
      }
      return this.firstResolved(
        subnets.flatMap(s => rest.map(h => probe(`${s}.${h}`)))
      );
    });
  }

  private probeIP(ip: string, port: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => {
        ctrl.abort();
        reject();
      }, 2000);
      fetch(`http://${ip}:${port}/`, {
        method: 'GET',
        mode: 'no-cors',
        signal: ctrl.signal,
        cache: 'no-store',
      })
        .then(() => {
          clearTimeout(t);
          resolve();
        })
        .catch(() => {
          clearTimeout(t);
          reject();
        });
    });
  }

  private firstResolved<T>(promises: Promise<T>[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!promises.length) {
        reject();
        return;
      }
      let n = promises.length;
      promises.forEach(p =>
        p.then(resolve).catch(() => {
          if (--n === 0) reject();
        })
      );
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
