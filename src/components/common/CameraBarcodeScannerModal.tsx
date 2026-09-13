'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { playScanBeep, playErrorBuzz } from '../../lib/soundFx';

interface Props {
  title?: string;
  onScan: (code: string) => void;
  onClose: () => void;
  suggestedAwbs?: string[];
}

export default function CameraBarcodeScannerModal({
  title = 'Warehouse Camera Barcode / QR Scanner',
  onScan,
  onClose,
  suggestedAwbs = []
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera API not accessible in this environment. Use simulated scanner below.');
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.debug('Video play error:', e));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setCameraError(error.message || 'Unable to open camera stream. Use quick simulator below.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulateScan = (code: string) => {
    playScanBeep(1600, 0.08);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    onScan(code);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#0a0f1d',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(56, 189, 248, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={() => {
              if (stream) stream.getTracks().forEach(t => t.stop());
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div style={{
          position: 'relative',
          height: '280px',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {cameraError ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
              <Camera size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600, marginBottom: '0.25rem' }}>
                Camera hardware standby / restricted
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Point barcode gun or select test consignment below
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Aiming Reticle */}
              <div style={{
                position: 'absolute',
                width: '220px',
                height: '140px',
                border: '2px solid #38bdf8',
                borderRadius: '12px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Laser scan line */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                  animation: 'pulse 1.5s infinite'
                }} />
              </div>
            </>
          )}
        </div>

        {/* Quick Simulator Bar */}
        <div style={{ padding: '1.25rem', background: 'rgba(0, 0, 0, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Instant Barcode Simulation (One-Click Scan):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {suggestedAwbs.length > 0 ? (
              suggestedAwbs.slice(0, 6).map(awb => (
                <button
                  key={awb}
                  type="button"
                  onClick={() => handleSimulateScan(awb)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    padding: '0.4rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Sparkles size={12} /> Scan {awb}
                </button>
              ))
            ) : (
              ['D7-8821-EXP', 'D7-9014-CARGO', 'VIP016279', 'FICO086274'].map(awb => (
                <button
                  key={awb}
                  type="button"
                  onClick={() => handleSimulateScan(awb)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    padding: '0.4rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Scan {awb}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
