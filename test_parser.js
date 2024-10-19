const fs = require('node:fs');
const path = require('node:path');

const { allowed_metric_contexts, metric_charts } = require('./config/netdata_metrics');

const parseNetdata = (netdata_json) => {
    // Get the hostname from the first element
    const hostname = netdata_json[0].hostname;

    let filtered = netdata_json.filter((element) => {
        // Check if hostname are the same as the first element
        if (element.hostname !== hostname) return false;

        // Remove unwanted elements
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
        const units = element.units;

        // Handle specific cases for individual metrics
        if (operation && operation.includes('individual')) {
            const individualCategory = operation.split('.')[0];

            const deviceMatch = element.chart_id.match(/device_(.*?)_/); // Extract device name from chart_id
            const device = deviceMatch ? deviceMatch[1] : null;

            if (!device) return; // Skip if no device name is found

            // Dynamically create the category and device if it doesn't exist
            if (!result.individual[individualCategory]) result.individual[individualCategory] = {};
            if (!result.individual[individualCategory][device]) result.individual[individualCategory][device] = {};

            // Combine the passed and failed metrics into a single ok status
            if (element.chart_context === 'smartctl.device_smart_status') {
                const statusKey = 'device_smart_status.ok';
                const deviceData = result.individual[individualCategory][device];

                if (!deviceData[statusKey]) deviceData[statusKey] = 0; // Default to 0, just to be save
                if (element.id === 'failed' && element.value === 1) deviceData[statusKey] = 0;
                if (element.id === 'passed' && element.value === 1) deviceData[statusKey] = 1;

            } else {
                result.individual[individualCategory][device][element.id] = element.value;
            }
        } else {
            const key = `${element.chart_context}.${element.id}`;
            if (!result.metrics[key]) {
                if (operation === 'sum' || operation === 'avg') {
                    result.metrics[key] = { sum: 0, count: 0, units: units };
                } else if (operation === 'none') {
                    result.metrics[key] = { value: element.value, units: units };
                } else {
                    result.metrics[key] = { value: null, units: units }; // Handle cases for null values
                }
            }

            // Process config specific operations
            if (operation === 'sum') {
                result.metrics[key].sum += element.value;
            } else if (operation === 'avg') {
                result.metrics[key].sum += element.value;
                result.metrics[key].count += 1;
            }
        }
    });

    // Post-process avg operations to compute the final average
    Object.keys(result.metrics).forEach(key => {
        if (result.metrics[key].count) {
            result.metrics[key].value = result.metrics[key].sum / result.metrics[key].count;
            delete result.metrics[key].sum;
            delete result.metrics[key].count;
        }
    });

    // Special for cpufreq.cpufreq - aggregate across all CPUs (Cores)
    let cpuFreqTotal = 0;
    let cpuFreqCount = 0;

    Object.keys(result.metrics).forEach(key => {
        if (key.startsWith('cpufreq.cpufreq.cpu')) {
            cpuFreqTotal += result.metrics[key].value;
            cpuFreqCount += 1;
            delete result.metrics[key]; // Remove individual CPU entries
        }
    });

    if (cpuFreqCount > 0) {
        result.metrics['cpufreq.cpufreq'] = {
            value: cpuFreqTotal / cpuFreqCount,
            units: 'MHz' // Default Unit
        };
    }

    return result;
};

(async () => {
    const netdata_json = fs.readFileSync(path.join(__dirname, 'netdata_request_all.json'), 'utf8');

    // Filter out all elements where the context is not in the allowed_metric_contexts array

    const netdata = JSON.parse(netdata_json);

    const { individual, hostname, metrics } = parseNetdata(netdata);
    console.log(`Hostname: ${hostname}`);

    fs.writeFileSync(path.join(__dirname, 'netdata_request_filtered.json'), JSON.stringify({ individual, metrics }, null, 4));
})()