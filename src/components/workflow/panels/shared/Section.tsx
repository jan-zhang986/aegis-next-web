import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tooltip?: string;
  required?: boolean;
}

export const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true, tooltip, required = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-gray-100 last:border-b-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-gray-50 px-4">
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-medium text-gray-700">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

