import dotenv from 'dotenv';
import process from 'process';
import path from 'path';
import moment from 'moment';
import type { EnergyData, KWHMeterData, SmartPlugData } from '../services/devices';
import type { PVOutputAddStatusData } from '../services/pvoutput';
// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface DeviceConfig {
    enabled: boolean;
    id: string;
    name: string;
    type: string;
    homewizard: {
        ip: string;
        mac: string;
    };
    pvoutput: {
        enabled: boolean; // disable for this device
        systemId: string;
        type: 'solar-pv' | 'consumption';
        getStatusData: (data: EnergyData) => PVOutputAddStatusData | false;
    } | false;
}

export interface Config {
    polling: {
        interval: number;
    };
    timezone: string;
    logLevel: string;
    pvoutput: {
        apiKey: string | undefined;
    } | false;
    outputfolder: string;
    devices: DeviceConfig[];
}

export const config: Config = {
    polling: {
        interval: parseInt(process.env.POLLING_INTERVAL || '5', 10), // minutes
    },
    timezone: process.env.TIMEZONE || 'UTC',
    logLevel: process.env.LOG_LEVEL || 'info',
    outputfolder: process.env.OUTPUT_FOLDER || './logs',
    pvoutput: {
        apiKey: process.env.PVOUTPUT_API_KEY,
    },
    devices: [
        {
            enabled: true,
            id: 'p1',
            name: 'P1 Energy Meter',
            type: 'p1_meter',
            homewizard: {
                ip: process.env.HOMEWIZARD_P1_IP || '192.168.178.128',
                mac: '5C:2F:AF:1B:8D:92',
            },
            pvoutput: false
        },
        { 
            enabled: true, 
            id: 'water',
            name: 'Water Meter',
            type: 'water_meter',
            homewizard: {
                ip: process.env.HOMEWIZARD_WATER_IP || '192.168.178.127',
                mac: '5C:2F:AF:19:89:14',
            },      
            pvoutput: false,
        },
        { 
            enabled: true, 
            id: 'pv-dak',
            name: 'Energy Meter',
            type: 'kwh_meter',
            homewizard: {
                ip: process.env.HOMEWIZARD_ENERGY_IP || '192.168.178.114',
                mac: '5C:2F:AF:1D:E1:5C',
            },
            pvoutput: {
                enabled: true,
                systemId: '109097',
                type: 'solar-pv',
                getStatusData: (data: EnergyData) => {
                    const kwhMeterData = data as KWHMeterData;
                    return {
                        d: moment(data.timestamp).format('YYYYMMDD'),
                        t: moment(data.timestamp).format('HH:mm'),
                        v1: (1000 * kwhMeterData.total_power_export_kwh).toString(),
                        v2: (-1 * kwhMeterData.active_power_w).toString(),
                    } 
                }
            }
        },
        {
            enabled: true,
            id: 'pv-schuur',
            name: 'Energy Socket',
            type: 'smart_plug',
            homewizard: {
                ip: process.env.HOMEWIZARD_SOCKET_IP || '192.168.178.113',
                mac: '5C:2F:AF:1E:F1:40',
            },
            pvoutput: {
                enabled: true,
                systemId:'109096',
                type: 'solar-pv',
                getStatusData: (data: EnergyData) => {
                    const smartPlugData = data as SmartPlugData;
                    return {
                        d: moment(data.timestamp).format('YYYYMMDD'),
                        t: moment(data.timestamp).format('H:mm'),
                        v1: (1000 * smartPlugData.total_power_export_kwh).toString(),
                        v2: (-1 * smartPlugData.active_power_w).toString(),
                    } 
                }
            }
        },
        // {
        //     id: 'display',
        //     name: 'Display',
        //     type: 'display',
        //     ip: process.env.HOMEWIZARD_DISPLAY_IP || '192.168.178.117',
        //     mac: '5C:2F:AF:19:22:2A',
        //     enabled: true,
        // },
    ],
} as const;

// Validate required configuration
const requiredEnvVars: string[] = [];
requiredEnvVars.push('PVOUTPUT_API_KEY', 'POLLING_INTERVAL', 'TIMEZONE', 'LOG_LEVEL', 'OUTPUT_FOLDER');

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
