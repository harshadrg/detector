import { ShieldCheck, Layers, Cpu, CheckCircle2 } from 'lucide-react';

export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Detector Enterprise Platform
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Modular Air-Gapped Internal Platform
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Phase 0 Initialized
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Core platform shell initialized and ready for modular integration.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100 text-slate-700">
            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="block font-semibold text-slate-800">Core Engine</span>
              <span className="text-[11px] text-slate-500">Identity & RBAC/ABAC</span>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100 text-slate-700">
            <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="block font-semibold text-slate-800">BPMS Module</span>
              <span className="text-[11px] text-slate-500">Host Architecture Ready</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Detector Monorepo Baseline</span>
          <span className="font-mono">React 19 • Vite 8 • Tailwind v4</span>
        </div>
      </div>
    </main>
  );
}
