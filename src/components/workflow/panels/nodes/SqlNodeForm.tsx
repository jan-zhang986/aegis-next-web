import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Plus, Trash2, Code2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { InlineAssertionRules } from '../shared/InlineAssertionRules';
import { InlineExtractionRules } from '../shared/InlineExtractionRules';
import { Button } from '@/components/ui/button';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import { CodeEditorDialog } from '../shared/CodeEditorDialog';
import type { SqlConfig } from '../../types';

interface SqlNodeFormProps {
  config: SqlConfig;
  onChange: (config: SqlConfig) => void;
  projectId?: string;
}

export const SqlNodeForm: React.FC<SqlNodeFormProps> = ({ config, onChange, projectId }) => {
  const [paramsInput, setParamsInput] = useState<string>('');
  const [paramsHelpExpanded, setParamsHelpExpanded] = useState<boolean>(false);
  const [isSqlEditorOpen, setIsSqlEditorOpen] = useState(false);
  const [tempSqlCode, setTempSqlCode] = useState('');
  const [editingSqlIndex, setEditingSqlIndex] = useState<number>(0);

  // SQL节点固定的字段及其对应的中文标签
  const sqlFieldsWithLabels = [
    { key: 'host', label: '主机' },
    { key: 'port', label: '端口' },
    { key: 'database', label: '库名' },
    { key: 'user', label: '账号' },
    { key: 'password', label: '密码' },
  ];

  // 使用 useRef 保存最新的 onChange 引用
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初始化 connection 字段值（首次创建时设置变量占位符）
  useEffect(() => {
    const currentConnection = config.connection || {};
    
    // 检查字段是否为空，如果为空则设置变量占位符
    const newConnection: any = { ...currentConnection };
    let needUpdate = false;

    // 如果字段为空，则设置为变量占位符
    if (!currentConnection.host) {
      newConnection.host = '${data_host}';
      needUpdate = true;
    }
    if (!currentConnection.port) {
      newConnection.port = '${data_port}';
      needUpdate = true;
    }
    // database 字段不需要变量占位符，用户直接输入数据库名
    if (!currentConnection.user) {
      newConnection.user = '${data_user}';
      needUpdate = true;
    }
    if (!currentConnection.password) {
      newConnection.password = '${data_password}';
      needUpdate = true;
    }

    if (needUpdate) {
      onChangeRef.current({ ...config, connection: newConnection });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConfig = (updates: Partial<SqlConfig>) => {
    onChange({ ...config, ...updates });
  };

  // 更新 connection 字段
  const updateConnection = (field: string, value: string) => {
    const connection = config.connection || {};
    updateConfig({ connection: { ...connection, [field]: value } });
  };

  // 初始化 params 输入框
  useEffect(() => {
    const params = config.params;
    if (Array.isArray(params)) {
      try {
        setParamsInput(JSON.stringify(params, null, 2));
      } catch (e) {
        setParamsInput('');
      }
    } else if (params && typeof params === 'object') {
      try {
        setParamsInput(JSON.stringify(params, null, 2));
      } catch (e) {
        setParamsInput('');
      }
    } else {
      setParamsInput('');
    }
  }, [config.params]);

  // 处理参数输入变化
  const handleParamsChange = (value: string) => {
    setParamsInput(value);
    
    if (!value.trim()) {
      // 如果为空，移除 params 字段
      const { params, ...restConfig } = config;
      onChange(restConfig);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      // 只接受数组格式
      if (Array.isArray(parsed)) {
        updateConfig({ params: parsed });
      } else {
        // 如果不是数组或对象，尝试转换为数组
        updateConfig({ params: [parsed] });
      }
    } catch (e) {
      // JSON 解析失败，不更新配置，但保留输入内容
    }
  };

  /**
   * 前端限制：
   * - SELECT：只允许 1 条 SQL，存储在 sql 字段
   * - INSERT/UPDATE/DELETE/EXECUTE：允许多条，存储在 sql_list 字段
   */
  const supportsMultipleSql = config.operation !== 'select';
  const isSelectMode = config.operation === 'select';

  // 根据操作类型获取 SQL 列表
  const getSqlList = (): string[] => {
    if (isSelectMode) {
      // SELECT 模式：从 sql 字段读取
      return config.sql ? [config.sql] : [''];
    } else {
      // 非 SELECT 模式：从 sql_list 字段读取
      if (config.sql_list && config.sql_list.length > 0) {
        return [...config.sql_list];
      }
      return [''];
    }
  };

  // 操作类型切换时，迁移数据并清空另一个字段
  useEffect(() => {
    const currentOp = config.operation || 'select';
    
    if (currentOp === 'select') {
      // 切换到 SELECT：从 sql_list 迁移到 sql，清空 sql_list
      if (config.sql_list && config.sql_list.length > 0) {
        const firstSql = config.sql_list[0] || '';
        const newConfig: SqlConfig = { ...config };
        newConfig.sql = firstSql;
        delete newConfig.sql_list;
        onChangeRef.current(newConfig);
      } else if (config.sql_list && (!config.sql_list.length || config.sql_list.every(s => !s.trim()))) {
        // 如果 sql_list 存在但为空，清空它
        const { sql_list, ...restConfig } = config;
        onChangeRef.current(restConfig);
      }
    } else {
      // 切换到非 SELECT：从 sql 迁移到 sql_list，清空 sql
      if (config.sql) {
        const newConfig: SqlConfig = { ...config };
        newConfig.sql_list = [config.sql];
        delete newConfig.sql;
        onChangeRef.current(newConfig);
      } else if (!config.sql_list) {
        // 如果 sql 和 sql_list 都不存在，初始化空的 sql_list
        const newConfig: SqlConfig = { ...config };
        newConfig.sql_list = [''];
        delete newConfig.sql;
        onChangeRef.current(newConfig);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.operation]);

  // 更新某条 SQL
  const handleSqlChange = (index: number, value: string) => {
    const newConfig: SqlConfig = { ...config };
    
    if (isSelectMode) {
      // SELECT 模式：只更新 sql 字段，清空 sql_list
      if (value.trim()) {
        newConfig.sql = value;
        delete newConfig.sql_list;
      } else {
        delete newConfig.sql;
        delete newConfig.sql_list;
      }
    } else {
      // 非 SELECT 模式：只更新 sql_list 字段，清空 sql
      const list = getSqlList();
      list[index] = value;
      const nonEmpty = list.filter(s => s.trim());
      
      if (nonEmpty.length === 0) {
        delete newConfig.sql_list;
        delete newConfig.sql;
      } else {
        newConfig.sql_list = list;
        delete newConfig.sql;
      }
    }
    
    onChange(newConfig);
  };

  // 新增一条 SQL 输入框（仅非 SELECT 模式）
  const handleAddSql = () => {
    if (isSelectMode) return; // SELECT 模式不支持多条
    
    const list = getSqlList();
    list.push('');
    const newConfig: SqlConfig = { ...config };
    newConfig.sql_list = list;
    delete newConfig.sql; // 确保清空 sql 字段
    onChange(newConfig);
  };

  // 删除某条 SQL（仅非 SELECT 模式）
  const handleRemoveSql = (index: number) => {
    if (isSelectMode) return; // SELECT 模式不支持删除
    
    const list = getSqlList();
    list.splice(index, 1);
    const newConfig: SqlConfig = { ...config };
    
    if (list.length === 0) {
      delete newConfig.sql_list;
      delete newConfig.sql;
    } else {
      newConfig.sql_list = list;
      delete newConfig.sql; // 确保清空 sql 字段
    }
    
    onChange(newConfig);
  };

  const sqlList = getSqlList();

  const handleOpenSqlEditor = (index: number) => {
    setEditingSqlIndex(index);
    setTempSqlCode(sqlList[index] ?? '');
    setIsSqlEditorOpen(true);
  };

  const handleSaveSqlCode = () => {
    handleSqlChange(editingSqlIndex, tempSqlCode);
    setIsSqlEditorOpen(false);
  };

  return (
    <div className="space-y-0">
      <Section title="SQL 配置">
        <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium text-gray-700">操作类型</FormLabel>
            <Select
              value={config.operation || 'select'}
              onValueChange={(value) => {
                const op = value as SqlConfig['operation'];
                const newConfig: SqlConfig = { ...config, operation: op };
                
                if (op === 'select') {
                  // 切换到 SELECT：从 sql_list 迁移到 sql，清空 sql_list
                  const firstSql = config.sql_list?.[0] ?? config.sql ?? '';
                  newConfig.sql = firstSql;
                  delete newConfig.sql_list;
                } else {
                  // 切换到非 SELECT：从 sql 迁移到 sql_list，清空 sql
                  const sqlValue = config.sql ?? '';
                  newConfig.sql_list = sqlValue ? [sqlValue] : [''];
                  delete newConfig.sql;
                }
                
                onChange(newConfig);
              }}
            >
              <SelectTrigger className="h-9 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">SELECT</SelectItem>
                <SelectItem value="insert">INSERT</SelectItem>
                <SelectItem value="update">UPDATE</SelectItem>
                <SelectItem value="delete">DELETE</SelectItem>
                <SelectItem value="execute">EXECUTE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.operation === 'select' && (
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium text-gray-700">查询类型</FormLabel>
              <Select
                value={config.query_type || 'fetchmany'}
                onValueChange={(value) => updateConfig({ query_type: value as SqlConfig['query_type'] })}
              >
                <SelectTrigger className="h-9 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fetchall">fetchall - 返回所有记录</SelectItem>
                  <SelectItem value="fetchone">fetchone - 返回单条记录</SelectItem>
                  <SelectItem value="fetchmany">fetchmany - 返回多条记录</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                fetchall: 返回所有查询结果；fetchone: 返回单条记录；fetchmany: 返回多条记录（默认10条）
              </p>
            </div>
          )}
          <div className="space-y-3">
            <FormLabel required className="text-sm font-medium text-gray-700">SQL 语句</FormLabel>
            <p className="text-xs text-gray-500">
              {supportsMultipleSql ? '每个输入框支持填写一条 SQL 语句（INSERT/UPDATE/DELETE/EXECUTE 支持多条）' : 'SELECT 模式仅支持填写一条 SQL 语句'}
            </p>
            {sqlList.map((sql, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  {supportsMultipleSql && index > 0 ? (
                    <span className="text-xs text-gray-500">SQL #{index + 1}</span>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSqlEditor(index)}
                      className="h-8 text-xs"
                    >
                      <Code2 className="w-3 h-3 mr-1.5" />
                      在弹窗中编辑
                    </Button>
                    {supportsMultipleSql && index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSql(index)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="删除该条 SQL"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    placeholder="SELECT * FROM users WHERE id = ?"
                    value={sql}
                    onChange={(e) => handleSqlChange(index, e.target.value)}
                    className={cn("min-h-[120px]", TEXTAREA_STYLE)}
                  />
                </div>
              </div>
            ))}
            {supportsMultipleSql && (
              <>
                <button
                  type="button"
                  onClick={handleAddSql}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-dashed border-blue-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增 SQL
                </button>
                {sqlList.length > 1 && (
                  <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                    共 {sqlList.length} 条 SQL 语句，将按顺序批量执行
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Section>

      {/* SQL 编辑器弹窗 */}
      <CodeEditorDialog
        open={isSqlEditorOpen}
        onOpenChange={setIsSqlEditorOpen}
        value={tempSqlCode}
        onChange={setTempSqlCode}
        language="sql"
        title="编辑 SQL 语句"
        placeholder="SELECT * FROM users WHERE id = ?"
        onSave={handleSaveSqlCode}
      />

      <Section title="数据库连接" defaultOpen={true} required>
        <div className="space-y-3">
          {sqlFieldsWithLabels.map(({ key, label }) => {
            const connection = config.connection || {};
            const value = connection[key as keyof typeof connection] || '';
            
            return (
              <div key={key} className="grid grid-cols-[80px_1fr] gap-3 items-center">
                <span className="text-sm text-gray-600 whitespace-nowrap">{label}:</span>
                <Input
                  type="text"
                  placeholder={key === 'port' ? '3306' : `请输入${label}`}
                  value={String(value)}
                  onChange={(e) => updateConnection(key, e.target.value)}
                  className={cn("w-full", INPUT_STYLE)}
                  autoComplete="off"
                />
              </div>
            );
          })}
          <p className="text-xs text-gray-500">
            直接填写连接信息，如需使用变量请填写 $host 或 ${'{host}'} 格式
          </p>
        </div>
      </Section>

      <Section title="参数绑定" defaultOpen={false}>
        <div className="space-y-3">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <button
              type="button"
              onClick={() => setParamsHelpExpanded(!paramsHelpExpanded)}
              className="w-full flex items-center justify-between font-medium mb-2 hover:text-gray-700 transition-colors"
            >
              <span>参数说明</span>
              {paramsHelpExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {paramsHelpExpanded && (
              <div className="space-y-2 mt-2">
                <div className="space-y-1">
                  <div>• 使用 <span className="text-blue-600 font-mono">%s</span> 作为占位符，参数按顺序传入（数组格式）</div>
                  <div className="ml-4 text-gray-600 font-mono bg-white p-2 rounded border">
                    SQL: <span className="text-blue-600">select * from users where id = %s and status = %s</span><br/>
                    参数: <span className="text-green-600">[123, "active"]</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>• 参数支持变量替换，可使用 <span className="text-blue-600 font-mono">{'${variable}'}</span> 格式</div>
                  <div className="ml-4 text-gray-600 font-mono bg-white p-2 rounded border">
                    参数: <span className="text-green-600">[{"${run_id}"}, "active"]</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium text-gray-700">参数（JSON格式）</FormLabel>
            <Textarea
              placeholder='例如: [123, "active"] 或 [{"${run_id}"}]'
              value={paramsInput}
              onChange={(e) => handleParamsChange(e.target.value)}
              onBlur={(e) => {
                // 失去焦点时验证JSON格式，必须是数组格式
                const value = e.target.value.trim();
                if (value) {
                  try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) {
                      // 如果不是数组，尝试转换为数组
                      handleParamsChange(JSON.stringify([parsed]));
                    }
                  } catch (e) {
                    // JSON格式错误，恢复为上次有效值
                    const params = config.params;
                    if (Array.isArray(params)) {
                      setParamsInput(JSON.stringify(params, null, 2));
                    } else {
                      setParamsInput('');
                    }
                  }
                }
              }}
              className={cn("min-h-[120px] font-mono text-sm", TEXTAREA_STYLE)}
            />
            <div className="text-xs text-gray-500">
              {(() => {
                if (!paramsInput.trim()) return '留空表示不使用参数绑定';
                try {
                  const parsed = JSON.parse(paramsInput);
                  if (Array.isArray(parsed)) {
                    return `✓ 数组格式，共 ${parsed.length} 个参数`;
                  } else if (typeof parsed === 'object' && parsed !== null) {
                    return `✓ 对象格式，共 ${Object.keys(parsed).length} 个参数`;
                  }
                } catch (e) {
                  return '⚠ JSON格式错误，请输入有效的JSON数组或对象';
                }
                return '';
              })()}
            </div>
          </div>
        </div>
      </Section>

      <Section title="断言" defaultOpen={false}>
        <InlineAssertionRules
          rules={config.assertion?.rules || []}
          onChange={(rules) => {
            // 如果 rules 为 null，清空 assertion 对象；否则设置 assertion
            if (rules === null) {
              // 直接传递完整的 config（不包含 assertion），绕过 updateConfig 的合并逻辑
              // 这样可以确保 assertion 被完全删除，不会被重新添加回去
              const { assertion, ...restConfig } = config;
              const newConfig = { ...restConfig } as SqlConfig;
              // 确保 assertion 被完全删除
              if ('assertion' in newConfig) {
                delete (newConfig as any).assertion;
              }
              onChange(newConfig);
            } else {
              updateConfig({ assertion: { rules } });
            }
          }}
        />
      </Section>

      <Section title="提取" defaultOpen={false}>
        <InlineExtractionRules
          extractions={config.extractions || []}
          onChange={(extractions) => updateConfig({ extractions })}
        />
      </Section>
    </div>
  );
};

