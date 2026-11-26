import { COMPETITOR_KEYS, HOLD, IQ, ONE_VCPU, RUN, SUMMARY, TWO_VCPUS } from './benchmark';

/** Concurrent agent runs IQ-Stream serves on one vCPU. */
export const RUNS_ON_ONE_VCPU = IQ.oneVcpu.runs;

/** The first of the benchmark's levels on one vCPU at which every general-purpose server had fallen behind. */
export const GENERAL_PURPOSE_LIMIT = ONE_VCPU.find(({ results }) =>
  COMPETITOR_KEYS.every((key) => results[key].delivered < HOLD.deliveredPct || results[key].p99Ms >= HOLD.p99Ms),
)!.runs;

/** Example plans, as limits on concurrent answers per app. */
export const PLANS = [
  { name: 'Starter app', concurrentAnswers: 50 },
  { name: 'Enterprise app', concurrentAnswers: 5_000 },
];

// Sizing example: an AI product with this many agent runs streaming at once.
const CONCURRENT_RUNS = 5_000;
const UTILIZATION_PCT = 70;
const VCPU_MONTHLY_PRICE = 30;

const eventsPerSecond = Math.floor((CONCURRENT_RUNS * RUN.events) / RUN.seconds / 1_000) * 1_000;

function size(cpuPerEventUs: number, runsOnTwoVcpus: number) {
  const busyCpus = (eventsPerSecond * cpuPerEventUs) / 1_000_000;
  const vCpus = Math.round(busyCpus / (UTILIZATION_PCT / 100));
  return { cpuPerEventUs, runsOnTwoVcpus, busyCpus, vCpus, monthlyCost: vCpus * VCPU_MONTHLY_PRICE };
}

// The fastest general-purpose server tested, on the same two vCPUs, at the load it still kept up with.
const mercure = SUMMARY.find(({ key }) => key === 'mercure')!;
const mercureHeld = TWO_VCPUS.find(({ runs }) => runs === mercure.twoVcpus.runs)!;

export const SIZING = {
  concurrentRuns: CONCURRENT_RUNS,
  utilizationPct: UTILIZATION_PCT,
  vCpuMonthlyPrice: VCPU_MONTHLY_PRICE,
  eventsPerRunPerSecond: Math.round(RUN.events / RUN.seconds),
  eventsPerSecond,
  iq: size(IQ.twoVcpus.cpuPerEventUs, IQ.twoVcpus.runs),
  generalPurpose: size(mercureHeld.results.mercure.cpuPerEventUs, mercure.twoVcpus.runs),
};
