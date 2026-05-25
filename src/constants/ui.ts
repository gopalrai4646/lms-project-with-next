export const TYPOGRAPHY = {
  display: 'text-3xl md:text-4xl font-semibold tracking-tight text-slate-900',
  h1: 'text-2xl font-semibold text-slate-900 tracking-tight',
  h2: 'text-lg md:text-xl font-semibold text-slate-900',
  h3: 'text-base font-semibold text-slate-900',
  body: 'text-sm text-slate-600 leading-relaxed',
  label: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
  metric: 'text-2xl md:text-3xl font-semibold text-slate-900',
};

export const UI_COMPONENTS = {
  pageContainer: 'space-y-6 pb-8 bg-background min-h-screen p-4 max-w-7xl mx-auto',
  card: 'bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col',
  cardInteractive: 'bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:shadow-md hover:border-slate-300 transition-all cursor-pointer',
  cardHeader: 'flex justify-between items-center mb-6 border-b border-slate-100 pb-4',
  input: 'w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all',
  badge: 'flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-600 text-xs font-medium shadow-sm',
  listRow: 'flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors',
  progressTrack: 'w-full h-1.5 bg-slate-100 rounded-full overflow-hidden',
  progressFill: 'h-full bg-primary-600 rounded-full transition-all duration-500 ease-out',
  segmentedControl: 'flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50',
  segmentedItem: 'px-3 py-1.5 text-xs font-medium rounded-md transition-all text-slate-500 hover:text-slate-700',
  segmentedItemActive: 'px-3 py-1.5 text-xs font-medium rounded-md transition-all bg-white text-slate-900 shadow-sm',
};

export const BUTTONS = {
  primary: 'flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'flex items-center justify-center gap-2 px-3 py-1.5 bg-transparent text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors',
  danger: 'flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors',
  tint: 'flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
};
