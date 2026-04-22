/**
 * 创建用例成功页
 * 参考 spotter-metersphere createSuccess.vue：倒计时、按钮顺序、可能还想
 */

import { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, PlusCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const VISITED_KEY = 'doNotNextTipCreateCase';

interface CreateSuccessProps {
  caseId?: string;
  caseName?: string;
  onBackToList?: () => void;
  onEditCase?: () => void;
  onContinueCreate?: () => void;
  onCreateCaseReview?: () => void;
}

export function CreateSuccess({
  caseId,
  caseName,
  onBackToList,
  onEditCase,
  onContinueCreate,
  onCreateCaseReview,
}: CreateSuccessProps) {
  const [countDown, setCountDown] = useState(5);
  const [notNextTip, setNotNextTip] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem(VISITED_KEY);
    setNotNextTip(!!visited);
  }, []);

  useEffect(() => {
    if (!onBackToList || notNextTip) return;
    const timer = setInterval(() => {
      setCountDown((c) => {
        if (c <= 1) {
          onBackToList();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onBackToList, notNextTip]);

  const handleNotNextTip = (checked: boolean) => {
    setNotNextTip(checked);
    if (checked) localStorage.setItem(VISITED_KEY, '1');
    else localStorage.removeItem(VISITED_KEY);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-0 overflow-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">用例创建成功</h2>
            {caseName && (
              <p className="text-gray-600 mb-2 truncate max-w-full px-4" title={caseName}>
                {caseName}
              </p>
            )}
            {!notNextTip && onBackToList && (
              <p className="text-sm text-gray-500 mb-4">
                <span className="text-blue-600 font-medium">{countDown}</span> 秒后自动返回列表
              </p>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              {onEditCase && caseId && (
                <Button onClick={onEditCase}>
                  <FileText className="w-4 h-4 mr-2" /> 用例详情
                </Button>
              )}
              {onContinueCreate && (
                <Button variant="outline" onClick={onContinueCreate}>
                  <PlusCircle className="w-4 h-4 mr-2" /> 继续创建
                </Button>
              )}
              {onBackToList && (
                <Button variant="outline" onClick={onBackToList}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> 返回列表
                </Button>
              )}
            </div>
            {onBackToList && (
              <label className="flex items-center justify-center gap-2 mt-6 cursor-pointer text-sm text-gray-500">
                <Checkbox checked={notNextTip} onCheckedChange={(c) => handleNotNextTip(!!c)} />
                下次不再提示
              </label>
            )}
          </CardContent>
        </Card>

        {onCreateCaseReview && (
          <div className="mt-8 w-full max-w-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">可能还想</p>
            <Card className="border-gray-200 hover:border-blue-200 transition-colors">
              <CardContent className="py-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-800">创建用例评审</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={onCreateCaseReview}>
                    继续创建
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
