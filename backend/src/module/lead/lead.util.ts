import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line import/no-extraneous-dependencies
import { Parser } from 'json2csv';

import { LEAD_EXPORT_FIELDS } from '../../shared/constant/lead';

import type { ILead } from '../../shared/models/lead.model';
import type { Model } from 'mongoose';

// eslint-disable-next-line unicorn/prefer-module
export const getExportDir = (): string => path.join(__dirname, '../../../tmp');

// Helper to get CSV fields
export const getLeadExportFields = (): string[] => LEAD_EXPORT_FIELDS;

// Helper to clean up file if exists
export const cleanupFile = (filePath: string): void => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (typeof filePath === 'string' && filePath.length > 0 && fs.existsSync(filePath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.unlinkSync(filePath);
  }
};

// Helper to write CSV header
export const writeCsvHeader = (writable: fs.WriteStream, fields: string[]): void => {
  const parser = new Parser({ fields });
  writable.write(`${parser.parse([])}\n`);
};

// Helper to write CSV rows
export const writeCsvRows = async (
  cursor: ReturnType<typeof Model.find> extends { cursor: () => infer C } ? C : never,
  writable: fs.WriteStream,
  fields: string[],
): Promise<void> => {
  const rowParser = new Parser({ fields, header: false });
  for await (const doc of cursor as AsyncIterable<ILead>) {
    const row = `${rowParser.parse(doc.toObject())}\n`;
    if (!writable.write(row)) {
      await new Promise<void>((resolve) => writable.once('drain', () => resolve()));
    }
  }
};
