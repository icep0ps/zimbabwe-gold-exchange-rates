import { Check, Copy } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "json", className, ...props }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className={cn("relative rounded-lg bg-muted border font-mono text-sm", className)} {...props}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 rounded-t-lg">
        <span className="text-xs text-muted-foreground uppercase">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCopy}
        >
          {hasCopied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
