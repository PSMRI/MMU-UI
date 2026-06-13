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
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  DoCheck,
} from '@angular/core';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-image-to-canvas',
  templateUrl: './image-to-canvas.component.html',
  styleUrls: ['./image-to-canvas.component.css'],
  standalone: false,
})
export class ImageToCanvasComponent implements OnInit, OnChanges, DoCheck {
  @Input()
  imgUrl!: string;

  @Input()
  annotatedMarker: any;

  @ViewChild('canvas')
  canvas!: ElementRef;

  blankRows = [1, 2, 3, 4, 5];
  languageComponent!: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(public httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges() {
    if (this.annotatedMarker && this.imgUrl) {
      if (this.annotatedMarker.markers)
        this.annotateImage(this.annotatedMarker.markers, this.imgUrl);
    } else if (this.imgUrl) {
      this.loadImageOnCanvas(this.imgUrl);
    }
  }

  loadImageOnCanvas(imgUrl: any) {
    let ctx = this.canvas.nativeElement;
    if (ctx.getContext) {
      ctx = ctx.getContext('2d');
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, 250, 250);
      };
      img.src = imgUrl;
    }
  }

  annotateImage(markers: any, imgUrl: any) {
    const canvas = this.canvas.nativeElement;
    if (canvas.getContext) {
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 20px serif';

      const img = new Image();
      img.onload = function () {
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
        let score = 1;
        markers.forEach((mark: any, index: any) => {
          if (mark.xCord) mark.offsetX = mark.xCord;
          if (mark.yCord) mark.offsetY = mark.yCord;
          if (score <= 6) {
            ctx.strokeRect(mark.offsetX - 10, mark.offsetY - 10, 20, 20);
            ctx.fillText(score, mark.offsetX - 3, mark.offsetY + 6);
          }
          score++;
        });
      };
      img.src = imgUrl;
    }
  }

  // AV40085804 13/10/2021 Integrating Multilingual Functionality -----Start-----
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  // -----End------
}
