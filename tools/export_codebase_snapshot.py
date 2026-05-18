#!/usr/bin/env python3
"""Export a small static-site codebase snapshot to Markdown."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path


OUTPUT_NAME = "codebase-snapshot.md"
MAX_FILE_BYTES = 200_000

EXCLUDED_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "snapshots",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".vscode",
    ".idea",
}

EXCLUDED_FILES = {
    OUTPUT_NAME,
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
}

EXCLUDED_SUFFIXES = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".mp4",
    ".mov",
    ".webm",
    ".mp3",
    ".wav",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".zip",
    ".tar",
    ".gz",
    ".tgz",
    ".rar",
    ".7z",
}

INCLUDED_SUFFIXES = {
    ".html",
    ".css",
    ".js",
    ".py",
    ".md",
    ".json",
    ".txt",
    ".toml",
    ".yml",
    ".yaml",
    ".ini",
    ".cfg",
}

INCLUDED_NAMES = {
    ".gitignore",
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "vite.config.js",
    "webpack.config.js",
    "postcss.config.js",
    "tailwind.config.js",
    "tsconfig.json",
    "jsconfig.json",
}

LANGUAGE_BY_SUFFIX = {
    ".html": "html",
    ".css": "css",
    ".js": "javascript",
    ".py": "python",
    ".md": "markdown",
    ".json": "json",
}


def should_skip_path(path: Path, root: Path) -> bool:
    relative = path.relative_to(root)

    if any(part in EXCLUDED_DIRS for part in relative.parts[:-1]):
        return True

    if path.name in EXCLUDED_FILES:
        return True

    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return True

    return False


def is_relevant_text_file(path: Path, root: Path) -> bool:
    if should_skip_path(path, root):
        return False

    relative = path.relative_to(root)

    if path.name in INCLUDED_NAMES:
        return True

    if path.suffix.lower() in INCLUDED_SUFFIXES:
        return True

    if relative.parts and relative.parts[0] == "tools":
        return True

    return False


def collect_files(root: Path) -> list[Path]:
    files: list[Path] = []

    for path in root.rglob("*"):
        if path.is_dir():
            continue

        if is_relevant_text_file(path, root):
            files.append(path)

    return sorted(files, key=lambda item: item.relative_to(root).as_posix().lower())


def make_tree(paths: list[Path], root: Path) -> str:
    tree: dict[str, dict] = {}

    for path in paths:
        current = tree
        for part in path.relative_to(root).parts:
            current = current.setdefault(part, {})

    lines = [root.name + "/"]

    def walk(branch: dict[str, dict], prefix: str = "") -> None:
        items = sorted(branch.items(), key=lambda item: (bool(item[1]), item[0].lower()))
        for index, (name, children) in enumerate(items):
            connector = "`-- " if index == len(items) - 1 else "|-- "
            suffix = "/" if children else ""
            lines.append(f"{prefix}{connector}{name}{suffix}")
            if children:
                extension = "    " if index == len(items) - 1 else "|   "
                walk(children, prefix + extension)

    walk(tree)
    return "\n".join(lines)


def language_for(path: Path) -> str:
    return LANGUAGE_BY_SUFFIX.get(path.suffix.lower(), "text")


def fence_for(content: str) -> str:
    return "````" if "```" in content else "```"


def write_snapshot(root: Path) -> Path:
    output_path = root / OUTPUT_NAME
    files = collect_files(root)
    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")

    lines = [
        f"# {root.name} Codebase Snapshot",
        "",
        f"Exported: {timestamp}",
        "",
        "Generated snapshot files, .git, images, videos, fonts, archives, and other binary/media files are excluded.",
        "",
        "## Project Tree",
        "",
        "```text",
        make_tree(files, root),
        "```",
        "",
        "## File Contents",
        "",
    ]

    for path in files:
        relative = path.relative_to(root).as_posix()
        lines.append(f"## `{relative}`")
        lines.append("")

        try:
            size = path.stat().st_size
        except OSError as error:
            lines.append(f"Skipped: could not read file metadata ({error}).")
            lines.append("")
            continue

        if size > MAX_FILE_BYTES:
            lines.append(f"Skipped: file exceeded the {MAX_FILE_BYTES:,} byte size limit.")
            lines.append("")
            continue

        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            lines.append("Skipped: file is not valid UTF-8 text.")
            lines.append("")
            continue
        except OSError as error:
            lines.append(f"Skipped: could not read file ({error}).")
            lines.append("")
            continue

        fence = fence_for(content)
        lines.append(f"{fence}{language_for(path)}")
        lines.append(content.rstrip())
        lines.append(fence)
        lines.append("")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def main() -> None:
    root = Path.cwd().resolve()
    output_path = write_snapshot(root)
    print(f"Codebase snapshot exported successfully: {output_path}")


if __name__ == "__main__":
    main()
