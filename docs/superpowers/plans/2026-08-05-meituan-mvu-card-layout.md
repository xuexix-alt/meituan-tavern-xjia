# 美人团 MVU 角色卡目录归位 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将今天已完成的美人团 Zod MVU 角色卡资源从初始模板落到 `src` 构建图中，并让 `pnpm build` 生成对应产物。

**Architecture:** 保留 `src/APP` 作为美人团 APP 前端项目；新增独立的 `src/美人团` 角色卡根目录，按角色卡规范承载 `schema.ts`、世界书、变量结构脚本和状态栏界面。角色卡的 schema 由 `pnpm build` 触发的 `dump_schema.ts` 生成 `schema.json`，webpack 自动发现其 `index.ts` 入口。

**Tech Stack:** TypeScript, Vue 3, Pinia, Zod 4, Tavern Helper, webpack 5, pnpm。

## Global Constraints

- 只使用项目 `@types` 中定义的酒馆/MVU接口；角色卡脚本顶部等待 `Mvu` 初始化。
- `schema.ts` 只负责导出 Zod Schema；注册动作放在 `脚本/变量结构/index.ts`。
- 角色卡资源放在 `src/美人团`；`src/APP` 现有前端和今天的故事阅读器实现不迁移、不重命名。
- 保留用户当前未提交的两个 ZIP 删除，不执行恢复、提交或推送。
- 只保留与本次新入口相关的构建产物，避免把 webpack 对既有 `dist` 的无关重写当作源代码改动。

---

### Task 1: Add the directory-layout contract

**Files:**
- Create: `src/美人团/roleCardLayout.test.mjs`

- [ ] **Step 1: Write the failing test**

  Assert that the role-card root, schema, worldbook entries, variable-structure script, MVU script, and status-bar frontend files exist; assert that the character-card YAML points to `dist/美人团` and that the two runtime entry files reference `schema.ts` and wait for MVU initialization.

- [ ] **Step 2: Run the test to verify it fails**

  Run `node --test src/美人团/roleCardLayout.test.mjs`.

  Expected result: FAIL because `src/美人团` has not been created yet.

### Task 2: Materialize the 美人团 role-card sources

**Files:**
- Create: `src/美人团/schema.ts`
- Create: `src/美人团/index.yaml`
- Create: `src/美人团/第一条消息/0.txt`
- Create: `src/美人团/世界书/变量/initvar.yaml`
- Create: `src/美人团/世界书/变量/变量列表.txt`
- Create: `src/美人团/世界书/变量/变量更新规则.yaml`
- Create: `src/美人团/世界书/变量/变量输出格式.yaml`
- Create: `src/美人团/脚本/MVU/index.ts`
- Create: `src/美人团/脚本/变量结构/index.ts`
- Create: `src/美人团/界面/状态栏/App.vue`
- Create: `src/美人团/界面/状态栏/global.css`
- Create: `src/美人团/界面/状态栏/index.html`
- Create: `src/美人团/界面/状态栏/index.ts`
- Create: `src/美人团/界面/状态栏/store.ts`

- [ ] **Step 1: Copy the already-reviewed role-card material**

  Use the current contents of `初始模板/角色卡/新建为src文件夹中的文件夹` as the source, rename the role-card directory to `美人团`, and replace generated URL placeholders `角色卡名称` with `美人团` in `index.yaml`.

- [ ] **Step 2: Keep the schema and registration responsibilities separate**

  Leave `schema.ts` as the pure Zod definition and keep `registerMvuSchema` plus `waitGlobalInitialized('Mvu')` in `脚本/变量结构/index.ts`; keep the status-bar store importing `../../schema` and its frontend entry waiting for message `stat_data`.

- [ ] **Step 3: Run the layout test to verify it passes**

  Run `node --test src/美人团/roleCardLayout.test.mjs`.

  Expected result: PASS.

### Task 3: Build and inspect generated outputs

**Files:**
- Generated: `src/美人团/schema.json`
- Generated: `dist/美人团/**`

- [ ] **Step 1: Build the complete webpack graph**

  Run `pnpm build` and require exit code 0, including the new `美人团/脚本/*` and `美人团/界面/状态栏` entries.

- [ ] **Step 2: Verify the schema output and artifacts**

  Run `Test-Path src/美人团/schema.json`, inspect `dist/美人团`, and run `git diff --check`.

- [ ] **Step 3: Review the final diff**

  Confirm that the two pre-existing ZIP deletions remain untouched, the new role-card sources and generated outputs are present, and no unrelated build churn is included in the handoff.
