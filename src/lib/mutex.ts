const setTimeout: (func: () => void, ms: number) => void = global.setTimeout || window.setTimeout;
const clearTimeout: (timer: any) => void = global.clearTimeout || window.clearTimeout;

export interface IMutexOptions {
    intervalMs: number;
    autoUnlockTimeoutMs: number;
    Promise?: PromiseConstructor;
}

export class Mutex {
    public static readonly DEFAULT_OPTIONS: IMutexOptions = {
        intervalMs: 50,
        autoUnlockTimeoutMs: 3000
    };

    protected storage: {} = {};
    protected options: IMutexOptions;

    constructor(options?: IMutexOptions) {
        const SelectedPromise = Promise || options.Promise;

        if (!SelectedPromise) {
            throw new Error(
                'Could not get native Promise in current env. Please pass custom Promise lib to constructor options'
            );
        }

        this.options = {
            Promise: SelectedPromise,
            intervalMs: (options && options.intervalMs) || Mutex.DEFAULT_OPTIONS.intervalMs,
            autoUnlockTimeoutMs: (options && options.autoUnlockTimeoutMs) || Mutex.DEFAULT_OPTIONS.autoUnlockTimeoutMs
        };
    }

    public capture(key: string): Promise<() => void> {
        return new this.options.Promise<() => void>((resolve, reject) => {
            this.checkMutexLock(key, resolve, reject);
        });
    }

    protected checkMutexLock(key: string, resolve: (arg: any) => void, reject: (arg: any) => void): void {
        if (!this.storage[key]) {
            this.storage[key] = true;

            const timeout = setTimeout(() => {
                delete this.storage[key];
            }, this.options.autoUnlockTimeoutMs);

            resolve(() => {
                clearTimeout(timeout);
                delete this.storage[key];
            });
        } else {
            setTimeout(this.checkMutexLock.bind(this, key, resolve, reject), this.options.intervalMs);
        }
    }
}