import { _decorator, Component, Node, BoxCollider2D, Contact2DType, UITransform, tween, Tween, size, v3 } from 'cc';
import { Game } from './Game';
import { Hook } from './Hook';
const { ccclass, property } = _decorator;
import $ from "./Helper"

@ccclass('Person')
export class Person extends Component {

	@property(Node)
	private hit: Node = null

	@property(Hook)
	private hook: Hook = null

	public isContacted: boolean = false

	start() {
		let collider = this.node.getComponent(BoxCollider2D)
		collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this)
	}

	onBeginContact(self, other) {
		if ($.data['super'] || $.data['gamestatus']) return
		if (other.node.name === 'Line') {
			$.data['gamestatus'] = 'fail'
			this.showFail()
		}
		if ($.inArray(other.node.name, ['MaoSprite', 'Orangutan']) > -1) {
			$.data['gamestatus'] = 'fail'
			if (!this.isContacted) $.data['person_pos'] = self.node.getPosition()
			this.hit.active = true
			setTimeout(() => this.hit.active = false, 100)
			let _this = this
			let gamedirection = this.node.parent.parent.getComponent(Game).gamedirection
			tween(this.node).by(0.3, {
				position: v3($.window().width * (gamedirection ? 1 : -1), -100),
				angle: 720
			}).call(() => {
				_this.showFail()
			}).start()
		}
		if ($.inArray(other.node.name, ['Line', 'MaoSprite', 'Orangutan']) > -1) {
			this.isContacted = true
			let game = this.node.parent.parent.getComponent(Game)
			clearTimeout(game.falling)
			game.falling = 0
			clearTimeout(game.shakeing)
			game.shakeing = 0
			Tween.stopAllByTag(99)
			Tween.stopAllByTag(100)

			let dark = this.hook.node.getChildByName('Dark')
			if (dark.active) {
				tween(dark.getComponent(UITransform)).to(0.5, { contentSize: size(1500, 1500) }).call(() => {
					dark.active = false
				}).start()
			}

			let orangutan = this.hook.node.getChildByName('Orangutan')
			if (orangutan.active) {
				Tween.stopAllByTarget(orangutan)
			}
		}
	}

	showFail() {
		setTimeout(() => {
			this.isContacted = false
			let pos = this.node.parent.parent.getChildByName('Camera').getPosition()
			pos.z = 0
			let result = this.node.parent.parent.getChildByName('Result')
			result.setPosition(pos)
			result.active = true
			result.getChildByName('Fail').active = true
		}, 200)
	}

	update(deltaTime: number) {

	}
}

