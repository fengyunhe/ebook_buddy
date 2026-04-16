# Feature Specification: 完善AI助手设置界面

**Feature Branch**: `004-ai-settings-api-key`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "1、完善和优化现有的AI助手设置界面，增加api key的的设置，避免key泄露；2、oMLX 的默认端口应该是 8000；3、Base URL 是与OpenAI兼容的接口，所以遵其他软件设置的习惯，Base URL中尾部应该包含 /v1，那么在调用endpoint具体接口的时候就不需要在url中以/v1开头了。根据AI助手设置界面的现状和我前面提到的修改意见完善此spec文档。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 安全配置API密钥 (Priority: P1)

用户需要在AI助手设置中配置API密钥，用于访问需要认证的AI服务。

**Why this priority**: API密钥是访问付费AI服务的基本凭证，没有密钥无法使用大多数AI服务，是核心功能。

**Independent Test**: 用户打开设置界面，能够输入并保存API密钥，密钥在后续调用中被使用。

**Acceptance Scenarios**:

1. **Given** 用户首次打开设置界面, **When** 用户在API密钥字段输入密钥并保存, **Then** 密钥被安全存储，后续API调用使用该密钥进行认证
2. **Given** 用户已保存API密钥, **When** 用户重新打开设置界面, **Then** 密码输入框显示为空或掩码，不显示明文
3. **Given** 用户未配置API密钥, **When** 用户尝试使用需要认证的AI服务, **Then** 系统提示用户配置API密钥

---

### User Story 2 - 修正oMLX默认端口 (Priority: P1)

oMLX服务的默认端口应更正为8000，与软件默认配置一致。

**Why this priority**: 用户指定的端口与软件实际默认端口不符会导致连接失败，需修正为正确值。

**Independent Test**: 用户选择oMLX预设，系统使用8000端口连接。

**Acceptance Scenarios**:

1. **Given** 用户选择oMLX服务预设, **When** 系统显示默认连接地址, **Then** 默认端口为8000
2. **Given** 用户选择oMLX预设, **When** 用户保存设置并测试连接, **Then** 使用localhost:8000进行连接

---

### User Story 3 - 标准化Base URL格式 (Priority: P1)

Base URL应包含/v1后缀，与OpenAI兼容接口的行业惯例一致。用户输入的Base URL直接使用，不自动添加/v1。

**Why this priority**: 确保与标准OpenAI兼容接口格式一致，用户按惯例配置URL。

**Independent Test**: 用户配置Base URL为http://localhost:8000/v1，系统调用时直接拼接/audio/transcriptions。

**Acceptance Scenarios**:

1. **Given** 用户输入Base URL为http://localhost:8000/v1, **When** 用户保存设置, **Then** 存储的Base URL为http://localhost:8000/v1（不做修改）
2. **Given** 已配置Base URL为http://localhost:8000/v1, **When** 系统调用转写API, **Then** 请求URL为http://localhost:8000/v1/audio/transcriptions（直接在baseUrl后拼接路径）
3. **Given** 用户输入Base URL不含/v1, **When** 用户保存时, **Then** 系统不自动添加/v1，用户需手动输入完整URL

---

### User Story 4 - 保护密钥安全存储 (Priority: P1)

API密钥必须安全存储，避免在本地配置文件中明文暴露。

**Why this priority**: 密钥泄露会导致AI服务被盗用，造成经济损失和安全风险。

**Independent Test**: 检查存储的配置文件，密钥不以明文形式保存。

**Acceptance Scenarios**:

1. **Given** 用户保存API密钥, **When** 检查浏览器本地存储或配置文件, **Then** 密钥被加密或使用安全方式存储，不以明文形式暴露

---

### Edge Cases

- 用户输入无效URL格式，系统应提示错误
- 网络连接失败时，系统应给出明确的错误信息
- API密钥认证失败时，系统应提示认证错误而非连接错误
- 用户未配置API密钥但服务需要认证时，系统应友好提示配置密钥
- 用户清空API密钥输入框并保存，系统应清除已存储的密钥
- 用户输入Base URL不含/v1，调用会失败（用户需自行确保URL包含/v1）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 提供API密钥输入字段，允许用户配置访问AI服务所需的密钥
- **FR-002**: 系统 MUST 安全存储API密钥，禁止以明文形式保存在配置文件中
- **FR-003**: 系统 MUST 在API密钥输入界面显示掩码或指示符，不显示明文密钥
- **FR-004**: 系统 MUST 将oMLX默认端口设置为8000
- **FR-005**: 系统 MUST 直接使用用户输入的Base URL，用户需确保URL包含完整路径（如/v1），系统不做自动修改
- **FR-006**: 系统 MUST 在保存设置时验证URL格式有效性

### Key Entities *(include if feature involves data)*

- **AI配置**: 包含预设、Base URL、模型、超时、API密钥等连接和认证信息
- **服务预设**: 预定义的服务类型及其默认连接参数

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户能够在一个设置界面完成所有AI连接配置（预设选择、URL、模型、超时、API密钥）
- **SC-002**: oMLX默认端口为8000，用户无需手动修改端口
- **SC-003**: Base URL直接使用，用户配置http://localhost:8000/v1则调用http://localhost:8000/v1/audio/transcriptions
- **SC-004**: API密钥以安全方式存储，不在本地配置文件中明文暴露

## Clarifications

### Session 2026-04-16

- Q: 导出/备份配置功能 → A: 不需要导出设置功能
- Q: API密钥输入方式 → A: 密码输入框，不显示明文
- Q: Base URL的/v1处理 → A: 用户输入完整URL（含/v1），系统直接使用不做修改

## Assumptions

- 用户使用支持OpenAI兼容接口的本地AI服务（Ollama、LM Studio、oMLX等）
- 所有服务都使用相同的认证方式（API Key在Header中传递）
- 已有安全的密钥存储机制可以利用（如Electron的safeStorage）