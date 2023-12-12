const BOARD_GRAPH: GraphNode[] = [];

class GraphNode {
	readonly location: [number, number];
	neighbors: GraphNode[] = [];

	visited: boolean = false;
	nextNode: GraphNode;

	constructor(location: [number, number]) {
		this.location = location;
	}
}

class AStarNode {
	readonly location: [number, number];
	source_node: GraphNode;

	g: number = Infinity;				// Cost from beginning to here
	h: number = Infinity;				// Estimated cost from here to end
	next_node: AStarNode;
	get f() { return this.g + this.h; }	// Sum of heuristics

	constructor(graph_node: GraphNode, g_cost: number, end_node: GraphNode) {
		this.location = graph_node.location;
		this.source_node = graph_node;
		this.g = g_cost;

		// Manhattan distance
		// this.h = Math.abs(end_node.location[0] - this.location[0]) + Math.abs(end_node.location[1] - this.location[1]);

		// Direct distance
		this.h = (end_node.location[0] - this.location[0])**2 + (end_node.location[1] - this.location[1])**2;
	}

	colorNode(color: string) {
		ctx.fillStyle = color;
		ctx.fillRect(this.location[0] * TILE_WIDTH, this.location[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
	}
}

function createGraph() {
	for (let j = 0; j < BOARD_SIZE; j++) {
		for (let i = 0; i < BOARD_SIZE; i++) {
			const node = new GraphNode([i, j]);

			// console.log(BOARD_GRAPH, i, j);
			
			// Add the left node
			if (i != 0) {
				node.neighbors.push(BOARD_GRAPH.at(-1));
				BOARD_GRAPH.at(-1).neighbors.push(node);
			}

			// Add the above node
			if (j != 0) {
				node.neighbors.push(BOARD_GRAPH.at(-BOARD_SIZE));
				BOARD_GRAPH.at(-BOARD_SIZE).neighbors.push(node);
			}

			BOARD_GRAPH.push(node);
		}
	}
}

async function findHamiltononianCycle() {
	let cycle_length = 0;
	const path: GraphNode[] = [];

	let current_segment = snake_tail_cell;

	// First add the snake to the cycle
	while (current_segment) {

		const snake_node = BOARD_GRAPH[current_segment.current_spot[1] * BOARD_SIZE + current_segment.current_spot[0]];
		path.push(snake_node);
		snake_node.visited = true;

		current_segment = current_segment.previous_segment;
		cycle_length++;
	}

	// Tell the apple it is the goal
	const apple_node = BOARD_GRAPH[apple.current_spot[1] * BOARD_SIZE + apple.current_spot[0]];

	await astar(path.at(-1), apple_node);



	for (let i = 0; i < BOARD_GRAPH.length; i++) {
		BOARD_GRAPH[i].visited = false;
	}
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function astar(head_node: GraphNode, apple_node: GraphNode) {

	let counter = 0;

	let final_paths: AStarNode[] = [];
	
	let closed: AStarNode[] = [];
	let opened: AStarNode[] = [];

	const start = new AStarNode(head_node, 0, apple_node);
	opened.push(start);
	
	while (opened.length > 0) {
		counter++;
		await delay(20);
		if (counter > 20000) break;
		// ctx.fillStyle = "rgb(0, 0, 0)";
		// ctx.fillRect(0, 0, 1000, 1000);

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
		// console.log(curr_node.g, curr_node.f);

		// Check to see if this is the end
		if (curr_node.source_node == apple_node) {
			final_paths.push(curr_node);
			curr_node.colorNode("#cc3232"); // Red
			break;
			if (final_paths.length == 20) break;
		}

		// Loop through neighbors, calculate costs, update opened
		for (let i = 0; i < curr_node.source_node.neighbors.length; i++) {
			let neighbor = curr_node.source_node.neighbors[i];
			if (neighbor.visited) continue;
			let neighbor_node = new AStarNode(neighbor, curr_node.g + 1, apple_node);
			neighbor_node.next_node = curr_node;


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

	console.log(final_paths);
}