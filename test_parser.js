const fs = require('node:fs');
const path = require('node:path');

const { allowed_metric_contexts } = require('./config/netdata_metrics');

const parseNetdata = (netdata_json, join_values) => {
    // Get the hostname and timestamp from the first element
    const hostname = netdata_json[0].hostname;
    const timestamp = netdata_json[0].timestamp;

    let filtered = netdata_json.filter((element) => {
        // Check if hostname and timestamp are the same as the first element
        if (element.hostname !== hostname) return false;
        if (element.timestamp !== timestamp) return false;

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

    if (join_values) {
        const avgData = {};

        filtered.forEach(item => {
            let normalizedId = item.id;
            if (/\d+$/.test(item.id)) {
                normalizedId = item.id.replace(/\d+$/, '');
            }

            const key = `${item.chart_context}_${normalizedId}`;
            if (!avgData[key]) {
                avgData[key] = {
                    total: 0,
                    count: 0,
                    units: item.units, // Keep track of units
                    chart_id_prefix: item.chart_id.split('.').slice(0, -1).join('.'),
                };
            }
            avgData[key].total += item.value;
            avgData[key].count++;
        });

        // Calculate averages and create new result objects
        const averagedResults = Object.keys(avgData).map(key => {
            const [chart_context, id] = key.split('_');
            const avgValue = avgData[key].total / avgData[key].count;

            return {
                chart_id: `${avgData[key].chart_id_prefix}.total_avg.${id}`,
                chart_context: chart_context,
                units: avgData[key].units,
                id: id,
                value: avgValue
            };
        });

        console.log(averagedResults.length, allowed_metric_contexts.length)
        console.log(averagedResults);
    }

    return {
        hostname,
        timestamp,
        filtered
    }
}

(async () => {
    const netdata_json = fs.readFileSync(path.join(__dirname, 'netdata_request_all.json'), 'utf8');

    // Filter out all elements where the context is not in the allowed_metric_contexts array

    const netdata = JSON.parse(netdata_json);

    const { hostname, timestamp, filtered } = parseNetdata(netdata, true);
    console.log(`Hostname: ${hostname}`);
    console.log(`Timestamp: ${timestamp}`);

    fs.writeFileSync(path.join(__dirname, 'netdata_request_filtered.json'), JSON.stringify(filtered, null, 4));
})()