const Joi = require('@lib/sanitizer');

const elementSchema = Joi.object({
    prefix: Joi.fullysanitizedString().optional(),
    hostname: Joi.fullysanitizedString().required(),
    labels: Joi.object().optional(),
    chart_id: Joi.fullysanitizedString().required(),
    chart_name: Joi.fullysanitizedString().optional(),
    chart_family: Joi.fullysanitizedString().optional(),
    chart_context: Joi.fullysanitizedString().required(),
    chart_type: Joi.fullysanitizedString().optional(),
    units: Joi.fullysanitizedString().optional(),
    id: Joi.fullysanitizedString().required(),
    name: Joi.fullysanitizedString().optional(),
    value: Joi.number().required().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
    timestamp: Joi.number().optional()
});

/**
 * Parses and filters Netdata JSON data, extracting relevant metrics and aggregating them.
 * 
 * @param {Array<Object>} netdata_json - The array of Netdata JSON objects to be parsed. Each object represents a single metric with properties such as hostname, chart_id, chart_context, value, etc.
 * 
 * @returns {Object} The parsed result containing:
 *  - `hostname`: The hostname of the system.
 *  - `individual`: An object with categorized individual device metrics.
 *  - `metrics`: An object with aggregated or processed metrics. For example, CPU frequency is aggregated across all CPUs.
 *  - If validation fails, returns an object with an `error` key describing the issue.
 * 
 * @throws {Error} Will throw an error if the input is not an array or if the array is empty.
 * 
 * @example
 * const netdataJson = [
 *   {
 *     "prefix": "netdata",
 *     "hostname": "srv-cel-store01",
 *     "labels": {},
 *     "chart_id": "disk_inodes./run",
 *     "chart_name": "disk_inodes./run",
 *     "chart_family": "/run",
 *     "chart_context": "disk.inodes",
 *     "chart_type": "disk_inodes",
 *     "units": "inodes",
 *     "id": "reserved_for_root",
 *     "name": "reserved for root",
 *     "value": 0,
 *     "timestamp": 1729278086
 *   }
 * ];
 * 
 * const result = parseNetdata(netdataJson);
 * // Returns an object with filtered and processed metrics.
 * 
 */
const parseNetdata = async (netdata_json) => {
    if (!Array.isArray(netdata_json) || netdata_json.length === 0) {
        return { error: 'Invalid input, expected a non-empty array.' };
    }

    // Validate each element in the array against the schema
    for (const element of netdata_json) {
        const { error } = await elementSchema.validateAsync(element);
        if (error) {
            return { error: `Validation error: ${error.message}` };
        }
    }

    // Extract the hostname from the first element
    const hostname = netdata_json[0].hostname;

    let filtered = netdata_json.filter((element) => {
        // Check if the hostname matches
        if (element.hostname !== hostname) return false;

        // Remove unwanted properties
        delete element.chart_name;
        delete element.chart_family;
        delete element.chart_type;
        delete element.hostname;
        delete element.timestamp;
        delete element.labels;
        delete element.prefix;
        delete element.name;

        // Check if the context is in the allowed_metric_contexts array
        return allowed_metric_contexts.includes(element.chart_context);
    });

    let result = {
        hostname,
        individual: {},
        metrics: {}
    };

    filtered.forEach((element) => {
        const operation = metric_charts[element.chart_context];
        const units = element.units || 'unknown';

        // Parse individual metrics (Defined in metric_charts config)
        if (operation && operation.includes('individual')) {
            const individualCategory = operation.split('.')[0];

            const deviceMatch = element.chart_id.match(/device_(.*?)_/);
            const device = deviceMatch ? deviceMatch[1] : 'unknown_device';

            if (!result.individual[individualCategory]) result.individual[individualCategory] = {};
            if (!result.individual[individualCategory][device]) result.individual[individualCategory][device] = {};

            if (element.chart_context === 'smartctl.device_smart_status') {
                const statusKey = 'device_smart_status.ok';
                const deviceData = result.individual[individualCategory][device];

                if (!deviceData[statusKey]) deviceData[statusKey] = 0;
                if (element.id === 'failed' && element.value === 1) deviceData[statusKey] = 0;
                if (element.id === 'passed' && element.value === 1) deviceData[statusKey] = 1;
            } else {
                result.individual[individualCategory][device][element.id] = element.value;
            }
        } else {
            // Parse metrics that have operations defined in metric_charts config
            const key = `${element.chart_context}.${element.id}`;
            if (!result.metrics[key]) {
                if (operation === 'sum' || operation === 'avg') {
                    result.metrics[key] = { sum: 0, count: 0, units: units };
                } else if (operation === 'none') {
                    result.metrics[key] = { value: element.value, units: units };
                } else {
                    result.metrics[key] = { value: null, units: units };
                }
            }

            if (operation === 'sum') {
                result.metrics[key].sum += element.value;
            } else if (operation === 'avg') {
                result.metrics[key].sum += element.value;
                result.metrics[key].count += 1;
            }
        }
    });

    Object.keys(result.metrics).forEach(key => {
        if (result.metrics[key].count) {
            result.metrics[key].value = result.metrics[key].sum / result.metrics[key].count;
            delete result.metrics[key].sum;
            delete result.metrics[key].count;
        }
    });

    let cpuFreqTotal = 0;
    let cpuFreqCount = 0;

    Object.keys(result.metrics).forEach(key => {
        if (key.startsWith('cpufreq.cpufreq.cpu')) {
            cpuFreqTotal += result.metrics[key].value;
            cpuFreqCount += 1;
            delete result.metrics[key];
        }
    });

    if (cpuFreqCount > 0) {
        result.metrics['cpufreq.cpufreq'] = {
            value: cpuFreqTotal / cpuFreqCount,
            units: 'MHz'
        };
    }

    return result;
};

module.exports = parseNetdata;