import { path_ctx, snake_head_cell, TICK_RATE, apple, addTail, spawnApple, ctx, sprite_sheet, TILE_WIDTH, snake_length, BOARD_SIZE, game_paused, snake_tail_cell, LOGGING } from "./index.js";
import { findCycle } from "./findCycle.js";
import { SHEET } from "./sheet.js";
import { SnakeSegment } from "./snakeSegment.js";
var DIRECTION;
(function (DIRECTION) {
    DIRECTION["RIGHT"] = "RIGHT";
    DIRECTION["UP"] = "UP";
    DIRECTION["LEFT"] = "LEFT";
    DIRECTION["DOWN"] = "DOWN";
})(DIRECTION || (DIRECTION = {}));
var previous_tick = 0;
export var move_queue = [];
window.move_queue = move_queue;
var game_over = false;
var game_win = false;
var game_started = false;
var death_by_self = false;
var moved_off_map = false;
function drawBoard(time) {
    if (!game_started) {
        path_ctx.fillStyle = "white";
        path_ctx.fillRect(0, 0, 1000, 1000);
        const moves = findCycle();
        move_queue.push(...moves);
        game_started = true;
    }
    if (game_over)
        return;
    if (time - previous_tick > TICK_RATE && !game_paused) {
        previous_tick = time;
    }
    else {
        requestAnimationFrame(drawBoard);
        return;
    }
    if (!game_over && snake_head_cell.location_as_index == apple.location_as_index) {
        addTail();
        if (snake_length < BOARD_SIZE * BOARD_SIZE) {
            spawnApple();
            path_ctx.fillStyle = "white";
            path_ctx.fillRect(0, 0, 600, 600);
            // Draw the apple
            ctx.drawImage(sprite_sheet, SHEET["apple"].x, SHEET["apple"].y, 10, 10, ...apple.corner, TILE_WIDTH, TILE_WIDTH);
            const moves = findCycle();
            if (LOGGING)
                console.log(`${moves.length} moves received`);
            if (LOGGING)
                console.log([...moves]);
            if (moves.length == 0) {
                if (LOGGING)
                    console.log("fails");
                game_over = true;
            }
            else {
                move_queue = moves;
                window.move_queue = move_queue;
            }
            // if (game_slow) await delay(1000);
        }
        else {
            game_over = true;
            game_win = true;
            if (LOGGING)
                console.log("U R Winner");
        }
    }
    if (move_queue.length == 0 && !game_over) {
        path_ctx.fillStyle = "white";
        path_ctx.fillRect(0, 0, 600, 600);
        // Draw the apple
        const moves = findCycle();
        if (LOGGING)
            console.log(`${moves.length} moves received`);
        if (LOGGING)
            console.log([...moves]);
        if (moves.length != 0) {
            move_queue = moves;
            window.move_queue = move_queue;
        }
    }
    // Draw the board
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, TILE_WIDTH * BOARD_SIZE, TILE_WIDTH * BOARD_SIZE);
    // Draw the apple
    ctx.drawImage(sprite_sheet, SHEET["apple"].x, SHEET["apple"].y, 10, 10, ...apple.corner, TILE_WIDTH, TILE_WIDTH);
    // Draw and move the snake
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = TILE_WIDTH / 2;
    ctx.lineJoin = "bevel";
    ctx.lineCap = "round";
    let in_direction = move_queue.pop() ?? snake_head_cell.direction;
    const FRONT_VALID = SnakeSegment.isSpotValid(snake_head_cell.whatsInDirection(in_direction));
    if (!FRONT_VALID)
        game_over = true;
    let curr_segment = snake_head_cell;
    // Move the snake
    while (!game_over && curr_segment) {
        in_direction = curr_segment.move(in_direction);
        curr_segment = curr_segment.next_segment;
    }
    // Check to see if the game is over via snake overlap
    curr_segment = snake_head_cell.next_segment;
    while (curr_segment) {
        if (curr_segment.current_spot[0] == snake_head_cell.current_spot[0] &&
            curr_segment.current_spot[1] == snake_head_cell.current_spot[1]) {
            if (LOGGING)
                console.log("Game over");
            game_over = true;
            death_by_self = true;
        }
        curr_segment = curr_segment.next_segment;
    }
    // Draw the snake
    curr_segment = snake_head_cell;
    ctx.moveTo(...curr_segment.center);
    ctx.beginPath();
    while (curr_segment) {
        if (curr_segment.direction != curr_segment.previous_segment?.direction ||
            curr_segment == snake_tail_cell ||
            curr_segment == snake_head_cell) {
            ctx.lineTo(...curr_segment.center);
        }
        curr_segment = curr_segment.next_segment;
    }
    ctx.stroke();
    if (!game_over || game_win) {
        snake_head_cell.drawHead();
    }
    else {
        snake_head_cell.drawDead();
    }
    requestAnimationFrame(drawBoard);
}
export { drawBoard };
