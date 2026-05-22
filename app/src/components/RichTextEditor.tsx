import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Node } from '@tiptap/core';

const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  addAttributes: () => ({
    src: { default: null },
    width: { default: '100%' },
    height: { default: '360' },
    allowfullscreen: { default: true },
  }),
  parseHTML: () => [{ tag: 'iframe' }],
  renderHTML: ({ HTMLAttributes }) => ['div', { class: 'sakh-embed' }, ['iframe', HTMLAttributes]],
});

function ToolBtn({
  active, onClick, children, title,
}: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--accent-ocean)] text-white'
          : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: import('@tiptap/react').Editor }) {
  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };
  const addImage = () => {
    const src = window.prompt('URL изображения:');
    if (src) editor.chain().focus().setImage({ src }).run();
  };
  const addEmbed = () => {
    const src = window.prompt('URL видео (YouTube, Vimeo etc.):');
    if (src) editor.chain().focus().setIframe({ src }).run();
  };

  return (
    <div className="flex flex-wrap gap-0.5 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
      <ToolBtn title="Полужирный" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolBtn>
      <ToolBtn title="Курсив" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolBtn>
      <ToolBtn title="Подчёркнутый" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </ToolBtn>
      <ToolBtn title="Зачёркнутый" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </ToolBtn>

      <div className="w-px h-6 bg-[var(--border-color)] mx-1 self-center" />

      <ToolBtn title="Заголовок H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolBtn>
      <ToolBtn title="Заголовок H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolBtn>

      <div className="w-px h-6 bg-[var(--border-color)] mx-1 self-center" />

      <ToolBtn title="Маркированный список" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • Список
      </ToolBtn>
      <ToolBtn title="Нумерованный список" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. Список
      </ToolBtn>
      <ToolBtn title="Цитата" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        &ldquo; Цитата
      </ToolBtn>

      <div className="w-px h-6 bg-[var(--border-color)] mx-1 self-center" />

      <ToolBtn title="Ссылка" onClick={addLink}>
        🔗
      </ToolBtn>
      <ToolBtn title="Изображение" onClick={addImage}>
        🖼
      </ToolBtn>
      <ToolBtn title="Embed видео" onClick={addEmbed}>
        ▶
      </ToolBtn>

      <div className="w-px h-6 bg-[var(--border-color)] mx-1 self-center" />

      <ToolBtn title="Отменить" onClick={() => editor.chain().focus().undo().run()}>
        ↩
      </ToolBtn>
      <ToolBtn title="Повторить" onClick={() => editor.chain().focus().redo().run()}>
        ↪
      </ToolBtn>
    </div>
  );
}

interface Props {
  content?: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Начните писать статью…' }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      Iframe,
      Placeholder.configure({ placeholder }),
    ],
    content: content ?? undefined,
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none px-5 py-4 min-h-[320px] focus:outline-none text-[var(--text-primary)]',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-[var(--border-color)] overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
