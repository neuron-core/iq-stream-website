import type { Currency } from '../utils/format';
import { fetchPrices } from '../utils/stripe';

// The pricing page's plans, sizes and competitors. Every amount of ours comes from Stripe at build time,
// by the lookup keys of the billing spec's catalog. Free costs €0 and has no price in Stripe.

/** EUR cents before VAT, by lookup key: read from Stripe once per build, when this module first loads. */
const CENTS = await fetchPrices([
  'pro_monthly',
  'pro_annual',
  'scale_monthly',
  'scale_annual',
  'small_aws_monthly',
  'small_aws_annual',
  'medium_aws_monthly',
  'medium_aws_annual',
  'large_aws_monthly',
  'large_aws_annual',
  'overage_aws',
]);

export type Interval = 'monthly' | 'annual';

/** EUR cents before VAT, for a month and for a year. */
export type Prices = Record<Interval, number>;

/** An app's limits are its plan's; the plan also sets how many apps a team has in shared regions. */
export interface SharedPlan {
  kind: 'shared';
  key: 'free' | 'pro' | 'scale';
  name: string;
  apps: number;
  streamsPerApp: number;
  subscribersPerStream: number;
  /** Concurrent streams in all: apps × streams per app. */
  streams: number;
  /** Free exists only on a personal team. */
  personalTeamOnly: boolean;
  /** Null on Free. */
  cents: Prices | null;
}

/** A dedicated server on AWS for one team, published to over private peering with its VPC. */
export interface PrivateSize {
  kind: 'private';
  key: 'small' | 'medium' | 'large';
  name: string;
  /** The region's cap on concurrent streams. */
  streams: number;
  /** Egress included each month, in GB. */
  egressGb: number;
  cents: Prices;
}

export type Offer = SharedPlan | PrivateSize;

const shared = (plan: Omit<SharedPlan, 'kind' | 'streams'>): SharedPlan => ({
  ...plan,
  kind: 'shared',
  streams: plan.apps * plan.streamsPerApp,
});

export const FREE = shared({
  key: 'free',
  name: 'Free',
  apps: 1,
  streamsPerApp: 5,
  subscribersPerStream: 2,
  personalTeamOnly: true,
  cents: null,
});

export const PRO = shared({
  key: 'pro',
  name: 'Pro',
  apps: 3,
  streamsPerApp: 100,
  subscribersPerStream: 3,
  personalTeamOnly: false,
  cents: { monthly: CENTS.pro_monthly, annual: CENTS.pro_annual },
});

export const SCALE = shared({
  key: 'scale',
  name: 'Scale',
  apps: 5,
  streamsPerApp: 200,
  subscribersPerStream: 5,
  personalTeamOnly: false,
  cents: { monthly: CENTS.scale_monthly, annual: CENTS.scale_annual },
});

export const SHARED_PLANS: SharedPlan[] = [FREE, PRO, SCALE];

export const PRIVATE_SIZES: PrivateSize[] = [
  {
    kind: 'private',
    key: 'small',
    name: 'Small',
    streams: 2_000,
    egressGb: 250,
    cents: { monthly: CENTS.small_aws_monthly, annual: CENTS.small_aws_annual },
  },
  {
    kind: 'private',
    key: 'medium',
    name: 'Medium',
    streams: 4_000,
    egressGb: 500,
    cents: { monthly: CENTS.medium_aws_monthly, annual: CENTS.medium_aws_annual },
  },
  {
    kind: 'private',
    key: 'large',
    name: 'Large',
    streams: 8_000,
    egressGb: 1_000,
    cents: { monthly: CENTS.large_aws_monthly, annual: CENTS.large_aws_annual },
  },
];

/** Free to Large, in rising capacity. */
export const OFFERS: Offer[] = [...SHARED_PLANS, ...PRIVATE_SIZES];

/** EUR cents for each GB of a private region's egress past its allowance, on AWS. */
export const OVERAGE_CENTS = CENTS.overage_aws;

/** The same on every plan and size. */
export const STREAM_LIMITS = { sizeMiB: 50, minutes: 30, eventKiB: 64 };

/**
 * The months an annual price saves on twelve monthly ones: 2 while Stripe's annual prices are ten
 * monthly ones. The page says it as one number, so the build fails when the prices stop agreeing on it.
 */
function monthsFree(): number {
  const counts = new Set(OFFERS.flatMap(({ cents }) => (cents === null ? [] : [12 - cents.annual / cents.monthly])));
  const [count] = counts;

  if (counts.size !== 1 || !Number.isInteger(count) || count < 1) {
    throw new Error(
      'Stripe’s annual prices no longer save the same whole number of months on every plan and size: the pricing page’s “months free” needs new copy.',
    );
  }

  return count;
}

export const MONTHS_FREE = monthsFree();

/** A month's price in EUR cents: the monthly price, or the annual one spread over twelve months. Free is 0. */
export function centsAMonth(offer: Offer, interval: Interval): number {
  if (offer.cents === null) {
    return 0;
  }

  return interval === 'annual' ? offer.cents.annual / 12 : offer.cents.monthly;
}

/** EUR a month per 1,000 concurrent streams. Null on Free. */
export const perThousand = (offer: Offer, interval: Interval): number | null =>
  offer.cents === null ? null : (centsAMonth(offer, interval) / 100) * (1_000 / offer.streams);

// Competitors, per 1,000 concurrent connections. Ably and PubNub charge per monthly active user, which
// doesn't turn into concurrent connections without a guess, so they're left out.

/** When every competitor price below was read off its own pricing page. */
export const CHECKED_ON = '2026-11-23';

export interface CompetitorTier {
  name: string;
  /** A month, in the competitor's own currency, before tax. */
  monthly: number;
  /** Concurrent connections the tier includes. */
  connections: number;
  /** What caps its throughput, as its pricing page lists it. */
  cap: string;
}

export interface Competitor {
  name: string;
  currency: Currency;
  /** Its pricing page. */
  url: string;
  /** In rising capacity. */
  tiers: CompetitorTier[];
}

export const PUSHER: Competitor = {
  name: 'Pusher Channels',
  currency: 'USD',
  url: 'https://pusher.com/channels/pricing/',
  tiers: [
    { name: 'Sandbox', monthly: 0, connections: 100, cap: '200k messages a day' },
    { name: 'Startup', monthly: 49, connections: 500, cap: '1M messages a day' },
    { name: 'Pro', monthly: 99, connections: 2_000, cap: '4M messages a day' },
    { name: 'Business', monthly: 299, connections: 5_000, cap: '10M messages a day' },
    { name: 'Premium', monthly: 499, connections: 10_000, cap: '20M messages a day' },
  ],
};

export const MERCURE: Competitor = {
  name: 'Mercure Cloud',
  currency: 'EUR',
  url: 'https://mercure.rocks/pricing',
  tiers: [
    { name: 'Hobby', monthly: 30, connections: 250, cap: '1 publish a second' },
    { name: 'Pro', monthly: 100, connections: 1_000, cap: '4 publishes a second' },
    { name: 'Pro+', monthly: 250, connections: 5_000, cap: '20 publishes a second' },
    { name: 'Pro++', monthly: 500, connections: 10_000, cap: '60 publishes a second' },
  ],
};

/** Its free plan alone: compared only where it holds the streams picked. */
export const SUPABASE: Competitor = {
  name: 'Supabase Realtime',
  currency: 'USD',
  url: 'https://supabase.com/pricing',
  tiers: [{ name: 'Free', monthly: 0, connections: 200, cap: '2M messages a month' }],
};

/** Next to our offer at every number of streams: the cheapest tier of each that holds as many connections. */
export const COMPARED = [PUSHER, MERCURE];

/** Next to it only where their free plan holds the streams, so that our Free sits next to free plans. */
export const FREE_PLANS_ONLY = [SUPABASE];

/** The cheapest tier that holds this many concurrent connections. */
export const tierFor = (competitor: Competitor, connections: number): CompetitorTier | undefined =>
  competitor.tiers.find((tier) => tier.connections >= connections);

/** A tier's price per 1,000 of the connections it includes. Null on a free tier. */
export const tierPerThousand = ({ monthly, connections }: CompetitorTier): number | null =>
  monthly === 0 ? null : (monthly * 1_000) / connections;
