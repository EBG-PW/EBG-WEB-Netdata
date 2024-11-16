const { Pool, types } = require('pg');

types.setTypeParser(1184, (stringValue) => stringValue); // for 'timestamptz' type

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

// Function to log current pool statistics
const logPoolStats = () => {
    // Make it 1 line
    process.log.debug(`Total clients: ${pool.totalCount} | Idle clients: ${pool.idleCount} | Waiting clients: ${pool.waitingCount}`);
}

// Periodically log pool statistics
setInterval(logPoolStats, 5000); // Log every 5 seconds

/**
 * Get the netdata monitor for the given hostname and ip_address
 * @param {String} hostname 
 * @param {String} ip_address 
 * @returns 
 */
const getNetdataMonitor = (hostname, ip_address) => {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT user_id, chart_hours, charts FROM netdata_monitoring WHERE hostname = $1 AND ip_address = $2`, [hostname, ip_address], (error, results) => {
            if (error) {
                reject(error);
            }
            if(!results) resolve(null);

            if (results?.rows.length === 1) {
                // Bit-Mask Representation of the charts the user wants to see
                resolve(results.rows[0]);
            }
            resolve(null);
        })
    })
}

const netdata_charts = {
    get: {
        monitor: getNetdataMonitor,
    }
}

module.exports = {
    netdata_charts
}