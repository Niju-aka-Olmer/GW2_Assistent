import React from 'react';

interface SimpleMarkdownProps {
  text: string;
  className?: string;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(<ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 mb-1">{listItems}</ul>);
      listItems = [];
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = renderInline(trimmed.substring(2));
      listItems.push(
        <li key={index} className="text-text-primary text-sm leading-relaxed">
          {content}
        </li>
      );
      return;
    }

    flushList();

    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      elements.push(
        <h3 key={index} className="font-bold text-amber-300 text-sm mt-3 mb-1.5 uppercase tracking-wider">
          {renderInline(trimmed.slice(2, -2))}
        </h3>
      );
      return;
    }

    elements.push(
      <p key={index} className="mb-1.5 last:mb-0 text-sm leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(!\[([^\]]*)\]\(([^)]+)\))|(\*\*(.+?)\*\*)|(\*(.+?)\*)|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let key = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <img key={key++} src={match[3]} alt={match[2]}
             className="inline-block w-8 h-8 align-middle mr-1 rounded"
             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      );
    } else if (match[4]) {
      parts.push(<strong key={key++} className="font-semibold text-text-primary">{match[5]}</strong>);
    } else if (match[6]) {
      parts.push(<em key={key++} className="italic text-text-secondary">{match[7]}</em>);
    } else if (match[8]) {
      parts.push(
        <a key={key++} href={match[9]} target="_blank" rel="noopener noreferrer"
           className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
          {match[8]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function SimpleMarkdown({ text, className = '' }: SimpleMarkdownProps) {
  return (
    <div className={`space-y-0 ${className}`}>
      {parseMarkdown(text)}
    </div>
  );
}
