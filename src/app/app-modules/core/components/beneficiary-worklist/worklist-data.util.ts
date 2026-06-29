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

import * as moment from 'moment';

/**
 * Fill the "Not Available" defaults (and format the dates) that the
 * standard beneficiary worklist columns expect. Shared by every role
 * worklist so the mapping lives in one place. Mutates and returns `rows`.
 */
export function normalizeStandardWorklistRows(rows: any[]): any[] {
  rows.forEach((element: any) => {
    element.genderName = element.genderName || 'Not Available';
    element.age = element.age || 'Not Available';
    element.statusMessage = element.statusMessage || 'Not Available';
    element.VisitCategory = element.VisitCategory || 'Not Available';
    element.benVisitNo = element.benVisitNo || 'Not Available';
    element.districtName = element.districtName || 'Not Available';
    element.villageName = element.villageName || 'Not Available';
    element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
    element.visitDate =
      moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
      'Not Available';
    element.benVisitDate =
      moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
      'Not Available';
  });
  return rows;
}
