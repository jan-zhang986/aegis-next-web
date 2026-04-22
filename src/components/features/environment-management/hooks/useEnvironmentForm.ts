import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  environmentService,
  type Environment,
  type AddEnvironmentParams,
  type EnvCode,
  type DataEndpoint,
  type XxlJobInfo,
  type MqInfo,
  type DubboInfo,
} from '@/services/environment';
import { FIXED_VARIABLE_KEYS } from '../constants';
import { parseVariablesForSave, envVariablesToKeyValueList } from '../utils/parseVariables';

const emptyForm = (projectId: string): AddEnvironmentParams => ({
  projectId,
  name: '',
  engineType: 'API',
  envCode: 'TST',
  domain: '',
  robots: {},
  dataEndpoint: undefined,
  variables: {},
  xxljobInfo: undefined,
  mqInfo: undefined,
  dubboInfo: undefined,
});

export function useEnvironmentForm(
  projectId: string | null,
  projectName: string,
  loadEnvironments: (override?: string) => void
) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);

  const [formData, setFormData] = useState<AddEnvironmentParams>(() => emptyForm(projectId || ''));
  const [variablesList, setVariablesList] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [editableVariableKeys, setEditableVariableKeys] = useState<Set<number>>(new Set());
  const [jsonFieldsRaw, setJsonFieldsRaw] = useState({ robots: '{}', variables: '{}' });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    robots: false,
    dataEndpoint: false,
    variables: false,
    xxljobInfo: false,
    mqInfo: false,
    dubboInfo: false,
  });

  const updateJsonField = useCallback((field: 'robots' | 'variables', value: string) => {
    setJsonFieldsRaw((p) => ({ ...p, [field]: value }));
  }, []);

  const getJsonFieldValue = useCallback((field: 'robots' | 'variables') => jsonFieldsRaw[field] || '{}', [jsonFieldsRaw]);

  const updateDataEndpoint = useCallback((key: keyof DataEndpoint, value: string | number | undefined) => {
    setFormData((p) => ({
      ...p,
      dataEndpoint: { ...(p.dataEndpoint || {}), [key]: value } as DataEndpoint,
    }));
  }, []);

  const updateXxlJobInfo = useCallback((key: keyof XxlJobInfo, value: string) => {
    setFormData((p) => ({
      ...p,
      xxljobInfo: { ...(p.xxljobInfo || {}), [key]: value },
    }));
  }, []);

  const updateMqInfo = useCallback((key: keyof MqInfo, value: string) => {
    setFormData((p) => ({ ...p, mqInfo: { ...(p.mqInfo || { mq_url: '' }), [key]: value } }));
  }, []);

  const updateDubboInfo = useCallback((key: keyof DubboInfo, value: string) => {
    setFormData((p) => ({ ...p, dubboInfo: { ...(p.dubboInfo || { dubbo_url: '' }), [key]: value } }));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((p) => ({ ...p, [section]: !p[section] }));
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    const pid = projectId || formData.projectId;
    if (!pid) {
      toast.error('项目ID不存在，请先选择项目');
      return;
    }
    setVariablesList([{ key: '', value: '' }]);
    setFormData(emptyForm(pid));
    setJsonFieldsRaw({ robots: '{}', variables: '{}' });
    setShowAddDialog(true);
  }, [projectId, formData.projectId]);

  const handleOpenEditDialog = useCallback((env: Environment) => {
    setEditingEnvironment(env);
    setFormData({
      projectId: env.projectId,
      name: env.name,
      engineType: 'API',
      envCode: env.envCode,
      domain: env.domain || '',
      robots: env.robots || {},
      dataEndpoint: env.dataEndpoint,
      variables: env.variables || {},
      xxljobInfo: env.xxljobInfo,
      mqInfo: env.mqInfo,
      dubboInfo: env.dubboInfo,
    });
    setExpandedSections({
      robots: !!(env.robots && Object.keys(env.robots).length > 0),
      dataEndpoint: !!(env.dataEndpoint && Object.keys(env.dataEndpoint).length > 0),
      variables: !!(env.variables && Object.keys(env.variables).length > 0),
      xxljobInfo: !!(env.xxljobInfo && Object.keys(env.xxljobInfo).length > 0),
      mqInfo: !!(env.mqInfo && Object.keys(env.mqInfo).length > 0),
      dubboInfo: !!(env.dubboInfo && Object.keys(env.dubboInfo).length > 0),
    });
    setJsonFieldsRaw({
      robots: env.robots ? JSON.stringify(env.robots, null, 2) : '{}',
      variables: env.variables ? JSON.stringify(env.variables, null, 2) : '{}',
    });
    setVariablesList(envVariablesToKeyValueList(env.variables));
    setEditableVariableKeys(new Set());
    setShowEditDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('请输入环境名称');
      return;
    }
    if (!formData.domain.trim()) {
      toast.error('请输入域名');
      return;
    }
    if (!formData.xxljobInfo?.xxjob_url?.trim() || !formData.xxljobInfo?.xxljobuser?.trim() || !formData.xxljobInfo?.xxljobpassword?.trim()) {
      toast.error('请填写完整的 XXL-Job 配置信息');
      return;
    }
    if (!formData.mqInfo?.mq_url?.trim()) {
      toast.error('请填写 MQ 配置信息');
      return;
    }
    const de = formData.dataEndpoint;
    if (!de?.data_host?.trim() || !de?.data_user?.trim() || !String(de?.data_password ?? '').trim() || (de?.data_port == null)) {
      toast.error('请填写完整的数据信息配置');
      return;
    }

    let parsedRobots: Record<string, unknown> = {};
    if (jsonFieldsRaw.robots.trim()) {
      try {
        parsedRobots = JSON.parse(jsonFieldsRaw.robots);
      } catch {
        toast.error('机器人配置 JSON 格式错误，请检查后重试');
        return;
      }
    }
    const parsedVariables = parseVariablesForSave(variablesList);

    try {
      if (editingEnvironment?.id) {
        await environmentService.updateEnvironment({
          id: editingEnvironment.id,
          ...formData,
          robots: parsedRobots,
          variables: parsedVariables,
        });
        toast.success('环境更新成功');
      } else {
        await environmentService.addEnvironment({ ...formData, robots: parsedRobots, variables: parsedVariables });
        toast.success('环境添加成功');
      }
      setShowAddDialog(false);
      setShowEditDialog(false);
      setEditingEnvironment(null);
      loadEnvironments();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || '保存环境失败，请稍后重试');
    }
  }, [formData, jsonFieldsRaw.robots, variablesList, editingEnvironment, loadEnvironments]);

  const closeForm = useCallback(() => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingEnvironment(null);
  }, []);

  return {
    showAddDialog,
    showEditDialog,
    setShowAddDialog,
    setShowEditDialog,
    editingEnvironment,
    handleOpenAddDialog,
    handleOpenEditDialog,
    closeForm,
    // form
    formData,
    setFormData,
    variablesList,
    setVariablesList,
    editableVariableKeys,
    setEditableVariableKeys,
    jsonFieldsRaw,
    updateJsonField,
    getJsonFieldValue,
    expandedSections,
    toggleSection,
    updateDataEndpoint,
    updateXxlJobInfo,
    updateMqInfo,
    updateDubboInfo,
    handleSave,
  };
}
