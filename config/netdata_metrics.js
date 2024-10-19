module.exports = {
    "allowed_metric_contexts": ["system.cpu", "system.load", "system.ram", "mem.swap", "system.net", "net.packets", "disk.io", "disk.ops", "disk.space", "cpufreq.cpufreq", "smartctl.device_smart_status", "smartctl.device_ata_smart_error_log_count", "smartctl.device_power_on_time", "smartctl.device_temperature", "sensors.chip_sensor_power_average", "sensors.chip_sensor_temperature", "systemd.service"],
    "metric_charts": {
        "system.cpu": "none",
        "system.load": "none",
        "system.ram": "none",
        "mem.swap": "none",
        "system.net": "none",
        "net.packets": "sum",
        "disk.io": "sum",
        "disk.ops": "sum",
        "disk.space": "sum",
        "cpufreq.cpufreq": "avg",
        "sensors.chip_sensor_power_average": "none",
        "sensors.chip_sensor_temperature": "none",
        "systemd.service": "none",
        "smartctl.device_temperature": "disk.individual",
        "smartctl.device_power_on_time": "disk.individual",
        "smartctl.device_smart_status": "disk.individual",
        "smartctl.device_ata_smart_error_log_count": "disk.individual"
    }
}