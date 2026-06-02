import { EpubCheck } from '@likecoin/epubcheck-ts';

export interface ValidationReport {
  filename: string;
  isValid: boolean;
  timestamp: number;
  errorCount: number;
  warningCount: number;
  messages: Array<{
    level: 'error' | 'warning' | 'info';
    message: string;
    location?: string;
  }>;
}

export async function validateEpub(file: File): Promise<ValidationReport> {
  const buffer = await file.arrayBuffer();
  const messages: ValidationReport['messages'] = [];

  try {
    const result = await EpubCheck.validate(new Uint8Array(buffer));

    // Extract messages from epubcheck result
    if (result.messages) {
      messages.push(
        ...result.messages.map((msg: any) => ({
          level: msg.severity?.toLowerCase() || 'info',
          message: msg.message,
          location: msg.path || undefined,
        })),
      );
    }

    const errorCount = messages.filter((m) => m.level === 'error').length;
    const warningCount = messages.filter((m) => m.level === 'warning').length;

    return {
      filename: file.name,
      isValid: errorCount === 0,
      timestamp: Date.now(),
      errorCount,
      warningCount,
      messages,
    };
  } catch (error) {
    return {
      filename: file.name,
      isValid: false,
      timestamp: Date.now(),
      errorCount: 1,
      warningCount: 0,
      messages: [
        {
          level: 'error',
          message: `Validation failed: ${String(error)}`,
        },
      ],
    };
  }
}

export async function saveValidationReport(
  report: ValidationReport,
): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const validationDir = await root.getDirectoryHandle('validations', {
    create: true,
  });

  // Sanitize filename for storage
  const reportName = `${report.filename}.json`;
  const fileHandle = await validationDir.getFileHandle(reportName, {
    create: true,
  });

  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(report, null, 2));
  await writable.close();
}

export async function loadValidationReport(
  filename: string,
): Promise<ValidationReport | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const validationDir = await root.getDirectoryHandle('validations');
    const reportName = `${filename}.json`;
    const fileHandle = await validationDir.getFileHandle(reportName);
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}

export async function deleteValidationReport(filename: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    const validationDir = await root.getDirectoryHandle('validations');
    await validationDir.removeEntry(`${filename}.json`);
  } catch (error) {
    // Idempotent: no report (or no validations dir) is fine.
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return;
    }
    throw error;
  }
}
