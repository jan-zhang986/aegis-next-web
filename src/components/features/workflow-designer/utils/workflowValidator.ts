/**
 * Workflow Validator 工具函数
 * 工作流验证相关的工具函数
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import type { WorkflowNodeData, ConnectionData } from '@/components/workflow';
import { NodeType, type HttpConfig, type SqlConfig, type DubboConfig, type XxlJobConfig, type MqConfig, type ConditionConfig, type ScriptConfig, type LoopConfig } from '@/components/workflow';

/**
 * 验证节点配置
 * 返回缺失的必填字段列表
 */
export function validateNodeConfig(node: WorkflowNodeData): string[] {
  const missingFields: string[] = [];
  const config = node.config || {};

  switch (node.type) {
    case NodeType.HTTP_REQUEST: {
      const httpConfig = config as HttpConfig;
      if (!httpConfig.url || httpConfig.url.trim() === '') {
        missingFields.push('URL');
      }
      break;
    }
    case NodeType.MYSQL: {
      const sqlConfig = config as SqlConfig;
      const hasSql =
        sqlConfig.sql && sqlConfig.sql.trim() !== '';
      const hasSqlList =
        sqlConfig.sql_list &&
        Array.isArray(sqlConfig.sql_list) &&
        sqlConfig.sql_list.length > 0 &&
        sqlConfig.sql_list.some((s) => s && s.trim() !== '');
      if (!hasSql && !hasSqlList) {
        missingFields.push('SQL 语句');
      }
      const connection = sqlConfig.connection || {};
      const hasEnvironmentId = (connection as any).environmentId;
      if (
        !hasEnvironmentId &&
        (!connection.host || (connection.host as string).trim() === '')
      ) {
        missingFields.push('数据库连接（请配置环境或填写连接信息）');
      }
      break;
    }
    case NodeType.DUBBO: {
      const dubboConfig = config as DubboConfig;
      if (!dubboConfig.url || dubboConfig.url.trim() === '') {
        missingFields.push('Dubbo URL');
      }
      if (
        !dubboConfig.interface_name ||
        dubboConfig.interface_name.trim() === ''
      ) {
        missingFields.push('接口名称');
      }
      if (
        !dubboConfig.method_name ||
        dubboConfig.method_name.trim() === ''
      ) {
        missingFields.push('方法名称');
      }
      break;
    }
    case NodeType.XXLJOB: {
      const xxljobConfig = config as XxlJobConfig;
      if (
        !xxljobConfig.executor_handler ||
        xxljobConfig.executor_handler.trim() === ''
      ) {
        missingFields.push('执行器处理器');
      }
      break;
    }
    case NodeType.ROCKETMQ: {
      const mqConfig = config as MqConfig;
      if (!mqConfig.topic || mqConfig.topic.trim() === '') {
        missingFields.push('Topic');
      }
      if (!mqConfig.message_body || mqConfig.message_body.trim() === '') {
        missingFields.push('消息内容');
      }
      const mqUrl = mqConfig.mq_url || '';
      if (!mqUrl || mqUrl.trim() === '') {
        missingFields.push('MQ地址');
      }
      break;
    }
    case NodeType.CONDITION: {
      const conditionConfig = config as ConditionConfig;
      if (!conditionConfig.expression || conditionConfig.expression.trim() === '') {
        missingFields.push('条件表达式');
      }
      break;
    }
    case NodeType.SCRIPT: {
      const scriptConfig = config as ScriptConfig;
      if (scriptConfig.type === 'function') {
        if (!scriptConfig.function_name || scriptConfig.function_name.trim() === '') {
          missingFields.push('函数名称');
        }
      } else {
        if (!scriptConfig.script || scriptConfig.script.trim() === '') {
          missingFields.push('脚本内容');
        }
      }
      break;
    }
    case NodeType.LOOP: {
      const loopConfig = config as LoopConfig;
      if (loopConfig.loop_type === 'count_loop') {
        if (!loopConfig.count) {
          missingFields.push('循环次数');
        }
      } else if (loopConfig.loop_type === 'while_loop') {
        if (!loopConfig.condition || loopConfig.condition.trim() === '') {
          missingFields.push('循环条件');
        }
      } else if (loopConfig.loop_type === 'foreach_loop') {
        if (!loopConfig.items || (Array.isArray(loopConfig.items) && loopConfig.items.length === 0)) {
          missingFields.push('遍历集合');
        }
      }
      break;
    }
    // 其他节点类型的验证...
  }

  return missingFields;
}

/**
 * 根据连接线进行拓扑排序，返回节点ID数组
 */
export function getTopologicalOrder(
  nodes: WorkflowNodeData[],
  connections: ConnectionData[]
): string[] {
  if (connections.length === 0) {
    // 如果没有连接，返回原始顺序
    return nodes.map((n) => n.id);
  }

  // 构建入边映射
  const incomingEdges = new Map<string, string[]>();
  connections.forEach((conn) => {
    if (!incomingEdges.has(conn.to)) {
      incomingEdges.set(conn.to, []);
    }
    incomingEdges.get(conn.to)!.push(conn.from);
  });

  // 找到起始节点（没有入边的节点）
  const startNodes = nodes.filter(
    (node) =>
      !incomingEdges.has(node.id) || incomingEdges.get(node.id)!.length === 0
  );

  // 拓扑排序
  const sortedIds: string[] = [];
  const visited = new Set<string>();
  const inDegree = new Map<string, number>();

  // 初始化入度
  nodes.forEach((node) => {
    inDegree.set(node.id, incomingEdges.get(node.id)?.length || 0);
  });

  // BFS 拓扑排序
  const queue: string[] = startNodes.map((n) => n.id);
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;

    visited.add(nodeId);
    sortedIds.push(nodeId);

    // 处理所有出边
    const targets = connections
      .filter((conn) => conn.from === nodeId)
      .map((conn) => conn.to);

    targets.forEach((targetId) => {
      const currentInDegree = inDegree.get(targetId) || 0;
      inDegree.set(targetId, currentInDegree - 1);
      if (currentInDegree - 1 === 0) {
        queue.push(targetId);
      }
    });
  }

  // 对于没有连接关系的节点，按照原始顺序添加到末尾
  const unconnectedNodes = nodes.filter(
    (node) => !sortedIds.includes(node.id)
  );

  unconnectedNodes.forEach((node) => {
    sortedIds.push(node.id);
  });

  return sortedIds;
}
