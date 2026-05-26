import { useState, useMemo, useRef, useEffect } from 'react';
import { useFinancial } from '../context/FinancialContext';
import type { TodoItem } from '../context/FinancialContext';

type FilterMode = 'all' | 'active' | 'completed';
type PriorityLevel = 'low' | 'medium' | 'high';

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; bg: string; border: string; icon: string }> = {
  high:   { label: 'HIGH',   color: 'text-[#f87171]', bg: 'bg-[#f87171]/15', border: 'border-[#f87171]/40', icon: 'priority_high' },
  medium: { label: 'MED',    color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/15', border: 'border-[#fbbf24]/40', icon: 'drag_handle' },
  low:    { label: 'LOW',    color: 'text-[#4ade80]', bg: 'bg-[#4ade80]/15', border: 'border-[#4ade80]/40', icon: 'arrow_downward' },
};

export default function DailyTodos() {
  const { state, addTodo, toggleTodo, removeTodo, updateTodo, clearCompletedTodos } = useFinancial();
  const todos: TodoItem[] = state.todos || [];

  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  // Today's date string for grouping
  const today = new Date().toISOString().split('T')[0];

  // Stats
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const activeCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Today's tasks
  const todayTodos = useMemo(() =>
    todos.filter(t => t.createdAt.split('T')[0] === today),
    [todos, today]
  );
  const todayCompleted = todayTodos.filter(t => t.completed).length;

  // Filtered list
  const filtered = useMemo(() => {
    let list = todos;
    if (filterMode === 'active') list = list.filter(t => !t.completed);
    if (filterMode === 'completed') list = list.filter(t => t.completed);
    // Sort: active first (high > med > low), then completed
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
  }, [todos, filterMode]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, TodoItem[]> = {};
    filtered.forEach(t => {
      const dateKey = t.createdAt.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addTodo(text, newPriority);
    setNewText('');
    setNewPriority('medium');
    setShowPriorityPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateTodo(editingId, { text: editText.trim() });
    }
    setEditingId(null);
    setEditText('');
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === today) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoStr: string) =>
    new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 md:pb-4">
        {/* Header */}
        <header className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-h1 text-h1 text-primary uppercase tracking-tight">Daily Tasks</h1>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {todayTodos.length} tasks today
            </p>
          </div>
          {completedCount > 0 && (
            <button
              onClick={clearCompletedTodos}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container-high hover:text-error hover:border-error/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-fluid-14">delete_sweep</span>
              Clear Done ({completedCount})
            </button>
          )}
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-surface-container border border-outline-variant rounded p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12 text-primary">task_alt</span> Today
            </div>
            <div className="font-mono-data text-lg font-bold text-on-surface">{todayTodos.length}</div>
            <div className="text-fluid-9 text-on-surface-variant">{todayCompleted} done</div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12 text-[#60a5fa]">pending_actions</span> Active
            </div>
            <div className="font-mono-data text-lg font-bold text-[#60a5fa]">{activeCount}</div>
            <div className="text-fluid-9 text-on-surface-variant">pending</div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12 text-[#4ade80]">check_circle</span> Done
            </div>
            <div className="font-mono-data text-lg font-bold text-[#4ade80]">{completedCount}</div>
            <div className="text-fluid-9 text-on-surface-variant">completed</div>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12 text-tertiary">speed</span> Rate
            </div>
            <div className="font-mono-data text-lg font-bold text-tertiary">{completionRate.toFixed(0)}%</div>
            <div className="h-1 bg-surface rounded-full overflow-hidden mt-1">
              <div className="h-full bg-tertiary rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'completed'] as FilterMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-fluid-11 uppercase font-mono tracking-wider border rounded transition-colors flex items-center gap-1.5 ${
                filterMode === mode
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-fluid-14">
                {mode === 'all' ? 'list' : mode === 'active' ? 'radio_button_unchecked' : 'check_circle'}
              </span>
              {mode}
              <span className="font-mono-data text-fluid-9 opacity-70">
                {mode === 'all' ? totalCount : mode === 'active' ? activeCount : completedCount}
              </span>
            </button>
          ))}
        </div>

        {/* Desktop-only input bar */}
        <div className="hidden md:flex mb-4 bg-surface-container border border-outline-variant rounded overflow-hidden">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-fluid-18">add_task</span>
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new task..."
              className="w-full bg-transparent pl-10 pr-3 py-3 text-sm font-mono text-on-surface placeholder:text-outline focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 px-2 border-l border-outline-variant">
            {(['low', 'medium', 'high'] as PriorityLevel[]).map(p => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded border transition-all ${
                    newPriority === p
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="px-5 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Add
          </button>
        </div>

        {/* Todo List */}
        {filtered.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant rounded p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">
              {filterMode === 'completed' ? 'task' : filterMode === 'active' ? 'check_circle' : 'playlist_add'}
            </span>
            <p className="text-on-surface-variant text-sm mb-1">
              {filterMode === 'completed'
                ? 'No completed tasks yet'
                : filterMode === 'active'
                ? 'All caught up! No pending tasks.'
                : 'Your task list is empty'}
            </p>
            <p className="text-on-surface-variant text-xs">
              {filterMode === 'all' ? 'Add your first task below to get started.' : 'Switch filters to see other tasks.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([dateKey, items]) => (
              <div key={dateKey} className="bg-surface-container border border-outline-variant rounded overflow-hidden">
                {/* Date Group Header */}
                <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-fluid-14">calendar_today</span>
                    <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">{formatDate(dateKey)}</span>
                  </div>
                  <span className="font-mono-data text-fluid-9 text-on-surface-variant">
                    {items.filter(t => t.completed).length}/{items.length} done
                  </span>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-outline-variant/30">
                  {items.map(todo => {
                    const pcfg = PRIORITY_CONFIG[todo.priority];
                    const isEditing = editingId === todo.id;

                    return (
                      <div
                        key={todo.id}
                        className={`flex items-start gap-3 px-3 py-2.5 group transition-all ${
                          todo.completed ? 'opacity-50' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            todo.completed
                              ? 'bg-[#4ade80] border-[#4ade80] text-surface'
                              : `border-outline hover:${pcfg.border.replace('border-', 'border-')}`
                          }`}
                        >
                          {todo.completed && (
                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                              className="w-full bg-surface border border-primary p-1 text-sm font-mono text-on-surface focus:outline-none rounded"
                            />
                          ) : (
                            <p
                              className={`text-sm font-mono cursor-pointer ${
                                todo.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                              }`}
                              onClick={() => !todo.completed && startEdit(todo)}
                            >
                              {todo.text}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${pcfg.bg} ${pcfg.color} font-bold`}>
                              {pcfg.label}
                            </span>
                            <span className="text-[9px] text-on-surface-variant font-mono">
                              {formatTime(todo.createdAt)}
                            </span>
                            {todo.completed && todo.completedAt && (
                              <span className="text-[9px] text-[#4ade80] font-mono flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">check</span>
                                {formatTime(todo.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!todo.completed && (
                            <button
                              onClick={() => {
                                const next: PriorityLevel = todo.priority === 'low' ? 'medium' : todo.priority === 'medium' ? 'high' : 'low';
                                updateTodo(todo.id, { priority: next });
                              }}
                              className={`p-1 rounded hover:bg-surface-container-high transition-colors ${pcfg.color}`}
                              title="Cycle priority"
                            >
                              <span className="material-symbols-outlined text-fluid-16">{pcfg.icon}</span>
                            </button>
                          )}
                          <button
                            onClick={() => removeTodo(todo.id)}
                            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                            title="Delete task"
                          >
                            <span className="material-symbols-outlined text-fluid-16">close</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile-only: Fixed bottom input bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-30 safe-area-bottom">
        <div className="flex items-center gap-2 p-3">
          {/* Priority picker toggle */}
          <button
            onClick={() => setShowPriorityPicker(!showPriorityPicker)}
            className={`p-2 rounded-lg border transition-all shrink-0 ${PRIORITY_CONFIG[newPriority].bg} ${PRIORITY_CONFIG[newPriority].color} ${PRIORITY_CONFIG[newPriority].border}`}
          >
            <span className="material-symbols-outlined text-fluid-18">{PRIORITY_CONFIG[newPriority].icon}</span>
          </button>

          {/* Input */}
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add task..."
            className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2.5 text-sm font-mono text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
          />

          {/* Submit */}
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="p-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span className="material-symbols-outlined text-fluid-20">send</span>
          </button>
        </div>

        {/* Priority picker (slides up) */}
        {showPriorityPicker && (
          <div className="flex gap-2 px-3 pb-3 animate-slide-up">
            {(['low', 'medium', 'high'] as PriorityLevel[]).map(p => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => { setNewPriority(p); setShowPriorityPicker(false); }}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                    newPriority === p
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-fluid-14">{cfg.icon}</span>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
