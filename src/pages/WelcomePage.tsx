import React from 'react';
import { cn } from '@/utils/cn';
import {
    Zap,
    Layers,
    Cpu,
    Brain,
    Globe,
    Box,
    BarChart3,
    Sparkles
} from 'lucide-react';

export function WelcomePage() {
    return (
        <div className="flex-1 bg-[#fcfdfe] relative overflow-hidden flex items-center justify-center min-h-0">
            {/* 背景装饰渐变 */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-[1400px] w-full px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                {/* 左侧文案区 */}
                <div className="space-y-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold tracking-wider uppercase shadow-sm border border-blue-100/50">
                            <Sparkles className="w-3 h-3" />
                            <span>Intelligence & Quality</span>
                        </div>
                        <h1 className="text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                            AegisOne
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                                连接智能与质量
                            </span>
                        </h1>
                    </div>

                    <div className="max-w-lg">
                        <p className="text-lg text-gray-600 leading-relaxed font-light">
                        以智能驱动质量，以质量赋能效能，让团队更高效、交付更可靠。
                        </p>
                    </div>
                </div>

                {/* 右侧图形区 */}
                <div className="relative h-[600px] flex items-center justify-center lg:scale-110">
                    {/* 中心核心节点 - 电子大脑 */}
                    <div className="relative z-20 group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-[0_30px_60px_rgba(37,99,235,0.4)] flex items-center justify-center animate-bounce-slow relative overflow-hidden group-hover:scale-110 transition-transform duration-500 cursor-pointer">
                            {/* 大脑图标 */}
                            <Brain className="w-16 h-16 text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

                            {/* 内部电流流光 */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400 to-transparent opacity-30 -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </div>

                        {/* 多重脉冲光环 - 模拟神经网络扩散 */}
                        <div className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-blue-400 opacity-20 animate-neural-pulse-1 shadow-2xl" />
                        <div className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-indigo-400 opacity-10 animate-neural-pulse-2 shadow-2xl" />
                        <div className="absolute inset-0 w-32 h-32 rounded-[2.5rem] bg-blue-300 opacity-5 animate-neural-pulse-3 shadow-2xl" />
                    </div>

                    {/* 交互提示点 */}
                    <div className="absolute bottom-20 text-blue-400/40 text-[10px] font-medium tracking-[0.2em] uppercase animate-pulse">
                        Neural Network Active
                    </div>

                    {/* 环绕节点 1: 平台图标 */}
                    <Node
                        className="top-[5%] left-[15%]"
                        icon={<Cpu className="w-5 h-5" />}
                        color="bg-purple-500"
                        delay="0s"
                        label="Digital Core"
                    />
                    <Node
                        className="top-[45%] left-[-5%]"
                        icon={<Globe className="w-6 h-6" />}
                        color="bg-indigo-500 text-blue-100"
                        delay="1s"
                        label="Global Network"
                    />
                    <Node
                        className="bottom-[5%] left-[20%]"
                        icon={<Layers className="w-5 h-5" />}
                        color="bg-emerald-500"
                        delay="2s"
                        label="Multi-Layer Logic"
                    />

                    {/* 环绕节点 2: 用户头像 */}
                    <AvatarNode
                        className="top-0 right-[20%]"
                        seed="Aneka"
                        delay="0.5s"
                    />
                    <AvatarNode
                        className="top-[40%] right-0"
                        seed="Brook"
                        delay="1.5s"
                    />
                    <AvatarNode
                        className="bottom-0 right-[20%]"
                        seed="Cathy"
                        delay="2.5s"
                    />

                    {/* 连接线条 (SVG 背后绘制) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        <circle cx="50%" cy="50%" r="180" fill="none" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="10 20" className="animate-spin-very-slow" />
                        <circle cx="50%" cy="50%" r="250" fill="none" stroke="url(#lineGrad)" strokeWidth="0.5" strokeDasharray="5 15" className="animate-spin-reverse-very-slow" />
                    </svg>
                </div>
            </div>

            {/* 底部装饰 */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50/50 to-transparent pointer-events-none" />

            <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes spin-very-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-very-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes neural-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(6px, -10px); }
          66% { transform: translate(-6px, 5px); }
        }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        .animate-spin-very-slow { transform-origin: center; animation: spin-very-slow 40s linear infinite; }
        .animate-spin-reverse-very-slow { transform-origin: center; animation: spin-reverse-very-slow 60s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-neural-pulse-1 { animation: neural-pulse 3s cubic-bezier(0.165, 0.84, 0.44, 1) infinite; }
        .animate-neural-pulse-2 { animation: neural-pulse 3s cubic-bezier(0.165, 0.84, 0.44, 1) infinite 1s; }
        .animate-neural-pulse-3 { animation: neural-pulse 3s cubic-bezier(0.165, 0.84, 0.44, 1) infinite 2s; }
      `}</style>
        </div>
    );
}

function Node({ className, icon, color, delay, label }: { className: string, icon: React.ReactNode, color: string, delay: string, label?: string }) {
    return (
        <div className={cn("absolute z-10 animate-float group/node", className)} style={{ animationDelay: delay }}>
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg backdrop-blur-sm bg-opacity-90 transform transition-all duration-300 hover:scale-125 hover:rotate-6 cursor-pointer relative",
                color
            )}>
                {icon}
                {label && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/80 backdrop-blur-md rounded-md border border-gray-100 shadow-sm opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap text-[10px] text-gray-900 font-bold uppercase tracking-widest pointer-events-none">
                        {label}
                    </div>
                )}
            </div>
        </div>
    );
}

function AvatarNode({ className, seed, delay }: { className: string, seed: string, delay: string }) {
    return (
        <div className={cn("absolute z-10 animate-float", className)} style={{ animationDelay: delay }}>
            <div className="w-14 h-14 rounded-full p-1 bg-white shadow-xl border border-gray-100 transform transition-transform hover:scale-110 cursor-pointer">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
}
