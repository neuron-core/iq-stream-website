export const ARCHITECTURES = ['amd64', 'arm64'];

export const LANGUAGES = ['PHP', 'Python', 'Node.js', 'Go', 'Ruby', 'Java', '.NET'];

export const FRONTEND_PROTOCOLS = ['AG-UI', 'the Vercel AI SDK', 'plain text'];

/** Stores IQ-Stream can read customers (apps, credentials, limits) from. */
export const CUSTOMER_STORES = ['PostgreSQL', 'MySQL', 'Redis'];

/** What general-purpose real-time servers carry and IQ-Stream leaves out. */
export const LEFT_OUT = ['topics', 'channels', 'presence', 'message history', 'broker', 'database'];

/** What a container's memory holds: 4,000-token answers, one AG-UI event per token, kept in full while they run. */
export const ANSWERS_IN_MEMORY = { containerGb: 2, answers: 1_400, tokensPerAnswer: 4_000 };
