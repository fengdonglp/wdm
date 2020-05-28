import md5 from 'blueimp-md5';
import { isObject } from './utils';
import EventEmitter from './EventEmitter';

type ValueOf<T> = T[keyof T];
type Metadata = any;

export interface TaskOption {
  id?: string,
  // 任务执行间隔
  interval?: number,

  // 延迟执行时间
  delay?: number,

  immediate?: boolean;

  // 任务元数据信息，用于判断任务是否是唯一
  metadata: Metadata,

  // 任务执行函数
  fn(next: Function, end: Function): any,

  // 任务回调
  callback?: Array<(ctx: Task, ...args: any[]) => any>
}

/**
 * @description 立即执行任务类
 * @export
 * @class Task
 * @extends {EventEmitter}
 */
export class Task extends EventEmitter {
  // 任务id
  id: string;

  options: TaskOption;

  static createTaskID(metadata: Metadata): string {
    metadata = isObject(metadata) ? JSON.stringify(metadata) : metadata.toString();
    return md5(metadata);
  }

  constructor(options: TaskOption) {
    super();
    this.options = options;
    this.id = this.createId();
    options.id = this.id;
    if (this.options.callback) {
      this.options.callback.forEach(cb => {
        this.on('task_end', (data: any) => {
          cb(this, data);
        });
      })
    }
  }

  createId(): string {
    return Task.createTaskID(this.options.metadata);
  }

  // 作为执行函数的参数，用于确定当前任务结束（循环时使用）
  // eslint-disable-next-line 
  next(): void {}

  // 作为执行函数的参数，用于确定任务可以结束
  end(data: any): void {
    this.emit('task_end', data);
  }

  execute(): any {
    return this.options.fn(this.next.bind(this), this.end.bind(this));
  }

  start(): void {
    this.execute();
  }

  addEndCallback(cb: Function): void {
    this.on('task_end', cb);
  }

  abort(): void {
    this.emit('task_abort');
  }
}

/**
 * @description 延迟执行任务类
 * @export
 * @class DeferredTask
 * @extends {Task}
 */
export class DeferredTask extends Task {
  timer: number | undefined;

  start(): void {
    this.timer = window.setTimeout(() => {
      this.execute();
    }, this.options.delay || 0);
  }

  abort(): void {
    window.clearTimeout(this.timer);
    this.timer = undefined;
    super.abort();
  }
}

/**
 * @description 定时执行任务类
 * @export
 * @class PersistentTask
 * @extends {Task}
 * 
 * TODO 存在问题，如果异步任务正在执行过程中，则task执行函数需自行提供中断操作，不然类的中断操作只是中断了定时器
 */
export class PersistentTask extends Task {
  timer: number | undefined;

  first: boolean;

  constructor(options: TaskOption) {
    super(options);
    this.first = true;
  }

  next(): void {
    this.start();
  }

  start(): void {
    if (this.options.immediate && this.first) {
      this.first = false;
      this.execute();
      return;
    }
    this.timer = window.setTimeout(() => {
      this.execute();
    }, this.options.interval || 5000);
  }

  abort(): void {
    window.clearTimeout(this.timer);
    this.timer = undefined;
    super.abort();
  }
}
