const DEFAULT_FONTSIZE = 20;
const LENGTH_THRESHOLD = 25;

export function getFontsize(str) {
    let fontsize = DEFAULT_FONTSIZE;
    if (str.length <= LENGTH_THRESHOLD) { return fontsize };

    let charOverflow = str.length - LENGTH_THRESHOLD;
    fontsize -= Math.floor(charOverflow/3);
    return fontsize;
}