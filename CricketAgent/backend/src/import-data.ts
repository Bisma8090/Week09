/**
 * Run once to import CSV data into MongoDB:
 *   npx ts-node src/import-data.ts
 */
import { config } from 'dotenv';
config();

import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'CricketAgent';

function parseCSV(filepath: string): Record<string, any>[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const record: Record<string, any> = {};
    headers.forEach((h, i) => {
      const val = values[i]?.trim() ?? '';
      // Convert numeric strings to numbers
      const num = Number(val);
      record[h] = val === '' || val === 'NA' || val === 'null' ? null : isNaN(num) ? val : num;
    });
    return record;
  });
}

async function importCSV(filepath: string, collectionName: string, client: MongoClient) {
  const db = client.db(DB_NAME);
  const collection = db.collection(collectionName);
  const records = parseCSV(filepath);
  await collection.drop().catch(() => {}); // fresh import
  await collection.insertMany(records);
  console.log(`Imported ${records.length} records into '${collectionName}'`);
}

async function main() {
  const client = new MongoClient(MONGODB_URI, { tls: true, tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 10000 });
  await client.connect();

  const base = path.join(__dirname, '../data');
  await importCSV(`${base}/match_by_match_data.csv`, 'match_by_match', client);
  await importCSV(`${base}/team_match_by_match_data.csv`, 'team_match', client);
  await importCSV(`${base}/year_by_year_data.csv`, 'year_by_year', client);
  await importCSV(`${base}/player_info.csv`, 'player_info', client);

  await client.close();
  console.log('All data imported successfully.');
}

main().catch(console.error);
