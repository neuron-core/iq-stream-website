export const ARCHITECTURES = ['amd64', 'arm64'];

export const LANGUAGES = ['PHP', 'Python', 'Node.js', 'Go', 'Ruby', 'Java', '.NET'];

export const FRONTEND_PROTOCOLS = ['AG-UI', 'the Vercel AI SDK', 'plain text'];

export interface Library {
  name: string;
  /** The command that installs the core package. */
  install: string;
  href: string;
  /** Where href points, for the link text. */
  host: 'GitHub' | 'npm';
  text: string;
  /** The frameworks it works with, and how: adapters, built-in support, or bridges. */
  frameworks: { label: string; items: string[] };
}

/** The official client libraries: three backends, then the browser. */
export const LIBRARIES: Library[] = [
  {
    name: 'PHP',
    install: 'composer require neuron-core/iq-stream-php',
    href: 'https://github.com/neuron-core/iq-stream-php',
    host: 'GitHub',
    text: 'Tokens, tickets and a publisher for PHP 8.1 and later, with no dependencies.',
    frameworks: { label: 'Built into', items: ['Neuron AI'] },
  },
  {
    name: 'JavaScript and TypeScript',
    install: 'npm install @neuron-core/iq-stream',
    href: 'https://github.com/neuron-core/iq-stream-js',
    host: 'GitHub',
    text: 'Tokens, tickets and a publisher for Node.js backends, used directly or through an adapter.',
    frameworks: { label: 'Adapters for', items: ['LangChain JS', 'LangGraph.js', 'Mastra'] },
  },
  {
    name: 'Python',
    install: 'pip install iq-stream',
    href: 'https://github.com/neuron-core/iq-stream-python',
    host: 'GitHub',
    text: 'Tokens, tickets and a publisher, in synchronous code or asyncio, used directly or through an adapter.',
    frameworks: { label: 'Adapters for', items: ['LangChain', 'LangGraph', 'Agno', 'CrewAI', 'LlamaIndex', 'Haystack'] },
  },
  {
    name: 'In the browser',
    install: 'npm install @neuron-core/iq-stream',
    href: 'https://www.npmjs.com/package/@neuron-core/iq-stream',
    host: 'npm',
    text: 'Optional: a subscriber that tells your page how each answer ended, and bridges that plug the stream into your chat UI.',
    frameworks: { label: 'Bridges to', items: ['Vercel AI SDK', 'AG-UI', 'CopilotKit'] },
  },
];

/** Stores IQ-Stream can read customers (apps, credentials, limits) from. */
export const CUSTOMER_STORES = ['PostgreSQL', 'MySQL', 'Redis'];

/** What a container's memory holds: 4,000-token answers, one AG-UI event per token, kept in full while they run. */
export const ANSWERS_IN_MEMORY = { containerGb: 2, answers: 1_400, tokensPerAnswer: 4_000 };
