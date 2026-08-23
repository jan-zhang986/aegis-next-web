/**
 * Bug 管理 API URL 常量
 * 从 AegisOne 迁移
 */

export const bugUrls = {
  getPlatform: '/bug/current-platform/',
  checkBugExist: '/bug/check-exist/',
  postTableListUrl: '/bug/page',
  postUpdateBugUrl: '/bug/update',
  postBatchUpdateBugUrl: '/bug/batch-update',
  postCreateBugUrl: '/bug/add',
  getDeleteBugUrl: '/bug/delete/',
  postBatchDeleteBugUrl: '/bug/batch-delete',
  getTemplateUrl: '/bug/template/detail',
  getTemplateOption: '/bug/template/option',
  getExportConfigUrl: '/bug/export/columns/',
  getTemplateDetailUrl: '/bug/template/detail',
  // 同步缺陷开源
  getSyncBugOpenSourceUrl: '/bug/sync/',
  // 同步缺陷企业版
  getSyncBugEnterpriseUrl: '/bug/sync/all',
  // 获取同步状态
  getSyncStatusUrl: '/bug/sync/check/',
  postExportBugUrl: '/bug/export',
  // 获取关联文件列表
  postAssociatedFileListUrl: '/bug/attachment/file/page',
  getBugDetailUrl: '/bug/get/',
  getFollowBugUrl: '/bug/follow/',
  getUnFollowBugUrl: '/bug/unfollow/',
  postUpdateCommentUrl: '/bug/comment/update',
  postCreateCommentUrl: '/bug/comment/add',
  getCommentListUrl: '/bug/comment/get/',
  getDeleteCommentUrl: '/bug/comment/delete/',
  getCustomFieldHeaderUrl: '/bug/header/custom-field/',
  getCustomOptionHeaderUrl: '/bug/header/columns-option/',
  // 上传or关联文件
  uploadOrAssociationFileUrl: '/bug/attachment/upload',
  // 转存文件
  transferFileUrl: '/bug/attachment/transfer',
  // 获取文件转存目录
  getTransferTreeUrl: '/bug/attachment/transfer/options/',
  // 预览文件
  previewFileUrl: '/bug/attachment/preview',
  // 下载文件
  downloadFileUrl: '/bug/attachment/download',
  // 检查文件是否更新
  checkFileIsUpdateUrl: '/bug/attachment/check-update',
  // 更新文件
  getFileIsUpdateUrl: '/bug/attachment/update',
  // 删除文件或取消关联用例文件
  deleteFileOrCancelAssociationUrl: '/bug/attachment/delete',
  // 获取附件列表
  getAttachmentListUrl: '/bug/attachment/list/',
  // 富文本编辑器上传图片
  editorUploadFileUrl: '/bug/attachment/upload/md/file',
  // 获取回收站列表
  getRecycleListUrl: '/bug/trash/page',
  // 单个恢复
  getRecoverSingleUrl: '/bug/trash/recover/',
  // 批量恢复
  getBatchRecoverUrl: '/bug/trash/batch-recover',
  // 删除
  getDeleteSingleUrl: '/bug/trash/delete/',
  // 批量删除
  getBatchDeleteUrl: '/bug/trash/batch-delete',
  // 获取关联的需求列表
  getDemandListUrl: '/bug/case/page',
  // 批量添加关联
  postAddDemandUrl: '/bug/case/relate',
  // 单个取消关联
  getCancelDemandUrl: '/bug/case/un-relate',
  // 未关联的用例列表
  getUnrelatedDemandListUrl: '/bug/case/un-relate/page',
  // 未关联的模块树
  getUnrelatedModuleTreeUrl: '/bug/case/un-relate/module/tree',
  // 未关联的模块树 数量
  getUnrelatedModuleTreeCountUrl: '/bug/case/un-relate/module/count',
  // 缺陷管理-变更历史-列表
  getChangeHistoryListUrl: '/bug/history/page',
  // 缺陷用例跳转用例是否具备权限
  checkCasePermissionUrl: '/bug/case/check-permission',
  // 缺陷预览富文本url
  EditorPreviewFileUrl: '/bug/attachment/preview/md',
  // 飞书业务线选项（与飞书接口一致，value=id、只展示 name）
  getFeishuBusinessLineOptionsUrl: '/bug/feishu/business-line-options',
  // 飞书缺陷原因选项（从飞书 Open API 拉取 field_e84b00 枚举，与业务线一样不走写死）
  getFeishuDefectReasonOptionsUrl: '/bug/feishu/defect-reason-options',
  // 飞书字段枚举（通用，按 fieldKey 拉取，供全部枚举下拉不走写死）
  getFeishuFieldOptionsUrl: '/bug/feishu/field-options',
  // 飞书评论列表
  getFeishuCommentsUrl: '/bug/feishu-comments/',
  // 飞书变更历史（操作记录）
  getFeishuHistoryUrl: '/bug/feishu/history/',
} as const;
