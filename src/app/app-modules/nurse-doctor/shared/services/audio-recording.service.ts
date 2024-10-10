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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import * as RecordRTC from 'recordrtc';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

interface RecordedAudioOutput {
  blob: Blob;
  title: string;
}

@Injectable()
export class AudioRecordingService {
  private stream: any;
  private recorder: any;
  private interval: any;
  private startTime: any;
  private _recorded = new Subject<RecordedAudioOutput>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();

  constructor(private http: HttpClient) {}

  getRecordedBlob(): Observable<RecordedAudioOutput> {
    return this._recorded.asObservable();
  }

  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }

  startRecording() {
    if (this.recorder) {
      // It means recording is already started or it is already recording something
      return;
    }

    this._recordingTime.next('00:00');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(s => {
        this.stream = s;
        this.record();
      })
      .catch(error => {
        this._recordingFailed.next('Error in recording');
      });
  }

  abortRecording() {
    this.stopMedia();
  }

  private record() {
    this.recorder = new RecordRTC.StereoAudioRecorder(this.stream, {
      type: 'audio',
      mimeType: 'audio/webm',
    });

    this.recorder.record();
    this.startTime = moment();
    this.interval = setInterval(() => {
      const currentTime = moment();
      const diffTime = moment.duration(currentTime.diff(this.startTime));
      const time =
        this.toString(diffTime.minutes()) +
        ':' +
        this.toString(diffTime.seconds());
      this._recordingTime.next(time);
    }, 1000);
  }

  private toString(value: any) {
    let val = value;
    if (!value) val = '00';
    if (value < 10) val = '0' + value;
    return val;
  }

  stopRecording() {
    if (this.recorder) {
      this.recorder.stop(
        (blob: any) => {
          if (this.startTime) {
            const mp3Name = encodeURIComponent(
              'audio_' + new Date().getTime() + '.wav'
            );
            this.stopMedia();
            this._recorded.next({ blob: blob, title: mp3Name });
          }
        },
        () => {
          this.stopMedia();
          this._recordingFailed.next('Recording Failed');
        }
      );
    }
  }

  private stopMedia() {
    if (this.recorder) {
      this.recorder = null;
      clearInterval(this.interval);
      this.startTime = null;
      if (this.stream) {
        this.stream.getAudioTracks().forEach((track: any) => track.stop());
        this.stream = null;
      }
    }
  }

  getResultStatus(formData: FormData) {
    return this.http.post(environment.getResultStatusURL, formData);
  }
}
