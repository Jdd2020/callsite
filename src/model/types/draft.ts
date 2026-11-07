import type { Usage } from '@/model/types/usage';

/** A folder being built: subfolders by name and files by URI. Internal to buildTree. */
export interface Draft {
	folders: Map<string, Draft>;
	/** Keyed by URI: two files can share a path (e.g. local and remote copies). */
	files: Map<string, { name: string; usages: Usage[] }>;
}
