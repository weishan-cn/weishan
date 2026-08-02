# Conversation Runtime Lifecycle

QUESTION -> NORMALIZE -> INTENT -> CONVERSATION_CONTEXT -> GENERATE_RESPONSE -> REVIEW -> RENDER -> FINISH

FINISH is the only logical terminal state. This lifecycle does not create a task, schedule work, invoke a Provider, or authorize execution.