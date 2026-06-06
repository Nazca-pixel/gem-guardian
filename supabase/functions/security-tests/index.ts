// Placeholder so this directory is a valid edge function.
// The real content of this folder is the test file (index_test.ts).
// This function is not intended to be called.
Deno.serve(() => new Response("test-only", { status: 200 }));
