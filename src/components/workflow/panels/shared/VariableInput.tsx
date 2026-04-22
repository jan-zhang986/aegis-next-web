import React, { useRef, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { INPUT_STYLE } from './constants';

interface VariableInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  wrapperClassName?: string;
}

export const VariableValueInput: React.FC<VariableInputProps> = ({ value, placeholder, onChange, wrapperClassName }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (inputRef.current) {
        const isOverflowing = inputRef.current.scrollWidth > inputRef.current.clientWidth;
        setIsTruncated(isOverflowing);
      }
    };

    const timeoutId = setTimeout(checkTruncation, 0);
    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [value]);

  const inputElement = (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(INPUT_STYLE, "w-full", isTruncated ? "truncate" : "")}
      autoComplete="off"
    />
  );

  if (isTruncated && value) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className={cn("w-full min-w-0", wrapperClassName)}>
            {inputElement}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border border-gray-700 z-[9999] max-w-md rounded-md">
          <p className="break-all whitespace-pre-wrap">{value}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div className={cn("w-full min-w-0", wrapperClassName)}>{inputElement}</div>;
};

export const VariableNameInput: React.FC<VariableInputProps> = ({ value, placeholder, onChange, wrapperClassName }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (inputRef.current) {
        const isOverflowing = inputRef.current.scrollWidth > inputRef.current.clientWidth;
        setIsTruncated(isOverflowing);
      }
    };

    const timeoutId = setTimeout(checkTruncation, 0);
    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [value]);

  const inputElement = (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(INPUT_STYLE, "w-full", isTruncated ? "truncate" : "")}
      autoComplete="off"
    />
  );

  if (isTruncated && value) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className={cn("flex-1 min-w-0", wrapperClassName)}>
            {inputElement}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white border border-gray-700 z-[9999] max-w-md rounded-md">
          <p className="break-all whitespace-pre-wrap">{value}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div className={cn("flex-1 min-w-0", wrapperClassName)}>{inputElement}</div>;
};

