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
        <li key={index} className="text-text-primary text-sm">
          {content}
        </li>
      );
      return;
    }

    flushList();

    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      elements.push(
        <h3 key={index} className="font-bold text-indigo-300 text-sm mt-3 mb-1">
          {renderInline(trimmed.slice(2, -2))}
        </h3>
      );
      return;
    }

    elements.push(
      <p key={index} className="mb-1 last:mb-0 text-sm">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let key = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong key={key++} className="font-semibold text-text-primary">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++} className="italic text-text-secondary">{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <a key={key++} href={match[6]} target="_blank" rel="noopener noreferrer"
           className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
          {match[5]}
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
