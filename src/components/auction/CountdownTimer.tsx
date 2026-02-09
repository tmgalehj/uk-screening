"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endsAt: string;
  compact?: boolean;
}

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: false };
}

export function CountdownTimer({ endsAt, compact }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) {
    return <span className="text-destructive font-semibold">Ended</span>;
  }

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 30;
  const color = isUrgent ? "text-destructive" : "text-foreground";

  if (compact) {
    return (
      <span className={`font-mono text-sm ${color}`}>
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    );
  }

  return (
    <div className={`flex gap-2 ${color}`}>
      {timeLeft.hours > 0 && (
        <div className="flex flex-col items-center">
          <span className="font-mono text-xl font-bold">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase">hrs</span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="font-mono text-xl font-bold">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">min</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-mono text-xl font-bold">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">sec</span>
      </div>
    </div>
  );
}
