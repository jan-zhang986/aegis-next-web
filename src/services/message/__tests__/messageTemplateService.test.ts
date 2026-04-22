/**
 * Message Template Service Tests
 * 消息模板服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http } from '@/utils/request';
import {
  getMessageDetail,
  getMessageFields,
  updateMessageTemplate,
  resetMessageTemplate,
} from '../messageTemplateService';
import { MESSAGE_API } from '../constants';

// Mock http module
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('MessageTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMessageDetail', () => {
    it('should fetch message template detail', async () => {
      const params = {
        projectId: 'test-project',
        taskType: 'TEST_TASK',
        event: 'CREATE',
        robotId: 'robot-123',
      };

      const mockDetail = {
        id: 'template-1',
        subject: 'Test Subject',
        template: 'Test Template',
        defaultSubject: 'Default Subject',
        defaultTemplate: 'Default Template',
      };

      vi.mocked(http.get).mockResolvedValue(mockDetail);

      const result = await getMessageDetail(params);

      expect(http.get).toHaveBeenCalledWith(MESSAGE_API.MESSAGE_DETAIL, { params });
      expect(result).toEqual(mockDetail);
    });
  });

  describe('getMessageFields', () => {
    it('should fetch message fields with task type', async () => {
      const projectId = 'test-project';
      const taskType = 'TEST_TASK';

      const mockFields = {
        fieldList: [
          { id: 'field-1', name: 'Field 1', fieldSource: 'source-1', type: 'string' },
        ],
        fieldSourceList: [
          { id: 'source-1', name: 'Source 1' },
        ],
      };

      vi.mocked(http.get).mockResolvedValue(mockFields);

      const result = await getMessageFields(projectId, taskType);

      expect(http.get).toHaveBeenCalledWith(
        `${MESSAGE_API.MESSAGE_FIELDS}/${projectId}`,
        { params: { taskType } }
      );
      expect(result).toEqual(mockFields);
    });
  });

  describe('updateMessageTemplate', () => {
    it('should update template successfully', async () => {
      const templateData = {
        projectId: 'test-project',
        taskType: 'TEST_TASK',
        event: 'CREATE',
        robotId: 'robot-123',
        receiverIds: ['user-1'],
        subject: 'Updated Subject',
        template: 'Updated Template',
        useDefaultSubject: false,
        useDefaultTemplate: false,
      };

      vi.mocked(http.post).mockResolvedValue(undefined);

      await updateMessageTemplate(templateData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.MESSAGE_SAVE, templateData);
    });
  });

  describe('resetMessageTemplate', () => {
    it('should reset template to default', async () => {
      const resetData = {
        projectId: 'test-project',
        taskType: 'TEST_TASK',
        event: 'CREATE',
        robotId: 'robot-123',
        receiverIds: ['user-1'],
        useDefaultSubject: true as const,
        useDefaultTemplate: true as const,
      };

      vi.mocked(http.post).mockResolvedValue(undefined);

      await resetMessageTemplate(resetData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.MESSAGE_SAVE, resetData);
    });
  });
});
