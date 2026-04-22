import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-blue-600 opacity-20">404</h1>
                    <div className="relative -mt-20">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">页面弄丢了</h2>
                        <p className="text-gray-600 mb-8">
                            抱歉，您访问的页面不存在或已被移除。请检查输入的网址是否正确。
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回上一页
                    </Button>
                    <Button
                        className="flex items-center gap-2"
                        onClick={() => navigate('/')}
                    >
                        <Home className="w-4 h-4" />
                        回到首页
                    </Button>
                </div>
            </div>

            {/* 装饰性元素 */}
            <div className="mt-16 text-gray-400 text-sm">
                AegisOnes &copy; {new Date().getFullYear()} spotterio.com
            </div>
        </div>
    );
}
