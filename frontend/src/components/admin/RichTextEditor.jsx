import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import FileHandler from '@tiptap/extension-file-handler'
import Youtube from '@tiptap/extension-youtube'
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style'
import { FiBold, FiItalic, FiList, FiImage, FiHash, FiType, FiDroplet } from 'react-icons/fi'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const FONT_SIZES = [
  { label: 'Default', value: '' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
]

const PRESET_COLORS = [
  { name: 'Black', value: '#1e293b' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Purple', value: '#7c3aed' },
]

function Toolbar({ editor, onImageClick }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const onUpdate = () => setTick((t) => t + 1)
    editor.on('selectionUpdate', onUpdate)
    editor.on('transaction', onUpdate)
    return () => {
      editor.off('selectionUpdate', onUpdate)
      editor.off('transaction', onUpdate)
    }
  }, [editor])
  const currentColor = editor?.getAttributes('textStyle').color ?? ''
  const currentFontSize = editor?.getAttributes('textStyle').fontSize ?? ''

  if (!editor) return null
  return (
    <div className="flex flex-wrap gap-1 p-2 border border-slate-200 dark:border-slate-700 rounded-t-lg bg-slate-50 dark:bg-slate-800/50">
      {/* Font size */}
      <div className="flex items-center gap-0.5" title="Font size">
        <FiType className="text-slate-500 dark:text-slate-400 shrink-0" />
        <select
          value={currentFontSize}
          onChange={(e) => {
            const v = e.target.value
            if (v) editor.chain().focus().setFontSize(v).run()
            else editor.chain().focus().unsetFontSize().run()
          }}
          className="h-7 min-w-0 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs px-1.5 cursor-pointer"
          title="Font size"
        >
          {FONT_SIZES.map(({ label, value }) => (
            <option key={value || 'default'} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {/* Text color: presets + picker */}
      <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-600 pl-1" title="Text color">
        <FiDroplet className="text-slate-500 dark:text-slate-400 shrink-0" />
        {PRESET_COLORS.map(({ name, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => editor.chain().focus().setColor(value).run()}
            className={`w-5 h-5 rounded border shrink-0 ${
              currentColor === value
                ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500 border-slate-600'
                : 'border-slate-300 dark:border-slate-600 hover:opacity-80'
            }`}
            style={{ backgroundColor: value }}
            title={name}
          />
        ))}
        <div className="relative">
          <input
            type="color"
            value={currentColor && currentColor.startsWith('#') ? currentColor : '#1e293b'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
            title="Custom color"
          />
        </div>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="px-1.5 py-0.5 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Clear color"
        >
          Clear
        </button>
      </div>
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 shrink-0" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm flex items-center gap-1 text-slate-700 dark:text-slate-100 ${
          editor.isActive('bold')
            ? 'bg-slate-300 dark:bg-slate-600'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="Bold"
      >
        <FiBold />
        <span className="sr-only">Bold</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm flex items-center gap-1 text-slate-700 dark:text-slate-100 ${
          editor.isActive('italic')
            ? 'bg-slate-300 dark:bg-slate-600'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="Italic"
      >
        <FiItalic />
        <span className="sr-only">Italic</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm flex items-center gap-1 text-slate-700 dark:text-slate-100 ${
          editor.isActive('bulletList')
            ? 'bg-slate-300 dark:bg-slate-600'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="Bullet list"
      >
        <FiList />
        <span className="sr-only">Bullet list</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm flex items-center gap-1 text-slate-700 dark:text-slate-100 ${
          editor.isActive('orderedList')
            ? 'bg-slate-300 dark:bg-slate-600'
            : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        title="Numbered list"
      >
        <FiHash />
        <span className="sr-only">Numbered list</span>
      </button>
      <button
        type="button"
        onClick={onImageClick}
        className="px-2 py-1 rounded text-sm flex items-center gap-1 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
        title="Insert image"
      >
        <FiImage />
        <span className="sr-only">Image</span>
      </button>
    </div>
  )
}

export function RichTextEditor({ value = '', onChange, onUploadImage }) {
  const valueRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      Image,
      Link.configure({ openOnClick: false }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      FileHandler.configure({
        allowedMimeTypes: IMAGE_TYPES,
        onDrop: (editor, files, pos) => {
          handleFiles(editor, files, pos, onUploadImage)
        },
        onPaste: (editor, files) => {
          handleFiles(editor, files, null, onUploadImage)
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      valueRef.current = html
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] px-3 py-2 focus:outline-none text-slate-800 dark:text-slate-200 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== undefined && value !== valueRef.current) {
      valueRef.current = value
      editor.commands.setContent(value || '', false)
    }
  }, [editor, value])

  async function handleImageClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = IMAGE_TYPES.join(',')
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file || !onUploadImage) return
      try {
        const url = await onUploadImage(file)
        editor?.chain().focus().setImage({ src: url }).run()
      } catch (err) {
        console.error('Image upload failed:', err)
      }
    }
    input.click()
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <Toolbar editor={editor} onImageClick={handleImageClick} />
      <EditorContent editor={editor} />
    </div>
  )
}

async function handleFiles(editor, files, pos, onUploadImage) {
  if (!onUploadImage || !files?.length) return
  for (const file of files) {
    if (!IMAGE_TYPES.includes(file.type)) continue
    try {
      const url = await onUploadImage(file)
      if (pos != null) {
        editor.chain().focus().setTextSelection(pos).setImage({ src: url }).run()
      } else {
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (err) {
      console.error('Image upload failed:', err)
    }
  }
}
