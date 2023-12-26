import { drawBoard, move_queue } from "./drawBoard.js";
import { createGraph } from "./findCycle.js";
import { SnakeSegment } from "./snakeSegment.js";
export const TILE_WIDTH = 36;
export const BOARD_SIZE = 10;
export const TICK_RATE = 0; //32;
export var GAME_BOARD;
export var PATH_BOARD;
export var PHANTOM_BOARD;
export var ctx;
export var path_ctx;
export var phantom_ctx;
export var snake_length = 1;
export const LOGGING = false;
export var sprite_sheet;
window.snake_length = snake_length;
var DIRECTION;
(function (DIRECTION) {
    DIRECTION["RIGHT"] = "RIGHT";
    DIRECTION["UP"] = "UP";
    DIRECTION["LEFT"] = "LEFT";
    DIRECTION["DOWN"] = "DOWN";
})(DIRECTION || (DIRECTION = {}));
export { DIRECTION };
export var game_slow = false;
export var draw_search = true;
var board_state = [];
export var snake_head_cell;
export var snake_tail_cell;
export var apple;
export var game_paused = false;
export function spawnApple() {
    let available = [...board_state];
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
    let apple_spot = available[Math.floor(Math.random() * available.length)];
    if (!apple_spot)
        apple_spot = available[snake_tail_cell.location_as_index];
    apple.current_spot = [apple_spot[0], apple_spot[1]];
    // Restore the board_state (not a deep copy soo)
    board_state.forEach(b => b[2] = 0);
}
export function addTail(tail_spot) {
    snake_length++;
    window.snake_length++;
    tail_spot = tail_spot ?? snake_tail_cell.previous_spot;
    let new_tail = new SnakeSegment(snake_tail_cell.previous_direction, tail_spot, snake_tail_cell);
    snake_tail_cell = new_tail;
    window.snake_tail_cell = new_tail;
}
export const delay = (ms) => new Promise(res => setTimeout(res, ms));
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
    GAME_BOARD = document.getElementById("gameBoard");
    PATH_BOARD = document.getElementById("pathBoard");
    PHANTOM_BOARD = document.getElementById("phantomBoard");
    window.snake_canvas = GAME_BOARD;
    ctx = GAME_BOARD.getContext("2d");
    path_ctx = PATH_BOARD.getContext("2d", { alpha: false });
    phantom_ctx = PHANTOM_BOARD.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    sprite_sheet = document.getElementById("spriteSheet");
    requestAnimationFrame(drawBoard);
}
init();
// Establish event listeners for manual controls
document.addEventListener("keydown", (event) => {
    if (event.repeat)
        return;
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
});
