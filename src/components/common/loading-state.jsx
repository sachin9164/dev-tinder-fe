export function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="rounded-2xl border border-white/60 bg-white/70 px-6 py-4 text-sm font-medium text-slate-600 shadow-sm">
        {text}
      </div>
    </div>
  );
}
