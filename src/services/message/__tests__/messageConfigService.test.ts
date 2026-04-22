/**
 * Message Configuration Service Tests
 * 消息配置服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http } from '@/utils/request';
import {
  getMessageList,
  saveMessageConfig,
  getMessageUserList,
  updateMessageConfigStatus,
} from '../messageConfigService';
import { MESSAGE_API } from '../constants';

// Mock http module
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('MessageConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMessageList', () => {
    it('should call API with correct project ID', async () => {
      const projectId = 'test-project-123';
      const mockData = [{ id: '1', name: 'Test Message' }];
      
      vi.mocked(http.get).mockResolvedValue(mockData);

      const result = await getMessageList(projectId);

      expect(http.get).toHaveBeenCalledWith(`${MESSAGE_API.MESSAGE_LIST}/${projectId}`);
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      const projectId = 'test-project-123';
      const error = new Error('API Error');
      
      vi.mocked(http.get).mockRejectedValue(error);

      await expect(getMessageList(projectId)).rejects.toThrow('API Error');
    });
  });

  describe('saveMessageConfig', () => {
    it('should call API with correct data', async () => {
      const configData = {
        projectId: 'test-project',
        taskType: 'TEST_TASK',
        event: 'CREATE',
        robotId: 'robot-123',
        receiverIds: ['user-1', 'user-2'],
        enable: true,
      };

      vi.mocked(http.post).mockResolvedValue(undefined);

      await saveMessageConfig(configData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.MESSAGE_SAVE, configData);
    });

    it('should handle validation errors', async () => {
      const configData = {
        projectId: 'test-project',
        taskType: 'TEST_TASK',
        event: 'CREATE',
        robotId: 'robot-123',
        receiverIds: [],
        enable: true,
      };

      const error = new Error('Validation Error');
      vi.mocked(http.post).mockRejectedValue(error);

      await expect(saveMessageConfig(configData)).rejects.toThrow('Validation Error');
    });
  });

  describe('getMessageUserList', () => {
    it('should call API with project ID and keyword', async () => {
      const params = {
        projectId: 'test-project',
        keyword: 'test',
      };
      const mockUsers = [
        { id: 'user-1', name: 'Test User' },
      ];

      vi.mocked(http.get).mockResolvedValue(mockUsers);

      const result = await getMessageUserList(params);

      expect(http.get).toHaveBeenCalledWith(
        `${MESSAGE_API.MESSAGE_USER_LIST}/${params.projectId}`,
        { params: { keyword: params.keyword } }
      );
      expect(result).toEqual(mockUsers);
    });

    it('should work without keyword', async () => {
      const params = {
        projectId: 'test-project',
      };
      const mockUsers = [
        { id: 'user-1', name: 'Test User' },
      ];

      vi.mocked(http.get).mockResolvedValue(mockUsers);

      await getMessageUserList(params);

      expect(http.get).toHaveBeenCalledWith(
        `${MESSAGE_API.MESSAGE_USER_LIST}/${params.projectId}`,
        { params: { keyword: undefined } }
      );
    });
  });

  describe('updateMessageConfigStatus', () => {
    it('should call saveMessageConfig with enable flag', async () => {
      const configData = {
        projectId: 'test-project',
        taskType: 'TEST_TASK',
        event: 'CREATE',
        robotId: 'robot-123',
        receiverIds: ['user-1'],
        enable: false,
      };

      vi.mocked(http.post).mockResolvedValue(undefined);

      await updateMessageConfigStatus(configData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.MESSAGE_SAVE, configData);
    });
  });
});
