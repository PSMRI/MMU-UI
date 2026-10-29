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

import { ReferComponent } from './refer.component';

describe('ReferComponent', () => {
  const build = (cat: any) => {
    const c = new ReferComponent();
    c.visitCategory = cat;
    c.ngOnInit();
    return c;
  };

  [
    'General OPD',
    'ANC',
    'NCD care',
    'PNC',
    'COVID-19 Screening',
    'NCD screening',
    'General OPD (QC)',
  ].forEach(cat =>
    it(`shows general refer for ${cat}`, () => {
      const c = build(cat);
      expect(c.showGeneralOPD).toBeTrue();
      expect(c.showCancer).toBeFalse();
    })
  );

  it('shows cancer refer for Cancer Screening', () => {
    const c = build('Cancer Screening');
    expect(c.showGeneralOPD).toBeFalse();
    expect(c.showCancer).toBeTrue();
  });

  it('shows nothing for other or missing categories', () => {
    for (const cat of ['Other', undefined]) {
      const c = build(cat);
      expect(c.showGeneralOPD).toBeFalse();
      expect(c.showCancer).toBeFalse();
    }
  });
});
