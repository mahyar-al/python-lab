import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cacheSet, cacheGet } from './redisStore';

export const DATA_DIR = path.resolve('data');
export const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
export const DATA_FILE = path.join(DATA_DIR, 'morico_store.json');
export const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit_logs.jsonl');
export const REVOKED_TOKENS_FILE = path.join(DATA_DIR, 'revoked_tokens.json');
export const UPLOADS_DIR = path.resolve('public/uploads');

// Ensure all persistent directories exist
for (const dir of [DATA_DIR, BACKUPS_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  traceId?: string;
  actorId?: string;
  event:
    | 'AUTH_LOGIN_SUCCESS'
    | 'AUTH_LOGIN_FAILED'
    | 'AUTH_ACCOUNT_LOCKED'
    | 'AUTH_REGISTER_SUCCESS'
    | 'AUTH_LOGOUT'
    | 'ADMIN_PASSWORD_CHANGED'
    | 'ADMIN_UNAUTHORIZED_ATTEMPT'
    | 'ADMIN_MFA_CHALLENGE'
    | 'ADMIN_MFA_ENABLED'
    | 'ORDER_STATUS_CHANGED'
    | 'ORDER_PRICE_TAMPERING_ATTEMPT'
    | 'MALICIOUS_UPLOAD_BLOCKED'
    | 'PAYMENT_VERIFICATION_SUCCESS'
    | 'PAYMENT_VERIFICATION_FAILED'
    | 'CATALOG_MUTATION'
    | 'SETTINGS_MUTATION';
  username?: string;
  ip: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  prevHash?: string;
  entryHash?: string;
}

// In-memory cache for recent audit logs
let recentAuditLogs: AuditLogEntry[] = [];
let lastAuditHash = '0000000000000000000000000000000000000000000000000000000000000000';

// In-memory set of revoked tokens & JTIs
const revokedTokensSet = new Set<string>();

/**
 * Loads persistent revoked tokens from disk.
 */
export function loadRevokedTokens(): Set<string> {
  try {
    if (fs.existsSync(REVOKED_TOKENS_FILE)) {
      const data = JSON.parse(fs.readFileSync(REVOKED_TOKENS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item.token === 'string') {
            if (!item.exp || item.exp > Date.now()) {
              revokedTokensSet.add(item.token);
              cacheSet(`revoked:${item.token}`, '1', 24 * 3600).catch(() => {});
            }
          } else if (typeof item === 'string') {
            revokedTokensSet.add(item);
            cacheSet(`revoked:${item}`, '1', 24 * 3600).catch(() => {});
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not load revoked tokens:', e);
  }
  return revokedTokensSet;
}

/**
 * Persists a revoked token to disk and distributed cache.
 */
export function recordRevokedToken(tokenOrJti: string, exp = Date.now() + 24 * 60 * 60 * 1000) {
  revokedTokensSet.add(tokenOrJti);
  const ttlSec = Math.max(1, Math.ceil((exp - Date.now()) / 1000));
  cacheSet(`revoked:${tokenOrJti}`, '1', ttlSec).catch(() => {});

  try {
    const list = Array.from(revokedTokensSet).map((t) => ({ token: t, exp }));
    const tmp = `${REVOKED_TOKENS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf8');
    fs.renameSync(tmp, REVOKED_TOKENS_FILE);
  } catch (e) {
    console.error('Failed to persist revoked token:', e);
  }
}

export function isTokenRevoked(jti: string, fullToken: string): boolean {
  return revokedTokensSet.has(jti) || revokedTokensSet.has(fullToken);
}

/**
 * Records a tamper-evident audit log entry with SHA-256 hash chaining (OWASP ASVS V7.1, V7.2).
 */
export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'prevHash' | 'entryHash'>): void {
  const id = `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const prevHash = lastAuditHash;

  // Mask sensitive values (PII Redaction)
  let sanitizedDetails = entry.details;
  sanitizedDetails = sanitizedDetails.replace(/(\d{4})[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{4})/g, '$1-****-****-$4');

  // Compute cryptographic hash of the entry chained to the previous hash
  const payloadToHash = `${id}|${timestamp}|${entry.event}|${entry.username || ''}|${entry.ip}|${sanitizedDetails}|${prevHash}`;
  const entryHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');
  lastAuditHash = entryHash;

  const item: AuditLogEntry = {
    ...entry,
    details: sanitizedDetails,
    id,
    timestamp,
    prevHash,
    entryHash
  };

  recentAuditLogs.unshift(item);
  if (recentAuditLogs.length > 500) {
    recentAuditLogs.pop();
  }

  // Append-only write to separate audit file (OWASP ASVS V7.2)
  try {
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(item) + '\n', 'utf8');
  } catch (e) {
    console.error('Failed to append to audit log file:', e);
  }
}

export function getRecentAuditLogs(): AuditLogEntry[] {
  return recentAuditLogs;
}

/**
 * Loads recent audit logs from AUDIT_LOG_FILE and restores hash chain position.
 */
export function loadAuditLogs(): void {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
      const lines = content.trim().split('\n');
      const parsed: AuditLogEntry[] = [];
      for (let i = lines.length - 1; i >= 0 && parsed.length < 500; i--) {
        const line = lines[i].trim();
        if (line) {
          try {
            const entry: AuditLogEntry = JSON.parse(line);
            parsed.push(entry);
          } catch {}
        }
      }
      recentAuditLogs = parsed;

      // Set lastAuditHash from latest entry
      if (parsed.length > 0 && parsed[0].entryHash) {
        lastAuditHash = parsed[0].entryHash;
      }
    }
  } catch (e) {
    console.warn('Could not load audit logs file:', e);
  }
}

/**
 * Verifies cryptographic integrity of the audit logs to detect any tampering or record deletion.
 */
export function verifyAuditLogIntegrity(): { valid: boolean; totalChecked: number; errorAt?: number } {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) return { valid: true, totalChecked: 0 };
    const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    let expectedPrev = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < lines.length; i++) {
      const entry: AuditLogEntry = JSON.parse(lines[i]);
      if (entry.prevHash && entry.prevHash !== expectedPrev && expectedPrev !== '0000000000000000000000000000000000000000000000000000000000000000') {
        return { valid: false, totalChecked: i, errorAt: i };
      }
      if (entry.entryHash) {
        const payload = `${entry.id}|${entry.timestamp}|${entry.event}|${entry.username || ''}|${entry.ip}|${entry.details}|${entry.prevHash}`;
        const computed = crypto.createHash('sha256').update(payload).digest('hex');
        if (computed !== entry.entryHash) {
          return { valid: false, totalChecked: i, errorAt: i };
        }
        expectedPrev = entry.entryHash;
      }
    }
    return { valid: true, totalChecked: lines.length };
  } catch {
    return { valid: false, totalChecked: 0 };
  }
}

/**
 * Performs daily backup of morico_store.json if not already created today.
 */
export function performDailyBackup(): void {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const today = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUPS_DIR, `morico_store_${today}.json`);
    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(DATA_FILE, backupFile);
      console.log(`[MORICO Security] Daily backup created: ${backupFile}`);
    }
  } catch (e) {
    console.warn('Could not create daily backup:', e);
  }
}

let saveDebounceTimer: NodeJS.Timeout | null = null;

/**
 * Saves store state atomically to DATA_FILE using a temporary file and rename.
 */
export function saveStoreStateAtomic(state: any, immediate = false): void {
  const doSave = () => {
    try {
      const tmpFile = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(tmpFile, DATA_FILE);
      performDailyBackup();
    } catch (err) {
      console.error('Error saving persistent state atomically:', err);
    }
  };

  if (immediate) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    doSave();
    return;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(doSave, 300);
}
