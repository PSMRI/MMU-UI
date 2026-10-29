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

import { TestBed } from '@angular/core/testing';
import { CaptchaService } from './captcha.service';
import { environment } from 'src/environments/environment';

describe('CaptchaService', () => {
  let service: CaptchaService;
  let originalAppendChild: <T extends Node>(node: T) => T;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CaptchaService],
    });
    service = TestBed.inject(CaptchaService);
    originalAppendChild = document.head.appendChild.bind(document.head);
  });

  afterEach(() => {
    // Clean up any script elements added during tests
    const scripts = document.head.querySelectorAll('script');
    scripts.forEach(script => {
      if (
        script.src &&
        script.src.includes(environment.captchaChallengeURL || 'captcha')
      ) {
        script.remove();
      }
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#loadScript', () => {
    it('should return a Promise', async () => {
      let added: any;
      spyOn(document.head, 'appendChild').and.callFake((node: any) => {
        added = node;
        return node;
      });
      const result = service.loadScript();
      expect(result).toBeInstanceOf(Promise);
      added.onerror(new Event('error'));
      await expectAsync(result).toBeRejected();
    });

    it('should append a script element to document.head', async () => {
      const appendChildSpy = spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          (node as any).onload(new Event('load'));
          return node;
        }
      );

      await service.loadScript();
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should set script src to environment.captchaChallengeURL', async () => {
      let capturedScript: HTMLScriptElement | null = null;
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          capturedScript = node as any;
          (capturedScript as any).onload(new Event('load'));
          return node;
        }
      );

      await service.loadScript();
      expect(capturedScript!.src).toContain(environment.captchaChallengeURL);
    });

    it('should set async and defer on the script element', async () => {
      let capturedScript: HTMLScriptElement | null = null;
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          capturedScript = node as any;
          (capturedScript as any).onload(new Event('load'));
          return node;
        }
      );

      await service.loadScript();
      expect(capturedScript!.async).toBe(true);
      expect(capturedScript!.defer).toBe(true);
    });

    it('should resolve when script loads successfully', async () => {
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          (node as any).onload(new Event('load'));
          return node;
        }
      );

      await expectAsync(service.loadScript()).toBeResolved();
    });

    it('should set scriptLoaded to true after successful load', async () => {
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          (node as any).onload(new Event('load'));
          return node;
        }
      );

      await service.loadScript();
      // Verify by calling again - it should resolve immediately without appending
      const appendChildSpy = document.head.appendChild as jasmine.Spy;
      appendChildSpy.calls.reset();

      await service.loadScript();
      expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it('should resolve immediately if script is already loaded', async () => {
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          (node as any).onload(new Event('load'));
          return node;
        }
      );

      await service.loadScript();
      const appendChildSpy = document.head.appendChild as jasmine.Spy;
      appendChildSpy.calls.reset();

      await service.loadScript();
      expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it('should reject with Error when script fails to load', async () => {
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          (node as any).onerror(new Event('error'));
          return node;
        }
      );

      await expectAsync(service.loadScript()).toBeRejectedWithError(
        /Failed to load CAPTCHA script/
      );
    });

    it('should include the captchaChallengeURL in the error message', async () => {
      spyOn(document.head, 'appendChild').and.callFake(
        <T extends Node>(node: T): T => {
          (node as any).onerror(new Event('error'));
          return node;
        }
      );

      try {
        await service.loadScript();
        fail('Expected an error to be thrown');
      } catch (e: any) {
        expect(e.message).toContain(environment.captchaChallengeURL);
      }
    });
  });
});
