const Redis = require("ioredis");
const { netdata_charts } = require("@lib/postgres");
const { host } = require("pg/lib/defaults");

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
}

module.exports = {
    GetNetdataMonitor
}