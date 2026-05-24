import * as path from 'path';
import glob = require('glob');

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = require('mocha').Mocha({
        ui: 'tdd',
        timeout: 300000
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
