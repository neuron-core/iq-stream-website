import { SITE_NAME } from './site';

// Results of IQ-Stream's benchmark on AWS, as published in iq-stream/bench/README.md.

export const MERCURE = 'Mercure';
export const MERCURE_HISTORY = `${MERCURE} with history`;
export const REVERB = 'Laravel Reverb';
export const REVERB_SHORT = 'Reverb';
export const SOKETI = 'Soketi';
export const COMPETITORS = [MERCURE, REVERB, SOKETI];

/** Where the results were measured: each server alone on a VM of the types IQ-Stream Cloud runs. */
export const SETUP = {
  cloud: 'AWS',
  region: 'eu-central-1',
  processor: 'Graviton4',
  oneVcpu: { instance: 'c8g.medium', memoryGib: 2 },
  twoVcpus: { instance: 'c8g.large', memoryGib: 4 },
  loadGenerator: { instance: 'c8g.4xlarge' },
  /** IQ-Stream's one-vCPU figure: the same Graviton4 core, with more memory. */
  iqOneVcpuInstance: 'r8g.medium',
};

/** One simulated agent run, as streamed in every test. */
export const RUN = {
  protocol: 'AG-UI',
  events: 429,
  seconds: 10,
  toolPauseSeconds: 1.5,
  toolResultKb: 8,
  disconnects: 'one browser in ten',
};

/** A level holds when at least this share of the events arrives, with a p99 latency under this. */
export const HOLD = { deliveredPct: 99, p99Ms: 250 };

/** Below this delivery rate the backlog blurs reconnect losses, so they are not reported. */
export const DELIVERY_THRESHOLD = 90;

export type Competitor = 'mercure' | 'soketi' | 'reverb' | 'mercureHistory';
export type ServerKey = 'iq' | Competitor;

/** In the order the tables list them: fastest first. */
export const COMPETITOR_KEYS: Competitor[] = ['mercure', 'soketi', 'reverb', 'mercureHistory'];

/** As the tables name them. Reverb and Soketi answer HTTPS through nginx, which counts as theirs. */
export const SERVERS: Record<ServerKey, string> = {
  iq: SITE_NAME,
  mercure: MERCURE,
  soketi: `${SOKETI} + nginx`,
  reverb: `${REVERB} + nginx`,
  mercureHistory: `${MERCURE_HISTORY} (Bolt)`,
};

/** On two vCPUs, IQ-Stream runs its cluster, and Reverb and Soketi a process per vCPU, with Redis between them. */
export const SCALED_OUT_SERVERS: Record<ServerKey, string> = {
  ...SERVERS,
  iq: `${SITE_NAME} cluster`,
  soketi: `${SOKETI}, scaled out + nginx`,
  reverb: `${REVERB}, scaled out + nginx`,
};

/** Servers that resume a browser that reconnects, with what it missed. */
export const REPLAY: Record<ServerKey, boolean> = {
  iq: true,
  mercure: false,
  soketi: false,
  reverb: false,
  mercureHistory: true,
};

export interface Measure {
  /** Share of the offered events that reached the browsers, in percent. */
  delivered: number;
  eventsPerSecond: number;
  /** Server CPU time, nginx's included, as a share of one vCPU. */
  cpuPct: number;
  cpuPerEventUs: number;
  /** Peak memory beyond what the server used idle, divided by the concurrent runs. */
  memoryPerRunKib: number;
  p99Ms: number;
  /** Share of the offered events reconnecting browsers never received. Not reported below DELIVERY_THRESHOLD. */
  missedPct?: number;
}

/** One of the benchmark's levels, where every server but IQ-Stream ran once. */
export interface Level {
  runs: number;
  offeredEventsPerSecond: number;
  results: Record<Competitor, Measure>;
}

/** On a c8g.medium: 100, 300 and 1,000 concurrent runs. */
export const ONE_VCPU: Level[] = [
  {
    runs: 100,
    offeredEventsPerSecond: 4_273,
    results: {
      mercure: { delivered: 99.8, eventsPerSecond: 4_208, cpuPct: 57, cpuPerEventUs: 136, memoryPerRunKib: 685, p99Ms: 43, missedPct: 1.3 },
      soketi: { delivered: 100, eventsPerSecond: 4_218, cpuPct: 92, cpuPerEventUs: 218, memoryPerRunKib: 352, p99Ms: 73, missedPct: 1.4 },
      reverb: { delivered: 45, eventsPerSecond: 1_910, cpuPct: 96, cpuPerEventUs: 501, memoryPerRunKib: 177, p99Ms: 12_100 },
      mercureHistory: { delivered: 11, eventsPerSecond: 454, cpuPct: 13, cpuPerEventUs: 284, memoryPerRunKib: 487, p99Ms: 57_800 },
    },
  },
  {
    runs: 300,
    offeredEventsPerSecond: 12_819,
    results: {
      mercure: { delivered: 55, eventsPerSecond: 6_976, cpuPct: 94, cpuPerEventUs: 135, memoryPerRunKib: 439, p99Ms: 8_300 },
      soketi: { delivered: 35, eventsPerSecond: 4_505, cpuPct: 96, cpuPerEventUs: 212, memoryPerRunKib: 221, p99Ms: 18_000 },
      reverb: { delivered: 15, eventsPerSecond: 1_896, cpuPct: 96, cpuPerEventUs: 505, memoryPerRunKib: 157, p99Ms: 53_400 },
      mercureHistory: { delivered: 3.6, eventsPerSecond: 460, cpuPct: 13, cpuPerEventUs: 291, memoryPerRunKib: 257, p99Ms: 63_800 },
    },
  },
  {
    runs: 1_000,
    offeredEventsPerSecond: 42_729,
    results: {
      mercure: { delivered: 16, eventsPerSecond: 6_775, cpuPct: 95, cpuPerEventUs: 140, memoryPerRunKib: 289, p99Ms: 51_300 },
      soketi: { delivered: 9.8, eventsPerSecond: 4_210, cpuPct: 96, cpuPerEventUs: 227, memoryPerRunKib: 161, p99Ms: 58_900 },
      reverb: { delivered: 4.3, eventsPerSecond: 1_836, cpuPct: 96, cpuPerEventUs: 523, memoryPerRunKib: 151, p99Ms: 57_800 },
      mercureHistory: { delivered: 1.1, eventsPerSecond: 463, cpuPct: 14, cpuPerEventUs: 296, memoryPerRunKib: 248, p99Ms: 65_100 },
    },
  },
];

/** On a c8g.large: 200, 600 and 2,000 concurrent runs. */
export const TWO_VCPUS: Level[] = [
  {
    runs: 200,
    offeredEventsPerSecond: 8_546,
    results: {
      mercure: { delivered: 99.8, eventsPerSecond: 8_443, cpuPct: 126, cpuPerEventUs: 149, memoryPerRunKib: 581, p99Ms: 21, missedPct: 1.0 },
      soketi: { delivered: 77, eventsPerSecond: 6_519, cpuPct: 193, cpuPerEventUs: 296, memoryPerRunKib: 647, p99Ms: 3_300 },
      reverb: { delivered: 40, eventsPerSecond: 3_381, cpuPct: 192, cpuPerEventUs: 569, memoryPerRunKib: 174, p99Ms: 15_000 },
      mercureHistory: { delivered: 5.3, eventsPerSecond: 453, cpuPct: 15, cpuPerEventUs: 322, memoryPerRunKib: 308, p99Ms: 61_300 },
    },
  },
  {
    runs: 600,
    offeredEventsPerSecond: 25_637,
    results: {
      mercure: { delivered: 50, eventsPerSecond: 12_852, cpuPct: 190, cpuPerEventUs: 148, memoryPerRunKib: 412, p99Ms: 10_100 },
      soketi: { delivered: 26, eventsPerSecond: 6_547, cpuPct: 193, cpuPerEventUs: 295, memoryPerRunKib: 283, p99Ms: 28_300 },
      reverb: { delivered: 13, eventsPerSecond: 3_325, cpuPct: 194, cpuPerEventUs: 582, memoryPerRunKib: 157, p99Ms: 55_500 },
      mercureHistory: { delivered: 1.8, eventsPerSecond: 459, cpuPct: 15, cpuPerEventUs: 322, memoryPerRunKib: 248, p99Ms: 65_100 },
    },
  },
  {
    runs: 2_000,
    offeredEventsPerSecond: 85_458,
    results: {
      mercure: { delivered: 15, eventsPerSecond: 12_781, cpuPct: 194, cpuPerEventUs: 151, memoryPerRunKib: 280, p99Ms: 52_300 },
      soketi: { delivered: 7.2, eventsPerSecond: 6_161, cpuPct: 194, cpuPerEventUs: 314, memoryPerRunKib: 184, p99Ms: 60_100 },
      reverb: { delivered: 3.8, eventsPerSecond: 3_257, cpuPct: 195, cpuPerEventUs: 597, memoryPerRunKib: 157, p99Ms: 61_300 },
      mercureHistory: { delivered: 0.5, eventsPerSecond: 454, cpuPct: 16, cpuPerEventUs: 361, memoryPerRunKib: 247, p99Ms: 65_100 },
    },
  },
];

/**
 * The most IQ-Stream held on one machine, from runs of its own: they published its events per second and that it
 * held the level (HOLD), and on two vCPUs its CPU per event and its missed events, but not its CPU share or memory.
 */
export interface IqLevel {
  runs: number;
  offeredEventsPerSecond: number;
  eventsPerSecond: number;
  /** Rounded, as the benchmark states it. */
  approximate?: boolean;
  cpuPerEventUs?: number;
  missedPct?: number;
}

/** Every run offers the same events per second: the benchmark's heaviest level, per run. */
const offered = (runs: number) => {
  const heaviest = TWO_VCPUS.at(-1)!;
  return Math.round((heaviest.offeredEventsPerSecond / heaviest.runs) * runs);
};

/**
 * IQ-Stream's levels, found by raising the load until it fell behind, each held at every repeat.
 * It was not run at the benchmark's levels.
 */
export const IQ = {
  version: '1.3.0',
  /** About 27,700 events per second. */
  oneVcpu: { runs: 650, offeredEventsPerSecond: offered(650), eventsPerSecond: 27_700, approximate: true },
  twoVcpus: {
    runs: 1_100,
    offeredEventsPerSecond: offered(1_100),
    eventsPerSecond: 46_554,
    /** At its limit, TLS and HTTP/2 included. */
    cpuPerEventUs: 40,
    /** None of the browsers that reconnected missed an event. */
    missedPct: 0,
    /** Browsers that reconnected at that level. */
    reconnected: 647,
  },
  /** Its cluster on a c8g.xlarge: twice what two vCPUs held, under 1 GiB of memory. */
  fourVcpus: { runs: 2_300, memoryGib: 1 },
};

export const LOST_ON_RECONNECT = 0;

/** Events of one run each reconnecting browser lost, with a server that keeps nothing. */
export const LOST_WITHOUT_REPLAY = 51;

/**
 * What a server holds on one machine, and the most events per second it delivered there: on time for IQ-Stream,
 * while overloaded for the others, with events arriving seconds late.
 */
export interface Capacity {
  runs: number;
  /** It fell behind at every level, so its limit is under `runs`. */
  under: boolean;
  eventsPerSecond: number;
  /** Rounded, as the benchmark states it. */
  approximate?: boolean;
}

const held = ({ delivered, p99Ms }: Measure) => delivered >= HOLD.deliveredPct && p99Ms < HOLD.p99Ms;

function capacity(levels: Level[], key: Competitor): Capacity {
  const heldLevels = levels.filter(({ results }) => held(results[key]));
  return {
    runs: heldLevels.at(-1)?.runs ?? levels[0].runs,
    under: heldLevels.length === 0,
    eventsPerSecond: Math.max(...levels.map(({ results }) => results[key].eventsPerSecond)),
  };
}

const range = (values: number[]) => ({ min: Math.min(...values), max: Math.max(...values) });

export interface Summary {
  key: ServerKey;
  oneVcpu: Capacity;
  twoVcpus: Capacity;
  /** On two vCPUs: at IQ-Stream's limit, and across the benchmark's levels for the others. */
  cpuPerEventUs: { min: number; max: number };
}

/** Every server on both machines, IQ-Stream first. */
export const SUMMARY: Summary[] = [
  {
    key: 'iq',
    oneVcpu: { runs: IQ.oneVcpu.runs, under: false, eventsPerSecond: IQ.oneVcpu.eventsPerSecond, approximate: IQ.oneVcpu.approximate },
    twoVcpus: { runs: IQ.twoVcpus.runs, under: false, eventsPerSecond: IQ.twoVcpus.eventsPerSecond },
    cpuPerEventUs: range([IQ.twoVcpus.cpuPerEventUs]),
  },
  ...COMPETITOR_KEYS.map((key) => ({
    key,
    oneVcpu: capacity(ONE_VCPU, key),
    twoVcpus: capacity(TWO_VCPUS, key),
    cpuPerEventUs: range(TWO_VCPUS.map(({ results }) => results[key].cpuPerEventUs)),
  })),
];

const summaryOf = (key: Competitor) => SUMMARY.find((summary) => summary.key === key)!;

/** 3.62 → 3.6, 13.77 → 14: one decimal under ten, as the benchmark states them. */
const multiple = (ratio: number) => (ratio < 10 ? Math.round(ratio * 10) / 10 : Math.round(ratio));

/** On two vCPUs, IQ-Stream's events per second as a multiple of the most each competitor delivered. */
export const TWO_VCPU_MULTIPLE = {
  mercure: multiple(IQ.twoVcpus.eventsPerSecond / summaryOf('mercure').twoVcpus.eventsPerSecond),
  soketi: multiple(IQ.twoVcpus.eventsPerSecond / summaryOf('soketi').twoVcpus.eventsPerSecond),
  reverb: multiple(IQ.twoVcpus.eventsPerSecond / summaryOf('reverb').twoVcpus.eventsPerSecond),
};

/** IQ-Stream's throughput as a multiple of general-purpose servers', from the fastest to the slowest. */
export const THROUGHPUT_MULTIPLE = { min: TWO_VCPU_MULTIPLE.mercure, max: TWO_VCPU_MULTIPLE.reverb };

/** Times less CPU per event than general-purpose servers, on two vCPUs. */
export const CPU_ADVANTAGE = {
  min: multiple(summaryOf('mercure').cpuPerEventUs.min / IQ.twoVcpus.cpuPerEventUs),
  max: multiple(summaryOf('reverb').cpuPerEventUs.max / IQ.twoVcpus.cpuPerEventUs),
};

/** Mercure with history never relayed more than this many events per second, on either machine. */
export const MERCURE_HISTORY_PEAK = Math.max(
  summaryOf('mercureHistory').oneVcpu.eventsPerSecond,
  summaryOf('mercureHistory').twoVcpus.eventsPerSecond,
);
