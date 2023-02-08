import { _decorator, Component, Node, director, tween, v3, UIOpacity, Label, AudioSource, Sprite, sys } from 'cc';
const { ccclass, property } = _decorator;
import { Game } from './Game';
import $ from './Helper';

@ccclass('MenuLayer')
export class MenuLayer extends Component {

	@property(Node)
	private label: Node = null
	@property(Node)
	private pic: Node = null
	@property(Node)
	private btn: Node = null
	@property(Node)
	private time: Node = null
	@property(Node)
	private text: Node = null
	@property(Node)
	private progress: Node = null
	@property(Node)
	private recorder: Node = null
	@property(Node)
	private loading: Node = null

	private isPlay: boolean = false
	private lastValue: number = 0

	start() {
		let level = parseInt($.data['level'] || 1)
		this.label.getComponent(Label).string = `第${level}根`
		this.btn.active = true
		let gap = 0
		let screenSize = $.screenSize()
		if (screenSize.height / screenSize.width > 1.9) gap = 40
		let pos = this.btn.getPosition()
		pos.x = 200 - gap
		tween(this.btn).to(0.3, { position: pos }).start()
	}

	toMenu() {
		$.data['gamestatus'] = 'stop'
		this.node.parent.active = false;
		this.node.getComponent(AudioSource).play()
		this.loading.active = true
		director.preloadScene('Menu', this.onProgress.bind(this), this.onLoadComplete.bind(this));
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
		director.loadScene('Menu');
	}

	play() {
		if (this.isPlay) return
		let curPoint = parseInt($.storage('game_point') || 6)
		if (curPoint <= 0) {
			this.node.parent.parent.getChildByName('PointView').active = true
			return
		}

		this.isPlay = true
		this.node.getComponent(AudioSource).play()

		tween(this.pic).to(0.1, { scale: v3(1.8, 1.8) }).start()
		tween(this.pic.getComponent(UIOpacity)).to(0.1, { opacity: 0 }).start()
		let pos = this.label.getPosition()
		pos.y = 500
		tween(this.label).by(0.3, { position: pos }).start()
		pos = this.btn.getPosition()
		pos.x = 500
		tween(this.btn).to(0.3, { position: pos }).call(() => {
			this.isPlay = false
			this.time.active = true
			this.text.active = true
			this.progress.active = true
			if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) this.recorder.active = true
			this.node.parent.active = false
			this.node.parent.parent.getComponent(Game).startTap()
			this.node.parent.parent.getComponent(AudioSource).play()
			$.data['gamestart'] = true
			$.data['person_pos'] = this.node.parent.parent.getChildByName('Activity').getChildByName('Person').getPosition()

			let point = this.node.parent.parent.getChildByName('Point')
			let pos = point.getPosition()
			pos.y = -30
			point.setPosition(pos)
			point.getComponent(UIOpacity).opacity = 255
			point.active = true
			tween(point).by(0.5, { position: v3(0, 100) }).call(() => {
				tween(point.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).call(() => point.active = false).start()
			}).start()

			curPoint--
			$.storage('game_point', curPoint)
		}).start()
	}

	update(deltaTime: number) {

	}
}

