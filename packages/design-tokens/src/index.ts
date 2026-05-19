import tokens from "../tokens.json" with { type: "json" };

export type LogMyPlateTokens = typeof tokens;

export const logmyplateTokens = tokens;

export const colors = tokens.color;
export const spacing = tokens.space;
export const radii = tokens.radius;
export const fontSizes = tokens.fontSize;
