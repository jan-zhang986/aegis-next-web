import type React from 'react';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: QuickAction[];
  generatedData?: GeneratedData;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface GeneratedData {
  type: 'api-test' | 'test-data' | 'workflow' | 'config';
  data: any;
  canAdopt?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category?: string;
  connectionUrl?: string;
  apiKey?: string;
  status?: 'connected' | 'disconnected' | 'error';
}
