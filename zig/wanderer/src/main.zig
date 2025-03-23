const std = @import("std");

extern fn consoleLog(arg: u32) void;
extern fn jsRand(max: u16, limit: bool) u16;

var randX: u16 = undefined;
var randY: u16 = undefined;
var canvas_buffer = std.mem.zeroes([720 * 720 * 4]u8);
export fn getCanvasBufferPointer() [*]u8 {
    return @ptrCast(&canvas_buffer);
}
var point_count: i16 = 0;

var index: u32 = undefined;
var has_neighbour = false;
var has_failed = false;
var has_run = false;
pub fn set_rand(width: u16, height: u16) void {
    randX = jsRand(width, false);
    randY = jsRand(height, false);
    index = (randX + randY * width) * 4;
    if (is_full(index)) {
        set_rand(width, height);
    }
}
pub fn move_rand(width: u16, height: u16) void {
    const direction = jsRand(4, false);
    const iniRandX = randX;
    const iniRandY = randY;
    switch (direction) {
        0 => {
            if (randX < width - 1) randX += 1;
        },
        1 => {
            if (randX > 0) randX -= 1;
        },
        2 => {
            if (randY < height - 1) randY += 1;
        },
        3 => {
            if (randY > 0) randY -= 1;
        },
        else => {},
    }
    index = (randX + randY * width) * 4;
    if (is_full(index)) {
        randX = iniRandX;
        randY = iniRandY;
        move_rand(width, height);
    }
}
pub fn is_empty(curr_index: u32, r: u8, g: u8, b: u8) bool {
    return canvas_buffer[curr_index] != r or canvas_buffer[curr_index + 1] != g or canvas_buffer[curr_index + 2] != b;
}
pub fn is_full(curr_index: u32) bool {
    return canvas_buffer[curr_index] != 0 or canvas_buffer[curr_index + 1] != 0 or canvas_buffer[curr_index + 2] != 0;
}
export fn iterate(intended_point_count: u16, iteration_count: u16, width: u16, height: u16, color: u32) void {
    var i: i16 = 0;
    const r: u8 = @intCast(color & 0xFF);
    const g: u8 = @intCast((color >> 8) & 0xFF);
    const b: u8 = @intCast((color >> 16) & 0xFF);
    const has_enough_points = point_count >= intended_point_count;
    if (has_failed or has_enough_points) {
        canvas_buffer[index] = 0;
        canvas_buffer[index + 1] = 0;
        canvas_buffer[index + 2] = 0;
        canvas_buffer[index + 3] = 255;
        has_failed = false;
    }
    if (has_enough_points) {
        return;
    }
    if (!has_run) {
        var x: u16 = 0;
        while (x < width) {
            var y: u16 = 0;
            while (y < height) {
                const curr = (x + y * width) * 4;
                canvas_buffer[curr] = 0;
                canvas_buffer[curr + 1] = 0;
                canvas_buffer[curr + 2] = 0;
                canvas_buffer[curr + 3] = 255;
                y += 1;
            }
            x += 1;
        }
        has_run = true;
        set_rand(width, height);
    }
    while (i <= iteration_count and point_count < intended_point_count) {
        has_failed = true;
        while (i < iteration_count) {
            has_neighbour = (randX < width - 1 and !is_empty(index + 4, r, g, b)) or
                (randX > 0 and !is_empty(index - 4, r, g, b)) or
                (randY < height - 1 and !is_empty(index + width * 4, r, g, b)) or
                (randY > 0 and !is_empty(index - width * 4, r, g, b));
            i += 1;
            if (point_count == 0 or has_neighbour) {
                has_failed = false;
                break;
            }
            move_rand(width, height);
        }
        if (has_failed) break;
        point_count += 1;
        canvas_buffer[index] = r;
        canvas_buffer[index + 1] = g;
        canvas_buffer[index + 2] = b;
        canvas_buffer[index + 3] = 255;
        set_rand(width, height);
    }
    canvas_buffer[index] = r;
    canvas_buffer[index + 1] = g;
    canvas_buffer[index + 2] = b;
    canvas_buffer[index + 3] = 255;
}
