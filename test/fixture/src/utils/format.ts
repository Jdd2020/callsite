/**
 * @file Fixture: uses total from another folder.
 */
import { total } from '../components/billing/total';

export function formatTotal(items: number[]): string {
	return `$${total(items)}`;
}
