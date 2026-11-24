// Prices read from Stripe's API at build time: the amounts live only in Stripe, so the site can't drift
// from what Stripe charges. The key is a restricted one, read-only on prices and products.

const KEY_VARIABLE = 'STRIPE_PRICES_KEY';
const PRICES_URL = 'https://api.stripe.com/v1/prices';

/** The fields of Stripe's price object read here. */
interface StripePrice {
  id: string;
  lookup_key: string | null;
  currency: string;
  /** In the currency's smallest unit; null on a price with fractions of a cent. */
  unit_amount: number | null;
}

interface StripeList {
  data: StripePrice[];
  has_more: boolean;
}

interface StripeError {
  error?: { message?: string };
}

/** Every active price in the account, a page of 100 at a time. */
async function listActivePrices(key: string): Promise<StripePrice[]> {
  const prices: StripePrice[] = [];
  let startingAfter: string | undefined;

  do {
    const url = new URL(PRICES_URL);
    url.searchParams.set('active', 'true');
    url.searchParams.set('limit', '100');

    if (startingAfter) {
      url.searchParams.set('starting_after', startingAfter);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as StripeError;

      throw new Error(`Stripe answered ${response.status} to listing prices: ${body.error?.message ?? response.statusText}`);
    }

    const page = (await response.json()) as StripeList;

    prices.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  return prices;
}

/**
 * EUR cents, before VAT, by lookup key. Stripe filters by at most 10 lookup keys a request, so this
 * lists the active prices and picks them out. Throws, and so fails the build, when STRIPE_PRICES_KEY
 * is missing or Stripe lacks one of the keys: the page never ships without its prices.
 */
export async function fetchPrices<Key extends string>(lookupKeys: readonly Key[]): Promise<Record<Key, number>> {
  const key = process.env[KEY_VARIABLE];

  if (!key) {
    throw new Error(
      `${KEY_VARIABLE} is missing. The pricing page reads its prices from Stripe at build time: set it to a restricted key, read-only on prices and products.`,
    );
  }

  const byLookupKey = new Map((await listActivePrices(key)).map((price) => [price.lookup_key, price]));
  const missing = lookupKeys.filter((lookupKey) => !byLookupKey.has(lookupKey));

  if (missing.length > 0) {
    throw new Error(`Stripe has no active price with the lookup key ${missing.join(', ')}.`);
  }

  return Object.fromEntries(
    lookupKeys.map((lookupKey) => {
      const { currency, unit_amount: cents } = byLookupKey.get(lookupKey) as StripePrice;

      if (currency !== 'eur' || cents === null) {
        throw new Error(`Stripe's ${lookupKey} price isn't a whole number of EUR cents.`);
      }

      return [lookupKey, cents];
    }),
  ) as Record<Key, number>;
}
