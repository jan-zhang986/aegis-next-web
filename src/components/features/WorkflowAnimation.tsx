/**
 * 工作流编排图动画组件
 * 用于登录页面背景装饰 - 使用 workflow 卡片样式
 */
import React from 'react';
import { Globe, Database, Code, GitBranch, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import './WorkflowAnimation.css';

interface Node {
  id: string;
  name: string;
  type: 'http' | 'condition' | 'sql' | 'script' | 'assertion';
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  description: string;
  x: number;
  y: number;
  width?: number; // 可选的自定义宽度
  height?: number; // 可选的自定义高度
}

interface Connection {
  from: string;
  to: string;
}

export function WorkflowAnimation() {
  // 节点卡片尺寸（需要在节点定义之前定义）
  const NODE_HEIGHT = 80;
  const NODE_WIDTH = 200;
  const CARD_SPACING = 50; // 卡片间距（上下50px，左右30px）
  const CARD_HORIZONTAL_SPACING = 30; // 水平间距30px
  
  // 定义节点（使用 workflow 卡片样式，每个卡片上下间距50px，左右间距30px）
  // 垂直间距 = 节点高度(80px) + 间距(50px) = 130px
  // 水平分支间距 = 节点宽度(200px) + 间距(30px) = 230px，所以左右各115px
  // 起始位置向下偏移 15px，避免顶到容器顶部
  const START_OFFSET_Y = 15;
  const nodes: Node[] = [
    { 
      id: '2', 
      name: 'HTTP请求', 
      type: 'http', 
      color: '#3B82F6', 
      icon: Globe,
      description: '发送HTTP请求',
      x: 0,
      y: START_OFFSET_Y,
      width: 170, // 缩小到170px（从200px减少30px）
      height: 80,
    },
    { 
      id: '3', 
      name: '条件判断', 
      type: 'condition', 
      color: '#8B5CF6', 
      icon: GitBranch,
      description: '判断条件',
      x: 0,
      y: START_OFFSET_Y + NODE_HEIGHT + CARD_SPACING,
      width: 170, // 缩小到170px（从200px减少30px）
      height: 80,
    },
    { 
      id: '4', 
      name: 'SQL查询', 
      type: 'sql', 
      color: '#F59E0B', 
      icon: Database,
      description: '执行SQL',
      x: -(NODE_WIDTH / 2 + CARD_HORIZONTAL_SPACING) + 30,
      y: START_OFFSET_Y + (NODE_HEIGHT + CARD_SPACING) * 2,
      width: 150, // 缩小到150px（从180px减少30px）
      height: 70, // 缩小到70px
    },
    { 
      id: '5', 
      name: '脚本执行', 
      type: 'script', 
      color: '#EF4444', 
      icon: Code,
      description: '执行脚本',
      x: NODE_WIDTH / 2 + CARD_HORIZONTAL_SPACING,
      y: START_OFFSET_Y + (NODE_HEIGHT + CARD_SPACING) * 2,
      width: 150, // 缩小到150px（从180px减少30px）
      height: 70, // 缩小到70px
    },
    { 
      id: '6', 
      name: '断言', 
      type: 'assertion', 
      color: '#10B981', 
      icon: CheckCircle2,
      description: '断言验证',
      x: 0,
      y: START_OFFSET_Y + (NODE_HEIGHT + CARD_SPACING) * 3,
      width: 170, // 缩小到170px（从200px减少30px）
      height: 80,
    },
  ];

  const connections: Connection[] = [
    { from: '2', to: '3' },
    { from: '3', to: '4' },
    { from: '3', to: '5' },
    { from: '4', to: '6' },
    { from: '5', to: '6' },
  ];

  // 连接点位置：连接点使用 -top-1 和 -bottom-1，即距离边缘 4px（1 * 4px = 4px）
  // 连接点大小是 w-2 h-2，即 8px，所以连接点中心距离节点边缘是 4px
  const CONNECTION_POINT_OFFSET = 4; // 连接点中心距离节点边缘的距离（-top-1 = 4px）
  const CONTAINER_CENTER_X = 100; // 节点容器宽度200px，中心是100px
  
  // 计算连接线路径（使用 SVG 路径）
  const calculatePath = (from: Node, to: Node): string => {
    // 获取节点的实际尺寸（如果有自定义尺寸则使用，否则使用默认尺寸）
    const fromWidth = from.width || NODE_WIDTH;
    const fromHeight = from.height || NODE_HEIGHT;
    const toWidth = to.width || NODE_WIDTH;
    const toHeight = to.height || NODE_HEIGHT;
    
    // 节点在容器中的实际中心 X 坐标（节点使用 translateX(-50%) 居中）
    // 节点位置是 left: node.x + 100，所以中心是 node.x + 100
    const fromCenterX = CONTAINER_CENTER_X + from.x;
    const toCenterX = CONTAINER_CENTER_X + to.x;
    
    // 输出连接点：从节点的底部中心（输出连接点在 -bottom-1.5，即节点底部下方6px）
    // 连接点中心位置 = 节点顶部 + 节点高度 + 连接点偏移
    const startX = fromCenterX;
    const startY = from.y + fromHeight + CONNECTION_POINT_OFFSET;
    
    // 输入连接点：到节点的顶部中心（输入连接点在 -top-1.5，即节点顶部上方6px）
    // 连接点中心位置 = 节点顶部 - 连接点偏移
    const endX = toCenterX;
    const endY = to.y - CONNECTION_POINT_OFFSET;
    
    // 使用平滑的贝塞尔曲线连接所有节点，让连接线更自然
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // 计算控制点偏移量，使曲线更平滑自然
    // 水平偏移：如果有水平移动，控制点也相应偏移
    const horizontalOffset = Math.abs(deltaX) * 0.5;
    const verticalOffset = Math.max(Math.abs(deltaY) * 0.4, 30);
    
    // 第一个控制点：从起点向下偏移，如果有水平移动则向目标方向偏移
    const cp1X = startX + (deltaX > 0 ? horizontalOffset : (deltaX < 0 ? -horizontalOffset : 0));
    const cp1Y = startY + verticalOffset;
    
    // 第二个控制点：向终点向上偏移，如果有水平移动则从起点方向偏移
    const cp2X = endX - (deltaX > 0 ? horizontalOffset : (deltaX < 0 ? -horizontalOffset : 0));
    const cp2Y = endY - verticalOffset;
    
    // 使用三次贝塞尔曲线创建平滑的连接
    return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
  };

  return (
    <div className="workflow-animation-container relative w-full h-full flex items-center justify-center">
      {/* 节点卡片层 */}
      <div className="relative" style={{ width: '460px', minHeight: '560px', paddingTop: '15px' }}>
        {/* SVG 连接线层 - 放在节点容器内，确保坐标系一致 */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible', width: '320px', height: '100%' }}
        >
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6">
              <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6">
              <animate attributeName="stop-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </stop>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 绘制连接线 */}
        {connections.map((conn, index) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          const path = calculatePath(fromNode, toNode);
          
          // 计算路径长度（使用路径的实际长度）
          // 对于贝塞尔曲线，需要考虑垂直和水平距离，以及曲线的额外长度
          const deltaX = Math.abs(toNode.x - fromNode.x);
          const deltaY = Math.abs(toNode.y - fromNode.y);
          // 使用勾股定理计算直线距离，然后增加30%来补偿贝塞尔曲线的额外长度
          const straightDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const pathLength = straightDistance * 1.3;
          
          // 按照从上到下的顺序设置动画延迟，确保流动效果连贯
          // 连接顺序：2->3 (0s), 3->4 (0.8s), 3->5 (0.8s), 4->6 (1.6s), 5->6 (1.6s)
          let animationDelay = 0;
          if (conn.from === '2' && conn.to === '3') {
            animationDelay = 0; // 第一个连接，立即开始
          } else if (conn.from === '3' && conn.to === '4') {
            animationDelay = 0.8; // 第二个连接，等待第一个完成
          } else if (conn.from === '3' && conn.to === '5') {
            animationDelay = 0.8; // 第二个连接（并行），等待第一个完成
          } else if (conn.from === '4' && conn.to === '6') {
            animationDelay = 1.6; // 第三个连接，等待第二个完成
          } else if (conn.from === '5' && conn.to === '6') {
            animationDelay = 1.6; // 第三个连接（并行），等待第二个完成
          }
          
          // 动画持续时间基于路径长度，确保流动速度一致
          const animationDuration = 2 + pathLength / 50; // 基础2秒 + 根据路径长度调整

          return (
            <g key={`conn-${conn.from}-${conn.to}`}>
              {/* 背景路径（静态） */}
              <path
                d={path}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="2"
                opacity="0.4"
              />
              {/* 流动路径（动画） */}
              <path
                d={path}
                fill="none"
                stroke="url(#flowGradient)"
                strokeWidth="3"
                className="flow-path"
                style={{
                  filter: 'url(#glow)',
                  opacity: 0.8,
                  strokeDasharray: `${pathLength} ${pathLength}`,
                  strokeDashoffset: pathLength,
                  animation: `flow ${animationDuration}s linear infinite`,
                  animationDelay: `${animationDelay}s`,
                }}
              />
            </g>
          );
        })}
        </svg>
        {nodes.map((node, index) => {
          const IconComponent = node.icon;
          // 获取节点的实际尺寸（如果有自定义尺寸则使用，否则使用默认尺寸）
          const nodeWidth = node.width || NODE_WIDTH;
          const nodeHeight = node.height || NODE_HEIGHT;
          
          return (
            <div
              key={node.id}
              className={cn(
                "workflow-animation-node absolute bg-white rounded-lg shadow-md border-2 transition-all duration-300",
                "workflow-node-float"
              )}
              style={{
                borderColor: node.color,
                backgroundColor: `${node.color}08`,
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
                left: `${node.x + CONTAINER_CENTER_X}px`,
                top: `${node.y}px`,
                transform: 'translateX(-50%)',
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* 输入连接点 */}
              <div 
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm z-10"
              />

              {/* 节点头部 */}
              <div 
                className="flex items-center justify-between border-b border-gray-100"
                style={{ 
                  backgroundColor: `${node.color}15`,
                  padding: nodeWidth < NODE_WIDTH ? '0px 8px 4px 8px' : '0px 12px 6px 12px',
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div 
                    className="rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: node.color,
                      width: nodeWidth < NODE_WIDTH ? '20px' : '24px',
                      height: nodeWidth < NODE_WIDTH ? '20px' : '24px',
                    }}
                  >
                    <IconComponent 
                      className="text-white flex-shrink-0"
                      style={{ 
                        width: nodeWidth < NODE_WIDTH ? '12px' : '14px',
                        height: nodeWidth < NODE_WIDTH ? '12px' : '14px',
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div 
                      className="font-medium text-gray-900 truncate"
                      style={{ fontSize: nodeWidth < NODE_WIDTH ? '11px' : '12px' }}
                    >
                      {node.name}
                    </div>
                    <div 
                      className="text-gray-500 truncate"
                      style={{ fontSize: nodeWidth < NODE_WIDTH ? '9px' : '10px' }}
                    >
                      {node.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* 节点内容预览 */}
              <div style={{ padding: nodeWidth < NODE_WIDTH ? '6px' : '8px 12px' }}>
                <div 
                  className="text-gray-500 bg-gray-50 rounded border border-gray-200 truncate"
                  style={{ 
                    fontSize: nodeWidth < NODE_WIDTH ? '9px' : '10px',
                    padding: nodeWidth < NODE_WIDTH ? '4px 6px' : '4px 8px',
                  }}
                >
                  {node.type === 'http' && 'GET /api/users'}
                  {node.type === 'condition' && 'status === 200'}
                  {node.type === 'sql' && 'SELECT * FROM users'}
                  {node.type === 'script' && 'console.log(data)'}
                  {node.type === 'assertion' && 'status === 200'}
                </div>
              </div>

              {/* 输出连接点 */}
              {node.type !== 'assertion' && (
                <div 
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm z-10"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
