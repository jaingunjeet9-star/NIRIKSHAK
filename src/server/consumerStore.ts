/**
 * NIRIKSHAK Consumer Mode — Isolated Storage Store
 * Manages persistent storage for consumer scans in data/consumer-scans.json.
 * Completely decoupled from Inspector inspections.json.
 */

import fs from 'fs';
import path from 'path';
import { ConsumerScanRecord } from '../types/consumerTypes';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONSUMER_FILE = path.join(DATA_DIR, 'consumer-scans.json');

function loadInitialConsumerScans(): ConsumerScanRecord[] {
  try {
    if (fs.existsSync(CONSUMER_FILE)) {
      const content = fs.readFileSync(CONSUMER_FILE, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[ConsumerStore] Error loading consumer-scans.json:', err);
  }
  return [];
}

let consumerScans: ConsumerScanRecord[] = loadInitialConsumerScans();

function saveConsumerScansStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONSUMER_FILE, JSON.stringify(consumerScans, null, 2), 'utf8');
  } catch (err) {
    console.error('[ConsumerStore] Failed to write consumer-scans.json:', err);
  }
}

export function getAllConsumerScans(): ConsumerScanRecord[] {
  return [...consumerScans];
}

export function getConsumerScanById(id: string): ConsumerScanRecord | undefined {
  return consumerScans.find((s) => s.id === id);
}

export function saveConsumerScan(record: ConsumerScanRecord): ConsumerScanRecord {
  const existingIdx = consumerScans.findIndex((s) => s.id === record.id);
  if (existingIdx >= 0) {
    consumerScans[existingIdx] = record;
  } else {
    consumerScans.unshift(record);
  }
  saveConsumerScansStore();
  return record;
}

export function deleteConsumerScan(id: string): boolean {
  const initialLen = consumerScans.length;
  consumerScans = consumerScans.filter((s) => s.id !== id);
  if (consumerScans.length !== initialLen) {
    saveConsumerScansStore();
    return true;
  }
  return false;
}
