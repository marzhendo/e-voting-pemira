/**
 * CSV Export Sanitization Utilities
 *
 * Prevents CSV Formula Injection (DDE/Excel/Google Sheets execution)
 * by prefixing cells that begin with formula trigger characters.
 */

const FORMULA_TRIGGER_REGEX = /^[=+\-@\t\r]/;

/**
 * Escapes quotes and neutralizes leading spreadsheet formula triggers in a CSV cell.
 */
export function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  if (FORMULA_TRIGGER_REGEX.test(str)) {
    str = `'${str}`;
  }

  return `"${str.replace(/"/g, '""')}"`;
}
