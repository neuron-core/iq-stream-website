const numbers = new Intl.NumberFormat('en-US');
const and = new Intl.ListFormat('en-GB', { type: 'conjunction' });
const or = new Intl.ListFormat('en-GB', { type: 'disjunction' });
const dates = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export type Currency = 'EUR' | 'USD';

const money = (amount: number, currency: Currency, digits: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);

/** 85000 → "85,000" */
export const formatNumber = (value: number) => numbers.format(value);

/** Whole amounts without cents, others with two: 15 → "€15", 12.5 → "€12.50", 1690 → "€1,690" */
export const formatMoney = (amount: number, currency: Currency = 'EUR') =>
  money(amount, currency, Number.isInteger(amount) ? 0 : 2);

/** A price per unit, always with cents so rates read alike: 50 → "€50.00" */
export const formatRate = (amount: number, currency: Currency = 'EUR') => money(amount, currency, 2);

/** EUR cents, as Stripe counts them: 1500 → "€15", 12 → "€0.12" */
export const formatCents = (cents: number) => formatMoney(cents / 100);

/** "2026-11-23" → "23 November 2026" */
export const formatDate = (isoDate: string) => dates.format(new Date(isoDate));

/** "https://pusher.com/channels/pricing/" → "pusher.com/channels/pricing" */
export const formatSource = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/** 250 → "250 GB", 1000 → "1 TB" */
export const formatGigabytes = (gb: number) =>
  gb >= 1_000 ? `${formatNumber(gb / 1_000)} TB` : `${formatNumber(gb)} GB`;

/** 1 → "1 app", 3 → "3 apps" */
export const plural = (count: number, one: string, many = `${one}s`) =>
  `${formatNumber(count)} ${count === 1 ? one : many}`;

/** ["a", "b", "c"] → "a, b and c" */
export const listAnd = (items: string[]) => and.format(items);

/** ["a", "b", "c"] → "a, b or c" */
export const listOr = (items: string[]) => or.format(items);

/** Wraps each item in <code>, for lists rendered with set:html. */
export const asCode = (items: string[]) => items.map((item) => `<code>${item}</code>`);
