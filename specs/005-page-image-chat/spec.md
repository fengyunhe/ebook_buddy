# Feature Specification: Page Image Capture for AI Chat

**Feature Branch**: `005-page-image-chat`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "作为电子书的读者，当对正在阅读的书籍当前页的内容有疑惑时，可以在当前页上右键，当前页面的内容将作为图片添加到AI对话的图片中；支持将多个页面加入到图片中，不过已经加入到页码不允许重复加入；一次对话最多可以加入10张图片；"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Right-click to capture current page as image (Priority: P1)

As an ebook reader, when I have a question about the content on the current page I'm reading, I want to right-click on the page so that the page content is captured as an image and added to the AI chat's image input, allowing me to ask the AI about that specific page.

**Why this priority**: This is the core interaction that enables users to get AI assistance about specific page content. Without this, the feature cannot exist.

**Independent Test**: Can be fully tested by right-clicking on any page while reading an ebook and verifying the page image appears in the AI chat image input.

**Acceptance Scenarios**:

1. **Given** the user is reading an ebook and viewing a specific page, **When** the user right-clicks on the page, **Then** the current page content is captured as an image and added to the AI chat's image input.
2. **Given** the user is reading an ebook, **When** the user right-clicks on page 5 which has not been added before, **Then** page 5 is successfully added to the AI chat images.

---

### User Story 2 - Add multiple pages to AI chat (Priority: P2)

As an ebook reader, I want to add multiple pages as images to the AI chat so that I can ask the AI to compare or analyze content across several pages.

**Why this priority**: Users often need to reference multiple pages in a single conversation to get comprehensive help.

**Independent Test**: Can be fully tested by adding 3 different pages as images and verifying all appear in the AI chat.

**Acceptance Scenarios**:

1. **Given** page 3 is already added to AI chat images, **When** the user right-clicks on page 7, **Then** page 7 is also added, resulting in 2 images total.
2. **Given** the user has added 5 pages as images, **When** the user opens a new AI conversation, **Then** the image list is empty and starts fresh.

---

### User Story 3 - Prevent duplicate page additions (Priority: P2)

As an ebook reader, I want the system to prevent adding the same page twice so that I don't have redundant images cluttering the AI conversation.

**Why this priority**: Prevents user confusion and wasted resources from duplicate page captures.

**Independent Test**: Can be tested by attempting to add the same page twice and verifying the system rejects the second attempt with appropriate feedback.

**Acceptance Scenarios**:

1. **Given** page 10 has already been added to AI chat images, **When** the user right-clicks on page 10 again, **Then** the system displays a notification indicating the page is already added and does not add a duplicate.
2. **Given** page 5 is already in the added images list, **When** the user right-clicks on page 5, **Then** the operation is rejected with a message like "Page 5 has already been added".

---

### User Story 4 - Limit maximum images per conversation (Priority: P2)

As an ebook reader, I want the system to enforce a maximum of 10 images per AI conversation so that performance and usability are maintained.

**Why this priority**: Prevents excessive resource usage and ensures the AI can process the conversation efficiently.

**Independent Test**: Can be tested by attempting to add an 11th image and verifying the system rejects it.

**Acceptance Scenarios**:

1. **Given** the user has already added 10 pages as images to the current AI conversation, **When** the user right-clicks on a new page, **Then** the system displays a message indicating the maximum limit (10 images) has been reached and does not add more.
2. **Given** the user has added 9 images, **When** the user adds one more page, **Then** the operation succeeds and the total becomes 10 images.

---

### Edge Cases

- What happens when the user tries to add a page while no book is open?
- How does the system handle extremely long pages (scroll capture)?
- What happens when the user switches to a different book - does the added page list reset?
- How does the system handle PDF vs EPUB format differences in page capture?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a right-click context menu option on the current reading page to capture the page as an image.
- **FR-002**: The system MUST add the captured page image to the AI chat's image input when the user selects the right-click option.
- **FR-003**: The system MUST support adding multiple page images to a single AI conversation.
- **FR-004**: The system MUST prevent adding the same page number twice to the same conversation, displaying appropriate feedback when attempted.
- **FR-005**: The system MUST enforce a maximum of 10 images per AI conversation.
- **FR-006**: When the maximum limit is reached, the system MUST display a clear message to the user indicating the limit has been exceeded.
- **FR-007**: The system MUST maintain the list of added page images throughout the current conversation session.
- **FR-008**: The system MUST reset the added page list when starting a new AI conversation.

### Key Entities

- **PageImage**: Represents a captured page image added to AI chat, contains page number, image data, and timestamp.
- **ConversationImageList**: Maintains the list of page images for the current AI conversation session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully capture a page as image and add it to AI chat within 2 clicks (right-click + menu selection).
- **SC-002**: 100% of page capture attempts result in a valid image being added to the chat.
- **SC-003**: The system correctly prevents 100% of duplicate page addition attempts.
- **SC-004**: Users receive immediate feedback (within 1 second) when attempting to add a duplicate page or exceed the 10-image limit.
- **SC-005**: At least 95% of users can successfully add multiple pages to a single conversation without issues.

## Assumptions

- Users have basic familiarity with right-click interactions in desktop applications.
- The existing AI chat system already supports image input functionality.
- Page capture captures the visible portion of the page content (not full scroll).
- The added page images persist within the conversation context and are not saved across sessions.
- The page number used for tracking is the logical page number in the ebook's reading order.
- The feature is desktop-only for this version; mobile support is out of scope.