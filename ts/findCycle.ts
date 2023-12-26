import { GraphNode } from "./graphNode.js";
import { BOARD_SIZE, DIRECTION, snake_tail_cell, apple, snake_length, snake_head_cell, LOGGING } from "./index.js";
import { SnakePathingNode } from "./snakePathNode.js";
import { SnakeSegment } from "./snakeSegment.js";

const BOARD_GRAPH: GraphNode[] = [];

function createGraph() {
	for (let j = 0; j < BOARD_SIZE; j++) {
		for (let i = 0; i < BOARD_SIZE; i++) {
			const node = new GraphNode([i, j]);
			
			// Add the left node
			if (i != 0) {
				node.neighbors.LEFT = BOARD_GRAPH.at(-1);
				BOARD_GRAPH.at(-1).neighbors.RIGHT = node;
			}
			
			// Add the above node
			if (j != 0) {
				node.neighbors.UP = BOARD_GRAPH.at(-BOARD_SIZE);
				BOARD_GRAPH.at(-BOARD_SIZE).neighbors.DOWN = node;
			}

			BOARD_GRAPH.push(node);
		}
	}

	window.board_graph = BOARD_GRAPH;
}

function findCycle() {

	const apple_node = BOARD_GRAPH[apple.location_as_index];
	const tail_node = BOARD_GRAPH[snake_tail_cell.location_as_index];

	if (LOGGING) console.log("Searching");
	let ret = graphSearch(apple_node, false);
	if (ret.length == 0) {
		if (LOGGING) console.log("Searching for tail instead");
		ret = graphSearch(tail_node, true);
		if (ret.length == 0) {
			if (LOGGING) console.log("No valid search to tail");
		}
	}


	for (let i = 0; i < BOARD_GRAPH.length; i++) {
		BOARD_GRAPH[i].visited = false;
		BOARD_GRAPH[i].is_snake = false;
	}

	return ret;
}

function graphSearch(goal_node: GraphNode, going_to_tail: boolean): DIRECTION[] {

	let counter = 0;

	let final_paths: [boolean, SnakePathingNode][];
	
	
	// Build the existing snake
	let prev_path_node: SnakePathingNode
	let snake_segment: SnakeSegment
	// if (going_to_tail) {
	// 	prev_path_node = new SnakePathingNode(BOARD_GRAPH[snake_tail_cell.previous_segment.location_as_index], 0, goal_node, snake_tail_cell.previous_segment.direction, snake_tail_cell.previous_segment.previous_direction, undefined, true);
	// 	snake_segment = snake_tail_cell.previous_segment.previous_segment;	
	// } else {
	// }
	prev_path_node = new SnakePathingNode(BOARD_GRAPH[snake_tail_cell.location_as_index], 0, goal_node, snake_tail_cell.direction, snake_tail_cell.previous_direction, undefined, true);
	snake_segment = snake_tail_cell.previous_segment;	
	while (snake_segment) {
		const new_path_node = new SnakePathingNode(BOARD_GRAPH[snake_segment.location_as_index], 0, goal_node, snake_segment.direction, snake_segment.previous_direction, prev_path_node, true);
		prev_path_node = new_path_node;
		snake_segment = snake_segment.previous_segment;
	}
	// const head_node = BOARD_GRAPH[snake_head_cell.location_as_index];
	// const head_neighbor = head_node.neighbors[snake_head_cell.direction];
	// if (!head_neighbor) {
	// 	// console.error("Head node does not have a neighbor in the direction it is going to go");
	// 	// console.log(`Direction: ${snake_head_cell.next_direction} at ${snake_head_cell.location_as_index}`);
	// 	// console.log("Head segment", snake_head_cell);
	// 	// console.log("Head node", head_node);
	// 	return [];
	// }
	// const next_node = new SnakePathingNode(head_neighbor, 0, goal_node, snake_head_cell.direction, snake_head_cell.direction, prev_path_node);
	
	let deepest_path = 0;
	
	function searchPattern(pocket_invulnerable: boolean) {
		let opened: {[key in number]: SnakePathingNode[]} = {0: []};
		let closed: {[key in number]: SnakePathingNode[]} = {};

		final_paths = [];
		
		opened[0].push(prev_path_node);
		let num_opened = 1;
		let paths_tried = 0;

		while (num_opened > 0) {
			
			counter++;
			// if (game_slow) await delay(10);
			if (counter > 18000 || BOARD_SIZE**2 - snake_length <= 3 && counter > 1500) break;
			
			// Find which current node we are looking at
			let best_node: SnakePathingNode;
			let best_index = 0;
			// Lowest f heuristic
			for (const i in opened) {
				if (opened[i].length == 0) continue;
				if (!best_node) best_node = opened[i][0];
				for (let j = 0; j < opened[i].length; j++) {
					if (opened[i][j].f < best_node.f) {
						best_node = opened[i][j];
						best_index = j;
					}
				}

			}


			// If nothing left, break out
			if (!best_node) break;

			
			// Now pull this node out of the open set and put it in the closed set
			opened[best_node.g].splice(best_index, 1);
			if (!closed[best_node.g]) closed[best_node.g] = [];
			closed[best_node.g].push(best_node);
			// if (curr_node.source_node.timer - curr_node.g > 0) {
				// 	curr_node.visited_history = undefined;
			// 	continue;
			best_node.colorNode("#e7b416");	// Yellow

			
			// Check to see if this is the apple while we were pathing to the head node
			if (going_to_tail && best_node.location_as_index == apple.location_as_index) {
				// Throw out the path
				continue;
			}

			// Sometimes this fails during neighbor finding and I can't for the life
			// of me find out why. So we need to check it again here
			if (snake_length > 4 && best_node.next_node.checkIsSnake(best_node, true)) {
				// Throw out the path
				continue;
			}

			// Check to see if this is the end
			if (best_node.source_node == goal_node) {
				paths_tried++;
				deepest_path = Math.max(deepest_path, best_node.g);
				// if (!curr_node.source_node.neighbors[curr_node.direction]) continue;
				if (snake_length > 4) {
					const see_goal = best_node.canTailSeeHeadWithSpace(going_to_tail, pocket_invulnerable);
					// const see_goal = await best_node.canTailSeeHeadWithSpace(false);
					if (!see_goal && LOGGING) console.log("Here's fail", best_node.trimSnake(), best_node.compileInstructions());
					if (!see_goal && !(BOARD_SIZE**2 - snake_length < 3)) {
						continue;
					}
					
					final_paths.push([see_goal, best_node]);
					// next_node.next_node = undefined;
					// break;
				} else {
					if (LOGGING) console.log("Snake is greater than 4");
					final_paths.push([true, best_node]);
				}
				best_node.colorNode("#cc3232"); // Red
				break;
				if (final_paths.length == 25) break;
			}

			// If the number of moves is above some threshold, it's probably not worth searching further
			if (best_node.g >= BOARD_SIZE**2 * 10) break;

			const neighbors = best_node.getNeighbors(opened, closed, true);

			if (!opened[best_node.g + 1]) opened[best_node.g + 1] = [];
			opened[best_node.g + 1].push(...neighbors);
			
		
		}
		if (LOGGING) console.log(`${paths_tried} paths tried`);
	}

	searchPattern(false);
	// Check to see if we need to restart if there literally is no way to solve if paths are less enough
	if (final_paths.length == 0 && deepest_path < 8) searchPattern(true);

	// Check fail
	if (final_paths.length == 0) {
		// Check to see if one of our neighbors is the tail, if it is, just go in that direction
		for (const d in DIRECTION) {
			if (BOARD_GRAPH[snake_head_cell.location_as_index].neighbors[d] == snake_tail_cell) {
				if (LOGGING) console.log("Neighbors to the goal");
				return [DIRECTION[d]];
			}
		}
		return [];
	}

	if (LOGGING) console.log(final_paths);

	// Find the best path
	// Sort by amount of pockets
	// final_paths.sort( (a, b) => a[1] - b[1]);

	// // Eliminate to the lowest pockets
	// final_paths = final_paths.filter( p => p[1] == final_paths[0][1]);

	// // Sort by mean pocket size
	// final_paths.sort( (a, b) => a[2] - b[2]);

	// // Eliminate
	// final_paths = final_paths.filter( p => p[2] == final_paths[0][2]);

	// // Sort by mean pocket size
	// final_paths.sort( (a, b) => a[3] - b[3]);

	const best_path: SnakePathingNode = final_paths[0][1];

	// After we are done searching
	// Color the snake path
	// if (game_slow) {
	best_path.mapHistory( node => node.colorNode("purple"));
	// best_path.findCurrentTail( node => node.colorNode("blue"));
	best_path.trimSnake().findCurrentTail( node => node.colorNode("blue"));
	// }

	// next_node.colorNode("black");
	goal_node.colorNode("black");

	let node = best_path;
	if (!node) {
		return [];
	}
	const instructions = best_path.compileInstructions();

	best_path.mapHistory( node => {node.source_node = undefined; node.goal_node = undefined});

	window.last_fuckup = best_path;
	
	return instructions;


}

export { BOARD_GRAPH, createGraph, findCycle, graphSearch };