const csv = require('csvtojson');
const formatJson = require('json-format');

const { readdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

async function convertFiles() {
	const _files = readdirSync('./raw');
	const files = _files
		.filter(file => file.endsWith('.csv'))
		.filter(file => !_files.includes(file.replace('.csv', '.json')));

	for (const file of files) {
		const filePath = `./raw/${file}`;
		const parsedJson = await csv({ checkType: true })
			.fromFile(resolve(filePath));
		const formattedJson = formatJson(parsedJson, { type: 'space', size: 2 });
		writeFileSync(filePath.replace('.csv', '.json'), formattedJson);
	}
}


module.exports = { convert: convertFiles };
