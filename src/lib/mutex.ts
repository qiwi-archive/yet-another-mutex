let setTimeout;
let clearTimeout;

if (typeof global !== 'undefined') {
    setTimeout = global.setTimeout;
    clearTimeout = global.clearTimeout;
} else {
    setTimeout = window.setTimeout;
    clearTimeout = window.clearTimeout;
}

export interface IMutexOptions {
    /**
     * Timeout of auto-unlocking mutex
     */
    autoUnlockTimeoutMs?: number;
    /**
     * Custom Promise
     */
    Promise?: PromiseConstructor;
}

export class Mutex {
    /**
     * Default mutex options.
     * @type {IMutexOptions}
     */
    public static readonly DEFAULT_OPTIONS: IMutexOptions = {
        autoUnlockTimeoutMs: 3000,
        Promise: Promise
    };

    /**
     * Map of captured mutex keys.
     * @type {{}}
     */
    protected _storage: {} = {};

    /**
     * Current mutex instance options.
     */
    protected _options: IMutexOptions;

    constructor(options: IMutexOptions = Mutex.DEFAULT_OPTIONS) {
        this._options = {
            Promise: options.Promise || Mutex.DEFAULT_OPTIONS.Promise,
            autoUnlockTimeoutMs: options.autoUnlockTimeoutMs || Mutex.DEFAULT_OPTIONS.autoUnlockTimeoutMs
        };
        if (!this._options.Promise) {
            throw new Error(
                'Could not get native Promise in current env. Please pass custom Promise lib to constructor options'
            );
        }
    }

    /**
     * Captures mutex by provided key.
     * @see checkMutexAndLock
     * @param key
     * @returns {Promise<()=>void>}
     */
    public async capture(key: string): Promise<() => void> {
        while (this._storage[key]) {
            //wait for lucky mutex release
            await this._storage[key].promise as Promise<void>;
        }
        this._storage[key] = {};
        //capturing mutex with a promise which will be released when promise is resolved
        this._storage[key].promise = new this._options.Promise<void>((resolve, reject) => {
            // providing an unlock function which releases a mutex
            let unlock = () => {
                clearTimeout(this._storage[key].timeout);
                delete this._storage[key];
                resolve();
            };
            unlock.bind(this);
            this._storage[key].timeout = setTimeout(unlock, this._options.autoUnlockTimeoutMs);
            this._storage[key].unlock = unlock;
        });
        return this._storage[key].unlock;
    }
}