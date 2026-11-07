/**
 * @file Fixture: uses total twice in the same folder as its definition.
 * The fixture is its own project, so it uses relative imports.
 */
import { total } from './total';

export function invoiceTotal(lines: number[]): number {
	return total(lines);
}

export function invoiceTax(lines: number[]): number {
	return total(lines) * 0.2;
}
