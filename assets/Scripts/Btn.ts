import { _decorator, Component, Node, director, AudioSource, Label, Sprite, Camera, UIOpacity, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;
import $ from "./Helper"
import { Person } from './Person';
import { Game } from './Game';
import { Hook } from './Hook';

@ccclass('Btn')
export class Btn extends Component {

	@property(Node)
	private loading: Node = null
	@property(Camera)
	private camera: Camera = null
	@property(Person)
	private person: Person = null
	@property(Hook)
	private hook: Hook = null

	private lastValue: number = 0
	private screenHeight: number = 0
	private roleIndex: number = 0
	private toScene = ''

	onLoad() {
		this.roleIndex = parseInt($.storage('role_index') || 0)
	}

	start() {
		this.screenHeight = $.designSize().height
	}

	resetScene(e, eventData) {
		this.node.getComponent(AudioSource).play()
		if (eventData === 'fail') {
			director.loadScene('Game')
			return
		}
		//this.toGame($.data['level'] + 1)
		this.loading = this.node.parent.parent.parent.getChildByName('Loading')
		this.loading.active = true
		this.toScene = 'Menu'
		director.preloadScene('Menu', this.onProgress.bind(this), this.onLoadComplete.bind(this));
		this.node.parent.active = false
		this.node.parent.parent.active = false
	}

	reborn() {
		this.node.getComponent(AudioSource).play()
		this.node.parent.active = false
		this.node.parent.parent.active = false
		this.person.node.parent.parent.getComponent(Game).reborn()
	}

	toGame(level) {
		$.data['level'] = level
		this.toScene = 'Game'
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
		director.loadScene(this.toScene);
	}

	update(deltaTime: number) {

	}
}

