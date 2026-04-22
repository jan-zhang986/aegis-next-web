import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { isExpandable, getValueType, collectAllPaths } from '../utils/treeUtils';
import { getTypeBadgeColor } from '../utils/formatters';
import { parseSingleResponse, type ParsedResponse } from '../utils/responseParsers';

export interface ResponseDataResult {
  isMultiple: boolean;
  responses: ParsedResponse[];
  defaultResponse: ParsedResponse | null;
}

function buildResponseData(
  responseConfig: Record<string, unknown> | null,
  protocol: string
): ResponseDataResult | null {
  if (!responseConfig) return null;

  if (protocol === 'DUBBO') {
    let dubboResponseBody: unknown = null;
    const body = responseConfig.body;
    if (body) {
      if (Array.isArray(body) && body.length > 0) dubboResponseBody = body[0];
      else if (typeof body === 'object' && !Array.isArray(body)) dubboResponseBody = body;
    }
    const returnTypes = (responseConfig.parameterTypes as string[]) || [];
    const parsed: ParsedResponse = {
      statusCode: 200,
      contentType: 'application/json',
      isSuccess: true,
      body: dubboResponseBody || {},
      params: returnTypes.length > 0 ? [{ name: '返回类型', type: returnTypes.join(', '), required: true }] : [],
      description: 'DUBBO 接口响应',
    };
    return { isMultiple: false, responses: [parsed], defaultResponse: parsed };
  }

  const responses = responseConfig.responses as Record<string, unknown> | undefined;
  if (responses && typeof responses === 'object') {
    const list: ParsedResponse[] = [];
    Object.entries(responses).forEach(([code, def]) => {
      list.push(parseSingleResponse(def, code));
    });
    list.sort((a, b) => {
      if (a.isSuccess && !b.isSuccess) return -1;
      if (!a.isSuccess && b.isSuccess) return 1;
      return a.statusCode - b.statusCode;
    });
    return {
      isMultiple: true,
      responses: list,
      defaultResponse: list[0] || null,
    };
  }

  const statusCode = (responseConfig.statusCode ?? responseConfig.status ?? 200) as number;
  const parsed = parseSingleResponse(responseConfig, statusCode);
  return { isMultiple: false, responses: [parsed], defaultResponse: parsed };
}

export interface RenderTreeOptions {
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}

function renderTree(
  obj: unknown,
  path: string,
  level: number,
  { expandedPaths, onToggle }: RenderTreeOptions
): JSX.Element[] {
  if (!obj || typeof obj !== 'object') return [];

  const items: JSX.Element[] = [];

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const first = obj[0];
      const itemPath = path ? `${path}[0]` : '[0]';
      if (isExpandable(first)) {
        items.push(...renderTree(first, itemPath, level, { expandedPaths, onToggle }));
      }
    }
  } else {
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const itemPath = path ? `${path}.${key}` : key;
      const valueType = getValueType(value);
      const valueExpandable = isExpandable(value);
      const isExpanded = expandedPaths.has(itemPath);

      let showArrow = false;
      if (Array.isArray(value) && value.length > 0) {
        if (isExpandable(value[0])) showArrow = true;
      } else if (valueExpandable && !Array.isArray(value)) {
        showArrow = true;
      }

      items.push(
        <div
          key={itemPath}
          className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
          style={{ marginLeft: `${level * 16}px` }}
        >
          {showArrow ? (
            <span
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => onToggle(itemPath)}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
          ) : (
            <span className="w-3 h-3 inline-block" />
          )}
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium min-w-[100px]">
            {key}
          </span>
          <span className="text-xs text-gray-600">{valueType}</span>
          <div className="flex-1" />
          <span className="text-xs text-orange-600 font-medium">必需</span>
        </div>
      );

      if (valueExpandable && isExpanded) {
        items.push(...renderTree(value, itemPath, level + 1, { expandedPaths, onToggle }));
      }
    });
  }

  return items;
}

export function useApiDataRenderer(
  requestConfig: Record<string, unknown> | null,
  responseConfig: Record<string, unknown> | null,
  protocol: string,
  selectedResponseIndex: number
) {
  const [expandedBodyPaths, setExpandedBodyPaths] = useState<Set<string>>(new Set());
  const [expandedResponsePaths, setExpandedResponsePaths] = useState<Set<string>>(new Set());

  const responseData = useMemo(
    () => buildResponseData(responseConfig, protocol),
    [responseConfig, protocol]
  );

  const toggleBodyExpand = useCallback((path: string) => {
    setExpandedBodyPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleResponseExpand = useCallback((path: string) => {
    setExpandedResponsePaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Init expandedBodyPaths from requestConfig
  useEffect(() => {
    if (protocol === 'HTTP' && requestConfig?.body) {
      let body = requestConfig.body;
      if (typeof body === 'string' && (body as string).trim()) {
        try {
          body = JSON.parse(body as string);
        } catch {
          setExpandedBodyPaths(new Set());
          return;
        }
      }
      if (typeof body === 'object' && body !== null) {
        setExpandedBodyPaths(collectAllPaths(body));
      } else {
        setExpandedBodyPaths(new Set());
      }
    } else if (
      protocol === 'DUBBO' &&
      requestConfig?.params &&
      Array.isArray(requestConfig.params) &&
      requestConfig.params.length > 0
    ) {
      const first = requestConfig.params[0];
      if (first && typeof first === 'object') {
        setExpandedBodyPaths(collectAllPaths(first));
      } else {
        setExpandedBodyPaths(new Set());
      }
    } else {
      setExpandedBodyPaths(new Set());
    }
  }, [requestConfig?.body, requestConfig?.params, protocol]);

  // Init expandedResponsePaths from responseData
  useEffect(() => {
    if (responseData) {
      const curr =
        responseData.responses[selectedResponseIndex] ?? responseData.defaultResponse;
      if (curr?.body && typeof curr.body === 'object') {
        setExpandedResponsePaths(collectAllPaths(curr.body));
      } else {
        setExpandedResponsePaths(new Set());
      }
    }
  }, [responseData, selectedResponseIndex]);

  const renderBodyTree = useCallback(
    (obj: unknown, p = '', level = 0) =>
      renderTree(obj, p, level, { expandedPaths: expandedBodyPaths, onToggle: toggleBodyExpand }),
    [expandedBodyPaths, toggleBodyExpand]
  );

  const renderResponseTree = useCallback(
    (obj: unknown, p = '', level = 0) =>
      renderTree(obj, p, level, { expandedPaths: expandedResponsePaths, onToggle: toggleResponseExpand }),
    [expandedResponsePaths, toggleResponseExpand]
  );

  return {
    expandedBodyPaths,
    expandedResponsePaths,
    toggleBodyExpand,
    toggleResponseExpand,
    renderBodyTree,
    renderResponseTree,
    getTypeBadgeColor,
    responseData,
  };
}
