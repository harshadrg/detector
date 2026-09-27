import { ShieldCheck, Activity, Layers, Database } from 'lucide-react';

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Detector Enterprise Platform
            </h1>
            <p className="text-xs text-slate-400">
              High-performance npm monorepo architecture
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-800 rounded-xl text-sm">
            <div className="flex items-center space-x-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-300">Client Workspace</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Vite 8 • React 19
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-800 rounded-xl text-sm">
            <div className="flex items-center space-x-3">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-slate-300">Server Workspace</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Express 5 • Node 24
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-800 rounded-xl text-sm">
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-slate-300">Validation & Schema</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Unified Zod 4
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Workspace dependencies verified and deduplicated across the monorepo.
        </p>
      </div>
    </main>
  );
}
