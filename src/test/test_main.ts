import {Mutex} from '../lib/mutex';
import * as bluebird from 'bluebird';
type TDone = (arg?: any) => void;

describe('mutex', function (): void {
    it('should lock', function (done: TDone): void {
        const mutex = new Mutex();
        const key = 'key';
        let globalFnIndex: number = 0;

        this.timeout(4000);

        const mutexCapturingFunction = function (then): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                mutex.capture(key)
                    .then(then)
                    .catch((err) => {
                        done(err);
                    });
            });
        };

        const timeoutedUnlockFunction = function (fnIndex: number): Promise<void> {
            return mutexCapturingFunction((unlock) => {
                    if (fnIndex !== globalFnIndex) {
                        done('Mutex should not be captured');
                    }
                    globalFnIndex++;
                    setTimeout(unlock, 200);
                }
            );
        };

        const lastFunction = function (fnIndex: number): Promise<void> {
            return mutexCapturingFunction((unlock) => {
                unlock();
                if (fnIndex !== globalFnIndex) {
                    done('Mutex should not be captured');
                } else {
                    done();
                }
            });
        };

        timeoutedUnlockFunction(0);
        timeoutedUnlockFunction(1);
        lastFunction(2);
    });

    it('loads', function (done: TDone): void {
        const mutex = new Mutex();
        const key = 'key';
        let globalFnIndex: number = 0;
        const lastIndex: number = 1000;

        this.timeout(4000);

        const mutexCapturingFunction = function (fnIndex: number): void {
            mutex.capture(key)
                .then((unlock) => {
                    if (fnIndex !== globalFnIndex) {
                        done('Mutex should not be captured');
                    }
                    globalFnIndex++;
                    unlock();
                    if (fnIndex === lastIndex) {
                        done();
                    }
                })
                .catch((err) => {
                    done(err);
                });
        };

        for (let i: number = 0; i <= lastIndex; i++) {
            mutexCapturingFunction(i);
        }
    });

    it('should unlock', function (done: TDone): void {
        const mutex = new Mutex();
        mutex.capture('key').then((unlock) => {
            setTimeout(() => {
                unlock();
            }, 300);
        });

        mutex.capture('key')
            .then((unlock) => {
                unlock();
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    it('should process keys for capturing', function (done: TDone): void {
        const mutex = new Mutex();

        mutex.capture('firstKey');
        mutex.capture('secondKey')
            .then((unlock) => {
                done();
            });
    });

    it('should have default timeout', function (done: TDone): void {
        const mutex = new Mutex();
        this.timeout(4000);
        mutex.capture('anotherKey');
        setTimeout(() => {
            mutex.capture('anotherKey')
                .then((unlock) => {
                    done();
                });
        }, Mutex.DEFAULT_OPTIONS.autoUnlockTimeoutMs);
    });

    it('should use custom Promise', function(done: TDone): void {
        Promise = null;

        const mutex = new Mutex({
            Promise: bluebird
        });

        mutex.capture('test')
            .then((unlock) => {
                done();
            });
    });
});