import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Check, 
  Sparkles, 
  Share2, 
  Eye,
  FileImage
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadCanvas } from '../utils/canvasRenderer';

interface ExportModalProps {
  canvas: HTMLCanvasElement;
  layoutName: string;
  dpi: number;
  widthInches: number;
  heightInches: number;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  canvas,
  layoutName,
  dpi,
  widthInches,
  heightInches,
  onClose,
}) => {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
  const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);

  const handleDownload = (format: 'png' | 'jpeg') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Lensbooth-${layoutName.replace(/\s+/g, '-')}-${timestamp}.${format}`;
    downloadCanvas(canvas, filename, format);

    setDownloadedFormat(format);
    // Fire celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF6B8B', '#FFD1DC', '#65B741', '#4A90E2', '#FFE5CA']
      });
    } catch {
      // Safe fallback
    }

    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Photo Strip - Lensbooth</title>
          <style>
            @page {
              size: ${widthInches}in ${heightInches}in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
            }
            img {
              max-width: 100vw;
              max-height: 100vh;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm md:text-base">
                Your Photobooth Strip is Ready!
              </h3>
              <p className="text-xs text-zinc-500">
                Rendered at 300 DPI Print Quality ({canvas.width} × {canvas.height} px)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col items-center">
          <div className="max-h-[380px] p-2 bg-zinc-100 rounded-2xl shadow-inner border border-zinc-200/60 flex items-center justify-center">
            <img
              src={previewDataUrl}
              alt="Strip High Resolution Render"
              className="max-h-[350px] object-contain rounded-lg shadow-md"
            />
          </div>

          {/* Print specs chip */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono">
            <span className="bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
              Format: {widthInches}" × {heightInches}"
            </span>
            <span className="bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
              Resolution: {dpi} DPI Print-Ready
            </span>
            <span className="bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
              Zero Watermarks
            </span>
          </div>

          {/* Action Download Buttons */}
          <div className="w-full space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition active:scale-98"
              >
                {downloadedFormat === 'png' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved PNG!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PNG (Lossless)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload('jpeg')}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs shadow-md transition active:scale-98"
              >
                {downloadedFormat === 'jpeg' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved JPEG!</span>
                  </>
                ) : (
                  <>
                    <FileImage className="w-4 h-4" />
                    <span>Download JPEG (98%)</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs border border-zinc-200 shadow-xs transition active:scale-98"
            >
              <Printer className="w-4 h-4 text-zinc-500" />
              <span>Print Directly on Photo Paper</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center text-xs text-zinc-400">
          <span>Lensbooth Studio • Share with friends</span>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
