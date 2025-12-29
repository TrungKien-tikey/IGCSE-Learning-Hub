"use client";

import { Question } from "../types";

interface Props {
  question: Question;
  selectedOptionId?: number;
  onSelect: (questionId: number, optionId: number) => void;
}

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
}: Props) {
  return (
    <div className="border rounded p-4 mb-4">
      <p className="font-medium mb-3">
        {question.content} ({question.marks} marks)
      </p>

      {question.options.map((opt) => (
        <label
          key={opt.id}
          className="flex items-center gap-2 mb-2 cursor-pointer"
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={selectedOptionId === opt.id}
            onChange={() => onSelect(question.id, opt.id)}
          />
          {opt.content}
        </label>
      ))}
    </div>
  );
}
