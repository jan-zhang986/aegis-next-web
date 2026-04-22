interface ApiTypeCardProps {
  id: string;
  label: string;
  icon: string;
  color: string;
  iconBg: string;
}

export function ApiTypeCard({ label, icon, color, iconBg }: ApiTypeCardProps) {
  return (
    <button className={`bg-gradient-to-br ${color} rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all hover:scale-[1.02] border border-gray-200 h-full w-full min-h-[140px]`}>
      <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
        {icon}
      </div>
      <span className="text-xs text-gray-700 text-center leading-tight">{label}</span>
    </button>
  );
}
