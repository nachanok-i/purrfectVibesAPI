const csv = require('csv-parser');
const fs = require('fs');

export async function readCsvFrom(path: string) {
    return new Promise(function (resolve, reject) {
        const results: any[] = [];
        fs.createReadStream(path)
            .pipe(csv())
            .on('data', (data: any) => results.push(data))
            .on('end', () => {
                resolve(results);
            });
    });
}