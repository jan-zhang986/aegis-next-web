/**
 * Message Management API URLs
 * 与 spotter-metersphere 原项目一致：/notice/...
 */

export const MESSAGE_API = {
  // 消息配置（原项目 requrls: GetMessageUrl, SaveMessageUrl, GetMessageUserListUrl, GetMessageDetailUrl, GetMessageFieldsUrl）
  MESSAGE_LIST: '/notice/message/task/get',
  MESSAGE_SAVE: '/notice/message/task/save',
  MESSAGE_USER_LIST: '/notice/message/task/get/user',
  MESSAGE_DETAIL: '/notice/message/template/detail',
  MESSAGE_FIELDS: '/notice/template/get/fields',

  // 机器人管理（原项目 RobotListUrl 等，仍为 /project/robot/...）
  ROBOT_LIST: '/project/robot/list',
  ROBOT_ADD: '/project/robot/add',
  ROBOT_UPDATE: '/project/robot/update',
  ROBOT_DELETE: '/project/robot/delete',
  ROBOT_TOGGLE: '/project/robot/enable',
} as const;
