export const state = {
  ACTIVE_CONVERSATION_ID: null,
  ACTIVE_GROUP_ID: null,
  ACTIVE_CHAT_OTHER_USER_ID: null,  // Store the other user's ID for personal chats
  CURRENT_USER_ID: null,
  CURRENT_USER_AVATAR: null,
  CURRENT_USER_MESSAGE_COLOR: "#6b7280",  // Default grey
  allConversations: [],
  CAME_FROM_FRIENDS: false,
  CAME_FROM_GROUPS: false,
  VIEWING_PROFILE_USER_ID: null,  // Track which user's profile is being viewed
  PROFILE_VIEW_PREVIOUS_TAB: null,  // Track which tab we came from
  PROFILE_VIEW_PREVIOUS_CONVERSATION_ID: null,  // Track conversation ID before viewing profile
  PROFILE_VIEW_PREVIOUS_GROUP_ID: null,  // Track group ID before viewing profile
  PROFILE_VIEW_PREVIOUS_PAGE_TITLE: null,  // Track page title before viewing profile
  NAVIGATION_HISTORY: []  // Stack-based navigation history: [{type: 'chats'|'chat'|'group'|'profile'|'friends'|'groups'|'settings', data: {...}}]
}