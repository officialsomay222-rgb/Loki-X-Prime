import { create } from 'zustand';
import { db } from '@/src/db';
import { type Task } from '../schemas/taskSchema';
import { toast } from 'sonner';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeStore: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,
  error: null,

  initializeStore: async () => {
    try {
      set({ isLoading: true, error: null });
      // Load all tasks from IndexedDB into memory
      const tasks = await db.tasks.orderBy('createdAt').reverse().toArray();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error("Failed to initialize tasks:", error);
      set({ error: 'Failed to load local data.', isLoading: false });
      toast.error('Failed to load your tasks.');
    }
  },

  addTask: async (title: string) => {
    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: Date.now(),
      };

      // 1. Persist to Dexie (The Memory)
      await db.tasks.add(newTask);

      // 2. Update Zustand (The UI)
      set((state) => ({ 
        tasks: [newTask, ...state.tasks] 
      }));
      
      toast.success('Task added securely to local storage.');
    } catch (error) {
      console.error("Failed to add task:", error);
      toast.error('Could not save the task.');
    }
  },

  toggleTask: async (id: string) => {
    try {
      const task = get().tasks.find(t => t.id === id);
      if (!task) return;

      const newStatus = !task.completed;

      // 1. Update Dexie
      await db.tasks.update(id, { completed: newStatus });

      // 2. Update Zustand
      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, completed: newStatus } : t
        )
      }));
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast.error('Failed to update task status.');
    }
  },

  deleteTask: async (id: string) => {
    try {
      await db.tasks.delete(id);
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
      toast.success('Task deleted.');
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error('Failed to delete task.');
    }
  }
}));
