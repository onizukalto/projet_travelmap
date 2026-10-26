import ReactMarkdown, { type Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => <h3 className="mt-4 text-[18px] font-extrabold text-ink first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-4 text-[18px] font-extrabold text-ink first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 font-bold text-ink first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-muted">{children}</ol>,
  strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-ink underline decoration-visited decoration-2 underline-offset-2 hover:decoration-ink"
    >
      {children}
    </a>
  ),
};

/** Texte de l'assistant, en Markdown léger, avec la typographie du site. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-ink">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
