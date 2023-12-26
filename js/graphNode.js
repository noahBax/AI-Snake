import { BOARD_SIZE, draw_search, path_ctx, TILE_WIDTH } from "./index.js";
class GraphNode {
    location;
    location_as_index = 0;
    seeable_neighbors = 0;
    neighbors = {
        RIGHT: undefined,
        UP: undefined,
        DOWN: undefined,
        LEFT: undefined
    };
    visited = false;
    is_snake = false;
    constructor(location) {
        this.location = location;
        this.location_as_index = this.location[0] + this.location[1] * BOARD_SIZE;
    }
    colorNode(color) {
        if (!draw_search)
            return;
        path_ctx.fillStyle = color;
        path_ctx.fillRect(this.location[0] * TILE_WIDTH, this.location[1] * TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
    }
}
export { GraphNode };
