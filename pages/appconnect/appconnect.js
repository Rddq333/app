const api = require('../../utils/api');
Page({
  data: {
    connected: false,
    connectType: '蓝牙',
    connectOptions: ['蓝牙', 'Wi-Fi'],
    devices: [
      // 示例设备
      { id: 1, name: '设备A', status: '已连接' },
      { id: 2, name: '设备B', status: '未连接' }
    ],
    selectedDevice: null,
    firmwareVersion: 'v1.0.0',
    upgradeAvailable: false,
    usageRecords: [
      // 示例记录
      { time: '2024-05-01 10:00', action: '启动水疗' },
      { time: '2024-05-01 11:00', action: '启动艾灸' }
    ],
    bluetoothEnabled: false,
    isSearching: false,  // 是否正在搜索设备
    availableDevices: [
      { id: 'A', name: '设备A', connected: false, signalStrength: -45 },
      { id: 'B', name: '设备B', connected: false, signalStrength: -52 }
    ],
    historyDevices: [],
    deviceRunning: false,  // 设备运行状态
    hasConnectedDevice: false,  // 是否有已连接设备
    currentConnectedDevice: null  // 当前连接的设备
  },
  onLoad() {
    this.loadPageState();
  },
  
  onShow() {
    // 每次显示页面时重新加载状态
    this.loadPageState();
  },
  
  // 加载页面状态
  loadPageState() {
    const history = wx.getStorageSync('historyDevices') || [];
    const running = wx.getStorageSync('deviceRunning') || false;
    const bluetoothEnabled = wx.getStorageSync('bluetoothEnabled') || false;
    
    // 检查是否有已连接设备
    const connectedDevice = history.find(device => device.connected);
    const hasConnected = !!connectedDevice;
    
    // 更新可用设备状态
    const availableDevices = this.data.availableDevices.map(device => {
      const historyDevice = history.find(h => h.id === device.id);
      return {
        ...device,
        connected: historyDevice ? historyDevice.connected : false
      };
    });
    
    this.setData({ 
      historyDevices: history,
      deviceRunning: running,
      hasConnectedDevice: hasConnected,
      bluetoothEnabled: bluetoothEnabled,
      availableDevices: availableDevices,
      currentConnectedDevice: connectedDevice
    });
  },
  
  onConnectTypeChange(e) {
    this.setData({ connectType: this.data.connectOptions[e.detail.value] });
  },
  bindDevice(e) {
    // 绑定设备逻辑
    wx.showToast({ title: '设备已绑定', icon: 'success' });
  },
  unbindDevice(e) {
    // 解绑设备逻辑
    wx.showToast({ title: '设备已解绑', icon: 'success' });
  },
  selectDevice(e) {
    this.setData({ selectedDevice: this.data.devices[e.currentTarget.dataset.index] });
  },
  upgradeFirmware() {
    // 固件升级逻辑
    wx.showToast({ title: '固件升级中...', icon: 'loading' });
    setTimeout(() => {
      this.setData({ firmwareVersion: 'v1.1.0', upgradeAvailable: false });
      wx.showToast({ title: '升级完成', icon: 'success' });
    }, 2000);
  },
  viewUsageRecords() {
    wx.showModal({
      title: '使用记录',
      content: this.data.usageRecords.map(r => r.time + ' ' + r.action).join('\n'),
      showCancel: false
    });
  },
  connectApp() {
    api.connectApp().then(res => {
      this.setData({ connected: res.connected });
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
  addDevice(e) {
    const id = e.currentTarget.dataset.id;
    let { availableDevices, historyDevices } = this.data;
    const device = availableDevices.find(d => d.id === id);
    if (device && !historyDevices.some(d => d.id === id)) {
      historyDevices = [...historyDevices, device];
      wx.setStorageSync('historyDevices', historyDevices);
      availableDevices = availableDevices.map(d => d.id === id ? { ...d, added: true } : d);
      this.setData({ historyDevices, availableDevices });
    }
  },
  // 切换蓝牙开关
  toggleBluetooth() {
    const enabled = !this.data.bluetoothEnabled;
    this.setData({ bluetoothEnabled: enabled });
    wx.setStorageSync('bluetoothEnabled', enabled);
    
    if (enabled) {
      // 开启蓝牙后开始搜索设备
      this.startSearchingDevices();
      wx.showToast({
        title: '蓝牙已开启',
        icon: 'success'
      });
    } else {
      // 关闭蓝牙时，重置所有状态
      this.stopSearchingDevices();
      this.disconnectAllDevices();
      wx.showToast({
        title: '蓝牙已关闭',
        icon: 'none'
      });
    }
  },
  
  // 开始搜索设备
  startSearchingDevices() {
    this.setData({ isSearching: true });
    
    // 模拟搜索过程
    setTimeout(() => {
      this.setData({ isSearching: false });
      wx.showToast({
        title: '发现可用设备',
        icon: 'success'
      });
    }, 2000);
  },
  
  // 停止搜索设备
  stopSearchingDevices() {
    this.setData({ isSearching: false });
  },
  
  // 断开所有设备连接
  disconnectAllDevices() {
    const devices = this.data.availableDevices.map(dev => ({
      ...dev,
      connected: false
    }));
    
    // 更新历史设备状态
    const historyDevices = this.data.historyDevices.map(dev => ({
      ...dev,
      connected: false
    }));
    
    this.setData({ 
      availableDevices: devices,
      historyDevices: historyDevices,
      deviceRunning: false,
      hasConnectedDevice: false,
      currentConnectedDevice: null
    });
    
    // 保存状态
    wx.setStorageSync('historyDevices', historyDevices);
    wx.setStorageSync('deviceRunning', false);
    
    // 清除理疗模式
    wx.removeStorageSync('currentTherapyMode');
  },
  
  // 连接设备
  connectDevice(e) {
    const device = e.currentTarget.dataset.device;
    
    // 如果设备已连接，则断开连接
    if (device.connected) {
      this.disconnectDevice(device);
      return;
    }
    
    // 如果已有其他设备连接，先断开
    if (this.data.hasConnectedDevice) {
      wx.showModal({
        title: '提示',
        content: '只能连接一个设备，是否断开当前设备并连接新设备？',
        success: (res) => {
          if (res.confirm) {
            this.disconnectCurrentDevice();
            setTimeout(() => {
              this.connectToDevice(device);
            }, 500);
          }
        }
      });
      return;
    }
    
    // 直接连接设备
    this.connectToDevice(device);
  },
  
  // 连接到指定设备
  connectToDevice(device) {
    // 显示连接中
    wx.showLoading({
      title: '连接中...'
    });

    // 模拟连接过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新设备状态
      const devices = this.data.availableDevices.map(dev => 
        dev.id === device.id ? { ...dev, connected: true } : { ...dev, connected: false }
      );
      
      // 添加到历史设备
      const connectTime = new Date().toLocaleString();
      const historyDevice = {
        ...device,
        connectTime: connectTime,
        connected: true
      };
      
      let history = this.data.historyDevices;
      // 如果设备已存在，更新连接时间
      const existingIndex = history.findIndex(h => h.id === device.id);
      if (existingIndex >= 0) {
        history[existingIndex] = historyDevice;
      } else {
        history = [...history, historyDevice];
      }
      
      // 保存到本地存储
      wx.setStorageSync('historyDevices', history);
      
      this.setData({
        availableDevices: devices,
        historyDevices: history,
        hasConnectedDevice: true,
        currentConnectedDevice: historyDevice
      });

      // 显示连接成功
      wx.showToast({
        title: `已连接${device.name}`,
        icon: 'success'
      });
    }, 1500);
  },
  
  // 断开指定设备
  disconnectDevice(device) {
    wx.showModal({
      title: '确认断开',
      content: `确定要断开${device.name}吗？`,
      success: (res) => {
        if (res.confirm) {
          this.disconnectCurrentDevice();
        }
      }
    });
  },
  
  // 断开当前连接设备
  disconnectCurrentDevice() {
    const devices = this.data.availableDevices.map(dev => ({
      ...dev,
      connected: false
    }));
    
    // 更新历史设备状态
    const historyDevices = this.data.historyDevices.map(dev => ({
      ...dev,
      connected: false
    }));
    
    this.setData({ 
      availableDevices: devices,
      historyDevices: historyDevices,
      deviceRunning: false,
      hasConnectedDevice: false,
      currentConnectedDevice: null
    });
    
    // 保存状态
    wx.setStorageSync('historyDevices', historyDevices);
    wx.setStorageSync('deviceRunning', false);
    
    // 清除理疗模式
    wx.removeStorageSync('currentTherapyMode');
    
    wx.showToast({
      title: '设备已断开',
      icon: 'none'
    });
  },
  
  // 切换设备运行状态
  toggleDeviceRunning() {
    const running = !this.data.deviceRunning;
    this.setData({ deviceRunning: running });
    wx.setStorageSync('deviceRunning', running);
    
    if (running) {
      // 设备启动时，清除任何已存在的理疗模式
      wx.removeStorageSync('currentTherapyMode');
      wx.showToast({
        title: '设备已启动',
        icon: 'success'
      });
    } else {
      // 设备停止时，清除所有理疗模式
      wx.removeStorageSync('currentTherapyMode');
      wx.showToast({
        title: '设备已停止',
        icon: 'none'
      });
    }
  }
}); 