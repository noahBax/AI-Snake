const BOARD_GRAPH: GraphNode[] = [];

class GraphNode {
	readonly location: [number, number];
	timer = 0;
	neighbors: {
		[key in DIRECTION]?: GraphNode
	} = {
		RIGHT: undefined,
		UP: undefined,
		DOWN: undefined,
		LEFT: undefined
	}

	visited = false;
	is_snake = false;
	nextNode: GraphNode;

	constructor(location: [number, number]) {
		this.location = location;
	}
}

class AStarNode {
	readonly location: [number, number];
	readonly direction: DIRECTION;
	visited_history: GraphNode[] = [];
	source_node: GraphNode;
	is_snake = false;

	g: number = Infinity;				// Cost from beginning to here
	h: number = Infinity;				// Estimated cost from here to end
	next_node: AStarNode;
	get f() { return this.g + this.h; }	// Sum of heuristics

	constructor(graph_node: GraphNode, g_cost: number, end_node: GraphNode, direction: DIRECTION, is_snake=false) {
		this.location = graph_node.location;
		this.source_node = graph_node;
		this.g = g_cost;
		this.direction = direction;
		this.is_snake = is_snake;

		// Manhattan distance
		this.h = Math.abs(end_node.location[0] - this.location[0]) + Math.abs(end_node.location[1] - this.location[1]);

		// Direct distance
		// this.h = (end_node.location[0] - this.location[0])**2 + (end_node.location[1] - this.location[1])**2;
	}

	colorNode(color: string) {
		path_ctx.fillStyle = color;
		path_ctx.fillRect(this.location[0] * TILE_WIDTH, this.location[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
	}
}

function createGraph() {
	for (let j = 0; j < BOARD_SIZE; j++) {
		for (let i = 0; i < BOARD_SIZE; i++) {
			const node = new GraphNode([i, j]);

			// console.log(BOARD_GRAPH, i, j);
			
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
}

async function findHamiltononianCycle(direction: DIRECTION) {
	let cycle_length = 0;
	const path: GraphNode[] = [];

	let current_segment = snake_tail_cell;

	// First add the snake to the cycle
	while (current_segment) {

		const snake_node = BOARD_GRAPH[current_segment.current_spot[1] * BOARD_SIZE + current_segment.current_spot[0]];
		path.push(snake_node);
		snake_node.is_snake = true;

		current_segment = current_segment.previous_segment;
		cycle_length++;
	}

	// Walk back through the path and assign timers to the path
	for (let i = 0; i < path.length; i++) {
		path[i].timer = i;
	}

	// Tell the apple it is the goal
	const apple_node = BOARD_GRAPH[apple.current_spot[1] * BOARD_SIZE + apple.current_spot[0]];

	const ret = await astar(path.at(-1), apple_node, direction);
	// console.log(ret)

	let node = ret[0];
	if (!node) {
		console.log("No path found");
		return [];
	}
	const instructions: DIRECTION[] = [];
	while(node.next_node) {

		instructions.push(node.direction);
		
		node = node.next_node;
	}
	// for (let i = 0; i < ret.length; i++) {
	// 	instructions.push(ret[i].direction);
	// }
	instructions.reverse();

	for (let i = 0; i < BOARD_GRAPH.length; i++) {
		BOARD_GRAPH[i].visited = false;
		BOARD_GRAPH[i].timer = 0;
		BOARD_GRAPH[i].is_snake;
	}

	return instructions;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function astar(head_node: GraphNode, apple_node: GraphNode, direction: DIRECTION) {

	let counter = 0;

	let final_paths: AStarNode[] = [];
	
	let closed: AStarNode[] = [];
	let opened: AStarNode[] = [];

	const start = new AStarNode(head_node, 0, apple_node, direction);
	const next_node = new AStarNode(start.source_node.neighbors[direction], 1, apple_node, direction);
	opened.push(next_node);
	
	while (opened.length > 0) {
		counter++;
		// await delay(5);
		if (counter > 50000) break;
		// path_ctx.fillStyle = "rgb(0, 0, 0)";
		// path_ctx.fillRect(0, 0, 1000, 1000);

		// Find which current node we are looking at
		let curr_node = opened[0];
		let curr_index = 0;

		for (let i = 1; i < opened.length; i++) {
			if (opened[i].f < curr_node.f) {
				curr_node = opened[i];
				curr_index = i;
			}
		}

		// Now pull this node out of the open set and put it in the closed set
		opened.splice(curr_index, 1);
		closed.push(curr_node);
		curr_node.colorNode("#e7b416");	// Yellow

		// Check to see if this is the end
		if (curr_node.source_node == apple_node) {
			final_paths.push(curr_node);
			curr_node.colorNode("#cc3232"); // Red
			break;
			if (final_paths.length == 20) break;
		}

		// Loop through neighbors, calculate costs, update opened
		for (const i in curr_node.source_node.neighbors) {
			if (!curr_node.source_node.neighbors[i]) continue;
			let neighbor: GraphNode = curr_node.source_node.neighbors[i];
			// if (neighbor.visited) continue;
			if (neighbor.is_snake && neighbor.timer - curr_node.g > 0) continue;
			if (curr_node.visited_history.includes(neighbor)) continue;

			let neighbor_node = new AStarNode(neighbor, curr_node.g + 1, apple_node, DIRECTION[i]);
			neighbor_node.visited_history = [curr_node.source_node];
			neighbor_node.visited_history.push(...curr_node.visited_history);
			neighbor_node.next_node = curr_node;


			// Ignore evertyhing below the last continue
			// That is the "normal" way to do things
			// What we want to do is examine every possible path
			// This means any amount of looping is okay for us
			// To do this we basically need to check to see if there isn't a node that exists that has the same
			// g, h, and source node
			// We only need to check to make sure it doesn't exist, we don't need to replace anything

			const check_opened = opened.some( node => {
				return node.source_node == neighbor_node.source_node && node.g == neighbor_node.g && node.h == neighbor_node.h && node.direction == neighbor_node.direction;
			})
			const check_closed = closed.some( node => {
				return node.source_node == neighbor_node.source_node && node.g == neighbor_node.g && node.h == neighbor_node.h && node.direction == neighbor_node.direction;
			})

			if (!check_closed && !check_opened) {
				if (check_opened) neighbor_node.colorNode("#db7b2b"); // Orange
				else neighbor_node.colorNode("#99c140"); // Green (check_closed)
				opened.push(neighbor_node);
			}


			continue;

			const o = opened.findIndex( node => (node.source_node == neighbor_node.source_node))
			if (o > -1) {
				if (neighbor_node.f < opened[o].f) {
					// If our f heuristic is less than the existing nodes f heuristic, then
					// we need to replace it
					opened.splice(o, 1, neighbor_node);
					neighbor_node.colorNode("#db7b2b"); // Orange
					continue;
				}
			}
			const c = closed.findIndex( node => (node.source_node == neighbor_node.source_node))
			if (c > -1 && neighbor_node.f < closed[c].f) {
				// If our f heuristic is less than a closed node's f heuristic, then
				// we need to reexamine so just add it new to the open queue
				opened.push(neighbor_node);
				closed.splice(c, 1);
				neighbor_node.colorNode("#99c140"); // Green
				continue;
			}

			if (o == -1 && c == -1) {
				opened.push(neighbor_node);
				neighbor_node.colorNode("#99c140"); // Green
			}

			// If this node is not in opened or closed, add it to opened

		}
	}

	let traceback_node = final_paths[0];
	while (traceback_node?.next_node) {
		traceback_node.next_node.colorNode("blue");
		traceback_node = traceback_node.next_node;
	}
	return final_paths;
}