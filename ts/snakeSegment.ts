import { DIRECTION, BOARD_SIZE, snake_head_cell, ctx, sprite_sheet, TILE_WIDTH } from "./index.js";
import { SHEET, sprites } from "./sheet.js";

class SnakeSegment {
	direction: DIRECTION;
	previous_direction: DIRECTION;
	next_segment: SnakeSegment;
	previous_segment: SnakeSegment;
	current_spot: [number, number] = [0, 0];
	previous_spot: [number, number] = [0, 0];

	constructor(direction: DIRECTION, current_spot: [number, number], previous_segment?: SnakeSegment) {
		this.direction = direction;
		this.previous_direction = direction;
		this.current_spot = current_spot;
		this.previous_spot = [...current_spot];
		if (previous_segment) {
			this.previous_segment = previous_segment;
			this.previous_segment.next_segment = this;
		}
	}

	get location_as_index() {
		return this.current_spot[0] + this.current_spot[1] * BOARD_SIZE;
	}

	move(direction: DIRECTION): DIRECTION {

		this.previous_spot = [...this.current_spot];
		switch(direction) {
			case DIRECTION.RIGHT:
				this.current_spot[0] ++;
				// if (this.current_spot[0] > BOARD_SIZE - 1) {
				// 	just_died = true;
				// 	this.current_spot[0]--
				// }
				break;
			case DIRECTION.LEFT:
				this.current_spot[0] --;
				// if (this.current_spot[0] < 0) {
				// 	just_died = true;
				// 	this.current_spot[0]++;
				// }
				break;
			case DIRECTION.UP:
				this.current_spot[1] --;
				// if (this.current_spot[1] < 0) {
				// 	just_died = true;
				// 	this.current_spot[1]++;
				// }
				break;
			case DIRECTION.DOWN:
				this.current_spot[1] ++;
				// if (this.current_spot[1] > BOARD_SIZE - 1) {
				// 	just_died = true;
				// 	this.current_spot[1]--;
				// }
				break;
		}

		this.previous_direction = this.direction;
		this.direction = direction;


		return this.previous_direction;
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

	get center(): [number, number] {
		return [this.current_spot[0] * TILE_WIDTH + TILE_WIDTH / 2, this.current_spot[1] * TILE_WIDTH + TILE_WIDTH / 2];
	}
	
	get corner(): [number, number] {
		return [this.current_spot[0] * TILE_WIDTH, this.current_spot[1] * TILE_WIDTH];
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

	// get past_spot(): [number, number] {
	// 	const POS: [number, number] = [...this.current_spot];
		
	// 	switch(this.previous_direction) {
	// 		case DIRECTION.LEFT:
	// 			POS[0] ++;
	// 			break;
	// 		case DIRECTION.RIGHT:
	// 			POS[0] --;
	// 			break;
	// 		case DIRECTION.DOWN:
	// 			POS[1] --;
	// 			break;
	// 		case DIRECTION.UP:
	// 			POS[1] ++;
	// 			break;
	// 	}

	// 	return POS;
	// }

	whatsInDirection(direction: DIRECTION): [number, number] {
		const POS: [number, number] = [...this.current_spot];
		
		switch(direction) {
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

	drawHead() {
		let sprite: sprites = "vertical";
		
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

		ctx.drawImage(sprite_sheet, SHEET[sprite].x, SHEET[sprite].y, 10, 10, ...this.corner, TILE_WIDTH, TILE_WIDTH);
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

		ctx.drawImage(sprite_sheet, SHEET[sprite].x, SHEET[sprite].y, 10, 10, this.current_spot[0] * TILE_WIDTH, this.current_spot[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
	}


	static isSpotValid(location: [number, number]): boolean {

		if (location[0] > BOARD_SIZE - 1) 	return false;
		if (location[0] < 0) 				return false;
		if (location[1] < 0) 				return false;
		if (location[1] > BOARD_SIZE - 1) 	return false;

		return true;
		
	}
}

export { SnakeSegment };