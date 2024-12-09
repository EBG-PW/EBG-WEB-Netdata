const zlib = require("node:zlib");

/**
 * Compress JS objects with gzip
 * @param {Object} data 
 * @returns {Buffer}
 */
const gzipCompress = (data) => {
    return zlib.gzipSync(JSON.stringify(data));
}

/**
 * Decompress JS objects with gzip
 * @param {Buffer} data
 * @returns {Object}
 */
const gzipDecompress = (data) => {
    return JSON.parse(zlib.gunzipSync(data).toString());
}

module.exports = {
    gzipCompress,
    gzipDecompress
};