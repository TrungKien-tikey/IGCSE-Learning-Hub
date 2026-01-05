"use client";

import { useEffect, useState } from "react";

interface Props {
  title: string;
  durationMinutes: number;
  onTimeUp: () => void;
}

export default function ExamHeader({ title, durationMinutes, onTimeUp }: Props) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex justify-between items-center p-4 bg-gray-100 sticky top-0">
      <h1 className="text-xl font-bold">{title}</h1>
      <span className="text-red-600 font-semibold">
        ⏱ {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
