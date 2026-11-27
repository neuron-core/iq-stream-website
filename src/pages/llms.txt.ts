import type { APIRoute } from 'astro';
import { COMPETITORS, IQ, LOST_ON_RECONNECT, SETUP, THROUGHPUT_MULTIPLE } from '../consts/benchmark';
import { HOBBY } from '../consts/pricing';
import { ARCHITECTURES, FRONTEND_PROTOCOLS, LANGUAGES, LIBRARIES } from '../consts/product';
import { CONTACT, GET_STARTED, NAV, PAGES, SITE_NAME, SITE_SUMMARY } from '../consts/site';
import { formatCents, formatNumber, listAnd, listOr } from '../utils/format';

// /llms.txt, as proposed at llmstxt.org: a Markdown summary of the site for language models.

const about: Record<string, string> = {
  [PAGES.home]: `What ${SITE_NAME} is, how stream replay works, and how to integrate it.`,
  [PAGES.performance]: `Benchmark against ${listAnd(COMPETITORS)}: throughput, latency, scaling and memory.`,
  [PAGES.cloud]: 'Offering LLM streaming as a managed, multi-tenant service, with a sizing and cost example.',
  [PAGES.pricing]:
    `A plan per app from ${formatCents(HOBBY.cents)} a month, priced by peak concurrent streams and egress, with no cap on messages.`,
};

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;

  const body = `# ${SITE_NAME}

> ${SITE_SUMMARY}

- Your backend publishes each chunk of model output over a plain HTTP request, one JSON line per event, from any language: ${listAnd(LANGUAGES)}, or anything that speaks HTTP.
- Browsers read the stream with the built-in EventSource, with no SDK. ${SITE_NAME} relays events exactly as sent, so it works with ${listOr([...FRONTEND_PROTOCOLS, 'your own format'])}.
- Replay: ${SITE_NAME} keeps each answer in memory while it is being written. A browser that reconnects resumes from the exact event it missed. ${LOST_ON_RECONNECT} events were lost on reconnect in the benchmark.
- Performance: on ${SETUP.cloud} ${SETUP.processor}, answering HTTPS, ${formatNumber(IQ.oneVcpu.runs)} concurrent agent runs on one vCPU, about ${formatNumber(IQ.oneVcpu.eventsPerSecond)} events per second, and ${formatNumber(IQ.twoVcpus.runs)} on two, ${formatNumber(IQ.twoVcpus.eventsPerSecond)} events per second at ${IQ.twoVcpus.cpuPerEventUs} µs of CPU each, every event on time: ${THROUGHPUT_MULTIPLE.min} to ${THROUGHPUT_MULTIPLE.max}× the throughput of general-purpose servers (${listAnd(COMPETITORS)}) on the same vCPUs.
- Multi-tenant: separate credentials, limits and live counters for every app on the same servers.
- One Docker image for ${listAnd(ARCHITECTURES)}. No database, no Redis, no disk and no message broker.

## Pages

${NAV.map(({ href, label }) => `- [${label}](${url(href)}): ${about[href]}`).join('\n')}

## Official libraries

${LIBRARIES.map(({ name, href, install, text, frameworks }) => `- [${name}](${href}): ${text} ${frameworks.label} ${listAnd(frameworks.items)}. Install with \`${install}\`.`).join('\n')}

## Get started

- [${GET_STARTED.label}](${GET_STARTED.href}): Create a free account on the ${SITE_NAME} cloud console.

## Contact

- [${CONTACT.label}](${CONTACT.href}): Ask about running ${SITE_NAME}, or about running the benchmark on your own infrastructure.
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
