const api = require('../../utils/api');

Page({
  data: {
    status: '未启动',
    temp: 40,
    pressure: '中',
    pressureOptions: ['低', '中', '高'],
    massageMode: '脉冲',
    massageOptions: ['脉冲', '气泡', '波浪'],
    timer: 20,
    timerOptions: [10, 20, 30, 40, 50, 60],
    preset: '放松',
    presetOptions: ['放松', '活力', '恢复'],
    loading: false
  },

  onLoad(options) {
    console.log('水疗页面加载', options);
    this.initPage();
  },

  onShow() {
    console.log('水疗页面显示');
  },

  onReady() {
    console.log('水疗页面就绪');
  },

  onHide() {
    console.log('水疗页面隐藏');
  },

  onUnload() {
    console.log('水疗页面卸载');
  },

  initPage() {
    try {
      // 初始化页面数据
      this.setData({
        loading: false
      });
      
      // 测试页面是否正常加载
      console.log('水疗页面初始化成功');
      wx.showToast({
        title: '页面加载成功',
        icon: 'success',
        duration: 1000
      });
    } catch (error) {
      console.error('页面初始化失败:', error);
      wx.showToast({
        title: '页面加载失败',
        icon: 'error'
      });
    }
  },
  onTempChange(e) {
    try {
      this.setData({ temp: e.detail.value });
    } catch (error) {
      console.error('温度设置失败:', error);
    }
  },

  onPressureChange(e) {
    try {
      this.setData({ pressure: this.data.pressureOptions[e.detail.value] });
    } catch (error) {
      console.error('水压设置失败:', error);
    }
  },

  onMassageChange(e) {
    try {
      this.setData({ massageMode: this.data.massageOptions[e.detail.value] });
    } catch (error) {
      console.error('按摩模式设置失败:', error);
    }
  },

  onTimerChange(e) {
    try {
      this.setData({ timer: this.data.timerOptions[e.detail.value] });
    } catch (error) {
      console.error('定时设置失败:', error);
    }
  },

  onPresetChange(e) {
    try {
      this.setData({ preset: this.data.presetOptions[e.detail.value] });
    } catch (error) {
      console.error('预设程序设置失败:', error);
    }
  },
  onBack() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 1 && pages[pages.length - 2].route !== 'pages/index/index') {
        wx.navigateBack();
      } else {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    } catch (error) {
      console.error('返回操作失败:', error);
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },
  startHydrotherapy() {
    try {
      this.setData({ loading: true });
      
      api.controlHydrotherapy({
        action: 'start',
        temp: this.data.temp,
        pressure: this.data.pressure,
        massageMode: this.data.massageMode,
        timer: this.data.timer,
        preset: this.data.preset
      }).then(() => {
        this.setData({ 
          status: '运行中',
          loading: false 
        });
        wx.showToast({
          title: '水疗已启动',
          icon: 'success'
        });
      }).catch(error => {
        console.error('启动水疗失败:', error);
        this.setData({ loading: false });
        wx.showToast({
          title: '启动失败',
          icon: 'error'
        });
      });
    } catch (error) {
      console.error('启动水疗操作失败:', error);
      this.setData({ loading: false });
    }
  },

  stopHydrotherapy() {
    try {
      this.setData({ loading: true });
      
      api.controlHydrotherapy({ action: 'stop' }).then(() => {
        this.setData({ 
          status: '已停止',
          loading: false 
        });
        wx.showToast({
          title: '水疗已停止',
          icon: 'success'
        });
      }).catch(error => {
        console.error('停止水疗失败:', error);
        this.setData({ loading: false });
        wx.showToast({
          title: '停止失败',
          icon: 'error'
        });
      });
    } catch (error) {
      console.error('停止水疗操作失败:', error);
      this.setData({ loading: false });
    }
  }
}); 