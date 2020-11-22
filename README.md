# Git Time Traveler

Go back in time to collect metrics about your Git repository.

:warning: This will force checkout your repos ! (but make a preventive stash just in case)

```sh
npm install
npm run start ../my-git-repo ./travel-stop-scripts/cloc.ts
```

- Temporal granularity : months
- Output format : whatever you want (provided samples use CSV)

Similar projects (if this one doesn't fit your needs):

- [GideonWolfe/CodeOverTime](https://github.com/GideonWolfe/CodeOverTime)
