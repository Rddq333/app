// index.js
Page({
  data: {
    deviceName: '智能洗浴机器人',
    deviceNameEn: 'Smart Bath Robot',
    status: '关闭',  // 默认关闭状态
    temp: '36.5°C',
    currentRunningDevice: '',  // 当前运行设备名称
    // 自定义模式选中的功能
    selectedCustomModes: [],
    // 当前运行的模式
    currentRunningMode: null,
    // 理疗模式配置
    therapyModes: {
      infrared: {
        name: '红外理疗',
        description: '红外线热疗，促进血液循环',
        duration: '30分钟',
        icon: '/images/infrared.gif',
        color: '#ef4444',
        features: ['红外线热疗', '促进血液循环', '缓解肌肉疼痛'],
        page: 'infrared'
      },
      hydrotherapy: {
        name: '超音波水疗',
        description: '超声波水疗，深层清洁',
        duration: '45分钟',
        icon: '/images/hydrotherapy.gif',
        color: '#3b82f6',
        features: ['超声波水疗', '深层清洁', '皮肤护理'],
        page: 'hydrotherapy'
      },
      moxibustion: {
        name: '艾灸理疗',
        description: '传统艾灸，温经通络',
        duration: '60分钟',
        icon: '/images/moxibustion.gif',
        color: '#f59e0b',
        features: ['艾灸理疗', '温经通络', '祛寒除湿'],
        page: 'moxibustion'
      },
      herbalBath: {
        name: '中药浴理疗',
        description: '中药浸泡，调理身体',
        duration: '40分钟',
        icon: '/images/herbal-bath.gif',
        color: '#10b981',
        features: ['中药浸泡', '调理身体', '养生保健'],
        page: 'herbal-bath'
      },
      aromatherapy: {
        name: '香氛理疗',
        description: '精油香氛，舒缓身心',
        duration: '35分钟',
        icon: '/images/aromatherapy.svg',
        color: '#8b5cf6',
        features: ['精油香氛', '舒缓身心', '改善睡眠'],
        page: 'aromatherapy'
      },
      musicTherapy: {
        name: '音乐理疗',
        description: '音乐疗愈，放松心情',
        duration: '25分钟',
        icon: '/images/music-therapy.svg',
        color: '#ec4899',
        features: ['音乐疗愈', '放松心情', '缓解压力'],
        page: 'music-therapy'
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
    // 清理可能存在的无效理疗模式状态
    this.cleanupInvalidTherapyMode();
    this.checkDeviceStatus();
  },

  onShow() {
    // 每次显示页面时检查状态
    this.checkDeviceStatus();
  },

  onHide() {
  },

  onUnload() {
  },

  // 清理无效的理疗模式状态
  cleanupInvalidTherapyMode() {
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode');
    
    // 如果设备没有运行，但存在理疗模式状态，则清除
    if (!deviceRunning && currentTherapyMode) {
      wx.removeStorageSync('currentTherapyMode');
      console.log('清理无效的理疗模式状态');
    }
    
    // 如果理疗模式状态不完整，也清除
    if (currentTherapyMode && (!currentTherapyMode.key || !currentTherapyMode.name)) {
      wx.removeStorageSync('currentTherapyMode');
      console.log('清理不完整的理疗模式状态');
    }
  },

  // 检查设备状态
  checkDeviceStatus() {
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
    const currentTherapyMode = wx.getStorageSync('currentTherapyMode') || null;
    const connectedDevices = historyDevices.filter(device => device.connected);
    
    if (connectedDevices.length > 0 && deviceRunning) {
      // 有已连接设备且正在运行
      this.setData({
        status: '运行',
        currentRunningDevice: connectedDevices[0].name || '',
        currentRunningMode: currentTherapyMode
      });
    } else if (connectedDevices.length > 0) {
      // 有已连接设备但未运行
      this.setData({
        status: '关闭',
        currentRunningDevice: '',
        currentRunningMode: null
      });
    } else {
      // 无连接设备
      this.setData({
        status: '关闭',
        currentRunningDevice: '',
        currentRunningMode: null
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

    // 检查设备连接和运行状态
    if (!this.checkDeviceConnection()) {
      return;
    }

    // 检查模式互斥
    if (!this.checkModeExclusive(modeKey)) {
      return;
    }

    // 所有模式都弹窗详情，用户确认后再进入
    this.showModeDetails(modeKey, mode);
  },

  // 检查设备连接状态
  checkDeviceConnection() {
    const historyDevices = wx.getStorageSync('historyDevices') || [];
    const deviceRunning = wx.getStorageSync('deviceRunning') || false;
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
      return false;
    }

    if (!deviceRunning) {
      wx.showModal({
        title: '设备未启动',
        content: '请先启动设备后再选择理疗模式',
        confirmText: '去启动',
        success: (res) => {
          if (res.confirm) {
            this.goToAppConnect();
          }
        }
      });
      return false;
    }

    return true;
  },

  // 检查模式互斥
  checkModeExclusive(modeKey) {
    const currentMode = this.data.currentRunningMode;
    
    // 只有在真正有运行模式时才进行互斥检查
    if (currentMode && currentMode.key && currentMode.key !== modeKey) {
      if (currentMode.key !== 'custom') {
        // 如果当前运行的是单个模式，不允许启动其他模式
        wx.showModal({
          title: '模式冲突',
          content: `当前正在运行${currentMode.name}，请先停止当前模式后再选择其他模式`,
          confirmText: '确定',
          showCancel: false
        });
        return false;
      } else if (modeKey !== 'custom') {
        // 如果当前运行的是自定义模式，不允许启动单个模式
        wx.showModal({
          title: '模式冲突',
          content: '当前正在运行自定义组合模式，请先停止当前模式后再选择其他模式',
          confirmText: '确定',
          showCancel: false
        });
        return false;
      }
    }

    return true;
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
      confirmText: '进入模式',
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
    // 根据模式跳转到相应的功能页面进行配置
    this.navigateToModeFunction(modeKey, mode);
  },

  // 根据模式跳转到相应功能页面
  navigateToModeFunction(modeKey, mode) {
    switch (modeKey) {
      case 'infrared':
        // 红外理疗 - 跳转到红外理疗页面
        wx.navigateTo({ url: '/pages/infrared/infrared' });
        break;
      case 'hydrotherapy':
        // 超音波水疗 - 跳转到水疗页面
        wx.navigateTo({ url: '/pages/hydrotherapy/hydrotherapy' });
        break;
      case 'moxibustion':
        // 艾灸理疗 - 跳转到艾灸页面
        wx.navigateTo({ url: '/pages/moxibustion/moxibustion' });
        break;
      case 'herbalBath':
        // 中药浴理疗 - 跳转到中药浴页面
        wx.navigateTo({ url: '/pages/herbal-bath/herbal-bath' });
        break;
      case 'aromatherapy':
        // 香氛理疗 - 跳转到香氛页面
        wx.navigateTo({ url: '/pages/aromatherapy/aromatherapy' });
        break;
      case 'musicTherapy':
        // 音乐理疗 - 跳转到音乐页面
        wx.navigateTo({ url: '/pages/music-therapy/music-therapy' });
        break;
      case 'custom':
        // 自定义模式 - 判断是否已有配置
        const modeConfigs = wx.getStorageSync('customModeConfigs') || [];
        if (modeConfigs.length > 0) {
          wx.navigateTo({ url: '/pages/custom-mode/custom-mode' });
        } else {
          this.showCustomModeSelection();
        }
        break;
      default:
        wx.navigateTo({ url: '/pages/monitor/monitor' });
    }
  },

  // 显示自定义模式选择（多选）
  showCustomModeSelection() {
    const customModes = [
      { key: 'infrared', name: '红外理疗', icon: 'bulb-o', color: '#ef4444' },
      { key: 'hydrotherapy', name: '超音波水疗', icon: 'sound', color: '#3b82f6' },
      { key: 'moxibustion', name: '艾灸理疗', icon: 'fire-o', color: '#f59e0b' },
      { key: 'herbalBath', name: '中药浴理疗', icon: 'hot-o', color: '#10b981' },
      { key: 'aromatherapy', name: '香氛理疗', icon: 'flower-o', color: '#8b5cf6' },
      { key: 'musicTherapy', name: '音乐理疗', icon: 'music-o', color: '#ec4899' }
    ];

    // 显示多选弹窗
    wx.showModal({
      title: '选择理疗功能',
      content: '请选择要组合的理疗功能（可多选）：\n\n' + 
               customModes.map((mode, index) => `${index + 1}. ${mode.name}`).join('\n'),
      confirmText: '确认选择',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 显示选择界面
          this.showCustomModeCheckbox(customModes);
        }
      }
    });
  },

  // 显示自定义模式复选框选择
  showCustomModeCheckbox(customModes) {
    const selectedModes = this.data.selectedCustomModes || [];
    
    // 创建选择列表
    const itemList = customModes.map(mode => {
      const isSelected = selectedModes.includes(mode.key);
      return `${isSelected ? '✓' : '○'} ${mode.name}`;
    });

    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        const selectedIndex = res.tapIndex;
        const selectedMode = customModes[selectedIndex];
        const newSelectedModes = [...selectedModes];
        
        // 切换选中状态
        if (newSelectedModes.includes(selectedMode.key)) {
          // 取消选中
          const index = newSelectedModes.indexOf(selectedMode.key);
          newSelectedModes.splice(index, 1);
        } else {
          // 添加选中
          newSelectedModes.push(selectedMode.key);
        }
        
        this.setData({
          selectedCustomModes: newSelectedModes
        });

        // 显示当前选择状态
        if (newSelectedModes.length > 0) {
          const selectedNames = newSelectedModes.map(key => 
            customModes.find(mode => mode.key === key).name
          ).join('、');
          
          wx.showModal({
            title: '当前选择',
            content: `已选择：${selectedNames}\n\n是否继续添加其他功能？`,
            confirmText: '继续选择',
            cancelText: '确认组合',
            success: (res) => {
              if (res.confirm) {
                // 继续选择
                this.showCustomModeCheckbox(customModes);
              } else {
                // 确认组合，启动自定义模式
                this.startCustomMode(newSelectedModes, customModes);
              }
            }
          });
        } else {
          // 没有选择任何模式，重新选择
          this.showCustomModeCheckbox(customModes);
        }
      }
    });
  },

  // 启动自定义模式
  startCustomMode(selectedModes, customModes) {
    const selectedNames = selectedModes.map(key => 
      customModes.find(mode => mode.key === key).name
    ).join('、');

    // 跳转到自定义模式配置页面
    this.navigateToCustomModeConfig(selectedModes, customModes);
  },

  // 跳转到自定义模式配置页面
  navigateToCustomModeConfig(selectedModes, customModes) {
    // 将选中的模式信息传递到自定义配置页面
    const modeConfigs = selectedModes.map(key => {
      const mode = customModes.find(m => m.key === key);
      return {
        key: key,
        name: mode.name,
        page: key
      };
    });

    // 保存到本地存储供配置页面使用
    wx.setStorageSync('customModeConfigs', modeConfigs);

    // 跳转到自定义模式配置页面
    wx.navigateTo({ 
      url: '/pages/custom-mode/custom-mode'
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
  },
});
