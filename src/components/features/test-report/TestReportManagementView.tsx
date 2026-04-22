/**
 * 测试报告管理容器组件
 * 包含：自动化测试报告、性能报告
 */
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { TestReportListPage } from '@/pages/TestReportListPage';
import { PerformanceReportView } from '@/components/features/dial-management';

const REPORT_TABS = [
    { id: 'automation', label: '自动化测试报告' },
    { id: 'performance', label: 'Lighthouse报告' },
];

interface TestReportManagementViewProps {
    onViewReport: (reportId: string) => void;
}

export function TestReportManagementView({ onViewReport }: TestReportManagementViewProps) {
    const [searchParams, setSearchParams] = useSearchParams();

    // 三级 Tab：默认选中自动化测试报告
    const currentTab = searchParams.get('sub') || 'automation';

    const setTabId = (tabId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sub', tabId);
        setSearchParams(params, { replace: true });
    };

    const renderContent = () => {
        switch (currentTab) {
            case 'performance':
                return <PerformanceReportView />;
            case 'automation':
            default:
                return <TestReportListPage onViewReport={onViewReport} isSubPage={true} />;
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* 三级菜单 Tab */}

            <div className="px-6 pt-4 bg-white border-b border-gray-200">
                <nav className="flex gap-6">
                    {REPORT_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setTabId(tab.id)}
                            className={cn(
                                'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                                currentTab === tab.id
                                    ? 'text-primary border-primary'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-6">
                <div className="mb-4 flex-shrink-0">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {REPORT_TABS.find(t => t.id === currentTab)?.label}
                    </h1>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
