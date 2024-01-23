const JAVASCRIPT_FILE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".cjs",
  ".cjsx",
  ".mjs",
  ".mjsx",
  ".ts",
  ".tsx",
  ".cts",
  ".ctsx",
  ".mts",
  ".mtsx",
];
const MDX_FILE_EXTENSIONS = [".md", ".mdx"];
const STYLE_FILE_EXTENSIONS = [
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".styl",
  ".stylus",
  ".pcss",
  ".sss",
];
const IMAGE_FILE_EXTENSIONS = [
  ".apng",
  ".png",
  ".jpg",
  ".jpeg",
  ".jfif",
  ".pjpeg",
  ".pjp",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".avif",
];
const VIDEO_FILE_EXTENSIONS = [".ogg", ".mp4", ".webm"];
const AUDIO_FILE_EXTENSIONS = [".mp3", ".wav", ".flac", ".aac", ".opus"];
const FONT_FILE_EXTENSIONS = [".woff", ".woff2", ".eot", ".ttf", ".otf"];

export function isJs(filename: string) {
  return JAVASCRIPT_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isMdx(filename: string) {
  return MDX_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isJsOrMdx(filename: string) {
  return isJs(filename) || isMdx(filename);
}

export function isCss(filename: string) {
  return STYLE_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isImage(filename: string) {
  return IMAGE_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isFont(filename: string) {
  return FONT_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isAudio(filename: string) {
  return AUDIO_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isVideo(filename: string) {
  return VIDEO_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

export function isAsset(filename: string) {
  return (
    isImage(filename) ||
    isAudio(filename) ||
    isVideo(filename) ||
    isFont(filename)
  );
}

export function getLinkPreloadAs(filename: string) {
  if (isJs(filename)) return "script";
  if (isCss(filename)) return "style";
  if (isFont(filename)) return "font";
  if (isImage(filename)) return "image";
  if (isAudio(filename)) return "audio";
  if (isVideo(filename)) return "video";
  throw new Error(`Unknown preload file type: ${filename}`);
}
