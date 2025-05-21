# Energy Monitor

A Node.js/Bun application that polls multiple Homewizard devices for energy data and sends it to PV-Output.

## Features

- Supports multiple Homewizard devices:
  - P1 Energy Meter
  - Water Meter
  - KWH Meter (Solar PV)
  - Smart Plug (Solar PV)
- Parallel polling of all devices using Promise.all
- Individual log files for each device
- Configurable polling intervals
- Comprehensive error handling and logging
- Data validation and transformation
- PV-Output integration for solar data

## Prerequisites

- Node.js or Bun runtime
- Homewizard devices with API access
- PV-Output API credentials

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Create a `.env` file with your API credentials:
   ```
   # PV-Output Configuration
   PVOUTPUT_API_KEY=your_api_key

   # Device IP Addresses
   HOMEWIZARD_P1_IP=192.168.xxx.xxx
   HOMEWIZARD_WATER_IP=192.168.xxx.xxx
   HOMEWIZARD_ENERGY_IP=192.168.xxx.xxx
   HOMEWIZARD_SOCKET_IP=192.168.xxx.xxx

   # Application Configuration
   POLLING_INTERVAL=5
   TIMEZONE=Europe/Amsterdam
   LOG_LEVEL=info
   OUTPUT_FOLDER=./logs
   ```

## Configuration

The application can be configured through environment variables:

### PV-Output Settings
- `PVOUTPUT_API_KEY`: Your PV-Output API key

### Device Settings
- `HOMEWIZARD_P1_IP`: IP address of P1 Energy Meter
- `HOMEWIZARD_WATER_IP`: IP address of Water Meter
- `HOMEWIZARD_ENERGY_IP`: IP address of KWH Meter
- `HOMEWIZARD_SOCKET_IP`: IP address of Smart Plug

### Application Settings
- `POLLING_INTERVAL`: Time between API calls (in minutes)
- `TIMEZONE`: Your local timezone
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)
- `OUTPUT_FOLDER`: Directory where device data is logged in csv format

## Usage

Start the application:

```bash
bun run start
```

Fetch data once without starting the polling service:

```bash
bun run fetch-once
```

## Project Structure

```
energy-monitor/
├── src/
│   ├── services/
│   │   ├── devices.ts      # Device polling and data handling
│   │   └── pvoutput.ts     # PV-Output API integration
│   ├── config/
│   │   └── index.ts        # Application configuration
│   ├── utils/
│   │   ├── logger.ts       # Logging configuration
│   │   └── device-logger.ts # Device-specific logging
│   └── index.ts            # Application entry point
├── scripts/
│   └── fetch-once.ts       # One-time data fetch script
├── logs/                   # Device log files
├── .env.example           # Example environment configuration
└── package.json
```

## Logging

The application creates separate data files for each device in the configured output folder:
- Format: `hw-{device-id}-{date}.csv`
- Each device's data is logged with timestamp and relevant metrics
- Console output for real-time monitoring
- Error logs for troubleshooting

## API References

- [Homewizard API Documentation](https://api-documentation.homewizard.com/docs/introduction)
- [PV-Output API Documentation](https://pvoutput.org/help/api_specification.html)

## License

MIT
