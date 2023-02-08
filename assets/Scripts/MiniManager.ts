/*
Developed by @mario 1.2.20230207
*/
import * as cc from 'cc';

declare let wx: any;
declare let tt: any;

export default class MiniManager {
	public static _instance: MiniManager = null

	public static get instance() {
		if (null == this._instance) {
			this._instance = new MiniManager()
		}
		return this._instance
	}

	// 默认分享标题
	shareMsg: string = '好可惜，就差一点点，可以帮我过关么？'

	// 广告ID: 各平台以逗号隔开, 顺序[微信,字节跳动,百度,小米,支付宝,淘宝,OPPO,VIVO,华为]

	// 横幅广告ID
	bannerId: string = ''
	private bannerAd = null

	// 插屏广告ID
	interstitialId: string = ''
	private interstitialAd = null

	// 激励视频ID
	videoId: string = ''
	private videoAd = null

	// 字节跳动录屏
	private recorder = null
	private recordTimer = null
	private recordSecond = 0

	// 获取小程序标识
	getMiniPrefix() {
		switch (cc.sys.platform) {
			case cc.sys.Platform.WECHAT_GAME: return wx
			case cc.sys.Platform.BYTEDANCE_MINI_GAME: return tt
			case cc.sys.Platform.BAIDU_MINI_GAME: return wx
			case cc.sys.Platform.XIAOMI_QUICK_GAME: return wx
			case cc.sys.Platform.ALIPAY_MINI_GAME: return wx
			case cc.sys.Platform.TAOBAO_CREATIVE_APP: return wx
			case cc.sys.Platform.OPPO_MINI_GAME: return wx
			case cc.sys.Platform.VIVO_MINI_GAME: return wx
			case cc.sys.Platform.HUAWEI_QUICK_GAME: return wx
			default: return null
		}
	}

	// 判断是否小程序内运行
	isMini(platform?: any) {
		if (typeof platform !== 'undefined') return cc.sys.platform == platform
		return this.getMiniPrefix() !== null
	}

	// 获取小程序广告Id
	getAdvertisId(advertisId: string) {
		if (!advertisId || advertisId == '') {
			console.error('广告ID为空')
			return ''
		}
		let ids = advertisId.split(',')
		switch (cc.sys.platform) {
			case cc.sys.Platform.WECHAT_GAME: return ids[0]
			case cc.sys.Platform.BYTEDANCE_MINI_GAME: return ids[1]
			case cc.sys.Platform.BAIDU_MINI_GAME: return ids[2]
			case cc.sys.Platform.XIAOMI_QUICK_GAME: return ids[3]
			case cc.sys.Platform.ALIPAY_MINI_GAME: return ids[4]
			case cc.sys.Platform.TAOBAO_CREATIVE_APP: return ids[5]
			case cc.sys.Platform.OPPO_MINI_GAME: return ids[6]
			case cc.sys.Platform.VIVO_MINI_GAME: return ids[7]
			case cc.sys.Platform.HUAWEI_QUICK_GAME: return ids[8]
			default: return ''
		}
	}

	// 获取用户信息
	getUser(callback: Function, options?: { desc?: string, text?: string, style?: {} }) {
		if (!this.isMini()) {
			console.log('【获取用户信息】仅支持小程序平台')
			return
		}
		let mini = this.getMiniPrefix()
		mini.getSetting({
			success: res => {
				if (typeof options.desc === 'undefined') options.desc = '用于完善会员信息'
				if (typeof options.text === 'undefined') options.text = '获取用户信息'
				if (res.authSetting['scope.userInfo']) {
					mini.getUserProfile({
						desc: options.desc, // 声明获取用户个人信息后的用途, 后续会展示在弹窗中, 请谨慎填写
						success: res => {
							callback(res.userInfo)
						}
					})
				} else {
					// 用户没有授权
					let style = {
						left: 0,
						top: 0,
						width: 200,
						height: 40,
						lineHeight: 40,
						backgroundColor: '#ff0000',
						//backgroundColor: 'rgba(0,0,0,0)',
						color: '#ffffff',
						textAlign: 'center',
						fontSize: 16,
						borderRadius: 4
					}
					if (Object.keys(options.style).length) {
						for (let key in options.style) style[key] = options.style[key]
					}
					let button = mini.createUserInfoButton({
						type: 'text',
						text: options.text,
						style: style
					})
					button.onTap(res => {
						callback(res.userInfo)
						button.hide()
					})
				}
			}
		})
	}

	// 主动分享, options: { title:分享标题, (字节跳动专用)[templateId:分享ID, videoPath:视频地址, topic:话题(数组)] }
	shareMessage(options?: any, success?: any, fail?: any) {
		if (!this.isMini()) {
			console.log('【主动分享】仅支持小程序平台')
			return
		}
		if (typeof options === 'function') {
			fail = success
			success = options
			options = {}
		}
		let params = {
			success() {
				return success && success()
			},
			fail() {
				return fail && fail()
			}
		}
		if (cc.sys.platform == cc.sys.Platform.BYTEDANCE_MINI_GAME) {
			if (typeof options.templateId !== 'undefined') params['templateId'] = options.templateId
			else params['title'] = typeof options.title === 'undefined' ? this.shareMsg : options.title
			if (typeof options.videoPath !== 'undefined') {
				params['channel'] = 'video'
				params['extra'] = {
					videoPath: options.videoPath,
					videoTopics: typeof options.topic === 'undefined' ? [] : options.topic,
					hashtag_list: typeof options.topic === 'undefined' ? [] : options.topic
				}
			}
		} else {
			params['title'] = typeof options.title === 'undefined' ? this.shareMsg : options.title
		}
		let mini = this.getMiniPrefix()
		mini.shareAppMessage(params)
	}

	// 被动分享
	onShareMessage(options?: any, success?: any, fail?: any) {
		if (!this.isMini()) {
			console.log('【被动分享】仅支持小程序平台')
			return
		}
		if (typeof options === 'function') {
			fail = success
			success = options
			options = {}
		}
		let mini = this.getMiniPrefix()
		mini.showShareMenu({
			success: (res: any) => { },
			fail: (res: any) => { }
		})
		mini.onShareAppMessage(() => {
			return {
				title: typeof options.title === 'undefined' ? this.shareMsg : options.title,
				success() {
					return success && success()
				},
				fail() {
					return fail && fail()
				}
			}
		})
	}

	// 小程序跳转
	toApp(appId: string) {
		if (!this.isMini()) {
			console.log('【小程序跳转】仅支持小程序平台', appId)
			return
		}
		let mini = this.getMiniPrefix()
		mini.navigateToMiniProgram({
			appId: appId
		})
	}

	// 初始化横幅广告
	initBannerAd(bannerId?: string) {
		if (!this.isMini()) {
			console.log('【横幅广告】仅支持小程序平台')
			return
		}
		let mini = this.getMiniPrefix()
		let winSize = mini.getSystemInfoSync()
		if (bannerId && bannerId != '') {
			let bannerAd = mini.createBannerAd({
				adUnitId: this.getAdvertisId(bannerId),
				adIntervals: 10,
				style: {
					height: winSize.windowHeight - 80,
					left: 0,
					top: 500,
					width: winSize.windowWidth
				}
			})
			bannerAd.onResize((res: any) => {
				bannerAd.style.top = winSize.windowHeight - bannerAd.style.realHeight
				bannerAd.style.left = winSize.windowWidth / 2 - bannerAd.style.realWidth / 2
			});
			return bannerAd
		}
		if (this.bannerAd == null) {
			bannerId = this.getAdvertisId(this.bannerId)
			if (bannerId == '') {
				console.error('【横幅广告】请配置广告ID')
				return
			}
			this.bannerAd = mini.createBannerAd({
				adUnitId: bannerId,
				adIntervals: 10,
				style: {
					height: winSize.windowHeight - 80,
					left: 0,
					top: 500,
					width: winSize.windowWidth
				}
			})
			this.bannerAd.onResize((res: any) => {
				this.bannerAd.style.top = winSize.windowHeight - this.bannerAd.style.realHeight
				this.bannerAd.style.left = winSize.windowWidth / 2 - this.bannerAd.style.realWidth / 2
			});
			this.bannerAd.onError((err: any) => {
				console.error('【横幅广告】初始化有误')
			})
		}
	}

	// 横幅广告展示
	toggleBannerAd(isShow: boolean, bannerAd?: any) {
		if (!this.isMini()) {
			console.log('【横幅广告】仅支持小程序平台')
			return
		}
		if (typeof bannerAd === 'undefined') bannerAd = this.bannerAd
		if (bannerAd) {
			isShow ? bannerAd.show() : bannerAd.hide()
		}
	}

	// 初始化插屏广告
	initInterstitialAd(interstitialId?: string) {
		if (!this.isMini()) {
			console.log('【插屏广告】仅支持小程序平台')
			return
		}
		let mini = this.getMiniPrefix()
		if (interstitialId && interstitialId != '') {
			return mini.createInterstitialAd({
				adUnitId: this.getAdvertisId(interstitialId)
			})
		}
		if (this.interstitialAd == null) {
			interstitialId = this.getAdvertisId(this.interstitialId)
			if (interstitialId == '') {
				console.error('【插屏广告】请配置广告ID')
				return
			}
			this.interstitialAd = mini.createInterstitialAd({
				adUnitId: interstitialId
			})
			this.interstitialAd.onError((err: any) => {
				console.error('【插屏广告】初始化有误')
			})
		}
	}

	// 插屏广告展示
	showInterstitialAd(interstitialId?: string) {
		if (!this.isMini()) {
			console.log('【插屏广告】仅支持小程序平台')
			return
		}
		let interstitialAd = this.interstitialAd
		if (interstitialId != '') {
			interstitialAd = this.initInterstitialAd(interstitialId)
			interstitialAd.onError((err: any) => {
				console.error('【插屏广告】初始化有误')
			})
		}
		if (interstitialAd) {
			interstitialAd.show().catch((err: any) => {
				console.error('【插屏广告】加载失败')
			})
		}
	}

	// 初始化激励视频
	initVideoAd(videoId?: string) {
		if (!this.isMini()) {
			console.log('【激励视频】仅支持小程序平台')
			return
		}
		let mini = this.getMiniPrefix()
		if (videoId && videoId != '') {
			videoId = this.getAdvertisId(videoId)
			if (videoId == '') return null
			return mini.createRewardedVideoAd({
				adUnitId: videoId
			})
		}
		if (this.videoAd == null) {
			videoId = this.getAdvertisId(this.videoId)
			if (videoId == '') {
				console.error('【激励视频】请配置广告ID')
				return
			}
			this.videoAd = mini.createRewardedVideoAd({
				adUnitId: videoId
			})
			this.videoAd.onError((err: any) => {
				console.error('【激励视频】初始化有误')
			})
		}
	}

	// 激励视频展示
	showVideoAd(videoId?: any, success?: any, fail?: any) {
		if (typeof videoId === 'function') {
			fail = success
			success = videoId
			videoId = ''
		}
		if (!this.isMini()) {
			console.log('【激励视频】仅支持小程序平台')
			return success && success()
		}
		let videoAd = this.videoAd
		if (videoId && videoId != '') {
			videoAd = this.initVideoAd(videoId)
			if (videoAd == null) return success && success()
			videoAd.onError((err: any) => {
				console.error('【激励视频】初始化有误')
			})
		}
		if (videoAd == null) return success && success()
		videoAd.offClose();
		videoAd.onClose((res: any) => {
			videoAd.offClose()
			if ((res && res.isEnded) || res === undefined) {
				return success && success()
			} else {
				return fail && fail()
			}
		})
		videoAd.show().catch(() => {
			videoAd.load()
				.then(() => videoAd.show())
				.catch((err: any) => {
					console.error('【激励视频】展示失败')
				})
		})
	}

	// 录屏分享, stopCallback(recordIsSuccess, videoPath)
	gameRecorder(stopCallback: Function, startCallback?: Function, duration?: number) {
		if (!this.isMini(cc.sys.Platform.BYTEDANCE_MINI_GAME)) {
			console.log('【录屏分享】仅支持抖音小程序平台')
			return null
		}
		this.recordSecond = 0
		if (!this.recorder) this.recorder = tt.getGameRecorderManager()
		// 开始录屏
		this.recorder.onStart(res => {
			startCallback(res)
		})
		// 录屏结束
		this.recorder.onStop(res => {
			clearInterval(this.recordTimer);
			if (this.recordSecond < 4) {
				// 录屏小于3s, 无法分享
				stopCallback(false)
			} else {
				// 录屏成功, 则获取视频文件的地址
				let videoPath = res.videoPath
				stopCallback(true, videoPath)
			}
			this.recorder = null
		})
		// 开始录屏
		if (typeof duration === 'undefined' || duration < 4 || duration > 300) duration = 300
		this.recorder.start({
			duration: duration // 录屏时长, 单位s, 必须大于3s, 最大值300s(5分钟)
		})
		// 统计录制时间, 大于300s则停止录制
		this.recordTimer = setInterval(() => {
			this.recordSecond++
			if (this.recordSecond >= 300) {
				clearInterval(this.recordTimer)
			}
		}, 1000)
		// 外部需要 this.recorder.stop() 手动停止录屏
		return this.recorder
	}
}

