# Synology DSM Lovelace Card

A beautiful, modern custom card for Home Assistant to monitor Synology NAS devices.

![Synology Card Preview](https://via.placeholder.com/800x500?text=Synology+Card+Preview)

## Features

- 🖥️ **CPU Monitoring** - Real-time CPU utilization with circular gauge and load averages
- 💾 **Memory Monitoring** - Memory usage with progress bar and available memory display
- 🌐 **Network Throughput** - Download/upload speeds with animated progress bars
- 🌡️ **Temperature** - Color-coded temperature display with status indicator
- 🔄 **DSM Update Status** - Shows an update panel only when a DSM update is available
- ⚡ **Quick Actions** - Reboot and shutdown buttons with confirmation dialogs
- 🔌 **Turned-Off Detection** - Shows a minimal unavailable state when the NAS is off or core sensors are unavailable
- 🎨 **Modern Design** - Beautiful gradient backgrounds with glassmorphism effects
- 📱 **Responsive Layout** - Works perfectly on mobile and desktop

## Requirements

- Home Assistant 2023.1.0 or higher
- Synology DSM Integration configured
- HACS (Home Assistant Community Store) - recommended for installation

## Installation

### Option 1: HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend** section
3. Click the **+** button to add a new repository
4. Search for "Synology DSM Card" or add the repository URL manually
5. Click **Download**
6. Restart Home Assistant
7. Add the card to your dashboard

### Option 2: Manual Installation

1. Download the `synology-card.js` file from the [releases page](https://github.com/your-repo/synology-card/releases)
2. Copy it to your Home Assistant `www` folder (create if it doesn't exist)
3. Add the resource to your dashboard:
   - Go to **Settings** → **Dashboards**
   - Click the three dots → **Resources**
   - Click **Add Resource**
   - URL: `/local/synology-card.js`
   - Resource type: **JavaScript Module**
4. Restart Home Assistant
5. Add the card to your dashboard

## Configuration

### Minimal Configuration

```yaml
type: custom:synology-card
device_name: backup
```

### Visual Editor

This card now supports the Lovelace visual editor. Use the **Synology Device** picker to select your NAS device directly.

### Full Configuration

```yaml
type: custom:synology-card
device_name: backup
show_cpu: true
show_memory: true
show_network: true
show_temperature: true
show_update: true
show_buttons: true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `device_name` | string | optional | The Synology instance prefix used in entity IDs (for YAML/manual config) |
| `device_id` | string | optional | Home Assistant device registry ID (recommended when using the visual editor) |
| `show_cpu` | boolean | `true` | Show CPU monitoring section |
| `show_memory` | boolean | `true` | Show memory monitoring section |
| `show_network` | boolean | `true` | Show network throughput section |
| `show_temperature` | boolean | `true` | Show temperature section |
| `show_update` | boolean | `true` | Show DSM update panel (only appears when an update is available) |
| `show_buttons` | boolean | `true` | Show reboot/shutdown buttons |

## Finding Your Device Name

The `device_name` is the instance name you set up when configuring the Synology DSM integration. You can find it by:

1. Go to **Settings** → **Devices & Services**
2. Find your Synology DSM integration
3. Click on it to see the device name

For example, if your entities are named `sensor.backup_cpu_utilization_total`, your device name is `backup`.

## Required Entities

This card expects the following entities from the Synology DSM integration:

| Entity Type | Entity ID Pattern |
|-------------|-------------------|
| CPU Utilization | `sensor.{device_name}_cpu_utilization_total` |
| CPU Load (5 min) | `sensor.{device_name}_cpu_load_average_5_min` |
| CPU Load (15 min) | `sensor.{device_name}_cpu_load_average_15_min` |
| Memory Usage | `sensor.{device_name}_memory_usage_real` |
| Memory Available | `sensor.{device_name}_memory_available_real` |
| Memory Total | `sensor.{device_name}_memory_total_real` |
| Download Speed | `sensor.{device_name}_download_throughput` |
| Upload Speed | `sensor.{device_name}_upload_throughput` |
| Temperature | `sensor.{device_name}_temperature_5` |
| DSM Update | `update.{device_name}_dsm_update` |
| Reboot Button | `button.{device_name}_reboot` |
| Shutdown Button | `button.{device_name}_shutdown` |

## Color Indicators

### CPU Usage
- 🟢 **Green**: 0-50% (Normal)
- 🟡 **Yellow**: 50-80% (Moderate)
- 🔴 **Red**: 80-100% (High)

### Memory Usage
- 🔵 **Blue**: 0-70% (Normal)
- 🟡 **Yellow**: 70-85% (Moderate)
- 🔴 **Red**: 85-100% (High)

### Temperature
- 🟢 **Green**: 0-40°C (Normal)
- 🟡 **Yellow**: 40-50°C (Warm)
- 🔴 **Red**: 50+°C (Hot)

## Troubleshooting

### Card Not Loading

1. Ensure the JavaScript file is in the correct location
2. Check that the resource is properly configured
3. Clear your browser cache
4. Check Home Assistant logs for errors

### Entities Not Showing

1. Verify your Synology DSM integration is working
2. Check that the `device_name` matches your integration
3. Ensure all required entities are available

If the NAS is off (or key entities such as `sensor.{device_name}_memory_total_real` are `unavailable`), the card will switch to a minimal "Turned off (unavailable)" view.

### Styling Issues

The card uses modern CSS features. If you experience styling issues:
1. Update your browser to the latest version
2. Try a different browser
3. Disable any custom themes temporarily

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/synology-card/issues) page
2. Create a new issue with detailed information about your problem

## Credits

- Inspired by the Synology DSM web interface
- Built for the Home Assistant community
- Uses standard Lovelace card patterns

## Changelog

### Version 1.0.0
- Initial release
- CPU, Memory, Network, Temperature monitoring
- DSM update status display
- Reboot and shutdown buttons
- Responsive design
- Color-coded status indicators
