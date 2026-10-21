import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * Connects this StopTB laptop to the central server for the automatic BenID
 * top-up. MMU-API uses the login once and keeps only a central token.
 * Nothing is sent when MMU-API reports the feature as disabled, and any error
 * is ignored so that login is never affected.
 */
@Injectable({
  providedIn: 'root',
})
export class CentralAuthService {
  constructor(private http: HttpClient) {}

  captureIfEnabled(
    userName: string,
    encryptedPassword: string,
    reconnect = false
  ) {
    if (!userName || !encryptedPassword || !environment.centralAuthStatusUrl) {
      return;
    }
    this.http.get(environment.centralAuthStatusUrl).subscribe({
      next: (res: any) => {
        const status = this.parseStatus(res);
        if (!status?.enabled) {
          return;
        }
        this.http
          .post(environment.centralAuthCaptureUrl, {
            userName: userName.trim(),
            password: encryptedPassword,
            reconnect,
          })
          .subscribe({ error: () => undefined });
      },
      error: () => undefined,
    });
  }

  getStatus() {
    return this.http.get(environment.centralAuthStatusUrl);
  }

  // automatic Data Sync (upload / master download) and rows central rejected
  getAutoSyncStatus() {
    return this.http.get(environment.autoSyncStatusUrl);
  }

  parseStatus(res: any) {
    if (res?.statusCode !== 200 || !res?.data) {
      return null;
    }
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  }
}
