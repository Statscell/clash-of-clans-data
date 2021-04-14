const RAW_TEXTS = require('../raw/texts.json');
const RAW_RESOURCES = require('../raw/resources.json');

function getTextValue(id) {
	const found = RAW_TEXTS.find(field => field.TID === id);
	return found
		? found.EN
		: id;
}

function getResourceName(id) {
	const resource = RAW_RESOURCES.find(field => field.Name === id);
	return resource
		? getTextValue(resource.AltTID ?? resource.TID)
		: id;
}

module.exports = { getResourceName, getTextValue };
