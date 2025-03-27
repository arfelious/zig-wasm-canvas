const std = @import("std");
extern fn consoleLog(arg: u32) void;
extern fn jsRand(max: u16, limit: bool) u16;
var canvas_buffer = std.mem.zeroes([250 * 250 * 4]u8);
var temp_buffer = std.mem.zeroes([250 * 250 * 4]u8);
export fn getCanvasBufferPointer() [*]u8 {
    return @ptrCast(&canvas_buffer);
}
const bg_r = 0;
const bg_g = 0;
const bg_b = 0;
var current_r: u8 = 0;
var current_g: u8 = 0;
var current_b: u8 = 0;
export fn setColor(color: u32) void {
    current_r = @intCast(color & 0xFF);
    current_g = @intCast((color >> 8) & 0xFF);
    current_b = @intCast((color >> 16) & 0xFF);
}
export fn activateCell(index: u32) void {
    temp_buffer[index] = current_r;
    temp_buffer[index + 1] = current_g;
    temp_buffer[index + 2] = current_b;
    temp_buffer[index + 3] = 255;
}
pub fn deactivateCell(index: u32) void {
    temp_buffer[index] = 0;
    temp_buffer[index + 1] = 0;
    temp_buffer[index + 2] = 0;
    temp_buffer[index + 3] = 255;
}
export fn fillRandom(fillRatio: u16, size: u32) void {
    var x: u32 = 0;
    while (x < size) : (x += 1) {
        var y: u32 = 0;
        while (y < size) : (y += 1) {
            const index: u32 = (x + y * size) * 4;
            const rand = jsRand(100, false);
            if (rand < fillRatio) {
                activateCell(index);
            } else deactivateCell(index);
        }
    }
    @memcpy(&canvas_buffer, &temp_buffer);
}
export fn iterate(iteration_count: f32, size: u32) void {
    var i: f32 = 0;
    consoleLog(321);
    while (i < iteration_count) : (i += 1) {
        var x: u32 = 0;
        while (x < size) : (x += 1) {
            var y: u32 = 0;
            while (y < size) : (y += 1) {
                const index: u32 = (x + y * size) * 4;
                var neighbour_count: u8 = 0;
                var neighbour_x: u8 = 0;
                while (neighbour_x < 3) : (neighbour_x += 1) {
                    var neighbour_y: u8 = 0;
                    while (neighbour_y < 3) : (neighbour_y += 1) {
                        if (neighbour_x == 1 and neighbour_y == 1) {
                            continue;
                        }
                        const neighbour_index: u32 = ((x + neighbour_x - 1) + (y + neighbour_y - 1) * size) * 4;
                        if (neighbour_index < size * size * 4) {
                            if (canvas_buffer[neighbour_index] != 0 or canvas_buffer[neighbour_index + 1] != 0 or canvas_buffer[neighbour_index + 2] != 0) {
                                neighbour_count += 1;
                            }
                        }
                    }
                }
                const is_dead = canvas_buffer[index] == bg_r and canvas_buffer[index + 1] == bg_g and canvas_buffer[index + 2] == bg_b;
                if (is_dead and neighbour_count == 3) {
                    activateCell(index);
                } else if (!is_dead and (neighbour_count < 2 or neighbour_count > 3)) {
                    deactivateCell(index);
                }
            }
        }
        consoleLog(123321);
        @memcpy(&canvas_buffer, &temp_buffer);
    }
}
