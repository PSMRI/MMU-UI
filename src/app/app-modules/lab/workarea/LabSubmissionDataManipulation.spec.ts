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

import { DataManipulation } from './LabSubmissionDataManipulation';

describe('DataManipulation (lab submission)', () => {
  let dm: DataManipulation;
  beforeEach(() => (dm = new DataManipulation()));

  describe('technicalDataRestruct', () => {
    it('restructures lab results and leaves radiology undefined', () => {
      const out = dm.technicalDataRestruct({
        labForm: [
          {
            prescriptionID: 1,
            procedureID: 2,
            compListDetails: [
              { testComponentName: 'Hb', testComponentID: 3, inputValue: '12' },
            ],
          },
        ],
      });
      expect(out).toEqual({
        labTestResults: [
          {
            prescriptionID: 1,
            procedureID: 2,
            compList: [
              {
                testComponentID: 3,
                testResultValue: '12',
                testResultUnit: undefined,
                remarks: undefined,
              },
            ],
          },
        ],
        radiologyTestResults: undefined,
      });
    });

    it('returns undefined lab results when no lab form is present', () => {
      expect(dm.technicalDataRestruct({})).toEqual({
        labTestResults: undefined,
        radiologyTestResults: undefined,
      });
    });
  });

  describe('laboratoryDataRestruct', () => {
    it('skips procedures without ids and procedures with no filled components', () => {
      const out = dm.laboratoryDataRestruct([
        { prescriptionID: null, procedureID: 1, compListDetails: [] },
        {
          prescriptionID: 1,
          procedureID: 2,
          compListDetails: [{ testComponentName: 'Hb', testComponentID: 3 }],
        },
        {
          prescriptionID: 4,
          procedureID: 5,
          compListDetails: [
            {
              testComponentName: 'Sugar',
              testComponentID: 6,
              compOptSelected: 'High',
            },
          ],
        },
      ]);
      expect(out.length).toBe(1);
      expect(out[0].procedureID).toBe(5);
      expect(out[0].compList[0].testResultValue).toBe('High');
    });
  });

  describe('labComponentRestruct', () => {
    it('strips unavailable + abnormal ECG keeps abnormalities and flag', () => {
      const [c] = dm.labComponentRestruct([
        {
          stripsNotavailable: true,
          testComponentName: 'ECG Report',
          testComponentID: 1,
          compOptSelected: 'Abnormal',
          ecgAbnormalities: ['ST elevation'],
          measurementUnit: 'mm',
          remarks: 'r',
        },
      ]);
      expect(c).toEqual({
        testComponentID: 1,
        testResultValue: 'Abnormal',
        testResultUnit: 'mm',
        ecgAbnormalities: ['ST elevation'],
        remarks: 'r',
        stripsNotAvailable: true,
      });
    });

    it('strips unavailable for a regular component keeps the flag', () => {
      const [c] = dm.labComponentRestruct([
        {
          stripsNotavailable: true,
          testComponentName: 'Hb',
          testComponentID: 2,
        },
      ]);
      expect(c).toEqual({
        testComponentID: 2,
        testResultValue: undefined,
        testResultUnit: undefined,
        remarks: undefined,
        stripsNotAvailable: true,
      });
    });

    it('strips unavailable without a component id is dropped', () => {
      expect(
        dm.labComponentRestruct([
          { stripsNotavailable: true, testComponentName: 'Hb' },
        ])
      ).toEqual([]);
    });

    it('abnormal ECG (strips available) includes abnormalities', () => {
      const [c] = dm.labComponentRestruct([
        {
          testComponentName: 'ECG',
          testComponentID: 3,
          compOptSelected: 'Abnormal',
          ecgAbnormalities: ['AF'],
        },
      ]);
      expect(c.ecgAbnormalities).toEqual(['AF']);
      expect(c.testResultValue).toBe('Abnormal');
      expect(c.stripsNotAvailable).toBeUndefined();
    });

    it('normal ECG is treated like a regular option component', () => {
      const [c] = dm.labComponentRestruct([
        {
          testComponentName: 'ECG',
          testComponentID: 4,
          compOptSelected: 'Normal',
          ecgAbnormalities: ['ignored'],
        },
      ]);
      expect(c).toEqual({
        testComponentID: 4,
        testResultValue: 'Normal',
        testResultUnit: undefined,
        remarks: undefined,
      });
    });

    it('prefers inputValue over the selected option and drops empty components', () => {
      const comps = dm.labComponentRestruct([
        {
          testComponentName: 'Hb',
          testComponentID: 5,
          inputValue: '13',
          compOptSelected: 'x',
          measurementUnit: 'g/dL',
        },
        { testComponentName: 'Empty', testComponentID: 6 },
        { testComponentName: 'NoId', inputValue: '1' },
      ]);
      expect(comps).toEqual([
        {
          testComponentID: 5,
          testResultValue: '13',
          testResultUnit: 'g/dL',
          remarks: undefined,
        },
      ]);
    });
  });
});
