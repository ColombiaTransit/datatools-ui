# datatools-ui

[![Join the chat at https://matrix.to/#/#transit-data-tools:gitter.im](https://badges.gitter.im/repo.png)](https://matrix.to/#/#transit-data-tools:gitter.im)


> [!NOTE]  
> We are working on revamping our project, feed, and deployment manager. We are looking for input from the open source community. If you have questions, concerns, ideas, or would like to be part of the process, please join in the gitter.


The core application for IBI Group's TRANSIT-Data-Tools suite. This application provides GTFS editing, management, validation, and deployment to OpenTripPlanner.

## Quick Start

A pre-configured datatools instance can be lauched via Docker by running

```bash
cd docker
cp ../configurations/default/env.yml.tmp ../configurations/default/env.yml
docker compose pull datatools-server
docker compose up --build
```

from the datatools-ui directory. Datatools will then be running on port `9966`.

Compose builds the UI locally and pulls `ghcr.io/colombiatransit/datatools-server:dev`
for the API. Set `DATATOOLS_SERVER_IMAGE` in the shell or in `docker/.env` to
select another tag or an image digest. Sign in with `docker login ghcr.io` before
pulling if the package is private.

MongoDB and PostgreSQL are reachable by the Datatools server through a private
Compose network. The server also uses the default network to serve the UI and
connect to external services such as a separately hosted Keycloak instance.

Deployment functionality will not work, and persistence may only work in certain cases (look into Docker volumes for more info).

## Configuration

This repository serves as the front end UI for the Data Manager application. It must be run in conjunction with [datatools-server](https://github.com/conveyal/datatools-server)

### Server configuration volume

Compose stores the server configuration in the named volume `dt-server-config`.
On first startup, the `datatools-config` service copies files from
`docker/server/` into the volume. Datatools reads the configuration from the
volume at `/config`.

For an existing installation, keep your current files in `docker/server/`
for the first start so Compose can copy them into the new volume. To apply
later edits from that directory, run these commands from `docker/`:

```bash
docker compose run --rm --entrypoint cp datatools-config -a /config-source/. /config/
docker compose restart datatools-server
```

The copy command replaces files in the volume with the matching files from
the host directory.

### OpenID Connect sign-in

Configure OIDC on [datatools-server](https://github.com/ColombiaTransit/datatools-server#oidc-login-preview)
and serve the UI and `/api` on the same public origin. The UI reads the authentication
mode from `/api/manager/public/appinfo`. Store the OIDC client secret in the server
environment.

In OIDC mode, the browser uses the Datatools session cookie for API requests.
The sign-out button ends that session. The identity provider can still have an
active single sign-on session. Manage accounts at the identity provider and
assign project and feed access through the Datatools OIDC grants API.

## Documentation

View the [latest release documentation](http://data-tools-docs.ibi-transit.com/en/latest/) at ReadTheDocs for more info on deployment and development as well as a user guide.

Note: `dev` branch docs (which refer to the default `branch` and are more up-to-date and accurate for most users) can be found [here](http://data-tools-docs.ibi-transit.com/en/dev/).

## Getting in touch

We have a Gitter [space](https://matrix.to/#/#transit-data-tools:gitter.im) for the full TRANSIT-Data-Tools project where you can post questions and comments.

## Shoutouts 🙏

<img src="browserstack-logo-600x315.png" height="80" title="BrowserStack Logo" alt="BrowserStack Logo" />

Big thanks to [BrowserStack](https://www.browserstack.com) for letting the maintainers use their service to debug browser issues.

<img src="https://www.graphhopper.com/wp-content/uploads/2018/03/graphhopper-logo-small.png" height="25" alt="GraphHopper Logo" />

Street snapping powered by the <a href="https://www.graphhopper.com/">GraphHopper API</a>.
