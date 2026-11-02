import React from 'react';
import { calculateSheetNesting, STANDARD_SHEETS } from '../utils/calculator';
import { Layers, Maximize2 } from 'lucide-react';

interface SheetImpositionViewerProps {
  itemWidthMm: number;
  itemHeightMm: number;
  sheetFormat: 'SRA3' | 'A3' | 'A4' | 'Bobina_m2';
  quantity: number;
}

export const SheetImpositionViewer: React.FC<SheetImpositionViewerProps> = ({
  itemWidthMm,
  itemHeightMm,
  sheetFormat,
  quantity,
}) => {
  if (sheetFormat === 'Bobina_m2') {
    const areaM2 = ((itemWidthMm * itemHeightMm) / 1000000) * quantity;
    const perimeterM = (((itemWidthMm + itemHeightMm) * 2) / 1000) * quantity;

    return (
      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold tracking-wide">
              Plotter de Grandes Formatos (Comunicação Visual)
            </h4>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
            Bobina Contínua
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Área Total</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {areaM2.toFixed(2)} m²
            </div>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Dimensões Unidade</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {itemWidthMm} × {itemHeightMm} mm
            </div>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-slate-400">Perímetro p/ Ilhós/Bainha</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {perimeterM.toFixed(1)} m linear
            </div>
          </div>
        </div>

        {/* Visual representation of roll */}
        <div className="relative h-28 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center p-3">
          <div className="w-full h-16 border-2 border-dashed border-amber-500/60 rounded bg-amber-500/10 flex items-center justify-center text-xs font-mono text-amber-300">
            Largura Útil: 1.600 mm | Mídia Solvente Contínua ({quantity} cópias)
          </div>
        </div>
      </div>
    );
  }

  const nesting = calculateSheetNesting(itemWidthMm, itemHeightMm, sheetFormat);
  const sheet = STANDARD_SHEETS[sheetFormat] || STANDARD_SHEETS.SRA3;
  const sheetsNeeded = Math.ceil(quantity / nesting.itemsPerSheet);

  // SVG Scaling to fit standard preview box
  const previewMaxW = 280;
  const previewMaxH = 200;
  const scale = Math.min(previewMaxW / sheet.widthMm, previewMaxH / sheet.heightMm);
  const svgW = sheet.widthMm * scale;
  const svgH = sheet.heightMm * scale;

  const itemW = nesting.layoutVisual.itemW * scale;
  const itemH = nesting.layoutVisual.itemH * scale;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold tracking-wide">
            Aproveitamento & Imposição de Folha ({sheet.name})
          </h4>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          {nesting.itemsPerSheet} unid / folha
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Sheet Render */}
        <div className="relative flex items-center justify-center bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner shrink-0">
          <svg
            width={svgW}
            height={svgH}
            className="border border-slate-700 bg-white/5 rounded-sm shadow-sm"
          >
            {/* Sheet Margin Printable Area */}
            <rect
              x={(sheet.widthMm - sheet.printableWidthMm) * 0.5 * scale}
              y={(sheet.heightMm - sheet.printableHeightMm) * 0.5 * scale}
              width={sheet.printableWidthMm * scale}
              height={sheet.printableHeightMm * scale}
              fill="none"
              stroke="#475569"
              strokeDasharray="2,2"
              strokeWidth="0.8"
            />

            {/* Imposition Grid */}
            {Array.from({ length: nesting.rows }).map((_, r) =>
              Array.from({ length: nesting.cols }).map((__, c) => {
                const x =
                  (sheet.widthMm - sheet.printableWidthMm) * 0.5 * scale + c * itemW + 1;
                const y =
                  (sheet.heightMm - sheet.printableHeightMm) * 0.5 * scale + r * itemH + 1;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={x}
                    y={y}
                    width={Math.max(2, itemW - 1.5)}
                    height={Math.max(2, itemH - 1.5)}
                    fill="#f59e0b"
                    fillOpacity="0.25"
                    stroke="#fbbf24"
                    strokeWidth="0.8"
                    rx="1"
                  />
                );
              })
            )}
          </svg>
        </div>

        {/* Technical Data breakdown */}
        <div className="flex-1 grid grid-cols-2 gap-3 w-full">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Rendimento por Folha</div>
            <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
              {nesting.itemsPerSheet} unidades
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Grade {nesting.cols} col × {nesting.rows} lin ({nesting.orientation})
            </div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Folhas Brutas Necessárias</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {sheetsNeeded} folhas
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              + ~5% quebra de acerto
            </div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Área de Corte</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {itemWidthMm} × {itemHeightMm} mm
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">+ 2mm sangria técnica</div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Refile Técnico / Perda</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {nesting.wastePercent}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Aproveitamento otimizado</div>
          </div>
        </div>
      </div>
    </div>
  );
};
