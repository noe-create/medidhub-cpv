'use client';

import * as React from 'react';
import { PrescriptionDisplay } from '@/components/prescription-display';
import { MedicalReportDisplay } from '@/components/medical-report-display';
import { LabOrderDisplay } from '@/components/lab-order-display';
import { Button } from '@/components/ui/button';
import { Printer, FileText, FlaskConical, Pill } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FormatType = 'recipe' | 'informe' | 'laboratorio';

export default function FormatosBlancoPage() {
    const [selectedFormat, setSelectedFormat] = React.useState<FormatType>('recipe');
    const printRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const node = printRef.current;
        if (!node) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;

        const stylesheets = Array.from(document.styleSheets);
        stylesheets.forEach(styleSheet => {
            try {
                if (styleSheet.href) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    iframeDoc.head.appendChild(link);
                } else if (styleSheet.cssRules) {
                    const style = document.createElement('style');
                    style.textContent = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join(' ');
                    iframeDoc.head.appendChild(style);
                }
            } catch (e) {
                console.warn('Cross-origin stylesheet access denied.', e);
            }
        });

        const printStyles = `
        body { 
            margin: 0; 
            font-family: 'Figtree', sans-serif;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            background: white !important;
        }
        @page {
            size: letter ${selectedFormat === 'recipe' ? 'landscape' : 'portrait'};
            margin: ${selectedFormat === 'recipe' ? '0.5cm' : '1.5cm'};
        }
        `;
        const styleEl = iframeDoc.createElement('style');
        styleEl.innerHTML = printStyles;
        iframeDoc.head.appendChild(styleEl);

        const clonedNode = node.cloneNode(true) as HTMLElement;
        iframeDoc.body.innerHTML = '';
        iframeDoc.body.appendChild(clonedNode);

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            // Cleanup
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };

    return (
        <div className="flex flex-col h-[85vh] bg-slate-50/50 rounded-3xl shadow-sm border border-slate-200/60 overflow-y-auto w-full max-w-6xl mx-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        Formatos en Blanco
                    </h2>
                    <p className="text-slate-500 mt-1 text-lg">
                        Módulo de impresión para talonarios o formatos limpios para relleno a mano
                    </p>
                </div>
                <Button onClick={handlePrint} className="h-12 px-6 rounded-xl shadow-md text-md shadow-primary/20 transition-transform active:scale-95">
                    <Printer className="mr-2 h-5 w-5" />
                    Imprimir Formato
                </Button>
            </div>

            <div className="flex-1 p-8 flex flex-col xl:flex-row gap-8">
                {/* Formatting Selection Sidebar */}
                <div className="w-full xl:w-72 flex flex-col gap-3 shrink-0">
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm mb-2">Elegir Plantilla</h3>
                    <Button
                        variant={selectedFormat === 'recipe' ? 'default' : 'outline'}
                        className="w-full justify-start h-14"
                        onClick={() => setSelectedFormat('recipe')}
                    >
                        <Pill className="h-5 w-5 mr-3 opacity-70" />
                        Récipe Médico Doble
                    </Button>
                    <Button
                        variant={selectedFormat === 'informe' ? 'default' : 'outline'}
                        className="w-full justify-start h-14"
                        onClick={() => setSelectedFormat('informe')}
                    >
                        <FileText className="h-5 w-5 mr-3 opacity-70" />
                        Informe Médico
                    </Button>
                    <Button
                        variant={selectedFormat === 'laboratorio' ? 'default' : 'outline'}
                        className="w-full justify-start h-14"
                        onClick={() => setSelectedFormat('laboratorio')}
                    >
                        <FlaskConical className="h-5 w-5 mr-3 opacity-70" />
                        Orden de Laboratorio
                    </Button>
                </div>

                <Card className="flex-1 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="bg-white border-b border-slate-100 z-10 shrink-0">
                        <CardTitle>Vista Previa de Impresión</CardTitle>
                        <CardDescription>
                            Las áreas del paciente se mantendrán en blanco. {selectedFormat === 'recipe' && 'Se imprimen 2 récipes en formato Carta (Horizontal).'}
                            {selectedFormat !== 'recipe' && 'Se imprime en formato Carta (Vertical).'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="bg-slate-200/50 p-4 flex-1 flex justify-center items-center overflow-auto relative">
                        {/* Wrapper for the print preview scaling exactly like an A4/Letter size */}
                        <div className="relative shadow-2xl bg-white scale-[0.5] md:scale-[0.55] lg:scale-[0.6] origin-center transition-all flex items-center justify-center">
                            {selectedFormat === 'recipe' ? (
                                <div ref={printRef} className="w-[279.4mm] h-[215.9mm] overflow-hidden bg-white p-[0.5cm]">
                                    <PrescriptionDisplay />
                                </div>
                            ) : (
                                <div ref={printRef} className="w-[215.9mm] h-[279.4mm] overflow-hidden bg-white">
                                    {selectedFormat === 'informe' && <MedicalReportDisplay />}
                                    {selectedFormat === 'laboratorio' && <LabOrderDisplay />}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
