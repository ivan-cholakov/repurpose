// "/" is rewritten to a landing variant by the A/B split in src/proxy.ts.
// This fallback (variant A) only renders if the proxy is bypassed entirely.
export { default } from "./(landing)/variant-a/page";
