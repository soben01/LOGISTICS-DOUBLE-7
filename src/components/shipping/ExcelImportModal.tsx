'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Info,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  parseShipmentsExcel,
  downloadExcelTemplate,
  ParsedExcelResult
} from '../../lib/excelImport';
import { bulkCreateShipments, Shipment } from '../../lib/store';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportComplete
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedExcelResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{ added: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setParseError('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setParsing(true);
    setImportSuccess(null);

    try {
      const result = await parseShipmentsExcel(selectedFile);
      setParseResult(result);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse spreadsheet.');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;

    setImporting(true);
    try {
      const shipmentsToCreate = parseResult.rows.map(r => r.shipment);
      const res = await bulkCreateShipments(shipmentsToCreate);
      setImportSuccess({ added: res.added, skipped: res.skipped });
      onImportComplete(res.added);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error executing bulk import.');
    } finally {
      setImporting(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setImportSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.25rem'
    }}>
      <div style={{
        background: '#0c111d',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 102, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <FileSpreadsheet size={20} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
                Bulk Excel / CSV Consignment Import
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Upload your manifest spreadsheet without manual entry. Auto-syncs to Cloudflare D1.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Template Download Notification Strip */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Info size={18} color="var(--brand-cyan)" />
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                <span>Need the standard template? Includes sample bookings (e.g. </span>
                <code style={{ color: 'var(--brand-cyan)', fontFamily: 'monospace' }}>P250009404758</code>
                <span>) &amp; mapped columns.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => downloadExcelTemplate('xlsx')}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: 'rgba(56, 189, 248, 0.3)' }}
              >
                <Download size={13} color="var(--brand-cyan)" />
                <span>Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadExcelTemplate('csv')}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={13} />
                <span>Template (.csv)</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {importSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={24} color="#10b981" />
                <div>
                  <h4 style={{ margin: 0, color: '#10b981', fontSize: '0.98rem', fontWeight: 700 }}>
                    Successfully Imported {importSuccess.added} Consignment{importSuccess.added === 1 ? '' : 's'}!
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    All records saved to local dispatch store and queued for Cloudflare D1 sync.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary btn-sm"
              >
                <span>View Bookings</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#f87171',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={18} />
              <span>{parseError}</span>
            </div>
          )}

          {/* File Upload Zone (shown when no parsed result or user wants to re-upload) */}
          {!parseResult && !importSuccess && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--brand-orange)' : 'var(--border-medium)'}`,
                background: isDragging ? 'rgba(255, 102, 0, 0.08)' : 'rgba(255, 255, 255, 0.015)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 102, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 102, 0, 0.3)',
                boxShadow: '0 0 20px rgba(255, 102, 0, 0.2)'
              }}>
                <Upload size={24} color="var(--brand-orange)" />
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {isDragging ? 'Drop your spreadsheet here' : 'Select or drag your Excel file here'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
                  Supports <strong style={{ color: '#ffffff' }}>.XLSX</strong>, <strong style={{ color: '#ffffff' }}>.XLS</strong>, and <strong style={{ color: '#ffffff' }}>.CSV</strong> manifests
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>Auto Header Mapping</span>
                <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>Booking &amp; Parcel Search Ready</span>
                <span className="badge badge-subtle" style={{ fontSize: '0.7rem' }}>Cloudflare D1 Sync</span>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {parsing && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <RefreshCw size={24} className="animate-spin" color="var(--brand-orange)" />
              <span style={{ fontSize: '0.86rem' }}>Analyzing sheet structure and mapping columns...</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parseResult && !importSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* File details bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCheck size={18} color="#10b981" />
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
                    {parseResult.fileName}
                  </span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    {parseResult.totalRows} Consignments Parsed
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem' }}
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Column mapping chips */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.74rem'
              }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.5rem' }}>
                  Detected Headers:
                </span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.3rem' }}>
                  {Object.entries(parseResult.detectedMappings).map(([orig, canonical]) => (
                    <span
                      key={orig}
                      style={{
                        padding: '2px 7px',
                        background: 'rgba(255, 102, 0, 0.1)',
                        border: '1px solid rgba(255, 102, 0, 0.25)',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontFamily: 'monospace'
                      }}
                    >
                      {orig} &rarr; <strong style={{ color: 'var(--brand-orange)' }}>{canonical}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Preview Table */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflowX: 'auto', maxHeight: '300px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>#</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Booking No</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Parcel No</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Merchant</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Consignee</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Phone</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>City</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Weight</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Amount</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.rows.map((r, i) => {
                      const s = r.shipment;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)' }}>{r.rowNumber}</td>
                          <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                            {s.bookingNo || s.id}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                            {s.parcelNo || '—'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: '#ffffff' }}>
                            {s.merchant || '—'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: '#ffffff', fontWeight: 600 }}>
                            {s.recipient?.name || '—'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-secondary)' }}>
                            {s.recipient?.phone || '—'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: '#ffffff' }}>
                            {s.destination?.city || '—'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-secondary)' }}>
                            {s.cargo?.weightKg} kg
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem', color: 'var(--brand-orange)', fontFamily: 'monospace' }}>
                            NPR {s.codAmount?.toLocaleString() || '0'}
                          </td>
                          <td style={{ padding: '0.6rem 0.85rem' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={resetUpload}
                  className="btn btn-secondary"
                  disabled={importing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="btn btn-primary"
                  disabled={importing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minWidth: '180px', justifyContent: 'center' }}
                >
                  {importing ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Importing Consignments...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm &amp; Import ({parseResult.totalRows})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
