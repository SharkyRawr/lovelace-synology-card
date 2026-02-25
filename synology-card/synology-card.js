/**
 * Synology DSM Lovelace Card
 * A beautiful custom card for Home Assistant to monitor Synology NAS devices
 * 
 * Version: 1.0.0
 * Repository: https://github.com/your-repo/synology-card
 */

class SynologyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
    this._interval = null;
  }

  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static getConfigElement() {
    return document.createElement('synology-card-editor');
  }

  static getStubConfig() {
    return {
      device_name: 'backup',
      show_cpu: true,
      show_memory: true,
      show_network: true,
      show_temperature: true,
      show_buttons: true,
      show_update: true
    };
  }

  setConfig(config) {
    if (!config.device_name) {
      throw new Error('device_name is required');
    }
    this._config = {
      show_cpu: true,
      show_memory: true,
      show_network: true,
      show_temperature: true,
      show_buttons: true,
      show_update: true,
      ...config
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  connectedCallback() {
    this._interval = setInterval(() => {
      this.render();
    }, 2000);
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  getCardSize() {
    return 4;
  }

  _getEntityState(entityId) {
    if (!this._hass || !entityId) return null;
    const entity = this._hass.states[entityId];
    return entity ? entity.state : null;
  }

  _getEntityAttr(entityId, attr) {
    if (!this._hass || !entityId) return null;
    const entity = this._hass.states[entityId];
    return entity && entity.attributes ? entity.attributes[attr] : null;
  }

  _getEntityUnit(entityId) {
    return this._getEntityAttr(entityId, 'unit_of_measurement') || '';
  }

  _formatSpeed(value) {
    if (value === null || value === undefined) return '--';
    const num = parseFloat(value);
    if (isNaN(num)) return '--';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + ' GB/s';
    }
    return num.toFixed(1) + ' MB/s';
  }

  _formatBytes(value) {
    if (value === null || value === undefined) return '--';
    const num = parseFloat(value);
    if (isNaN(num)) return '--';
    return num.toFixed(1);
  }

  _getColorForValue(value, type) {
    if (type === 'cpu') {
      if (value > 80) return '#ef4444';
      if (value > 50) return '#f59e0b';
      return '#22c55e';
    } else if (type === 'memory') {
      if (value > 85) return '#ef4444';
      if (value > 70) return '#f59e0b';
      return '#3b82f6';
    } else if (type === 'temperature') {
      if (value > 50) return '#ef4444';
      if (value > 40) return '#f59e0b';
      return '#22c55e';
    }
    return '#22c55e';
  }

  _handleAction(action, entityId) {
    if (!this._hass) return;
    
    if (action === 'press') {
      this._hass.callService('button', 'press', { entity_id: entityId });
    }
  }

  _createCircularProgress(value, color, size = 70) {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    
    return `
      <svg width="${size}" height="${size}" class="circular-progress" viewBox="0 0 ${size} ${size}">
        <circle
          cx="${size/2}"
          cy="${size/2}"
          r="${radius}"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          stroke-width="6"
        />
        <circle
          cx="${size/2}"
          cy="${size/2}"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="6"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.5s ease;"
        />
      </svg>
    `;
  }

  render() {
    if (!this._config || !this._hass) {
      this.shadowRoot.innerHTML = '<div style="padding: 20px;">Loading...</div>';
      return;
    }

    const device = this._config.device_name;
    
    // Entity IDs
    const entities = {
      cpuUtil: `sensor.${device}_cpu_utilization_total`,
      cpuLoad5: `sensor.${device}_cpu_load_average_5_min`,
      cpuLoad15: `sensor.${device}_cpu_load_average_15_min`,
      cpuUser: `sensor.${device}_cpu_utilization_user`,
      memUsage: `sensor.${device}_memory_usage_real`,
      memAvail: `sensor.${device}_memory_available_real`,
      memTotal: `sensor.${device}_memory_total_real`,
      memSwap: `sensor.${device}_memory_available_swap`,
      downSpeed: `sensor.${device}_download_throughput`,
      upSpeed: `sensor.${device}_upload_throughput`,
      temp: `sensor.${device}_temperature_5`,
      update: `update.${device}_dsm_update`,
      reboot: `button.${device}_reboot`,
      shutdown: `button.${device}_shutdown`
    };

    // Get values
    const cpuVal = parseFloat(this._getEntityState(entities.cpuUtil)) || 0;
    const cpuLoad5 = this._getEntityState(entities.cpuLoad5) || '--';
    const cpuLoad15 = this._getEntityState(entities.cpuLoad15) || '--';
    const memUsage = parseFloat(this._getEntityState(entities.memUsage)) || 0;
    const memAvail = parseFloat(this._getEntityState(entities.memAvail)) || 0;
    const memTotal = parseFloat(this._getEntityState(entities.memTotal)) || 0;
    const downSpeed = parseFloat(this._getEntityState(entities.downSpeed)) || 0;
    const upSpeed = parseFloat(this._getEntityState(entities.upSpeed)) || 0;
    const temp = parseFloat(this._getEntityState(entities.temp)) || 0;
    const updateState = this._getEntityState(entities.update);
    const updateInstalled = this._getEntityAttr(entities.update, 'installed_version') || 'Unknown';

    const cpuColor = this._getColorForValue(cpuVal, 'cpu');
    const memColor = this._getColorForValue(memUsage, 'memory');
    const tempColor = this._getColorForValue(temp, 'temperature');

    const tempStatus = temp > 50 ? 'Hot' : temp > 40 ? 'Warm' : 'Normal';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .card {
          background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          border-radius: 20px;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 16px;
        }
        
        .icon-container {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .icon-container svg {
          width: 32px;
          height: 32px;
          color: #22d3ee;
        }
        
        .title {
          flex: 1;
        }
        
        .title h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        }
        
        .status-text {
          font-size: 13px;
          color: #22c55e;
          font-weight: 500;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .stat-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .stat-label-icon {
          padding: 6px;
          border-radius: 8px;
        }
        
        .stat-label-icon svg {
          width: 18px;
          height: 18px;
          display: block;
        }
        
        .stat-label-text {
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
        }
        
        .stat-badge {
          font-size: 11px;
          color: #64748b;
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .stat-content {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }
        
        .stat-unit {
          font-size: 16px;
          color: #94a3b8;
          margin-left: 4px;
        }
        
        .circular-progress {
          transform: rotate(-90deg);
        }
        
        .stat-details {
          margin-top: 12px;
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }
        
        .stat-row-label {
          color: #64748b;
        }
        
        .stat-row-value {
          color: #e2e8f0;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 12px;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease, background 0.3s ease;
        }
        
        .network-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .network-row:last-child {
          margin-bottom: 0;
        }
        
        .network-icon {
          padding: 6px;
          border-radius: 8px;
        }
        
        .network-icon svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        
        .network-info {
          flex: 1;
        }
        
        .network-value {
          font-size: 20px;
          font-weight: 600;
        }
        
        .network-unit {
          font-size: 12px;
          color: #64748b;
          margin-left: 4px;
        }
        
        .network-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }
        
        .network-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        
        .temp-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        
        .temp-status {
          text-align: right;
        }
        
        .temp-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-bottom: 4px;
          margin-left: auto;
        }
        
        .temp-label {
          font-size: 12px;
          font-weight: 500;
        }
        
        .temp-scale {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .temp-scale-label {
          font-size: 11px;
          color: #64748b;
        }
        
        .temp-scale-bar {
          flex: 1;
          height: 8px;
          background: linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%);
          border-radius: 4px;
          position: relative;
        }
        
        .temp-indicator {
          position: absolute;
          width: 4px;
          height: 16px;
          background: white;
          border-radius: 2px;
          top: -4px;
          transition: left 0.5s ease;
        }
        
        .update-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .update-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .update-icon {
          padding: 8px;
          border-radius: 8px;
          background: rgba(34, 197, 94, 0.1);
        }
        
        .update-icon svg {
          width: 18px;
          height: 18px;
          display: block;
          color: #22c55e;
        }
        
        .update-text {
          font-weight: 500;
        }
        
        .update-version {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }
        
        .update-badge {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .update-badge.warning {
          background: rgba(245, 158, 11, 0.2);
          border-color: rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }
        
        .buttons {
          display: flex;
          gap: 12px;
        }
        
        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .btn svg {
          width: 18px;
          height: 18px;
        }
        
        .btn-reboot {
          border-color: rgba(251, 146, 60, 0.3);
          color: #fb923c;
          background: rgba(251, 146, 60, 0.1);
        }
        
        .btn-reboot:hover {
          background: rgba(251, 146, 60, 0.2);
        }
        
        .btn-shutdown {
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        .btn-shutdown:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        
        @media (max-width: 600px) {
          .grid {
            grid-template-columns: 1fr;
          }
          
          .buttons {
            flex-direction: column;
          }
          
          .btn {
            justify-content: center;
          }
        }
      </style>
      
      <div class="card">
        <div class="header">
          <div class="icon-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M6 10h.01M6 14h.01"/>
              <path d="M10 10h8M10 14h8"/>
            </svg>
          </div>
          <div class="title">
            <h2>Synology ${this._config.device_name.charAt(0).toUpperCase() + this._config.device_name.slice(1)}</h2>
            <div class="status-badge">
              <span class="status-dot"></span>
              <span class="status-text">Online</span>
            </div>
          </div>
        </div>
        
        <div class="grid">
          ${this._config.show_cpu !== false ? `
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-label">
                <div class="stat-label-icon" style="background: rgba(34, 197, 94, 0.1);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="${cpuColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <rect x="9" y="9" width="6" height="6"/>
                    <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>
                  </svg>
                </div>
                <span class="stat-label-text">CPU</span>
              </div>
              <span class="stat-badge">8 Cores</span>
            </div>
            <div class="stat-content">
              <div>
                <span class="stat-value" style="color: ${cpuColor};">${cpuVal.toFixed(1)}</span>
                <span class="stat-unit">%</span>
              </div>
              ${this._createCircularProgress(cpuVal, cpuColor)}
            </div>
            <div class="stat-details">
              <div class="stat-row">
                <span class="stat-row-label">Load 5m</span>
                <span class="stat-row-value">${cpuLoad5}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row-label">Load 15m</span>
                <span class="stat-row-value">${cpuLoad15}</span>
              </div>
            </div>
          </div>
          ` : ''}
          
          ${this._config.show_memory !== false ? `
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-label">
                <div class="stat-label-icon" style="background: rgba(59, 130, 246, 0.1);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="${memColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 19v-3M10 19v-6M14 19v-9M18 19V5"/>
                  </svg>
                </div>
                <span class="stat-label-text">Memory</span>
              </div>
              <span class="stat-badge">DDR4</span>
            </div>
            <div class="stat-content">
              <div>
                <span class="stat-value" style="color: ${memColor};">${memUsage.toFixed(1)}</span>
                <span class="stat-unit">%</span>
              </div>
              ${this._createCircularProgress(memUsage, memColor)}
            </div>
            <div class="stat-details">
              <div class="stat-row">
                <span class="stat-row-label">Used</span>
                <span class="stat-row-value">${this._formatBytes(memTotal - memAvail)} / ${this._formatBytes(memTotal)} GB</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${memUsage}%; background: ${memColor};"></div>
            </div>
          </div>
          ` : ''}
          
          ${this._config.show_network !== false ? `
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-label">
                <div class="stat-label-icon" style="background: rgba(6, 182, 212, 0.1);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
                  </svg>
                </div>
                <span class="stat-label-text">Network</span>
              </div>
              <span class="stat-badge">1 Gbps</span>
            </div>
            <div class="network-row">
              <div class="network-icon" style="background: rgba(34, 197, 94, 0.1);">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              </div>
              <div class="network-info">
                <div>
                  <span class="network-value">${downSpeed.toFixed(1)}</span>
                  <span class="network-unit">MB/s</span>
                </div>
                <div class="network-bar">
                  <div class="network-bar-fill" style="width: ${Math.min(100, downSpeed / 1.25 * 100)}%; background: linear-gradient(90deg, #22c55e, #4ade80);"></div>
                </div>
              </div>
            </div>
            <div class="network-row">
              <div class="network-icon" style="background: rgba(59, 130, 246, 0.1);">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
              </div>
              <div class="network-info">
                <div>
                  <span class="network-value">${upSpeed.toFixed(1)}</span>
                  <span class="network-unit">MB/s</span>
                </div>
                <div class="network-bar">
                  <div class="network-bar-fill" style="width: ${Math.min(100, upSpeed)}%; background: linear-gradient(90deg, #3b82f6, #60a5fa);"></div>
                </div>
              </div>
            </div>
          </div>
          ` : ''}
          
          ${this._config.show_temperature !== false ? `
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-label">
                <div class="stat-label-icon" style="background: rgba(${tempColor === '#22c55e' ? '34, 197, 94' : tempColor === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.1);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="${tempColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
                  </svg>
                </div>
                <span class="stat-label-text">Temperature</span>
              </div>
            </div>
            <div class="temp-container">
              <div>
                <span class="stat-value" style="color: ${tempColor};">${temp.toFixed(0)}</span>
                <span class="stat-unit">°C</span>
              </div>
              <div class="temp-status">
                <div class="temp-dot" style="background: ${tempColor};"></div>
                <div class="temp-label" style="color: ${tempColor};">${tempStatus}</div>
              </div>
            </div>
            <div class="temp-scale">
              <span class="temp-scale-label">35°C</span>
              <div class="temp-scale-bar">
                <div class="temp-indicator" style="left: calc(${Math.min(100, Math.max(0, ((temp - 30) / 30) * 100))}% - 2px);"></div>
              </div>
              <span class="temp-scale-label">60°C</span>
            </div>
          </div>
          ` : ''}
        </div>
        
        ${this._config.show_update !== false ? `
        <div class="update-card">
          <div class="update-info">
            <div class="update-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div class="update-text">DSM Update</div>
              <div class="update-version">Version ${updateInstalled}</div>
            </div>
          </div>
          <div class="update-badge ${updateState === 'on' ? 'warning' : ''}">
            ${updateState === 'on' ? 'Update Available' : 'Up to date'}
          </div>
        </div>
        ` : ''}
        
        ${this._config.show_buttons !== false ? `
        <div class="buttons">
          <button class="btn btn-reboot" id="reboot-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reboot
          </button>
          <button class="btn btn-shutdown" id="shutdown-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04"/>
            </svg>
            Shutdown
          </button>
        </div>
        ` : ''}
      </div>
    `;

    // Add event listeners
    const rebootBtn = this.shadowRoot.getElementById('reboot-btn');
    const shutdownBtn = this.shadowRoot.getElementById('shutdown-btn');
    
    if (rebootBtn) {
      rebootBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reboot the NAS?')) {
          this._handleAction('press', entities.reboot);
        }
      });
    }
    
    if (shutdownBtn) {
      shutdownBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to shutdown the NAS?')) {
          this._handleAction('press', entities.shutdown);
        }
      });
    }
  }
}

// Register the card
customElements.define('synology-card', SynologyCard);

// Register with Lovelace
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'synology-card',
  name: 'Synology DSM Card',
  description: 'A beautiful card to monitor Synology NAS devices'
});
