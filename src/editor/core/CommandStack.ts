import type { Command } from './types';

type Listener = (state: { canUndo: boolean; canRedo: boolean; stack: Command[]; index: number }) => void;

/**
 * Central undo/redo stack. Every tool, layer edit, and spline edit pushes a Command
 * here instead of mutating state directly and forgetting about history.
 */
export class CommandStack {
  private stack: Command[] = [];
  private index = -1; // points at the last applied command
  private listeners = new Set<Listener>();
  private readonly limit = 500;

  push(command: Command) {
    // Executing a new command after undoing invalidates the redo branch.
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(command);
    if (this.stack.length > this.limit) this.stack.shift();
    else this.index++;
    this.notify();
  }

  undo() {
    if (this.index < 0) return;
    this.stack[this.index].undo();
    this.index--;
    this.notify();
  }

  redo() {
    if (this.index >= this.stack.length - 1) return;
    this.index++;
    this.stack[this.index].redo();
    this.notify();
  }

  get canUndo() {
    return this.index >= 0;
  }

  get canRedo() {
    return this.index < this.stack.length - 1;
  }

  getHistory() {
    return { stack: this.stack, index: this.index, canUndo: this.canUndo, canRedo: this.canRedo };
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn({ canUndo: this.canUndo, canRedo: this.canRedo, stack: this.stack, index: this.index });
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const payload = { canUndo: this.canUndo, canRedo: this.canRedo, stack: this.stack, index: this.index };
    this.listeners.forEach((fn) => fn(payload));
  }
}

export const commandStack = new CommandStack();
