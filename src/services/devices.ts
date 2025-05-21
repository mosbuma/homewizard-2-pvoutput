import { config, type DeviceConfig } from '../config';
import logger from '../utils/logger';
import { pvoutputSendStatus } from './pvoutput';
import fs from 'fs';
import path from 'path';
export interface BaseEnergyData {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    timestamp: string;
}

export interface BaseDeviceData {
    wifi_ssid: string;
    wifi_strength: number;
}

export interface KWHMeterData extends BaseDeviceData {
    total_power_import_kwh: number;
    total_power_import_t1_kwh: number;
    total_power_export_kwh: number;
    total_power_export_t1_kwh: number;
    active_power_w: number;
    active_power_l1_w: number;
    active_voltage_v: number;
    active_current_a: number;
    active_reactive_power_var: number;
    active_apparent_power_va: number;
    active_power_factor: number;
    active_frequency_hz: number;
    active_apparent_current_a: number;
    active_reactive_current_a: number;
}

export interface SmartPlugData extends BaseDeviceData {
    total_power_import_kwh: number;
    total_power_import_t1_kwh: number;
    total_power_export_kwh: number;
    total_power_export_t1_kwh: number;
    active_power_w: number;
    active_power_l1_w: number;
    active_voltage_v: number;
    active_current_a: number;
    active_reactive_power_var: number;
    active_apparent_power_va: number;
    active_power_factor: number;
    active_frequency_hz: number;
}

export interface WaterMeterData extends BaseDeviceData {
    total_liter_m3: number;
    active_liter_lpm: number;
    total_liter_offset_m3: number;
}

export interface P1MeterData extends BaseDeviceData {
    smr_version: number;
    meter_model: string;
    unique_id: string;
    active_tariff: number;
    total_power_import_kwh: number;
    total_power_import_t1_kwh: number;
    total_power_import_t2_kwh: number;
    total_power_export_kwh: number;
    total_power_export_t1_kwh: number;
    total_power_export_t2_kwh: number;
    active_power_w: number;
    active_power_l1_w: number;
    active_voltage_l1_v: number;
    active_current_a: number;
    active_current_l1_a: number;
    voltage_sag_l1_count: number;
    voltage_swell_l1_count: number;
    any_power_fail_count: number;
    long_power_fail_count: number;
    total_gas_m3: number;
    gas_timestamp: number;
    gas_unique_id: string;
    external?: ExternalDevice[]; // can be deleted
}

export type EnergyData = BaseEnergyData & (KWHMeterData | SmartPlugData | WaterMeterData | P1MeterData);

const PVOUTPUT_ADDSTATUS_URL = 'https://pvoutput.org/service/r2/addstatus.jsp';
interface ExternalDevice {
    unique_id: string;
    type: string;
    timestamp: number;
    value: number;
    unit: string;
}

export class DeviceService {
    async pollDevices(): Promise<boolean> {
        const apiKey = process.env.PVOUTPUT_API_KEY;
        const outputfolder = process.env.OUTPUT_FOLDER;

        const timestamp = new Date();

        if(!outputfolder) {
            logger.error('Output folder is not configured');
            return false;
        }

        if(!fs.existsSync(outputfolder)) {
            logger.debug(`Creating output folder: ${outputfolder}`);
            fs.mkdirSync(outputfolder, { recursive: true });
        }

        if(!apiKey) {
            logger.error('PVOutput is not configured');
            return false;
        }

        const promises = config.devices.map(async (device) => {
            logger.debug(`Fetching data from ${device.name}`);
            if (!device.enabled) {
                logger.debug(`Skipping disabled device: ${device.name}`);
                return undefined;
            }

            try {
                const data = await this.fetchDeviceData(device, timestamp);

                // log data 
                try {
                    logger.debug(`Writing data to file: ${data}`);
                    const filename = `hw-${device.id}-${new Date().toISOString().split('T')[0]}.csv`;
                    const filePath = path.resolve(outputfolder, filename);

                    this.writeDataToFile(data, filePath);
                } catch (error) {
                    logger.error(`Error writing data to file: ${error}`);
                }

                if(device.pvoutput && device.pvoutput.enabled) {
                    const pvoutputdata = device.pvoutput.getStatusData(data);                    
                    if(pvoutputdata) {
                        logger.debug(`Sending data to PVOutput: ${pvoutputdata}`);
                        return pvoutputSendStatus(apiKey, device.pvoutput.systemId, pvoutputdata);
                    } else {
                        logger.debug(`No PVOutput data for ${device.name}`);
                        return false
                    }
                } else {
                    logger.debug(`No PVOutput for ${device.name}`);
                    return true;
                }
            } catch (error) {
                logger.error(`Error fetching data from ${device.name}:`, error);
                return undefined;
            }
        });

        const results = await Promise.all(promises);
        const success = results.filter(item=>item!==undefined).every(item=>item===true);
        if(!success) {
            logger.error('One or more devices failed to send data to PVOutput');
        }

        return success;
    }

    private async fetchDeviceData(device: DeviceConfig, timestamp: Date): Promise<EnergyData> {
        try {
            const baseURL = `http://${device.homewizard.ip}`;
            const response = await fetch(`${baseURL}/api/v1/data`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                logger.error(`Device ${device.name} HTTP error! status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as EnergyData;

            data.deviceId = device.id;
            data.deviceName = device.name;
            data.deviceType = device.type;
            data.timestamp = timestamp.toISOString();

            return data;
        } catch (error) {
            logger.error(`Error fetching data from ${device.name}:`, error);
            throw error;
        }
    }

    private writeDataToFile(data: EnergyData, filePath: string) {
        if('external' in data) {
            delete data.external;
        }

        if(!fs.existsSync(filePath)) {
            // add csv header to the file
            const header = Object.keys(data).map(key => `"${key}"`).join(',');
            fs.writeFileSync(filePath, header + '\n');
        }

        const values = Object.values(data).map(value => {
            if(typeof value === 'number') {
                return value.toString();
            } else if(typeof value === 'string') {
                return `"${value}"`;
            } else if(typeof value === 'boolean') {
                return value ? 'true' : 'false';
            } else if(typeof value === 'object') {
                return `'${JSON.stringify(value)}'`;
            } else if(value instanceof Date) {
                return `${value.toISOString()}`;
            } else {
                return value.toString();
            }
        });

        fs.appendFileSync(filePath, values.join(',') + ',\n');
    }
}
