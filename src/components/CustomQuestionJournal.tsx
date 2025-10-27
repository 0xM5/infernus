import { useRef, useEffect } from "react";
import { RichJournalEditor } from "./RichJournalEditor";

interface CustomQuestionJournalProps {
  questions: string[];
  answers: { [key: number]: string };
  onAnswerChange: (index: number, value: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
}

export const CustomQuestionJournal = ({
  questions,
  answers,
  onAnswerChange,
  onImageUpload,
}: CustomQuestionJournalProps) => {

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={index} className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {question}
          </h3>
          <RichJournalEditor
            value={answers[index] || ""}
            onChange={(value) => onAnswerChange(index, value)}
            onImageUpload={onImageUpload}
            height={200}
          />
        </div>
      ))}
      
      {/* Additional question at the bottom */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          Do you want to add anything else?
        </h3>
        <RichJournalEditor
          value={answers[-1] || ""}
          onChange={(value) => onAnswerChange(-1, value)}
          onImageUpload={onImageUpload}
          height={250}
        />
      </div>
    </div>
  );
};
