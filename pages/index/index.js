// index.js
Page({
  data: {
    deviceName: '智能洗浴机器人',
    deviceNameEn: 'Smart Bath Robot',
    status: '关闭',  // 默认关闭状态
    temp: '36.5°C',
    currentRunningDevice: '',  // 当前运行设备名称
    // 理疗模式配置
    therapyModes: {
      classic: {
        name: '经典理疗',
        description: '艾灸 + 药浴 + 音乐',
        duration: '60分钟',
        icon: 'star',
        color: '#f59e0b',
        features: ['艾灸理疗', '药浴子系统', '音乐疗愈'],
        page: 'moxibustion-enhanced'
      },
      relax: {
        name: '深度放松',
        description: '超音波水疗 + 香氛 + 音乐',
        duration: '45分钟',
        icon: 'flower-o',
        color: '#8b5cf6',
        features: ['超音波水疗', '香氛疗愈', '音乐疗愈'],
        page: 'hydrotherapy'
      },
      recovery: {
        name: '康复理疗',
        description: '红外理疗 + 艾灸 + 药浴',
        duration: '90分钟',
        icon: 'like',
        color: '#10b981',
        features: ['红外理疗', '艾灸理疗', '药浴子系统'],
        page: 'infrared'
      },
      quick: {
        name: '快速舒缓',
        description: '超音波水疗 + 香氛',
        duration: '30分钟',
        icon: 'clock',
        color: '#3b82f6',
        features: ['超音波水疗', '香氛疗愈'],
        page: 'hydrotherapy'
      },
      fullbody: {
        name: '全身调理',
        description: '全功能组合',
        duration: '120分钟',
        icon: 'user-circle-o',
        color: '#ef4444',
        features: ['艾灸理疗', '药浴子系统', '超音波水疗', '红外理疗', '香氛疗愈', '音乐疗愈'],
        page: 'monitor'
      },
      custom: {
        name: '自定义模式',
        description: '自由组合功能',
        duration: '自定义',
        icon: 'setting-o',
        color: '#6b7280',
        features: [],
        page: 'custom'
      }
    }
  },

  onLoad() {
    this.checkDeviceStatus();
  },

  onShow() {
    // 每次显示页面时检查状态
    this.checkDeviceStatus();
  },

  // 检查设备状态
  checkDeviceStatus() {
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const connectedDevices = historyDevices.filter(device => device.connected);
    
    if (connectedDevices.length > 0 && deviceRunning) {
      // 有已连接设备且正在运行
      this.setData({
        status: '运行',
        currentRunningDevice: connectedDevices[0].name || ''
      });
    } else if (connectedDevices.length > 0) {
      // 有已连接设备但未运行
      this.setData({
        status: '关闭',
        currentRunningDevice: ''
      });
    } else {
      // 无连接设备
      this.setData({
        status: '关闭',
        currentRunningDevice: ''
      });
    }
  },

  // 选择理疗模式
  selectMode(e) {
    const modeKey = e.currentTarget.dataset.mode;
    const mode = this.data.therapyModes[modeKey];
    
    if (!mode) {
      wx.showToast({
        title: '模式不存在',
        icon: 'error'
      });
      return;
    }

    // 检查设备连接状态
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const hasConnectedDevice = historyDevices.some(device => device.connected);
    
    if (!hasConnectedDevice) {
      wx.showModal({
        title: '设备未连接',
        content: '请先连接设备后再选择理疗模式',
        confirmText: '去连接',
        success: (res) => {
          if (res.confirm) {
            this.goToAppConnect();
          }
        }
      });
      return;
    }

    // 显示模式详情并确认启动
    this.showModeDetails(modeKey, mode);
  },

  // 显示模式详情
  showModeDetails(modeKey, mode) {
    let content = `模式：${mode.name}\n`;
    content += `时长：${mode.duration}\n`;
    content += `功能：${mode.description}\n\n`;
    
    if (mode.features.length > 0) {
      content += '包含功能：\n';
      mode.features.forEach(feature => {
        content += `• ${feature}\n`;
      });
    }

    wx.showModal({
      title: '理疗模式详情',
      content: content,
      confirmText: '启动模式',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.startTherapyMode(modeKey, mode);
        }
      }
    });
  },

  // 启动理疗模式
  startTherapyMode(modeKey, mode) {
    // 保存当前选择的模式
    wx.setStorageSync('currentTherapyMode', {
      key: modeKey,
      ...mode,
      startTime: new Date().toISOString()
    });

    // 更新设备状态为运行
    wx.setStorageSync('deviceRunning', true);
    this.setData({ status: '运行' });

    // 显示启动成功
    wx.showToast({
      title: `${mode.name}已启动`,
      icon: 'success'
    });

    // 根据模式跳转到相应的功能页面
    this.navigateToModeFunction(modeKey, mode);
  },

  // 根据模式跳转到相应功能页面
  navigateToModeFunction(modeKey, mode) {
    switch (modeKey) {
      case 'classic':
        // 经典理疗 - 跳转到增强版艾灸页面
        wx.navigateTo({ url: '/pages/moxibustion-enhanced/moxibustion-enhanced' });
        break;
      case 'relax':
        // 深度放松 - 跳转到水疗页面
        wx.navigateTo({ url: '/pages/hydrotherapy/hydrotherapy' });
        break;
      case 'recovery':
        // 康复理疗 - 跳转到红外理疗页面
        wx.navigateTo({ url: '/pages/infrared/infrared' });
        break;
      case 'quick':
        // 快速舒缓 - 跳转到水疗页面
        wx.navigateTo({ url: '/pages/hydrotherapy/hydrotherapy' });
        break;
      case 'fullbody':
        // 全身调理 - 跳转到监测页面查看全功能
        wx.navigateTo({ url: '/pages/monitor/monitor' });
        break;
      case 'custom':
        // 自定义模式 - 显示功能选择
        this.showCustomModeSelection();
        break;
      default:
        wx.navigateTo({ url: '/pages/monitor/monitor' });
    }
  },

  // 显示自定义模式选择
  showCustomModeSelection() {
    const features = [
      { name: '艾灸理疗', page: 'moxibustion-enhanced', icon: 'fire-o', color: '#ef4444' },
      { name: '药浴子系统', page: 'herbal-bath', icon: 'hot-o', color: '#f59e42' },
      { name: '超音波水疗', page: 'hydrotherapy', icon: 'sound', color: '#3b82f6' },
      { name: '红外理疗', page: 'infrared', icon: 'bulb-o', color: '#f59e0b' },
      { name: '香氛疗愈', page: 'aromatherapy', icon: 'flower-o', color: '#8b5cf6' },
      { name: '音乐疗愈', page: 'music-therapy', icon: 'music-o', color: '#10b981' }
    ];

    wx.showActionSheet({
      itemList: features.map(f => f.name),
      success: (res) => {
        const selectedFeature = features[res.tapIndex];
        wx.showToast({
          title: `已选择${selectedFeature.name}`,
          icon: 'success'
        });
        // 跳转到对应的功能页面
        wx.navigateTo({ url: `/pages/${selectedFeature.page}/${selectedFeature.page}` });
      }
    });
  },

  goToMonitor() {
    wx.navigateTo({ url: '/pages/monitoring/monitoring' });
  },
  goToHydrotherapy() {
    wx.navigateTo({ url: '/pages/hydrotherapy/hydrotherapy' });
  },
  goToMoxibustion() {
    wx.navigateTo({ url: '/pages/moxibustion/moxibustion' });
  },
  goToAppConnect() {
    wx.navigateTo({ url: '/pages/appconnect/appconnect' });
  }
});
