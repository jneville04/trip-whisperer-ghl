import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect, useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  Heading2,
  Palette,
} from "lucide-react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ content, onChange, placeholder, minHeight = "120px" }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorHex, setColorHex] = useState("#000000");
  const colorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ] as any,
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none font-body text-foreground`,
        style: `min-height: ${minHeight}; padding: 0.5rem`,
      },
    },
  });

  // Sync external content changes (but avoid cursor jumps)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content]);

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!editor) return null;

  const currentColor = editor.getAttributes("textStyle")?.color || "";

  const ToolBtn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {children}
    </button>
  );

  const PRESET_COLORS = [
    "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308",
    "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280",
  ];

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden" style={{ resize: "vertical", overflow: "auto", minHeight: minHeight }}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/50 bg-muted/30 flex-wrap sticky top-0 z-10">
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => (editor.chain().focus() as any).toggleUnderline().run()} title="Underline (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("highlight")} onClick={() => (editor.chain().focus() as any).toggleHighlight().run()} title="Highlight">
          <Highlighter className="h-3.5 w-3.5" />
        </ToolBtn>

        {/* Font Color */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Font Color"
            className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
              showColorPicker ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span className="w-3 h-1.5 rounded-sm block" style={{ backgroundColor: currentColor || "#000" }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg p-2 z-50 w-48">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded border transition-all ${currentColor === c ? "ring-2 ring-primary ring-offset-1" : "border-border/50 hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      (editor.chain().focus() as any).setColor(c).run();
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5 items-center border-t border-border/50 pt-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-7 h-7 rounded border border-input cursor-pointer"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => {
                    const v = e.target.value;
                    setColorHex(v);
                  }}
                  placeholder="#000000"
                  className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2 font-mono"
                  maxLength={7}
                />
                <button
                  type="button"
                  className="h-7 px-2 text-xs font-body bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  onClick={() => {
                    (editor.chain().focus() as any).setColor(colorHex).run();
                    setShowColorPicker(false);
                  }}
                >
                  Apply
                </button>
              </div>
              <button
                type="button"
                className="w-full mt-1.5 text-xs text-muted-foreground hover:text-foreground py-1"
                onClick={() => {
                  (editor.chain().focus() as any).unsetColor().run();
                  setShowColorPicker(false);
                }}
              >
                Remove color
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => (editor.chain().focus() as any).setTextAlign("left").run()} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => (editor.chain().focus() as any).setTextAlign("center").run()} title="Align Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <ToolBtn
          active={editor.isActive("link")}
          onClick={() => {
            if (editor.isActive("link")) {
              (editor.chain().focus() as any).unsetLink().run();
            } else {
              const url = window.prompt("URL:");
              if (url) (editor.chain().focus() as any).setLink({ href: url }).run();
            }
          }}
          title="Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Resize handle hint */}
      <div className="h-1.5 bg-muted/20 border-t border-border/30 cursor-ns-resize flex items-center justify-center">
        <div className="w-8 h-0.5 rounded-full bg-border/50" />
      </div>

      {/* Placeholder styling */}
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: '${placeholder || "Start typing..."}';
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap mark {
          background-color: hsl(var(--accent) / 0.3);
          padding: 0.1em 0.2em;
          border-radius: 0.2em;
        }
        .tiptap a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .tiptap {
          padding: 0.75rem;
          min-height: ${minHeight};
        }
      `}</style>
    </div>
  );
}
