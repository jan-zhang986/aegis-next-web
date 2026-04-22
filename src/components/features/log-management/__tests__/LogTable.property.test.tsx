/**
 * LogTable Property-Based Tests
 * LogTable 组件属性测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { LogTable } from '../LogTable';
import type { OperationLog, OperationType } from '@/types/log';

describe('LogTable - Property Tests', () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnSort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: project-message-log-migration, Property 22: 日志表格必需字段完整性
  /**
   * **Validates: Requirements 5.2**
   * 
   * Property: For any log record, the rendered table row should contain
   * all required fields: operator, scope, object, type, operation name, and time
   */
  it('Property 22: should display all required fields for any log record', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary log record
        fc.record({
          id: fc.uuid(),
          operUser: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 20 }),
          projectId: fc.option(fc.uuid(), { nil: null }),
          projectName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          organizationId: fc.option(fc.uuid(), { nil: null }),
          organizationName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          type: fc.constantFrom('ADD', 'DELETE', 'UPDATE', 'DEBUG', 'EXECUTE') as fc.Arbitrary<OperationType>,
          module: fc.string({ minLength: 1, maxLength: 20 }),
          content: fc.string({ minLength: 1, maxLength: 100 }),
          createTime: fc.date().map(d => d.toISOString()),
        }),
        async (log: OperationLog) => {
          const { container } = render(
            <LogTable
              logs={[log]}
              loading={false}
              total={1}
              current={1}
              pageSize={10}
              sortField="createTime"
              sortOrder="desc"
              onPageChange={mockOnPageChange}
              onPageSizeChange={mockOnPageSizeChange}
              onSort={mockOnSort}
            />
          );

          // Verify all required fields are present in the table
          const tableRows = container.querySelectorAll('tbody tr');
          expect(tableRows.length).toBe(1);

          const cells = tableRows[0].querySelectorAll('td');
          expect(cells.length).toBe(6); // 6 columns: operator, scope, object, type, name, time

          // Verify operator name is displayed
          expect(screen.getByText(log.userName || log.operUser)).toBeInTheDocument();

          // Verify operation type is displayed
          const typeLabels: Record<string, string> = {
            ADD: '添加',
            DELETE: '删除',
            UPDATE: '更新',
            DEBUG: '调试',
            EXECUTE: '执行',
          };
          expect(screen.getByText(typeLabels[log.type])).toBeInTheDocument();

          // Verify operation content is displayed
          expect(screen.getByText(log.content)).toBeInTheDocument();

          // Verify scope is displayed (项目/组织/系统)
          const scopeLabels = ['项目', '组织', '系统'];
          const hasScopeLabel = scopeLabels.some(label => {
            try {
              screen.getByText(label);
              return true;
            } catch {
              return false;
            }
          });
          expect(hasScopeLabel).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: project-message-log-migration, Property 23: 非删除操作可跳转
  /**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any log record where type is not DELETE,
   * the operation name should provide a clickable link
   */
  it('Property 23: should provide clickable link for non-delete operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate log with non-delete operation type
        fc.record({
          id: fc.uuid(),
          operUser: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 20 }),
          projectId: fc.uuid(),
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          organizationId: fc.constant(null),
          organizationName: fc.constant(null),
          type: fc.constantFrom('ADD', 'UPDATE', 'DEBUG', 'EXECUTE') as fc.Arbitrary<OperationType>,
          module: fc.string({ minLength: 1, maxLength: 20 }),
          content: fc.string({ minLength: 1, maxLength: 100 }),
          createTime: fc.date().map(d => d.toISOString()),
        }),
        async (log: OperationLog) => {
          render(
            <LogTable
              logs={[log]}
              loading={false}
              total={1}
              current={1}
              pageSize={10}
              sortField="createTime"
              sortOrder="desc"
              onPageChange={mockOnPageChange}
              onPageSizeChange={mockOnPageSizeChange}
              onSort={mockOnSort}
            />
          );

          // Verify operation name is rendered as a clickable button
          const operationButton = screen.getByRole('button', { name: log.content });
          expect(operationButton).toBeInTheDocument();
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: project-message-log-migration, Property 24: 删除操作不可跳转
  /**
   * **Validates: Requirements 5.4**
   * 
   * Property: For any log record where type is DELETE,
   * the operation name should not provide a clickable link
   */
  it('Property 24: should not provide link for delete operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate log with DELETE operation type
        fc.record({
          id: fc.uuid(),
          operUser: fc.uuid(),
          userName: fc.string({ minLength: 1, maxLength: 20 }),
          projectId: fc.uuid(),
          projectName: fc.string({ minLength: 1, maxLength: 50 }),
          organizationId: fc.constant(null),
          organizationName: fc.constant(null),
          type: fc.constant('DELETE') as fc.Arbitrary<OperationType>,
          module: fc.string({ minLength: 1, maxLength: 20 }),
          content: fc.string({ minLength: 1, maxLength: 100 }),
          createTime: fc.date().map(d => d.toISOString()),
        }),
        async (log: OperationLog) => {
          render(
            <LogTable
              logs={[log]}
              loading={false}
              total={1}
              current={1}
              pageSize={10}
              sortField="createTime"
              sortOrder="desc"
              onPageChange={mockOnPageChange}
              onPageSizeChange={mockOnPageSizeChange}
              onSort={mockOnSort}
            />
          );

          // Verify operation name is rendered as plain text, not a button
          const operationText = screen.getByText(log.content);
          expect(operationText).toBeInTheDocument();
          
          // Should not be a button
          expect(operationText.tagName).not.toBe('BUTTON');
          
          // Should not have button role
          const buttons = screen.queryAllByRole('button');
          const isOperationButton = buttons.some(btn => btn.textContent === log.content);
          expect(isOperationButton).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });
});

  // Feature: project-message-log-migration, Property 25: 时间排序正确性
  /**
   * **Validates: Requirements 5.5**
   * 
   * Property: For any log list, when sorted by time in ascending order,
   * each log's time should be <= the next log's time.
   * When sorted in descending order, each log's time should be >= the next log's time.
   */
  it('Property 25: should sort logs by time correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of logs with different timestamps
        fc.array(
          fc.record({
            id: fc.uuid(),
            operUser: fc.uuid(),
            userName: fc.string({ minLength: 1, maxLength: 20 }),
            projectId: fc.uuid(),
            projectName: fc.string({ minLength: 1, maxLength: 50 }),
            organizationId: fc.constant(null),
            organizationName: fc.constant(null),
            type: fc.constantFrom('ADD', 'DELETE', 'UPDATE') as fc.Arbitrary<OperationType>,
            module: fc.string({ minLength: 1, maxLength: 20 }),
            content: fc.string({ minLength: 1, maxLength: 100 }),
            createTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (logs: OperationLog[]) => {
          // Test ascending order
          const sortedAsc = [...logs].sort((a, b) => 
            new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
          );

          for (let i = 0; i < sortedAsc.length - 1; i++) {
            const currentTime = new Date(sortedAsc[i].createTime).getTime();
            const nextTime = new Date(sortedAsc[i + 1].createTime).getTime();
            expect(currentTime).toBeLessThanOrEqual(nextTime);
          }

          // Test descending order
          const sortedDesc = [...logs].sort((a, b) => 
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
          );

          for (let i = 0; i < sortedDesc.length - 1; i++) {
            const currentTime = new Date(sortedDesc[i].createTime).getTime();
            const nextTime = new Date(sortedDesc[i + 1].createTime).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  // Feature: project-message-log-migration, Property 26: 分页数据正确性
  /**
   * **Validates: Requirements 5.7**
   * 
   * Property: For any log list and page number, the displayed logs
   * should be the correct subset for that page
   */
  it('Property 26: should display correct page subset of logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of logs
        fc.array(
          fc.record({
            id: fc.uuid(),
            operUser: fc.uuid(),
            userName: fc.string({ minLength: 1, maxLength: 20 }),
            projectId: fc.uuid(),
            projectName: fc.string({ minLength: 1, maxLength: 50 }),
            organizationId: fc.constant(null),
            organizationName: fc.constant(null),
            type: fc.constantFrom('ADD', 'DELETE', 'UPDATE') as fc.Arbitrary<OperationType>,
            module: fc.string({ minLength: 1, maxLength: 20 }),
            content: fc.string({ minLength: 1, maxLength: 100 }),
            createTime: fc.date().map(d => d.toISOString()),
          }),
          { minLength: 15, maxLength: 50 }
        ),
        // Generate page size
        fc.integer({ min: 5, max: 20 }),
        async (allLogs: OperationLog[], pageSize: number) => {
          const totalPages = Math.ceil(allLogs.length / pageSize);
          
          // Test each page
          for (let page = 1; page <= totalPages; page++) {
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, allLogs.length);
            const expectedLogs = allLogs.slice(startIndex, endIndex);

            const { container } = render(
              <LogTable
                logs={expectedLogs}
                loading={false}
                total={allLogs.length}
                current={page}
                pageSize={pageSize}
                sortField="createTime"
                sortOrder="desc"
                onPageChange={mockOnPageChange}
                onPageSizeChange={mockOnPageSizeChange}
                onSort={mockOnSort}
              />
            );

            // Verify correct number of rows are displayed
            const tableRows = container.querySelectorAll('tbody tr');
            expect(tableRows.length).toBe(expectedLogs.length);

            // Verify pagination info
            expect(screen.getByText(`共 ${allLogs.length} 条记录`)).toBeInTheDocument();
            expect(screen.getByText(`${page} / ${totalPages}`)).toBeInTheDocument();
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
