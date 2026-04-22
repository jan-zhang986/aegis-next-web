import { useState } from 'react';
import type { Environment } from '@/services/environment';

export interface UseMetadataDialogsResult {
  isAddModuleDialogOpen: boolean;
  setIsAddModuleDialogOpen: (open: boolean) => void;
  isDeleteModuleDialogOpen: boolean;
  setIsDeleteModuleDialogOpen: (open: boolean) => void;
  isEditModuleDialogOpen: boolean;
  setIsEditModuleDialogOpen: (open: boolean) => void;
  editModuleName: string;
  setEditModuleName: (name: string) => void;
  editModuleId: string;
  setEditModuleId: (id: string) => void;
  deleteModuleId: string;
  setDeleteModuleId: (id: string) => void;
  selectedModuleType: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT';
  setSelectedModuleType: (type: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT') => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  isImportDialogOpen: boolean;
  setIsImportDialogOpen: (open: boolean) => void;
  importUrl: string;
  setImportUrl: (url: string) => void;
  importServiceCode: string;
  setImportServiceCode: (code: string) => void;
  importModuleId: string;
  setImportModuleId: (id: string) => void;
  importProjectId: string;
  setImportProjectId: (id: string) => void;
  importApplicationName: string;
  setImportApplicationName: (name: string) => void;
  importSiteTenant: string;
  setImportSiteTenant: (tenant: string) => void;
  isImporting: boolean;
  setIsImporting: (importing: boolean) => void;
  isImportCreateModuleDialogOpen: boolean;
  setIsImportCreateModuleDialogOpen: (open: boolean) => void;
  isDdlImportDialogOpen: boolean;
  setIsDdlImportDialogOpen: (open: boolean) => void;
  ddlImportDatabase: string;
  setDdlImportDatabase: (db: string) => void;
  ddlImportTableName: string;
  setDdlImportTableName: (name: string) => void;
  ddlImportModuleId: string;
  setDdlImportModuleId: (id: string) => void;
  ddlImportEnvironmentId: string;
  setDdlImportEnvironmentId: (id: string) => void;
  ddlImportEnvironments: Environment[];
  setDdlImportEnvironments: (envs: Environment[]) => void;
  isDdlImporting: boolean;
  setIsDdlImporting: (importing: boolean) => void;
  isUploadDialogOpen: boolean;
  setIsUploadDialogOpen: (open: boolean) => void;
  uploadFile: File | null;
  setUploadFile: (file: File | null) => void;
  uploadModuleId: string;
  setUploadModuleId: (id: string) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  isDeleteDefinitionDialogOpen: boolean;
  setIsDeleteDefinitionDialogOpen: (open: boolean) => void;
  deleteDefinitionId: string | null;
  setDeleteDefinitionId: (id: string | null) => void;
  deleteDefinitionName: string;
  setDeleteDefinitionName: (name: string) => void;
  isBatchMoveDialogOpen: boolean;
  setIsBatchMoveDialogOpen: (open: boolean) => void;
  batchMoveTargetModuleId: string;
  setBatchMoveTargetModuleId: (id: string) => void;
  isBatchMoving: boolean;
  setIsBatchMoving: (moving: boolean) => void;
}

export function useMetadataDialogs(): UseMetadataDialogsResult {
  const [isAddModuleDialogOpen, setIsAddModuleDialogOpen] = useState(false);
  const [isDeleteModuleDialogOpen, setIsDeleteModuleDialogOpen] = useState(false);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [editModuleName, setEditModuleName] = useState('');
  const [editModuleId, setEditModuleId] = useState('');
  const [deleteModuleId, setDeleteModuleId] = useState('');
  const [selectedModuleType, setSelectedModuleType] = useState<'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT'>('API');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importServiceCode, setImportServiceCode] = useState('');
  const [importModuleId, setImportModuleId] = useState('');
  const [importProjectId, setImportProjectId] = useState('');
  const [importApplicationName, setImportApplicationName] = useState('');
  const [importSiteTenant, setImportSiteTenant] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportCreateModuleDialogOpen, setIsImportCreateModuleDialogOpen] = useState(false);
  
  const [isDdlImportDialogOpen, setIsDdlImportDialogOpen] = useState(false);
  const [ddlImportDatabase, setDdlImportDatabase] = useState('');
  const [ddlImportTableName, setDdlImportTableName] = useState('');
  const [ddlImportModuleId, setDdlImportModuleId] = useState('');
  const [ddlImportEnvironmentId, setDdlImportEnvironmentId] = useState('');
  const [ddlImportEnvironments, setDdlImportEnvironments] = useState<Environment[]>([]);
  const [isDdlImporting, setIsDdlImporting] = useState(false);
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadModuleId, setUploadModuleId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [isDeleteDefinitionDialogOpen, setIsDeleteDefinitionDialogOpen] = useState(false);
  const [deleteDefinitionId, setDeleteDefinitionId] = useState<string | null>(null);
  const [deleteDefinitionName, setDeleteDefinitionName] = useState<string>('');

  const [isBatchMoveDialogOpen, setIsBatchMoveDialogOpen] = useState(false);
  const [batchMoveTargetModuleId, setBatchMoveTargetModuleId] = useState<string>('');
  const [isBatchMoving, setIsBatchMoving] = useState(false);

  return {
    isAddModuleDialogOpen,
    setIsAddModuleDialogOpen,
    isDeleteModuleDialogOpen,
    setIsDeleteModuleDialogOpen,
    isEditModuleDialogOpen,
    setIsEditModuleDialogOpen,
    editModuleName,
    setEditModuleName,
    editModuleId,
    setEditModuleId,
    deleteModuleId,
    setDeleteModuleId,
    selectedModuleType,
    setSelectedModuleType,
    isSubmitting,
    setIsSubmitting,
    isImportDialogOpen,
    setIsImportDialogOpen,
    importUrl,
    setImportUrl,
    importServiceCode,
    setImportServiceCode,
    importModuleId,
    setImportModuleId,
    importProjectId,
    setImportProjectId,
    importApplicationName,
    setImportApplicationName,
    importSiteTenant,
    setImportSiteTenant,
    isImporting,
    setIsImporting,
    isImportCreateModuleDialogOpen,
    setIsImportCreateModuleDialogOpen,
    isDdlImportDialogOpen,
    setIsDdlImportDialogOpen,
    ddlImportDatabase,
    setDdlImportDatabase,
    ddlImportTableName,
    setDdlImportTableName,
    ddlImportModuleId,
    setDdlImportModuleId,
    ddlImportEnvironmentId,
    setDdlImportEnvironmentId,
    ddlImportEnvironments,
    setDdlImportEnvironments,
    isDdlImporting,
    setIsDdlImporting,
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    uploadFile,
    setUploadFile,
    uploadModuleId,
    setUploadModuleId,
    isUploading,
    setIsUploading,
    isDeleteDefinitionDialogOpen,
    setIsDeleteDefinitionDialogOpen,
    deleteDefinitionId,
    setDeleteDefinitionId,
    deleteDefinitionName,
    setDeleteDefinitionName,
    isBatchMoveDialogOpen,
    setIsBatchMoveDialogOpen,
    batchMoveTargetModuleId,
    setBatchMoveTargetModuleId,
    isBatchMoving,
    setIsBatchMoving,
  };
}

