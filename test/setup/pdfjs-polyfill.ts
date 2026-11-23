if (typeof globalThis.Iterator === 'undefined') {
  (globalThis as any).Iterator = class Iterator {
    [Symbol.iterator]() {
      return this;
    }
    next() {
      return { done: true, value: undefined };
    }
  };
}
