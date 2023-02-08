import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MaoAnimation')
export class MaoAnimation extends Component {

	private children: Node[] = null
	private timer: number = 0
	private index: number = 0

	start() {
		this.children = this.node.children.slice()
	}

	onDestroy() {
		clearInterval(this.timer)
	}

	public play() {
		if (this.timer) return
		this.node.active = true
		this.index = 0
		this.timer = setInterval(() => {
			if (this.index > this.children.length - 1) return
			this.children[this.index].active = false
			if (this.index >= this.children.length - 1) {
				clearInterval(this.timer)
				this.timer = 0
				this.node.active = false
				return
			}
			this.index++
			this.children[this.index].active = true
		}, 50)
	}

	update(deltaTime: number) {

	}
}

