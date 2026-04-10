import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskStore } from './taskStore';
import { db } from '@/src/db';
import { toast } from 'sonner';
import { type Task } from '../schemas/taskSchema';

// Mock the dependencies
vi.mock('@/src/db', () => ({
  db: {
    tasks: {
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
vi.stubGlobal('crypto', {
  randomUUID: () => mockUUID,
});

describe('useTaskStore', () => {
  beforeEach(() => {
    // Reset Zustand state
    useTaskStore.setState({ tasks: [], isLoading: true, error: null });
    // Clear all mock calls
    vi.clearAllMocks();
  });

  describe('initializeStore', () => {
    it('should successfully load tasks from local storage', async () => {
      const mockTasks: Task[] = [
        { id: '1', title: 'Task 1', completed: false, createdAt: 1000 },
        { id: '2', title: 'Task 2', completed: true, createdAt: 2000 },
      ];

      (db.tasks.toArray as any).mockResolvedValue(mockTasks);

      await useTaskStore.getState().initializeStore();

      const state = useTaskStore.getState();
      expect(state.tasks).toEqual(mockTasks);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      expect(db.tasks.orderBy).toHaveBeenCalledWith('createdAt');
      expect(db.tasks.reverse).toHaveBeenCalled();
      expect(db.tasks.toArray).toHaveBeenCalled();
    });

    it('should handle errors when loading tasks', async () => {
      (db.tasks.toArray as any).mockRejectedValue(new Error('DB Error'));

      await useTaskStore.getState().initializeStore();

      const state = useTaskStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to load local data.');
      expect(toast.error).toHaveBeenCalledWith('Failed to load your tasks.');
    });
  });

  describe('addTask', () => {
    it('should add a new task successfully', async () => {
      (db.tasks.add as any).mockResolvedValue(undefined);

      const title = 'New Task';
      await useTaskStore.getState().addTask(title);

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1);

      const addedTask = state.tasks[0];
      expect(addedTask.id).toBe(mockUUID);
      expect(addedTask.title).toBe(title);
      expect(addedTask.completed).toBe(false);
      expect(typeof addedTask.createdAt).toBe('number');

      expect(db.tasks.add).toHaveBeenCalledWith(addedTask);
      expect(toast.success).toHaveBeenCalledWith('Task added securely to local storage.');
    });

    it('should handle errors when adding a task', async () => {
      (db.tasks.add as any).mockRejectedValue(new Error('Add Error'));

      await useTaskStore.getState().addTask('Failing Task');

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(0); // State should not change if DB fails
      expect(toast.error).toHaveBeenCalledWith('Could not save the task.');
    });
  });

  describe('toggleTask', () => {
    it('should toggle a task successfully', async () => {
      const initialTask: Task = { id: '1', title: 'Task 1', completed: false, createdAt: 1000 };
      useTaskStore.setState({ tasks: [initialTask] });

      (db.tasks.update as any).mockResolvedValue(undefined);

      await useTaskStore.getState().toggleTask('1');

      const state = useTaskStore.getState();
      expect(state.tasks[0].completed).toBe(true);

      expect(db.tasks.update).toHaveBeenCalledWith('1', { completed: true });
    });

    it('should handle errors when toggling a task', async () => {
      const initialTask: Task = { id: '1', title: 'Task 1', completed: false, createdAt: 1000 };
      useTaskStore.setState({ tasks: [initialTask] });

      (db.tasks.update as any).mockRejectedValue(new Error('Update Error'));

      await useTaskStore.getState().toggleTask('1');

      const state = useTaskStore.getState();
      // Should not update state if DB fails
      expect(state.tasks[0].completed).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to update task status.');
    });

    it('should do nothing if task is not found', async () => {
      useTaskStore.setState({ tasks: [] });

      await useTaskStore.getState().toggleTask('1');

      expect(db.tasks.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const initialTask: Task = { id: '1', title: 'Task 1', completed: false, createdAt: 1000 };
      useTaskStore.setState({ tasks: [initialTask] });

      (db.tasks.delete as any).mockResolvedValue(undefined);

      await useTaskStore.getState().deleteTask('1');

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(0);

      expect(db.tasks.delete).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Task deleted.');
    });

    it('should handle errors when deleting a task', async () => {
      const initialTask: Task = { id: '1', title: 'Task 1', completed: false, createdAt: 1000 };
      useTaskStore.setState({ tasks: [initialTask] });

      (db.tasks.delete as any).mockRejectedValue(new Error('Delete Error'));

      await useTaskStore.getState().deleteTask('1');

      const state = useTaskStore.getState();
      expect(state.tasks).toHaveLength(1); // Should not change state if DB fails
      expect(toast.error).toHaveBeenCalledWith('Failed to delete task.');
    });
  });
});
