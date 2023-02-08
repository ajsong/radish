import { _decorator, Component, Node, tween, v3, Prefab, UITransform, size, Label, Sprite, AudioSource, director, ScrollView, v2, SpriteFrame, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;
import $ from "./Helper"
import MiniManager from './MiniManager';

@ccclass('Menu')
export class Menu extends Component {

	@property(Node)
	private floor: Node = null
	@property(Node)
	private content: Node = null
	@property(Node)
	private skyView: Node = null
	@property(Node)
	private loading: Node = null
	@property(Prefab)
	private sky: Prefab = null
	@property(Prefab)
	private ground: Prefab = null
	@property(Prefab)
	private radish: Prefab = null
	@property(Prefab)
	private radishNew: Prefab = null
	private offsetX: number = 240
	private level: number = 0
	private totalLevel: number = 36
	private lastValue: number = 0

	@property([SpriteFrame])
	private titleFrame: SpriteFrame[] = []
	@property([SpriteFrame])
	private roleFrame: SpriteFrame[] = []
	@property(Node)
	private change: Node = null
	@property(Node)
	private title: Node = null
	@property(Node)
	private role: Node = null
	@property(Node)
	private text: Node = null
	@property(Node)
	private btn: Node = null
	@property(Node)
	private tryBtn: Node = null
	private roleIndex: number = 0

	@property(Node)
	private pointView: Node = null
	@property(Node)
	private pointText: Node = null
	@property(Node)
	private tips: Node = null
	private curPoint: number = 0

	onLoad() {
		this.level = parseInt($.storage('game_level') || 1)
		this.roleIndex = parseInt($.storage('role_index') || 0)
		this.curPoint = parseInt($.storage('game_point') || 6)
	}

	start() {
		let screenWidth = $.designSize().width

		for (let i = 0; i < this.totalLevel; i++) {
			let isLastPass = i + 1 < this.level
			let isPass = i < this.level

			let radish = $.prefab(isPass ? this.radish : this.radishNew)
			let width = radish.getComponent(UITransform).contentSize.width
			let pos = radish.getPosition()
			pos.x += this.offsetX + 100
			radish.setPosition(pos)
			radish.parent = this.content

			if (isPass) {
				radish.on(Node.EventType.TOUCH_START, this.onTouchStart.bind(this, radish), this)
				radish.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel.bind(this, radish), this)
				radish.on(Node.EventType.TOUCH_END, this.toGame.bind(this, i + 1, radish), this)
				radish.getChildByName('radish').getChildByName('text').getComponent(Label).string = `第${i + 1}根`
				if (isLastPass) {
					radish.getChildByName('font').active = true
				}
			}

			this.offsetX = pos.x + width
		}

		let width = this.offsetX + 50
		let height = this.content.getComponent(UITransform).contentSize.height
		this.content.getComponent(UITransform).setContentSize(size(width, height))

		let count = Math.ceil(width / screenWidth) - 1
		for (let i = 1; i <= count; i++) {
			let ground = $.prefab(this.ground)
			let pos = ground.getPosition()
			pos.x = screenWidth * i
			ground.setPosition(pos)
			this.content.insertChild(ground, 0)

			let sky = $.prefab(this.sky)
			pos = sky.getPosition()
			pos.x = screenWidth * i
			sky.setPosition(pos)
			this.skyView.addChild(sky)
		}

		this.floor.on(ScrollView.EventType.SCROLLING, this.onScrolling, this);

		if ($.data['level'] && $.data['level'] > 1) {
			let startIndex = 0
			for (let i = 0; i < this.content.children.length; i++) {
				if (this.content.children[i].name === 'Ban') {
					startIndex = i + 1
					break
				}
			}
			let offsetX = this.content.children[$.data['level'] + startIndex].getPosition().x
			let maxOffsetX = this.floor.getComponent(ScrollView).getMaxScrollOffset().x
			this.floor.getComponent(ScrollView).scrollTo(v2((offsetX - screenWidth / 4 * 3) / maxOffsetX, 0))
			this.onScrolling()
		}

		this.selectRole(null, 0)

		this.pointText.getComponent(Label).string = `${this.curPoint}/6`

		let screenSize = $.screenSize()
		if (screenSize.height / screenSize.width > 1.9) {
			let btnPos = this.node.getChildByName('换角色').getPosition()
			btnPos.x += 50
			this.node.getChildByName('换角色').setPosition(btnPos)

			let pointPos = this.node.getChildByName('Point').getPosition()
			pointPos.x += 50
			this.node.getChildByName('Point').setPosition(pointPos)
		}
	}

	public onScrolling() {
		let value = this.floor.getComponent(ScrollView).getScrollOffset();
		let pos = this.skyView.getPosition()
		pos.x = -320 + value.x / 5;
		this.skyView.setPosition(pos);
	}

	onTouchStart(radish) {
		tween(radish.getChildByName('radish')).to(0.1, { scale: v3(1.1, 1.1) }).start()
	}
	onTouchCancel(radish) {
		tween(radish.getChildByName('radish')).to(0.1, { scale: v3(1, 1) }).start()
	}
	toGame(level, radish) {
		radish.getComponent(AudioSource).play()
		$.data['level'] = level
		tween(radish.getChildByName('radish')).to(0.1, { scale: v3(1, 1) }).call(() => {
			this.loading.active = true
			director.preloadScene('Game', this.onProgress.bind(this), this.onLoadComplete.bind(this));
		}).start()
	}

	onProgress(completedCount, totalCount, item) {
		if (completedCount <= totalCount) {
			let value = parseInt(String(Number((completedCount / totalCount).toFixed(2)) * 100));
			this.lastValue = this.lastValue > value ? this.lastValue : value;
			this.loading.getChildByName('label').getComponent(Label).string = this.lastValue + '%';
			this.loading.getChildByName('fill').getComponent(Sprite).fillRange = this.lastValue / 100;
		}
	}
	onLoadComplete(error, asset) {
		director.loadScene('Game');
	}

	toggleChange(e, d) {
		if (d === 'close') {
			this.change.active = false
			return
		}
		this.change.active = true
		this.title.getComponent(Sprite).spriteFrame = this.titleFrame[this.roleIndex]
		this.role.getComponent(Sprite).spriteFrame = this.roleFrame[this.roleIndex]
		let scale = this.roleIndex >= 2 ? 0.55 : 0.75
		this.role.setScale(v3(scale, scale))
		this.text.active = parseInt($.storage('role_index')) === this.roleIndex
		this.btn.active = false
		this.tryBtn.active = false
		if (this.roleIndex === 0) {
			this.btn.active = parseInt($.storage('role_index')) !== this.roleIndex
		} else if (parseInt($.storage('role_index')) !== this.roleIndex) {
			this.tryBtn.active = true
		}
	}

	selectRole(e, d) {
		this.roleIndex += parseInt(d)
		if (this.roleIndex < 0) this.roleIndex = this.roleFrame.length - 1
		if (this.roleIndex >= this.roleFrame.length) this.roleIndex = 0
		this.title.getComponent(Sprite).spriteFrame = this.titleFrame[this.roleIndex]
		this.role.getComponent(Sprite).spriteFrame = this.roleFrame[this.roleIndex]
		let scale = this.roleIndex === 2 ? 0.55 : 0.75
		this.role.setScale(v3(scale, scale))
		this.text.active = parseInt($.storage('role_index')) === this.roleIndex
		this.btn.active = false
		this.tryBtn.active = false
		if (this.roleIndex === 0) {
			this.btn.active = parseInt($.storage('role_index')) !== this.roleIndex
		} else if (parseInt($.storage('role_index')) !== this.roleIndex) {
			this.tryBtn.active = true
		}
	}

	useRole(e, d) {
		if (typeof d === 'undefined') {
			$.storage('role_index', this.roleIndex)
			this.change.active = false
			return
		}
		//人物试玩
		$.get('/luobo/data.json').then(json => {
			MiniManager.instance.showVideoAd(json.try_play, () => {
				$.storage('role_index', this.roleIndex)
				this.toggleChange(null, null)
			});
		});
	}

	togglePoint(e, d) {
		this.pointView.active = d !== 'close'
	}

	getPoint() {
		//获取闪电
		$.get('/luobo/data.json').then(json => {
			MiniManager.instance.showVideoAd(json.video_id, () => {
				this.curPoint += 6
				$.storage('game_point', this.curPoint)
				this.pointText.getComponent(Label).string = `${this.curPoint}/6`
				this.pointView.active = false
				this.tips.getComponent(UIOpacity).opacity = 255
				this.tips.active = true
				tween(this.tips.getComponent(UIOpacity)).delay(1).to(0.5, { opacity: 0 }).call(() => {
					this.tips.active = false
				}).start()
			});
		})
	}
}

