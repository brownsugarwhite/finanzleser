# WP Headless Bridge — finanzleser-headless.php

Mu-plugin für die Brücke zwischen WordPress-CMS und Next.js-Frontend.
Wird im **WP-Webspace** deployed, nicht von Next.js.

## Deploy

```bash
# zu Staging
lftp -u ACC,'PWD' -p 22 sftp://HOST -e "
  put wp-headless/finanzleser-headless.php -o wp-content/mu-plugins/finanzleser-headless.php
"
```

## Konfiguration

Drei `define()` in `wp-config.php` der jeweiligen WP-Instanz nötig:

```php
define( 'FL_HEADLESS_FRONTEND_URL',     'https://finanzleser-staging.netlify.app' );
define( 'FL_HEADLESS_PREVIEW_SECRET',   'hex(24)' );
define( 'FL_HEADLESS_REVALIDATE_SECRET','hex(24)' );
```

Plugin aktiviert sich nur wenn alle drei gesetzt sind.

## Korrespondierende Next.js-Routen

- `app/api/preview/route.ts` (env: `WP_PREVIEW_SECRET`)
- `app/api/revalidate/route.ts` (env: `WP_REVALIDATE_SECRET`)

## Sync-Pflicht

`fl_headless_main_category_slugs()` MUSS synchron zu `MAIN_CATEGORY_SLUGS` in
[lib/categories.ts](../lib/categories.ts) bleiben.
