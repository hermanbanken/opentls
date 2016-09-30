export interface Promise<T> {
    (arg: T): Promise<T>;
    then<U>(cont: (result: T) => (U | Promise<U>)): Promise<U>;
    catch<U>(cont: (error: Error) => (U | Promise<U>)): Promise<U>;
}

export declare var Promise: {
    all<T>(it: Promise<T>[]): Promise<[T]>;
    new<T>(execute: (resolve: Function, reject: Function) => void): Promise<T>;
    resolve<T>(arg: T): Promise<T>;
}

Promise = Promise || require("promise");