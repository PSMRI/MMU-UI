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

import { ViewContainerRef } from '@angular/core';
import { ZardDialogService, ZardDialogRef } from 'Common-UI/v2/ui/dialog';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/core/components/view-radiology-uploaded-files/view-radiology-uploaded-files.component';

/*
 * Shared openers for the dialogs that many nurse-doctor screens open with an
 * identical ZardDialogService.create(...) configuration. Centralising them keeps
 * the config in one place (radius/footer/close/backdrop behaviour) and removes
 * the near-duplicate create() blocks that were repeated across ~40 screens.
 * The caller supplies its own ZardDialogService + ViewContainerRef so route- and
 * feature-scoped providers still resolve inside the dialog.
 */

/** Read-only "previous <section> history" dialog (opened from history/refer/idrs screens). */
export function openPreviousDetailsDialog(
  dialog: ZardDialogService,
  viewContainerRef: ViewContainerRef,
  zData: unknown
): ZardDialogRef<PreviousDetailsComponent> {
  return dialog.create<PreviousDetailsComponent, unknown>({
    zContent: PreviousDetailsComponent,
    zData,
    zHideFooter: true,
    zClosable: false,
    zViewContainerRef: viewContainerRef,
  });
}

/** Non-dismissible IoT device-reading dialog (opened from vitals / ncd-screening / quick-consult). */
export function openIotDialog(
  dialog: ZardDialogService,
  viewContainerRef: ViewContainerRef,
  zData: unknown
): ZardDialogRef<IotcomponentComponent> {
  return dialog.create<IotcomponentComponent, unknown>({
    zContent: IotcomponentComponent,
    zWidth: '600px',
    zMaskClosable: false,
    zData,
    zHideFooter: true,
    zClosable: false,
    zViewContainerRef: viewContainerRef,
  });
}

/** Radiology uploaded-files viewer dialog (opened from examination / case-record / upload screens). */
export function openViewRadiologyDialog(
  dialog: ZardDialogService,
  viewContainerRef: ViewContainerRef,
  zData: unknown
): ZardDialogRef<ViewRadiologyUploadedFilesComponent> {
  return dialog.create<ViewRadiologyUploadedFilesComponent, unknown>({
    zContent: ViewRadiologyUploadedFilesComponent,
    zWidth: '40%',
    zData,
    zHideFooter: true,
    zClosable: false,
    zViewContainerRef: viewContainerRef,
  });
}
