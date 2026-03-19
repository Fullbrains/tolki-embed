# /v1/embed/{bot_key}/chat/{session_id}/message?include_docs=true

Detailed reference for the embed chat endpoint when document payloads are requested via include_docs=true.

## Purpose

Use this endpoint to send a user utterance to an embed bot and obtain both the conversational reply *and* the retrieval
telemetry (search query plus ranked documents) that the agent relied on while responding. This is helpful for building
traceable, auditable chat experiences where clients must display the supporting evidence alongside the generated answer.

## Request

*Method*: POST
*Path*: /v1/embed/{bot_key}/chat/{session_id}/message
*Required path params*:

- bot_key UUID of the bot being addressed.
- session_id UUID representing the end-user chat session.
  *Query params*:
- include_docs set to true to surface document telemetry. Defaults to false, which strips document entries from the
  response.
  *Body*:

json
{
"message": "<end-user question>"
}

Both identifiers are validated server-side; malformed UUIDs or empty messages return a 400 error with an explanatory
error string.

## Response Structure (with include_docs=true)

The endpoint always responds with an ordered JSON array. Each element represents a typed message emitted by the agent
orchestration pipeline. Typical types are:

markdown/text: Main natural-language reply. Field: content (Markdown string).
document_search_query: Telemetry for every retrieval call. Fields: query (what was searched) and search_id (UUID linking
to the matching document_search_results).
document_search_results: Ranked evidence chunks tied to the preceding search. Fields: search_id plus documents, where
every document has filename, text (chunk body), and score (similarity rank).
Product/cart/appointment payloads: product, show_carts, show_order, and appointment_confirmation mirror the shapes
defined in src/models/user_response.py and appear whenever the agent triggers those workflows.

When include_docs=false (default), any document_search_query and document_search_results items are stripped before the
response leaves the server; all other message types continue to flow unchanged.

### Example

json
[
{
"content": "Here is a sample assistant reply with Markdown formatting, bullet lists, and any other narrative the agent
chooses to include in the final response to the end user.",
"type": "markdown"
},
{
"query": "<search keywords issued by the retriever>",
"search_id": "11111111-2222-3333-4444-555555555555",
"type": "document_search_query"
},
{
"documents": [
{
"filename": "DOCUMENT_A.pdf",
"text": "First chunk of source content with headings and snippets that justify the response.",
"score": 0.88
},
{
"filename": "DOCUMENT_B.pdf",
"text": "Second chunk pulled from another document or a different section of the same file.",
"score": 0.42
},
{
"filename": "DOCUMENT_C.pdf",
"text": "Additional supporting excerpt summarizing the relevant policy or procedure.",
"score": 0.37
},
{
"filename": "DOCUMENT_D.pdf",
"text": "Optional chunk illustrating that the retriever can emit multiple entries per query.",
"score": 0.24
},
{
"filename": "DOCUMENT_E.pdf",
"text": "Final chunk showing the tail of the ranked list (low scores are still surfaceable).",
"score": 0.18
}
],
"search_id": "66666666-7777-8888-9999-000000000000",
"type": "document_search_results"
}
]

In this trace the second object shows what the retriever searched (subentro uditore); the third exposes every matching
snippet, enabling clients to render transparent citations. Additional assistant messages (e.g., further markdown replies
or product cards) would appear in the same array following the ordering enforced in src/models/user_response.py.

## Notes

The order of array elements is deterministic: assistant markdown first, then document_search_query,
document_search_results, and finally commerce/appointment payloads.
search_id acts as the join key between telemetry and document payloads; expect multiple document_search_results blocks
when the agent runs several retrieval passes.
The WhatsApp/WAJS endpoint /v1/wajs/{bot_key}/chat/message never emits document payloads, regardless of query
parameters.