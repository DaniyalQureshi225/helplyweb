'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mic, RotateCcw, Square, Trash2, UploadCloud } from 'lucide-react';
import { startWavRecording, sha256Hex, MAX_SECONDS } from '@/lib/audioRecorder';
import { customerApi } from '@/services/customerApi';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/stores/uiStore';
import { Alert, Button, ProgressBar } from '@/components/ui/primitives';
import { formatClock } from '@/lib/utils';

/**
 * Records a voice note in the browser, uploads it as one checksum-verified
 * chunk, and finalises it before handing the recording id to the review form.
 * Nothing is uploaded until the guest explicitly confirms the recording.
 */
export function VoiceRecorder({ sessionId, onUploaded, disabled = false }) {
  const [phase, setPhase] = useState('idle'); // idle | recording | stopped | uploading | attached
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const tickRef = useRef(null);
  const clipRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      recorderRef.current?.cancel?.();
      if (clipRef.current?.url) URL.revokeObjectURL(clipRef.current.url);
    };
  }, []);

  const clearTimer = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const stop = async () => {
    clearTimer();
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      const result = await recorder.stop();
      recorderRef.current = null;
      if (!result.blob.size) throw new Error('No audio was captured. Please try again.');
      const url = URL.createObjectURL(result.blob);
      const next = { blob: result.blob, url, durationSeconds: result.durationSeconds };
      clipRef.current = next;
      setClip(next);
      setSeconds(Math.round(result.durationSeconds));
      setPhase('stopped');
      onUploaded?.(null);
    } catch (err) {
      setError(errorMessage(err, 'We could not finish the recording.'));
      setPhase('idle');
    }
  };

  const start = async () => {
    setError('');
    clearTimer();
    try {
      if (clipRef.current?.url) URL.revokeObjectURL(clipRef.current.url);
      clipRef.current = null;
      setClip(null);
      setProgress(0);
      const recorder = await startWavRecording();
      recorderRef.current = recorder;
      setSeconds(0);
      setPhase('recording');
      tickRef.current = window.setInterval(() => {
        const elapsed = recorder.elapsedSeconds;
        setSeconds(Math.floor(elapsed));
        if (elapsed >= MAX_SECONDS) stop();
      }, 500);
    } catch (err) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow the microphone in your browser settings, or skip the voice note.'
          : errorMessage(err, 'We could not access your microphone.'),
      );
      setPhase('idle');
    }
  };

  const reset = () => {
    clearTimer();
    recorderRef.current?.cancel?.();
    recorderRef.current = null;
    if (clipRef.current?.url) URL.revokeObjectURL(clipRef.current.url);
    clipRef.current = null;
    setClip(null);
    setSeconds(0);
    setProgress(0);
    setPhase('idle');
    setError('');
    onUploaded?.(null);
  };

  const upload = async () => {
    if (!clip) return;
    setError('');
    setPhase('uploading');
    setProgress(0);
    try {
      const recording = await customerApi.createVoiceRecording(sessionId);
      await customerApi.startRecording(recording.id);
      const buffer = await clip.blob.arrayBuffer();
      const checksum = await sha256Hex(buffer);
      await customerApi.uploadRecordingChunk(recording.id, {
        index: 0,
        checksum,
        file: clip.blob,
        durationMs: Math.round(clip.durationSeconds * 1000),
        onProgress: setProgress,
      });
      await customerApi.finalizeRecording(recording.id, 1);
      setPhase('attached');
      onUploaded?.({ recordingId: recording.id, durationSeconds: Math.round(clip.durationSeconds) });
      toast.success('Voice note attached', 'It will be submitted with your review.');
    } catch (err) {
      setError(errorMessage(err, 'We could not upload the voice note. You can still submit your review.'));
      setPhase('stopped');
    }
  };

  if (disabled) return null;

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-900">Add a voice note (optional)</p>
          <p className="mt-0.5 text-xs leading-relaxed text-navy-500">
            Up to {formatClock(MAX_SECONDS)}. Only your voice is recorded, and only after you press record.
          </p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Mic className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      {error ? (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      ) : null}

      {phase === 'idle' ? (
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={start}>
          <Mic className="h-4 w-4" aria-hidden="true" />
          Start recording
        </Button>
      ) : null}

      {phase === 'recording' ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
            <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-red-600" aria-hidden="true" />
            Recording
          </span>
          <span className="font-mono text-sm text-red-700">{formatClock(seconds)}</span>
          <Button type="button" size="sm" variant="dangerSoft" className="ml-auto" onClick={stop}>
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
            Stop
          </Button>
        </div>
      ) : null}

      {phase === 'stopped' && clip ? (
        <div className="mt-4 space-y-3">
          <audio src={clip.url} controls className="w-full" preload="metadata">
            <track kind="captions" />
          </audio>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={upload}>
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Use this recording
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={start}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Record again
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Discard
            </Button>
          </div>
        </div>
      ) : null}

      {phase === 'uploading' ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-navy-600">Uploading your voice note… {progress}%</p>
          <ProgressBar value={progress} label="Voice note upload progress" />
        </div>
      ) : null}

      {phase === 'attached' ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-3 text-sm font-medium text-teal-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Voice note attached and verified by the server.
        </div>
      ) : null}
    </div>
  );
}
