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

import { Injectable, ViewContainerRef, Inject, DOCUMENT } from '@angular/core';
import { ZardDialogService } from 'Common-UI/v2/ui/dialog';
import { Observable } from 'rxjs';
import { CameraDialogComponent } from '../components/camera-dialog/camera-dialog.component';

@Injectable()
export class CameraService {
  constructor(
    private dialog: ZardDialogService,
    @Inject(DOCUMENT) doc: any
  ) {}

  public capture(titleAlign = 'center'): Observable<any> {
    const dialogRef = this.dialog.create<CameraDialogComponent, unknown>({
      zContent: CameraDialogComponent,
      zHideFooter: true,
      zClosable: false,
    });
    dialogRef.componentInstance!.capture = true;
    dialogRef.componentInstance!.imageCode = false;
    return dialogRef.afterClosed();
  }

  public viewImage(benImageCode: string, titleAlign = 'center'): void {
    const dialogRef = this.dialog.create<CameraDialogComponent, unknown>({
      zContent: CameraDialogComponent,
      zHideFooter: true,
      zClosable: false,
    });
    dialogRef.componentInstance!.capture = false;
    dialogRef.componentInstance!.imageCode = benImageCode;
  }

  public annotate(
    image: string,
    points: any,
    currentLanguage: any,
    titleAlign = 'center'
  ): Observable<any> {
    const dialogRef = this.dialog.create<CameraDialogComponent, unknown>({
      zContent: CameraDialogComponent,
      zWidth: '80%',
      zHideFooter: true,
      zClosable: false,
    });
    dialogRef.componentInstance!.capture = false;
    dialogRef.componentInstance!.imageCode = false;
    dialogRef.componentInstance!.annotate = image;
    dialogRef.componentInstance!.current_language_set = currentLanguage;
    dialogRef.componentInstance!.availablePoints = points;
    return dialogRef.afterClosed();
  }

  public ViewGraph(graph: any): void {
    const dialogRef = this.dialog.create<CameraDialogComponent, unknown>({
      zContent: CameraDialogComponent,
      zWidth: '80%',
      zHideFooter: true,
      zClosable: false,
    });
    dialogRef.componentInstance!.capture = false;
    dialogRef.componentInstance!.imageCode = false;
    dialogRef.componentInstance!.annotate = false;
    dialogRef.componentInstance!.availablePoints = false;
    dialogRef.componentInstance!.graph = graph;
  }
}
