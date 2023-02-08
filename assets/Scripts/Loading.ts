import { _decorator, Component, Node, director, Label, Sprite, AudioSource } from 'cc';
const { ccclass, property } = _decorator;
import $ from "./Helper"

@ccclass('Loading')
export class Loading extends Component {

	@property(Node)
	private loading: Node = null

	private lastValue: number = 0

	start() {
		this.toGame()
	}

	toGame() {
		let level = parseInt($.storage('game_level') || 0)
		if (!level) {
			level = 1
			$.storage('game_level', level)
		}
		if (!$.storage('role_index')) $.storage('role_index', 0)
		if (!$.storage('game_point')) $.storage('game_point', 6)
		$.data['level'] = level
		director.preloadScene('Game', this.onProgress.bind(this), this.onLoadComplete.bind(this));
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

	update(deltaTime: number) {

	}
}

