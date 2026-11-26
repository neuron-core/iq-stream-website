// The pricing page's plans and usage prices. The page is static: the amounts are written here, by the
// lookup keys of the cloud app's Stripe catalog, so a price changed in Stripe changes here too. The
// limits and prepaid quotas are the plans' rows in the cloud app's database.

/** EUR cents before VAT, by lookup key. */
const CENTS = {
  hobby_monthly: 900,
  team_monthly: 9_900,
  business_monthly: 29_900,
  streams_usage: 23,
  egress_usage: 13,
} as const;

/** What one app may run, whatever it pays. */
export interface Limits {
  maxStreams: number;
  subscribersPerStream: number;
  eventKiB: number;
  /** The longest a stream lasts. */
  streamMinutes: number;
  /** The most memory one stream's events take on the server. */
  streamMiB: number;
}

/** A paid plan: one app's limits, and the streams and egress its monthly price prepays. */
export interface Plan extends Limits {
  name: string;
  /** EUR cents a month, per app. */
  cents: number;
  prepaidStreams: number;
  prepaidEgressGb: number;
}

export const HOBBY: Plan = {
  name: 'Hobby',
  cents: CENTS.hobby_monthly,
  prepaidStreams: 40,
  prepaidEgressGb: 25,
  maxStreams: 200,
  subscribersPerStream: 2,
  eventKiB: 32,
  streamMinutes: 60,
  streamMiB: 50,
};

export const TEAM: Plan = {
  name: 'Team',
  cents: CENTS.team_monthly,
  prepaidStreams: 500,
  prepaidEgressGb: 250,
  maxStreams: 1_000,
  subscribersPerStream: 3,
  eventKiB: 64,
  streamMinutes: 120,
  streamMiB: 50,
};

export const BUSINESS: Plan = {
  name: 'Business',
  cents: CENTS.business_monthly,
  prepaidStreams: 1_500,
  prepaidEgressGb: 1_000,
  maxStreams: 3_000,
  subscribersPerStream: 5,
  eventKiB: 128,
  streamMinutes: 180,
  streamMiB: 50,
};

export const PLANS: Plan[] = [HOBBY, TEAM, BUSINESS];

/** One app on a personal team, never billed. Past its egress it pauses until the 1st of the month. */
export const FREE_APP: Limits & { egressGb: number } = {
  maxStreams: 5,
  subscribersPerStream: 2,
  eventKiB: 32,
  streamMinutes: 5,
  streamMiB: 10,
  egressGb: 5,
};

/** EUR cents for each concurrent stream above the prepaid ones, at the month's peak. */
export const EXTRA_STREAM_CENTS = CENTS.streams_usage;

/** EUR cents for each GB of egress above the prepaid ones: what it costs us, passed on. */
export const EXTRA_GB_CENTS = CENTS.egress_usage;

export interface Month {
  extraStreams: number;
  extraGb: number;
  /** EUR cents: the plan, the extra streams and the extra egress. */
  cents: number;
}

/**
 * What an app's month costs, as the cloud app bills it: the plan's price, each stream of the peak
 * above the prepaid ones, never past the plan's maximum, and each whole GB above the prepaid ones.
 */
export function monthOf(plan: Plan, peakStreams: number, egressGb: number): Month {
  const extraStreams = Math.max(0, Math.min(peakStreams, plan.maxStreams) - plan.prepaidStreams);
  const extraGb = Math.max(0, Math.ceil(egressGb) - plan.prepaidEgressGb);

  return { extraStreams, extraGb, cents: plan.cents + extraStreams * EXTRA_STREAM_CENTS + extraGb * EXTRA_GB_CENTS };
}

/**
 * What one prepaid stream costs, in EUR cents: the plan's price, less its prepaid egress at the egress
 * price, over its prepaid streams. The cloud app's Plan page shows the same.
 */
export const prepaidStreamCents = (plan: Plan): number =>
  (plan.cents - plan.prepaidEgressGb * EXTRA_GB_CENTS) / plan.prepaidStreams;

/** How much less a prepaid stream costs than an extra one, in whole percent rounded down, as the app says it. */
export const prepaidSaving = (plan: Plan): number =>
  Math.floor((1 - prepaidStreamCents(plan) / EXTRA_STREAM_CENTS) * 100);

/** An agent's answers streamed to many people at once, one message per token. */
export const AGENT_BURST = { streams: 500, tokensPerSecond: 70, seconds: 120 };

export const BURST_MESSAGES = AGENT_BURST.streams * AGENT_BURST.tokensPerSecond * AGENT_BURST.seconds;

/** A message cap of a service built for chat and notifications, read off its pricing page. */
export const MESSAGE_CAP = {
  service: 'Pusher Channels',
  plan: 'Pro',
  messagesPerDay: 4_000_000,
  url: 'https://pusher.com/channels/pricing/',
  checkedOn: '2026-11-23',
};
