import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useRef, useEffect } from "react";
import BlotFormatter from "quill-blot-formatter";


try {
  // @ts-ignore
  Quill.register("modules/blotFormatter", BlotFormatter);
} catch {}


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
  const quillRefs = useRef<{ [key: number]: ReactQuill | null }>({});

  const imageHandler = (index: number) => {
    return function(this: any) {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file && onImageUpload) {
          const url = await onImageUpload(file);
          if (url) {
            const quill = quillRefs.current[index]?.getEditor();
            if (quill) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', url);
            }
          }
        }
      };
    };
  };

  const getModules = (index: number) => ({
    toolbar: {
      container: [
        [{ font: [] }, { size: [] }],
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        ["image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler(index),
      },
    },
    blotFormatter: {},
    clipboard: {
      matchVisual: false,
      matchers: [
        // Intercept pasted images and upload them instead of embedding base64
        ['img', (node: any, delta: any) => {
          const image = node;
          const imageUrl = image.getAttribute('src');
          
          // If it's a data URL (pasted image), we need to upload it
          if (imageUrl && imageUrl.startsWith('data:image')) {
            // Convert data URL to blob and upload
            fetch(imageUrl)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], 'pasted-image.png', { type: blob.type });
                if (onImageUpload) {
                  onImageUpload(file).then(url => {
                    if (url && quillRefs.current[index]) {
                      const quill = quillRefs.current[index]!.getEditor();
                      const range = quill.getSelection(true);
                      // Remove the temporary base64 image
                      quill.deleteText(range.index - 1, 1);
                      // Insert the uploaded image URL
                      quill.insertEmbed(range.index - 1, 'image', url);
                    }
                  });
                }
              });
            // Return empty delta to prevent base64 insertion initially
            return { ops: [] };
          }
          return delta;
        }]
      ]
    }
  });

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <div key={index} className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {question}
          </h3>
          <div className={`h-[200px] custom-question-editor-${index}`}>
            <ReactQuill
              ref={(el) => (quillRefs.current[index] = el)}
              theme="snow"
              value={answers[index] || ""}
              onChange={(value) => onAnswerChange(index, value)}
              modules={getModules(index)}
              className="h-[150px] rounded-xl [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-transparent [&_.ql-toolbar]:border-transparent [&_.ql-container]:bg-background [&_.ql-toolbar]:bg-muted/80 [&_.ql-editor]:text-foreground [&_.ql-editor]:min-h-[100px]"
            />
          </div>
        </div>
      ))}
      
      {/* Additional question at the bottom */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          Do you want to add anything else?
        </h3>
        <div className="h-[250px] custom-question-editor--1">
          <ReactQuill
            ref={(el) => (quillRefs.current[-1] = el)}
            theme="snow"
            value={answers[-1] || ""}
            onChange={(value) => onAnswerChange(-1, value)}
            modules={getModules(-1)}
            className="h-[200px] rounded-xl [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:border-transparent [&_.ql-toolbar]:border-transparent [&_.ql-container]:bg-background [&_.ql-toolbar]:bg-muted/80 [&_.ql-editor]:text-foreground [&_.ql-editor]:min-h-[150px]"
          />
        </div>
      </div>
    </div>
  );
};
