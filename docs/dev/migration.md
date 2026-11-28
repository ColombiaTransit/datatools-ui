# Migration

## Migrating manager application data
datatools-server offers a way to migrate application data (e.g., due to either breaking application schema changes or server changes). **Note:** this process requires temporarily exposing a `GET` request that exposes the entirety of the manager database.

1. Set the config setting `modules:dump:enabled` to `true`.
2. Restart the application.
3. Download copy of application data to local json file `curl localhost:4000/dump > db_backup.json`.
4. Change dump config setting back to `false`.
5. (optional) If looking to reload into the existing server, delete the manager mapdb (`.db` and `.dbp`) files in `application:data:mapdb`
6. Follow instructions in [`/scripts/load.py`](https://github.com/ibi-group/datatools-ui/blob/master/scripts/load.py) to upload the json data to the new server.

## React 18 preview baseline for the map editor migration

The accepted baseline is [`a496c5a`](https://github.com/ColombiaTransit/datatools-ui/commit/a496c5a56a5a9e069d79f42d19a7d825cafeb591) from [PR #16](https://github.com/ColombiaTransit/datatools-ui/pull/16).
The commit-specific image is `ghcr.io/colombiatransit/datatools-ui:sha-a496c5a56a5a9e069d79f42d19a7d825cafeb591`.

Verified on the test deployment on 28 November 2026:

- Keycloak sign-in and navigation to the Cartagena project and the TransCaribe feed.
- Opening version 2, the map editor, route A111 and its trip pattern with the shape and numbered stops.
- Adding La Castellana as stop 3 on `21 - test route`, saving, reloading and confirming the stop sequence and map marker.

Use the same checks when reviewing map editor changes. The baseline session did not verify saving a moved shape vertex or drawing and editing a flex-location polygon.
