/**
 * useMessageConfig Property-Based Tests
 * useMessageConfig Hook 属性测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useMessageConfig } from '../useMessageConfig';
import * as messageService from '@/services/message';
import type { MessageItem, MessageTaskType, MessageTaskDetail } from '@/types/message';

// Mock message service
vi.mock('@/services/message');

describe('useMessageConfig - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: project-message-log-migration, Property 1: 机器人筛选正确性
  /**
   * **Validates: Requirements 1.2**
   * 
   * Property: For any message config list and selected robot ID,
   * all configs returned after filtering should be associated with that robot ID
   */
  it('Property 1: should filter configs by robot ID correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary message list with robot configs
        fc.array(
          fc.record({
            type: fc.string(),
            name: fc.string(),
            messageTaskTypeDTOList: fc.array(
              fc.record({
                taskType: fc.string(),
                taskTypeName: fc.string(),
                messageTaskDetailDTOList: fc.array(
                  fc.record({
                    event: fc.string(),
                    eventName: fc.string(),
                    receivers: fc.array(
                      fc.record({
                        id: fc.string(),
                        name: fc.string(),
                      })
                    ),
                    projectRobotConfigMap: fc.dictionary(
                      fc.string(), // robot ID
                      fc.record({
                        robotId: fc.string(),
                        robotName: fc.string(),
                        platform: fc.constantFrom('WE_COM', 'DING_TALK', 'LARK', 'CUSTOM'),
                        enable: fc.boolean(),
                        template: fc.string(),
                        defaultTemplate: fc.string(),
                        previewTemplate: fc.string(),
                        useDefaultTemplate: fc.boolean(),
                        subject: fc.string(),
                        defaultSubject: fc.string(),
                        previewSubject: fc.string(),
                        useDefaultSubject: fc.boolean(),
                      })
                    ),
                  })
                ),
              })
            ),
          })
        ),
        // Generate a robot ID to filter by
        fc.string(),
        async (messageList: MessageItem[], selectedRobotId: string) => {
          // Setup mock
          vi.mocked(messageService.getMessageList).mockResolvedValue(messageList);
          vi.mocked(messageService.getMessageUserList).mockResolvedValue([]);

          // Render hook
          const { result } = renderHook(() => useMessageConfig('test-project'));

          // Wait for data to load
          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          // Apply filter
          result.current.setSelectedRobotId(selectedRobotId);

          // Wait for filter to apply
          await waitFor(() => {
            const filtered = result.current.filteredMessageList;

            // Property: All filtered configs should contain the selected robot ID
            filtered.forEach(item => {
              item.messageTaskTypeDTOList.forEach(taskType => {
                taskType.messageTaskDetailDTOList.forEach(detail => {
                  // Each detail should have the selected robot in its config map
                  expect(Object.keys(detail.projectRobotConfigMap)).toContain(selectedRobotId);
                });
              });
            });
          });
        }
      ),
      { numRuns: 50 } // Run 50 test cases
    );
  });

  // Additional unit test for robot filtering with specific examples
  it('should filter message list by selected robot ID', async () => {
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
                receivers: [],
                projectRobotConfigMap: {
                  'robot-1': {
                    robotId: 'robot-1',
                    robotName: 'Robot 1',
                    platform: 'DING_TALK',
                    enable: true,
                    template: 'template1',
                    defaultTemplate: 'default1',
                    previewTemplate: 'preview1',
                    useDefaultTemplate: false,
                    subject: 'subject1',
                    defaultSubject: 'defaultSubject1',
                    previewSubject: 'previewSubject1',
                    useDefaultSubject: false,
                  },
                  'robot-2': {
                    robotId: 'robot-2',
                    robotName: 'Robot 2',
                    platform: 'WE_COM',
                    enable: true,
                    template: 'template2',
                    defaultTemplate: 'default2',
                    previewTemplate: 'preview2',
                    useDefaultTemplate: false,
                    subject: 'subject2',
                    defaultSubject: 'defaultSubject2',
                    previewSubject: 'previewSubject2',
                    useDefaultSubject: false,
                  },
                },
              },
              {
                event: 'UPDATE',
                eventName: '更新',
                receivers: [],
                projectRobotConfigMap: {
                  'robot-1': {
                    robotId: 'robot-1',
                    robotName: 'Robot 1',
                    platform: 'DING_TALK',
                    enable: true,
                    template: 'template1',
                    defaultTemplate: 'default1',
                    previewTemplate: 'preview1',
                    useDefaultTemplate: false,
                    subject: 'subject1',
                    defaultSubject: 'defaultSubject1',
                    previewSubject: 'previewSubject1',
                    useDefaultSubject: false,
                  },
                },
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(messageService.getMessageList).mockResolvedValue(mockMessageList);
    vi.mocked(messageService.getMessageUserList).mockResolvedValue([]);

    const { result } = renderHook(() => useMessageConfig('test-project'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Filter by robot-1
    result.current.setSelectedRobotId('robot-1');

    await waitFor(() => {
      const filtered = result.current.filteredMessageList;
      
      // Should include both events (CREATE and UPDATE) as both have robot-1
      expect(filtered).toHaveLength(1);
      expect(filtered[0].messageTaskTypeDTOList[0].messageTaskDetailDTOList).toHaveLength(2);
    });

    // Filter by robot-2
    result.current.setSelectedRobotId('robot-2');

    await waitFor(() => {
      const filtered = result.current.filteredMessageList;
      
      // Should only include CREATE event as only it has robot-2
      expect(filtered).toHaveLength(1);
      expect(filtered[0].messageTaskTypeDTOList[0].messageTaskDetailDTOList).toHaveLength(1);
      expect(filtered[0].messageTaskTypeDTOList[0].messageTaskDetailDTOList[0].event).toBe('CREATE');
    });

    // Filter by non-existent robot
    result.current.setSelectedRobotId('robot-999');

    await waitFor(() => {
      const filtered = result.current.filteredMessageList;
      
      // Should return empty list
      expect(filtered).toHaveLength(0);
    });

    // Clear filter
    result.current.setSelectedRobotId(null);

    await waitFor(() => {
      const filtered = result.current.filteredMessageList;
      
      // Should return all items
      expect(filtered).toEqual(mockMessageList);
    });
  });
});

  // Feature: project-message-log-migration, Property 4: 配置状态切换往返
  /**
   * **Validates: Requirements 1.5**
   * 
   * Property: For any message config, toggling enable status twice
   * (enable→disable→enable or disable→enable→disable) should return to original state
   */
  it('Property 4: should maintain config state after double toggle', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial config state
        fc.record({
          projectId: fc.string(),
          taskType: fc.string(),
          event: fc.string(),
          robotId: fc.string(),
          receiverIds: fc.array(fc.string()),
          enable: fc.boolean(),
        }),
        async (initialConfig) => {
          // Mock service calls
          vi.mocked(messageService.saveMessageConfig).mockResolvedValue(undefined);
          vi.mocked(messageService.getMessageList).mockResolvedValue([]);
          vi.mocked(messageService.getMessageUserList).mockResolvedValue([]);

          const { result } = renderHook(() => useMessageConfig(initialConfig.projectId));

          await waitFor(() => {
            expect(result.current.loading).toBe(false);
          });

          const originalEnable = initialConfig.enable;

          // First toggle
          await result.current.updateMessageConfig({
            ...initialConfig,
            enable: !originalEnable,
          });

          await waitFor(() => {
            expect(result.current.saving).toBe(false);
          });

          // Second toggle (back to original)
          await result.current.updateMessageConfig({
            ...initialConfig,
            enable: originalEnable,
          });

          await waitFor(() => {
            expect(result.current.saving).toBe(false);
          });

          // Verify saveMessageConfig was called twice with correct values
          expect(messageService.saveMessageConfig).toHaveBeenCalledTimes(2);
          
          const firstCall = vi.mocked(messageService.saveMessageConfig).mock.calls[0][0];
          const secondCall = vi.mocked(messageService.saveMessageConfig).mock.calls[1][0];

          // First call should toggle the state
          expect(firstCall.enable).toBe(!originalEnable);
          
          // Second call should return to original state
          expect(secondCall.enable).toBe(originalEnable);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Additional unit test for status toggle with specific example
  it('should toggle message config status correctly', async () => {
    const mockConfig = {
      projectId: 'test-project',
      taskType: 'API_CASE',
      event: 'CREATE',
      robotId: 'robot-1',
      receiverIds: ['user-1', 'user-2'],
      enable: true,
    };

    vi.mocked(messageService.saveMessageConfig).mockResolvedValue(undefined);
    vi.mocked(messageService.getMessageList).mockResolvedValue([]);
    vi.mocked(messageService.getMessageUserList).mockResolvedValue([]);

    const { result } = renderHook(() => useMessageConfig('test-project'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Disable (true → false)
    await result.current.updateMessageConfig({
      ...mockConfig,
      enable: false,
    });

    await waitFor(() => {
      expect(result.current.saving).toBe(false);
    });

    expect(messageService.saveMessageConfig).toHaveBeenCalledWith(
      expect.objectContaining({ enable: false })
    );

    // Re-enable (false → true)
    await result.current.updateMessageConfig({
      ...mockConfig,
      enable: true,
    });

    await waitFor(() => {
      expect(result.current.saving).toBe(false);
    });

    expect(messageService.saveMessageConfig).toHaveBeenCalledWith(
      expect.objectContaining({ enable: true })
    );

    // Verify both calls were made
    expect(messageService.saveMessageConfig).toHaveBeenCalledTimes(2);
  });
});
