const TILE_WIDTH = 20;
const BOARD_SIZE = 30;
const TICK_RATE = 70;

const GAME_BOARD = document.getElementById("gameBoard") as HTMLCanvasElement;
const ctx = GAME_BOARD.getContext("2d");
ctx.imageSmoothingEnabled = false;

const spriteSheet = document.getElementById("spriteSheet") as HTMLImageElement;

var previousTick = 0;
var moveQueue = [];
var gameOver = false;
var gamePaused = false;

enum DIRECTION {
	RIGHT,
	UP,
	LEFT,
	DOWN
}

class GridSegment {
	direction: DIRECTION;
	next_direction: DIRECTION;
	next_segment: GridSegment;
	previous_segment: GridSegment;
	current_spot: [number, number] = [0, 0];

	constructor(direction: DIRECTION, currentSpot: [number, number], nextSegment?: GridSegment) {
		this.direction = direction;
		this.next_direction = direction;
		this.current_spot = currentSpot;
		if (nextSegment) {
			this.next_segment = nextSegment;
			this.next_segment.previous_segment = this;
		}
	}

	move() {
		switch(this.direction) {
			case DIRECTION.RIGHT:
				this.current_spot[0] ++;
				if (this.current_spot[0] > BOARD_SIZE - 1) this.current_spot[0] = 0;
				break;
			case DIRECTION.LEFT:
				this.current_spot[0] --;
				if (this.current_spot[0] < 0) this.current_spot[0] = BOARD_SIZE - 1;
				break;
			case DIRECTION.UP:
				this.current_spot[1] --;
				if (this.current_spot[1] < 0) this.current_spot[1] = BOARD_SIZE - 1;
				break;
			case DIRECTION.DOWN:
				this.current_spot[1] ++;
				if (this.current_spot[1] > BOARD_SIZE - 1) this.current_spot[1] = 0;
				break;
		}
	}

	findFront(): [number, number] {
		const POS: [number, number] = [...this.current_spot];
		
		switch(this.direction) {
			case DIRECTION.RIGHT:
				POS[0] ++;
				break;
			case DIRECTION.LEFT:
				POS[0] --;
				break;
			case DIRECTION.UP:
				POS[1] --;
				break;
			case DIRECTION.DOWN:
				POS[1] ++;
				break;
		}


		return POS;
	}

	draw() {
		let sprite: sprites = "vertical";
		
		if (this == snake_head_cell) {
			switch(this.direction) {
				case DIRECTION.RIGHT:
					sprite = "right";
					break;
				case DIRECTION.LEFT:
					sprite = "left";
					break;
				case DIRECTION.UP:
					sprite = "up";
					break;
				case DIRECTION.DOWN:
					sprite = "down";
					break;
			}
		} else {
			if (this.direction == DIRECTION.RIGHT || this.direction == DIRECTION.LEFT) {
				sprite = "horizontal";
				if (this.next_direction == DIRECTION.UP) {
					sprite = this.direction == DIRECTION.RIGHT ? "90" : "0"
				} else if (this.next_direction == DIRECTION.DOWN) {
					sprite = this.direction == DIRECTION.RIGHT ? "180" : "270"
				}
			} else {
				sprite = "vertical";
				if (this.next_direction == DIRECTION.RIGHT) {
					sprite = this.direction == DIRECTION.UP ? "270" : "0"
				} else if (this.next_direction == DIRECTION.LEFT) {
					sprite = this.direction == DIRECTION.UP ? "180" : "90"
				}
			}
		}

		ctx.drawImage(spriteSheet, SHEET[sprite].x, SHEET[sprite].y, 10, 10, this.current_spot[0] * TILE_WIDTH, this.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
	}

	drawDead() {
		let sprite: sprites = "deadRight";

		switch(this.direction) {
			case DIRECTION.LEFT:
				sprite = "deadLeft";
				break;
			case DIRECTION.UP:
				sprite = "deadUp";
				break;
			case DIRECTION.DOWN:
				sprite = "deadDown";
				break;
		}

		ctx.drawImage(spriteSheet, SHEET[sprite].x, SHEET[sprite].y, 10, 10, this.current_spot[0] * TILE_WIDTH, this.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
	}
}

const BOARD_STATE: [number, number, number][][] = [];

for (let j = 0; j < BOARD_SIZE; j++) {
	BOARD_STATE.push([]);
	for (let i = 0; i < BOARD_SIZE; i++) {
		BOARD_STATE[j].push([i, j, 0]);
	}
}

var snake_head_cell = new GridSegment(DIRECTION.RIGHT, [20, 20]);
var snake_tail_cell = snake_head_cell;

var apple = new GridSegment(DIRECTION.RIGHT, [0, 0]);

addTail([21, 20]);
addTail([22, 20]);
addTail([23, 20]);
addTail([24, 20]);

function spawnApple() {
	let spots = structuredClone(BOARD_STATE);
	let currentSegment = snake_head_cell;
	while (currentSegment) {

		spots[currentSegment.current_spot[1]].splice(currentSegment.current_spot[0], 1);
		
		currentSegment = currentSegment.next_segment;
	}

	let available = [];
	for (let i = 0; i < BOARD_SIZE; i++) {
		available = available.concat(spots[i]);
	}

	const APPLE_SPOT = available[Math.floor(Math.random() * available.length)];

	apple.current_spot = APPLE_SPOT;
}

spawnApple();

function addTail(futureHeadSpot: [number, number]) {

	let newHead = new GridSegment(snake_head_cell.direction, futureHeadSpot, snake_head_cell);
	snake_head_cell = newHead;
}


function drawBoard(time: number) {

	let canMove = true;

	if (gameOver) return;

	if (time - previousTick > TICK_RATE && !gamePaused) {
		previousTick = time;
		if (moveQueue.length > 0) {
			switch (moveQueue[0]) {
				case DIRECTION.RIGHT:
					if (snake_head_cell.direction == DIRECTION.LEFT) break;
					snake_head_cell.next_direction = DIRECTION.RIGHT;
					snake_head_cell.direction = DIRECTION.RIGHT;
					break;
				case DIRECTION.UP:
					if (snake_head_cell.direction == DIRECTION.DOWN) break;
					snake_head_cell.next_direction = DIRECTION.UP;
					snake_head_cell.direction = DIRECTION.UP;
					break;
				case DIRECTION.LEFT:
					if (snake_head_cell.direction == DIRECTION.RIGHT) break;
					snake_head_cell.next_direction = DIRECTION.LEFT;
					snake_head_cell.direction = DIRECTION.LEFT;
					break;
				case DIRECTION.DOWN:
					if (snake_head_cell.direction == DIRECTION.UP) break;
					snake_head_cell.next_direction = DIRECTION.DOWN;
					snake_head_cell.direction = DIRECTION.DOWN;
					break;
			}
		}
		moveQueue.splice(0, 1);
	} else {
		requestAnimationFrame(drawBoard);
		return;
	}

	// Draw the board
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, TILE_WIDTH * BOARD_SIZE, TILE_WIDTH * BOARD_SIZE);
	// for (let j = 0; j < BOARD_SIZE; j++) {
	// 	for (let i = 0; i < BOARD_SIZE; i++) {
	// 	}
	// }

	const FUTURE = snake_head_cell.findFront();
	if (FUTURE[0] == apple.current_spot[0] && FUTURE[1] == apple.current_spot[1]) {
		addTail(FUTURE);
		spawnApple();
		canMove = false;
	}

	// Draw the apple
	ctx.drawImage(spriteSheet, SHEET["apple"].x, SHEET["apple"].y, 10, 10, apple.current_spot[0] * TILE_WIDTH, apple.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);

	// Draw and move the snake
	ctx.fillStyle = "red";
	ctx.strokeStyle = "red";
	ctx.lineWidth = 12;
	ctx.lineJoin = "bevel";
	// ctx.lineCap = "round";
	let currentSegment = snake_head_cell;
	ctx.beginPath();
	while (currentSegment) {
		if (canMove) currentSegment.move();
		if (currentSegment == snake_head_cell) ctx.moveTo(snake_head_cell.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, snake_head_cell.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
		else ctx.lineTo(currentSegment.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, currentSegment.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
		if (currentSegment.next_segment && canMove) {
			currentSegment.next_segment.next_direction = currentSegment.direction;
		}
		if (canMove) currentSegment.direction = currentSegment.next_direction;
		
		if (
			currentSegment != snake_head_cell &&
			currentSegment.current_spot[0] == snake_head_cell.current_spot[0] &&
			currentSegment.current_spot[1] == snake_head_cell.current_spot[1] ) {

			console.log("Game over");
			gameOver = true;
		}

		currentSegment = currentSegment.next_segment;
	}

	ctx.stroke();
	
	if (!gameOver) snake_head_cell.draw();
	else snake_head_cell.next_segment.drawDead();

	requestAnimationFrame(drawBoard);
}

requestAnimationFrame(drawBoard);

document.addEventListener("keydown", (event) => {
	if (event.repeat) return;
	switch (event.key) {
		case "ArrowRight":
			moveQueue.push(DIRECTION.RIGHT);
			break;
		case "ArrowUp":
			moveQueue.push(DIRECTION.UP);
			break;
		case "ArrowLeft":
			moveQueue.push(DIRECTION.LEFT);
			break;
		case "ArrowDown":
			moveQueue.push(DIRECTION.DOWN);
			break;
		case "Escape":
			gamePaused = !gamePaused;
	}
})