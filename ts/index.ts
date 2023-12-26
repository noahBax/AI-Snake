import { drawBoard, move_queue } from "./drawBoard.js";
import { createGraph } from "./findCycle.js";
import { GraphNode } from "./graphNode.js";
import { SnakePathingNode } from "./snakePathNode.js";
import { SnakeSegment } from "./snakeSegment.js";

export const TILE_WIDTH = 36;
export const BOARD_SIZE = 10;
export const TICK_RATE = 0//32;

export var GAME_BOARD: HTMLCanvasElement;
export var PATH_BOARD: HTMLCanvasElement;
export var PHANTOM_BOARD: HTMLCanvasElement;
export var ctx: CanvasRenderingContext2D;
export var path_ctx: CanvasRenderingContext2D;
export var phantom_ctx: CanvasRenderingContext2D;
export var snake_length = 1;

export const LOGGING = false;

export var sprite_sheet: HTMLImageElement;

export default interface InterfaceWindow extends Window {
	snake_length: number;
}

declare global {
	interface Window { 
		snake_length: number;
		last_fuckup: SnakePathingNode;
		snake_head_cell: SnakeSegment;
		snake_tail_cell: SnakeSegment;
		snake_canvas: HTMLCanvasElement;
		move_queue: DIRECTION[];
		board_graph: GraphNode[];
	}
}

window.snake_length = snake_length;

enum DIRECTION {
	RIGHT = "RIGHT",
	UP = "UP",
	LEFT = "LEFT",
	DOWN = "DOWN"
}
export { DIRECTION };

export var game_slow = false;
export var draw_search = true;

var board_state: [number, number, 0 | 1][] = [];

export var snake_head_cell: SnakeSegment;
export var snake_tail_cell: SnakeSegment;
export var apple: SnakeSegment;

export var game_paused = false;

export function spawnApple() {

	let available: [number, number, 0 | 1][] = [...board_state];
	available[apple.location_as_index][2] = 1;

	let current_segment = snake_head_cell;
	while (current_segment) {

		available[current_segment.location_as_index][2] = 1;
		
		current_segment = current_segment.next_segment;
	}


	// Remove the snake parts from the available pool
	for (let i = available.length - 1; i >= 0; i--) {
		if (available[i][2] == 1) {
			available.splice(i, 1);
		} 
	}

	let apple_spot: [number, number, 0 | 1] = available[Math.floor(Math.random() * available.length)];

	if (!apple_spot) apple_spot = available[snake_tail_cell.location_as_index];
	apple.current_spot = [apple_spot[0], apple_spot[1]];

	// Restore the board_state (not a deep copy soo)
	board_state.forEach( b => b[2] = 0);
}

export function addTail(tail_spot?: [number, number]) {
	snake_length++;
	window.snake_length++;
	tail_spot = tail_spot ?? snake_tail_cell.previous_spot;
	let new_tail = new SnakeSegment(snake_tail_cell.previous_direction, tail_spot, snake_tail_cell);
	snake_tail_cell = new_tail;
	window.snake_tail_cell = new_tail;
}

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


function init() {
	snake_head_cell = new SnakeSegment(DIRECTION.RIGHT, [1, 1]);
	snake_tail_cell = snake_head_cell;
	
	for (let j = 0; j < BOARD_SIZE; j++) {
		for (let i = 0; i < BOARD_SIZE; i++) {
			board_state.push([i, j, 0]);
		}
	}
	
	apple = new SnakeSegment(DIRECTION.RIGHT, [0, 0]);

	spawnApple();

	createGraph();
	
	GAME_BOARD = document.getElementById("gameBoard") as HTMLCanvasElement;
	PATH_BOARD = document.getElementById("pathBoard") as HTMLCanvasElement;
	PHANTOM_BOARD = document.getElementById("phantomBoard") as HTMLCanvasElement;
	window.snake_canvas = GAME_BOARD;
	ctx = GAME_BOARD.getContext("2d");
	path_ctx = PATH_BOARD.getContext("2d", { alpha: false });
	phantom_ctx = PHANTOM_BOARD.getContext("2d");
	
	ctx.imageSmoothingEnabled = false;
	
	sprite_sheet = document.getElementById("spriteSheet") as HTMLImageElement;
	
	requestAnimationFrame(drawBoard);
}

init();


// Establish event listeners for manual controls
document.addEventListener("keydown", (event) => {
	if (event.repeat) return;
	switch (event.key) {
		case "ArrowRight":
			move_queue.push(DIRECTION.RIGHT);
			break;
		case "ArrowUp":
			move_queue.push(DIRECTION.UP);
			break;
		case "ArrowLeft":
			move_queue.push(DIRECTION.LEFT);
			break;
		case "ArrowDown":
			move_queue.push(DIRECTION.DOWN);
			break;
		case "Escape":
			game_paused = !game_paused;
	}
})
