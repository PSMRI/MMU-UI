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

import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

export interface AutosaveDraft {
  savedAt: string;
  data: any;
}

/**
 * Persists in-progress form data to localStorage (AES-encrypted with the app
 * key) so a nurse/doctor who accidentally closes the tab — or is logged out by
 * mistake — can recover it on reopen. Drafts are keyed per user + role + visit
 * and deliberately survive logout; callers remove them with clear()/clearAll().
 */
@Injectable({ providedIn: 'root' })
export class FormAutosaveService {
  private readonly prefix = 'mmuAutosave:';
  private readonly encKey = environment.encKey;

  private storageKey(id: string): string {
    return this.prefix + id;
  }

  save(id: string, value: unknown): void {
    if (!id) return;
    try {
      const payload = JSON.stringify({
        savedAt: new Date().toISOString(),
        data: value,
      });
      const cipher = CryptoJS.AES.encrypt(payload, this.encKey).toString();
      localStorage.setItem(this.storageKey(id), cipher);
    } catch {
      // Ignore serialize / quota errors — autosave is best-effort.
    }
  }

  restore(id: string): AutosaveDraft | null {
    if (!id) return null;
    const cipher = localStorage.getItem(this.storageKey(id));
    if (!cipher) return null;
    try {
      const text = CryptoJS.AES.decrypt(cipher, this.encKey).toString(
        CryptoJS.enc.Utf8
      );
      return text ? (JSON.parse(text) as AutosaveDraft) : null;
    } catch {
      return null;
    }
  }

  has(id: string): boolean {
    return !!id && localStorage.getItem(this.storageKey(id)) !== null;
  }

  clear(id: string): void {
    if (id) localStorage.removeItem(this.storageKey(id));
  }

  clearAll(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
  }
}
