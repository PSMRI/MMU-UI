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
import { FormBuilder, FormGroup } from '@angular/forms';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { NCDScreeningUtils } from './ncd-screening-utility';

describe('NCDScreeningUtils', () => {
  let utils: NCDScreeningUtils;
  let session: ReturnType<typeof createSessionStorageMock>;

  beforeEach(() => {
    session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    });
    utils = new NCDScreeningUtils(new FormBuilder(), session as any);
  });

  it('creates the NCD screening form with van details and null readings', () => {
    const f: FormGroup = utils.createNCDScreeningForm();
    expect(f.get('vanID')?.value).toBe(1);
    expect(f.get('parkingPlaceID')?.value).toBe(2);
    expect(f.get('systolicBP_1stReading')?.value).toBeNull();
    expect(f.get('averageDiastolicBP_Reading')?.value).toBeNull();
    expect(f.contains('labTestOrders')).toBeTrue();
    expect(f.contains('isBloodGlucosePrescribed')).toBeTrue();
    expect(session.getItem).toHaveBeenCalledWith('serviceLineDetails');
  });

  it('creates the IDRS form with deleted=false and van details', () => {
    const f = utils.createIDRSForm();
    expect(f.get('deleted')?.value).toBeFalse();
    expect(f.get('idrsScore')?.value).toBeNull();
    expect(f.get('vanID')?.value).toBe(1);
    expect(f.get('parkingPlaceID')?.value).toBe(2);
  });
});
