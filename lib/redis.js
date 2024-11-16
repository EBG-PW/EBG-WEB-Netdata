const Redis = require("ioredis");
const { netdata_charts } = require("@lib/postgres");

/** @type {import('ioredis').Redis} */
const redis = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || "127.0.0.1",
    username: process.env.REDIS_USER || "default",
    password: process.env.REDIS_PASSWORD || "default",
    db: process.env.REDIS_DB || 0,
});

redis.on("error", (err) => {
    process.log.error(err);
    process.exit(2);
});

/**
 * Get the Netdata monitor data from the Redis database
 * @param {String} hostname 
 * @param {String} ip_address 
 */
const GetNetdataMonitor = async (hostname, ip_address) => {
    const key = `NDM:${ip_address}:${hostname}`;

    const monitor_data = await redis.get(key);
    if (monitor_data) {
        process.log.debug(`Cache hit for ${key}`);
        return JSON.parse(monitor_data);
    } else {
        process.log.debug(`Cache miss for ${key}`);
        const monitor = await netdata_charts.get.monitor(hostname, ip_address);
        if (monitor) {
            redis.set(key, JSON.stringify(monitor));
            return monitor;
        } else {
            return null;
        }
    }
}

/**
 * Store the Netdata node overview data
 * @param {String} hostname 
 * @param {String} ip_address 
 * @param {Object} data 
 * @returns 
 */
const SaveNetdataNodeOverview = async (hostname, ip_address, data) => {
    const key = `NDM:${ip_address}:${hostname}:OVERVIEW`;
    await redis.set(key, JSON.stringify(data));
    return true;
}

/**
 * Add a new value to the Netdata node chart
 * @param {String} hostname 
 * @param {String} ip_address 
 * @param {String} chart 
 * @param {Number} chart_length 
 * @param {Number} data 
 */
const SaveNetdataNodeChart = async (hostname, ip_address, chart, chart_length, new_value) => {
    const key = `NDM:${ip_address}:${hostname}:${chart}`;
    await redis.lpush(key, new_value, async (err) => {
        if (err) {
            process.log.err('Error pushing data to Redis:', err);
            return;
        }

        await redis.ltrim(key, 0, chart_length - 1, (trimErr) => {
            if (trimErr) {
                process.log.err('Error trimming Redis list:', trimErr);
            }
            return;
        });
    });
}

module.exports = {
    GetNetdataMonitor,
    SaveNetdataNodeOverview,
    SaveNetdataNodeChart
}