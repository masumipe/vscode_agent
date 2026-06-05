import * as path from 'path';
import * as glob from 'glob';

export function run(): Promise<void> {
    const Mocha = require('mocha');
    const mocha = new Mocha({
        ui: 'tdd',
        timeout: 300000,
    });

    const testsRoot = path.resolve(__dirname, '../tests');

    return new Promise((resolve, reject) => {
        const files = glob.sync('**/*.(t|j)s', { cwd: testsRoot, nodir: true });
        files.forEach((f: string) => {
            mocha.addFile(path.join(testsRoot, f));
        });

        mocha.run((failures: number) => {
            if (failures > 0) {
                reject(new Error(`${failures} test(s) failed.`));
            } else {
                resolve();
            }
        });
    });
}
