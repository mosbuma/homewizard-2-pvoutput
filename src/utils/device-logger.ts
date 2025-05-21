import fs from 'fs';
import path from 'path';
import { EnergyData } from '../services/homewizard';

export class DeviceLogger {
    private readonly logDir: string;

    constructor() {
        this.logDir = path.resolve(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    logDeviceData(data: EnergyData): void {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0];
        const fileName = `hw-${data.deviceId}-${dateStr}.txt`;
        const filePath = path.join(this.logDir, fileName);

        const logEntry = {
            timestamp: `${dateStr} ${timeStr}`,
            deviceName: data.deviceName,
            deviceType: data.deviceType,
            power: data.power,
            energy: data.energy,
            waterUsage: data.waterUsage,
            gasUsage: data.gasUsage,
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(filePath, logLine);
    }
} 