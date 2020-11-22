# Git Time Traveler

Go back in time to collect metrics about your Git repository.

:warning: This will force checkout your repos ! (but make a preventive stash just in case)

```sh
# Set it up
npm install
# Have look at the help
npm run start -- -h
# Run it on one of your Git repo to get lines of code count evolution during the last 6 months
npm run start -- --repo ../my-git-repo --script ./travel-stop-scripts/cloc.ts --stop-after 6
```

- Temporal granularity : months
- Output format : whatever you want (provided samples use CSV)

Similar projects (if this one doesn't fit your needs):

- [GideonWolfe/CodeOverTime](https://github.com/GideonWolfe/CodeOverTime)
