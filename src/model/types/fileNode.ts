import type { Usage } from '@/model/types/usage';

/** A file containing usages. */
export interface FileNode {
	kind: 'file';
	id: string;
	name: string;
	uri: string;
	count: number;
	hasDefinition: boolean;
	/** Sorted by position; never empty. */
	usages: Usage[];
}
