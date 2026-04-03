import * as FileSystem from 'expo-file-system/legacy';

let buffer: string[] = [];
const logPath = 'logs/sharing.log';
let initialized = false;

function getLogFileUriUnsafe(): string | null {
  if (!FileSystem.documentDirectory) return null;
  return `${FileSystem.documentDirectory}${logPath}`;
}

async function appendLine(line: string): Promise<void> {
  try {
    if (!initialized && FileSystem.documentDirectory) {
      const dir = `${FileSystem.documentDirectory}logs/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      initialized = true;
    }

    const uri = getLogFileUriUnsafe();
    if (!uri) return;

    let previous = '';
    try {
      previous = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    } catch (_error) {
      previous = '';
    }

    await FileSystem.writeAsStringAsync(uri, `${previous}${line}\n`, { encoding: FileSystem.EncodingType.UTF8 });
  } catch (error) {
    console.warn('log write failed', (error as { message?: unknown })?.message || error);
  }
}

export async function log(...args: unknown[]) {
  const line = `[INFO] ${new Date().toISOString()} ${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
  console.log(line);
  buffer.push(line);
  await appendLine(line);
}

export async function error(...args: unknown[]) {
  const line = `[ERROR] ${new Date().toISOString()} ${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
  console.error(line);
  buffer.push(line);
  await appendLine(line);
}

export async function getLogFileUri() {
  return getLogFileUriUnsafe();
}

export function getBuffer() {
  return buffer.slice(-500);
}

export async function clearLogs() {
  buffer = [];
  const uri = getLogFileUriUnsafe();
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (_error) { /* intentionally ignored */ }
}


