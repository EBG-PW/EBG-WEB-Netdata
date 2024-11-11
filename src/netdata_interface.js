// const { limiter } = require('@middleware/limiter');
const HyperExpress = require('hyper-express');
// const { writeOverwriteCacheKey } = require('@lib/cache');
const { gzipCompress, gzipDecompress } = require('@lib/object_compressor');
const { parseNetdata } = require('@lib/netdata_parser');
const router = new HyperExpress.Router();

router.post('/put', /* limiter(1) ,*/ async (req, res) => {
    const parsedData = await parseNetdata(await req.json());
    const reqIP = req.headers['x-forwarded-for'] || req.ip;
    console.log(`Received data from ${reqIP}`);

    // Validate IP address and Hostname
    // process.log.debug(`Hostname: ${parsedData.hostname}`);

    // Measure compression and decompression for gzip
    console.time("Gzip Compression");
    const compressedData_b = gzipCompress(parsedData);
    console.timeEnd("Gzip Compression");

    console.time("Gzip Decompression");
    const decompressedData_b = gzipDecompress(compressedData_b);
    console.timeEnd("Gzip Decompression");

    // Output sizes for comparison
    console.log("Original Data Size:", Buffer.byteLength(JSON.stringify(parsedData), 'utf8'), "bytes");
    console.log("Gzip Compressed Data Size:", compressedData_b.length, "bytes");
    console.log("Decompressed Data Size (Gzip):", Buffer.byteLength(JSON.stringify(decompressedData_b), 'utf8'), "bytes");
    console.log("Storrage Size Avaible:", decompressedData_b.metrics["disk.space.avail"].value * 9, decompressedData_b.metrics["disk.space.avail"].units);

    // Send a response back to Netdata
    res.status(200).send(JSON.stringify(parsedData));
});

module.exports = router;