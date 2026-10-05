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
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ImageToCanvasComponent } from './image-to-canvas.component';

describe('ImageToCanvasComponent', () => {
  let component: ImageToCanvasComponent;
  let fixture: ComponentFixture<ImageToCanvasComponent>;
  let ctx: any;
  let fakeImg: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ImageToCanvasComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ImageToCanvasComponent);
    component = fixture.componentInstance;
    ctx = jasmine.createSpyObj('ctx', ['drawImage', 'strokeRect', 'fillText']);
    component.canvas = {
      nativeElement: {
        width: 300,
        height: 200,
        getContext: jasmine.createSpy('getContext').and.returnValue(ctx),
      },
    } as any;
    fakeImg = { width: 50, height: 40 };
    spyOn(window as any, 'Image').and.returnValue(fakeImg);
  });

  it('language helpers set current language', () => {
    component.ngOnInit();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.assignSelectedLanguage();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('draws plain image when no markers are given', () => {
    component.imgUrl = 'img.png';
    component.ngOnChanges();
    expect(component.canvas.nativeElement.getContext).toHaveBeenCalledWith(
      '2d'
    );
    expect(fakeImg.src).toBe('img.png');
    fakeImg.onload();
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeImg, 0, 0, 250, 250);
  });

  it('annotates up to six markers, preferring x/yCord', () => {
    const markers = [1, 2, 3, 4, 5, 6, 7].map(n => ({
      offsetX: n * 10,
      offsetY: n * 10,
    }));
    (markers[0] as any).xCord = 100;
    (markers[0] as any).yCord = 110;
    component.imgUrl = 'a.png';
    component.annotatedMarker = { markers };
    component.ngOnChanges();
    expect(ctx.font).toBe('bold 20px serif');
    fakeImg.onload();
    expect(ctx.drawImage).toHaveBeenCalledWith(
      fakeImg,
      0,
      0,
      50,
      40,
      0,
      0,
      300,
      200
    );
    expect(ctx.strokeRect).toHaveBeenCalledTimes(6);
    expect(ctx.strokeRect.calls.first().args).toEqual([90, 100, 20, 20]);
    expect(ctx.fillText.calls.first().args).toEqual([1, 97, 116]);
    expect(ctx.fillText.calls.mostRecent().args[0]).toBe(6);
  });

  it('does nothing when marker object has no markers, or no image', () => {
    component.imgUrl = 'a.png';
    component.annotatedMarker = {};
    component.ngOnChanges();
    component.imgUrl = '';
    component.annotatedMarker = null;
    component.ngOnChanges();
    expect(component.canvas.nativeElement.getContext).not.toHaveBeenCalled();
  });

  it('skips drawing when canvas has no 2d context support', () => {
    component.canvas = { nativeElement: {} } as any;
    component.loadImageOnCanvas('x');
    component.annotateImage([], 'x');
    expect(window.Image).not.toHaveBeenCalled();
  });
});
