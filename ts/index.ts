const TILE_WIDTH = 20;
const BOARD_SIZE = 30;
const TICK_RATE = 10;

const GAME_BOARD = document.getElementById("gameBoard") as HTMLCanvasElement;
const PATH_BOARD = document.getElementById("pathBoard") as HTMLCanvasElement;
const ctx = GAME_BOARD.getContext("2d");
const path_ctx = PATH_BOARD.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = false;

const spriteSheet = document.getElementById("spriteSheet") as HTMLImageElement;

enum DIRECTION {
	RIGHT = "RIGHT",
	UP = "UP",
	LEFT = "LEFT",
	DOWN = "DOWN"
}

var previousTick = 0;
var moveQueue = [DIRECTION.RIGHT];
var gameOver = false;
var gamePaused = false;
var game_started = false;


class GridSegment {
	direction: DIRECTION;
	next_direction: DIRECTION;
	previous_direction: DIRECTION;
	next_segment: GridSegment;
	previous_segment: GridSegment;
	current_spot: [number, number] = [0, 0];
	previous_spot: [number, number] = [0, 0];
	just_tpd = false;

	constructor(direction: DIRECTION, current_spot: [number, number], previous_segment?: GridSegment) {
		this.direction = direction;
		this.next_direction = direction;
		this.previous_direction = direction;
		this.current_spot = current_spot;
		this.previous_spot = [...current_spot];
		if (previous_segment) {
			this.previous_segment = previous_segment;
			this.previous_segment.next_segment = this;
		}
	}

	move() {
		this.just_tpd = false;
		this.previous_spot = [...this.current_spot];
		switch(this.direction) {
			case DIRECTION.RIGHT:
				this.current_spot[0] ++;
				if (this.current_spot[0] > BOARD_SIZE - 1) {
					this.current_spot[0] = 0;
					this.just_tpd = true;
				}
				break;
			case DIRECTION.LEFT:
				this.current_spot[0] --;
				if (this.current_spot[0] < 0) {
					this.current_spot[0] = BOARD_SIZE - 1;
					this.just_tpd = true;
				}
				break;
			case DIRECTION.UP:
				this.current_spot[1] --;
				if (this.current_spot[1] < 0) {
					this.current_spot[1] = BOARD_SIZE - 1;
					this.just_tpd = true;
				}
				break;
			case DIRECTION.DOWN:
				this.current_spot[1] ++;
				if (this.current_spot[1] > BOARD_SIZE - 1) {
					this.current_spot[1] = 0;
					this.just_tpd = true;
				}
				break;
		}
	}

	get front_spot(): [number, number] {
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


	get behind_spot(): [number, number] {
		const POS: [number, number] = [...this.current_spot];
		
		switch(this.direction) {
			case DIRECTION.LEFT:
				POS[0] ++;
				break;
			case DIRECTION.RIGHT:
				POS[0] --;
				break;
			case DIRECTION.DOWN:
				POS[1] --;
				break;
			case DIRECTION.UP:
				POS[1] ++;
				break;
		}


		return POS;
	}

	get future_spot(): [number, number] {
		const POS: [number, number] = [...this.current_spot];
		
		switch(this.next_direction) {
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

const BOARD_STATE: [number, number, 0 | 1][][] = [];

for (let j = 0; j < BOARD_SIZE; j++) {
	BOARD_STATE.push([]);
	for (let i = 0; i < BOARD_SIZE; i++) {
		BOARD_STATE[j].push([i, j, 0]);
	}
}

var snake_head_cell = new GridSegment(DIRECTION.RIGHT, [20, 20]);
var snake_tail_cell = snake_head_cell;

var apple = new GridSegment(DIRECTION.RIGHT, [0, 0]);

addTail([19, 20]);
addTail([18, 20]);
addTail([17, 20]);
addTail([16, 20]);

function spawnApple() {
	let spots = structuredClone(BOARD_STATE);
	spots[apple.current_spot[1]][apple.current_spot[0]][2] = 1;
	let currentSegment = snake_head_cell;
	while (currentSegment) {

		spots[currentSegment.current_spot[1]][currentSegment.current_spot[0]][2] = 1;
		
		currentSegment = currentSegment.next_segment;
	}

	let available: [number, number, 0 | 1][] = [];
	for (let i = 0; i < BOARD_SIZE; i++) {
		available = available.concat(spots[i]);
	}

	for (let i = available.length - 1; i >= 0; i--) {
		if (available[i][2] == 1) {
			available.splice(i, 1);
		} 
	}

	const APPLE_SPOT = available[Math.floor(Math.random() * available.length)];

	apple.current_spot = [APPLE_SPOT[0], APPLE_SPOT[1]];
}

spawnApple();

function addTail(tail_spot?: [number, number]) {
	tail_spot = tail_spot ?? snake_tail_cell.previous_spot;
	let new_tail = new GridSegment(snake_tail_cell.previous_direction, tail_spot, snake_tail_cell);
	snake_tail_cell = new_tail;
}


async function drawBoard(time: number) {

	if (!game_started) {
		path_ctx.fillStyle = "white";
		path_ctx.fillRect(0, 0, 600, 600);
		const moves = await findHamiltononianCycle(snake_head_cell.direction);
		moveQueue.push(...moves);
		game_started = true;
	}

	if (gameOver) return;

	if (time - previousTick > TICK_RATE && !gamePaused) {
		previousTick = time;
		if (moveQueue.length > 0) {
			switch (moveQueue[0]) {
				case DIRECTION.RIGHT:
					// if (snake_head_cell.direction == DIRECTION.LEFT) break;
					snake_head_cell.next_direction = DIRECTION.RIGHT;
					snake_head_cell.direction = DIRECTION.RIGHT;
					break;
				case DIRECTION.UP:
					// if (snake_head_cell.direction == DIRECTION.DOWN) break;
					snake_head_cell.next_direction = DIRECTION.UP;
					snake_head_cell.direction = DIRECTION.UP;
					break;
				case DIRECTION.LEFT:
					// if (snake_head_cell.direction == DIRECTION.RIGHT) break;
					snake_head_cell.next_direction = DIRECTION.LEFT;
					snake_head_cell.direction = DIRECTION.LEFT;
					break;
				case DIRECTION.DOWN:
					// if (snake_head_cell.direction == DIRECTION.UP) break;
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

	const FUTURE = snake_head_cell.front_spot;
	if (FUTURE[0] == apple.current_spot[0] && FUTURE[1] == apple.current_spot[1]) {
		addTail();
		spawnApple();
		path_ctx.fillStyle = "white";
		path_ctx.fillRect(0, 0, 600, 600);
		// Draw the apple
		ctx.drawImage(spriteSheet, SHEET["apple"].x, SHEET["apple"].y, 10, 10, apple.current_spot[0] * TILE_WIDTH, apple.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
		const moves = await findHamiltononianCycle(snake_head_cell.direction);
		if (moves.length == 0) return;
		moveQueue = moves;
		// moveQueue.push(...moves);
		// await delay(500);
	}

	// Draw the board
	ctx.fillStyle = "white";
	ctx.clearRect(0, 0, TILE_WIDTH * BOARD_SIZE, TILE_WIDTH * BOARD_SIZE);
	// for (let j = 0; j < BOARD_SIZE; j++) {
	// 	for (let i = 0; i < BOARD_SIZE; i++) {
	// 	}
	// }


	// Draw the apple
	ctx.drawImage(spriteSheet, SHEET["apple"].x, SHEET["apple"].y, 10, 10, apple.current_spot[0] * TILE_WIDTH, apple.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);

	// Draw and move the snake
	ctx.strokeStyle = "#00FF00";
	ctx.lineWidth = 12;
	ctx.lineJoin = "bevel";
	// ctx.lineCap = "round";
	let curr_segment = snake_head_cell;
	ctx.beginPath();
	while (curr_segment) {
		curr_segment.move();
		if (curr_segment == snake_head_cell) ctx.moveTo(curr_segment.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
		if (curr_segment.previous_segment?.just_tpd) {
			if (curr_segment.next_direction == curr_segment.direction && (curr_segment.next_direction != curr_segment.direction || !curr_segment.next_segment)) {
				ctx.moveTo(curr_segment.front_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.front_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
			} else {
				ctx.moveTo(curr_segment.future_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.future_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
				ctx.lineTo(curr_segment.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
			}
			ctx.fillStyle = "#5600ff"; // Blue portal
			ctx.fillRect(curr_segment.current_spot[0] * TILE_WIDTH, curr_segment.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
		} else if (curr_segment.just_tpd) {
			ctx.lineTo(curr_segment.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
			ctx.lineTo(curr_segment.behind_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.behind_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
			ctx.fillStyle = "#fd6600"; // Orange portal
			ctx.fillRect(curr_segment.current_spot[0] * TILE_WIDTH, curr_segment.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
		} else if (curr_segment.next_direction != curr_segment.direction || !curr_segment.next_segment) {
			
			// ctx.fillStyle = "green";
			// ctx.fillRect(curr_segment.current_spot[0] * TILE_WIDTH, curr_segment.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
			ctx.lineTo(curr_segment.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, curr_segment.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2);
		}
		if (curr_segment.next_segment) {
			curr_segment.next_segment.next_direction = curr_segment.direction;
		}
		curr_segment.previous_direction = curr_segment.direction;
		curr_segment.direction = curr_segment.next_direction;
		
		if (
			curr_segment != snake_head_cell &&
			curr_segment.current_spot[0] == snake_head_cell.current_spot[0] &&
			curr_segment.current_spot[1] == snake_head_cell.current_spot[1] ) {

			console.log("Game over");
			gameOver = true;
		}

		curr_segment = curr_segment.next_segment;
	}

	ctx.stroke();
	
	if (!gameOver) snake_head_cell.draw();
	else snake_head_cell.next_segment.drawDead();

	requestAnimationFrame(drawBoard);
}

createGraph();
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