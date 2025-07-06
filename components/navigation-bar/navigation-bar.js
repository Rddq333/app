Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
    bgColor: {
      type: String,
      value: ''
    },
    isBack: {
      type: Boolean,
      value: false
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: '',
    statusBarHeight: 20, // 默认
    navBarHeight: 44,    // 默认
    menuButtonRect: null
  },
  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync();
      let menuButtonRect = null;
      try {
        menuButtonRect = wx.getMenuButtonBoundingClientRect();
      } catch (e) {}
      this.setData({
        statusBarHeight: sysInfo.statusBarHeight,
        navBarHeight: menuButtonRect ? menuButtonRect.height + (menuButtonRect.top - sysInfo.statusBarHeight) * 2 : 44,
        menuButtonRect
      });
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'
          };transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      this.triggerEvent('back', { delta: data.delta }, {})
    },
    home() {
      // 返回首页
      const pages = getCurrentPages()
      if (pages.length > 1) {
        // 如果不在首页，则返回首页
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
      this.triggerEvent('home', {}, {})
    }
  },
})
