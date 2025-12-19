# Practical Refactoring Example
## Step-by-Step: Extracting API Calls

This shows you how to start refactoring your `app.js` file by extracting API calls into a separate module.

---

## 📋 **Step 1: Create the API Module**

Create a new file: `backend/static/js/modules/api.js`

```javascript
// backend/static/js/modules/api.js

/**
 * Centralized API calls for the application
 * All fetch requests should go through these functions
 */

const API_BASE = ""  // Empty because we're using relative URLs
const API_CONFIG = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json"
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/me`, { credentials: "include" })
    if (!res.ok) throw new Error("Failed to fetch user")
    return await res.json()
  } catch (error) {
    console.error("Error fetching user:", error)
    throw error
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations() {
  try {
    const res = await fetch(`${API_BASE}/conversations`, { credentials: "include" })
    if (!res.ok) throw new Error("Failed to fetch conversations")
    return await res.json()
  } catch (error) {
    console.error("Error fetching conversations:", error)
    throw error
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getMessages(conversationId) {
  try {
    const res = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages`,
      { credentials: "include" }
    )
    if (!res.ok) throw new Error("Failed to fetch messages")
    return await res.json()
  } catch (error) {
    console.error("Error fetching messages:", error)
    throw error
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(conversationId, content) {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      ...API_CONFIG,
      body: JSON.stringify({
        conversation_id: conversationId,
        content: content
      })
    })
    if (!res.ok) throw new Error("Failed to send message")
    return await res.json()
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}
```

---

## 📋 **Step 2: Update app.js to Use the Module**

**Before (current code):**
```javascript
// Line 54-64
fetch("/me", { credentials: "include" })
  .then(res => res.json())
  .then(data => {
    CURRENT_USER_ID = data.id
    CURRENT_USER_AVATAR = data.avatar
    // ...
  })

// Line 97-99
const res = await fetch("/conversations", {
  credentials: "include"
})
const conversations = await res.json()

// Line 284-287
const res = await fetch(
  `/conversations/${ACTIVE_CONVERSATION_ID}/messages`,
  { credentials: "include" }
)
const messages = await res.json()

// Line 354-362
await fetch("/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    conversation_id: ACTIVE_CONVERSATION_ID,
    content: text
  })
})
```

**After (refactored):**
```javascript
// At the top of app.js, add:
import { getCurrentUser, getConversations, getMessages, sendMessage as apiSendMessage } from './modules/api.js'

// Replace line 54-64:
getCurrentUser()
  .then(data => {
    CURRENT_USER_ID = data.id
    CURRENT_USER_AVATAR = data.avatar
    const avatarImg = document.querySelector(".avatar-nav img")
    if (avatarImg && data.avatar) {
      avatarImg.src = `/static/avatars/${data.avatar}`
    }
  })
  .catch(error => {
    console.error("Failed to load user:", error)
  })

// Replace line 97-99:
const conversations = await getConversations()

// Replace line 284-287:
const messages = await getMessages(ACTIVE_CONVERSATION_ID)

// Replace line 354-362:
await apiSendMessage(ACTIVE_CONVERSATION_ID, text)
```

---

## 📋 **Step 3: Update HTML to Support Modules**

**Update `backend/templates/app.html`:**

```html
<!-- Change this line: -->
<script src="{{ url_for('static', filename='js/app.js') }}"></script>

<!-- To this: -->
<script type="module" src="{{ url_for('static', filename='js/app.js') }}"></script>
```

The `type="module"` tells the browser to treat the script as an ES6 module, which allows `import`/`export`.

---

## ✅ **Benefits of This Refactoring:**

1. **Single Source of Truth** - All API endpoints in one place
2. **Easy to Update** - Change URL structure in one place
3. **Error Handling** - Consistent error handling across all API calls
4. **Reusable** - Can use these functions anywhere in your app
5. **Testable** - Easy to mock for testing later

---

## 🎯 **Next Steps:**

After this works, you can:
1. Extract chat rendering to `modules/chat.js`
2. Extract message handling to `modules/messages.js`
3. Extract navigation to `modules/navigation.js`

Each step makes your code more organized and maintainable!

---

## ⚠️ **Important Notes:**

- **Browser Support**: ES6 modules work in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Local Testing**: You may need to run a local server (Flask does this automatically)
- **File Paths**: Make sure your import paths are correct relative to `app.js`

