import React, { useMemo, useRef, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import BlotFormatter from "quill-blot-formatter";

// Register once (safe in try/catch)
try {
  // @ts-ignore
  Quill.register("modules/blotFormatter", BlotFormatter);
} catch {}

interface RichJournalEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  placeholder?: string;
  height?: number;
}

export const RichJournalEditor: React.FC<RichJournalEditorProps> = ({
  value,
  onChange,
  onImageUpload,
  placeholder = "Write your journal entry...",
  height = 420,
}) => {
  const quillRef = useRef<ReactQuill | null>(null);

  const imageHandler = () => {
    return function (this: any) {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (file && onImageUpload && quillRef.current) {
          const url = await onImageUpload(file);
          if (!url) return;
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range?.index ?? 0, "image", url);
        }
      };
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ header: 1 }, { header: 2 }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler(),
      },
    },
    blotFormatter: {},
    clipboard: {
      matchVisual: false,
      matchers: [
        ["img", (node: any, delta: any) => {
          const imageUrl = node.getAttribute("src");
          if (imageUrl && imageUrl.startsWith("data:image")) {
            if (!onImageUpload) return delta;
            fetch(imageUrl)
              .then((r) => r.blob())
              .then((blob) => {
                const file = new File([blob], "pasted-image.png", { type: blob.type });
                onImageUpload(file).then((url) => {
                  if (url && quillRef.current) {
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);
                    quill.deleteText((range?.index ?? 1) - 1, 1);
                    quill.insertEmbed(range?.index ?? 0, "image", url);
                  }
                });
              });
            return { ops: [] };
          }
          return delta;
        }],
      ],
    },
  }), []);

  // Handle raw image paste (image blobs from clipboard)
  useEffect(() => {
    const quill = (quillRef.current as any)?.getEditor?.();
    const root = quill?.root as HTMLElement | undefined;
    if (!quill || !root) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !onImageUpload) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          e.preventDefault();
          const file = new File([blob], "pasted-image.png", { type: blob.type });
          const url = await onImageUpload(file);
          if (url) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range?.index ?? 0, "image", url);
          }
        }
      }
    };

    root.addEventListener("paste", handlePaste as any);
    return () => root.removeEventListener("paste", handlePaste as any);
  }, [onImageUpload]);

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={{ height }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="h-full rounded-xl [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-10 [&_.ql-container]:h-[calc(100%-42px)] [&_.ql-container]:bg-card [&_.ql-toolbar]:bg-muted [&_.ql-container]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-editor]:text-white [&_.ql-editor]:min-h-[260px] [&_.ql-editor]:p-4 [&_.ql-editor.ql-blank::before]:text-muted-foreground"
      />
    </div>
  );
};
