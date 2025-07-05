Page({
  data: {
    refreshing: false,
    systemStatus: 'normal',
    normalCount: 0,
    warningCount: 0,
    dangerCount: 0,
    
    // 水质监测子系统
    waterQualityStatus: 'normal',
    waterParams: {
      ph: { value: 7.2, status: 'normal' },
      turbidity: { value: 2.1, status: 'normal' },
      chlorine: { value: 0.5, status: 'normal' },
      temperature: { value: 38.5, status: 'normal' },
      tds: { value: 320, status: 'normal' }
    },
    
    // 健康监测子系统
    healthStatus: 'normal',
    healthParams: {
      heartRate: { value: 72, status: 'normal' },
      bloodOxygen: { value: 96, status: 'normal' },
      skinResistance: { value: 1200, status: 'normal' },
      bodyTemp: { value: 36.8, status: 'normal' },
      bloodPressure: { value: '120/80', status: 'normal' }
    },
    
    // 环境监测子系统
    environmentStatus: 'normal',
    environmentParams: {
      roomTemp: { value: 24.5, status: 'normal' },
      humidity: { value: 65, status: 'normal' },
      pm25: { value: 35, status: 'normal' },
      co2: { value: 650, status: 'normal' },
      light: { value: 450, status: 'normal' }
    },
    
    // 安全监测子系统
    safetyStatus: 'normal',
    safetyParams: {
      leakage: { value: 0.2, status: 'normal' },
      waterLevel: { value: '正常', status: 'normal' },
      doorLock: { value: '关', status: 'normal' },
      emergency: { value: '释放', status: 'normal' },
      tilt: { value: 2.5, status: 'normal' }
    },
    
    // 监测定时器
    monitoringTimer: null,
    updateInterval: 1000 // 1秒更新一次
  },

  onLoad() {
    this.startMonitoring();
  },

  onUnload() {
    this.stopMonitoring();
  },

  onShow() {
    this.startMonitoring();
  },

  onHide() {
    this.stopMonitoring();
  },

  // 启动监测
  startMonitoring() {
    if (this.data.monitoringTimer) {
      clearInterval(this.data.monitoringTimer);
    }
    
    const timer = setInterval(() => {
      this.updateMonitoringData();
    }, this.data.updateInterval);
    
    this.setData({ monitoringTimer: timer });
  },

  // 停止监测
  stopMonitoring() {
    if (this.data.monitoringTimer) {
      clearInterval(this.data.monitoringTimer);
      this.setData({ monitoringTimer: null });
    }
  },

  // 更新监测数据
  updateMonitoringData() {
    // 模拟实时数据更新
    const newData = this.generateSimulatedData();
    
    // 检查异常状态
    const statusData = this.checkAbnormalStatus(newData);
    
    this.setData({
      ...newData,
      ...statusData
    });
  },

  // 生成模拟数据
  generateSimulatedData() {
    return {
      waterParams: {
        ph: { 
          value: (7.0 + Math.random() * 0.4).toFixed(1), 
          status: 'normal' 
        },
        turbidity: { 
          value: (1.5 + Math.random() * 3).toFixed(1), 
          status: 'normal' 
        },
        chlorine: { 
          value: (0.3 + Math.random() * 0.4).toFixed(2), 
          status: 'normal' 
        },
        temperature: { 
          value: (35 + Math.random() * 8).toFixed(1), 
          status: 'normal' 
        },
        tds: { 
          value: Math.floor(200 + Math.random() * 300), 
          status: 'normal' 
        }
      },
      healthParams: {
        heartRate: { 
          value: Math.floor(65 + Math.random() * 20), 
          status: 'normal' 
        },
        bloodOxygen: { 
          value: Math.floor(92 + Math.random() * 6), 
          status: 'normal' 
        },
        skinResistance: { 
          value: Math.floor(800 + Math.random() * 2000), 
          status: 'normal' 
        },
        bodyTemp: { 
          value: (36.2 + Math.random() * 1.2).toFixed(1), 
          status: 'normal' 
        },
        bloodPressure: { 
          value: `${Math.floor(110 + Math.random() * 20)}/${Math.floor(70 + Math.random() * 15)}`, 
          status: 'normal' 
        }
      },
      environmentParams: {
        roomTemp: { 
          value: (22 + Math.random() * 6).toFixed(1), 
          status: 'normal' 
        },
        humidity: { 
          value: Math.floor(45 + Math.random() * 30), 
          status: 'normal' 
        },
        pm25: { 
          value: Math.floor(20 + Math.random() * 60), 
          status: 'normal' 
        },
        co2: { 
          value: Math.floor(500 + Math.random() * 400), 
          status: 'normal' 
        },
        light: { 
          value: Math.floor(300 + Math.random() * 500), 
          status: 'normal' 
        }
      },
      safetyParams: {
        leakage: { 
          value: (Math.random() * 2).toFixed(1), 
          status: 'normal' 
        },
        waterLevel: { 
          value: ['低', '正常', '高'][Math.floor(Math.random() * 3)], 
          status: 'normal' 
        },
        doorLock: { 
          value: ['开', '关'][Math.floor(Math.random() * 2)], 
          status: 'normal' 
        },
        emergency: { 
          value: '释放', 
          status: 'normal' 
        },
        tilt: { 
          value: (Math.random() * 8).toFixed(1), 
          status: 'normal' 
        }
      }
    };
  },

  // 检查异常状态
  checkAbnormalStatus(data) {
    let normalCount = 0, warningCount = 0, dangerCount = 0;
    
    // 检查水质参数
    const waterStatus = this.checkWaterQuality(data.waterParams);
    if (waterStatus === 'danger') dangerCount++;
    else if (waterStatus === 'warning') warningCount++;
    else normalCount++;
    
    // 检查健康参数
    const healthStatus = this.checkHealthStatus(data.healthParams);
    if (healthStatus === 'danger') dangerCount++;
    else if (healthStatus === 'warning') warningCount++;
    else normalCount++;
    
    // 检查环境参数
    const environmentStatus = this.checkEnvironmentStatus(data.environmentParams);
    if (environmentStatus === 'danger') dangerCount++;
    else if (environmentStatus === 'warning') warningCount++;
    else normalCount++;
    
    // 检查安全参数
    const safetyStatus = this.checkSafetyStatus(data.safetyParams);
    if (safetyStatus === 'danger') dangerCount++;
    else if (safetyStatus === 'warning') warningCount++;
    else normalCount++;
    
    // 更新参数状态
    this.updateParameterStatus(data);
    
    const systemStatus = dangerCount > 0 ? 'danger' : (warningCount > 0 ? 'warning' : 'normal');
    
    return {
      systemStatus,
      waterQualityStatus: waterStatus,
      healthStatus: healthStatus,
      environmentStatus: environmentStatus,
      safetyStatus: safetyStatus,
      normalCount,
      warningCount,
      dangerCount
    };
  },

  // 检查水质状态
  checkWaterQuality(params) {
    let hasDanger = false, hasWarning = false;
    
    // PH值检查
    if (params.ph.value < 6.5 || params.ph.value > 8.5) {
      params.ph.status = 'danger';
      hasDanger = true;
    } else if (params.ph.value < 6.8 || params.ph.value > 8.2) {
      params.ph.status = 'warning';
      hasWarning = true;
    } else {
      params.ph.status = 'normal';
    }
    
    // 浊度检查
    if (params.turbidity.value > 5) {
      params.turbidity.status = 'danger';
      hasDanger = true;
    } else if (params.turbidity.value > 3) {
      params.turbidity.status = 'warning';
      hasWarning = true;
    } else {
      params.turbidity.status = 'normal';
    }
    
    // 余氯检查
    if (params.chlorine.value < 0.2 || params.chlorine.value > 1.0) {
      params.chlorine.status = 'danger';
      hasDanger = true;
    } else if (params.chlorine.value < 0.3 || params.chlorine.value > 0.8) {
      params.chlorine.status = 'warning';
      hasWarning = true;
    } else {
      params.chlorine.status = 'normal';
    }
    
    // 水温检查
    if (params.temperature.value < 30 || params.temperature.value > 45) {
      params.temperature.status = 'danger';
      hasDanger = true;
    } else if (params.temperature.value < 32 || params.temperature.value > 43) {
      params.temperature.status = 'warning';
      hasWarning = true;
    } else {
      params.temperature.status = 'normal';
    }
    
    // TDS检查
    if (params.tds.value > 500) {
      params.tds.status = 'danger';
      hasDanger = true;
    } else if (params.tds.value > 400) {
      params.tds.status = 'warning';
      hasWarning = true;
    } else {
      params.tds.status = 'normal';
    }
    
    return hasDanger ? 'danger' : (hasWarning ? 'warning' : 'normal');
  },

  // 检查健康状态
  checkHealthStatus(params) {
    let hasDanger = false, hasWarning = false;
    
    // 心率检查
    if (params.heartRate.value < 50 || params.heartRate.value > 120) {
      params.heartRate.status = 'danger';
      hasDanger = true;
    } else if (params.heartRate.value < 60 || params.heartRate.value > 100) {
      params.heartRate.status = 'warning';
      hasWarning = true;
    } else {
      params.heartRate.status = 'normal';
    }
    
    // 血氧检查
    if (params.bloodOxygen.value < 90) {
      params.bloodOxygen.status = 'danger';
      hasDanger = true;
    } else if (params.bloodOxygen.value < 95) {
      params.bloodOxygen.status = 'warning';
      hasWarning = true;
    } else {
      params.bloodOxygen.status = 'normal';
    }
    
    // 皮肤电阻检查
    if (params.skinResistance.value < 200 || params.skinResistance.value > 3000) {
      params.skinResistance.status = 'danger';
      hasDanger = true;
    } else if (params.skinResistance.value < 500 || params.skinResistance.value > 2000) {
      params.skinResistance.status = 'warning';
      hasWarning = true;
    } else {
      params.skinResistance.status = 'normal';
    }
    
    // 体表温度检查
    if (params.bodyTemp.value < 35 || params.bodyTemp.value > 40) {
      params.bodyTemp.status = 'danger';
      hasDanger = true;
    } else if (params.bodyTemp.value < 36 || params.bodyTemp.value > 39) {
      params.bodyTemp.status = 'warning';
      hasWarning = true;
    } else {
      params.bodyTemp.status = 'normal';
    }
    
    // 血压检查（简化处理）
    params.bloodPressure.status = 'normal';
    
    return hasDanger ? 'danger' : (hasWarning ? 'warning' : 'normal');
  },

  // 检查环境状态
  checkEnvironmentStatus(params) {
    let hasDanger = false, hasWarning = false;
    
    // 室温检查
    if (params.roomTemp.value < 18 || params.roomTemp.value > 32) {
      params.roomTemp.status = 'danger';
      hasDanger = true;
    } else if (params.roomTemp.value < 20 || params.roomTemp.value > 30) {
      params.roomTemp.status = 'warning';
      hasWarning = true;
    } else {
      params.roomTemp.status = 'normal';
    }
    
    // 湿度检查
    if (params.humidity.value < 30 || params.humidity.value > 80) {
      params.humidity.status = 'danger';
      hasDanger = true;
    } else if (params.humidity.value < 40 || params.humidity.value > 70) {
      params.humidity.status = 'warning';
      hasWarning = true;
    } else {
      params.humidity.status = 'normal';
    }
    
    // PM2.5检查
    if (params.pm25.value > 75) {
      params.pm25.status = 'danger';
      hasDanger = true;
    } else if (params.pm25.value > 50) {
      params.pm25.status = 'warning';
      hasWarning = true;
    } else {
      params.pm25.status = 'normal';
    }
    
    // CO2检查
    if (params.co2.value > 1000) {
      params.co2.status = 'danger';
      hasDanger = true;
    } else if (params.co2.value > 800) {
      params.co2.status = 'warning';
      hasWarning = true;
    } else {
      params.co2.status = 'normal';
    }
    
    // 光照检查
    if (params.light.value > 800) {
      params.light.status = 'danger';
      hasDanger = true;
    } else if (params.light.value > 600) {
      params.light.status = 'warning';
      hasWarning = true;
    } else {
      params.light.status = 'normal';
    }
    
    return hasDanger ? 'danger' : (hasWarning ? 'warning' : 'normal');
  },

  // 检查安全状态
  checkSafetyStatus(params) {
    let hasDanger = false, hasWarning = false;
    
    // 漏电检查
    if (params.leakage.value > 5) {
      params.leakage.status = 'danger';
      hasDanger = true;
    } else if (params.leakage.value > 3) {
      params.leakage.status = 'warning';
      hasWarning = true;
    } else {
      params.leakage.status = 'normal';
    }
    
    // 水位检查
    if (params.waterLevel.value === '低') {
      params.waterLevel.status = 'danger';
      hasDanger = true;
    } else if (params.waterLevel.value === '高') {
      params.waterLevel.status = 'warning';
      hasWarning = true;
    } else {
      params.waterLevel.status = 'normal';
    }
    
    // 门锁检查
    if (params.doorLock.value === '开') {
      params.doorLock.status = 'danger';
      hasDanger = true;
    } else {
      params.doorLock.status = 'normal';
    }
    
    // 紧急按钮检查
    if (params.emergency.value === '按下') {
      params.emergency.status = 'danger';
      hasDanger = true;
    } else {
      params.emergency.status = 'normal';
    }
    
    // 倾斜角检查
    if (params.tilt.value > 15) {
      params.tilt.status = 'danger';
      hasDanger = true;
    } else if (params.tilt.value > 10) {
      params.tilt.status = 'warning';
      hasWarning = true;
    } else {
      params.tilt.status = 'normal';
    }
    
    return hasDanger ? 'danger' : (hasWarning ? 'warning' : 'normal');
  },

  // 更新参数状态
  updateParameterStatus(data) {
    this.setData({
      waterParams: data.waterParams,
      healthParams: data.healthParams,
      environmentParams: data.environmentParams,
      safetyParams: data.safetyParams
    });
  },

  // 刷新监测数据
  refreshMonitoring() {
    this.setData({ refreshing: true });
    
    setTimeout(() => {
      this.updateMonitoringData();
      this.setData({ refreshing: false });
      
      wx.showToast({
        title: '数据已刷新',
        icon: 'success'
      });
    }, 1000);
  },

  // 导出监测报告
  exportReport() {
    wx.showLoading({ title: '生成报告中...' });
    
    setTimeout(() => {
      wx.hideLoading();
      
      const reportData = {
        timestamp: new Date().toLocaleString(),
        systemStatus: this.data.systemStatus,
        waterQuality: this.data.waterParams,
        health: this.data.healthParams,
        environment: this.data.environmentParams,
        safety: this.data.safetyParams
      };
      
      // 保存报告到本地存储
      const reports = wx.getStorageSync('monitoringReports') || [];
      reports.unshift(reportData);
      if (reports.length > 10) reports.pop(); // 只保留最近10份报告
      wx.setStorageSync('monitoringReports', reports);
      
      wx.showModal({
        title: '报告已生成',
        content: '监测报告已保存到本地，可在历史记录中查看',
        showCancel: false
      });
    }, 2000);
  }
}); 