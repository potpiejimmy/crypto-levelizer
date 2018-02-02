export function asyncLoop(array: any[], iter: (element: any) => Promise<void>, index: number = 0): Promise<void> {
    if (index >= array.length) return Promise.resolve();
    return iter(array[index]).then(() => asyncLoop(array, iter, ++index));
}

export function asyncWhile(condition: () => boolean, iter: () => Promise<void>): Promise<void> {
    if (!condition()) return Promise.resolve();
    return iter().then(() => asyncWhile(condition, iter));
}
