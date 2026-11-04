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
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AudioRecordingService } from './audio-recording.service';
import { environment } from 'src/environments/environment';

describe('AudioRecordingService', () => {
  let service: AudioRecordingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AudioRecordingService],
    });

    service = TestBed.inject(AudioRecordingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRecordedBlob', () => {
    it('should return an Observable', () => {
      const obs = service.getRecordedBlob();
      expect(obs.subscribe).toBeDefined();
    });
  });

  describe('getRecordedTime', () => {
    it('should return an Observable', () => {
      const obs = service.getRecordedTime();
      expect(obs.subscribe).toBeDefined();
    });
  });

  describe('recordingFailed', () => {
    it('should return an Observable', () => {
      const obs = service.recordingFailed();
      expect(obs.subscribe).toBeDefined();
    });
  });

  describe('startRecording', () => {
    it('should return early if recorder already exists', () => {
      (service as any).recorder = {};

      const getUserMediaSpy = spyOn(navigator.mediaDevices, 'getUserMedia');

      service.startRecording();

      expect(getUserMediaSpy).not.toHaveBeenCalled();
    });

    it('should call getUserMedia, start recording and tick the timer', async () => {
      (service as any).recorder = null;
      const ctx = new AudioContext();
      const stream = ctx.createMediaStreamDestination().stream;
      let resolveStarted!: () => void;
      const started = new Promise<void>(r => (resolveStarted = r));
      const realRecord = (service as any).record.bind(service);
      spyOn(service as any, 'record').and.callFake(() => {
        realRecord();
        resolveStarted();
      });
      const getUserMediaSpy = spyOn(
        navigator.mediaDevices,
        'getUserMedia'
      ).and.returnValue(Promise.resolve(stream));
      let intervalFn: any;
      spyOn(window, 'setInterval').and.callFake(((fn: any) => {
        intervalFn = fn;
        return 4242 as any;
      }) as any);
      const clear = spyOn(window, 'clearInterval');
      const times: string[] = [];
      service.getRecordedTime().subscribe(t => times.push(t));
      try {
        service.startRecording();
        expect(getUserMediaSpy).toHaveBeenCalledWith({ audio: true });
        await started;
        expect((service as any).stream).toBe(stream);
        expect((service as any).recorder).toBeTruthy();
        expect((service as any).startTime).toBeTruthy();
        intervalFn();
        expect(times[0]).toBe('00:00');
        expect(times[1]).toBe('00:00');
        service.abortRecording();
        expect(clear).toHaveBeenCalledWith(4242);
        expect((service as any).recorder).toBeNull();
        expect((service as any).stream).toBeNull();
      } finally {
        await ctx.close();
      }
    });

    it('should emit recording failed when getUserMedia rejects', done => {
      (service as any).recorder = null;

      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        Promise.reject(new Error('Permission denied'))
      );

      service.recordingFailed().subscribe(msg => {
        expect(msg).toBe('Error in recording');
        done();
      });

      service.startRecording();
    });
  });

  describe('abortRecording', () => {
    it('should call stopMedia', () => {
      const stopMediaSpy = spyOn(service as any, 'stopMedia');

      service.abortRecording();

      expect(stopMediaSpy).toHaveBeenCalled();
    });
  });

  describe('stopRecording', () => {
    it('should not throw when recorder is null', () => {
      (service as any).recorder = null;

      expect(() => service.stopRecording()).not.toThrow();
    });

    it('should call recorder.stop when recorder exists', () => {
      const stopSpy = jasmine.createSpy('stop');
      (service as any).recorder = { stop: stopSpy };

      service.stopRecording();

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('stopRecording callbacks', () => {
    it('emits the recorded blob and stops media on success', () => {
      const blob = new Blob(['a']);
      const stopMedia = spyOn(service as any, 'stopMedia').and.callThrough();
      (service as any).startTime = new Date();
      (service as any).recorder = {
        stop: (ok: any) => ok(blob),
      };
      const out: any[] = [];
      service.getRecordedBlob().subscribe(v => out.push(v));
      service.stopRecording();
      expect(stopMedia).toHaveBeenCalled();
      expect(out.length).toBe(1);
      expect(out[0].blob).toBe(blob);
      expect(out[0].title).toMatch(/^audio_\d+\.wav$/);
    });

    it('does not emit when there is no start time', () => {
      (service as any).startTime = null;
      (service as any).recorder = { stop: (ok: any) => ok(new Blob()) };
      const out: any[] = [];
      service.getRecordedBlob().subscribe(v => out.push(v));
      service.stopRecording();
      expect(out).toEqual([]);
    });

    it('reports failure and stops media on error', () => {
      (service as any).recorder = {
        stop: (_ok: any, fail: any) => fail(),
      };
      const msgs: string[] = [];
      service.recordingFailed().subscribe(m => msgs.push(m));
      service.stopRecording();
      expect(msgs).toEqual(['Recording Failed']);
      expect((service as any).recorder).toBeNull();
    });
  });

  describe('toString (private)', () => {
    it('pads single digits and zero', () => {
      expect((service as any).toString(0)).toBe('00');
      expect((service as any).toString(5)).toBe('05');
      expect((service as any).toString(12)).toBe(12);
    });
  });

  describe('stopMedia (private)', () => {
    it('should clean up recorder and stream when recorder exists', () => {
      const trackStopSpy = jasmine.createSpy('trackStop');
      (service as any).recorder = {};
      (service as any).interval = 1;
      (service as any).startTime = new Date();
      (service as any).stream = {
        getAudioTracks: () => [{ stop: trackStopSpy }],
      };

      (service as any).stopMedia();

      expect((service as any).recorder).toBeNull();
      expect((service as any).startTime).toBeNull();
      expect((service as any).stream).toBeNull();
      expect(trackStopSpy).toHaveBeenCalled();
    });

    it('should do nothing when recorder is null', () => {
      (service as any).recorder = null;
      (service as any).stream = { getAudioTracks: () => [] };

      (service as any).stopMedia();

      expect((service as any).stream).not.toBeNull();
    });
  });

  describe('getResultStatus', () => {
    it('should make POST request with FormData', () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.wav');

      service.getResultStatus(formData).subscribe((res: any) => {
        expect(res).toEqual({ status: 'success' });
      });

      const req = httpMock.expectOne(environment.getResultStatusURL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(formData);
      req.flush({ status: 'success' });
    });
  });
});
