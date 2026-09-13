"use client";

/**
 * File exports for the organizer dashboard. Every "Export" button goes through
 * here, so escaping, BOM and filenames behave the same everywhere.
 */

type Cell = string | number | boolean | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Quote anything Excel would otherwise split or reinterpret. A leading
  // `=`, `+`, `-` or `@` is prefixed so a buyer name can't become a formula
  // when the organizer opens the file.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick — Safari cancels the download if it's revoked synchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Downloads a CSV. The UTF-8 BOM is what makes Excel on Windows read ₹ and
 * Gujarati names correctly instead of as mojibake — most organizers will open
 * these in Excel, not a text editor.
 */
export function downloadCsv(filename: string, headers: string[], rows: Cell[][]) {
  const blob = new Blob(["﻿", toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function paiseToRupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Opens a print-ready document in a new window and triggers the print dialog,
 * which is how the browser produces a PDF ("Save as PDF"). Generating a PDF
 * file in the page would mean shipping a PDF library for one button.
 */
export function openPrintable(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "noopener=no,width=820,height=1000");
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111;margin:40px;font-size:13px}
  h1{font-size:20px;margin:0 0 4px} .muted{color:#666} table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd} td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  .total td{font-weight:700;border-top:2px solid #111} .row{display:flex;justify-content:space-between;gap:24px;margin-top:20px}
  @media print{body{margin:16mm}}
</style></head><body>${bodyHtml}<script>window.onload=function(){window.print()}</script></body></html>`);
  win.document.close();
  return true;
}
