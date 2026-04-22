/**
 * Robot Service Tests
 * 机器人服务单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http } from '@/utils/request';
import {
  getRobotList,
  addRobot,
  updateRobot,
  deleteRobot,
  toggleRobot,
  enableRobot,
  disableRobot,
} from '../robotService';
import { MESSAGE_API } from '../constants';
import type { RobotAddParams, RobotEditParams } from '@/types/message';

// Mock http module
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('RobotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRobotList', () => {
    it('should fetch robot list successfully', async () => {
      const projectId = 'test-project';
      const mockRobots = [
        { id: 'robot-1', name: 'Test Robot', platform: 'WE_COM' },
      ];

      vi.mocked(http.get).mockResolvedValue(mockRobots);

      const result = await getRobotList(projectId);

      expect(http.get).toHaveBeenCalledWith(`${MESSAGE_API.ROBOT_LIST}/${projectId}`);
      expect(result).toEqual(mockRobots);
    });
  });

  describe('addRobot', () => {
    it('should create robot with correct data', async () => {
      const robotData: RobotAddParams = {
        projectId: 'test-project',
        name: 'New Robot',
        platform: 'DING_TALK',
        type: 'CUSTOM',
        webhook: 'https://example.com/webhook',
        enable: true,
      };

      const mockResponse = { id: 'robot-123', ...robotData };
      vi.mocked(http.post).mockResolvedValue(mockResponse);

      const result = await addRobot(robotData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.ROBOT_ADD, robotData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle enterprise dingtalk robot', async () => {
      const robotData: RobotAddParams = {
        projectId: 'test-project',
        name: 'Enterprise Robot',
        platform: 'DING_TALK',
        type: 'ENTERPRISE',
        webhook: 'https://example.com/webhook',
        appKey: 'test-key',
        appSecret: 'test-secret',
        enable: true,
      };

      vi.mocked(http.post).mockResolvedValue({ id: 'robot-123', ...robotData });

      await addRobot(robotData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.ROBOT_ADD, robotData);
    });
  });

  describe('updateRobot', () => {
    it('should update robot successfully', async () => {
      const robotData: RobotEditParams = {
        id: 'robot-123',
        projectId: 'test-project',
        name: 'Updated Robot',
        platform: 'WE_COM',
        webhook: 'https://example.com/webhook',
        enable: true,
      };

      vi.mocked(http.post).mockResolvedValue(robotData);

      const result = await updateRobot(robotData);

      expect(http.post).toHaveBeenCalledWith(MESSAGE_API.ROBOT_UPDATE, robotData);
      expect(result).toEqual(robotData);
    });
  });

  describe('deleteRobot', () => {
    it('should delete robot by ID', async () => {
      const robotId = 'robot-123';

      vi.mocked(http.get).mockResolvedValue(undefined);

      await deleteRobot(robotId);

      expect(http.get).toHaveBeenCalledWith(`${MESSAGE_API.ROBOT_DELETE}/${robotId}`);
    });
  });

  describe('toggleRobot', () => {
    it('should toggle robot status', async () => {
      const robotId = 'robot-123';

      vi.mocked(http.get).mockResolvedValue(undefined);

      await toggleRobot(robotId);

      expect(http.get).toHaveBeenCalledWith(`${MESSAGE_API.ROBOT_TOGGLE}/${robotId}`);
    });
  });

  describe('enableRobot', () => {
    it('should call toggleRobot', async () => {
      const robotId = 'robot-123';

      vi.mocked(http.get).mockResolvedValue(undefined);

      await enableRobot(robotId);

      expect(http.get).toHaveBeenCalledWith(`${MESSAGE_API.ROBOT_TOGGLE}/${robotId}`);
    });
  });

  describe('disableRobot', () => {
    it('should call toggleRobot', async () => {
      const robotId = 'robot-123';

      vi.mocked(http.get).mockResolvedValue(undefined);

      await disableRobot(robotId);

      expect(http.get).toHaveBeenCalledWith(`${MESSAGE_API.ROBOT_TOGGLE}/${robotId}`);
    });
  });
});
