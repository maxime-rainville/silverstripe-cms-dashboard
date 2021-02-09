silverstripe-cms-dashboard
==========================

Fetch dashboard data for Silverstripe CMS

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/silverstripe-cms-dashboard.svg)](https://npmjs.org/package/silverstripe-cms-dashboard)
[![Downloads/week](https://img.shields.io/npm/dw/silverstripe-cms-dashboard.svg)](https://npmjs.org/package/silverstripe-cms-dashboard)
[![License](https://img.shields.io/npm/l/silverstripe-cms-dashboard.svg)](https://github.com/maxime-rainville/silverstripe-cms-dashboard/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g silverstripe-cms-dashboard
$ silverstripe-cms-dashboard COMMAND
running command...
$ silverstripe-cms-dashboard (-v|--version|version)
silverstripe-cms-dashboard/0.0.0 linux-x64 node-v10.19.0
$ silverstripe-cms-dashboard --help [COMMAND]
USAGE
  $ silverstripe-cms-dashboard COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`silverstripe-cms-dashboard builds [COMMAND]`](#silverstripe-cms-dashboard-builds-command)
* [`silverstripe-cms-dashboard hello [FILE]`](#silverstripe-cms-dashboard-hello-file)
* [`silverstripe-cms-dashboard help [COMMAND]`](#silverstripe-cms-dashboard-help-command)
* [`silverstripe-cms-dashboard mergeup [FILE]`](#silverstripe-cms-dashboard-mergeup-file)
* [`silverstripe-cms-dashboard unrelease [FILE]`](#silverstripe-cms-dashboard-unrelease-file)

## `silverstripe-cms-dashboard builds [COMMAND]`

Fetch build status for silverstripe module

```
USAGE
  $ silverstripe-cms-dashboard builds [COMMAND]

OPTIONS
  -d, --domain=domain         [default: com] Travis domain to target: org or com
  -f, --failed                Only display failed build.
  -h, --help                  show CLI help
  -o, --output=(pretty|json)  [default: pretty] Control the output format
  -t, --token=token           Travis token
  -v, --version               show CLI version
  --verbose                   Print out debug statement.
```

_See code: [src/commands/builds.ts](https://github.com/maxime-rainville/silverstripe-cms-dashboard/blob/v0.0.0/src/commands/builds.ts)_

## `silverstripe-cms-dashboard hello [FILE]`

describe the command here

```
USAGE
  $ silverstripe-cms-dashboard hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ silverstripe-cms-dashboard hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/maxime-rainville/silverstripe-cms-dashboard/blob/v0.0.0/src/commands/hello.ts)_

## `silverstripe-cms-dashboard help [COMMAND]`

display help for silverstripe-cms-dashboard

```
USAGE
  $ silverstripe-cms-dashboard help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `silverstripe-cms-dashboard mergeup [FILE]`

Display Silverstripe module that have outstanding commits to merge up

```
USAGE
  $ silverstripe-cms-dashboard mergeup [FILE]

OPTIONS
  -c, --commits               Show commits
  -f, --filter=filter         Filter by module name
  -h, --help                  show CLI help
  -o, --output=(pretty|json)  [default: pretty] Control the output format
  -t, --token=token           GitHub Token
  -v, --version               show CLI version
  --needMergeOnly             Only show module and branches with outstanding commit to merge up.
  --supportedOnly             Limit results to supported module
  --throttle=throttle         [default: 5] Number of concurent API requests that can be run.
```

_See code: [src/commands/mergeup.ts](https://github.com/maxime-rainville/silverstripe-cms-dashboard/blob/v0.0.0/src/commands/mergeup.ts)_

## `silverstripe-cms-dashboard unrelease [FILE]`

Display Silverstripe module that have outstanding commits to release

```
USAGE
  $ silverstripe-cms-dashboard unrelease [FILE]

OPTIONS
  -c, --commits               Show commits
  -f, --filter=filter         Filter by module name
  -h, --help                  show CLI help
  -o, --output=(pretty|json)  [default: pretty] Control the output format
  -t, --token=token           GitHub Token
  -v, --version               show CLI version
  --needMergeOnly             Only show module and branches with outstanding commit to merge up.
  --supportedOnly             Limit results to supported module
  --throttle=throttle         [default: 5] Number of concurent API requests that can be run.
```

_See code: [src/commands/unrelease.ts](https://github.com/maxime-rainville/silverstripe-cms-dashboard/blob/v0.0.0/src/commands/unrelease.ts)_
<!-- commandsstop -->
