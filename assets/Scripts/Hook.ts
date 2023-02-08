import { _decorator, Component, Node, tween, UITransform, size, Quat, v3 } from 'cc';
const { ccclass, property } = _decorator;
import $ from "./Helper"

@ccclass('Hook')
export class Hook extends Component {

	@property(Node)
	private bird: Node = null

	@property(Node)
	private dark: Node = null

	@property(Node)
	private orangutan: Node = null

	private screenHeight: number = 0

	start() {
		this.screenHeight = $.designSize().height
		this.node.children.forEach(children => children.active = false)
	}

	//大鸟
	public goBird() {
		this.bird.active = true
		let pos = this.bird.getPosition()
		pos.x = -580
		tween(this.bird).to(6, { position: pos }).call(() => {
			this.bird.active = false
		}).start()
	}

	//暗牧
	public goDark() {
		this.dark.active = true
		this.dark.getComponent(UITransform).setContentSize(size(1500, 1500))
		tween(this.dark.getComponent(UITransform)).to(0.5, { contentSize: size(500, 500) }).call(() => {
			tween(this.dark.getComponent(UITransform)).delay(8).to(0.5, { contentSize: size(1500, 1500) }).call(() => {
				this.dark.active = false
			}).start()
		}).start()
	}

	//倾斜
	public goSkew(angle = 20) {
		tween(this.node.parent.getChildByName('Activity')).to(0.3, { angle: angle }).call(() => {
			tween(this.node.parent.getChildByName('Activity')).delay(8).to(0.3, { angle: 0 }).start()
		}).start()
	}

	//猩猩
	public goOrangutan() {
		this.orangutan.active = true
		tween(this.orangutan).by(3, { position: v3(0, this.screenHeight / 3) }).call(() => {
			tween(this.orangutan).by(3, { position: v3(0, -this.screenHeight / 3) }).call(() => {
				this.orangutan.active = false
			}).start()
		}).start()
	}

	//地震
	public goEarthquake() {
		let stop = false
		let earthquake = x => {
			tween(this.node.parent.getChildByName('Activity')).by(0.1, { position: v3(70 * x) }).call(() => {
				if (!stop) earthquake(x * -1)
				else tween(this.node.parent.getChildByName('Activity')).to(0.1, { position: v3() }).start()
			}).start()
		}
		earthquake(1)
		setTimeout(() => stop = true, 8000)
	}
}

