/**
 * Distributed Cache & Key-Value Storage Layer (OWASP ASVS V2.2.1, V3.3.1, V13.1.1)
 * Native lightweight Redis RESP client with zero extra dependencies.
 * Automatically connects to REDIS_URL when configured, with graceful fallback to local memory.
 */

import net from 'net';

interface MemoryRecord {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryRecord>();

// Clean up expired items periodically to prevent memory leaks in fallback mode
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (now > item.expiresAt) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000);

class SimpleRedisClient {
  private socket: net.Socket | null = null;
  private isConnected = false;
  private pendingCallbacks: Array<(err: Error | null, reply: any) => void> = [];
  private buffer = '';
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private url?: string) {
    if (url) {
      this.connect();
    }
  }

  private connect() {
    if (!this.url) return;
    try {
      const parsed = new URL(this.url);
      const port = Number(parsed.port) || 6379;
      const host = parsed.hostname || '127.0.0.1';

      this.socket = net.createConnection({ host, port }, () => {
        this.isConnected = true;
        console.log(`[RedisStore] Connected successfully to Redis at ${host}:${port}`);

        // Handle AUTH if password provided
        if (parsed.password) {
          this.sendCommand(['AUTH', decodeURIComponent(parsed.password)]).catch(() => {});
        }
      });

      this.socket.on('data', (chunk) => {
        this.buffer += chunk.toString('utf8');
        this.processBuffer();
      });

      this.socket.on('error', (err) => {
        // Log once and gracefully switch to in-memory
        if (this.isConnected) {
          console.warn('[RedisStore] Redis socket connection error:', err.message);
        }
        this.isConnected = false;
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        if (!this.reconnectTimer && this.url) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 10000);
        }
      });
    } catch (e: any) {
      console.warn('[RedisStore] Invalid REDIS_URL, falling back to local memory store:', e.message);
      this.isConnected = false;
    }
  }

  private processBuffer() {
    while (this.buffer.length > 0 && this.pendingCallbacks.length > 0) {
      const lineEnd = this.buffer.indexOf('\r\n');
      if (lineEnd === -1) break;

      const prefix = this.buffer[0];
      const line = this.buffer.slice(1, lineEnd);

      if (prefix === '+' || prefix === ':') {
        // Simple string or integer
        const cb = this.pendingCallbacks.shift();
        this.buffer = this.buffer.slice(lineEnd + 2);
        if (cb) cb(null, prefix === ':' ? Number(line) : line);
      } else if (prefix === '-') {
        // Error
        const cb = this.pendingCallbacks.shift();
        this.buffer = this.buffer.slice(lineEnd + 2);
        if (cb) cb(new Error(line), null);
      } else if (prefix === '$') {
        // Bulk string
        const len = Number(line);
        if (len === -1) {
          const cb = this.pendingCallbacks.shift();
          this.buffer = this.buffer.slice(lineEnd + 2);
          if (cb) cb(null, null);
        } else {
          const totalExpected = lineEnd + 2 + len + 2;
          if (this.buffer.length < totalExpected) break; // Incomplete, wait for more chunks
          const val = this.buffer.slice(lineEnd + 2, lineEnd + 2 + len);
          this.buffer = this.buffer.slice(totalExpected);
          const cb = this.pendingCallbacks.shift();
          if (cb) cb(null, val);
        }
      } else {
        // Unsupported or invalid, flush
        this.buffer = this.buffer.slice(lineEnd + 2);
      }
    }
  }

  public sendCommand(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        return reject(new Error('Redis not connected'));
      }

      // Build RESP Array (*N\r\n$len\r\narg\r\n...)
      let cmd = `*${args.length}\r\n`;
      for (const arg of args) {
        const str = String(arg);
        cmd += `$${Buffer.byteLength(str, 'utf8')}\r\n${str}\r\n`;
      }

      this.pendingCallbacks.push((err, res) => {
        if (err) reject(err);
        else resolve(res);
      });

      this.socket.write(cmd);
    });
  }

  public get ready(): boolean {
    return this.isConnected;
  }
}

const redisClient = new SimpleRedisClient(process.env.REDIS_URL);

/**
 * Sets key-value with TTL in seconds.
 */
export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (redisClient.ready) {
    try {
      await redisClient.sendCommand(['SET', key, value, 'EX', String(ttlSeconds)]);
      return;
    } catch (e) {
      console.warn('[RedisStore] SET fallback to memory:', e);
    }
  }
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryStore.set(key, { value, expiresAt });
}

/**
 * Retrieves value if not expired.
 */
export async function cacheGet(key: string): Promise<string | null> {
  if (redisClient.ready) {
    try {
      const res = await redisClient.sendCommand(['GET', key]);
      return res ?? null;
    } catch (e) {
      console.warn('[RedisStore] GET fallback to memory:', e);
    }
  }
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

/**
 * Deletes key from store.
 */
export async function cacheDelete(key: string): Promise<void> {
  if (redisClient.ready) {
    try {
      await redisClient.sendCommand(['DEL', key]);
    } catch (e) {
      console.warn('[RedisStore] DEL fallback to memory:', e);
    }
  }
  memoryStore.delete(key);
}

/**
 * Atomically increments counter with TTL (Sliding/Fixed window for Rate Limit and Lockout).
 */
export async function cacheIncr(key: string, ttlSeconds: number): Promise<number> {
  if (redisClient.ready) {
    try {
      const count = await redisClient.sendCommand(['INCR', key]);
      if (count === 1) {
        await redisClient.sendCommand(['EXPIRE', key, String(ttlSeconds)]);
      }
      return Number(count);
    } catch (e) {
      console.warn('[RedisStore] INCR fallback to memory:', e);
    }
  }

  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || now > existing.expiresAt) {
    memoryStore.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }

  const newVal = parseInt(existing.value, 10) + 1;
  existing.value = String(newVal);
  return newVal;
}

/**
 * Returns store size for monitoring.
 */
export function getStoreSize(): number {
  return memoryStore.size;
}

export function isRedisConnected(): boolean {
  return redisClient.ready;
}

// Synchronous accessors to the local in-memory store for sync callers
export function cacheGetSync(key: string): string | null {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
}

export function cacheSetSync(key: string, value: string, ttlSeconds: number): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryStore.set(key, { value, expiresAt });
}

export function cacheDeleteSync(key: string): void {
  memoryStore.delete(key);
}

export function cacheIncrSync(key: string, ttlSeconds: number): number {
  const now = Date.now();
  const existing = memoryStore.get(key);
  if (!existing || now > existing.expiresAt) {
    memoryStore.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
    return 1;
  }
  const newVal = parseInt(existing.value, 10) + 1;
  existing.value = String(newVal);
  return newVal;
}

