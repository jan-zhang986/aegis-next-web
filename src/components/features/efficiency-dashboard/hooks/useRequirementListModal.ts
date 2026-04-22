/**
 * Requirement List Modal Hook
 * 管理需求列表弹窗状态
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState } from 'react';
import type { Requirement } from '@/services/case-management/service-case-metrics';

interface RequirementListModalState {
  isOpen: boolean;
  date: string;
  requirements: Requirement[];
}

interface UseRequirementListModalReturn {
  requirementListModal: RequirementListModalState;
  openRequirementListModal: (date: string, requirements: Requirement[]) => void;
  closeRequirementListModal: () => void;
}

/**
 * Requirement List Modal Hook
 */
export function useRequirementListModal(): UseRequirementListModalReturn {
  const [requirementListModal, setRequirementListModal] = useState<RequirementListModalState>({
    isOpen: false,
    date: '',
    requirements: []
  });

  const openRequirementListModal = (date: string, requirements: Requirement[]) => {
    setRequirementListModal({
      isOpen: true,
      date,
      requirements,
    });
  };

  const closeRequirementListModal = () => {
    setRequirementListModal(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  return {
    requirementListModal,
    openRequirementListModal,
    closeRequirementListModal,
  };
}
