import React from 'react';
import Editor from 'react-simple-code-editor';
// @ts-ignore
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
export default function CodeEditor(props: { className?: string, value: string, setValue: (value: string) => any }) {
    return (
        <Editor
            dir='auto'
            className="plug-tg-h-full plug-tg-w-full"
            value={props.value}
            onValueChange={(code: any) => props.setValue(code)}
            highlight={code => highlight(code, languages.js)}
            padding={10}
            style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 12,
            }}
        />
    );
}