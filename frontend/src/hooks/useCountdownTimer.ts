import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { updateTime, completeTest } from '../store/testSlice';
import testService from '../utils/apiService';

export const useCountdownTimer = () => {
  const dispatch = useDispatch();
  const { timeRemaining, status, submissionId } = useSelector((state: RootState) => state.test);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const handleAutoSubmit = async () => {
      if (submissionId) {
        try {
          await testService.completeSubmission(submissionId);
          dispatch(completeTest());
        } catch (error) {
          console.error('Auto-submit failed:', error);
        }
      }
    };

    if (status === 'active' && timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch(updateTime());
      }, 1000);
    } else if (timeRemaining <= 0 && status === 'active') {
      handleAutoSubmit();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, timeRemaining, dispatch, submissionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    timeFormatted: formatTime(timeRemaining),
    timeRemaining,
    isExpired: timeRemaining === 0
  };
};
