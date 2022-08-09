import { Task, TaskStatus } from '@lit-labs/task';
import { ReactiveControllerHost } from 'lit';

export type Result<T> = { isOk: true; value: T } | { isOk: false; err: unknown };

export class AsyncValue<T> {
  private task: Task;
  private lastResult: Result<T> | undefined;
  private resultCopied = true;
  private wasUpdatedFlag = false;

  get value(): T | undefined {
    this.copyResult();
    const result = this.result;
    return result && result.isOk ? result.value : undefined;
  }

  get error(): unknown {
    this.copyResult();
    const result = this.result;
    return result && !result.isOk ? result.err : undefined;
  }

  get isReady(): boolean {
    this.copyResult();
    return this.result !== undefined;
  }

  get result(): Result<T> | undefined {
    this.copyResult();
    return this.lastResult;
  }

  constructor(private host: ReactiveControllerHost, loadFunc: () => Promise<T>) {
    this.task = new Task(host, { task: loadFunc, autoRun: false });
  }

  set(value: T) {
    this.lastResult = { isOk: true, value };
    this.wasUpdatedFlag = true;
    this.host.requestUpdate();
  }

  refetch(options?: { clear?: boolean }) {
    const clear = options?.clear ?? false;
    if (clear) {
      this.lastResult = undefined;
    } else {
      this.copyResult(); // in case we didn't copied old result yet
    }

    this.wasUpdatedFlag = true;
    this.resultCopied = false; // result of new fetch is not copied yet
    this.task.run();
  }

  // Returns if data was cleared or fetched (possibly with error) since last call to wasUpdated
  wasUpdated(): boolean {
    this.copyResult();
    const wasUpdatedFlag = this.wasUpdatedFlag;
    this.wasUpdatedFlag = false;
    return wasUpdatedFlag;
  }

  private copyResult(): void {
    if (this.resultCopied) {
      return;
    }
    if (this.task.status === TaskStatus.COMPLETE) {
      this.lastResult = { isOk: true, value: this.task.value as T };
      this.resultCopied = true;
      this.wasUpdatedFlag = true;
    } else if (this.task.status === TaskStatus.ERROR) {
      this.lastResult = { isOk: false, err: this.task.error };
      this.resultCopied = true;
      this.wasUpdatedFlag = true;
    }
  }
}
