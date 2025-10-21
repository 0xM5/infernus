import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface CustomQuestionJournalProps {
  questions: string[];
  answers: { [key: number]: string };
  onAnswerChange: (index: number, value: string) => void;
}

export const CustomQuestionJournal = ({
  questions,
  answers,
  onAnswerChange,
}: CustomQuestionJournalProps) => {
  const modules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      ["image"],
      ["clean"],
    ],
  };

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={index} className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {question}
          </h3>
          <div className="h-[200px]">
            <ReactQuill
              theme="snow"
              value={answers[index] || ""}
              onChange={(value) => onAnswerChange(index, value)}
              modules={modules}
              className="h-[150px] bg-background rounded-xl [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-input [&_.ql-toolbar]:border-input [&_.ql-container]:bg-background [&_.ql-editor]:text-foreground [&_.ql-editor]:min-h-[100px]"
            />
          </div>
        </div>
      ))}
      
      {/* Additional question at the bottom */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          Do you want to add anything else?
        </h3>
        <div className="h-[250px]">
          <ReactQuill
            theme="snow"
            value={answers[-1] || ""}
            onChange={(value) => onAnswerChange(-1, value)}
            modules={modules}
            className="h-[200px] bg-background rounded-xl [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-input [&_.ql-toolbar]:border-input [&_.ql-container]:bg-background [&_.ql-editor]:text-foreground [&_.ql-editor]:min-h-[150px]"
          />
        </div>
      </div>
    </div>
  );
};
