// const { limiter } = require('@middleware/limiter');
const HyperExpress = require('hyper-express');
// const { writeOverwriteCacheKey } = require('@lib/cache');
const { gzipCompress, gzipDecompress } = require('@lib/object_compressor');
const { GetNetdataMonitor, SaveNetdataNodeChart, SaveNetdataNodeOverview, ReadNetdataNodeOverview } = require('@lib/redis');
const { parseNetdata } = require('@lib/netdata_parser');
const NetdataCharts = require('@lib/netdata_charts');
const router = new HyperExpress.Router();

router.post('/put', /* limiter(1) ,*/ async (req, res) => {
  const parsedData = await parseNetdata(await req.json());
  const reqIP = req.headers['x-forwarded-for'] || req.ip;
  console.log(`Received data from ${reqIP}`);
  const monitor_config = await GetNetdataMonitor(parsedData.hostname, reqIP);
  const chart_fields = NetdataCharts.listCharts(monitor_config.charts); // Convert the bit-mask to a list of chart fields
  console.log(monitor_config, chart_fields);

  // Iterate over each chart field
  chart_fields.forEach(async (chart) => {
    const metricNamesForChart = NetdataCharts.getChartFields(chart);
    process.log.debug(`Saving chart ${chart} for ${parsedData.hostname}: ${metricNamesForChart.join(', ')}`);
    // Iterate over each metric in the chart, one chart can have multiple metrics (CPU has user, system, etc.)
    metricNamesForChart.forEach(async (metric, index) => {
      const chartData = parsedData.metrics[metric];
      if (chartData) {
        await SaveNetdataNodeChart(parsedData.hostname, reqIP, chart, index, monitor_config.chart_hours, chartData.value);
      }
    });
  });


  // Validate IP address and Hostname
  // process.log.debug(`Hostname: ${parsedData.hostname}`);

  // Measure compression and decompression for gzip
  console.time("Gzip Compression");
  const compressedData = gzipCompress(parsedData);
  console.timeEnd("Gzip Compression");

  SaveNetdataNodeOverview(parsedData.hostname, reqIP, compressedData, monitor_config.chart_hours); // Save the overview data (non-chart data)

  console.time("Gzip Decompression");
  const decompressedData = gzipDecompress(compressedData);
  console.timeEnd("Gzip Decompression");

  // Output sizes for comparison
  console.log("Original Data Size:", Buffer.byteLength(JSON.stringify(parsedData), 'utf8'), "bytes");
  console.log("Gzip Compressed Data Size:", compressedData.length, "bytes");
  console.log("Decompressed Data Size from Netdata Input (Gzip):", Buffer.byteLength(JSON.stringify(decompressedData), 'utf8'), "bytes");
  // console.log("Storrage Size Avaible:", decompressedData.metrics["disk.space.avail"].value, decompressedData.metrics["disk.space.avail"].units);

  // console.log(JSON.stringify(parsedData, null, 2));

  // Send a response back to Netdata
  res.status(200).send(JSON.stringify(parsedData));
});

module.exports = router;

/*
{
  "hostname": "srv-cel-store01",
  "individual": {
    "disk": {
      "sdc": {
        "power_on_time": 230954400,
        "temperature": 35,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sds": {
        "power_on_time": 230950800,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdac": {
        "power_on_time": 230968800,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 66
      },
      "sde": {
        "power_on_time": 230958000,
        "temperature": 38,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdl": {
        "power_on_time": 230954400,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdu": {
        "power_on_time": 230950800,
        "temperature": 37,
        "device_smart_status.ok": 1,
        "error_log": 15
      },
      "sdy": {
        "power_on_time": 230954400,
        "temperature": 39,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sda": {
        "power_on_time": 230954400,
        "temperature": 35,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdg": {
        "power_on_time": 230961600,
        "temperature": 39,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdi": {
        "power_on_time": 230954400,
        "temperature": 36,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdn": {
        "power_on_time": 230950800,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdx": {
        "power_on_time": 230950800,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdab": {
        "power_on_time": 230954400,
        "temperature": 33,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdo": {
        "power_on_time": 230954400,
        "temperature": 38,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdz": {
        "power_on_time": 230950800,
        "temperature": 39,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdad": {
        "power_on_time": 230954400,
        "temperature": 41,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdaa": {
        "power_on_time": 230950800,
        "temperature": 38,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdb": {
        "power_on_time": 230950800,
        "temperature": 34,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdf": {
        "power_on_time": 230950800,
        "temperature": 38,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdk": {
        "power_on_time": 230950800,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdt": {
        "power_on_time": 230958000,
        "temperature": 39,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdv": {
        "power_on_time": 230950800,
        "temperature": 33,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdh": {
        "power_on_time": 230965200,
        "temperature": 38,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdj": {
        "power_on_time": 230954400,
        "temperature": 32,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdm": {
        "power_on_time": 230961600,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdr": {
        "power_on_time": 230954400,
        "temperature": 41,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdw": {
        "power_on_time": 230954400,
        "temperature": 39,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdd": {
        "power_on_time": 230950800,
        "temperature": 36,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdp": {
        "power_on_time": 230954400,
        "temperature": 33,
        "device_smart_status.ok": 1,
        "error_log": 0
      },
      "sdq": {
        "power_on_time": 230958000,
        "temperature": 40,
        "device_smart_status.ok": 1,
        "error_log": 0
      }
    }
  },
  "metrics": {
    "sensors.chip_sensor_temperature.input": {
      "value": 66,
      "units": "Celsius"
    },
    "sensors.chip_sensor_power_average.average": {
      "value": 405,
      "units": "Watts"
    },
    "disk.space.avail": {
      "units": "GiB",
      "value": 137109.17378890002
    },
    "disk.space.used": {
      "units": "GiB",
      "value": 179.50799659999998
    },
    "disk.space.reserved_for_root": {
      "units": "GiB",
      "value": 7287.717294199997
    },
    "system.cpu.guest_nice": {
      "value": 0,
      "units": "percentage"
    },
    "system.cpu.guest": {
      "value": 0,
      "units": "percentage"
    },
    "system.cpu.steal": {
      "value": 0,
      "units": "percentage"
    },
    "system.cpu.softirq": {
      "value": 0.0031309,
      "units": "percentage"
    },
    "system.cpu.irq": {
      "value": 0,
      "units": "percentage"
    },
    "system.cpu.user": {
      "value": 0.200221,
      "units": "percentage"
    },
    "system.cpu.system": {
      "value": 0.3722114,
      "units": "percentage"
    },
    "system.cpu.nice": {
      "value": 0.1939847,
      "units": "percentage"
    },
    "system.cpu.iowait": {
      "value": 0,
      "units": "percentage"
    },
    "system.cpu.idle": {
      "value": 99.230452,
      "units": "percentage"
    },
    "system.load.load1": {
      "value": 0.22,
      "units": "load"
    },
    "system.load.load5": {
      "value": 0.2,
      "units": "load"
    },
    "system.load.load15": {
      "value": 0.225,
      "units": "load"
    },
    "system.ram.free": {
      "value": 8730.655,
      "units": "MiB"
    },
    "system.ram.used": {
      "value": 3087.3098,
      "units": "MiB"
    },
    "system.ram.cached": {
      "value": 111261.46,
      "units": "MiB"
    },
    "system.ram.buffers": {
      "value": 5719.926,
      "units": "MiB"
    },
    "mem.swap.free": {
      "value": 32766.98,
      "units": "MiB"
    },
    "mem.swap.used": {
      "value": 1,
      "units": "MiB"
    },
    "disk.io.reads": {
      "units": "KiB/s",
      "value": 0
    },
    "disk.io.writes": {
      "units": "KiB/s",
      "value": -97.1298966
    },
    "disk.ops.reads": {
      "units": "operations/s",
      "value": 0
    },
    "disk.ops.writes": {
      "units": "operations/s",
      "value": -21.2692248
    },
    "net.packets.received": {
      "units": "packets/s",
      "value": 157.4121606
    },
    "net.packets.sent": {
      "units": "packets/s",
      "value": -102.0999972
    },
    "net.packets.multicast": {
      "units": "packets/s",
      "value": 0.6
    },
    "system.net.InOctets": {
      "value": 93.5742114,
      "units": "kilobits/s"
    },
    "system.net.OutOctets": {
      "value": -3009.667096,
      "units": "kilobits/s"
    },
    "cpufreq.cpufreq": {
      "value": 1210.862421875,
      "units": "MHz"
    }
  }
}
*/