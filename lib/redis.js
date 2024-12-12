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
    const key = `NDC:${ip_address}:${hostname}`;

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
 * @param {Buffer} data 
 * @param {Number} chart_length
 * @returns 
 */
const SaveNetdataNodeOverview = async (hostname, ip_address, data, chart_length) => {
    const chart_length_seconds = chart_length * 3600; // Convert hours to seconds
    const key = `NDM:${ip_address}:${hostname}:OVERVIEW`;
    try {
        await redis.set(key, data.toString('base64'));
        await redis.expire(key, chart_length_seconds);
        return true;
    } catch (err) {
        console.error(err);
        process.log.err('Error handling Redis operation:', err);
    }
}

/**
 * Add a new value to the Netdata node chart
 * @param {String} hostname 
 * @param {String} ip_address 
 * @param {String} chart 
 * @param {Number} chart_id
 * @param {Number} chart_length Time in hours
 * @param {Number} data 
 */
const SaveNetdataNodeChart = async (hostname, ip_address, chart, chart_id, chart_length, new_value) => {
    const key = `NDM:${ip_address}:${hostname}:${chart}:${chart_id}`;
    const chart_length_seconds = chart_length * 3600; // Convert hours to seconds
    const maxEntries = Math.floor(chart_length_seconds / 10); // One entry every 10 seconds

    try {
        await redis.lpush(key, Math.floor(new_value));
        await redis.ltrim(key, 0, maxEntries - 1);
        await redis.expire(key, chart_length_seconds);
    } catch (err) {
        console.error(err);
        process.log.err('Error handling Redis operation:', err);
    }
};

module.exports = {
    GetNetdataMonitor,
    SaveNetdataNodeOverview,
    SaveNetdataNodeChart
}