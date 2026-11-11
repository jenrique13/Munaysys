import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Configure Quill to use inline styles instead of classes for attributes
// This ensures that formatting (like justification) persists in the PDF generator
const AlignStyle = Quill.import('attributors/style/align') as any;
Quill.register(AlignStyle, true);
const SizeStyle = Quill.import('attributors/style/size') as any;
Quill.register(SizeStyle, true);
const FontStyle = Quill.import('attributors/style/font') as any;
Quill.register(FontStyle, true);

// Custom Page Break Blot
const Embed = Quill.import('blots/embed') as any;
class PageBreakBlot extends Embed {
    static blotName = 'pagebreak';
    static tagName = 'div';
    static className = 'html2pdf__page-break';
    static create() {
        const node = super.create();
        node.setAttribute('class', 'html2pdf__page-break');
        // Visual indicator in the editor
        const hr = document.createElement('hr');
        hr.className = 'editor-page-break-line';
        node.appendChild(hr);
        return node;
    }
    static value() { return true; }
}
Quill.register(PageBreakBlot as any);

interface QuillEditorProps {
    value?: string;
    onChange?: (content: string) => void;
    className?: string;
    placeholder?: string;
    modules?: any;
    theme?: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
    value = '',
    onChange,
    className = '',
    placeholder = 'Escribe aquí...',
    modules,
    theme = 'snow'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const isUpdatingRef = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Quill
        const quill = new Quill(containerRef.current, {
            theme,
            placeholder,
            modules: modules || {
                toolbar: {
                    container: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['pagebreak'], // Custom button
                        ['clean'],
                        ['link']
                    ],
                    handlers: {
                        'pagebreak': function() {
                            const range = quill.getSelection();
                            if (range) {
                                quill.insertEmbed(range.index, 'pagebreak', true, 'user');
                                quill.setSelection(range.index + 1, 'api');
                            }
                        }
                    }
                }
            },
        });

        // Add custom icon/text for pagebreak button
        const pagebreakButton = document.querySelector('.ql-pagebreak');
        if (pagebreakButton) {
            pagebreakButton.innerHTML = '<svg viewbox="0 0 24 24" style="width:18px;height:18px;"><path fill="currentColor" d="M3,11H21V13H3M3,18H21V20H3M3,3H21V5H3M3,6H21V8H3Z" /></svg>';
            pagebreakButton.setAttribute('title', 'Insertar Salto de Página');
        }

        quillRef.current = quill;

        // Initial content
        if (value) {
            quill.clipboard.dangerouslyPasteHTML(value);
        }

        // Handle changes
        quill.on('text-change', () => {
            if (!isUpdatingRef.current) {
                const html = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
                onChange?.(html);
            }
        });

        return () => {
            quillRef.current = null;
        };
    }, []);

    // Handle external value changes (sync React -> Quill)
    useEffect(() => {
        if (quillRef.current && value !== undefined) {
            const currentHTML = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
            if (value !== currentHTML) {
                isUpdatingRef.current = true;
                const selection = quillRef.current.getSelection();
                quillRef.current.clipboard.dangerouslyPasteHTML(value);
                if (selection) {
                    quillRef.current.setSelection(selection);
                }
                isUpdatingRef.current = false;
            }
        }
    }, [value]);

    return (
        <div className={`quill-editor-wrapper ${className}`}>
            <style>{`
                /* Sync with MembershipsPage.tsx CONTRACT_CSS */
                .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                    font-size: 11pt !important;
                    line-height: 1.5 !important;
                    color: #000 !important;
                    padding: 30mm 20mm 20mm 30mm !important; /* Margins Top Right Bottom Left */
                    min-height: 297mm;
                    width: 210mm; /* A4 Width */
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    box-sizing: border-box; /* Crucial: padding is inside the 210mm */
                }
                .ql-container.ql-snow {
                    border: none;
                    background: #f1f5f9; /* Outer canvas gray */
                    padding: 20px 0;
                }
                .ql-toolbar.ql-snow {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px 8px 0 0;
                    background: white;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .quill-editor-wrapper {
                   border: 1px solid #e2e8f0;
                   border-radius: 8px;
                   overflow: hidden;
                }
                
                /* Page Break Indicator */
                .editor-page-break-line {
                    border: none;
                    border-top: 2px dashed #f43f5e;
                    margin: 20px 0;
                    position: relative;
                }
                .editor-page-break-line::after {
                    content: 'SALTO DE PÁGINA (PÁGINA SIGUIENTE EN PDF)';
                    position: absolute;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #fff1f2;
                    color: #f43f5e;
                    font-size: 10px;
                    font-weight: bold;
                    padding: 0 8px;
                    border: 1px solid #fecdd3;
                    border-radius: 4px;
                }
            `}</style>
            <div ref={containerRef} className="contract-document" />
        </div>
    );
};

export default QuillEditor;
