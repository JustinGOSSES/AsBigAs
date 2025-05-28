# AsBigAs

Kept seeing journalists write headlines about
upcoming asteroid as big as 12 girafes or 52 gorrilas,
so decided to make a little website to automate silly
size comparisons between upcoming asteroids or any asteroid
and arbitrary things.

An example of silly units of measurement in wild
- Asteroid in size of giraff https://twitter.com/mailonline/status/1503400626008596487?s=21

Original idea to make an API for this can be found
in the [idea.md](./idea.md) file.

## Status

Currently just a first draft written in COVID isolation
trying to figure out how much brain power I have back.

Page is live at https://justingosses.github.io/AsBigAs/

## Data

### Asteroid data

Pulls from the NEO API described on [https://API.nasa.gov](https://API.nasa.gov) to find the asteroid passing most
closely to earth today. The API URL used is something like
`https://api.nasa.gov/neo/rest/v1/feed?start_date=2025-05-28&end_date=2025-05-28&api_key=DEMO_KEY`
For specific astroid lookups, it uses a slightly different
format `https://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=DEMO_KEY`.
