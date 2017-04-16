import {Mutex} from '../lib/mutex';
import * as bluebird from 'bluebird';
type TDone = (arg?: any) => void;

describe('mutex', function(): void {
    let currentCase = 0;
    const oldPromise = Promise;

    beforeEach(function(done: TDone): void {
        // TODO
        currentCase++;
        Promise = oldPromise;
        done();
    });

    it('should lock', function(done: TDone): void {
        const mutex = new Mutex({Promise});
        const testCase: number = currentCase;

        const firstFunction = function(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                mutex.capture('key')
                    .then((unlock) => {
                        setTimeout(() => {
                            done();
                        }, 1000);
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        };

        const secondFunction = function(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                mutex.capture('key')
                    .then((unlock) => {
                        if (currentCase === testCase) {
                            done('Mutex should not be captured');
                        }
                    });
            });
        };

        firstFunction();
        secondFunction();
    });

    it('should unlock', function(done: TDone): void {
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

    it('should process keys for capturing', function(done: TDone): void {
        const mutex = new Mutex();

        mutex.capture('firstKey');
        mutex.capture('secondKey')
            .then((unlock) => {
                done();
            });
    });

    it('should have default timeout of 3000ms', function(done: TDone): void {
        const mutex = new Mutex();
        this.timeout(4000);
        mutex.capture('anotherKey');
        setTimeout(() => {
            mutex.capture('anotherKey')
                .then((unlock) => {
                    done();
                });
        }, 3000);
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