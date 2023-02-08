import { _decorator, Component, Node, tween, Vec3, Tween, Camera, Animation, input, Input, Prefab, UITransform, AudioSource, Label, size, SpriteFrame, Sprite, UIOpacity, v3, sys } from 'cc';
import { Person } from './Person';
import { Radish, RadishSkin } from './Radish';
const { ccclass, property } = _decorator;
import $ from "./Helper"
import { MenuLayer } from './MenuLayer';
import { Hook } from './Hook';
import { Btn } from './Btn';
import MiniManager from './MiniManager';

@ccclass('Game')
export class Game extends Component {

	@property
	private isSuperMan: boolean = false

	private level: number = 1

	@property(Person)
	public person: Person = null

	@property(MenuLayer)
	public menu: MenuLayer = null

	@property(Camera)
	private camera: Camera = null

	@property([SpriteFrame])
	private skyFrames: SpriteFrame[] = []

	@property([SpriteFrame])
	private mountainFrames: SpriteFrame[] = []

	@property(Prefab)
	private radish: Prefab = null

	@property(Prefab)
	private radishHeader: Prefab = null

	public falling: number = 0
	public shakeing: number = 0
	public animation: Animation = null
	private animationing: number = 0

	@property(Node)
	private activity: Node = null

	@property(Node)
	private radishView: Node = null

	@property(Hook)
	private hook: Hook = null

	private role: Node = null
	private climb: Node = null

	private personOriginY: number = 0
	private personStandY: number = 0
	private offsetY: number = 0

	private lastRadishY: number = 0

	private screenHeight: number = 0

	@property
	private radishMinCount: number = 3 //最少萝卜数
	private radishs: number = 0
	private radishIndex: number = 1

	private isTop: boolean = false
	private isHook: boolean = false

	@property(Node)
	private time: Node = null
	@property(Node)
	private text: Node = null
	@property(Node)
	private progress: Node = null
	private ico: Node = null
	private progressHeight: number = 0

	@property(Node)
	private recorder: Node = null
	@property([SpriteFrame])
	private recorderFrames: SpriteFrame[] = []
	private isRecording: boolean = false
	private recordMgr: any = null
	private recordPath: string = ''

	private mountain: Node = null

	private runTime: number = 0

	private climbHeight: number = 0

	private tapTime: number = 0

	private roleIndex: number = 0
	private curPoint: number = 0

	private timeOffsetY: number = 0
	private textOffsetY: number = 0
	private progressOffsetY: number = 0
	private recorderOffsetY: number = 0

	public gamedirection: string = ''

	onLoad() {
		delete $.data['gamestart']
		delete $.data['gamestatus']
		if (!$.data['level']) $.data['level'] = 1
		this.level = parseInt($.data['level'])
		this.roleIndex = parseInt($.storage('role_index') || 0)
		this.curPoint = parseInt($.storage('game_point') || 0)
	}

	start() {
		if (this.isSuperMan) $.data['super'] = true

		$.storage('role_index', null)

		this.person.node.children.forEach(children => children.active = false)
		this.role = this.person.node.getChildByName(`role${this.roleIndex}`)
		this.role.active = true
		this.climb = this.role.getChildByName('climb')
		this.animation = this.climb.getComponent(Animation)
		let personPos = this.person.node.getPosition()
		let pos = this.camera.node.getPosition()
		this.personOriginY = personPos.y
		this.personStandY = personPos.y
		this.offsetY = pos.y
		$.data['person_pos'] = personPos

		this.timeOffsetY = this.time.getPosition().y - pos.y
		this.textOffsetY = this.text.getPosition().y - pos.y
		this.progressOffsetY = this.progress.getPosition().y - pos.y
		this.recorderOffsetY = this.recorder.getPosition().y - pos.y

		this.screenHeight = $.designSize().height

		this.setRadish()
		this.radishs = this.radishMinCount + this.level

		this.ico = this.progress.getChildByName('ico')
		let icoHeight = this.ico.getComponent(UITransform).contentSize.height
		this.progressHeight = this.progress.getComponent(UITransform).contentSize.height - icoHeight

		this.climbHeight = this.radishs * this.screenHeight + this.screenHeight / 2 //爬行总高度

		this.text.getComponent(Label).string = `第${this.level}根`

		let skyBgs = this.camera.node.getChildByName('SkyBgs')
		let sky = this.camera.node.getChildByName('Sky')
		this.mountain = this.camera.node.getChildByName('Mountain')
		let frameIndex = $.random(0, 2)
		skyBgs.getComponent(Sprite).spriteFrame = this.skyFrames[frameIndex]
		sky.getComponent(Sprite).spriteFrame = this.skyFrames[frameIndex]
		this.mountain.getComponent(Sprite).spriteFrame = this.mountainFrames[frameIndex]

		let screenSize = $.screenSize()
		if (screenSize.height / screenSize.width > 1.9) {
			let timePos = this.time.getPosition()
			timePos.x += 40
			this.time.setPosition(timePos)

			let textPos = this.text.getPosition()
			textPos.x += 40
			this.text.setPosition(textPos)

			let progressPos = this.progress.getPosition()
			progressPos.x += 40
			this.progress.setPosition(progressPos)

			let recorderPos = this.recorder.getPosition()
			recorderPos.x += 40
			this.recorder.setPosition(recorderPos)
		}
	}

	onDestroy() {
		input.off(Input.EventType.TOUCH_START, this.onTap, this)
	}

	lateUpdate() {
		let pos = this.camera.node.getPosition()
		if (this.isTop && this.offsetY >= this.lastRadishY && !this.gamedirection) {
			pos.y = this.lastRadishY
			this.camera.node.setPosition(pos)
			return
		}
		let personPos = this.person.node.getPosition()
		if (this.offsetY > personPos.y && !this.gamedirection) return

		if (personPos.y >= 0) pos.y = personPos.y
		this.camera.node.setPosition(pos)

		let timePos = this.time.getPosition()
		timePos.y = this.timeOffsetY + pos.y
		this.time.setPosition(timePos)

		let textPos = this.text.getPosition()
		textPos.y = this.textOffsetY + pos.y
		this.text.setPosition(textPos)

		let progressPos = this.progress.getPosition()
		progressPos.y = this.progressOffsetY + pos.y
		this.progress.setPosition(progressPos)

		let recorderPos = this.recorder.getPosition()
		recorderPos.y = this.recorderOffsetY + pos.y
		this.recorder.setPosition(recorderPos)

		let tips = this.node.getChildByName('Tips')
		let tipsPos = tips.getPosition()
		tipsPos.y = pos.y
		tips.setPosition(tipsPos)

		if ($.data['gamestatus']) return

		this.offsetY = pos.y

		if (pos.y > this.screenHeight / 3) {
			let mouPos = this.mountain.getPosition()
			mouPos.y = -367 - (pos.y - this.screenHeight / 3) / 10
			this.mountain.setPosition(mouPos)
		}

		let icoPos = this.ico.getPosition()
		icoPos.y = 20 + this.progressHeight / this.climbHeight * this.offsetY
		if (icoPos.y >= 20 + this.progressHeight) icoPos.y = 20 + this.progressHeight
		this.ico.setPosition(icoPos)

		if (this.gamedirection) {
			if (personPos.y <= this.personOriginY) {
				let pos = this.person.node.getPosition()
				pos.y = this.personOriginY
				this.person.node.setPosition(pos)
				$.data['gamestatus'] = 'success'
				input.off(Input.EventType.TOUCH_START, this.onTap, this)
				delete $.data['gamestart']
				this.record(null, true)
				setTimeout(() => {
					Tween.stopAllByTag(99)
					Tween.stopAllByTag(100)
					clearTimeout(this.shakeing)
					clearTimeout(this.falling)
					this.role.getChildByName('stand').active = true
					this.role.getChildByName('climb').active = false
					this.role.getChildByName('fall').active = false
					this.role.getChildByName('fly').active = false
					let pos = this.camera.node.getPosition()
					pos.z = 0
					let result = this.node.getChildByName('Result')
					result.setPosition(pos)
					result.active = true
					let success = result.getChildByName('Success')
					if (!MiniManager.instance.isMini() || (MiniManager.instance.isMini(sys.Platform.BYTEDANCE_MINI_GAME) && !this.recordPath)) {
						success.getChildByName('Share').active = false
					}
					success.active = true
					success.getChildByName('Label').getComponent(Label).string = `第${this.level}根 ` + $.secondConversion(this.runTime)
					let level = $.storage('game_level')
					if (Number(level) === Number(this.level)) {
						$.storage('game_level', this.level + 1)
					}
				}, 200)
			}
			return
		}

		//let height = this.activity.getComponent(UITransform).contentSize.height
		//this.activity.getComponent(UITransform).setAnchorPoint(0.5, this.offsetY / height)

		let hookPos = this.hook.node.getPosition()
		hookPos.y = pos.y
		this.hook.node.setPosition(hookPos)

		//加高萝卜
		if (!this.isTop && this.offsetY >= this.lastRadishY - this.screenHeight / 2) {
			this.radishIndex++
			let kengNum = 4
			let radishWhite = Math.floor(this.radishs * 0.8)
			switch (this.level) {
				case 1: case 2:
					kengNum = 2
					break
				case 3: case 4: case 5: case 6:
					kengNum = 3
					break
				default:
					kengNum = 4
					break
			}
			if (this.radishIndex > this.radishs) {
				this.isTop = true
				let radish = $.prefab(this.radishHeader)
				radish.parent = this.radishView
				let radishPos = radish.getPosition()
				radishPos.y = this.lastRadishY + this.screenHeight
				radish.setPosition(radishPos)
				this.lastRadishY = radishPos.y
			} else if (this.radishIndex < radishWhite) {
				this.setRadish(RadishSkin.White, kengNum)
			} else if (this.radishIndex === radishWhite) {
				this.setRadish(RadishSkin.GreenBegin, kengNum)
			} else {
				this.setRadish(RadishSkin.Green, kengNum)
			}
		}

		//陷阱
		switch (this.level) {
			case 1: {
				if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
					this.isHook = true

				}
				break
			}
			case 2: case 7: case 8:
				break
			case 3: {
				if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
					this.isHook = true
					this.hook.goBird()
				}
				break
			}
			case 4: {
				if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
					this.isHook = true
					this.hook.goDark()
				}
				break
			}
			case 6: {
				if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
					this.isHook = true
					//this.hook.goSkew(20)
				}
				break
			}
			case 9: {
				if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
					this.isHook = true
					this.hook.goOrangutan()
				}
				break
			}
			case 10: {
				if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
					this.isHook = true
					this.hook.goEarthquake()
				}
				break
			}
			default: {
				if (this.level % 2 === 0) {
					if (!this.isHook && this.offsetY >= this.climbHeight / 2) {
						this.isHook = true
						let hooks = ['goBird', 'goDark', 'goOrangutan', 'goEarthquake'], hookIndex = []
						while (hookIndex.length < 2) {
							let index = $.random(0, hooks.length - 1)
							if ($.inArray(index, hookIndex) > -1) continue
							hookIndex.push(index)
						}
						hookIndex.forEach(index => {
							this.hook[hooks[index]]()
						})
					}
				}
				break
			}
		}

		//登顶
		if (this.offsetY >= this.climbHeight) {
			this.gamedirection = 'reverse'
			$.data['super'] = true

			Tween.stopAllByTag(99)
			Tween.stopAllByTag(100)
			clearTimeout(this.falling)
			clearTimeout(this.shakeing)
			this.role.getChildByName('stand').active = false
			this.role.getChildByName('climb').active = false
			this.role.getChildByName('fall').active = false
			this.role.getChildByName('fly').active = true
			this.role.getChildByName('fly').getComponent(AudioSource).play()

			let screenWidth = $.designSize().width
			let radish = $.prefab(this.radishHeader)
			radish.parent = this.radishView
			radish.setScale(-1, 1)
			radish.setPosition(v3(screenWidth, this.lastRadishY))

			let radishBody = $.prefab(this.radish)
			this.radishView.insertChild(radishBody, 0)
			radishBody.getComponent(Radish).setBody(RadishSkin.Green)
			radishBody.setScale(-1, 1)
			let radishPos = radishBody.getPosition()
			radishBody.setPosition(v3(screenWidth - radishPos.x / 2 + 11, this.lastRadishY - this.screenHeight))

			let pos = this.radishView.getPosition()
			pos.x = -screenWidth
			tween(this.radishView).by(1.0, { position: pos }).call(() => {
				pos.x = 0
				this.radishView.setPosition(pos)
				this.radishView.setScale(-1, 1)
				this.activity.getChildByName('RadishFoot').setScale(-1, 1)
			}).start()

			let personY = this.person.node.getPosition().y
			tween(this.person.node).by(0.5, {
				position: v3(0, this.screenHeight / 2),
				angle: -1080
			}).call(() => {
				//反转
				setTimeout(() => {
					this.person.node.setRotationFromEuler(v3(0, 0))
					let scale = this.person.node.getScale()
					scale.x *= -1
					this.person.node.setScale(scale)
					this.role.getChildByName('stand').active = false
					this.role.getChildByName('climb').active = false
					this.role.getChildByName('fall').active = false
					this.role.getChildByName('fly').active = true
					tween(this.person.node).to(0.5, { position: v3(0, personY) }).call(() => {
						this.role.getChildByName('stand').active = false
						this.role.getChildByName('climb').active = true
						this.role.getChildByName('fall').active = false
						this.role.getChildByName('fly').active = false
						this.person.node.getComponent(UIOpacity).opacity = 100
						setTimeout(() => {
							delete $.data['super']
							this.person.isContacted = false
							tween(this.person.node.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).start()
						}, 2500)
						this.setShakeing()
					}).start()
				}, 50)
			}).start()
		}
	}

	setRadish(skin = RadishSkin.White, kengNum = 2) {
		let radish = $.prefab(this.radish)
		radish.parent = this.radishView
		radish.getComponent(Radish).addKeng(kengNum)
		if (skin) radish.getComponent(Radish).setBody(skin)

		let radishPos = radish.getPosition()
		radishPos.y = this.lastRadishY + this.screenHeight
		radish.setPosition(radishPos)

		this.lastRadishY = radishPos.y

		let viewSize = this.activity.getComponent(UITransform).contentSize
		let height = viewSize.height + radish.getComponent(UITransform).contentSize.height
		this.activity.getComponent(UITransform).setContentSize(size(viewSize.width, height))

		return radish
	}

	startTap() {
		delete $.data['gamestatus']
		input.on(Input.EventType.TOUCH_START, this.onTap, this)
	}

	onTap() {
		if ($.data['gamestatus']) return

		if (this.gamedirection) {
			let pos = this.person.node.getPosition()
			if (pos.y - 5 <= this.personOriginY) {
				pos.y = this.personOriginY
				this.person.node.setPosition(pos)
				setTimeout(() => {
					Tween.stopAllByTag(99)
					Tween.stopAllByTag(100)
					clearTimeout(this.shakeing)
					clearTimeout(this.falling)
					this.role.getChildByName('stand').active = true
					this.role.getChildByName('climb').active = false
					this.role.getChildByName('fall').active = false
					this.role.getChildByName('fly').active = false
				}, 200)
				return
			}
		}

		let isFastTap = false
		let now = (new Date()).getTime()
		if (now - this.tapTime <= 300) isFastTap = true
		this.tapTime = now
		Tween.stopAllByTag(100)
		if (this.falling) {
			clearTimeout(this.falling)
			this.falling = 0
		}
		if (this.shakeing) {
			clearTimeout(this.shakeing)
			this.shakeing = 0
		}

		this.climb.active = true
		if (this.animationing) {
			clearTimeout(this.animationing)
			this.animationing = 0
			this.animation.stop()
		}
		let state = this.animation.getState(`Climb${this.roleIndex}`)
		state.speed = isFastTap ? 3 : 1
		if (!state.isPlaying) this.animation.play(`Climb${this.roleIndex}`)

		this.climb.getChildByName('shake').active = false

		let head = this.climb.getChildByName('Head')
		if (head.getChildByName('Face')) {
			head.getChildByName('Face').active = false
			head.getChildByName('FaceHard').active = true
		}
		this.climb.getChildByName('Sweat').active = true
		this.role.getChildByName('stand').active = false
		this.role.getChildByName('fall').active = false

		let y = 80
		if (this.gamedirection) y *= -1
		if (this.offsetY >= this.climbHeight && !this.gamedirection) y = 0

		tween(this.person.node).tag(99).by(0.3, { position: new Vec3(0, y) }).call(() => {
			this.animationing = setTimeout(() => {
				this.animation.stop()
				if (head.getChildByName('Face')) {
					head.getChildByName('Face').active = true
					head.getChildByName('FaceHard').active = false
				}
				this.climb.getChildByName('Sweat').active = false
			}, 300)
			if (!$.data['super']) {
				this.setShakeing()
			}
		}).start()
		this.person.node.getComponent(AudioSource).play()
	}

	setShakeing() {
		clearTimeout(this.shakeing)
		if ($.data['gamestatus']) return
		this.shakeing = setTimeout(() => {
			let shake = this.climb.getChildByName('shake')
			shake.active = true
			this.animation.play('Shake')
			clearTimeout(this.falling)
			this.falling = setTimeout(() => {
				shake.active = false
				this.animation.stop()
				clearTimeout(this.shakeing)
				this.shakeing = 0
				$.data['person_pos'] = this.person.node.getPosition()
				this.toFall()
			}, 1000)
		}, 2000)
	}

	toFall() {
		let duration = 1.2
		//if (this.gamedirection) duration = 2.0
		let personPos = this.person.node.getPosition()
		if (Math.abs(personPos.y - this.personOriginY) <= this.screenHeight / 2) duration = 0.5

		let isBottom = false
		personPos.y -= this.screenHeight
		if (personPos.y <= this.personOriginY) {
			isBottom = true
			personPos.y = this.personOriginY
		}

		this.climb.active = false
		this.role.getChildByName('fall').active = true

		tween(this.person.node).tag(100).to(duration, { position: personPos }).call(() => {
			this.role.getChildByName(isBottom ? 'stand' : 'climb').active = true
			this.role.getChildByName('fall').active = false
			clearTimeout(this.falling)
			this.falling = 0
			setTimeout(() => {
				this.setShakeing()
			}, 1000)
		}).start()
	}

	update(deltaTime: number) {
		if (!$.data['gamestart'] || $.data['gamestatus']) return
		this.runTime += deltaTime
		this.time.getComponent(Label).string = $.secondConversion(this.runTime)
	}

	togglePoint(e, d) {
		this.node.getChildByName('PointView').active = d !== 'close'
	}

	getPoint() {
		//获取闪电
		$.get('/luobo/data.json').then(json => {
			MiniManager.instance.showVideoAd(json.video_id, () => {
				this.curPoint = 6
				$.storage('game_point', this.curPoint)

				this.menu.play()

				this.node.getChildByName('PointView').active = false
				let tips = this.node.getChildByName('Tips')
				tips.getChildByName('Label').getComponent(Label).string = '领取体力成功'
				tips.getComponent(UIOpacity).opacity = 255
				tips.active = true
				tween(tips.getComponent(UIOpacity)).delay(1).to(0.5, { opacity: 0 }).call(() => {
					tips.active = false
				}).start()

				this.reborn()
			});
		})
	}

	reborn() {
		let curPoint = parseInt($.storage('game_point') || 6)
		if (curPoint <= 0) {
			let pointView = this.node.getChildByName('PointView')
			pointView.active = true
			setTimeout(() => {
				let pos = this.camera.node.getPosition()
				let pointPos = pointView.getPosition()
				pointPos.y = pos.y
				pointView.setPosition(pointPos)
			}, 50)
			return
		}
		curPoint--
		$.storage('game_point', curPoint)

		delete $.data['gamestatus']
		let personPos = this.person.node.getPosition()
		if (personPos.y <= this.personOriginY) return

		$.data['super'] = true

		let role = this.person.node.getChildByName(`role${this.roleIndex}`)
		role.getChildByName('stand').active = false
		role.getChildByName('climb').active = true
		let head = role.getChildByName('climb').getChildByName('Head')
		if (head.getChildByName('Face')) {
			head.getChildByName('Face').active = true
			head.getChildByName('FaceHard').active = false
		}
		role.getChildByName('climb').getChildByName('Sweat').active = false
		role.getChildByName('fall').active = false
		this.person.node.setPosition($.data['person_pos'])
		this.person.node.setRotationFromEuler(v3(0, 0))
		this.person.node.getComponent(UIOpacity).opacity = 100
		this.animation.stop()

		let tips = this.node.getChildByName('Tips')
		tips.getChildByName('Label').getComponent(Label).string = '复活成功'
		tips.getComponent(UIOpacity).opacity = 255
		tips.active = true
		tween(tips.getComponent(UIOpacity)).delay(1).to(0.5, { opacity: 0 }).call(() => {
			tips.active = false
		}).start()

		let orangutan = this.hook.node.getChildByName('Orangutan')
		if (orangutan.active) {
			tween(orangutan).delay(1).by(3, { position: v3(0, -this.screenHeight / 3) }).start()
		}

		setTimeout(() => {
			delete $.data['super']
			this.person.isContacted = false
			tween(this.person.node.getComponent(UIOpacity)).to(0.5, { opacity: 255 }).start()
		}, 2500)
	}

	record(e, isStop?: boolean) {
		let recordLabel = this.recorder.getChildByName('Label').getComponent(Label)
		if (this.isRecording || isStop) {
			if (this.recordMgr) this.recordMgr.stop()
			recordLabel.string = '重新录制'
			this.recorder.getComponent(Sprite).spriteFrame = this.recorderFrames[0]
			this.isRecording = false
			return
		}
		this.recordMgr = MiniManager.instance.gameRecorder((isSuccess, videoPath) => {
			if (isSuccess) {
				this.recordPath = videoPath
				return
			}
			let tips = this.node.getChildByName('Tips')
			tips.getChildByName('Label').getComponent(Label).string = '录屏时间至少为3秒！'
			tips.getComponent(UIOpacity).opacity = 255
			tips.active = true
			tween(tips.getComponent(UIOpacity)).delay(3).to(0.5, { opacity: 0 }).call(() => {
				tips.active = false
			}).start()
		})
		if (this.recordMgr) {
			recordLabel.string = '录屏中'
			this.recorder.getComponent(Sprite).spriteFrame = this.recorderFrames[1]
			this.isRecording = true
		}
	}

	share() {
		if (MiniManager.instance.isMini(sys.Platform.BYTEDANCE_MINI_GAME)) {
			$.get('/luobo/data.json').then(json => {
				MiniManager.instance.shareMessage({
					templateId: json.share_id,
					videoPath: this.recordPath,
					topic: json.topic.split(',')
				})
			})
			return
		}
		MiniManager.instance.shareMessage({
			title: '这游戏真好玩，你快尝试一下！'
		})
	}
}

