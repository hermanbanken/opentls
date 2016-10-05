import { IComparable } from './ovtypes';

declare global {
    interface Array<T> {
        flatten(): T;
        distinct(): T[];
    }
}

function flatten<T>(input: T[][]): T[] {
    return input.reduce((p: T[], n: T[]) => p.concat(n), []);
};

function distinct<T extends IComparable>(list: T[]): T[] {
    return (<IComparable[]>list)
        .sort((a, b) => a.localeCompare(b))
        .reduce((p, n) => {
            var last = <IComparable|null> p.slice(-1)[0];
            if(!last || last.localeCompare(n) != 0) {
                p.push(n)
            }
            return p;
        }, []);
}

Array.prototype.distinct = function() {
    return distinct(this);
}


Array.prototype.flatten = function() {
    return flatten(this);
}