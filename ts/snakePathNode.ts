import { BOARD_GRAPH } from "./findCycle.js";
import { GraphNode } from "./graphNode.js";
import { BOARD_SIZE, DIRECTION, LOGGING, TILE_WIDTH, draw_search, path_ctx, snake_length } from "./index.js";

class SnakePathingNode {
	readonly location: [number, number];
	readonly direction: DIRECTION;
	readonly prev_direction: DIRECTION;
	readonly next_node: SnakePathingNode | undefined;

	source_node: GraphNode;
	goal_node: GraphNode;

	readonly is_original: boolean;
	
	readonly g: number;	// Length of current travel
	readonly h: number;	// Estimated length to end
	readonly t: number;	// Number of turns
	readonly f: number;	// Sum of heuristics

	private readonly visited: number[] = [];

	readonly location_as_index: number;
	constructor(graph_node: GraphNode, g_cost: number, end_node: GraphNode, direction: DIRECTION, prev_direction?: DIRECTION, next_node?: SnakePathingNode, is_original?: boolean) 
	constructor(snake_node: SnakePathingNode, next_node?: SnakePathingNode)
	constructor(origin_node: SnakePathingNode | GraphNode, g_cost_or_next: number | SnakePathingNode, end_node?: GraphNode, direction?: DIRECTION, prev_direction?: DIRECTION, next_node?: SnakePathingNode, is_original=false){

		if (origin_node instanceof GraphNode) {
			this.location = origin_node.location;
			this.location_as_index = this.location[0] + this.location[1] * BOARD_SIZE;
	
			this.source_node = origin_node;
			this.goal_node = end_node;
			this.direction = direction;
			this.prev_direction = prev_direction;
			this.is_original = is_original;

			this.next_node = next_node;
			this.visited = [origin_node.location_as_index];
			if (next_node) this.visited.push(...next_node.visited);
			this.visited.splice(snake_length);
	
			this.t = 0;
			if (next_node) this.t = next_node.t;
			if (next_node && this.direction != next_node.direction) this.t++;

			this.g = g_cost_or_next as number;
			// Manhattan distance
			// this.h = Math.abs(end_node.location[0] - this.location[0]) + Math.abs(end_node.location[1] - this.location[1]);
			// Direct distance
			this.h = Math.sqrt((end_node.location[0] - this.location[0])**2 + (end_node.location[1] - this.location[1])**2);
	
			this.f = this.g + this.h;// + this.t;

		} else {
			this.location = origin_node.location;
			this.location_as_index = origin_node.location_as_index;
	
			this.source_node = origin_node.source_node;
			this.goal_node = origin_node.goal_node;
			this.direction = origin_node.direction;
			this.prev_direction = origin_node.prev_direction;
			this.is_original = origin_node.is_original;
	
			this.g = origin_node.g;
			this.h = origin_node.h;
			this.t = origin_node.t;
			this.f = origin_node.f;

			this.next_node = g_cost_or_next as SnakePathingNode;
			this.visited = origin_node.visited;	// References don't matter for my use of them
		}
	}
	
	colorNode(color: string) {
		if (!draw_search) return;
		path_ctx.fillStyle = color;
		path_ctx.fillRect(this.location[0] * TILE_WIDTH, this.location[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
	}

	checkIsSnake(node: { location_as_index: number}, exclude_end=false): boolean {

		const has_visited = this.visited.includes(node.location_as_index);

		if (!exclude_end || !has_visited) return has_visited;
		// Else...
		return this.visited[snake_length - 1] != node.location_as_index;
	}

	cellBehindSelf(directly: boolean): GraphNode {
		if (directly) {
			switch(this.direction) {
				case (DIRECTION.LEFT):
					return this.source_node.neighbors[DIRECTION.RIGHT];
				case (DIRECTION.RIGHT):
					return this.source_node.neighbors[DIRECTION.LEFT];
				case (DIRECTION.UP):
					return this.source_node.neighbors[DIRECTION.DOWN];
				case (DIRECTION.DOWN):
					return this.source_node.neighbors[DIRECTION.UP];
			}
		}

		switch(this.prev_direction) {
			case (DIRECTION.LEFT):
				return this.source_node.neighbors[DIRECTION.RIGHT];
			case (DIRECTION.RIGHT):
				return this.source_node.neighbors[DIRECTION.LEFT];
			case (DIRECTION.UP):
				return this.source_node.neighbors[DIRECTION.DOWN];
			case (DIRECTION.DOWN):
				return this.source_node.neighbors[DIRECTION.UP];
		}
	}

	findCurrentTail(do_along_the_way?: (node: SnakePathingNode) => void, just_behind=false): SnakePathingNode {
		let curr_tail: SnakePathingNode = this;
		let layers_to_drop = snake_length - 1;
		while (layers_to_drop > 0) {
			if (do_along_the_way) do_along_the_way(curr_tail);
			layers_to_drop--;
			curr_tail = curr_tail.next_node;
		}
		// if (do_along_the_way) do_along_the_way(curr_tail);
		if (just_behind) curr_tail = curr_tail.next_node;
		return curr_tail;
	}

	trimSnake(len=0): SnakePathingNode {

		// Recursively create the new snake
		if (len < snake_length) {
			return new SnakePathingNode(this, this.next_node.trimSnake(len+1));
		} else {
			return new SnakePathingNode(this);
		}
	}

	mapHistory(map_function: (node: SnakePathingNode) => void) {
		map_function(this);
		this.next_node?.mapHistory(map_function);
	}

	// Returns instructions in reverse order
	// Use instrs.pop() to get them in the correct order
	compileInstructions(): DIRECTION[] {
		const instructions: DIRECTION[] = [];
		let snake_segment: SnakePathingNode = this;
		while(!snake_segment.is_original) {
			instructions.push(snake_segment.direction);

			snake_segment = snake_segment.next_node;
		}
		// instructions.pop();

		return instructions;
	}

	getNeighbors(opened: {[key in number]: SnakePathingNode[]}, closed: {[key in number]: SnakePathingNode[]}, one_step_in_future=false): SnakePathingNode[] {
		const ret: SnakePathingNode[] = [];

		function checkNeighbor(snake_node: SnakePathingNode, i: string): false | SnakePathingNode {
			let neighbor: GraphNode = snake_node.source_node.neighbors[i];
			// The neighbor doesn't exist or the neighbor is currently part of the snake
			if (!neighbor || snake_node.checkIsSnake(neighbor, one_step_in_future)) return false;
	
			let neighbor_node = new SnakePathingNode(neighbor, snake_node.g + 1, snake_node.goal_node, DIRECTION[i], snake_node.direction, snake_node);
			
			const has_been_opened = opened[neighbor_node.g]?.some( node => {
				return node.source_node == neighbor &&
					   node.direction == neighbor_node.direction;
			});
			const has_been_closed = closed[neighbor_node.g]?.some( node => {
				return node.source_node == neighbor &&
					   node.direction == neighbor_node.direction;
			});
			
			if (!(has_been_opened || has_been_closed)) {
				neighbor_node.colorNode("#db7b2b"); // Orange
	
				return neighbor_node;
			}

			return false;
		}
		
		for (const i in this.source_node.neighbors) {
			const t = checkNeighbor(this, i);
			if (t) ret.push(t);
		}

		return ret;

	}

	// async findPathToTail(): Promise<SnakePathingNode> {
	// 	let final_paths: [boolean, number, number, number, SnakePathingNode][] = [];
		
	// 	const opened: SnakePathingNode[] = [];
	// 	const closed: SnakePathingNode[] = [];

	// 	const tail_node = this.findCurrentTail().source_node;

	// 	const next_node = new SnakePathingNode(this.source_node.neighbors[this.direction], 0, tail_node, this.direction, this.trimSnake());

	// 	opened.push(next_node)
		
	// 	while (opened.length > 0) {
			
	// 		// Find which current node we are looking at
	// 		let best_node: SnakePathingNode = opened[0];
	// 		let best_index = 0;
			
	// 		for (let i = 1; i < opened.length; i++) {
	// 			if (opened[i].f < best_node.f) {
	// 				best_node = opened[i];
	// 				best_index = i;
	// 			}
	// 		}

	// 		// Now pull this node out of the open set and put it in the closed set
	// 		opened.splice(best_index, 1);
	// 		closed.push(best_node);

	// 		// Check to see if this is the end
	// 		if (best_node.source_node == tail_node) {
	// 			best_node.cleanSearchHistory();
	// 			return best_node.trimSnake();
	// 		}

	// 		const neighbors = [];
	// 		for (const d in DIRECTION) {
	// 			if (best_node.source_node[d]) {
	// 				const neighbor_node = new SnakePathingNode(best_node.source_node[d], best_node.g + 1, tail_node, DIRECTION[d], best_node)
	// 				const check_opened = opened.some(node => {
	// 					return node.source_node == neighbor_node.source_node && node.g == neighbor_node.g && node.h == neighbor_node.h && node.direction == neighbor_node.direction;
	// 				});
	// 				const check_closed = closed.some(node => {
	// 					return node.source_node == neighbor_node.source_node && node.g == neighbor_node.g && node.h == neighbor_node.h && node.direction == neighbor_node.direction;
	// 				});
	// 				if (!check_closed && !check_opened) {
	// 					if (!check_opened)
	// 						neighbor_node.colorNode("#db7b2b"); // Orange
	// 					else
	// 						neighbor_node.colorNode("#99c140"); // Green (check_closed)
	// 					neighbor_node.visited_history = [curr_node.source_node];
	// 					neighbor_node.visited_history.push(...curr_node.visited_history);
	// 					neighbor_node.next_node = curr_node;
	// 					opened.push(neighbor_node);
	// 				}
	// 			}
	// 		}

	// 		best_node.cleanSearchHistory();

	// 		opened.push(...neighbors);
			
	// 	}


	// }

	// Can see tail, pockets, average pocket size, number of size 1 pockets
	canTailSeeHeadWithSpace(pathing_to_tail: boolean, pocket_invulnerable: boolean): boolean {
		BOARD_GRAPH.forEach( g => g.is_snake = false);
		const tail_node = this.findCurrentTail(node => { node.source_node.is_snake = true });
		const tail_ele = tail_node.source_node;
		// Also check to see if we can see the spot directly behind the tail
		let post_tail = tail_node.cellBehindSelf(true);
		if (!post_tail || post_tail.is_snake) post_tail = tail_node.cellBehindSelf(false);

		
		tail_node.colorNode("black");
		// Mark snake spots on graph and mark out tail
		let in_pocket: GraphNode[] = [];
		const head = this.source_node;
		let to_look_at = [head];
		// head.colorNode("black");

		head.is_snake = true;
		tail_ele.is_snake = !pathing_to_tail;
		// post_tail.is_snake = false;


		let see_tail = false;
		let see_poop = false;
		
		while (to_look_at.length > 0) {
			const looking_at = to_look_at.pop();

			in_pocket.push(looking_at);
			// looking_at.colorNode("pink");
			if (looking_at == tail_ele && pathing_to_tail) {
				see_tail = true;
				continue;
			}
			if (looking_at == post_tail && !pathing_to_tail) {
				see_poop = true;
				// if (!pathing_to_tail) {
				// 	see_tail = true;
				// }
				continue;
			}
			for (const dir in looking_at.neighbors) {
				const neighbor = looking_at.neighbors[dir];
				if (!neighbor ||
					neighbor.is_snake ||
					in_pocket.some( seen => seen == neighbor) ||
					to_look_at.some( seen => seen == neighbor)
					) 
					continue;

				to_look_at.push(looking_at.neighbors[dir]);
			}
		}
		let can_see = see_poop && !pathing_to_tail || pathing_to_tail && see_tail;
		if (!can_see) {
			if (LOGGING) console.log("Just can't see")
		}

		const snake_left = BOARD_SIZE**2 - snake_length;

		// Okay check to see if we have enough cells to move around in
		// First remove the head
		const head_ind = in_pocket.indexOf(head);
		if (head_ind != -1) in_pocket.splice(head_ind, 1);
		// Then remove the tail
		const tail_ind = in_pocket.indexOf(tail_ele);
		if (tail_ind != -1) in_pocket.splice(tail_ind, 1);
		// If we are NOT pathing to the tail, remove the poop
		if (!pathing_to_tail) {
			const poop_ind = in_pocket.indexOf(post_tail);
			if (poop_ind != -1) in_pocket.splice(poop_ind, 1);
		}
		// console.log("Search dump");
		// console.log(head, tail_ele, post_tail);
		// console.log(...in_pocket);
		if (!pathing_to_tail && snake_left > 2 && in_pocket.length == 0) {
			can_see = false;
			if (LOGGING) console.log("Too few cells in pocket");
		}
		
		// if (game_slow) await delay(50);

		if (tail_ele == head) {
			can_see = false;
			if (LOGGING) console.log("Tail is head");
		}
		
		if (!pathing_to_tail && post_tail == head && snake_left > 1) {
			can_see = false;
			if (LOGGING) console.log("Head is in poop");
		}

		if (!pathing_to_tail) {
			for (const i in tail_ele.neighbors) {
				if (tail_ele.neighbors[i]?.location_as_index == head.location_as_index) {
					can_see = false;
					if (LOGGING) console.log("Tail is neighbor of head");
				}
			}
		}

		// Check to see if head is boxed in
		if (can_see) {
			const neighbors = this.getNeighbors({}, {});
			if (neighbors.length == 0 || neighbors.includes(tail_node)) {
				can_see = false;
				if (LOGGING) console.log("Head is boxed in");
			}
		}

		if (can_see && snake_left > 1 && !pocket_invulnerable) {
			head.is_snake = true;
			tail_ele.is_snake = true;
			post_tail.is_snake = post_tail == head ? true : !pathing_to_tail;
			// for (const i of BOARD_GRAPH) i.seeable_neighbors = 0;
			
			to_look_at = [];
			let pocket_count = 0;
			in_pocket = [];

			let size_1_pockets = 0;
			let size_2_pockets = 0;

			const front_of_head = head.neighbors[this.direction];
			const pocket_collection = [];

			// Count pockets
			for (const g of BOARD_GRAPH) {
				if (g.is_snake || g.seeable_neighbors > 0) continue;
				pocket_count++;
				to_look_at.push(g);

				const pocket_gain = ((g == front_of_head || g == post_tail) && snake_left < 10) ? 1 : 0;
				
				// Perform a scan out from that node
				while (to_look_at.length > 0) {
					const looking_at = to_look_at.pop();
					in_pocket.push(looking_at);
					for (const dir in looking_at.neighbors) {
						const neighbor = looking_at.neighbors[dir];
						if (!neighbor ||
							neighbor.is_snake ||
							in_pocket.some( seen => seen == neighbor) ||
							to_look_at.some( seen => seen == neighbor)
							)
							continue;
		
						to_look_at.push(neighbor);
					}
				}
				in_pocket.forEach( g => g.seeable_neighbors = in_pocket.length + pocket_gain);
				if (in_pocket.length + pocket_gain == 2) size_2_pockets++;
				else if (in_pocket.length + pocket_gain == 1) size_1_pockets++;

				// if (in_pocket.length == 1 && pocket_gain == 0) {
				// 	size_1_pockets++;
				// 	// if (size_1_pockets > 0 && !pathing_to_tail || pathing_to_tail && size_1_pockets > 1) {
				// 	// 	can_see = false;
				// 	// 	break;
				// 	// }
				// 	// const small_snake_pockets = size_1_pockets > 1 && BOARD_SIZE**2 - snake_length > 5;
				// 	// const big_snake_pockets = size_1_pockets > 0 && BOARD_SIZE**2 - snake_length > 12;
				// 	// const tail_pockets_and_small = pathing_to_tail && size_1_pockets > 1 && BOARD_SIZE**2 - snake_length > 6;

					
				// }

				pocket_collection.push([...in_pocket]);
				to_look_at = [];
				in_pocket = [];
				
				
			}
			const path_tail_condition = size_1_pockets > 1 && snake_left > 3 && pathing_to_tail;
			const not_tail_condition = size_1_pockets > 0 && snake_left > 3 && !pathing_to_tail;

			const board_snake_percent = snake_left / BOARD_SIZE**2;

			if (board_snake_percent < 0.08) {
				can_see = pocket_count == 1;
			} else if (board_snake_percent < 0.16) {
				can_see = pocket_count <= 2 && size_1_pockets == 0 && size_2_pockets == 0;
			} else if (board_snake_percent < 0.2) {
				can_see = pocket_count <= 2 && size_1_pockets == 0 && size_2_pockets == 0;
			} else if (board_snake_percent < 0.3) {
				can_see = pocket_count <= 2 && size_1_pockets == 0 && size_2_pockets == 0;
			} else if (board_snake_percent < 0.5) {
				if (pathing_to_tail)
					can_see = size_1_pockets <= 1 && pocket_count <= 4;
				else
					can_see = size_1_pockets == 0 && pocket_count <= 4;
			} else if (board_snake_percent < 0.8) {
				can_see = size_1_pockets <= 1;
			} else {
				can_see = pocket_count <= 4;
			}
			if (LOGGING) console.log("Pocket situtation", pocket_collection);
			if (can_see && LOGGING) console.log("Pockets sufficient given length");
			else {
				if (LOGGING) console.log("Too many pockets", pocket_count);
			}
			
			// if ( path_tail_condition || not_tail_condition) {
			// 	can_see = false;
			// 	if (LOGGING) console.log("Too many size 1 pockets");
			// }
			// if (pocket_count > 4 && BOARD_SIZE**2 - snake_length > 3) {
			// 	if (LOGGING) console.log("TOo many pocketsss");
			// 	can_see = false;
			// }
			// const snake_left = BOARD_SIZE**2 - snake_length;
			// const size_1_or_2_pockets = size_1_pockets + size_2_pockets;
			// const too_many_early_pockets = snake_left > 50 && size_1_or_2_pockets > 5;
			// const too_many_mid_pockets = snake_left <= 50 && (size_1_pockets > 1 || size_2_pockets > 2);
			// const too_many_late_pockets = snake_left < 20 && (size_1_pockets > 1 || size_2_pockets > 1);
			// const too_many_crit_pockets = snake_left < 4 && (size_2_pockets > 0 || size_1_pockets > 1);

			// if (too_many_early_pockets || too_many_mid_pockets || too_many_late_pockets || too_many_crit_pockets) {
			// 	can_see = false;
			// 	if (LOGGING) console.log("Too many small pockets");
			// }

			// if (size_1_pockets == 0 && !pathing_to_tail || pathing_to_tail && size_1_pockets <= 1) {
			// }
			// if (can_see && size_1_pockets <= 1) {
			// 	if (LOGGING) console.log("Sufficient pocket size");
			// }

			// if (pocket_count > 3) {
			// 	if (LOGGING) console.log("More than 1 pocket");
			// 	can_see = false;
			// }
			
		}


		// Undo the snake marking
		for (let i = 0; i < BOARD_GRAPH.length; i++) {
			BOARD_GRAPH[i].is_snake = false;
			BOARD_GRAPH[i].seeable_neighbors = 0;
		}



		return can_see;
	}

	get center(): [number, number] {
		return [this.location[0] * TILE_WIDTH + TILE_WIDTH / 2, this.location[1] * TILE_WIDTH + TILE_WIDTH / 2];
	}

	// Assuming you're at the head of course
	visualizeSnake(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#FFFFF";
		ctx.fillRect(0,0,1000,1000);
		ctx.strokeStyle = "#00FF00";
		ctx.lineWidth = TILE_WIDTH / 2;
		ctx.lineJoin = "bevel";
		ctx.lineCap = "round";	
		
		let curr_segment: SnakePathingNode = this;
		ctx.moveTo(...curr_segment.center);

		let snake_depth = 0;
		let prev_direction: DIRECTION;

		ctx.beginPath();
		while (curr_segment && snake_depth < snake_length) {		

			if (curr_segment.direction != prev_direction ||
				snake_depth == 0 ||
				snake_depth == snake_length - 1) {
				ctx.lineTo(...curr_segment.center);
			}

			curr_segment = curr_segment.next_node;
			snake_depth++;
		}
		
		ctx.stroke();
	}
}

export { SnakePathingNode };