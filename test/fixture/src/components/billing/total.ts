/**
 * @file Fixture: defines total, the symbol the integration tests search for.
 */

export function total(items: number[]): number {
	return items.reduce((sum, n) => sum + n, 0);
}
