import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TaskWidget: React.FC = () => {
  const { tasks, isLoading, error, initializeStore, addTask, toggleTask, deleteTask } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <CheckCircle2 className="text-cyan-400" />
        Task List
      </h2>

      <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-center py-4">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-slate-500 text-center py-8 italic">No tasks yet. Add one above!</div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  task.completed 
                    ? 'bg-slate-800/50 border-slate-800/50 opacity-60' 
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`shrink-0 transition-colors ${task.completed ? 'text-cyan-500' : 'text-slate-400 hover:text-cyan-400'}`}
                >
                  {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                
                <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {task.title}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="shrink-0 text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
