import type { OpenedTest, ApiItem, ApiGroup } from '@/types';
import type { MetadataDefinition, MetadataModuleNode } from '@/services/metadata';
import type { CurrentSelection } from '@/hooks/useMetadataSearch';

export interface RecentUpdateRecord {
  id: string;
  relatedId: string;
  moduleType: string;
  extraData?: {
    name?: string;
    moduleId?: string;
    description?: string;
    method?: string;
    interfaceName?: string;
    url?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface MainContentState {
  currentSelection: CurrentSelection;
  expandedFolders: Set<string>;
  openedTest: OpenedTest | null;
  previewDefinition: MetadataDefinition | null;
  selectedDefinitionIds: Set<string>;
  userGroups: ApiGroup[];
  recentUpdates: RecentUpdateRecord[];
  loadingRecentUpdates: boolean;
}

export type { OpenedTest, ApiItem, ApiGroup, MetadataDefinition, MetadataModuleNode, CurrentSelection };
