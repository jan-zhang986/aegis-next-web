import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  Globe,
  Database,
  User,
  Lock,
  Eye,
  EyeOff,
  Workflow,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/UserContext';
import { authService } from '@/services/auth';
import { getToken as getAuthToken, hasToken } from '@/utils/auth';
import { toast } from 'sonner';

export function LoginPage() {
  const { handleLoginSuccess, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // 账号密码登录状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'feishu' | 'password'>('feishu');

  // 解析 redirect 参数，提取实际的路径（忽略回调参数）
  const parseRedirectPath = (redirectParam: string | null): string => {
    if (!redirectParam || redirectParam.trim() === '') {
      return '/';
    }

    try {
      const decoded = decodeURIComponent(redirectParam.trim());
      
      // 如果解码后为空或者是根路径，返回默认路径（欢迎页）
      if (decoded === '/' || decoded === '' || decoded.trim() === '') {
        return '/';
      }
      
      // 如果包含查询参数，只取路径部分
      if (decoded.includes('?')) {
        const pathPart = decoded.split('?')[0].trim();
        return pathPart === '/' || pathPart === '' ? '/' : pathPart;
      }
      
      // 确保路径以 / 开头
      const path = decoded.startsWith('/') ? decoded : `/${decoded}`;
      return path === '/' ? '/' : path;
    } catch (e) {
      console.warn('[LoginPage] 解析 redirect 参数失败:', e, redirectParam);
      return '/';
    }
  };

  // 如果已经登录，自动跳转到目标页面或首页
  // 注意：只有在明确认证成功时才跳转，避免因为过期 token 导致无法访问登录页
  useEffect(() => {
    // 只有在明确认证成功时才跳转（isAuthenticated 为 true）
    // 如果只有 token 但没有认证状态，可能是过期 token，允许用户重新登录
    if (isAuthenticated) {
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect') || (location.state as any)?.from?.pathname || null;
      // 使用 parseRedirectPath 处理 redirect 参数，确保路径有效
      const redirect = parseRedirectPath(redirectParam);
      // 使用 setTimeout 确保在下一个事件循环中执行，避免在渲染期间导航
      const timer = setTimeout(() => {
        navigate(redirect, { replace: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, location, navigate]);

  // 处理飞书回调
  useEffect(() => {
    let isMounted = true; // 标记组件是否已挂载
    
    const processCallback = async () => {
      if (typeof window === 'undefined') return;
      
      // 检查 handleLoginSuccess 是否存在
      if (!handleLoginSuccess) {
        console.warn('[LoginPage] handleLoginSuccess is not available');
        return;
      }

      // 检查是否已经在处理回调（防止重复处理）
      if ((window as any).__feishuCallbackProcessing) {
        return;
      }

      // 检查 URL 参数中是否有 sessionId（来自后端回调重定向）
      // 这是主要的飞书登录流程：后端处理回调后重定向回来
      // 注意：后端可能重定向到 hash 路由格式（/#/login），需要转换为标准路由格式（/login）
      let urlParams: URLSearchParams;
      let sessionId: string | null = null;
      let success: string | null = null;
      let source: string | null = null;
      let code: string | null = null;
      let state: string | null = null;

      // 检查是否是 hash 路由格式（后端可能重定向到 /#/login?xxx）
      // 后端硬编码了重定向URL为 http://aegis.tst.spotter.ink/#/login，需要转换为标准路由格式
      if (window.location.hash && window.location.hash.includes('login')) {

        // 从 hash 中提取参数（支持多种格式：/#/login?xxx 或 #/login?xxx）
        const hashMatch = window.location.hash.match(/\/?login\?([^#]+)/);
        if (hashMatch) {
          urlParams = new URLSearchParams(hashMatch[1]);
          sessionId = urlParams.get('sessionId');
          success = urlParams.get('success');
          source = urlParams.get('source');
          code = urlParams.get('code');
          state = urlParams.get('state');

          // 如果是 hash 路由格式，立即清除 hash 并重定向到标准路由
          const queryString = hashMatch[1];
          const cleanUrl = window.location.origin + '/login' + (queryString ? '?' + queryString : '');
          window.history.replaceState({}, document.title, cleanUrl);

          // 重新从标准路由的查询参数中读取（因为已经转换了）
          urlParams = new URLSearchParams(window.location.search);
          sessionId = urlParams.get('sessionId');
          success = urlParams.get('success');
          source = urlParams.get('source');
          code = urlParams.get('code');
          state = urlParams.get('state');
        } else {
          // hash 中没有参数，使用标准查询参数
          urlParams = new URLSearchParams(window.location.search);
          sessionId = urlParams.get('sessionId');
          success = urlParams.get('success');
          source = urlParams.get('source');
          code = urlParams.get('code');
          state = urlParams.get('state');
        }
      } else {
        // 标准路由格式
        urlParams = new URLSearchParams(window.location.search);
        sessionId = urlParams.get('sessionId');
        success = urlParams.get('success');
        source = urlParams.get('source');
        code = urlParams.get('code');
        state = urlParams.get('state');

        // 如果直接参数中没有回调信息，检查 redirect 参数中是否包含回调参数
        // 后端可能将回调参数编码在 redirect 参数中（如：redirect=/?success=true&source=lark&sessionId=xxx）
        if (!sessionId && !success && !source) {
          const redirectParam = urlParams.get('redirect');
          if (redirectParam) {
            try {
              // 解码 redirect 参数
              const decodedRedirect = decodeURIComponent(redirectParam);
              // 如果 redirect 是完整的 URL，提取查询参数部分
              let redirectQueryString = decodedRedirect;
              if (decodedRedirect.includes('?')) {
                redirectQueryString = decodedRedirect.split('?')[1];
              }
              // 解析 redirect 中的查询参数
              const redirectParams = new URLSearchParams(redirectQueryString);
              sessionId = redirectParams.get('sessionId') || sessionId;
              success = redirectParams.get('success') || success;
              source = redirectParams.get('source') || source;
              code = redirectParams.get('code') || code;
              state = redirectParams.get('state') || state;
            } catch (e) {
              console.warn('解析 redirect 参数失败:', e);
            }
          }
        }
      }

      // 主要流程：后端处理后的重定向（success=true&source=lark&sessionId=...）
      if (success === 'true' && source === 'lark' && sessionId) {
        (window as any).__feishuCallbackProcessing = true;
        if (isMounted) {
          setIsProcessingCallback(true);
        }

        try {
          // 验证 sessionId 格式（UUID）
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const cleanSessionId = String(sessionId).trim();

          if (!uuidPattern.test(cleanSessionId)) {
            throw new Error('无效的 sessionId 格式');
          }

          // 清空旧状态
          const { clearToken } = await import('@/utils/auth');
          clearToken();

          // 先通过 /lark/user 接口获取用户信息（包含 csrfToken），这个接口不需要 CSRF token
          let csrfToken = '';
          try {
            const userInfo = await authService.getLarkUserBySessionId(cleanSessionId);
            if (userInfo && (userInfo as any).csrfToken) {
              csrfToken = (userInfo as any).csrfToken;
            }
          } catch (error) {
            console.warn('[LoginPage] 通过 /lark/user 获取用户信息失败，将尝试其他方式:', error);
            // 如果失败，继续使用空 csrfToken，handleLoginSuccess 会尝试从 getCurrentUser 获取
          }

          // 保存新的 token（包含 csrfToken）
          await handleLoginSuccess(cleanSessionId, csrfToken);

          // 验证 token 是否已保存
          const tokenPair = getAuthToken();
          if (!tokenPair?.sessionId || tokenPair.sessionId !== cleanSessionId) {
            throw new Error('Token 保存失败');
          }

          if (isMounted) {
            toast.success('飞书登录成功!');

            // 立即跳转到测试工厂页面，使用 replace 避免在历史记录中留下回调地址
            const searchParams = new URLSearchParams(location.search);
            const redirectParam = searchParams.get('redirect');
            const redirect = parseRedirectPath(redirectParam) || (location.state as any)?.from?.pathname || '/test-factory';
            // 使用 replace 跳转，避免在历史记录中留下回调地址
            navigate(redirect, { replace: true });
          }
        } catch (error) {
          if (isMounted) {
            toast.error('登录状态保存失败，请重试');
            setIsProcessingCallback(false);
          }
          delete (window as any).__feishuCallbackProcessing;
        }
        return;
      }

      // 备用流程：直接来自飞书的回调（code + state），前端调用后端接口
      // 支持两种 state 格式：fit2cloud-lark-quick（原格式）和 fit2cloud-lark-quick-keeper-one-web（新格式）
      if (code && state && (state === 'fit2cloud-lark-quick' || state.startsWith('fit2cloud-lark-quick'))) {
        (window as any).__feishuCallbackProcessing = true;
        if (isMounted) {
          setIsProcessingCallback(true);
        }

        try {
          const codeStr = Array.isArray(code) ? code[0] : code;
          if (!codeStr) {
            throw new Error('授权码不能为空');
          }

          // 使用重试机制调用后端登录接口
          const tryLogin = async (attempt: number): Promise<any> => {
            if (!isMounted) {
              throw new Error('Component unmounted');
            }
            try {
              const authRes = await authService.larkLogin(codeStr);
              if (authRes.code === 200 && authRes.data?.sessionId) {
                return authRes.data;
              }
              throw new Error(authRes.message || '登录失败');
            } catch (err: any) {
              if (attempt < 3 && isMounted) {
                const delay = 1000 * attempt;
                await new Promise(resolve => setTimeout(resolve, delay));
                return tryLogin(attempt + 1);
              }
              throw err;
            }
          };

          const larkCallback = await tryLogin(1);

          if (!larkCallback || !larkCallback.sessionId) {
            throw new Error('无法获取登录信息，请重试');
          }

          await handleLoginSuccess(larkCallback.sessionId, larkCallback.csrfToken || '');

          if (isMounted) {
            toast.success('飞书登录成功!');

            // 立即跳转到测试工厂页面，使用 replace 避免在历史记录中留下回调地址
            const searchParams = new URLSearchParams(location.search);
            const redirectParam = searchParams.get('redirect');
            const redirect = parseRedirectPath(redirectParam) || (location.state as any)?.from?.pathname || '/test-factory';
            // 使用 replace 跳转，避免在历史记录中留下回调地址
            navigate(redirect, { replace: true });
          }
        } catch (error: any) {
          if (isMounted) {
            console.error('[LoginPage] 飞书登录失败:', error);
            toast.error(error?.message || '飞书登录失败，请重试');
            setIsProcessingCallback(false);

            // 清除 URL 参数
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          delete (window as any).__feishuCallbackProcessing;
        }
        return;
      }
    };

    processCallback();
    
    // 清理函数：组件卸载时标记为未挂载
    return () => {
      isMounted = false;
    };
  }, [handleLoginSuccess, navigate, location]);

  // 账号密码登录处理
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }

    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }

    setIsPasswordLoading(true);

    try {
      // 调用登录接口
      const response = await authService.login({
        username: username.trim(),
        password: password.trim(),
      });

      // AegisOne 登录成功返回 SessionUser 对象，包含 sessionId 和 csrfToken
      // 响应拦截器已经提取了 data.data，所以 response 就是 SessionUser 对象
      if (response) {
        const userData = response as any;

        // 直接从响应对象中提取（响应拦截器已经处理了 data.data）
        const sessionId = userData.sessionId;
        const csrfToken = userData.csrfToken || '';

        if (sessionId) {
          // 保存用户信息和 token
          await handleLoginSuccess(sessionId, csrfToken);

          // 验证 token 是否已保存到 localStorage
          const tokenPair = getAuthToken();
          if (!tokenPair?.sessionId) {
            // 直接保存到 localStorage
            const { setToken: setTokenUtil } = await import('@/utils/auth');
            setTokenUtil(sessionId, csrfToken);
            // 等待一下确保保存完成
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          toast.success('登录成功!');

          // 清空表单
          setUsername('');
          setPassword('');

          // 等待状态更新和用户信息获取完成后再跳转
          await new Promise(resolve => setTimeout(resolve, 500));

          const finalToken = getAuthToken();
          if (finalToken?.sessionId) {
            const searchParams = new URLSearchParams(location.search);
            const redirectParam = searchParams.get('redirect') || (location.state as any)?.from?.pathname || null;
            // 使用 parseRedirectPath 处理 redirect 参数，确保路径有效
            const redirect = parseRedirectPath(redirectParam);
            // 直接 push 到目标页面，保留历史记录
            // App.tsx 中的回退保护会处理退出应用的情况
            navigate(redirect);
          } else {
            toast.error('登录状态保存失败，请重试');
          }
        } else {
          // 如果响应中没有 sessionId，可能是格式问题
          toast.error('登录响应格式异常，请重试');
        }
      } else {
        toast.error('登录失败，请检查用户名和密码');
      }
    } catch (error: any) {
      const errorMessage = error?.message || '登录失败，请检查用户名和密码';
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // 飞书快捷登录处理（与 aegis-next-server 保持一致）
  const handleFeishuLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // 获取飞书配置信息
      const larkInfo = await authService.getLarkInfo();

      if (!larkInfo.enable || !larkInfo.valid) {
        toast.error('飞书登录未启用或配置无效，请联系管理员');
        setIsLoading(false);
        return;
      }

      if (!larkInfo.agentId || !larkInfo.callBack) {
        toast.error('飞书配置无效，请联系管理员');
        setIsLoading(false);
        return;
      }

      // 构建飞书快捷登录URL（使用新的授权地址）
      // 在 state 参数中添加应用标识，用于区分不同的前端应用
      const redirectUri = larkInfo.callBack || 'http://aegis.tst.spotter.ink/devops/feishu/callback';
      // state 参数格式：fit2cloud-lark-quick-keeper-one-web（添加应用标识）
      const state = 'fit2cloud-lark-quick-keeper-one-web';
      const loginUrl = `https://accounts.feishu.cn/open-apis/authen/v1/authorize?client_id=${larkInfo.agentId
        }&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}`;


      // 直接跳转到飞书登录页面（后端会处理回调并重定向回来）
      window.location.href = loginUrl;
    } catch (error: any) {
      toast.error(error?.message || '获取飞书登录链接失败');
      setIsLoading(false);
    }
  };


  const features = [
    {
      icon: Workflow,
      title: '自动化流程编排',
      description: '可视化工作流设计',
    },
    {
      icon: FileText,
      title: '测试数据生成',
      description: '智能数据生成工具',
    },
    {
      icon: Zap,
      title: 'HTTP 接口',
      description: 'RESTful API 测试',
    },
    {
      icon: Database,
      title: 'SQL 数据库',
      description: '多数据库支持',
    },
    {
      icon: Globe,
      title: 'Dubbo 服务',
      description: 'RPC 服务调用',
    },
    {
      icon: Sparkles,
      title: 'RocketMQ',
      description: '消息队列测试',
    },
  ];

  const [greeting, setGreeting] = useState({ title: '', message: '' });


  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return {
          title: '上午好哇',
          message: '新的一天全新的开始，加油！'
        };
      } else if (hour >= 12 && hour < 14) {
        return {
          title: '中午好哇',
          message: '休息一下，补充能量吧！'
        };
      } else if (hour >= 14 && hour < 18) {
        return {
          title: '下午好哇',
          message: '保持专注，你真棒！'
        };
      } else if (hour >= 18 && hour < 23) {
        return {
          title: '晚上好哇',
          message: '今天辛苦了，快下班，享受夜晚的宁静吧。'
        };
      } else {
        return {
          title: '深夜好',
          message: '该休息了，身体是革命的本钱。'
        };
      }
    };
    setGreeting(getGreeting());
  }, []);

  // 如果正在处理回调，显示加载状态
  if (isProcessingCallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="relative z-10 text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-medium text-gray-700">正在处理登录回调...</p>
          <p className="text-sm text-gray-500">请稍候</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Spotter Logo - Top Left */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs sm:text-sm font-semibold">QA</span>
          </div>
          <span className="text-gray-900 font-semibold text-base sm:text-lg">SPOTTER</span>
        </div>
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-center justify-center">
          {/* Left side - Branding (占 6 列) */}
          <div className="space-y-6 lg:space-y-8 hidden lg:block lg:col-span-6 lg:justify-self-start lg:pr-8">
            {/* Logo & Title */}
            <div className="space-y-4 xl:space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <Shield className="w-8 h-8 xl:w-9 xl:h-9 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl xl:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                      AegisOnes
                    </h1>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md">
                      SPOTTER
                    </span>
                  </div>
                  <p className="text-xs xl:text-sm text-gray-500 mt-1">Aegis One Platform</p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl xl:text-3xl font-bold text-gray-900">
                  自动化测试、数据生成、用例管理
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    一体化测试工具
                  </span>
                </h2>
                <p className="text-sm xl:text-base text-gray-600 leading-relaxed">
                  支持 HTTP、SQL、Dubbo、RocketMQ 等多协议，提供强大的API测试能力
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 hover:bg-white hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
                      <feature.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{feature.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">时时寻求效率进步，事事讲求方法技术。</span>
              </div>
            </div>
          </div>


          {/* Right side - Login Card (占 6 列) */}
          <div className="relative w-full max-w-md mx-auto lg:max-w-sm lg:col-span-6 lg:justify-self-start">
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/20 border border-purple-200/50 p-6 sm:p-7 lg:p-8">
              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-20" />
              <div className="absolute -bottom-3 -left-3 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-2xl opacity-20" />

              <div className="relative space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl shadow-purple-500/30">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{greeting.title}</h3>
                    <p className="text-gray-500 mt-1">{greeting.message}</p>
                  </div>
                </div>

                {/* 登录方式切换 */}
                {loginMethod === 'feishu' ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Button
                        type="button"
                        onClick={handleFeishuLogin}
                        disabled={isLoading}
                        className="w-full h-12 bg-[#3370ff] hover:bg-[#285ae0] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 text-base rounded-xl flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            登录中...
                          </>
                        ) : (
                          <>
                            <Globe className="w-5 h-5" />
                            飞书 SSO 登录
                          </>
                        )}
                      </Button>

                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">

                      </div>
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      disabled={isLoading}
                      className="w-full h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 text-gray-600 transition-all duration-300 text-base rounded-xl"
                    >
                      账号密码登录
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <form onSubmit={handlePasswordLogin} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-semibold text-gray-800">
                          用户名
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 transition-colors" />
                          <Input
                            id="username"
                            type="text"
                            placeholder="请输入用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading || isPasswordLoading}
                            className="pl-9 h-11 border-gray-300 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
                            autoComplete="username"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-semibold text-gray-800">
                          密码
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 transition-colors" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading || isPasswordLoading}
                            className="pl-9 pr-9 h-11 border-gray-300 focus-visible:border-purple-500 focus-visible:ring-purple-500/30"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                            disabled={isLoading || isPasswordLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || isPasswordLoading || !username.trim() || !password.trim()}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 text-base rounded-xl"
                      >
                        {isPasswordLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            登录中...
                          </>
                        ) : (
                          <>
                            登录
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>

                    <div className="text-center">
                      <button
                        onClick={() => setLoginMethod('feishu')}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center gap-1 mx-auto"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        返回飞书登录
                      </button>
                    </div>
                  </div>
                )}

                {/* Features list */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    平台优势
                  </p>
                  <div className="space-y-2">
                    {[
                      '多协议支持 - HTTP / SQL / Dubbo / MQ',
                      '可视化操作 - 无需编写代码',
                      'AI 驱动 - 智能测试生成',
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 pt-4">
                  登录即表示您同意我们的
                  <button className="text-blue-600 hover:text-blue-700 mx-1">
                    服务条款
                  </button>
                  和
                  <button className="text-blue-600 hover:text-blue-700 ml-1">
                    隐私政策
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

