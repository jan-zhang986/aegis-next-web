/**
 * Message Config Service Property-Based Tests
 * 消息配置服务属性测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  getMessageList,
  saveMessageConfig,
} from '../messageConfigService';
import { http } from '@/utils/request';
import type { SaveMessageConfigParams, MessageItem } from '@/types/message';

// Mock http client
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('messageConfigService - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: project-message-log-migration, Property 27: 消息配置持久化往返
  /**
   * **Validates: Requirements 6.1**
   * 
   * Property: For any message config, after saving and reloading,
   * the config data should be identical to what was saved
   */
  it('Property 27: should persist and retrieve message config correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary message config
        fc.record({
          projectId: fc.string({ minLength: 1 }),
          taskType: fc.string({ minLength: 1 }),
          event: fc.string({ minLength: 1 }),
          robotId: fc.string({ minLength: 1 }),
          receiverIds: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          enable: fc.boolean(),
          subject: fc.option(fc.string(), { nil: undefined }),
          template: fc.option(fc.string(), { nil: undefined }),
          useDefaultSubject: fc.option(fc.boolean(), { nil: undefined }),
          useDefaultTemplate: fc.option(fc.boolean(), { nil: undefined }),
        }),
        async (configData: SaveMessageConfigParams) => {
          // Mock save operation
          vi.mocked(http.post).mockResolvedValue(undefined);

          // Save the config
          await saveMessageConfig(configData);

          // Verify save was called with correct data
          expect(http.post).toHaveBeenCalledWith(
            expect.any(String),
            configData
          );

          // Mock the retrieval to return a message list containing our saved config
          const mockMessageList: MessageItem[] = [
            {
              type: 'TEST_TYPE',
              name: 'Test Type',
              messageTaskTypeDTOList: [
                {
                  taskType: configData.taskType,
                  taskTypeName: 'Task Type Name',
                  messageTaskDetailDTOList: [
                    {
                      event: configData.event,
                      eventName: 'Event Name',
                      receivers: configData.receiverIds.map(id => ({
                        id,
                        name: `User ${id}`,
                      })),
                      projectRobotConfigMap: {
                        [configData.robotId]: {
                          robotId: configData.robotId,
                          robotName: 'Test Robot',
                          platform: 'DING_TALK',
                          enable: configData.enable ?? true,
                          template: configData.template ?? '',
                          defaultTemplate: '',
                          previewTemplate: '',
                          useDefaultTemplate: configData.useDefaultTemplate ?? false,
                          subject: configData.subject ?? '',
                          defaultSubject: '',
                          previewSubject: '',
                          useDefaultSubject: configData.useDefaultSubject ?? false,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ];

          vi.mocked(http.get).mockResolvedValue(mockMessageList);

          // Retrieve the config
          const retrievedList = await getMessageList(configData.projectId);

          // Property: Retrieved data should match saved data
          expect(retrievedList).toBeDefined();
          expect(retrievedList.length).toBeGreaterThan(0);

          // Find the saved config in the retrieved list
          const taskType = retrievedList[0].messageTaskTypeDTOList.find(
            tt => tt.taskType === configData.taskType
          );
          expect(taskType).toBeDefined();

          const detail = taskType?.messageTaskDetailDTOList.find(
            d => d.event === configData.event
          );
          expect(detail).toBeDefined();

          // Verify the robot config matches
          const robotConfig = detail?.projectRobotConfigMap[configData.robotId];
          expect(robotConfig).toBeDefined();
          expect(robotConfig?.robotId).toBe(configData.robotId);
          expect(robotConfig?.enable).toBe(configData.enable ?? true);

          // Verify receivers match
          const receiverIds = detail?.receivers.map(r => r.id) ?? [];
          expect(receiverIds.sort()).toEqual(configData.receiverIds.sort());

          // Verify template and subject if provided
          if (configData.template !== undefined) {
            expect(robotConfig?.template).toBe(configData.template);
          }
          if (configData.subject !== undefined) {
            expect(robotConfig?.subject).toBe(configData.subject);
          }
          if (configData.useDefaultTemplate !== undefined) {
            expect(robotConfig?.useDefaultTemplate).toBe(configData.useDefaultTemplate);
          }
          if (configData.useDefaultSubject !== undefined) {
            expect(robotConfig?.useDefaultSubject).toBe(configData.useDefaultSubject);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional unit test with specific example
  it('should save and retrieve message config with all fields', async () => {
    const configData: SaveMessageConfigParams = {
      projectId: 'project-123',
      taskType: 'API_CASE',
      event: 'CREATE',
      robotId: 'robot-456',
      receiverIds: ['user-1', 'user-2', 'user-3'],
      enable: true,
      subject: 'Test Subject',
      template: 'Test Template Content',
      useDefaultSubject: false,
      useDefaultTemplate: false,
    };

    // Mock save
    vi.mocked(http.post).mockResolvedValue(undefined);
    await saveMessageConfig(configData);

    expect(http.post).toHaveBeenCalledWith(
      expect.any(String),
      configData
    );

    // Mock retrieve
    const mockMessageList: MessageItem[] = [
      {
        type: 'API_TEST',
        name: 'API测试',
        messageTaskTypeDTOList: [
          {
            taskType: 'API_CASE',
            taskTypeName: 'API用例',
            messageTaskDetailDTOList: [
              {
                event: 'CREATE',
                eventName: '创建',
                receivers: [
                  { id: 'user-1', name: 'User 1' },
                  { id: 'user-2', name: 'User 2' },
                  { id: 'user-3', name: 'User 3' },
                ],
                projectRobotConfigMap: {
                  'robot-456': {
                    robotId: 'robot-456',
                    robotName: 'Test Robot',
                    platform: 'DING_TALK',
                    enable: true,
                    template: 'Test Template Content',
                    defaultTemplate: 'Default Template',
                    previewTemplate: 'Preview Template',
                    useDefaultTemplate: false,
                    subject: 'Test Subject',
                    defaultSubject: 'Default Subject',
                    previewSubject: 'Preview Subject',
                    useDefaultSubject: false,
                  },
                },
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(http.get).mockResolvedValue(mockMessageList);
    const retrievedList = await getMessageList('project-123');

    // Verify all fields match
    const taskType = retrievedList[0].messageTaskTypeDTOList[0];
    const detail = taskType.messageTaskDetailDTOList[0];
    const robotConfig = detail.projectRobotConfigMap['robot-456'];

    expect(robotConfig.robotId).toBe(configData.robotId);
    expect(robotConfig.enable).toBe(configData.enable);
    expect(robotConfig.template).toBe(configData.template);
    expect(robotConfig.subject).toBe(configData.subject);
    expect(robotConfig.useDefaultTemplate).toBe(configData.useDefaultTemplate);
    expect(robotConfig.useDefaultSubject).toBe(configData.useDefaultSubject);

    const receiverIds = detail.receivers.map(r => r.id);
    expect(receiverIds.sort()).toEqual(configData.receiverIds.sort());
  });

  it('should handle minimal config data', async () => {
    const minimalConfig: SaveMessageConfigParams = {
      projectId: 'project-min',
      taskType: 'TASK',
      event: 'EVENT',
      robotId: 'robot-min',
      receiverIds: ['user-min'],
    };

    vi.mocked(http.post).mockResolvedValue(undefined);
    await saveMessageConfig(minimalConfig);

    expect(http.post).toHaveBeenCalledWith(
      expect.any(String),
      minimalConfig
    );

    // Mock retrieve with minimal data
    const mockMessageList: MessageItem[] = [
      {
        type: 'TYPE',
        name: 'Name',
        messageTaskTypeDTOList: [
          {
            taskType: 'TASK',
            taskTypeName: 'Task Name',
            messageTaskDetailDTOList: [
              {
                event: 'EVENT',
                eventName: 'Event Name',
                receivers: [{ id: 'user-min', name: 'User Min' }],
                projectRobotConfigMap: {
                  'robot-min': {
                    robotId: 'robot-min',
                    robotName: 'Robot Min',
                    platform: 'CUSTOM',
                    enable: true,
                    template: '',
                    defaultTemplate: '',
                    previewTemplate: '',
                    useDefaultTemplate: true,
                    subject: '',
                    defaultSubject: '',
                    previewSubject: '',
                    useDefaultSubject: true,
                  },
                },
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(http.get).mockResolvedValue(mockMessageList);
    const retrievedList = await getMessageList('project-min');

    const detail = retrievedList[0].messageTaskTypeDTOList[0].messageTaskDetailDTOList[0];
    const robotConfig = detail.projectRobotConfigMap['robot-min'];

    expect(robotConfig.robotId).toBe(minimalConfig.robotId);
    expect(detail.receivers[0].id).toBe(minimalConfig.receiverIds[0]);
  });
});
