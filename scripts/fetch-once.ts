import { DeviceService } from '../src/services/devices';
import logger from '../src/utils/logger';

async function fetchOnce() {
    try {
        const devices = new DeviceService();
        logger.info('Fetching data from devices...');
        
        await devices.pollDevices();
    } catch (error) {
        logger.error('Error fetching data:', error);
        process.exit(1);
    }
}

fetchOnce(); 