import { useEffect, useRef, useState, useCallback } from 'react';
import testService from '../utils/apiService';

type ViolationType = 'tab_switch' | 'window_blur' | 'fullscreen_exit';

interface ViolationEvent {
  type: ViolationType;
  timestamp: number;
  count: number;
}

interface UseProtectingProps {
  onViolation: (count: number, type: ViolationType) => void;
  onAutoSubmit: () => void;
  submissionId: string | null;
  maxViolations?: number;
  cooldownMs?: number;
  enabled: boolean;
  initialViolations?: number;
}

interface UseProtectingReturn {
  violations: number;
  violationLog: ViolationEvent[];
}

export default function useProtecting({
  onViolation,
  onAutoSubmit,
  submissionId,
  maxViolations = 3,
  cooldownMs = 1500,
  enabled,
  initialViolations = 0,
}: UseProtectingProps): UseProtectingReturn {
  const [violations, setViolations] = useState(initialViolations);
  const [violationLog, setViolationLog] = useState<ViolationEvent[]>([]);

  useEffect(() => {
    setViolations(initialViolations);
  }, [initialViolations]);

  const violationsRef = useRef(violations);
  const cooldownRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const submissionIdRef = useRef(submissionId);

  useEffect(() => { violationsRef.current = violations; }, [violations]);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);
  useEffect(() => { submissionIdRef.current = submissionId; }, [submissionId]);

  const triggerViolation = useCallback((type: ViolationType) => {
    if (cooldownRef.current || autoSubmittedRef.current) {
      return;
    }

    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, cooldownMs);

    const nextCount = violationsRef.current + 1;
    const event: ViolationEvent = { type, timestamp: Date.now(), count: nextCount };

    setViolations(nextCount);
    setViolationLog((prev) => [...prev, event]);
    onViolationRef.current(nextCount, type);

    if (submissionIdRef.current) {
      testService.logViolation(submissionIdRef.current, event).catch(() => {});
    }

    if (nextCount >= maxViolations) {
      autoSubmittedRef.current = true;
      onAutoSubmitRef.current();
    }
  }, [cooldownMs, maxViolations]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) triggerViolation('tab_switch');
    };

    const handleBlur = () => {
      triggerViolation('window_blur');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) triggerViolation('fullscreen_exit');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, triggerViolation, submissionId]);

  return { violations, violationLog };
}
