import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style'
import { ImageResize } from 'tiptap-extension-resize-image'
import { useEffect, useRef, useState } from 'react'
import api from '../api/client'


// ── Styles ────────────────────────────────────────────────────────────────────

const btnCls = (active: boolean) =>
  `w-8 h-8 rounded-md flex items-center justify-center border-none cursor-pointer transition text-sm
   ${active ? 'bg-blue-100 text-blue-700' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`

const btnWide = (active: boolean) =>
  `px-2 h-8 rounded-md text-[12px] font-bold border-none cursor-pointer transition
   ${active ? 'bg-blue-100 text-blue-700' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5" />

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Serif',   value: 'Georgia, serif' },
  { label: 'Mono',    value: 'monospace' },
  { label: 'Khmer',   value: '"Khmer OS", "Khmer OS System", sans-serif' },
  { label: 'Arial',   value: 'Arial, sans-serif' },
  { label: 'Times',   value: '"Times New Roman", Times, serif' },
]

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']

// ── Image Upload ──────────────────────────────────────────────────────────────

interface ImageUploadButtonProps {
  editor: ReturnType<typeof useEditor>
  uploadFolder: string
}

function ImageUploadButton({ editor, uploadFolder }: ImageUploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !editor) return

    setProgress(`0/${files.length}`)
    const urls: string[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const fd = new FormData()
        fd.append('file', files[i])
        const res = await api.post<{ data: { url: string } }>(
          `/admin/upload?folder=${uploadFolder}`, fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        urls.push(res.data.data.url)
      } catch (err: unknown) {
        errors.push(`${files[i].name}: ${err instanceof Error ? err.message : 'failed'}`)
      }
      setProgress(`${i + 1}/${files.length}`)
    }

    if (urls.length) {
      const html = urls.map((src) => `<p><img src="${src}"></p>`).join('')
      editor.chain().focus().insertContent(html).run()
    }
    if (errors.length) alert(errors.join('\n'))
    setProgress(null)
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={progress !== null}
        title="Insert images (select multiple)"
        className={`${btnCls(false)} disabled:opacity-40 w-auto px-2 gap-1 text-[12px] font-medium`}
      >
        {progress !== null ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {progress}
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
            </svg>
            Images
          </>
        )}
      </button>
    </>
  )
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>
  uploadFolder: string
}

function Toolbar({ editor, uploadFolder }: ToolbarProps) {
  if (!editor) return null

  const currentFont = FONT_FAMILIES.find(
    (f) => f.value && editor.isActive('textStyle', { fontFamily: f.value })
  )?.value ?? ''

  const currentSize = FONT_SIZES.find(
    (s) => editor.isActive('textStyle', { fontSize: s })
  ) ?? ''

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">

      {/* Font Family */}
      <select
        value={currentFont}
        onChange={(e) => {
          if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run()
          else editor.chain().focus().unsetFontFamily().run()
        }}
        title="Font family"
        className="h-8 px-2 text-[12px] text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer outline-none focus:border-blue-400"
        style={{ fontFamily: currentFont || 'inherit' }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value || 'inherit' }}>{f.label}</option>
        ))}
      </select>

      {/* Font Size */}
      <select
        value={currentSize}
        onChange={(e) => {
          if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run()
          else editor.chain().focus().unsetFontSize().run()
        }}
        title="Font size"
        className="h-8 w-20 px-2 text-[12px] text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer outline-none focus:border-blue-400"
      >
        <option value="">Size</option>
        {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <Divider />

      {/* Text style */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnCls(editor.isActive('bold'))} font-bold`} title="Bold">B</button>

      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btnCls(editor.isActive('italic'))} italic`} title="Italic">I</button>

      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${btnCls(editor.isActive('strike'))} line-through`} title="Strikethrough">S</button>

      <Divider />

      {/* Headings */}
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnWide(editor.isActive('heading', { level: 1 }))}>H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnWide(editor.isActive('heading', { level: 2 }))}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnWide(editor.isActive('heading', { level: 3 }))}>H3</button>

      <Divider />

      {/* Lists */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnCls(editor.isActive('bulletList'))} title="Bullet list">•≡</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnCls(editor.isActive('orderedList'))} title="Ordered list">1≡</button>

      <Divider />

      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnCls(editor.isActive('blockquote'))} title="Blockquote">❝</button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnCls(false)} title="Horizontal rule">—</button>

      <Divider />

      <ImageUploadButton editor={editor} uploadFolder={uploadFolder} />

      <Divider />

      <button type="button" onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${btnCls(false)} disabled:opacity-30`} title="Undo">↩</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${btnCls(false)} disabled:opacity-30`} title="Redo">↪</button>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  editorKey?: string | number
  uploadFolder?: string
}

export default function RichTextEditor({ value, onChange, placeholder, editorKey, uploadFolder = 'articles' }: Props) {
  const skipSync = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Write something…' }),
      ImageResize.configure({ inline: false, allowBase64: false }),
      TextStyle,
      FontFamily,
      FontSize,
    ],
    content: value || '',
    onUpdate({ editor }) {
      if (!skipSync.current) onChange(editor.getHTML())
    },
  })

  // Sync external value (copy KH↔EN, handleEdit)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      skipSync.current = true
      editor.commands.setContent(value || '')
      setTimeout(() => { skipSync.current = false }, 0)
    }
  }, [value, editorKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const wordCount = editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="space-y-2">
      {/* Editor box */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <Toolbar editor={editor} uploadFolder={uploadFolder} />
        <EditorContent
          editor={editor}
          className="min-h-[300px] px-6 py-5 prose prose-sm max-w-none focus:outline-none text-gray-800
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold
            [&_.ProseMirror_h2]:text-xl  [&_.ProseMirror_h2]:font-bold
            [&_.ProseMirror_h3]:text-lg  [&_.ProseMirror_h3]:font-bold
            [&_.ProseMirror_p]:mb-3
            [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-blue-400
            [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-gray-500
            [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:my-2
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-300
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
        <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100 bg-gray-50 text-[11.5px] text-gray-400">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>Rich Text Editor</span>
        </div>
      </div>

    </div>
  )
}
