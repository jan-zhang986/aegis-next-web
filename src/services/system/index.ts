/**
 * System API Service
 * Ported from aegis-rag-frontend
 */

import { http } from '@/utils/request';

const API = '/rag/v1';

export interface SystemInfo {
    version: string;
    commit_id?: string;
    build_time?: string;
    go_version?: string;
    keyword_index_engine?: string;
    vector_store_engine?: string;
    graph_database_engine?: string;
    minio_enabled?: boolean;
}

export interface MinioBucketInfo {
    name: string;
    policy: 'public' | 'private' | 'custom';
    created_at?: string;
}

export interface ListMinioBucketsResponse {
    buckets: MinioBucketInfo[];
}

export const systemService = {
    getSystemInfo: () => http.get<{ data: SystemInfo }>(`${API}/system/info`),

    listMinioBuckets: () => http.get<{ data: ListMinioBucketsResponse }>(`${API}/system/minio/buckets`),
};
