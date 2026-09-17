"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type L = { id: string; title: string; minutes: number; bodyHtml: string; isFreePreview: boolean; published: boolean };

export default function LessonEditor({ lesson }: { lesson: L }) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson.title);
  const [minutes, setMinutes] = useState(lesson.minutes);
  const [free, setFree] = useState(lesson.isFreePreview);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    ],
    content: lesson.bodyHtml || "<p></p>",
    immediatelyRender: false,
  });

  const save = async () => {
    setMsg(null);
    const bodyHtml = editor?.getHTML() ?? "";
    const empty = bodyHtml.replace(/<[^>]+>/g, "").trim() === "";
    const res = await fetch("/api/admin/content", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "update", kind: "lesson", id: lesson.id, fields: { title, minutes: empty ? 0 : Math.max(1, minutes), bodyHtml: empty ? "" : bodyHtml, isFreePreview: free } }),
    });
    setMsg(res.ok ? "Saved." : "Save failed — try again.");
    router.refresh();
  };

  const upload = async (file: File) => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const d = await res.json();
    if (d.url) editor?.chain().focus().setImage({ src: d.url }).run();
    else setMsg(d.error ?? "Upload failed.");
  };

  const Btn = ({ on, label, run }: { on?: boolean; label: string; run: () => void }) => (
    <button type="button" className={on ? "on" : ""} onClick={run}>{label}</button>
  );

  return (
    <div className="editor">
      <label className="flabel" htmlFor="lt">Title</label>
      <input id="lt" className="afield" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <span><label className="flabel" htmlFor="lm">Read time (min)</label>
          <input id="lm" className="afield" style={{ width: 110 }} type="number" min={0} value={minutes} onChange={(e) => setMinutes(+e.target.value || 0)} /></span>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: "var(--muted)", marginTop: 18 }}>
          <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> Free preview lesson
        </label>
      </div>
      {editor && (
        <div className="edtools" role="toolbar" aria-label="Formatting">
          <Btn on={editor.isActive("bold")} label="Bold" run={() => editor.chain().focus().toggleBold().run()} />
          <Btn on={editor.isActive("italic")} label="Italic" run={() => editor.chain().focus().toggleItalic().run()} />
          <Btn on={editor.isActive("heading", { level: 2 })} label="H2" run={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <Btn on={editor.isActive("heading", { level: 3 })} label="H3" run={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <Btn on={editor.isActive("bulletList")} label="• List" run={() => editor.chain().focus().toggleBulletList().run()} />
          <Btn on={editor.isActive("orderedList")} label="1. List" run={() => editor.chain().focus().toggleOrderedList().run()} />
          <Btn label="Image" run={() => fileRef.current?.click()} />
          <Btn label="Video" run={() => {
            const url = window.prompt("YouTube or Vimeo URL");
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }} />
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <EditorContent editor={editor} />
      <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <button className="abtn" onClick={save}>Save lesson</button>
        {msg && <span style={{ color: msg === "Saved." ? "var(--gain)" : "var(--risk)", fontSize: 14 }}>{msg}</span>}
      </div>
      <p className="sub" style={{ marginTop: 14, fontSize: 13 }}>
        A lesson with no content shows learners &ldquo;Content coming soon&rdquo;. Saved HTML is sanitised server-side;
        takeaways boxes from seeded lessons keep their styling.
      </p>
    </div>
  );
}
