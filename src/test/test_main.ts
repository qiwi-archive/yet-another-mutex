import {Mutex} from '../lib/mutex';

type TDone = (arg?: any) => void;

describe('mutex', function(): void {
    let currentCase = 0;

    beforeEach(function(done: TDone): void {
        // TODO
        currentCase++;
        done();
    });

    it('should lock', function(done: TDone): void {
        const mutex = new Mutex();
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
        const func = function(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                mutex.capture('key')
                    .then((unlock) => {
                        setTimeout(() => {
                            done();
                        }, 100);
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        };

        func();

        mutex.capture('key').then((unlock) => {
            unlock();
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
        mutex.capture('key');
        setTimeout(() => {
            mutex.capture('key')
                .then((unlock) => {
                    done();
                });
        }, 3000);
    });
});