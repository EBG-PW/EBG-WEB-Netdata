const { limiter } = require('@middleware/limiter');
const HyperExpress = require('hyper-express');
const { writeOverwriteCacheKey } = require('@lib/cache');
const { parseNetdata } = require('@lib/netdata_parser');
const router = new HyperExpress.Router();

router.post('/put', limiter(1), async (req, res) => {
    const parsedData = await parseNetdata(req.body);

    // Validate IP address and Hostname

    // Send a response back to Netdata
    res.status(200).send(parsedData);
});

module.exports = router;