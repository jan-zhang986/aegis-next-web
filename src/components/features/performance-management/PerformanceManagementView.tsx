/**
 * 性能管理容器组件
 * 作为测试工厂下的二级菜单“性能管理”的内容区
 * 三级菜单：web性能分析、web性能配置
 */
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
    PerformanceConfigView,
    PerformanceDiagnosisView,
} from '@/components/features/dial-management';

const THIRD_LEVEL_ITEMS = [
    { id: 'perfDiagnosis', label: 'web性能分析' },
    { id: 'perfConfig', label: 'web性能配置' },
];

export function PerformanceManagementView() {
    const [searchParams, setSearchParams] = useSearchParams();

    // 三级菜单：默认选中性能分析
    const currentSub = searchParams.get('sub') || 'perfDiagnosis';

    const setSubId = (subId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sub', subId);
        setSearchParams(params, { replace: true });
    };

    const renderContent = () => {
        switch (currentSub) {
            case 'perfConfig':
                return <PerformanceConfigView />;
            case 'perfDiagnosis':
            default:
                return <PerformanceDiagnosisView />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* 三级菜单 Tab */}
            <div className="px-6 pt-4 bg-white border-b border-gray-200">
                <nav className="flex gap-6">
                    {THIRD_LEVEL_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSubId(item.id)}
                            className={cn(
                                'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                                currentSub === item.id
                                    ? 'text-primary border-primary'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {/* 标题 */}
                <div className="mb-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {THIRD_LEVEL_ITEMS.find(i => i.id === currentSub)?.label || 'web性能分析'}
                    </h1>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}
