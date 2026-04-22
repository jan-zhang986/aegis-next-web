import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mockFactoryService, type MockScene } from '@/services/mock-factory';

export function useMockScenes() {
  const [mockScenes, setMockScenes] = useState<MockScene[]>([]);
  const [selectedSceneCode, setSelectedSceneCode] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [scenePopoverOpen, setScenePopoverOpen] = useState(false);
  const [sceneSearchValue, setSceneSearchValue] = useState('');
  const [isSceneDialogOpen, setIsSceneDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<MockScene | null>(null);
  const [sceneName, setSceneName] = useState('');

  const loadScenes = useCallback(async () => {
    try {
      const scenes = await mockFactoryService.queryMockScene();
      setMockScenes(scenes);
      if (scenes.length > 0 && !selectedSceneCode) {
        setSelectedSceneCode(scenes[0].sceneCode);
      }
      return scenes;
    } catch (error: any) {
      toast.error('加载场景列表失败: ' + (error.message || '未知错误'));
      return [];
    }
  }, [selectedSceneCode, setSelectedSceneCode]);

  const handleCreateScene = useCallback(() => {
    setEditingScene(null);
    setSceneName('');
    setIsSceneDialogOpen(true);
  }, []);

  const handleEditScene = useCallback((scene: MockScene) => {
    setEditingScene(scene);
    setSceneName(scene.sceneName);
    setIsSceneDialogOpen(true);
  }, []);

  const handleSaveScene = useCallback(async () => {
    if (!sceneName.trim()) {
      toast.error('请输入场景名称');
      return;
    }
    try {
      if (editingScene?.id) {
        await mockFactoryService.editMockScene(editingScene.id, sceneName);
        toast.success('更新成功');
      } else {
        await mockFactoryService.addMockScene(sceneName);
        toast.success('创建成功');
      }
      setIsSceneDialogOpen(false);
      await loadScenes();
    } catch (error: any) {
      toast.error('保存失败: ' + (error.message || '未知错误'));
    }
  }, [sceneName, editingScene, loadScenes]);

  useEffect(() => {
    loadScenes();
  }, [loadScenes]);

  // 过滤场景（根据搜索关键词）
  const filteredScenes = mockScenes.filter(scene => 
    !searchKeyword.trim() || 
    scene.sceneName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    scene.sceneCode.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return {
    mockScenes,
    setMockScenes,
    selectedSceneCode,
    setSelectedSceneCode,
    searchKeyword,
    setSearchKeyword,
    filteredScenes,
    scenePopoverOpen,
    setScenePopoverOpen,
    sceneSearchValue,
    setSceneSearchValue,
    isSceneDialogOpen,
    setIsSceneDialogOpen,
    editingScene,
    setEditingScene,
    sceneName,
    setSceneName,
    loadScenes,
    handleCreateScene,
    handleEditScene,
    handleSaveScene,
  };
}
