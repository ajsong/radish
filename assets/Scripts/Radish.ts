import { _decorator, Component, Node, animation, Vec3, Prefab, SpriteFrame, Sprite, AudioSource } from 'cc';
const { ccclass, property } = _decorator;
import { MaoAnimation } from './MaoAnimation';
import $ from "./Helper"

export enum RadishSkin {
	White,
	GreenBegin,
	Green
}

@ccclass('Radish')
export class Radish extends Component {

	@property(SpriteFrame)
	private greenBegin: SpriteFrame = null
	@property(SpriteFrame)
	private green: SpriteFrame = null

	@property(Prefab)
	private keng: Prefab = null

	private timer: number[] = []
	private animation: MaoAnimation[] = []

	public setBody(skin: RadishSkin) {
		switch (skin) {
			case RadishSkin.GreenBegin:
				this.node.getComponent(Sprite).spriteFrame = this.greenBegin
				break
			case RadishSkin.Green:
				this.node.getComponent(Sprite).spriteFrame = this.green
				break
		}
	}

	public addKeng(max = 2) {
		if (max <= 0) return
		for (let i = 0; i < $.random(max - 1, max); i++) {
			this.setKeng(i)
		}
	}

	setKeng(index) {
		let keng = $.prefab(this.keng)
		keng.parent = this.node
		let pos = new Vec3(-138, $.random(-360, 360))
		keng.setPosition(pos)
		let scale = keng.getScale()
		scale.x = scale.y = $.random(4, 12) / 10
		keng.setScale(scale)

		let mao = keng.getChildByName('Mao')
		let animation = mao.getComponent(MaoAnimation)
		this.animation.push(animation)

		this.runAnimation(index)
	}

	runAnimation(index: number) {
		if ($.data['gamestatus'] === 'success') {
			this.timer.forEach(timer => {
				clearTimeout(timer)
			})
			return
		}
		if (this.timer.length > index) clearTimeout(this.timer[index])
		let timer = setTimeout(() => {
			if ($.data['gamestart']) this.node.getComponent(AudioSource).play()
			this.animation[index].play()
			this.runAnimation(index)
		}, $.random(2000, 5000))
		this.timer.splice(index, 1, timer)
	}

	onDestroy() {
		this.timer.forEach(timer => {
			clearTimeout(timer)
		})
	}

	update(deltaTime: number) {

	}
}

