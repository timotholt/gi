// ASCII Font Constants
// To change the font size, update these constants and provide a new font texture

export const CHAR_PIXEL_SIZE = 8;  // Size of each character in pixels (8x8)
export const GRID_SIZE = 16;       // 16x16 grid of characters
export const TEXTURE_SIZE = 128;   // Total texture size (128x128)
export const TOTAL_CHARS = 256;    // Total number of characters in the font

// Shader-specific constants
export const CHAR_UV_SIZE = CHAR_PIXEL_SIZE / TEXTURE_SIZE;  // Size of one character in UV space
