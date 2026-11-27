# datatools-ui

[![Join the chat at https://matrix.to/#/#transit-data-tools:gitter.im](https://badges.gitter.im/repo.png)](https://matrix.to/#/#transit-data-tools:gitter.im)


> [!NOTE]  
> We are working on revamping our project, feed, and deployment manager. We are looking for input from the open source community. If you have questions, concerns, ideas, or would like to be part of the process, please join in the gitter.


The core application for IBI Group's TRANSIT-Data-Tools suite. This application provides GTFS editing, management, validation, and deployment to OpenTripPlanner.

## Quick Start

Datatools uses an existing Traefik instance to serve the UI and API on one HTTPS
hostname. Follow [the Traefik setup](#serve-datatools-through-an-existing-traefik-instance)
before starting the stack:

```bash
cd docker
docker compose pull
docker compose up -d
```

Open the HTTPS hostname configured in Traefik.

Compose pulls the UI and API images from GHCR. Set `DATATOOLS_UI_IMAGE` or
`DATATOOLS_SERVER_IMAGE` in the shell, in `docker/.env`, or in the Portainer
stack environment to select another tag or image digest. If a package is
private, authenticate to GHCR from Docker or add the registry credentials in
Portainer.

The **Build Datatools UI image** workflow publishes the default UI image from
`dev`. To use custom UI build settings, build your own image with
`docker/ui/Dockerfile`, publish it to your registry, then set `DATATOOLS_UI_IMAGE`
to that image. The Dockerfile reads the UI settings from
`configurations/default/env.yml` when present, or uses the bundled example.

MongoDB and PostgreSQL are reachable by the Datatools server through a private
Compose network. The server also uses the default network to serve the UI and
connect to external services such as a separately hosted Keycloak instance.

Compose uses MongoDB 8.0 and PostgreSQL 17 with their existing volume mounts.
Use a Datatools server image built from
[server PR #9](https://github.com/ColombiaTransit/datatools-server/pull/9) or a
later commit for MongoDB 8.0.

For an existing stack, check the running versions from `docker/` before
recreating either database container.

```bash
docker compose exec mongo mongod --version
docker compose exec postgres postgres --version
```

If either version differs from MongoDB 8.0.x or PostgreSQL 17.x, back up its
data and plan the migration before changing the image tag. See the
[MongoDB 8.0 upgrade instructions](https://www.mongodb.com/docs/manual/release-notes/8.0-upgrade-standalone/)
and the [PostgreSQL upgrade documentation](https://www.postgresql.org/docs/17/upgrading.html).

Deployment functionality will not work, and persistence may only work in certain cases (look into Docker volumes for more info).

## Configuration

This repository serves as the front end UI for the Data Manager application. It must be run in conjunction with [datatools-server](https://github.com/conveyal/datatools-server)

### Serve Datatools through an existing Traefik instance

The main Compose file registers the UI and API with Traefik's Docker provider.
The separate Traefik file-provider configuration defines HTTPS routing.
It sends `/api` and its subpaths to the server and other paths to the UI on the
same hostname.

1. Make sure Traefik has the Docker and file providers enabled and is connected
   to the existing external Docker network `treafik_default`.
2. Copy your `datatools.yml` into the Traefik file provider's dynamic
   configuration directory. Replace `datatools.example.org` in both rules,
   adjust `websecure` if your HTTPS entry point has a different name, and
   provide a certificate for the hostname through your Traefik TLS setup.
   If you use a named certificate resolver, set `tls.certResolver` on both routers.
3. Set `application.public_url` in `docker/server/server.yml` to the same HTTPS
   origin. Configure authentication before routing public traffic to Datatools.
   For Keycloak, see the [OIDC setup](#openid-connect-sign-in). If you already
   have a server configuration volume, apply the file change as described below.

Only the UI and API join the shared Traefik network, and neither publishes a
host port. The Docker provider can also generate routers from its `defaultRule`
for containers with service registration labels. Review that rule and the
entry points in your Traefik configuration.

### Server configuration volume

Compose stores the server configuration in the named volume `dt-server-config`.
On startup, `datatools-config` copies missing files from `/datatools-build/docker/server/`
inside the UI image. Datatools reads the volume at `/config`. Existing
`env.yml` and `server.yml` files in the volume are preserved. Custom UI
images built with this project's Dockerfile include these templates as well.

If you previously customized files under `docker/server/` on the host, copy
them into the volume to apply those edits. From `docker/`, on the Docker
host or using its Docker context with the same Compose project name as
the Portainer stack, run:

```bash
docker compose run --rm --no-deps -T --entrypoint /bin/sh datatools-config -ec \
  'umask 077; cat > /config/env.yml.new && mv /config/env.yml.new /config/env.yml' < server/env.yml
docker compose run --rm --no-deps -T --entrypoint /bin/sh datatools-config -ec \
  'umask 077; cat > /config/server.yml.new && mv /config/server.yml.new /config/server.yml' < server/server.yml
docker compose restart datatools-server
```

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
