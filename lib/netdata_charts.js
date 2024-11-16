class NetdataCharts {
    constructor() {
        if (NetdataCharts.instance) {
            return NetdataCharts.instance;
        }

        NetdataCharts.instance = this;

        this.charts = {
            "CPU:USAGE": 1 << 1,
            "CPU:AVGFREQ": 1 << 2,
            "CPU:TEMP": 1 << 3,
            "MEM:USAGE": 1 << 4,
            "MEM:SWAP": 1 << 5,
            "DISK:USAGE": 1 << 6,
            "DISK:IO": 1 << 7,
            "DISK:OPS": 1 << 8,
            "NET:PACKETS": 1 << 9,
            "NET:OCTETS": 1 << 10,
            "SYS:POWER": 1 << 11
        }

        this.chartsTranslationKey = {
            "CPU:USAGE": "NodeCPUUsage",
            "CPU:AVGFREQ": "NodeCPUAvrageFrequency",
            "CPU:TEMP": "NodeCPUTempreture",
            "MEM:USAGE": "NodeMemoryUsage",
            "MEM:SWAP": "NodeMemorySwap",
            "DISK:USAGE": "NodeDiskUsage",
            "DISK:IO": "NodeDiskIO",
            "DISK:OPS": "NodeDiskOPS",
            "NET:PACKETS": "NodeNetPackets",
            "NET:OCTETS": "NodeNetOctets",
            "SYS:POWER": "NodeSystemPower"
        }

        this.ChartFields = {
            "CPU:USAGE": ["system.cpu.steal", "system.cpu.user", "system.cpu.system", "system.cpu.nice", "system.cpu.iowait"],
            "CPU:AVGFREQ": ["cpufreq.cpufreq"],
            "CPU:TEMP": ["sensors.chip_sensor_temperature.input"],
            "MEM:USAGE": ["system.ram.used", "system.ram.cached", "system.ram.buffers"],
            "MEM:SWAP": ["mem.swap.free", "mem.swap.used"],
            "DISK:USAGE": ["disk.space.used"],
            "DISK:IO": ["disk.io.reads", "disk.io.writes"],
            "DISK:OPS": ["disk.ops.reads", "disk.ops.writes"],
            "NET:PACKETS": ["net.packets.received", "net.packets.sent", "net.packets.multicast"],
            "NET:OCTETS": ["system.net.InOctets", "system.net.OutOctets"],
            "SYS:POWER": ["sensors.chip_sensor_power_average.average"]
        };
    }

    /**
     * Calculate the chart code int
     * @param {string<array>} charts 
     * @returns {number}
     */
    genCode = (permissions) => {
        let combInt = 0;
        for (const perm in permissions) {
            combInt |= this.charts[permissions[perm]]
        }
        return combInt;
    }

    /**
     * Get all charts within the combined int
     * @param {number} combInt 
     * @returns {array}
     */
    listCharts = (combInt) => {
        const result = [];
        for (const [key, value] of Object.entries(this.charts)) {
            if ((combInt & value) === value) {
                result.push(key);
            }
        }
        return result;
    }

    /**
     * Get all chart translation keys
     * @param {number} combInt
     * @returns {array}
     */
    listChartTranslation = (combInt) => {
        const result = [];
        for (const [key, value] of Object.entries(this.charts)) {
            if ((combInt & value) === value) {
                result.push(this.chartsTranslationKey[key]);
            }
        }
        return result;
    }

    /**
     * Get all Chart fields within the combined int
     * @param {Number} combInt 
     * @returns 
     */
    listChartFields = (combInt) => {
        const result = [];
        // If exists in permissionsSQLFields
        for (const [key, value] of Object.entries(this.ChartFields)) {
            if ((combInt & this.charts[key]) === this.charts[key]) {
                result.push(...value);
            }
        }
        return result;
    }

    /**
     * Get all fields for a chart
     * @param {String} chart 
     * @returns 
     */
    getChartFields = (chart) => {
        return this.ChartFields[chart];
    }

    /**
     * Validate if the combInt is returning a valid chart
     */
    validateCombInt = (combInt) => {
        for (const [key, value] of Object.entries(this.charts)) {
            if ((combInt & value) === value) {
                return true;
            }
        }
        return false;
    }
}

module.exports = new NetdataCharts();