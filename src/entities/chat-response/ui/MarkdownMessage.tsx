import type { ComponentPropsWithoutRef } from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), ['target', '_blank'], ['rel', 'noopener noreferrer']],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./], ['className', /^hljs.*/]],
    div: [...(defaultSchema.attributes?.div ?? []), ['className', /^katex.*/]],
    input: [...(defaultSchema.attributes?.input ?? []), ['type', 'checkbox'], ['checked', true], ['disabled', true]],
    span: [...(defaultSchema.attributes?.span ?? []), ['className', /^hljs.*/], ['className', /^katex.*/]],
  },
};

type MarkdownMessageProps = {
  content: string;
};

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <Box
      sx={{
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-child': { mb: 0 },
        '& hr': { border: 0, borderTop: '1px solid', borderColor: 'divider', my: 1.5 },
        '& .markdown-table-wrap': {
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: 'max-content',
          minWidth: '100%',
          tableLayout: 'auto',
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          px: 1,
          py: 0.5,
          textAlign: 'left',
          minWidth: 140,
          wordBreak: 'normal',
          overflowWrap: 'normal',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex, rehypeHighlight]}
        components={{
          a: ({ href, children }) => (
            <Typography
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecorationThickness: 'from-font' }}
            >
              {children}
            </Typography>
          ),
          blockquote: ({ children }) => (
            <Box component="blockquote" sx={{ my: 1, mx: 0, pl: 1.5, borderLeft: '3px solid', borderColor: 'divider', color: 'text.secondary' }}>
              {children}
            </Box>
          ),
          code: ({ inline, children, className, ...props }: MarkdownCodeProps) =>
            inline ? (
              <Box component="code" sx={{ px: 0.5, py: 0.1, borderRadius: 0.75, backgroundColor: 'grey.200', fontFamily: 'monospace' }} {...props}>
                {children}
              </Box>
            ) : (
              <Box component="code" className={className} sx={{ fontFamily: 'monospace' }} {...props}>
                {children}
              </Box>
            ),
          h1: ({ children }) => (
            <Typography variant="h5" component="h2" sx={{ mt: 1.5, mb: 0.75, fontWeight: 700 }}>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h6" component="h3" sx={{ mt: 1.25, mb: 0.75, fontWeight: 700 }}>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="subtitle1" component="h4" sx={{ mt: 1.25, mb: 0.75, fontWeight: 700 }}>
              {children}
            </Typography>
          ),
          li: ({ children }) => (
            <Box component="li" sx={{ mb: 0.35 }}>
              <Typography component="span" variant="body2">
                {children}
              </Typography>
            </Box>
          ),
          table: ({ children }) => (
            <Box className="markdown-table-wrap">
              <table>{children}</table>
            </Box>
          ),
          p: ({ children }) => (
            <Typography variant="body2" sx={{ mb: 0.75, lineHeight: 1.5 }}>
              {children}
            </Typography>
          ),
          pre: ({ children }) => (
            <Box
              component="pre"
              sx={{
                m: 0,
                mb: 1,
                p: 1.25,
                borderRadius: 1.25,
                backgroundColor: '#f6f8fa',
                overflowX: 'auto',
                fontSize: '0.85rem',
                lineHeight: 1.45,
              }}
            >
              {children}
            </Box>
          ),
          ul: ({ children }) => (
            <Box component="ul" sx={{ pl: 2.5, my: 0.75 }}>
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box component="ol" sx={{ pl: 2.5, my: 0.75 }}>
              {children}
            </Box>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
