#!/usr/bin/env node

// rename execute file, so yargs can show git-tag-bump
process.argv[1] = "git-tag-bump"
import * as yargs from "yargs";
import { BumpCommand } from "./commands/bump";
import { ConfigCommand } from "./commands/config";


let argv = yargs
    .command(BumpCommand)
    // .command(ConfigCommand)
    .usage("type git-tag-bump or gtb to bump the version number")
    .help()
    .argv