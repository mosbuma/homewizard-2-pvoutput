import cron from 'node-cron';
import { config } from './config';
import logger from './utils/logger';
import { DeviceService } from './services/devices';

const devices = new DeviceService();

async function fetchAndSendData() {
    try {
        logger.info('Polling all devices...');
        await devices.pollDevices();
    } catch (error) {
        logger.error('Error in data processing cycle:', error);
    }
}

// Schedule the job to run every X minutes
const cronSchedule = `*/${config.polling.interval} * * * *`;
logger.info(`Starting energy monitor with schedule: ${cronSchedule}`);

cron.schedule(cronSchedule, fetchAndSendData);

// Run immediately on startup
fetchAndSendData().catch(error => {
    logger.error('Error in initial data fetch:', error);
    process.exit(1);
}); 