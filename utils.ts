export function asyncLoopImpl(array: any[], iter: (element: any, next: () => void) => void, complete: () => void, index: number = 0) {
    if (index >= array.length) complete();
    else iter(array[index], () => asyncLoopImpl(array, iter, complete, ++index));
}

export function asyncLoop(array: any[], iter: (element: any, next: () => void) => void): Promise<any> {
    return new Promise((resolve, reject) => asyncLoopImpl(array, iter, () => resolve()));
}

export function asyncWhileImpl(condition: () => boolean, iter: (next: () => void) => void, complete: () => void) {
    if (!condition()) complete();
    else iter(() => asyncWhileImpl(condition, iter, complete));
}

export function asyncWhile(condition: () => boolean, iter: (next: () => void) => void): Promise<any> {
    return new Promise((resolve, reject) => asyncWhileImpl(condition, iter, () => resolve()));
}
