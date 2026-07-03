import { type ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer for assistant chat replies.
 *
 * Supports the small subset the guidance model is asked to produce: short
 * paragraphs, unordered ("- "/"* ") and ordered ("1. ") lists, **bold**,
 * *italic*, and `inline code`. It builds React elements only — never
 * dangerouslySetInnerHTML — so model output can never inject HTML. It also
 * renders gracefully on partial text, so the typewriter reveal stays smooth.
 */
export function ChatMarkdown({ text }: { text: string }) {
  return <div className="flex flex-col gap-2 leading-relaxed">{parseBlocks(text)}</div>;
}

const INLINE = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={key++}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-surface-sunken px-1 py-0.5 text-[0.85em]">
          {match[3]}
        </code>,
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(<p key={key++}>{renderInline(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((item, index) => <li key={index}>{renderInline(item)}</li>);
      blocks.push(
        list.ordered ? (
          <ol key={key++} className="flex list-decimal flex-col gap-1 pl-5">
            {items}
          </ol>
        ) : (
          <ul key={key++} className="flex list-disc flex-col gap-1 pl-5">
            {items}
          </ul>
        ),
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (numbered) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <p key={key++} className="font-semibold">
          {renderInline(heading[1])}
        </p>,
      );
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}
