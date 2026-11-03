# Security

Each page runs entirely in the browser, with no server, accounts or network access. A Content-Security-Policy in every
page blocks all requests and allows only the page's own scripts, by hash. Numbers people type are kept in the browser's
`localStorage`. They are treated as untrusted when read back: the page rebuilds them on top of the built-in example,
keeping only numbers in a sensible range and the allowed choices.

What we treat as security issues:
- anything that lets stored data, an address or a crafted file run script or change the page;
- anything that makes a page contact a server;
- input that freezes or crashes a page.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting: the **Security** tab of this repository, then **Report a
vulnerability**. Please don't open a public issue for a security problem. We aim to reply within a week.
