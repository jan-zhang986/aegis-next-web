/**
 * 需求质量视图 - 顶部标题与时间
 */

interface RequirementQualityHeaderProps {
  /** 当前时间展示（已格式化） */
  dateTimeText: string;
}

export function RequirementQualityHeader({ dateTimeText }: RequirementQualityHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-[#0D1740] px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1.5 text-white">需求质量看板</h1>
          <p className="text-base text-gray-300">实时监控需求测试执行进度与质量</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono text-white">{dateTimeText}</div>
        </div>
      </div>
    </header>
  );
}
