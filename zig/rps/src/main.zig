const std = @import("std");
extern fn consoleLog(arg: u32) void;
extern fn jsRand(max: u32, limit: bool) u32;
var canvas_buffer = std.mem.zeroes([360 * 360 * 4]u8);
var temp_buffer = std.mem.zeroes([360 * 360 * 4]u8);
export fn getCanvasBufferPointer() [*]u8 {
    return @ptrCast(&canvas_buffer);
}
var curr_r: u32 = 0;
var curr_p: u32 = 0;
var curr_s: u32 = 0;
export fn setColor(color: u32, state_index: u32) void {
    if (state_index == 0) {
        curr_r = color;
    } else if (state_index == 1) {
        curr_p = color;
    } else {
        curr_s = color;
    }
}
pub fn get_index(x: i32, y: i32) u32 {
    return @intCast((x + y * 360) * 4);
}
export fn fillBrush(brush_size: u16, x: i16, y: i16, color: u32) void {
    var radius = @as(i32, brush_size);
    while (radius > 0) : (radius -= 1) {
        var f: i32 = 1 - @as(i32, radius);
        var ddF_x: i32 = 1;
        var ddF_y: i32 = -2 * @as(i32, radius);
        var x1: i16 = 0;
        var y1: i16 = @intCast(radius);
        plot(get_index(x, y + y1), color);
        plot(get_index(x, y - y1), color);
        plot(get_index(x + y1, y), color);
        plot(get_index(x - y1, y), color);
        while (x1 < y1) : (x1 += 1) {
            if (f >= 0) {
                y1 -= 1;
                ddF_y += 2;
                f += ddF_y;
            }
            f += ddF_x;
            ddF_x += 2;
            plot(get_index(x + x1, y + y1), color);
            plot(get_index(x - x1, y + y1), color);
            plot(get_index(x + x1, y - y1), color);
            plot(get_index(x - x1, y - y1), color);
            plot(get_index(x + y1, y + x1), color);
            plot(get_index(x - y1, y + x1), color);
            plot(get_index(x + y1, y - x1), color);
            plot(get_index(x - y1, y - x1), color);
        }
    }
}
export fn placeImage() void {
    @memcpy(&canvas_buffer, &temp_buffer);
}
pub fn get_state(index: u32) i8 {
    if (index >= 360 * 360 * 4) {
        return -1;
    }
    const r: u32 = @intCast(canvas_buffer[index]);
    const g: u32 = @intCast(canvas_buffer[index + 1]);
    const b: u32 = @intCast(canvas_buffer[index + 2]);
    const a: u32 = 0;
    const color: u32 = (r & 0xFF) | ((g & 0xFF) << 8) | ((b & 0xFF) << 16) | ((a & 0xFF) << 24);
    if (color == curr_r) {
        return 0;
    } else if (color == curr_p) {
        return 1;
    } else if (color == curr_s) {
        return 2;
    }
    return -1;
}
pub fn plot(index: u32, color: u32) void {
    if (index >= 360 * 360 * 4) {
        return;
    }
    const r: u8 = @intCast(color & 0xFF);
    const g: u8 = @intCast((color >> 8) & 0xFF);
    const b: u8 = @intCast((color >> 16) & 0xFF);
    temp_buffer[index] = r;
    temp_buffer[index + 1] = g;
    temp_buffer[index + 2] = b;
    temp_buffer[index + 3] = 255;
}
export fn iterate(iteration_count: u32) void {
    var index: u32 = 0;
    while (index < iteration_count) : (index += 1) {
        var x: i32 = 0;
        while (x < 360) : (x += 1) {
            var y: i32 = 0;
            while (y < 360) : (y += 1) {
                const curr_index: u32 = get_index(x, y);
                const state: i8 = get_state(curr_index);
                if (state == -1) continue;
                const next_state: i8 = @mod(state + 1, 3);
                var beaten_count: u32 = 0;
                var i: i32 = -1;
                while (i <= 1) : (i += 1) {
                    var j: i32 = -1;
                    while (j <= 1) : (j += 1) {
                        if (i == 0 and j == 0) continue;
                        const neighbour_index: u32 = get_index(x + i, y + j);
                        const neighbour_state: i8 = get_state(neighbour_index);
                        if (neighbour_state == next_state) {
                            beaten_count += 1;
                        }
                    }
                }
                if (beaten_count > 2) {
                    const beaten_by: u32 = if (state == 0) curr_p else if (state == 1) curr_s else curr_r;
                    plot(@intCast(curr_index), beaten_by);
                }
            }
        }
        placeImage();
    }
}
