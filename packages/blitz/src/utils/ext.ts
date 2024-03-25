const JAVASCRIPT_FILE_EXTENSIONS = [".js"];
const STYLE_FILE_EXTENSIONS = [".css"];
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
    isFont(filename) ||
    isAudio(filename) ||
    isVideo(filename)
  );
}

export function getLinkPreloadAs(filename: string) {
  if (isJs(filename)) return "script";
  if (isCss(filename)) return "style";
  if (isFont(filename)) return "font";
  if (isImage(filename)) return "image";
  if (isAudio(filename)) return "audio";
  if (isVideo(filename)) return "video";
  console.error(`Unknown preload file type: ${filename}`);
  return;
}
