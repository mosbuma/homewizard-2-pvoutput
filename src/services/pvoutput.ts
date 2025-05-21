import logger from '../utils/logger';
export interface PVOutputAddStatusData {
    d: string;
    t: string;
    v1: string;
    v2: string;
}

const PVOUTPUT_ADDSTATUS_URL = 'https://pvoutput.org/service/r2/addstatus.jsp';

export const pvoutputSendStatus = async (apikey: string, systemId: string, data: PVOutputAddStatusData): Promise<boolean> => {
        try {
            const params = new URLSearchParams({
                d: data.d,
                t: data.t,
                v1: data.v1,
                v2: data.v2,
                c1: '1', // lifetime data for v1 and v3
            });

            const url = `${PVOUTPUT_ADDSTATUS_URL}?${params.toString()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-Pvoutput-Apikey': apikey,
                    'X-Pvoutput-SystemId': systemId,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const info = await response.text();
                logger.error('error', info);
                return false;
            }

            logger.info('Successfully sent data to PV-Output', JSON.stringify(data));
            return true;
        } catch (error) {
            logger.error('Error sending data to PV-Output:', error);
            return false;
        }
    }
