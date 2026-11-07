import type { Location } from '@/model/types/location';
import type { Usage } from '@/model/types/usage';
import type { WorkspaceRoot } from '@/model/types/workspaceRoot';

/** All results for one symbol: the input every view renders from. */
export interface UsageModel {
	symbol: string;
	definition?: Location;
	usages: Usage[];
	workspaceRoots: WorkspaceRoot[];
}
