/* eslint-disable no-useless-computed-key */
import { TaskOption, Task, DeferredTask, PersistentTask } from './Tasks';

export interface TMOptions extends TaskOption {
  // 任务类型
  type: number,

  deleteWhenEnd?: boolean
}

const TASK_CLASS: {[k: number]: any} = {
  [0]: Task,
  [1]: DeferredTask,
  [2]: PersistentTask
}

export default class TaskManager {
  tasks: Map<string, Task>;

  constructor() {
    this.tasks = new Map();
  }

  add(taskOptions: TMOptions, notImmediate = false): {succeed: boolean, task: Task} {
    const id = Task.createTaskID(taskOptions.metadata);
    const oldTask: Task | undefined = this.tasks.get(id);
    if (oldTask) {
      return {
        succeed: false,
        task: oldTask
      };
    }

    const {type, deleteWhenEnd} = taskOptions;
    const TaskClass = type in TASK_CLASS
      ? TASK_CLASS[type]
      : TASK_CLASS[0];

    const task = new TaskClass(taskOptions);

    if (deleteWhenEnd) {
      const delCallback = this.delete.bind(this, task.id);
      task.addEndCallback(delCallback);
    }

    this.tasks.set(task.id, task);

    if (!notImmediate) {
      task.start();
    }

    return {
      succeed: true,
      task
    };
  }

  delete(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.abort();
    this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.forEach(task => {
      task.abort();
    });
    this.tasks.clear();
  }
}