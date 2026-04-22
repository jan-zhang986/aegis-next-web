# 组织相关功能迁移对照（参考 spotter-metersphere/frontend）

## 一、系统级「组织与项目」页（SystemOrganizationProjectView）

| 功能 | 参考项目 | 当前 keeper-one-web | 说明 |
|------|----------|--------------------|------|
| 组织 / 项目 Tab | ✅ | ✅ | 一致 |
| 组织表格列 | 序号、名称、成员数、项目数、状态、描述、创建人/时间、操作 | 序号、名称、统计数据(成员/项目)、运行状态、描述、操作 | 已迁移，列名略有差异 |
| 项目表格列 | 序号、名称、成员数、状态、描述、所属组织、创建人/时间、操作 | 序号、项目基础信息、所属组织、当前状态、备注、操作 | 已迁移 |
| 组织行操作 | 编辑、添加成员、切换并进入、更多→删除/启用/禁用、已删除→撤销删除 | 添加成员、进入组织、编辑、启用（禁用态时） | ✅ 已迁移 |
| 项目行操作 | 编辑、添加成员、进入项目、更多→删除/启用/禁用、已删除→撤销删除 | 编辑项目、添加成员、进入项目、禁用/激活、移除、已删除→撤销删除 | ✅ 已迁移 |
| 添加成员弹窗 | AddUserModal（组织/项目共用） | AddMemberModal（type=org/project） | ✅ 已迁移 |
| 成员列表侧滑（UserDrawer） | 按组织/项目查成员列表，加人、改用户组、移除成员 | ✅ MemberDrawer | 已实现：查看成员、添加成员、移除成员 |
| 组织下项目列表侧滑（ProjectDrawer） | 仅组织 Tab，点击行展示该组织下项目列表（只读） | ✅ ProjectDrawer | 已实现：只读列表，搜索、分页 |

---

## 二、组织级子页（进入组织后）

| 子页 | 参考项目 | 当前 keeper-one-web | 说明 |
|------|----------|--------------------|------|
| 成员 | member：列表、添加、邮箱邀请、编辑、删除、批量加入项目/用户组 | OrgMemberView：列表、添加、邮箱邀请、编辑、删除、**批量加入项目、批量加入用户组** | ✅ 已迁移 |
| 用户组 | usergroup：左侧用户组列表增删改、右侧用户/权限 | SystemUserGroupView(scope=organization) | ✅ 已迁移 |
| 项目管理 | project：列表、创建/编辑、加成员、进入项目、启用/禁用、撤销删除、删除 | OrgProjectView：列表、创建/编辑、删除/恢复、启用/禁用、进入项目 | ✅ 已迁移（组织内无「添加成员」可考虑用系统 AddMemberModal 或组织项目接口） |
| 服务集成 | serviceIntegration：列表、配置/新增、编辑、测试连接、启用/禁用、重置 | OrgServiceIntegrationView：列表、配置、测试、启用/禁用、重置 | ✅ 已迁移 |
| 模板管理 | template：字段设置、模板管理、工作流 | OrgTemplateView + TemplateFieldSetting/List/Workflow | ✅ 已迁移 |
| 任务中心 | taskCenter | SystemTaskCenterView(scope=organization) | ✅ 已迁移；组织三级菜单已补「任务中心」Tab |
| 成员日志 | log：mode=ORGANIZATION | OrgLogView + orgLogService | ✅ 已迁移 |

---

## 三、API / 服务对照

| 能力 | 参考项目 | 当前 keeper-one-web |
|------|----------|--------------------|
| 组织 CRUD / 列表 / 启用禁用 / 恢复 | postOrgTable、createOrUpdateOrg、deleteOrg、revokeDeleteOrg、enableOrDisableOrg | organization-project.ts：getOrgList、addOrg、updateOrg、deleteOrg、revokeOrg、enableOrg、disableOrg |
| 系统项目 CRUD / 列表 / 启用禁用 / 恢复 | postProjectTable、createOrUpdateProject、deleteProject… | organization-project.ts：getProjectList、addProject、updateProject、deleteProject、revokeProject、enableProject、disableProject |
| 组织/项目成员列表、添加、移除 | postUserTableByOrgIdOrProjectId、addUserToOrgOrProject、deleteUserFromOrgOrProject | organization-project.ts：getMemberListPage、addOrgMember、addProjectMember；member.ts 组织成员：getMemberList、addMember、deleteMember |
| 组织成员：批量加入项目/用户组 | batchAddProject、batchAddUserGroup（组织维度） | member.ts：batchAddProject、batchAddUserGroup；OrgMemberView 多选 + 批量加入项目/用户组弹窗 |
| 组织下项目列表（组织内） | postProjectTableByOrg、createOrUpdateProjectByOrg… | org-project.ts：getProjectList、addProject、updateProject、deleteProject、enableProject、disableProject、revokeProject |
| 组织日志 | GetOrgLogListUrl、GetOrgLogOptionsUrl、GetOrgLogUserUrl | log.ts：orgLogService.getOrgLogList、getOrgLogOptions、getOrgLogUsers |
| 组织服务集成 | getServiceList(organizationId)、addOrUpdate、getValidate、resetService | service-integration.ts：getServiceList(organizationId) 等 |

---

## 四、已完成的补齐

- 组织三级菜单已增加「任务中心」（`org-taskCenter`），与参考项目一致。
- 系统组织与项目页：添加成员、进入组织、进入项目、统一路由（getSettingUrl、getProjectManagementUrl）已实现。
- **MemberDrawer**：组织/项目行「查看成员」打开侧滑，当前成员列表、添加成员、移除成员（API：getCurrentMemberList、removeOrgMember、removeProjectMember）。
- **ProjectDrawer**：组织行「查看项目」打开侧滑，只读展示该组织下项目（getProjectListByOrgId）。
- **组织成员批量**：OrgMemberView 表格多选 +「批量加入项目」「批量加入用户组」及弹窗，member.ts 新增 batchAddProject、batchAddUserGroup。

---

## 五、建议后续补齐（可选）

1. ~~**系统组织/项目页 - 成员列表侧滑（UserDrawer）**~~  
   **已实现**：`MemberDrawer`，组织/项目行「查看成员」打开侧滑，支持列表、添加成员、移除成员。

2. ~~**系统组织页 - 组织下项目列表侧滑（ProjectDrawer）**~~  
   **已实现**：`ProjectDrawer`，组织行「查看项目」打开侧滑，只读展示该组织下项目（调用 `getProjectListByOrgId`，当前使用 `POST /system/project/page` 传 `organizationId`，若后端为单独接口可改为 `POST /system/organization/project-list`）。

3. ~~**组织成员 - 批量加入项目/用户组**~~  
   **已实现**：`orgMemberService.batchAddProject`、`batchAddUserGroup`；OrgMemberView 表格多选 + 工具栏「批量加入项目」「批量加入用户组」及弹窗（需后端提供 `POST /organization/batch-add-project`、`POST /organization/batch-add-user-role`）。

---

## 六、后端接口约定（供联调）

- **当前成员列表（侧滑）**：`POST /system/organization/user-table`（组织）、`POST /system/project/user-table`（项目），请求体含 `organizationId` 或 `projectId`、`current`、`pageSize`、可选 `keyword`。
- **移除成员**：`GET /system/organization/remove-member/:organizationId/:userId`、`GET /system/project/remove-member/:projectId/:userId`。
- **组织下项目列表**：当前使用 `POST /system/project/page` 传 `organizationId`；若后端为单独接口可改为 `POST /system/organization/project-list`。
- **组织成员批量**：`POST /organization/batch-add-project`、`POST /organization/batch-add-user-role`，请求体含 `organizationId`、`userIds`、`projectIds` 或 `roleIds`。

---

参考前端路径：`/Users/jan/IdeaProjects/spotter-metersphere/frontend`  
- 系统组织与项目：`views/setting/system/organizationAndProject/`  
- 组织子页：`views/setting/system/organization/`（member、usergroup、project、serviceIntegration、template、taskCenter、log）
