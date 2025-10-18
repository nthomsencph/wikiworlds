"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import Typography from "@tiptap/extension-typography"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { useEffect } from "react"
import "./editor.css"

interface SimpleEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
}

export default function SimpleEditor({
    content,
    onChange,
    editable = true,
}: SimpleEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: "Start writing your entry...",
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Underline,
            Highlight.configure({
                multicolor: true,
            }),
            Typography,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Image.configure({
                inline: true,
                allowBase64: false,
                HTMLAttributes: {
                    class: "rounded-lg",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-400 hover:text-blue-300 underline",
                },
            }),
        ],
        content: content || "",
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            onChange(html)
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none",
            },
        },
    })

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || "")
        }
    }, [content, editor])

    return (
        <div className="simple-editor">
            <EditorContent editor={editor} />
        </div>
    )
}

