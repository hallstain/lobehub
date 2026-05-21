import { type StateCreator } from 'zustand/vanilla';

import { type PublicState, type State } from './initialState';
import { initialState } from './initialState';

export interface Action {
  getJSONState: () => Record<string, any> | undefined;
  getMarkdownContent: () => string;
  handleSendButton: () => void;
  handleStop: () => void;
  setDocument: (type: string, content: any, options?: Record<string, unknown>) => void;
  setExpand: (expend: boolean) => void;
  setJSONState: (content: any) => void;
  setShowTypoBar: (show: boolean) => void;
  updateMarkdownContent: () => void;
}

export type Store = Action & State;

type CreateStore = (
  initState?: Partial<PublicState>,
) => StateCreator<Store, [['zustand/devtools', never]]>;

export const store: CreateStore = (publicState) => (set, get) => ({
  ...initialState,
  ...publicState,

  getJSONState: () => {
    const editor = get().editor;
    if (!editor) return undefined;
    try {
      return editor.getDocument('json') as Record<string, any> | undefined;
    } catch {
      // Editor exists but not fully initialized (root element not set)
      return undefined;
    }
  },
  getMarkdownContent: () => {
    const editor = get().editor;
    if (!editor) return '';
    try {
      return String(editor.getDocument('markdown') || '').trimEnd();
    } catch {
      // Editor exists but not fully initialized (root element not set)
      return '';
    }
  },
  handleSendButton: () => {
    const editor = get().editor;
    if (!editor) return;
    if (get().sendButtonProps?.disabled) return;

    get().onSend?.({
      clearContent: () => editor?.cleanDocument(),
      editor: editor!,
      getEditorData: get().getJSONState,
      getMarkdownContent: get().getMarkdownContent,
    });
    if (get().expand) {
      set({ _savedEditorState: undefined, expand: false });
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        editor.focus();
      });
    });
  },

  handleStop: () => {
    if (!get().editor) return;

    get().sendButtonProps?.onStop?.({ editor: get().editor! });
  },

  setDocument: (type, content, options) => {
    get().editor?.setDocument(type, content, options);
  },

  setExpand: (expand) => {
    const editor = get().editor;
    let _savedEditorState: Record<string, any> | undefined;
    if (editor) {
      try {
        // Additional safety check: ensure editor is fully initialized
        const lexicalEditor = editor.getLexicalEditor?.();
        if (lexicalEditor) {
          _savedEditorState = editor.getDocument('json') as Record<string, any> | undefined;
        }
      } catch {
        // Editor exists but not fully initialized (root element not set)
        _savedEditorState = undefined;
      }
    }
    set({ _savedEditorState, expand });
  },

  setJSONState: (content) => {
    get().editor?.setDocument('json', content);
  },

  setShowTypoBar: (showTypoBar) => {
    set({ showTypoBar });
  },

  updateMarkdownContent: () => {
    if (!get().onMarkdownContentChange) return;

    const content = get().getMarkdownContent();

    if (content === get().markdownContent) return;

    get().onMarkdownContentChange?.(content);

    set({ markdownContent: content });
  },
});
