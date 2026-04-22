import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';

interface FormLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const FormLabel: React.FC<FormLabelProps> = ({ children, required = false, className }) => {
  return (
    <Label className={cn("text-sm font-medium text-gray-700 mb-1.5 block", className)}>
      {required && <span className="text-red-500 mr-1">*</span>}
      {children}
    </Label>
  );
};

