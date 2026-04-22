import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CodeLine {
  lineNumber: number;
  content: string;
  coverage: 'covered' | 'uncovered' | 'partial' | 'none';
}

interface CodeCoverageViewerProps {
  fileName: string;
  filePath: string;
  onClose: () => void;
  lineCoverage: number;
  branchCoverage: number;
}

export function CodeCoverageViewer({
  fileName,
  filePath,
  onClose,
  lineCoverage,
  branchCoverage,
}: CodeCoverageViewerProps) {
  const [fontSize, setFontSize] = useState(13);

  // 模拟代码数据（实际应从后端获取）
  const codeLines: CodeLine[] = [
    { lineNumber: 1, content: 'package com.aegisone.user;', coverage: 'none' },
    { lineNumber: 2, content: '', coverage: 'none' },
    { lineNumber: 3, content: 'import org.springframework.web.bind.annotation.*;', coverage: 'none' },
    { lineNumber: 4, content: 'import org.springframework.beans.factory.annotation.Autowired;', coverage: 'none' },
    { lineNumber: 5, content: 'import javax.validation.Valid;', coverage: 'none' },
    { lineNumber: 6, content: '', coverage: 'none' },
    { lineNumber: 7, content: '/**', coverage: 'none' },
    { lineNumber: 8, content: ' * 用户控制器', coverage: 'none' },
    { lineNumber: 9, content: ' * @author AegisOne', coverage: 'none' },
    { lineNumber: 10, content: ' */', coverage: 'none' },
    { lineNumber: 11, content: '@RestController', coverage: 'none' },
    { lineNumber: 12, content: '@RequestMapping("/api/user")', coverage: 'none' },
    { lineNumber: 13, content: 'public class UserController {', coverage: 'none' },
    { lineNumber: 14, content: '', coverage: 'none' },
    { lineNumber: 15, content: '    @Autowired', coverage: 'none' },
    { lineNumber: 16, content: '    private UserService userService;', coverage: 'covered' },
    { lineNumber: 17, content: '', coverage: 'none' },
    { lineNumber: 18, content: '    /**', coverage: 'none' },
    { lineNumber: 19, content: '     * 用户登录', coverage: 'none' },
    { lineNumber: 20, content: '     */', coverage: 'none' },
    { lineNumber: 21, content: '    @PostMapping("/login")', coverage: 'none' },
    { lineNumber: 22, content: '    public Response<UserVO> login(@Valid @RequestBody LoginRequest request) {', coverage: 'covered' },
    { lineNumber: 23, content: '        logger.info("User login: {}", request.getUsername());', coverage: 'covered' },
    { lineNumber: 24, content: '        UserVO user = userService.login(request);', coverage: 'covered' },
    { lineNumber: 25, content: '        if (user == null) {', coverage: 'partial' },
    { lineNumber: 26, content: '            return Response.error("用户名或密码错误");', coverage: 'uncovered' },
    { lineNumber: 27, content: '        }', coverage: 'uncovered' },
    { lineNumber: 28, content: '        return Response.success(user);', coverage: 'covered' },
    { lineNumber: 29, content: '    }', coverage: 'covered' },
    { lineNumber: 30, content: '', coverage: 'none' },
    { lineNumber: 31, content: '    /**', coverage: 'none' },
    { lineNumber: 32, content: '     * 获取用户信息', coverage: 'none' },
    { lineNumber: 33, content: '     */', coverage: 'none' },
    { lineNumber: 34, content: '    @GetMapping("/{id}")', coverage: 'none' },
    { lineNumber: 35, content: '    public Response<UserVO> getUserInfo(@PathVariable Long id) {', coverage: 'uncovered' },
    { lineNumber: 36, content: '        logger.info("Get user info: {}", id);', coverage: 'uncovered' },
    { lineNumber: 37, content: '        UserVO user = userService.getUserById(id);', coverage: 'uncovered' },
    { lineNumber: 38, content: '        if (user == null) {', coverage: 'uncovered' },
    { lineNumber: 39, content: '            return Response.error("用户不存在");', coverage: 'uncovered' },
    { lineNumber: 40, content: '        }', coverage: 'uncovered' },
    { lineNumber: 41, content: '        return Response.success(user);', coverage: 'uncovered' },
    { lineNumber: 42, content: '    }', coverage: 'uncovered' },
    { lineNumber: 43, content: '', coverage: 'none' },
    { lineNumber: 44, content: '    /**', coverage: 'none' },
    { lineNumber: 45, content: '     * 更新用户信息', coverage: 'none' },
    { lineNumber: 46, content: '     */', coverage: 'none' },
    { lineNumber: 47, content: '    @PutMapping("/{id}")', coverage: 'none' },
    { lineNumber: 48, content: '    public Response<Void> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {', coverage: 'covered' },
    { lineNumber: 49, content: '        logger.info("Update user: {}", id);', coverage: 'covered' },
    { lineNumber: 50, content: '        userService.updateUser(id, request);', coverage: 'covered' },
    { lineNumber: 51, content: '        return Response.success();', coverage: 'covered' },
    { lineNumber: 52, content: '    }', coverage: 'covered' },
    { lineNumber: 53, content: '', coverage: 'none' },
    { lineNumber: 54, content: '    /**', coverage: 'none' },
    { lineNumber: 55, content: '     * 删除用户', coverage: 'none' },
    { lineNumber: 56, content: '     */', coverage: 'none' },
    { lineNumber: 57, content: '    @DeleteMapping("/{id}")', coverage: 'none' },
    { lineNumber: 58, content: '    public Response<Void> deleteUser(@PathVariable Long id) {', coverage: 'partial' },
    { lineNumber: 59, content: '        logger.info("Delete user: {}", id);', coverage: 'covered' },
    { lineNumber: 60, content: '        if (id == 1L) {', coverage: 'partial' },
    { lineNumber: 61, content: '            return Response.error("无法删除管理员");', coverage: 'uncovered' },
    { lineNumber: 62, content: '        }', coverage: 'uncovered' },
    { lineNumber: 63, content: '        userService.deleteUser(id);', coverage: 'covered' },
    { lineNumber: 64, content: '        return Response.success();', coverage: 'covered' },
    { lineNumber: 65, content: '    }', coverage: 'covered' },
    { lineNumber: 66, content: '}', coverage: 'none' },
  ];

  const getLineBackground = (coverage: CodeLine['coverage']) => {
    switch (coverage) {
      case 'covered':
        return 'bg-green-100 hover:bg-green-200';
      case 'uncovered':
        return 'bg-red-100 hover:bg-red-200';
      case 'partial':
        return 'bg-yellow-100 hover:bg-yellow-200';
      default:
        return 'hover:bg-gray-50';
    }
  };

  const getLineNumberColor = (coverage: CodeLine['coverage']) => {
    switch (coverage) {
      case 'covered':
        return 'text-green-700 bg-green-50';
      case 'uncovered':
        return 'text-red-700 bg-red-50';
      case 'partial':
        return 'text-yellow-700 bg-yellow-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  // 简单的Java语法高亮
  const highlightSyntax = (code: string) => {
    // 关键字
    const keywords = ['package', 'import', 'public', 'private', 'class', 'if', 'return', 'void', 'new', 'null'];
    let highlighted = code;

    // 注释
    if (code.trim().startsWith('//') || code.trim().startsWith('*') || code.trim().startsWith('/**') || code.trim().startsWith('*/')) {
      return <span className="text-gray-500">{code}</span>;
    }

    // 注解
    if (code.trim().startsWith('@')) {
      const parts = code.split(' ');
      return (
        <>
          {parts.map((part, idx) => (
            <span key={idx}>
              {part.startsWith('@') ? (
                <span className="text-purple-600">{part}</span>
              ) : (
                part
              )}
              {idx < parts.length - 1 ? ' ' : ''}
            </span>
          ))}
        </>
      );
    }

    // 字符串
    const stringMatch = code.match(/"([^"]*)"/g);
    if (stringMatch) {
      const parts = code.split(/("([^"]*)")/g);
      return (
        <>
          {parts.map((part, idx) => {
            if (part.startsWith('"') && part.endsWith('"')) {
              return <span key={idx} className="text-blue-600">{part}</span>;
            }
            // 处理关键字
            const words = part.split(/(\s+)/);
            return words.map((word, widx) => {
              if (keywords.includes(word)) {
                return <span key={`${idx}-${widx}`} className="text-purple-700">{word}</span>;
              }
              return <span key={`${idx}-${widx}`}>{word}</span>;
            });
          })}
        </>
      );
    }

    // 处理关键字
    const words = code.split(/(\s+)/);
    return (
      <>
        {words.map((word, idx) => {
          if (keywords.includes(word)) {
            return <span key={idx} className="text-purple-700">{word}</span>;
          }
          return <span key={idx}>{word}</span>;
        })}
      </>
    );
  };

  const coveredLines = codeLines.filter(l => l.coverage === 'covered').length;
  const uncoveredLines = codeLines.filter(l => l.coverage === 'uncovered').length;
  const partialLines = codeLines.filter(l => l.coverage === 'partial').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-gray-900">{fileName}</h2>
              <span className="text-sm text-gray-500">{filePath}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">已覆盖:</span>
                <span className="text-green-700">{coveredLines} 行</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">未覆盖:</span>
                <span className="text-red-700">{uncoveredLines} 行</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600">部分覆盖:</span>
                <span className="text-yellow-700">{partialLines} 行</span>
              </div>
              <div className="ml-4 px-3 py-1 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-600">行覆盖率:</span>
                <span className="ml-2 text-purple-700">{lineCoverage}%</span>
              </div>
              <div className="px-3 py-1 bg-white rounded-lg border border-gray-200">
                <span className="text-gray-600">分支覆盖率:</span>
                <span className="ml-2 text-purple-700">{branchCoverage}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 w-12 text-center">{fontSize}px</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-white font-mono" style={{ fontSize: `${fontSize}px` }}>
          <div className="min-w-max">
            {codeLines.map((line) => (
              <div
                key={line.lineNumber}
                className={`flex ${getLineBackground(line.coverage)} border-b border-gray-100 transition-colors`}
              >
                {/* Line Number */}
                <div
                  className={`w-16 flex-shrink-0 text-right pr-4 py-1 select-none border-r border-gray-200 ${getLineNumberColor(
                    line.coverage
                  )}`}
                >
                  {line.lineNumber}
                </div>

                {/* Code Line */}
                <div className="flex-1 px-4 py-1 whitespace-pre">
                  {line.content ? highlightSyntax(line.content) : ' '}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Legend */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>覆盖率图例:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 bg-green-100 border border-green-200 rounded"></div>
              <span>已覆盖</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 bg-red-100 border border-red-200 rounded"></div>
              <span>未覆盖</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>部分覆盖</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            AegisOne 精准测试 - Jacoco代码覆盖率报告
          </div>
        </div>
      </div>
    </div>
  );
}

