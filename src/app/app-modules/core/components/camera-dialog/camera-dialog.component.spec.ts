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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmationService } from '../../services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { CameraDialogComponent } from './camera-dialog.component';

/** 1x1 transparent PNG. */
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const waitFor = async (cond: () => boolean, ms = 4000) => {
  const start = Date.now();
  while (!cond() && Date.now() - start < ms) {
    await new Promise(r => setTimeout(r, 20));
  }
};

describe('CameraDialogComponent', () => {
  let fixture: ComponentFixture<CameraDialogComponent>;
  let component: CameraDialogComponent;
  let confirm: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CameraDialogComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            userName: 'nurse',
            providerServiceID: 7,
          },
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CameraDialogComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
  });

  afterEach(() => fixture.destroy());

  it('sets default webcam options and capture status on init', () => {
    fixture.detectChanges();
    expect(component.options.width).toBe(500);
    expect(component.options.video).toBeTrue();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.status).toBe(LANGUAGE_EN.capture);
    expect(component.loaded).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      LANGUAGE_EN.coreComponents.noDataAvailableForThisBeneficiary
    );
  });

  describe('capture mode', () => {
    beforeEach(() => {
      component.capture = true;
      fixture.detectChanges();
    });

    it('renders the webcam placeholder (no real camera)', () => {
      expect(fixture.nativeElement.querySelector('webcam')).not.toBeNull();
    });

    it('getSnapshot and recaptureImage emit on the trigger observable', () => {
      let count = 0;
      const sub = component.triggerObservable.subscribe(() => count++);
      component.getSnapshot();
      component.captured = true;
      component.recaptureImage();
      expect(count).toBe(2);
      expect(component.captured).toBeFalse();
      sub.unsubscribe();
    });

    it('handleKeyDownRecaptureImg only reacts to Enter/Space', () => {
      const spy = spyOn(component, 'recaptureImage');
      ['Enter', 'Spacebar', ' ', 'a'].forEach(key =>
        component.handleKeyDownRecaptureImg(
          new KeyboardEvent('keydown', { key })
        )
      );
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('captureImg stores the image and shows preview', () => {
      const img: any = { imageAsDataUrl: PNG };
      component.captureImg(img);
      fixture.detectChanges();
      expect(component.webcamImage).toBe(img);
      expect(component.sysImage).toBe(PNG);
      expect(component.captured).toBeTrue();
      expect(fixture.nativeElement.querySelector('webcam')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('img[alt="sys"]')
      ).not.toBeNull();
    });

    it('captureImg with no image resets captured', () => {
      component.captured = true;
      component.captureImg(null as any);
      expect(component.captured).toBeFalse();
      expect(component.status).toBe(LANGUAGE_EN.capture);
    });

    it('cancel button closes with false', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      (buttons[0] as HTMLElement).click();
      expect((TestBed.inject(MatDialogRef) as any).close).toHaveBeenCalledWith(
        false
      );
    });
  });

  it('exposes nextWebcamObservable and no-op webcam callbacks', () => {
    expect(component.nextWebcamObservable).toBeTruthy();
    expect(component.onSuccess({})).toBeUndefined();
    expect(component.onError({})).toBeUndefined();
    expect(component.handleInitError({} as any)).toBeUndefined();
  });

  it('Confirm emits cancelEvent', () => {
    const spy = jasmine.createSpy();
    component.cancelEvent.subscribe(spy);
    component.Confirm();
    expect(spy).toHaveBeenCalledWith(null);
  });

  describe('annotate mode', () => {
    it('loads existing markers onto the canvas and exposes them via getMarkers', () => {
      component.annotate = PNG;
      component.availablePoints = {
        markers: [
          { xCord: 30, yCord: 40, description: 'Lesion', point: 1 },
          { xCord: 60, yCord: 80, point: 2 },
        ],
      };
      // ngAfterViewInit mutates markers (bound to [disabled]) -> NG0100 in dev mode
      expect(() => fixture.detectChanges()).toThrowError(/NG0100/);
      expect(component.ctx).toBeTruthy();
      expect(component.markers).toEqual([
        { xCord: 30, yCord: 40, description: 'Lesion', point: 1 },
        { xCord: 60, yCord: 80, description: '', point: 1 },
      ]);
      expect(component.score).toBe(2);
      expect(component.getMarkers()).toEqual({
        beneficiaryRegID: 'B1',
        visitID: 'V1',
        createdBy: 'nurse',
        imageID: '',
        providerServiceMapID: 7,
        markers: component.markers,
      });
    });

    it('draws marks at click offsets', () => {
      component.annotate = PNG;
      fixture.detectChanges();
      const stroke = spyOn(component.ctx, 'strokeRect');
      component.pointMark({ offsetX: 50, offsetY: 60 });
      expect(stroke).toHaveBeenCalledWith(40, 50, 20, 20);
      expect(component.markers.length).toBe(1);
    });

    it('alerts instead of drawing beyond six markers', fakeAsync(() => {
      component.annotate = PNG;
      fixture.detectChanges();
      component.score = 7;
      const stroke = spyOn(component.ctx, 'strokeRect');
      component.pointMark({ offsetX: 1, offsetY: 1 });
      flush();
      expect(stroke).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.sixMakers
      );
    }));

    it('clearPointers empties markers and redraws the image', async () => {
      component.annotate = PNG;
      fixture.detectChanges();
      component.pointMark({ offsetX: 10, offsetY: 10 });
      component.score = 4;
      const clear = spyOn(component.ctx, 'clearRect').and.callThrough();
      component.clearPointers();
      expect(component.markers).toEqual([]);
      expect(clear).toHaveBeenCalledWith(0, 0, 250, 250);
      await waitFor(() => component.score === 1);
      expect(component.score).toBe(1);
      expect(component.ctx.font).toBe('bold 20px serif');
    });
  });

  describe('downloadGraph', () => {
    let errSpy: jasmine.Spy;
    beforeEach(() => (errSpy = spyOn(console, 'error')));

    it('logs when container is missing', () => {
      fixture.detectChanges();
      component.downloadGraph();
      expect(errSpy).toHaveBeenCalledWith(
        'Element with ID "container-dialog" not found.'
      );
    });

    it('saves the rendered graph with a derived name', async () => {
      component.graph = { type: 'bw' };
      fixture.detectChanges();
      const dispatch = spyOn(
        HTMLAnchorElement.prototype,
        'dispatchEvent'
      ).and.returnValue(true);
      component.downloadGraph();
      await waitFor(() => dispatch.calls.count() > 0);
      const anchor = dispatch.calls.mostRecent().object as HTMLAnchorElement;
      expect(anchor.download).toBe('bw_B1_V1');
    });

    it('falls back to a new window when saving fails', async () => {
      component.graph = { type: 'bp' };
      fixture.detectChanges();
      const write = jasmine.createSpy('write');
      const open = spyOn(window, 'open').and.returnValue({
        document: { write },
      } as any);
      component.graph = null;
      component.downloadGraph();
      await waitFor(() => write.calls.count() > 0);
      expect(open).toHaveBeenCalled();
      expect(write.calls.mostRecent().args[0]).toContain(
        '<img src="data:image/png'
      );
      expect(errSpy).toHaveBeenCalledWith(
        'Error saving image:',
        jasmine.any(TypeError)
      );
    });

    it('logs when a new window cannot be opened', async () => {
      component.graph = { type: 'bg' };
      fixture.detectChanges();
      spyOn(window, 'open').and.returnValue(null);
      component.graph = undefined;
      component.downloadGraph();
      await waitFor(() =>
        errSpy.calls.allArgs().some(a => a[0] === 'Error opening a new window.')
      );
      expect(errSpy).toHaveBeenCalledWith('Error opening a new window.');
    });
  });

  it('ngDoCheck refreshes the language', () => {
    fixture.detectChanges();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });
});
