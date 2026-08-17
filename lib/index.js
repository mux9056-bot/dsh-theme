// dsh-theme — server-side (node) half.
//
// This is a pure client plugin: all functionality lives in the browser bundle
// (`./client` → lib/client.js), which the DSH client-modules loader serves and
// instantiates in the web UI. The DSH cordis loader nevertheless requires every
// loader entry to import as a valid Cordis plugin (it constructs a fiber), so
// this file exists as the package's importable `main`: a minimal no-op plugin.
const name = "dsh-theme";

/** No-op node half — the client bundle owns the theme UI. */
function apply() {
	// Intentionally empty: nothing to host server-side.
}

export { apply, name };
