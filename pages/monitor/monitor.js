const api = require('../../utils/api');
Page({
  data: {
    // 水质监测
    waterQuality: {
      ph: 7.0,
      turbidity: 0.5,
      chlorine: 0.3
    },
    // 健康检查
    health: {
      heartRate: 75,
      bloodPressure: '120/80',
      bodyTemp: 36.5
    },
    // 环境监测
    environment: {
      temp: 36,
      humidity: 60,
      co2: 400
    },
    // 安全检测
    safety: {
      smoke: false,
      leak: false,
      door: 'closed'
    },
    // 可视化数据（可用于图表）
    chartData: {},
    // 理疗模式相关
    currentTherapyMode: null,
    runningTime: '00:00',
    remainingTime: '00:00',
    modeStartTime: null,
    isPaused: false,
    pausedElapsed: 0
  },
  onLoad() {
    this.loadTherapyMode();
    this.updateAllData();
    this.timer = setInterval(this.updateAllData, 5000);
    this.timeTimer = setInterval(this.updateTime, 1000);
  },
  onUnload() {
    clearInterval(this.timer);
    clearInterval(this.timeTimer);
  },
  onShow() {
    this.loadTherapyMode();
  },
  
  // 加载理疗模式信息
  loadTherapyMode() {
    const currentMode = wx.getStorageSync('currentTherapyMode');
    if (currentMode) {
      this.setData({
        currentTherapyMode: currentMode,
        modeStartTime: currentMode.startTime
      });
      this.updateTime();
    }
  },
  
  // 更新时间显示
  updateTime() {
    if (!this.data.modeStartTime || this.data.isPaused) return;
    const startTime = new Date(this.data.modeStartTime);
    const now = new Date();
    const elapsed = this.data.pausedElapsed + Math.floor((now - startTime) / 1000);
    
    // 计算运行时长
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    const runningTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 计算剩余时间（根据模式时长）
    const modeDuration = this.getModeDuration(this.data.currentTherapyMode.key);
    const remaining = Math.max(0, modeDuration - elapsed);
    const remainingHours = Math.floor(remaining / 3600);
    const remainingMinutes = Math.floor((remaining % 3600) / 60);
    const remainingSeconds = remaining % 60;
    
    const remainingTime = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    this.setData({
      runningTime,
      remainingTime
    });
    
    // 如果时间到了，自动停止
    if (remaining <= 0) {
      this.stopTherapyMode();
    }
  },
  
  // 获取模式时长（秒）
  getModeDuration(modeKey) {
    const durations = {
      classic: 60 * 60,    // 60分钟
      relax: 45 * 60,      // 45分钟
      recovery: 90 * 60,   // 90分钟
      quick: 30 * 60,      // 30分钟
      fullbody: 120 * 60,  // 120分钟
      custom: 60 * 60      // 默认60分钟
    };
    return durations[modeKey] || 60 * 60;
  },
  
  // 暂停/继续理疗模式
  togglePauseTherapy() {
    if (!this.data.isPaused) {
      // 暂停
      const startTime = new Date(this.data.modeStartTime);
      const now = new Date();
      const elapsed = this.data.pausedElapsed + Math.floor((now - startTime) / 1000);
      this.setData({
        isPaused: true,
        pausedElapsed: elapsed
      });
      wx.showToast({ title: '已暂停', icon: 'none' });
    } else {
      // 继续
      const now = new Date();
      this.setData({
        isPaused: false,
        modeStartTime: now,
      });
      wx.showToast({ title: '已继续', icon: 'none' });
    }
  },
  
  // 停止理疗模式
  stopTherapyMode() {
    wx.setStorageSync('currentTherapyMode', null);
    wx.setStorageSync('deviceRunning', false);
    this.setData({
      currentTherapyMode: null,
      runningTime: '00:00:00',
      remainingTime: '00:00:00',
      modeStartTime: null,
      isPaused: false,
      pausedElapsed: 0
    });
    wx.showToast({
      title: '理疗模式已完成',
      icon: 'success'
    });
  },
  
  updateAllData: function() {
    // TODO: 调用api获取所有监测数据，示例为静态数据
    // 实际开发中应合并后端接口
    this.setData({
      waterQuality: {
        ph: (6.8 + Math.random() * 0.4).toFixed(2),
        turbidity: (0.4 + Math.random() * 0.2).toFixed(2),
        chlorine: (0.2 + Math.random() * 0.2).toFixed(2)
      },
      health: {
        heartRate: 70 + Math.floor(Math.random() * 10),
        bloodPressure: '120/80',
        bodyTemp: (36.3 + Math.random() * 0.4).toFixed(1)
      },
      environment: {
        temp: 35 + Math.floor(Math.random() * 3),
        humidity: 58 + Math.floor(Math.random() * 5),
        co2: 390 + Math.floor(Math.random() * 30)
      },
      safety: {
        smoke: Math.random() > 0.95,
        leak: Math.random() > 0.98,
        door: Math.random() > 0.5 ? 'closed' : 'open'
      },
      chartData: {
        // 示例：可用于传递给图表组件的数据
        temp: [35, 36, 37, 36, 35],
        ph: [7.0, 6.9, 7.1, 7.0, 6.95]
      }
    });
  },
  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route !== 'pages/index/index') {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  // 刷新监测数据按钮事件
  refreshMonitorData() {
    this.updateAllData();
    wx.showToast({
      title: '数据已刷新',
      icon: 'success'
    });
  },

  // 导出监测报告按钮事件
  exportMonitorReport() {
    // 这里可根据实际需求导出数据，暂用toast占位
    wx.showToast({
      title: '报告已导出',
      icon: 'success'
    });
  }
}); 